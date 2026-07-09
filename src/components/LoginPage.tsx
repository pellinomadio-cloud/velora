import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLoginComplete: (user: User) => void;
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onLoginComplete, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !pin.trim()) {
      setError('Both email and PIN are required.');
      return;
    }

    const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
    const matchedUser = accounts.find(
      (acc: User) => acc.email.toLowerCase() === email.toLowerCase().trim() && acc.pin === pin
    );

    if (!matchedUser) {
      setError('Invalid email or 6-digit PIN code. Please try again.');
      return;
    }

    localStorage.setItem('velora_current_user', JSON.stringify(matchedUser));
    onLoginComplete(matchedUser);
  };

  // Add digit to pin
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

  // Quick autofill demo credentials
  const loadDemoCredentials = () => {
    const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
    if (accounts.length > 0) {
      setEmail(accounts[0].email);
      setPin(accounts[0].pin);
    } else {
      // Seed a default demo account
      const demoUser: User = {
        username: 'marvelous olatunji',
        email: 'marvelous@velora.com',
        pin: '123456',
        balance: 150000.00,
        hideBalance: false,
        avatarUrl: '🧑🏾‍💻',
        joinedAt: 'July 2026',
        darkMode: false,
      };
      localStorage.setItem('velora_accounts', JSON.stringify([demoUser]));
      setEmail(demoUser.email);
      setPin(demoUser.pin);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-800/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden p-8 relative transition-all duration-300">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/20">
              V
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Velora</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back to your borderless digital wallet</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="email"
                placeholder="e.g. marvelous@velora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">6-Digit Passcode PIN</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 6) setPin(val);
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm tracking-widest font-bold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Quick PIN Pad for easier pin entry on screen if needed */}
          <div className="flex gap-1.5 justify-center py-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
              <button
                type="button"
                key={digit}
                onClick={() => handleDigitPress(digit)}
                className="w-8 h-8 rounded-full border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center justify-center transition-all cursor-pointer"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-zinc-900/10 dark:shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            Log In <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 items-center text-center">
          <button
            type="button"
            onClick={loadDemoCredentials}
            className="text-xs text-orange-500 hover:underline font-semibold bg-transparent border-none cursor-pointer"
          >
            Use Demo Credentials
          </button>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-orange-500 hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
