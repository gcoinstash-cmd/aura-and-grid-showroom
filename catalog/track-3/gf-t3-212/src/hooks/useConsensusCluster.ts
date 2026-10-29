import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClusterNodeInfo,
  ConsensusPhase,
  ConsensusMode,
  LedgerBlock,
  MerkleKV,
  ConsensusRoundMessage,
  ChaosActionLog
} from '../types/consensus';
import { sha256Sync } from '../utils/crypto';

const INITIAL_NODES: ClusterNodeInfo[] = [
  {
    id: 'VALIDATOR-NODE-ALPHA',
    label: 'NODE-ALPHA (LEADER)',
    role: 'LEADER',
    stakeUnits: 25000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-BRAVO',
    label: 'NODE-BRAVO (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 25000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-CHARLIE',
    label: 'NODE-CHARLIE (BYZANTINE-EQUIVOCATOR)',
    role: 'FOLLOWER',
    stakeUnits: 20000,
    isByzantine: true,
    isPartitioned: false,
    committedHeight: 1401,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18400,
    votesCast: 1399
  },
  {
    id: 'VALIDATOR-NODE-DELTA',
    label: 'NODE-DELTA (NETWORK-PARTITIONED)',
    role: 'FOLLOWER',
    stakeUnits: 15000,
    isByzantine: false,
    isPartitioned: true,
    committedHeight: 1398,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 12100,
    votesCast: 1398
  },
  {
    id: 'VALIDATOR-NODE-ECHO',
    label: 'NODE-ECHO (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 15000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-FOXTROT',
    label: 'NODE-FOXTROT (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 15000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-GOLF',
    label: 'NODE-GOLF (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 10000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-HOTEL',
    label: 'NODE-HOTEL (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 10000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-INDIA',
    label: 'NODE-INDIA (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 10000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  },
  {
    id: 'VALIDATOR-NODE-JULIET',
    label: 'NODE-JULIET (HONEST-FOLLOWER)',
    role: 'FOLLOWER',
    stakeUnits: 10000,
    isByzantine: false,
    isPartitioned: false,
    committedHeight: 1402,
    lastPreparedDigest: '',
    lastCommitDigest: '',
    uptimeSeconds: 18420,
    votesCast: 1402
  }
];

const INITIAL_STATE_KV: MerkleKV[] = [
  { key: 'ACCOUNT_SYS_ROOT', value: '{"balanceUnits": 1000000, "nonce": 42}', leafHash: '', lastUpdatedBlock: 1402 },
  { key: 'VALIDATOR_REGISTRY', value: '{"activeNodes": 10, "quorum": 7, "epoch": 14}', leafHash: '', lastUpdatedBlock: 1402 },
  { key: 'CONSENSUS_POLICY', value: '{"scheme": "PBFT_3PHASE", "timeoutMs": 3500}', leafHash: '', lastUpdatedBlock: 1400 },
  { key: 'ORACLE_PRICE_INDEX', value: '{"medianTick": 1420.5, "dispersionUnits": 0.04}', leafHash: '', lastUpdatedBlock: 1401 },
  { key: 'GAS_SCHEDULER_CFG', value: '{"baseExecutionUnits": 21000, "maxBlockGas": 5000000}', leafHash: '', lastUpdatedBlock: 1395 },
  { key: 'IDENTITY_ANCHOR_PROOF', value: '{"merkleDepth": 8, "fipsStandard": "180-4"}', leafHash: '', lastUpdatedBlock: 1402 }
];

export function computeMerkleRoot(kvs: MerkleKV[]): string {
  if (kvs.length === 0) return sha256Sync('EMPTY_ROOT');
  const leaves = kvs
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(item => sha256Sync(item.key + ':' + item.value));

  let currentLayer = leaves;
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(sha256Sync(currentLayer[i] + currentLayer[i + 1]));
      } else {
        nextLayer.push(sha256Sync(currentLayer[i] + currentLayer[i]));
      }
    }
    currentLayer = nextLayer;
  }
  return currentLayer[0];
}

export function useConsensusCluster() {
  const [nodes, setNodes] = useState<ClusterNodeInfo[]>(INITIAL_NODES);
  const [currentView, setCurrentView] = useState<number>(4);
  const [sequenceHeight, setSequenceHeight] = useState<number>(1402);
  const [consensusMode, setConsensusMode] = useState<ConsensusMode>('PBFT');
  const [phase, setPhase] = useState<ConsensusPhase>('IDLE');
  const [roundLatencyMs, setRoundLatencyMs] = useState<number>(14.2);
  const [stateKVs, setStateKVs] = useState<MerkleKV[]>(() => {
    return INITIAL_STATE_KV.map(item => ({
      ...item,
      leafHash: sha256Sync(item.key + ':' + item.value)
    }));
  });
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [messages, setMessages] = useState<ConsensusRoundMessage[]>([]);
  const [chaosLogs, setChaosLogs] = useState<ChaosActionLog[]>([]);
  const [isAutoProposing, setIsAutoProposing] = useState<boolean>(false);
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState<number | null>(null);

  const autoProposeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute canonical Merkle root
  const canonicalStateRoot = computeMerkleRoot(stateKVs);

  // PBFT mathematical derivations: n >= 3f + 1
  const totalNodes = nodes.length;
  const byzantineToleranceF = Math.floor((totalNodes - 1) / 3); // 3 for n=10
  const requiredQuorum = 2 * byzantineToleranceF + 1; // 7 for n=10
  const honestOnlineNodes = nodes.filter(n => !n.isPartitioned && !n.isByzantine);
  const activeLeader = nodes.find(n => n.role === 'LEADER') || nodes[0];

  // Initialize bootstrap blocks
  useEffect(() => {
    const genesisRoot = computeMerkleRoot(INITIAL_STATE_KV);
    const b1401Hash = sha256Sync('1401:00000000000000000000000000000000:' + genesisRoot);
    const b1402Hash = sha256Sync('1402:' + b1401Hash + ':' + genesisRoot);

    const initialBlocks: LedgerBlock[] = [
      {
        blockNumber: 1401,
        viewTerm: 4,
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        stateRoot: genesisRoot,
        operations: { action: 'EPOCH_ROLLOVER', validatorSetCount: 10 },
        proposerNode: 'VALIDATOR-NODE-ALPHA',
        timestampMs: Date.now() - 45000,
        commitSignatures: [
          'VALIDATOR-NODE-ALPHA', 'VALIDATOR-NODE-BRAVO', 'VALIDATOR-NODE-ECHO',
          'VALIDATOR-NODE-FOXTROT', 'VALIDATOR-NODE-GOLF', 'VALIDATOR-NODE-HOTEL', 'VALIDATOR-NODE-JULIET'
        ].map(n => sha256Sync(n + ':1401')),
        blockHash: b1401Hash,
        gasExecutionUnits: 21000
      },
      {
        blockNumber: 1402,
        viewTerm: 4,
        previousHash: b1401Hash,
        stateRoot: genesisRoot,
        operations: { action: 'STATE_TRANSITION', payloadDigest: '0x99A821E' },
        proposerNode: 'VALIDATOR-NODE-ALPHA',
        timestampMs: Date.now() - 15000,
        commitSignatures: [
          'VALIDATOR-NODE-ALPHA', 'VALIDATOR-NODE-BRAVO', 'VALIDATOR-NODE-ECHO',
          'VALIDATOR-NODE-FOXTROT', 'VALIDATOR-NODE-GOLF', 'VALIDATOR-NODE-HOTEL', 'VALIDATOR-NODE-INDIA'
        ].map(n => sha256Sync(n + ':1402')),
        blockHash: b1402Hash,
        gasExecutionUnits: 21000
      }
    ];
    setLedger(initialBlocks);
  }, []);

  // Execute full 3-phase PBFT consensus round
  const executeConsensusRound = useCallback((customOp?: Record<string, unknown>) => {
    const startTime = performance.now();
    const op = customOp || {
      batchId: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
      action: 'ATOMIC_STATE_MUTATION',
      gasExecutionUnits: 21000,
      timestamp: Date.now()
    };

    const nextSeq = sequenceHeight + 1;
    const leader = nodes.find(n => n.role === 'LEADER') || nodes[0];
    const prevBlockHash = ledger.length > 0 ? ledger[ledger.length - 1].blockHash : '0'.repeat(64);

    // Phase 1: PRE_PREPARE
    setPhase('PRE_PREPARE');
    const proposedBlockBody = [nextSeq, currentView, prevBlockHash, canonicalStateRoot].join(':');
    const proposedBlockHash = sha256Sync(proposedBlockBody);

    const prePreparePackets: ConsensusRoundMessage[] = nodes.map(n => {
      let status: 'DELIVERED' | 'DROPPED_PARTITION' | 'REJECTED_BYZANTINE' = 'DELIVERED';
      if (n.isPartitioned) {
        status = 'DROPPED_PARTITION';
      }
      return {
        id: 'MSG-' + Math.random().toString(36).substring(2, 9),
        phase: 'PRE_PREPARE',
        viewTerm: currentView,
        sequenceHeight: nextSeq,
        senderNodeId: leader.id,
        targetNodeId: n.id,
        digest: proposedBlockHash,
        signature: sha256Sync(leader.id + ':PRE_PREPARE:' + proposedBlockHash),
        timestampMs: Date.now(),
        status
      };
    });

    setMessages(prev => [...prePreparePackets, ...prev].slice(0, 40));

    // Phase 2: PREPARE
    setTimeout(() => {
      setPhase('PREPARE');
      const preparePackets: ConsensusRoundMessage[] = [];
      const preparingNodes: string[] = [];

      nodes.forEach(sender => {
        if (sender.isPartitioned) return;
        if (sender.isByzantine) {
          // Byzantine node equivocation: broadcasts forged hash
          const byzantineConflictingHash = sha256Sync(proposedBlockHash + ':BYZANTINE_SPLIT');
          preparePackets.push({
            id: 'MSG-' + Math.random().toString(36).substring(2, 9),
            phase: 'PREPARE',
            viewTerm: currentView,
            sequenceHeight: nextSeq,
            senderNodeId: sender.id,
            targetNodeId: 'BROADCAST_ALL',
            digest: byzantineConflictingHash,
            signature: sha256Sync(sender.id + ':FORGED_PREPARE'),
            timestampMs: Date.now(),
            status: 'REJECTED_BYZANTINE'
          });
          return;
        }

        // Honest node generates valid prepare vote
        preparingNodes.push(sender.id);
        preparePackets.push({
          id: 'MSG-' + Math.random().toString(36).substring(2, 9),
          phase: 'PREPARE',
          viewTerm: currentView,
          sequenceHeight: nextSeq,
          senderNodeId: sender.id,
          targetNodeId: 'BROADCAST_ALL',
          digest: proposedBlockHash,
          signature: sha256Sync(sender.id + ':PREPARE:' + proposedBlockHash),
          timestampMs: Date.now(),
          status: 'DELIVERED'
        });
      });

      setMessages(prev => [...preparePackets, ...prev].slice(0, 40));

      // Quorum Check: >= 2f + 1
      const prepareQuorumMet = preparingNodes.length >= requiredQuorum;

      // Phase 3: COMMIT
      setTimeout(() => {
        setPhase('COMMIT');
        const commitSignatures: string[] = [];
        const commitPackets: ConsensusRoundMessage[] = [];

        if (prepareQuorumMet) {
          nodes.forEach(sender => {
            if (sender.isPartitioned || sender.isByzantine) return;
            const sig = sha256Sync(sender.id + ':COMMIT:' + proposedBlockHash);
            commitSignatures.push(sig);
            commitPackets.push({
              id: 'MSG-' + Math.random().toString(36).substring(2, 9),
              phase: 'COMMIT',
              viewTerm: currentView,
              sequenceHeight: nextSeq,
              senderNodeId: sender.id,
              targetNodeId: 'LEDGER_INGEST',
              digest: proposedBlockHash,
              signature: sig,
              timestampMs: Date.now(),
              status: 'DELIVERED'
            });
          });
        }

        setMessages(prev => [...commitPackets, ...prev].slice(0, 40));

        const commitQuorumMet = commitSignatures.length >= requiredQuorum;

        setTimeout(() => {
          const elapsed = Number((performance.now() - startTime + 9.4).toFixed(1));
          setRoundLatencyMs(elapsed);

          if (commitQuorumMet) {
            // Commit block to ledger
            const newBlock: LedgerBlock = {
              blockNumber: nextSeq,
              viewTerm: currentView,
              previousHash: prevBlockHash,
              stateRoot: canonicalStateRoot,
              operations: op,
              proposerNode: leader.id,
              timestampMs: Date.now(),
              commitSignatures,
              blockHash: proposedBlockHash,
              gasExecutionUnits: 21000
            };

            setLedger(prev => [...prev, newBlock]);
            setSequenceHeight(nextSeq);

            // Update node commit counters
            setNodes(prev =>
              prev.map(n => {
                if (!n.isPartitioned && !n.isByzantine) {
                  return {
                    ...n,
                    committedHeight: nextSeq,
                    votesCast: n.votesCast + 1,
                    lastCommitDigest: proposedBlockHash
                  };
                }
                return n;
              })
            );

            setPhase('FINALIZED');
          } else {
            // Quorum failure - Safety preserved
            setPhase('IDLE');
            setChaosLogs(prev => [
              {
                id: 'CHAOS-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: 'QUORUM_DEFICIT_TRIGGERED',
                target: 'ROUND_SEQ_' + nextSeq,
                impact: 'Consensus halted safely to preserve safety invariant: ' + commitSignatures.length + ' / ' + requiredQuorum + ' votes',
                invariantStatus: 'SAFE'
              },
              ...prev
            ]);
          }

          setTimeout(() => {
            setPhase('IDLE');
          }, 800);
        }, 300);
      }, 350);
    }, 350);
  }, [canonicalStateRoot, currentView, ledger, nodes, requiredQuorum, sequenceHeight]);

  // View Change Trigger
  const triggerViewChange = useCallback(() => {
    const nextView = currentView + 1;
    setCurrentView(nextView);

    // Deterministic round-robin leader assignment: (view) % totalNodes
    const leaderIndex = nextView % nodes.length;
    const newLeader = nodes[leaderIndex];

    setNodes(prev =>
      prev.map((n, idx) => ({
        ...n,
        role: idx === leaderIndex ? 'LEADER' : 'FOLLOWER'
      }))
    );

    setChaosLogs(prev => [
      {
        id: 'CHAOS-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: 'PBFT_VIEW_CHANGE',
        target: newLeader.id,
        impact: 'Term advanced from View ' + currentView + ' to ' + nextView + '. Elected ' + newLeader.id + ' as primary proposer.',
        invariantStatus: 'RECOVERED'
      },
      ...prev
    ]);
  }, [currentView, nodes]);

  // Mode Switch (PBFT <-> RAFT)
  const toggleConsensusMode = useCallback(() => {
    setConsensusMode(prev => (prev === 'PBFT' ? 'RAFT' : 'PBFT'));
    setChaosLogs(prev => [
      {
        id: 'CHAOS-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: 'CONSENSUS_SCHEME_SWITCH',
        target: consensusMode === 'PBFT' ? 'RAFT_MODE' : 'PBFT_MODE',
        impact: 'Reconfigured consensus protocol to ' + (consensusMode === 'PBFT' ? 'Raft Heartbeat' : 'PBFT 3-Phase State Machine'),
        invariantStatus: 'SAFE'
      },
      ...prev
    ]);
  }, [consensusMode]);

  // Chaos: Equivocation toggle
  const toggleByzantineNode = useCallback((nodeId: string) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === nodeId) {
          const nextState = !n.isByzantine;
          return { ...n, isByzantine: nextState };
        }
        return n;
      })
    );
  }, []);

  // Chaos: Partition toggle
  const togglePartitionNode = useCallback((nodeId: string) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === nodeId) {
          const nextState = !n.isPartitioned;
          return { ...n, isPartitioned: nextState };
        }
        return n;
      })
    );
  }, []);

  // Chaos Action: Inject 33% Network Partition (f nodes)
  const injectThirdPartition = useCallback(() => {
    setNodes(prev =>
      prev.map((n, idx) => {
        if (idx < 3) {
          return { ...n, isPartitioned: true };
        }
        return { ...n, isPartitioned: false };
      })
    );
    setChaosLogs(prev => [
      {
        id: 'CHAOS-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: 'INJECT_33_PCT_PARTITION',
        target: 'CLUSTER_SUBSET_3_NODES',
        impact: 'Simulated 30% link partition across 3 validator nodes. Quorum threshold remaining: 7/10 nodes.',
        invariantStatus: 'DEGRADED'
      },
      ...prev
    ]);
  }, []);

  // Chaos Action: Resynchronize all nodes
  const resynchronizeAll = useCallback(() => {
    setNodes(prev =>
      prev.map(n => ({
        ...n,
        isPartitioned: false,
        isByzantine: false,
        committedHeight: sequenceHeight
      }))
    );
    setTamperedBlockIndex(null);
    setChaosLogs(prev => [
      {
        id: 'CHAOS-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: 'RESYNCHRONIZE_ALL_NODES',
        target: 'FULL_CLUSTER_MESH',
        impact: 'All network partitions dissolved and Byzantine flags cleared. Restored 100% honest cluster quorum.',
        invariantStatus: 'RECOVERED'
      },
      ...prev
    ]);
  }, [sequenceHeight]);

  // State Trie Mutation
  const updateStateKV = useCallback((key: string, value: string) => {
    const nextLeafHash = sha256Sync(key + ':' + value);
    setStateKVs(prev => {
      const existingIdx = prev.findIndex(item => item.key === key);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          key,
          value,
          leafHash: nextLeafHash,
          lastUpdatedBlock: sequenceHeight
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            key,
            value,
            leafHash: nextLeafHash,
            lastUpdatedBlock: sequenceHeight
          }
        ];
      }
    });
  }, [sequenceHeight]);

  // Tamper detection simulation
  const simulateTamper = useCallback((blockIndex: number) => {
    setTamperedBlockIndex(blockIndex);
    setChaosLogs(prev => [
      {
        id: 'CHAOS-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: 'CRYPTOGRAPHIC_TAMPER_INJECTION',
        target: 'BLOCK_' + (ledger[blockIndex]?.blockNumber || blockIndex),
        impact: 'Artificially altered byte payload of historic block. SHA-256 chain immutability check will fail.',
        invariantStatus: 'DEGRADED'
      },
      ...prev
    ]);
  }, [ledger]);

  // Interactive 3-Phase Step Debugger: advances by one stage manually
  const stepPhaseConsensus = useCallback(() => {
    const leader = nodes.find(n => n.role === 'LEADER') || nodes[0];
    const prevBlockHash = ledger.length > 0 ? ledger[ledger.length - 1].blockHash : '0'.repeat(64);
    const nextSeq = sequenceHeight + 1;
    const proposedBlockBody = [nextSeq, currentView, prevBlockHash, canonicalStateRoot].join(':');
    const proposedBlockHash = sha256Sync(proposedBlockBody);

    if (phase === 'IDLE' || phase === 'FINALIZED') {
      setPhase('PRE_PREPARE');
      setNodes(prev =>
        prev.map(n => {
          if (n.id === leader.id) {
            return { ...n, phaseBadge: 'PROPOSING' };
          }
          if (n.isPartitioned) {
            return { ...n, phaseBadge: 'PARTITIONED' };
          }
          if (n.isByzantine) {
            return { ...n, phaseBadge: 'EQUIVOCATING' };
          }
          return { ...n, phaseBadge: 'PRE_PREPARE RCVD' };
        })
      );
      const prePrepareMsg: ConsensusRoundMessage = {
        id: 'MSG-' + Math.random().toString(36).substring(2, 9),
        phase: 'PRE_PREPARE',
        viewTerm: currentView,
        sequenceHeight: nextSeq,
        senderNodeId: leader.id,
        targetNodeId: 'BROADCAST_ALL',
        digest: proposedBlockHash,
        signature: sha256Sync(leader.id + ':PRE_PREPARE:' + proposedBlockHash),
        timestampMs: Date.now(),
        status: 'DELIVERED'
      };
      setMessages(prev => [prePrepareMsg, ...prev].slice(0, 40));
    } else if (phase === 'PRE_PREPARE') {
      setPhase('PREPARE');
      setNodes(prev =>
        prev.map(n => {
          if (n.isPartitioned) {
            return { ...n, phaseBadge: 'NO VOTE (OFFLINE)' };
          }
          if (n.isByzantine) {
            return { ...n, phaseBadge: 'FORK DETECTED' };
          }
          return { ...n, phaseBadge: 'PREPARE VOTED (2f+1)' };
        })
      );
      const prepareMsg: ConsensusRoundMessage = {
        id: 'MSG-' + Math.random().toString(36).substring(2, 9),
        phase: 'PREPARE',
        viewTerm: currentView,
        sequenceHeight: nextSeq,
        senderNodeId: 'HONEST_VALIDATORS',
        targetNodeId: 'BROADCAST_ALL',
        digest: proposedBlockHash,
        signature: sha256Sync('QUORUM_PREPARE:' + proposedBlockHash),
        timestampMs: Date.now(),
        status: 'DELIVERED'
      };
      setMessages(prev => [prepareMsg, ...prev].slice(0, 40));
    } else if (phase === 'PREPARE') {
      setPhase('COMMIT');
      setNodes(prev =>
        prev.map(n => {
          if (n.isPartitioned) {
            return { ...n, phaseBadge: 'NO SIG (OFFLINE)' };
          }
          if (n.isByzantine) {
            return { ...n, phaseBadge: 'VOTE REJECTED' };
          }
          return { ...n, phaseBadge: 'COMMIT SIGNED' };
        })
      );
      const commitMsg: ConsensusRoundMessage = {
        id: 'MSG-' + Math.random().toString(36).substring(2, 9),
        phase: 'COMMIT',
        viewTerm: currentView,
        sequenceHeight: nextSeq,
        senderNodeId: 'HONEST_VALIDATORS',
        targetNodeId: 'LEDGER_INGEST',
        digest: proposedBlockHash,
        signature: sha256Sync('QUORUM_COMMIT:' + proposedBlockHash),
        timestampMs: Date.now(),
        status: 'DELIVERED'
      };
      setMessages(prev => [commitMsg, ...prev].slice(0, 40));
    } else if (phase === 'COMMIT') {
      const commitSignatures = nodes
        .filter(n => !n.isPartitioned && !n.isByzantine)
        .map(n => sha256Sync(n.id + ':COMMIT:' + proposedBlockHash));

      if (commitSignatures.length >= requiredQuorum) {
        const newBlock: LedgerBlock = {
          blockNumber: nextSeq,
          viewTerm: currentView,
          previousHash: prevBlockHash,
          stateRoot: canonicalStateRoot,
          operations: { action: 'STEP_DEBUG_TRANSITION', stepId: 'STEP-' + Date.now() },
          proposerNode: leader.id,
          timestampMs: Date.now(),
          commitSignatures,
          blockHash: proposedBlockHash,
          gasExecutionUnits: 21000
        };

        setLedger(prev => [...prev, newBlock]);
        setSequenceHeight(nextSeq);
        setPhase('FINALIZED');
        setNodes(prev =>
          prev.map(n => {
            if (!n.isPartitioned && !n.isByzantine) {
              return {
                ...n,
                committedHeight: nextSeq,
                votesCast: n.votesCast + 1,
                lastCommitDigest: proposedBlockHash,
                phaseBadge: 'COMMITTED #' + nextSeq
              };
            }
            return { ...n, phaseBadge: 'DESYNCED' };
          })
        );
        setTimeout(() => {
          setPhase('IDLE');
          setNodes(prev => prev.map(n => ({ ...n, phaseBadge: undefined })));
        }, 1200);
      } else {
        setPhase('IDLE');
        setNodes(prev => prev.map(n => ({ ...n, phaseBadge: undefined })));
      }
    }
  }, [canonicalStateRoot, currentView, ledger, nodes, phase, requiredQuorum, sequenceHeight]);

  // Auto-propose loop toggle
  const toggleAutoPropose = useCallback(() => {
    setIsAutoProposing(prev => !prev);
  }, []);

  useEffect(() => {
    if (isAutoProposing) {
      autoProposeTimerRef.current = setInterval(() => {
        executeConsensusRound();
      }, 2400);
    } else {
      if (autoProposeTimerRef.current) {
        clearInterval(autoProposeTimerRef.current);
        autoProposeTimerRef.current = null;
      }
    }
    return () => {
      if (autoProposeTimerRef.current) {
        clearInterval(autoProposeTimerRef.current);
      }
    };
  }, [isAutoProposing, executeConsensusRound]);

  return {
    nodes,
    currentView,
    sequenceHeight,
    consensusMode,
    phase,
    roundLatencyMs,
    stateKVs,
    canonicalStateRoot,
    ledger,
    messages,
    chaosLogs,
    isAutoProposing,
    tamperedBlockIndex,
    totalNodes,
    byzantineToleranceF,
    requiredQuorum,
    honestOnlineNodes,
    activeLeader,
    executeConsensusRound,
    stepPhaseConsensus,
    triggerViewChange,
    toggleConsensusMode,
    toggleByzantineNode,
    togglePartitionNode,
    injectThirdPartition,
    resynchronizeAll,
    updateStateKV,
    simulateTamper,
    toggleAutoPropose
  };
}
