import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Wifi, Zap, Sparkles, Bell, Plane, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface ESimTabProps {
  user: User;
  onPurchasePlan?: (plan: any) => void;
  onAddTransaction?: (tx: any) => void;
}

export default function ESimTab({ user }: ESimTabProps) {
  const [notified, setNotified] = useState(false);
  const [emailInput, setEmailInput] = useState(user.email || '');

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setNotified(true);
  };

  return (
    <div className="space-y-6">
      {/* Premium Announcement Hero */}
      <div className="p-8 bg-gradient-to-br from-white via-slate-50 to-orange-50/20 dark:from-zinc-900 dark:via-zinc-950 dark:to-orange-950/10 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto py-6">
          {/* Animated network icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-orange-500/15 rounded-full blur-xl animate-pulse scale-125" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Globe className="w-8 h-8 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-950 dark:bg-white flex items-center justify-center text-orange-500 shadow-sm">
              <Wifi className="w-3.5 h-3.5" />
            </div>
          </div>

          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Coming Soon
          </span>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            Velora Borderless eSIM
          </h2>
          
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 leading-relaxed">
            Travel without boundaries. We are currently partnering with tier-one global telecom providers (including T-Mobile, Vodafone, MTN 5G, and Orange) to deliver near-zero latency roaming profiles directly to your device.
          </p>

          {/* Feature list preview */}
          <div className="grid grid-cols-2 gap-3.5 w-full mt-8 text-left">
            <div className="p-3 bg-white/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 rounded-2xl">
              <div className="flex items-center gap-1.5 text-orange-500">
                <Plane className="w-4 h-4" />
                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-white">Global Coverage</p>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">Instant network switching across 180+ countries.</p>
            </div>

            <div className="p-3 bg-white/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 rounded-2xl">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Zap className="w-4 h-4" />
                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-white">Instant OTA</p>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">Activate directly in seconds via QR or app installer.</p>
            </div>

            <div className="p-3 bg-white/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 rounded-2xl">
              <div className="flex items-center gap-1.5 text-blue-500">
                <Wifi className="w-4 h-4" />
                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-white">MTN 5G & Roaming</p>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">Local high-speed data plans starting at unbeatable rates.</p>
            </div>

            <div className="p-3 bg-white/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 rounded-2xl">
              <div className="flex items-center gap-1.5 text-purple-500">
                <ShieldAlert className="w-4 h-4" />
                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-white">No Roaming Bills</p>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">Save up to 85% compared to legacy mobile carriers.</p>
            </div>
          </div>

          {/* Interest Registration Form */}
          <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-zinc-850">
            {notified ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl border border-emerald-500/20 font-bold"
              >
                🎉 You are on the waitlist! We will notify you once eSIM launches.
              </motion.div>
            ) : (
              <form onSubmit={handleNotifyMe} className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Be the first to know when we launch
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-zinc-950 dark:bg-orange-500 hover:bg-zinc-850 dark:hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Bell className="w-3.5 h-3.5" /> Notify Me
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
