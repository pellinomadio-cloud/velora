import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { User, Transaction } from '../types';

interface VeloraWithdrawPageProps {
  user: User;
  onDeductBalance: (amount: number) => void;
  onAddTransaction: (tx: Transaction) => void;
  onBack: () => void;
  onOpenKyc: () => void;
  onOpenCard: () => void;
}

export default function VeloraWithdrawPage({
  user,
  onDeductBalance,
  onAddTransaction,
  onBack,
  onOpenKyc,
  onOpenCard,
}: VeloraWithdrawPageProps) {
  const [withdrawBank, setWithdrawBank] = useState('GTBank');
  const [withdrawAccountNum, setWithdrawAccountNum] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-resolve account name helper when account number is exactly 10 digits
  const handleAccountNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setWithdrawAccountNum(val);
    if (val.length === 10) {
      const names = [
        'MARVELOUS OLATUNJI',
        'CHINEDU OKAFOR',
        'AMARA NWOSU',
        'SANI BELLO',
        'ADEYEMI ALAO',
        'FOLASADE ADEBAYO',
        'BABATUNDE SOWANDE',
        'OLUWASEUN ADIGUN',
      ];
      // Deterministic based on account number digits
      const index = parseInt(val) % names.length;
      setWithdrawAccountName(names[index]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }

    if (amt < 500) {
      setError('Minimum withdrawal amount is ₦500.00');
      return;
    }

    if (user.balance < amt) {
      setError('Insufficient wallet balance to perform withdrawal.');
      return;
    }

    // Process Withdrawal
    onDeductBalance(amt);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'send',
      title: 'Bank Withdrawal',
      subtitle: `Transferred ₦${amt.toLocaleString()} to ${withdrawBank} (${withdrawAccountNum})`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: user.cardActivationStatus === 'verified' ? 'completed' : 'pending',
      recipient: withdrawBank,
      reference: `WDR-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    onAddTransaction(tx);
    setSuccess(true);
    setWithdrawAmount('');
    setWithdrawAccountNum('');
    setWithdrawAccountName('');
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
            Secure Bank Withdrawal
          </h2>
          <p className="text-[10px] text-zinc-400">Transfer earnings to any corporate bank account</p>
        </div>
      </div>

      {!isKycVerified ? (
        /* KYC GATE */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7 stroke-[2px]" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-zinc-800 dark:text-white tracking-tight">
              KYC Authentication Required
            </h4>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
              {user.kycStatus === 'pending'
                ? 'Your KYC verification is currently pending security review. Once verified by our support admins, you can instantly withdraw your accumulated earnings.'
                : 'To safeguard accounts and comply with federal cash regulations, active KYC verification is required. Complete verification with an activation deposit.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenKyc}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
          >
            {user.kycStatus === 'pending' ? 'View Status' : 'Complete KYC Verification Now'}
          </button>
        </div>
      ) : success ? (
        /* SUCCESS SCREEN */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
          {user.cardActivationStatus === 'verified' ? (
            <>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5px]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-zinc-800 dark:text-white">Withdrawal Successful</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Your bank transfer has been executed instantly and will reflect in your account shortly.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="w-full py-3 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md"
              >
                Initiate Another Transfer
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10 animate-pulse">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5px]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-zinc-800 dark:text-white">Withdrawal Processing</h4>
                <p className="text-xs text-zinc-450 dark:text-zinc-400 leading-relaxed">
                  Your bank withdrawal is registered and is currently <span className="font-extrabold text-orange-500">processing</span>. To complete your ongoing withdrawal, please activate your virtual card.
                </p>
              </div>
              <div className="w-full space-y-2.5">
                <button
                  onClick={() => {
                    setSuccess(false);
                    onOpenCard();
                  }}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-orange-500/15 font-bold"
                >
                  Activate Virtual Card Now
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    onBack();
                  }}
                  className="w-full py-3 bg-zinc-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  View on Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* TRANSFER FORM */
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/80 flex justify-between items-center">
            <span className="text-[11px] font-bold text-zinc-400">Available Balance:</span>
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Select Bank</label>
              <select
                value={withdrawBank}
                onChange={(e) => setWithdrawBank(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
              >
                <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                <option value="Access Bank">Access Bank</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="UBA">United Bank for Africa (UBA)</option>
                <option value="First Bank">First Bank of Nigeria</option>
                <option value="Kuda Bank">Kuda Bank</option>
                <option value="OPay">OPay</option>
                <option value="Moniepoint">Moniepoint</option>
                <option value="Wema Bank">Wema Bank (ALAT)</option>
                <option value="Fidelity Bank">Fidelity Bank</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Account Number</label>
              <input
                type="text"
                maxLength={10}
                required
                placeholder="10-digit NUBAN Number"
                value={withdrawAccountNum}
                onChange={handleAccountNumChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Account Name</label>
              <input
                type="text"
                required
                placeholder="Enter Beneficiary Account Name"
                value={withdrawAccountName}
                onChange={(e) => setWithdrawAccountName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
              />
              {withdrawAccountNum.length === 10 && (
                <p className="text-[9px] text-emerald-500 flex items-center gap-1 mt-0.5 px-1 font-semibold">
                  <CheckCircle className="w-3 h-3 text-emerald-500 inline" /> Auto-resolved suggestion loaded. Feel free to edit.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Amount to Withdraw (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-zinc-400">
                  Avail. Bal: ₦{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(Math.floor(user.balance).toString())}
                  className="text-[10px] font-bold text-orange-500 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Withdraw All
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
            >
              Withdraw Funds Instantly
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
