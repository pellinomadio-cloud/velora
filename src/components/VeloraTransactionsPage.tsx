import React, { useState } from 'react';
import { ArrowLeft, Search, Eye, TrendingDown, TrendingUp, Calendar, Hash, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { User, Transaction } from '../types';

interface VeloraTransactionsPageProps {
  user: User;
  transactions: Transaction[];
  onBack: () => void;
}

export default function VeloraTransactionsPage({
  user,
  transactions,
  onBack,
}: VeloraTransactionsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'send' | 'airtime' | 'data' | 'bills' | 'exchange'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Compute stats
  const totalInflow = transactions
    .filter((t) => t.status === 'completed' && (t.type === 'deposit' || t.type === 'exchange'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter((t) => t.status === 'completed' && (t.type === 'send' || t.type === 'airtime' || t.type === 'data' || t.type === 'bills'))
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter lists
  const filtered = transactions.filter((tx) => {
    const matchType = filterType === 'all' || tx.type === filterType;
    const matchSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Transaction History
          </h2>
          <p className="text-[10px] text-zinc-400">Complete immutable record of your financial ledger</p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4 pb-6">
        {/* Ledger quick summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/10 dark:border-zinc-850 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Inflow</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                +₦{totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/10 dark:border-zinc-850 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Outflow</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                -₦{totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'deposit', label: 'Wallet Funds' },
            { id: 'send', label: 'Withdrawals' },
            { id: 'airtime', label: 'Airtime' },
            { id: 'data', label: 'Data Plans' },
            { id: 'exchange', label: 'Conversions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all cursor-pointer border-none ${
                filterType === tab.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10'
                  : 'bg-slate-50 dark:bg-zinc-950 text-zinc-500 hover:bg-slate-100 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions list */}
        <div className="flex-1 overflow-y-auto no-scrollbar border border-slate-100 dark:border-zinc-850 rounded-3xl divide-y divide-slate-100 dark:divide-zinc-850">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <p className="text-xs">No matching ledger records found.</p>
            </div>
          ) : (
            filtered.map((tx) => {
              const isPlus = tx.type === 'deposit' || tx.type === 'exchange';
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-950/40 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isPlus
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                          : 'bg-slate-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isPlus ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-850 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <p className="text-[9px] text-zinc-400 truncate max-w-[180px]">
                        {tx.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-black ${
                        isPlus ? 'text-emerald-500' : 'text-zinc-850 dark:text-zinc-200'
                      }`}
                    >
                      {isPlus ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] text-zinc-400 mt-0.5">{tx.date}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction Details Receipt Modal Overlay */}
      {selectedTx && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-sm font-black text-zinc-850 dark:text-white">Transaction Receipt</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt detail layout */}
            <div className="text-center space-y-1 pb-4">
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Transaction Amount</p>
              <h4
                className={`text-2xl font-black ${
                  selectedTx.type === 'deposit' || selectedTx.type === 'exchange'
                    ? 'text-emerald-500'
                    : 'text-zinc-900 dark:text-white'
                }`}
              >
                {selectedTx.type === 'deposit' || selectedTx.type === 'exchange' ? '+' : '-'}₦
                {selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h4>
              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 inline-block mt-2">
                SUCCESSFUL
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-100 dark:border-zinc-850 space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 font-semibold">Service:</span>
                <span className="font-extrabold text-zinc-850 dark:text-white">{selectedTx.title}</span>
              </div>
              <div className="flex justify-between items-start text-[10px]">
                <span className="text-zinc-400 font-semibold shrink-0">Details:</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 text-right">
                  {selectedTx.subtitle}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 font-semibold">Reference:</span>
                <span className="font-mono font-black text-orange-500 uppercase">
                  {selectedTx.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 font-semibold">Date & Time:</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{selectedTx.date}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 font-semibold">Channel:</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 uppercase">
                  {selectedTx.type}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-850 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal X icon to avoid bringing too many exports
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
