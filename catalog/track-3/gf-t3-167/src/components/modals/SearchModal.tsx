import React, { useState } from 'react';
import { 
  X, 
  Search, 
  ArrowRight, 
  FileCode2, 
  Database, 
  Globe, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tabIndex: number) => void;
}

interface SearchItem {
  id: string;
  title: string;
  description: string;
  tabIndex: number;
  category: 'ENGINE' | 'SQL' | 'OPENAPI' | 'CLOUD_RUN' | 'APA';
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 's1',
    title: 'Lock-Free C-Struct RingBuffer',
    description: '64-byte aligned memory slots with atomic head/tail pointers',
    tabIndex: 0,
    category: 'ENGINE',
  },
  {
    id: 's2',
    title: 'L2 Order Book Bid/Ask Ladders',
    description: 'Dynamic price-time priority matching for Lexus LC 500 Dynamic Core',
    tabIndex: 0,
    category: 'ENGINE',
  },
  {
    id: 's3',
    title: 'Monotonic Sequence Generator (seq_engine_monotonic)',
    description: 'Strict ascending monotonic integer generator starting at #1,000,000',
    tabIndex: 1,
    category: 'SQL',
  },
  {
    id: 's4',
    title: 'HMAC-SHA256 Non-Repudiation Trigger (trg_verify_tick_hmac)',
    description: 'Write-ahead verification function preventing unauthenticated state insertion',
    tabIndex: 1,
    category: 'SQL',
  },
  {
    id: 's5',
    title: 'PostgreSQL 16 Monthly Table Partitioning',
    description: 'engine_tick_ledger_2026_10 range-partitioned ledger table DDL',
    tabIndex: 1,
    category: 'SQL',
  },
  {
    id: 's6',
    title: 'POST /api/v1/orders (Order Ingress)',
    description: 'Submit Limit, Market, IOC, or FOK order into ring-buffer',
    tabIndex: 2,
    category: 'OPENAPI',
  },
  {
    id: 's7',
    title: 'WS /ws/v1/trades (Real-time Stream)',
    description: 'Chained cryptographic trade execution feed over WebSocket',
    tabIndex: 2,
    category: 'OPENAPI',
  },
  {
    id: 's8',
    title: 'Single-Line gcloud run deploy Script',
    description: 'Turnkey Google Cloud Run managed deployment configuration',
    tabIndex: 3,
    category: 'CLOUD_RUN',
  },
  {
    id: 's9',
    title: 'PyTest Automated Suite (94.2% Coverage)',
    description: '7 unit and concurrency benchmarks satisfying >88% coverage target',
    tabIndex: 3,
    category: 'CLOUD_RUN',
  },
  {
    id: 's10',
    title: 'Acquire.com Micro-APA Escrow Covenant',
    description: '$45,000 USD buyout agreement, clean-room schedule & dual-key multi-sig',
    tabIndex: 4,
    category: 'APA',
  },
  {
    id: 's11',
    title: 'Clean-Room IP Schedule A (Zero Copyleft)',
    description: '100% Permissive MIT / BSD dependency warranty and non-infringement clause',
    tabIndex: 4,
    category: 'APA',
  },
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const getCategoryIcon = (cat: SearchItem['category']) => {
    switch (cat) {
      case 'ENGINE': return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'SQL': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'OPENAPI': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'CLOUD_RUN': return <FileCode2 className="w-4 h-4 text-purple-400" />;
      case 'APA': return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col font-mono">
        {/* Search Input Bar */}
        <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search engine components, schemas, endpoints, or covenants..."
            className="flex-1 bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search dialog"
            className="text-zinc-500 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No matching specifications found for "{query}".
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onNavigateToTab(item.tabIndex);
                  onClose();
                }}
                className="p-3 rounded-lg hover:bg-zinc-800/80 cursor-pointer transition-colors flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
          <span>{filtered.length} Results Available</span>
          <span>Press ESC or click outside to dismiss</span>
        </div>
      </div>
    </div>
  );
};
