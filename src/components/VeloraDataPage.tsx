import React, { useState } from 'react';
import { ArrowLeft, Wifi, CheckCircle2 } from 'lucide-react';
import { User, Transaction } from '../types';

interface VeloraDataPageProps {
  user: User;
  onDeductBalance: (amount: number) => void;
  onAddTransaction: (tx: Transaction) => void;
  onBack: () => void;
}

export default function VeloraDataPage({
  user,
  onDeductBalance,
  onAddTransaction,
  onBack,
}: VeloraDataPageProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [operator, setOperator] = useState('MTN');

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPlan(val);
    
    const index = e.target.selectedIndex;
    if (index > 0) {
      setSelectedPlanName(e.target.options[index].text);
    } else {
      setSelectedPlanName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-11 digit phone number.');
      return;
    }

    const price = parseFloat(selectedPlan);
    if (isNaN(price) || price <= 0) {
      setError('Please select a valid data bundle plan.');
      return;
    }

    if (user.balance < price) {
      setError('Insufficient wallet balance to buy this plan.');
      return;
    }

    // Deduct and add ledger entry
    onDeductBalance(price);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'data',
      title: 'Data Bundle Purchase',
      subtitle: `Loaded ${selectedPlanName.split(' • ')[0]} to ${operator} (${phoneNumber})`,
      amount: price,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'completed',
      recipient: phoneNumber,
      reference: `DAT-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    onAddTransaction(tx);
    setSuccess(true);
    setPhoneNumber('');
    setSelectedPlan('');
  };

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
            Data Bundle Topup
          </h2>
          <p className="text-[10px] text-zinc-400">Activate super-fast high speed mobile data plans</p>
        </div>
      </div>

      {success ? (
        /* SUCCESS SCREEN */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5px]" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-zinc-800 dark:text-white">Bundle Activated successfully!</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              The data bundle has been provisioned and loaded to the recipient's phone line immediately.
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md"
          >
            Buy Another Data Bundle
          </button>
        </div>
      ) : (
        /* PURCHASE FORM */
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/80 flex justify-between items-center">
            <span className="text-[11px] font-bold text-zinc-400">Available Wallet:</span>
            <span className="text-sm font-black text-zinc-800 dark:text-white">
              ₦{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Operator</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                >
                  <option>MTN</option>
                  <option>Airtel</option>
                  <option>Glo</option>
                  <option>9mobile</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Select Data Plan</label>
              <select
                required
                value={selectedPlan}
                onChange={handlePlanChange}
                className="w-full px-3 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
              >
                <option value="">Choose a super plan...</option>
                <option value="1000">1.5 GB • 30 Days (₦1,000)</option>
                <option value="2500">5.0 GB • 30 Days (₦2,500)</option>
                <option value="5000">15.0 GB • 30 Days (₦5,000)</option>
                <option value="12000">Unlimited 5G Lite • 30 Days (₦12,000)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
            >
              Activate Plan Instantly
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
