import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, QrCode, Store, Sparkles, Send, ShieldCheck, Check } from 'lucide-react';
import { User } from '../types';

interface ScanPayTabProps {
  user: User;
  onDeductBalance: (amount: number) => void;
  onAddTransaction: (tx: any) => void;
}

const MOCK_MERCHANTS = [
  { id: 'm1', name: 'Starbucks Coffee', category: 'Food & Dining', rate: '₦2,400.00', amount: 2400 },
  { id: 'm2', name: 'Ikea Furniture', category: 'Shopping', rate: '₦45,000.00', amount: 45000 },
  { id: 'm3', name: 'Total Energies Fuel', category: 'Gas & Auto', rate: '₦12,500.00', amount: 12500 },
  { id: 'm4', name: 'Netflix Premium Monthly', category: 'Entertainment', rate: '₦5,600.00', amount: 5600 },
];

export default function ScanPayTab({ user, onDeductBalance, onAddTransaction }: ScanPayTabProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<typeof MOCK_MERCHANTS[0] | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [customQrCode, setCustomQrCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScanMerchant = (merchant: typeof MOCK_MERCHANTS[0]) => {
    setIsScanning(false);
    setSelectedMerchant(merchant);
    setErrorMsg('');
  };

  const handleConfirmPayment = () => {
    if (!selectedMerchant) return;
    setErrorMsg('');

    if (user.balance < selectedMerchant.amount) {
      setErrorMsg(`Insufficient funds to pay ${selectedMerchant.name}. Required: ₦${selectedMerchant.amount.toLocaleString()}.`);
      return;
    }

    // Process payment
    onDeductBalance(selectedMerchant.amount);

    // Create transaction
    const tx = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'bills' as const,
      title: selectedMerchant.name,
      subtitle: `Paid via Velora ScanPay QR code`,
      amount: selectedMerchant.amount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed' as const,
      reference: `QR-${selectedMerchant.id.toUpperCase()}-${Math.floor(Math.random() * 9999)}`
    };
    onAddTransaction(tx);

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedMerchant(null);
      setIsScanning(true);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Frame */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm text-center">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center justify-center gap-2">
          <Scan className="w-5 h-5 text-orange-500 animate-pulse" /> Velora ScanPay QR
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          Scan to pay merchants or transfer immediately. No manual entry needed.
        </p>

        {/* Mock Scanner Viewport */}
        {isScanning && (
          <div className="my-6 relative max-w-[240px] h-[240px] mx-auto rounded-3xl border-2 border-orange-500 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
            {/* Green glowing horizontal scanner bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 shadow-[0_0_15px_#f97316] animate-bounce duration-3000" />
            
            {/* Corner Bracket Accents */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />

            {/* Simulated QR Pattern */}
            <div className="opacity-80 scale-95 hover:scale-100 transition-all duration-300">
              <QrCode className="w-28 h-28 text-white/90" />
            </div>

            <span className="absolute bottom-4 text-[9px] font-bold text-white uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
              Align QR Code inside brackets
            </span>
          </div>
        )}

        {/* Scanned/Invoice Checkout State */}
        {!isScanning && selectedMerchant && (
          <div className="my-6 p-6 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 max-w-[280px] mx-auto text-left relative overflow-hidden">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center text-center justify-center space-y-3"
              >
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-500 shadow-md">
                  <Check className="w-8 h-8 stroke-[3px]" />
                </div>
                <h3 className="text-sm font-extrabold text-zinc-800 dark:text-white">Payment Successful</h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Transferred ₦{selectedMerchant.amount.toLocaleString()} directly to merchant.</p>
              </motion.div>
            ) : (
              <div>
                <span className="text-[9px] font-bold uppercase text-orange-500 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded">
                  QR Merchant Invoice
                </span>
                
                <div className="flex items-start gap-2.5 mt-3">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-white">{selectedMerchant.name}</h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{selectedMerchant.category}</p>
                  </div>
                </div>

                <div className="my-4 pt-4 border-t border-dashed border-slate-200 dark:border-zinc-850 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Invoice Amount</span>
                  <span className="text-base font-black text-zinc-800 dark:text-white">{selectedMerchant.rate}</span>
                </div>

                {errorMsg && (
                  <p className="text-[10px] font-medium text-red-500 dark:text-red-400 mb-4">{errorMsg}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsScanning(true);
                      setSelectedMerchant(null);
                    }}
                    className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-900 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-orange-500/10"
                  >
                    Pay Now <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Predefined Merchant Shortcuts (Simulate Instant QR code scans) */}
        {isScanning && (
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Simulate Merchant QR Scans
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {MOCK_MERCHANTS.map((merchant) => (
                <button
                  key={merchant.id}
                  onClick={() => handleScanMerchant(merchant)}
                  className="p-3 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-850 text-left rounded-2xl flex flex-col justify-between transition-all cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate w-full">
                    {merchant.name}
                  </div>
                  <div className="text-[10px] text-orange-500 font-black mt-2">
                    {merchant.rate}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
