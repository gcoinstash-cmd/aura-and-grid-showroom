/**
 * APEX-208 Cryptographic Audit Ledger
 * Append-only SHA-256 state ledger tracking every calibration cycle.
 * Strict Zero-Dollar Compliance: No dollar signs anywhere.
 */

import { AuditLedgerBlockData, SABRParameters } from './types.ts';

async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class ClientLedgerEngine {
  private chain: AuditLedgerBlockData[] = [];

  constructor() {
    this.initGenesis();
  }

  private async initGenesis(): Promise<void> {
    const genesisHash = '0'.repeat(64);
    const blockHash = await sha256Hex('APEX-208_GENESIS_CORE');
    this.chain = [
      {
        index: 0,
        timestampUtc: '2026-10-17T00:00:00.000Z',
        prevHash: genesisHash,
        blockHash: blockHash,
        underlying: 'GENESIS-CORE',
        spot: 0.0,
        sabrParams: { alpha: 0.0, beta: 0.7, rho: 0.0, nu: 0.0 },
        rmse: 0.0,
        arbitrageStatus: 'GENESIS_INITIALIZED'
      }
    ];
  }

  public getBlocks(): AuditLedgerBlockData[] {
    return [...this.chain];
  }

  public async recordCalibration(
    underlying: string,
    spot: number,
    params: SABRParameters,
    rmse: number,
    isArbitrageFree: boolean
  ): Promise<AuditLedgerBlockData> {
    const prev = this.chain[this.chain.length - 1];
    const timestamp = new Date().toISOString();
    const status = isArbitrageFree ? 'ARBITRAGE_FREE' : 'ARBITRAGE_VIOLATION';
    const nextIndex = prev ? prev.index + 1 : 1;
    const prevHash = prev ? prev.blockHash : '0'.repeat(64);

    const payload = JSON.stringify({
      index: nextIndex,
      timestampUtc: timestamp,
      prevHash: prevHash,
      underlying,
      spot,
      sabrParams: params,
      rmse,
      status
    });

    const blockHash = await sha256Hex(payload);

    const block: AuditLedgerBlockData = {
      index: nextIndex,
      timestampUtc: timestamp,
      prevHash: prevHash,
      blockHash: blockHash,
      underlying,
      spot,
      sabrParams: { ...params },
      rmse,
      arbitrageStatus: status
    };

    this.chain.push(block);
    return block;
  }

  public async verifyChainIntegrity(): Promise<{ isValid: boolean; errorDetail: string | null }> {
    for (let i = 1; i < this.chain.length; i++) {
      const curr = this.chain[i];
      const prev = this.chain[i - 1];

      if (curr.prevHash !== prev.blockHash) {
        return {
          isValid: false,
          errorDetail: 'Broken link at block ' + curr.index + ': prevHash does not match prior block hash'
        };
      }

      const payload = JSON.stringify({
        index: curr.index,
        timestampUtc: curr.timestampUtc,
        prevHash: curr.prevHash,
        underlying: curr.underlying,
        spot: curr.spot,
        sabrParams: curr.sabrParams,
        rmse: curr.rmse,
        status: curr.arbitrageStatus
      });

      const recomputed = await sha256Hex(payload);
      if (recomputed !== curr.blockHash) {
        return {
          isValid: false,
          errorDetail: 'Cryptographic hash mismatch at block ' + curr.index
        };
      }
    }

    return { isValid: true, errorDetail: null };
  }
}
