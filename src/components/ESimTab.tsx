import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Wifi, ShieldCheck, Zap, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { ESimPlan, User } from '../types';

interface ESimTabProps {
  user: User;
  onPurchasePlan: (plan: ESimPlan) => void;
  onAddTransaction: (tx: any) => void;
}

const DEFAULT_ESIMS: ESimPlan[] = [
  { id: 'esim_1', country: 'United States', dataLimit: '10 GB', validity: '30 Days', price: 12000, carrier: 'T-Mobile', isActive: false },
  { id: 'esim_2', country: 'United Kingdom', dataLimit: '15 GB', validity: '30 Days', price: 9500, carrier: 'Vodafone', isActive: false },
  { id: 'esim_3', country: 'Nigeria', dataLimit: '25 GB', validity: '30 Days', price: 4500, carrier: 'MTN 5G Super', isActive: true },
  { id: 'esim_4', country: 'European Union', dataLimit: '20 GB', validity: '30 Days', price: 15000, carrier: 'Orange', isActive: false },
  { id: 'esim_5', country: 'Ghana', dataLimit: '5 GB', validity: '14 Days', price: 3200, carrier: 'AirtelTigo', isActive: false },
];

export default function ESimTab({ user, onPurchasePlan, onAddTransaction }: ESimTabProps) {
  const [plans, setPlans] = useState<ESimPlan[]>(() => {
    const saved = localStorage.getItem('velora_esims');
    return saved ? JSON.parse(saved) : DEFAULT_ESIMS;
  });
  
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const savePlans = (updated: ESimPlan[]) => {
    setPlans(updated);
    localStorage.setItem('velora_esims', JSON.stringify(updated));
  };

  const handleBuy = (plan: ESimPlan) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (user.balance < plan.price) {
      setErrorMsg(`Insufficient wallet funds. This eSIM costs ₦${plan.price.toLocaleString()}.`);
      return;
    }

    // Process Purchase
    const updatedUser = { ...user, balance: user.balance - plan.price };
    localStorage.setItem('velora_current_user', JSON.stringify(updatedUser));

    // Update ESim state
    const updatedPlans = plans.map((p) => {
      if (p.id === plan.id) {
        return { ...p, isActive: true }; // Activate purchased plan
      }
      return p;
    });
    savePlans(updatedPlans);

    // Trigger parent purchase event (deducts money & saves user)
    onPurchasePlan(plan);

    // Create a transaction record
    const tx = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'data' as const,
      title: `${plan.country} eSIM`,
      subtitle: `Data roaming profile activated (${plan.dataLimit})`,
      amount: plan.price,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed' as const,
      reference: `ESIM-${plan.id.toUpperCase()}`
    };
    onAddTransaction(tx);

    setSuccessMsg(`Congratulations! Your ${plan.country} eSIM has been activated successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggle = (id: string) => {
    const updatedPlans = plans.map((p) => {
      if (p.id === id) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });
    savePlans(updatedPlans);
  };

  const filteredPlans = plans.filter((p) =>
    p.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-orange-500" /> Velora eSIM Network
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 mb-4">
          Travel borderless with near-zero latency roaming profiles. Direct activation.
        </p>

        <input
          type="text"
          placeholder="Search country or destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
        />
      </div>

      {/* Messaging Area */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl border border-emerald-100 dark:border-emerald-950/50 flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" /> {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl border border-red-100 dark:border-red-950/50 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* eSIM list */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Available Profiles</h3>
        
        <div className="space-y-3">
          {filteredPlans.map((plan) => {
            const hasPurchased = plan.isActive;
            return (
              <div
                key={plan.id}
                className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-orange-500">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-zinc-800 dark:text-white">{plan.country}</p>
                      <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded font-bold">
                        {plan.carrier}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {plan.dataLimit} • {plan.validity} Validity
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-zinc-800 dark:text-white">
                    ₦{plan.price.toLocaleString()}
                  </p>
                  
                  {hasPurchased ? (
                    <button
                      onClick={() => handleToggle(plan.id)}
                      className="mt-2 text-xs flex items-center gap-1 font-semibold text-emerald-500 bg-transparent border-none cursor-pointer"
                    >
                      Active <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(plan)}
                      className="mt-2 px-3 py-1.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Instant Purchase
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPlans.length === 0 && (
            <p className="text-center text-xs text-zinc-400 py-6">No eSIM profiles found matching "{search}"</p>
          )}
        </div>
      </div>
    </div>
  );
}
