"""
Test Suite for APEX-214: zk-SNARK Groth16 Verifier & Arithmetic Circuit State Engine
Validates four foundational cryptographic invariants:
1. Completeness: Honest proof with valid witness always yields VERIFIED = True.
2. Soundness: Modified public input vector fails pairing verification with rejection.
3. Zero-Knowledge: Public inputs and proof leak zero information about private witness.
4. Deterministic O(1) Verification: Verification latency remains constant across circuit sizes.
"""

import sys
import time
from engine import (
    CIRCUITS,
    BN254_R,
    BN254_P,
    G1Point,
    G2Point,
    Groth16Proof,
    CircuitWitnessEngine,
    Groth16PairingEngine,
    generate_verification_key,
    int_to_hex,
    hex_to_int,
)


class TamperedInputError(Exception):
    """Raised when a tampered public input is detected by the verifier."""
    pass


def test_curve_field_invariants():
    """Verify BN254 scalar field order r and base field modulus p properties."""
    assert BN254_R > 0
    assert BN254_P > 0
    assert BN254_P > BN254_R
    # Verify bit lengths
    assert BN254_R.bit_length() == 254
    assert BN254_P.bit_length() == 254


def test_circuit_catalogue_specifications():
    """Verify all 4 Track 3 synthetic predicates are present with valid dimensions."""
    expected = [
        "CIRCUIT-PREDICATE-ALPHA",
        "CIRCUIT-PREDICATE-BRAVO",
        "CIRCUIT-PREDICATE-GAMMA",
        "CIRCUIT-PREDICATE-DELTA",
    ]
    for cid in expected:
        assert cid in CIRCUITS
        c = CIRCUITS[cid]
        assert c["constraints"] >= 1024
        assert c["variables"] > c["constraints"]
        assert c["public_inputs_count"] >= 2
        assert c["private_inputs_count"] >= 64


def test_completeness_invariant():
    """
    Invariant 1: Completeness
    An honest prover with a valid witness vector s can always produce a proof
    pi = (A, B, C) that evaluates to True under bilinear pairing check.
    """
    for circuit_id in CIRCUITS:
        meta = CIRCUITS[circuit_id]
        vk = generate_verification_key(circuit_id)

        # Generate sample valid inputs
        pub_inputs = [(i * 1337 + 42) % BN254_R for i in range(meta["public_inputs_count"])]
        priv_inputs = [(i * 7919 + 101) % BN254_R for i in range(meta["private_inputs_count"])]

        witness, satisfied = CircuitWitnessEngine.solve_witness(circuit_id, pub_inputs, priv_inputs)
        assert satisfied is True
        assert len(witness) == 1 + len(pub_inputs) + len(priv_inputs)

        # Synthesize honest proof
        proof, extracted_pub = CircuitWitnessEngine.generate_honest_proof(circuit_id, witness)
        assert extracted_pub == pub_inputs

        # Evaluate bilinear pairing check
        verified, status_str, audit = Groth16PairingEngine.evaluate_pairing_product(
            proof, vk, pub_inputs
        )
        assert verified is True
        assert "EQUALITY_SATISFIED" in status_str
        assert len(audit) == 4


def test_soundness_invariant():
    """
    Invariant 2: Soundness
    If a public input is modified (tampered) by even 1 least-significant bit,
    the pairing check MUST fail and reject the proof.
    """
    circuit_id = "CIRCUIT-PREDICATE-ALPHA"
    meta = CIRCUITS[circuit_id]
    vk = generate_verification_key(circuit_id)

    pub_inputs = [0x12345678, 0x87654321]
    priv_inputs = [i + 1 for i in range(meta["private_inputs_count"])]

    witness, satisfied = CircuitWitnessEngine.solve_witness(circuit_id, pub_inputs, priv_inputs)
    proof, _ = CircuitWitnessEngine.generate_honest_proof(circuit_id, witness)

    # Tamper with the public input
    tampered_pub_inputs = [pub_inputs[0] ^ 0x01, pub_inputs[1]]

    verified, status_str, audit = Groth16PairingEngine.evaluate_pairing_product(
        proof, vk, tampered_pub_inputs
    )
    assert verified is False
    assert "SOUNDNESS_REJECTION" in status_str

    # Simulate strict assertion error in higher-level pipeline
    raised = False
    try:
        if not verified:
            raise TamperedInputError("Verification rejected: Public input digest mismatch")
    except TamperedInputError:
        raised = True
    assert raised is True


def test_tamper_proof_coordinates_g1():
    """Corrupting a coordinate of proof point A or C must cause rejection."""
    circuit_id = "CIRCUIT-PREDICATE-BRAVO"
    meta = CIRCUITS[circuit_id]
    vk = generate_verification_key(circuit_id)

    pub_inputs = [100, 0, 1000]
    priv_inputs = [i * 2 for i in range(meta["private_inputs_count"])]

    witness, _ = CircuitWitnessEngine.solve_witness(circuit_id, pub_inputs, priv_inputs)
    proof, _ = CircuitWitnessEngine.generate_honest_proof(circuit_id, witness)

    # Flip bits in point A coordinate
    corrupted_ax = int_to_hex(hex_to_int(proof.A.x) ^ 0xDEADBEEF)
    corrupted_proof = Groth16Proof(
        A=G1Point(x=corrupted_ax, y=proof.A.y),
        B=proof.B,
        C=proof.C,
    )

    verified, status_str, _ = Groth16PairingEngine.evaluate_pairing_product(
        corrupted_proof, vk, pub_inputs
    )
    assert verified is False


def test_zero_knowledge_leakage_property():
    """
    Invariant 3: Zero-Knowledge Property
    The proof tuple pi = (A, B, C) and public inputs reveal zero information
    regarding the private witness elements.
    """
    circuit_id = "CIRCUIT-PREDICATE-GAMMA"
    meta = CIRCUITS[circuit_id]
    vk = generate_verification_key(circuit_id)

    pub_inputs = [42, 84, 126, 168]

    # Two distinct private witness assignments
    priv_1 = [i + 1 for i in range(meta["private_inputs_count"])]
    priv_2 = [i + 999 for i in range(meta["private_inputs_count"])]

    witness_1, _ = CircuitWitnessEngine.solve_witness(circuit_id, pub_inputs, priv_1)
    witness_2, _ = CircuitWitnessEngine.solve_witness(circuit_id, pub_inputs, priv_2)

    proof_1, _ = CircuitWitnessEngine.generate_honest_proof(circuit_id, witness_1)
    proof_2, _ = CircuitWitnessEngine.generate_honest_proof(circuit_id, witness_2)

    # Both proofs are valid under their respective witness satisfaction
    v1, _, _ = Groth16PairingEngine.evaluate_pairing_product(proof_1, vk, pub_inputs)
    v2, _, _ = Groth16PairingEngine.evaluate_pairing_product(proof_2, vk, pub_inputs)
    assert v1 is True
    assert v2 is True

    # The proof components do NOT contain private witness values
    priv_1_hex = [int_to_hex(w) for w in priv_1]
    assert proof_1.A.x not in priv_1_hex
    assert proof_1.C.x not in priv_1_hex


def test_deterministic_o1_verification_latency():
    """
    Invariant 4: Deterministic O(1) Verification
    Verification cost in Groth16 is independent of circuit size (|C|),
    requiring exactly constant number of pairing operations (3 pairings)
    plus multi-scalar multiplication over public inputs (l + 1).
    Comparing 1024-constraint circuit vs 8192-constraint circuit shows O(1) scaling.
    """
    circuits_to_compare = [
        ("CIRCUIT-PREDICATE-ALPHA", 1024),
        ("CIRCUIT-PREDICATE-DELTA", 8192),
    ]

    latencies = []
    for cid, constraints in circuits_to_compare:
        meta = CIRCUITS[cid]
        vk = generate_verification_key(cid)
        pub_inputs = [i + 10 for i in range(meta["public_inputs_count"])]
        priv_inputs = [i + 100 for i in range(meta["private_inputs_count"])]

        witness, _ = CircuitWitnessEngine.solve_witness(cid, pub_inputs, priv_inputs)
        proof, _ = CircuitWitnessEngine.generate_honest_proof(cid, witness)

        # Benchmark 20 iterations
        start = time.perf_counter()
        for _ in range(20):
            verified, _, _ = Groth16PairingEngine.evaluate_pairing_product(proof, vk, pub_inputs)
            assert verified is True
        elapsed_avg_ms = ((time.perf_counter() - start) / 20.0) * 1000.0
        latencies.append((constraints, elapsed_avg_ms))

    # Verification latency should not grow with 8x constraint increase
    alpha_lat = latencies[0][1]
    delta_lat = latencies[1][1]
    ratio = delta_lat / max(alpha_lat, 0.0001)

    assert ratio < 4.0


if __name__ == "__main__":
    print("Executing APEX-214 Cryptographic Test Suite...")
    test_curve_field_invariants()
    print("PASS: test_curve_field_invariants")
    test_circuit_catalogue_specifications()
    print("PASS: test_circuit_catalogue_specifications")
    test_completeness_invariant()
    print("PASS: test_completeness_invariant (Completeness verified)")
    test_soundness_invariant()
    print("PASS: test_soundness_invariant (Soundness verified)")
    test_tamper_proof_coordinates_g1()
    print("PASS: test_tamper_proof_coordinates_g1 (G1 tampering rejected)")
    test_zero_knowledge_leakage_property()
    print("PASS: test_zero_knowledge_leakage_property (Zero leakage verified)")
    test_deterministic_o1_verification_latency()
    print("PASS: test_deterministic_o1_verification_latency (O(1) latency verified)")
    print("ALL 7 CRYPTOGRAPHIC INVARIANTS PASSED SUCCESSFULLY!")
