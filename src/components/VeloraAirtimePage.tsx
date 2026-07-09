import React, { useState } from 'react';
import { ArrowLeft, Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { User, Transaction } from '../types';

interface VeloraAirtimePageProps {
  user: User;
  onDeductBalance: (amount: number) => void;
  onAddTransaction: (tx: Transaction) => void;
  onBack: () => void;
  onOpenKyc: () => void;
}

export default function VeloraAirtimePage({
  user,
  onDeductBalance,
  onAddTransaction,
  onBack,
  onOpenKyc,
}: VeloraAirtimePageProps) {
  const [operator, setOperator] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-11 digit phone number.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid topup amount.');
      return;
    }

    if (amt < 100) {
      setError('Minimum topup amount is ₦100.00');
      return;
    }

    if (user.balance < amt) {
      setError('Insufficient wallet balance to purchase this airtime.');
      return;
    }

    // Process Purchase
    onDeductBalance(amt);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'airtime',
      title: 'Airtime Purchase',
      subtitle: `Recharged ₦${amt.toLocaleString()} to ${operator} (${phoneNumber})`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'completed',
      recipient: phoneNumber,
      reference: `ART-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    onAddTransaction(tx);
    setSuccess(true);
    setAmount('');
    setPhoneNumber('');
  };

  const isKycVerified = user.kycStatus === 'verified';

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
            Airtime Topup
          </h2>
          <p className="text-[10px] text-zinc-400">Recharge mobile network airtime instantly</p>
        </div>
      </div>

      {!isKycVerified ? (
        /* KYC GATE */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5">
          <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7 stroke-[2px]" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-zinc-850 dark:text-white tracking-tight">
              KYC Verification Required
            </h4>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
              To satisfy anti-fraud telecommunication protocols, airtime purchase is restricted to verified accounts. Please complete your KYC verification to unlock.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenKyc}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
          >
            {user.kycStatus === 'pending' ? 'View KYC Status' : 'Complete KYC Verification Now'}
          </button>
        </div>
      ) : success ? (
        /* SUCCESS SCREEN */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5px]" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-zinc-800 dark:text-white">Airtime Purchased Successfully!</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              The airtime voucher pin has been loaded directly onto the phone number line instantly.
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md"
          >
            Purchase Another Airtime
          </button>
        </div>
      ) : (
        /* RECHARGE FORM */
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
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Topup Voucher Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                />
              </div>
              <p className="text-[9px] text-zinc-400 px-1 mt-1">Minimum recharge value is ₦100.00</p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
            >
              Confirm Airtime Purchase
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
