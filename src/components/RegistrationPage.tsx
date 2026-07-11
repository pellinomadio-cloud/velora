import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, User as UserIcon, Lock, CheckCircle2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { User } from '../types';
import { syncUserToFirebase } from '../firebaseSync';

interface RegistrationPageProps {
  onRegisterComplete: (user: User) => void;
  onNavigateToLogin: () => void;
}

const AVATAR_PRESETS = [
  { id: 'avatar_1', emoji: '🧑🏾‍💻', label: 'Techie Male', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
  { id: 'avatar_2', emoji: '👩🏽‍🎨', label: 'Creative Female', bg: 'bg-rose-100 dark:bg-rose-950/40' },
  { id: 'avatar_3', emoji: '🧑🏻‍💼', label: 'Finance Professional', bg: 'bg-amber-100 dark:bg-amber-950/40' },
  { id: 'avatar_4', emoji: '🦊', label: 'Clever Fox', bg: 'bg-orange-100 dark:bg-orange-950/40' },
  { id: 'avatar_5', emoji: '🦁', label: 'Crypto Lion', bg: 'bg-indigo-100 dark:bg-indigo-950/40' },
  { id: 'avatar_6', emoji: '🦄', label: 'Fintech Unicorn', bg: 'bg-purple-100 dark:bg-purple-950/40' },
];

export default function RegistrationPage({ onRegisterComplete, onNavigateToLogin }: RegistrationPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Profile Info, 2: Choose Avatar, 3: Set 6-Digit PIN
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarId, setAvatarId] = useState('avatar_1');
  const [pin, setPin] = useState('');
  
  const [error, setError] = useState('');

  // Handle Form Submission for Step 1
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setStep(2);
  };

  // Handle Step 2 Submit
  const handleStep2Submit = () => {
    setStep(3);
  };

  // Append digit to 6-digit password
  const handleDigitPress = (digit: string) => {
    setError('');
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  // Backspace PIN
  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // Complete Registration
  const handleRegister = () => {
    if (pin.length !== 6) {
      setError('Please enter a full 6-digit numeric PIN');
      return;
    }

    const newUser: User = {
      username: username.toLowerCase().trim(),
      email: email.trim(),
      pin,
      balance: 0.00, // Pre-fund registration with ₦0.00 naira for real onboarding!
      hideBalance: false,
      avatarUrl: AVATAR_PRESETS.find((a) => a.id === avatarId)?.emoji || '🧑🏾‍💻',
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      darkMode: false,
    };

    // Save user to localStorage
    const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
    // Check if account already exists
    const exists = accounts.some((acc: any) => acc.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      setError('An account with this email already exists.');
      setStep(1); // Go back to start
      return;
    }

    accounts.push(newUser);
    localStorage.setItem('velora_accounts', JSON.stringify(accounts));
    localStorage.setItem('velora_current_user', JSON.stringify(newUser));

    // Async sync to Firebase
    syncUserToFirebase(newUser).catch(err => console.error('Firebase registration sync failed:', err));

    onRegisterComplete(newUser);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
      {/* Background Graphic Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-800/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />

      {/* Main Framework Box */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden relative transition-all duration-300">
        
        {/* Branding header */}
        <div className="pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/20">
              V
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Velora</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Your gorgeous borderless digital wallet</p>
        </div>

        {/* Step Progress Bar */}
        <div className="px-8 flex items-center justify-between gap-2 mb-6">
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
            <div className={`h-full bg-orange-500 transition-all duration-300 ${step >= 1 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
            <div className={`h-full bg-orange-500 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
            <div className={`h-full bg-orange-500 transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>

        {/* Dynamic content with transitions */}
        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Create Account</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6">
                  Get started in seconds. No verification required for demo mode.
                </p>

                <form onSubmit={handleStep1Submit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="e.g. marvelous_olatunji"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                      <input
                        type="email"
                        placeholder="e.g. user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 py-3.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-zinc-900/10 dark:shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Already have an account?{' '}
                  <button
                    onClick={onNavigateToLogin}
                    className="text-orange-500 hover:underline font-semibold bg-transparent border-none cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setStep(1)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Choose Avatar</h2>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6">
                  Select a beautiful avatar to personalize your Velora dashboard layout.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatarId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setAvatarId(preset.id)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30'
                            : 'border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-100 dark:hover:bg-zinc-850'
                        }`}
                      >
                        <span className="text-3xl">{preset.emoji}</span>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center truncate w-full">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleStep2Submit}
                  className="w-full py-3.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-zinc-900/10 dark:shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Configure PIN passcode <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-full flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setStep(2)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 self-start"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-white">6-Digit Passcode</h2>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mb-6 self-start">
                  Secure your digital wallet with a standard numeric PIN code.
                </p>

                {error && (
                  <div className="w-full p-3 mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                    {error}
                  </div>
                )}

                {/* Bullets indicator */}
                <div className="flex gap-4 mb-8">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const isFilled = pin.length > i;
                    return (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                          isFilled
                            ? 'bg-orange-500 border-orange-500 scale-110 shadow-md shadow-orange-500/20'
                            : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Custom numeric pad */}
                <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-[280px] w-full mb-8">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigitPress(num)}
                      className="w-16 h-16 rounded-full border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-100 dark:hover:bg-zinc-850 text-xl font-bold text-zinc-800 dark:text-white flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="w-16 h-16 rounded-full text-sm font-semibold text-zinc-400 dark:text-zinc-500 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all cursor-pointer select-none"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitPress('0')}
                    className="w-16 h-16 rounded-full border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-100 dark:hover:bg-zinc-850 text-xl font-bold text-zinc-800 dark:text-white flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={pin.length !== 6}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all select-none ${
                      pin.length === 6
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
