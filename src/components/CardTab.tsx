import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Snowflake, 
  Flame, 
  CreditCard, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Upload, 
  FileImage, 
  ShieldAlert, 
  Copy, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { VirtualCard, User } from '../types';

interface CardTabProps {
  user: User;
  onDeductBalance: (amount: number) => void;
  onAddTransaction: (tx: any) => void;
  onOpenAdmin?: () => void;
  onOpenKyc?: () => void;
  onUpdateUser: (updated: User) => void;
}

const DEFAULT_CARDS: VirtualCard[] = [
  {
    id: 'v1',
    cardNumber: '5399 2400 9622 4108',
    cardHolder: 'MARVELOUS OLATUNJI',
    expiryDate: '09/29',
    cvv: '392',
    color: 'from-orange-500 to-amber-600',
    type: 'mastercard',
    isFrozen: false,
    balance: 45000.00,
  }
];

export default function CardTab({ 
  user, 
  onDeductBalance, 
  onAddTransaction, 
  onOpenAdmin, 
  onOpenKyc, 
  onUpdateUser 
}: CardTabProps) {
  const [cards, setCards] = useState<VirtualCard[]>(() => {
    const saved = localStorage.getItem('velora_cards');
    return saved ? JSON.parse(saved) : DEFAULT_CARDS;
  });

  const [revealSecrets, setRevealSecrets] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [newCardHolder, setNewCardHolder] = useState(user.username.toUpperCase());
  const [newCardColor, setNewCardColor] = useState('from-indigo-600 to-purple-700');
  const [newCardType, setNewCardType] = useState<'visa' | 'mastercard'>('visa');
  const [loadAmount, setLoadAmount] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadSuccess, setLoadSuccess] = useState(false);

  // Card Activation states
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingError, setSubmittingError] = useState('');

  const companyAccount = {
    bankName: 'Wema Bank (Volerapay Digital)',
    accountNumber: '0123958373',
    accountName: 'Volerapay Fintech Solutions',
    fee: 11000,
  };

  const saveCards = (updated: VirtualCard[]) => {
    setCards(updated);
    localStorage.setItem('velora_cards', JSON.stringify(updated));
  };

  const currentCard = cards[activeCardIndex] || cards[0];

  const handleFreezeToggle = () => {
    const updated = cards.map((c, i) => {
      if (i === activeCardIndex) {
        return { ...c, isFrozen: !c.isFrozen };
      }
      return c;
    });
    saveCards(updated);
  };

  const handleLoadCardBalance = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadError('');
    setLoadSuccess(false);

    const amt = parseFloat(loadAmount);
    if (isNaN(amt) || amt <= 0) {
      setLoadError('Please enter a valid amount to load.');
      return;
    }

    if (user.balance < amt) {
      setLoadError(`Insufficient wallet balance. You only have ₦${user.balance.toLocaleString()}.`);
      return;
    }

    // Deduct from wallet balance
    onDeductBalance(amt);

    // Add to card balance
    const updatedCards = cards.map((c, i) => {
      if (i === activeCardIndex) {
        return { ...c, balance: c.balance + amt };
      }
      return c;
    });
    saveCards(updatedCards);

    // Create transaction
    const tx = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'send' as const,
      title: `Virtual Card Loaded`,
      subtitle: `Deposited into card •••• ${currentCard.cardNumber.slice(-4)}`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed' as const,
      reference: `CARD-${currentCard.id.toUpperCase()}-${Math.floor(Math.random() * 9999)}`
    };
    onAddTransaction(tx);

    setLoadSuccess(true);
    setLoadAmount('');
    setTimeout(() => setLoadSuccess(false), 3000);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardHolder.trim()) return;

    // Generate random card number and CVV
    const rNum = Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
    const rCvv = Math.floor(100 + Math.random() * 900).toString();
    const expiry = `07/${(new Date().getFullYear() % 100) + 4}`;

    const newCard: VirtualCard = {
      id: `v${cards.length + 1}`,
      cardNumber: rNum,
      cardHolder: newCardHolder.toUpperCase().trim(),
      expiryDate: expiry,
      cvv: rCvv,
      color: newCardColor,
      type: newCardType,
      isFrozen: false,
      balance: 0.00,
    };

    const updated = [...cards, newCard];
    saveCards(updated);
    setActiveCardIndex(updated.length - 1);
    setIsCreating(false);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(companyAccount.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSubmittingError('Please upload an image file (PNG, JPG, JPEG, WEBP) as proof.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

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

  const handleActivationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof) {
      setSubmittingError('Please upload a valid payment receipt screenshot first.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        cardActivationStatus: 'pending',
        cardActivationProof: proof,
      };
      onUpdateUser(updatedUser);
      setIsSubmitting(false);
    }, 1200);
  };

  const isKycVerified = user.kycStatus === 'verified';
  const cardActivation = user.cardActivationStatus || 'unverified';

  return (
    <div className="space-y-6">
      {/* Header section with hidden/subtle red admin button */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-850">
        <div>
          <h2 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">Your Virtual Cards</h2>
          <p className="text-[10px] text-zinc-400">Instantly active visa & mastercards</p>
        </div>
        <button
          onClick={onOpenAdmin}
          className="w-3.5 h-3.5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-md cursor-pointer flex items-center justify-center border-none"
          title="Security Portal"
        >
          <span className="w-1 h-1 rounded-full bg-white animate-ping" />
        </button>
      </div>

      {/* GATE 1: KYC VERIFICATION GATE */}
      {!isKycVerified ? (
        <div className="p-6 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-850 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-6 h-6 stroke-[2px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black text-zinc-850 dark:text-white">KYC Verification Required</h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
              To comply with financial safety guidelines, you must complete your primary KYC verification before virtual cards can be activated.
            </p>
          </div>
          <button
            onClick={onOpenKyc}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-orange-500/10"
          >
            Complete KYC Verification Now
          </button>
        </div>
      ) : (
        /* GATE 2: CARD ACTIVATION GATE */
        <AnimatePresence mode="wait">
          {!isCreating ? (
            <motion.div
              key="card-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-6"
            >
              {/* Card visual frame - always visible, but blurred/locked if cardActivation !== 'verified' */}
              <div
                className={`relative w-full h-52 bg-gradient-to-br ${currentCard.color} rounded-3xl p-6 text-white shadow-lg overflow-hidden select-none flex flex-col justify-between border border-white/10 transition-all duration-300 ${
                  currentCard.isFrozen ? 'brightness-50 saturate-50' : ''
                }`}
              >
                {/* Visual Glass highlights */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-15%] w-[40%] h-[40%] bg-black/10 rounded-full blur-xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-extrabold opacity-60">
                      Volerapay Virtual Card
                    </span>
                    <p className="text-xl font-bold tracking-wide mt-1">
                      ₦{currentCard.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs italic uppercase tracking-wider font-black">
                      {currentCard.type}
                    </span>
                  </div>
                </div>

                {/* Card Number */}
                <div className="my-2">
                  <p className="text-lg font-mono tracking-[0.25em]">
                    {cardActivation === 'verified' && revealSecrets 
                      ? currentCard.cardNumber 
                      : `••••  ••••  ••••  ${currentCard.cardNumber.slice(-4)}`}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider opacity-55">Card Holder</span>
                    <p className="text-xs font-bold tracking-wider truncate max-w-[180px] mt-0.5">
                      {currentCard.cardHolder}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider opacity-55">Expiry</span>
                      <p className="text-xs font-mono font-bold mt-0.5">{currentCard.expiryDate}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider opacity-55">CVV</span>
                      <p className="text-xs font-mono font-bold mt-0.5">
                        {cardActivation === 'verified' && revealSecrets ? currentCard.cvv : '•••'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overlay for inactive states */}
                {cardActivation !== 'verified' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/65 backdrop-blur-[2px] p-4 text-center">
                    <Lock className="w-5 h-5 text-orange-500 mb-1.5 animate-bounce" />
                    <span className="text-white text-xs font-bold">Card Details Locked</span>
                    <p className="text-[9px] text-zinc-300 mt-0.5 max-w-[200px]">
                      {cardActivation === 'pending'
                        ? 'Pending approval from compliance'
                        : 'One-time card activation required'}
                    </p>
                  </div>
                )}

                {cardActivation === 'verified' && currentCard.isFrozen && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[1px]">
                    <span className="bg-zinc-900 border border-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-black/20">
                      <Snowflake className="w-3.5 h-3.5 text-orange-400 animate-spin" /> Card is Frozen
                    </span>
                  </div>
                )}
              </div>

              {/* RENDER DEPENDING ON ACTIVATION STATUS */}
              {cardActivation === 'unverified' ? (
                /* ACTIVATION SUBMISSION FORM */
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4.5 h-4.5 text-orange-500" />
                    <h3 className="text-xs font-black uppercase text-zinc-800 dark:text-white tracking-wider">Activate Virtual Card Details</h3>
                  </div>
                  
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Virtual card activation incurs a one-time company fee of <strong className="text-orange-500">₦11,000.00</strong>. Please make a payment transfer to our company account below and upload your payment receipt for instant review.
                  </p>

                  {/* Corporate Bank Account details card */}
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-semibold">Bank Name:</span>
                      <span className="font-extrabold text-zinc-800 dark:text-white">{companyAccount.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-semibold">Account Name:</span>
                      <span className="font-extrabold text-zinc-800 dark:text-white">{companyAccount.accountName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-400 font-semibold">Account Number:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-orange-500">{companyAccount.accountNumber}</span>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-850 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-all cursor-pointer border-none bg-transparent"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-200/50 dark:bg-zinc-850" />

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-semibold">One-time Activation Fee:</span>
                      <span className="font-black text-emerald-500">₦{companyAccount.fee.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Receipt Image Dropzone */}
                  <form onSubmit={handleActivationSubmit} className="space-y-4">
                    {submittingError && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                        {submittingError}
                      </div>
                    )}

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-orange-500 bg-orange-50/10' 
                          : 'border-slate-200 dark:border-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50 dark:bg-zinc-950'
                      }`}
                    >
                      <input
                        type="file"
                        id="card-proof-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="card-proof-upload" className="cursor-pointer block space-y-2">
                        {proof ? (
                          <div className="flex flex-col items-center space-y-1.5">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                            <p className="text-[11px] font-black text-zinc-800 dark:text-white">Receipt Selected!</p>
                            <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[250px]">
                              {proofFileName || 'receipt_screenshot.png'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-1.5">
                            <Upload className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                            <p className="text-[11px] font-black text-zinc-700 dark:text-zinc-300">
                              Upload Payment Screenshot
                            </p>
                            <p className="text-[9px] text-zinc-400">
                              Drag & drop or click to browse (PNG, JPG under 3MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={!proof || isSubmitting}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>Processing Submission...</>
                      ) : (
                        <>Submit Activation Proof (₦11,000) <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                </div>
              ) : cardActivation === 'pending' ? (
                /* PENDING SCREEN */
                <div className="p-6 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-850 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-zinc-800 dark:text-white">Card Activation Pending</h3>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
                      Your <strong>₦11,000</strong> activation payment receipt has been submitted successfully and is currently under review by our security compliance team. Card details will become viewable once approved.
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl text-left flex items-center gap-2">
                    <FileImage className="w-4.5 h-4.5 text-orange-500" />
                    <div className="min-w-0">
                      <span className="text-[8px] font-bold text-zinc-400 block uppercase tracking-wider">Submitted Proof:</span>
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate block">receipt_screenshot.png</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* VERIFIED: FULL VIRTUAL CARD CONTROLS AVAILABLE */
                <>
                  {/* Reveal & Freeze buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRevealSecrets(!revealSecrets)}
                      className="flex-1 py-3.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {revealSecrets ? (
                        <>
                          <EyeOff className="w-4 h-4 text-orange-500" /> Hide Details
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 text-orange-500" /> View Details
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleFreezeToggle}
                      className="flex-1 py-3.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {currentCard.isFrozen ? (
                        <>
                          <Flame className="w-4 h-4 text-emerald-500" /> Unfreeze Card
                        </>
                      ) : (
                        <>
                          <Snowflake className="w-4 h-4 text-orange-500" /> Freeze Card
                        </>
                      )}
                    </button>
                  </div>

                  {/* Load Card funds section */}
                  <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Load Card Balance</h3>
                    <p className="text-[11px] text-zinc-400 mt-1 mb-4">Transfer money from your primary Volerapay wallet to this virtual card instantly.</p>

                    {loadError && (
                      <div className="p-3 mb-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                        {loadError}
                      </div>
                    )}
                    {loadSuccess && (
                      <div className="p-3 mb-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-950/50 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Card loaded successfully!
                      </div>
                    )}

                    <form onSubmit={handleLoadCardBalance} className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₦</span>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={loadAmount}
                          onChange={(e) => setLoadAmount(e.target.value)}
                          disabled={currentCard.isFrozen}
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={currentCard.isFrozen}
                        className="px-5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        Transfer <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Order another Card trigger */}
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-400 dark:text-zinc-600 hover:text-orange-500 dark:hover:text-orange-500 transition-all rounded-3xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer bg-transparent"
                  >
                    <Plus className="w-4 h-4" /> Order New Virtual Card
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            /* Custom Card Creator */
            <motion.form
              key="card-create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateCard}
              className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm w-full space-y-4"
            >
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Order Custom Digital Card</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Configure a card with personalized styling options.</p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Card Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. MARVELOUS"
                  value={newCardHolder}
                  onChange={(e) => setNewCardHolder(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold uppercase focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Card Network</label>
                  <select
                    value={newCardType}
                    onChange={(e) => setNewCardType(e.target.value as any)}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                  >
                    <option value="visa">Visa Network</option>
                    <option value="mastercard">Mastercard</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Card Base Theme</label>
                  <select
                    value={newCardColor}
                    onChange={(e) => setNewCardColor(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                  >
                    <option value="from-orange-500 to-amber-600">Volerapay Orange</option>
                    <option value="from-indigo-600 to-purple-700">Digital Purple</option>
                    <option value="from-zinc-800 to-zinc-950">Metal Stealth Black</option>
                    <option value="from-emerald-500 to-teal-700">Emerald Jade</option>
                    <option value="from-rose-500 to-pink-600">Sunset Ruby</option>
                  </select>
                </div>
              </div>

              {/* Preview Box */}
              <div className={`w-full h-36 bg-gradient-to-br ${newCardColor} rounded-2xl p-4 text-white flex flex-col justify-between border border-white/5 opacity-90`}>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-widest opacity-60">Volerapay Virtual</span>
                  <span className="text-[10px] font-black uppercase italic">{newCardType}</span>
                </div>
                <p className="text-sm font-mono tracking-widest text-center my-1">•••• •••• •••• 1289</p>
                <p className="text-[10px] font-bold tracking-wider truncate uppercase">{newCardHolder || 'YOUR NAME'}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-900 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Confirm Order
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
