import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Search,
  Sparkles,
  Briefcase,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { EARN_COMPANIES, EarnCompany } from '../data/companies';

interface VeloraEarnPageProps {
  user: User;
  joinedCompanies: { companyId: string; joinedAt: string }[];
  joinedTodayCount: number;
  onJoinCompany: (companyId: string) => string | null;
  onBack: () => void;
}

export default function VeloraEarnPage({
  user,
  joinedCompanies,
  joinedTodayCount,
  onJoinCompany,
  onBack
}: VeloraEarnPageProps) {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<'All' | 'Energy & Gas' | 'Agriculture & Food' | 'Real Estate & Infra' | 'Local Trade & Retail' | 'Tech & Digital'>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeDetails = EARN_COMPANIES.filter((c) =>
    joinedCompanies.some((jc) => jc.companyId === c.id)
  );

  const totalDailyEarning = activeDetails.reduce((sum, c) => sum + c.dailyEarning, 0);

  const handleJoinClick = (companyId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const error = onJoinCompany(companyId);
    if (error) {
      setErrorMsg(error);
    } else {
      const co = EARN_COMPANIES.find(c => c.id === companyId);
      setSuccessMsg(`Successfully joined ${co?.name}! Passive earnings started.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const filteredCompanies = EARN_COMPANIES.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesSector = selectedSector === 'All' || c.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-20"
    >
      {/* 1. HEADER ROW */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-zinc-800 dark:text-white flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-orange-500" />
              Velora Earn
            </h1>
            <p className="text-[10px] text-zinc-400">Stream high-yield revenue passively</p>
          </div>
        </div>
        
        {/* Glowing LIVE Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-950/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Live Streams Active</span>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Stat 1: Joined */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl flex flex-col justify-between shadow-sm min-h-[85px]">
          <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Active Pools</span>
          <div className="mt-2">
            <p className="text-lg font-black text-zinc-850 dark:text-white leading-none">
              {joinedCompanies.length}
            </p>
            <p className="text-[8px] text-zinc-400 mt-1">Pool partnerships</p>
          </div>
        </div>

        {/* Stat 2: Daily Est */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl flex flex-col justify-between shadow-sm min-h-[85px]">
          <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            Est. Payout
          </span>
          <div className="mt-2">
            <p className="text-xs font-black text-emerald-500 leading-none truncate">
              +₦{totalDailyEarning.toLocaleString('en-US', { maximumFractionDigits: 0 })}/day
            </p>
            <p className="text-[8px] text-zinc-400 mt-1">
              ₦{((totalDailyEarning) / 24).toFixed(1)}/hour est
            </p>
          </div>
        </div>

        {/* Stat 3: Quota */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl flex flex-col justify-between shadow-sm min-h-[85px]">
          <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Daily Limit</span>
          <div className="mt-2">
            <p className={`text-lg font-black leading-none ${joinedTodayCount >= 3 ? 'text-amber-500' : 'text-zinc-800 dark:text-white'}`}>
              {3 - joinedTodayCount} <span className="text-[10px] text-zinc-400 font-normal">left</span>
            </p>
            <p className="text-[8px] text-zinc-400 mt-1">3 maximum daily</p>
          </div>
        </div>

      </div>

      {/* Info text */}
      <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850/80 text-center">
        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
          <Sparkles className="w-3 h-3 text-orange-400 inline mr-1 animate-pulse" />
          Naira payouts stream dynamically to your wallet every <span className="text-zinc-800 dark:text-white font-extrabold">3 seconds</span> for instant cashout feedback.
        </p>
      </div>

      {/* Notifications/Feedback Banner */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-950/50 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* 3. FILTERS */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search from 50 revenue companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
          />
        </div>

        {/* Categories Horizontal Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {(['All', 'Energy & Gas', 'Agriculture & Food', 'Real Estate & Infra', 'Local Trade & Retail', 'Tech & Digital'] as const).map((sector) => (
            <button
              type="button"
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSector === sector
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10'
                  : 'bg-slate-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* 4. POOLS LIST */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Available Pools</h3>
          <span className="text-[10px] text-zinc-400 font-bold">Showing {filteredCompanies.length} results</span>
        </div>

        <div className="space-y-2.5">
          {filteredCompanies.map((co) => {
            const isJoined = joinedCompanies.some((jc) => jc.companyId === co.id);
            return (
              <div
                key={co.id}
                className="p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-4 shadow-sm transition-all hover:border-orange-500/20"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-zinc-950 flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-zinc-850 shadow-inner">
                    {co.emoji}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-zinc-800 dark:text-white truncate">{co.name}</h4>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 text-[7px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                        {co.sector.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-normal">
                      {co.description}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-extrabold">
                      Earning Rate: +₦{co.dailyEarning.toLocaleString()}/day
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isJoined}
                  onClick={() => handleJoinClick(co.id)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 cursor-pointer ${
                    isJoined
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/50 cursor-default'
                      : 'bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-sm'
                  }`}
                >
                  {isJoined ? 'Active ✔' : 'Join Pool'}
                </button>
              </div>
            );
          })}

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850/50">
              <p className="text-xs text-zinc-400">No pools found matching your filter.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
