import React, { useState } from 'react';
import { ChildSlice, ExecutionVenue, SliceStatus } from '../types';

interface ChildSlicesTableProps {
  slices: ChildSlice[];
  onInspectAudit: (sliceId?: string) => void;
}

export const ChildSlicesTable: React.FC<ChildSlicesTableProps> = ({
  slices,
  onInspectAudit,
}) => {
  const [venueFilter, setVenueFilter] = useState<'ALL' | ExecutionVenue>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SliceStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredSlices = slices.filter((s) => {
    if (venueFilter !== 'ALL' && s.venue !== venueFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchTerm && !s.slice_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getVenueLabel = (venue: ExecutionVenue) => {
    switch (venue) {
      case 'DARK_POOL_ATS':
        return { label: 'Dark ATS (Midpoint)', bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50' };
      case 'PRIMARY_EXCHANGE_LIT':
        return { label: 'Primary Lit (ARCA)', bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50' };
      case 'SECONDARY_ECN':
        return { label: 'Secondary ECN', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' };
    }
  };

  const getStatusLabel = (status: SliceStatus) => {
    switch (status) {
      case 'FILLED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ACKNOWLEDGED':
      case 'ROUTED':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'PENDING':
        return 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40';
      case 'CANCELLED':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Smart Order Routing</span>
            <div className="text-base font-semibold text-zinc-200">Live Child Order Dispatch Table</div>
          </div>
          <span className="text-sm text-zinc-500 font-mono">({filteredSlices.length} Slices)</span>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Venue filter */}
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono"
          >
            <option value="ALL">All Venues</option>
            <option value="DARK_POOL_ATS">Dark Pool ATS</option>
            <option value="PRIMARY_EXCHANGE_LIT">Primary Lit</option>
            <option value="SECONDARY_ECN">Secondary ECN</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="FILLED">Filled</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Search box */}
          <input
            type="text"
            placeholder="Search Slice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none font-mono w-44"
          />
        </div>
      </div>

      {/* High Density Tabular Data Grid */}
      <div className="overflow-x-auto max-h-96 border border-zinc-800/70 rounded-md">
        <table className="w-full text-left text-sm font-mono tabular-nums border-collapse">
          <thead className="bg-zinc-950/90 text-zinc-400 sticky top-0 z-10 border-b border-zinc-800">
            <tr>
              <th className="py-3 px-3.5 font-semibold text-zinc-300">Slice ID</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300">Venue Route</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300">Status</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300 text-right">Target Shares</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300 text-right">Filled</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300 text-right">Limit Price</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300 text-right">Fill Price</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300 text-right">Slippage (bps)</th>
              <th className="py-3 px-3.5 font-semibold text-zinc-300">SHA-256 Block Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 bg-zinc-950/40">
            {filteredSlices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-500">
                  No child slices match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredSlices.map((slice) => {
                const venueInfo = getVenueLabel(slice.venue);
                const statusClass = getStatusLabel(slice.status);

                return (
                  <tr key={slice.slice_id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-2.5 px-3.5 font-semibold text-zinc-200">
                      {slice.slice_id}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-sm border font-medium ${venueInfo.bg}`}>
                        {venueInfo.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-sm border font-semibold ${statusClass}`}>
                        {slice.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-zinc-200">
                      {slice.target_shares.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-zinc-200 font-semibold">
                      {slice.filled_shares > 0
                        ? slice.filled_shares.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-zinc-400">
                      {slice.limit_price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {slice.fill_price ? (
                        <span className="text-zinc-100 font-semibold">{slice.fill_price.toFixed(4)}</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {slice.status === 'FILLED' ? (
                        <span
                          className={`font-semibold ${
                            slice.slippage_bps < 0
                              ? 'text-emerald-400'
                              : slice.slippage_bps <= 3.5
                              ? 'text-cyan-400'
                              : slice.slippage_bps <= 8.0
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {slice.slippage_bps > 0 ? `+${slice.slippage_bps.toFixed(2)}` : slice.slippage_bps.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onInspectAudit(slice.slice_id)}
                          title="Inspect cryptographic ledger chain"
                          className="text-sm text-zinc-400 hover:text-cyan-300 font-mono underline decoration-zinc-700 underline-offset-2 cursor-pointer"
                        >
                          {slice.audit_hash ? `${slice.audit_hash.substring(0, 10)}...` : 'Pending'}
                        </button>
                        {slice.audit_hash && (
                          <button
                            onClick={() => copyToClipboard(slice.audit_hash)}
                            className="text-sm text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                            title="Copy full 64-char SHA-256 hash"
                          >
                            {copiedHash === slice.audit_hash ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between text-sm text-zinc-500 font-mono pt-3 border-t border-zinc-800/80 mt-2">
        <span>Deterministic Child Slicing with Strict Zero-Residual Guarantee</span>
        <button
          onClick={() => onInspectAudit()}
          className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 cursor-pointer"
        >
          Verify Entire SHA-256 Audit Chain →
        </button>
      </div>
    </div>
  );
};
