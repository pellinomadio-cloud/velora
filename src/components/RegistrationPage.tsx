import React, { useState, useEffect } from 'react';
import { Mail, User as UserIcon, Lock, ArrowRight, Gift } from 'lucide-react';
import { User, Transaction } from '../types';
import { 
  syncUserToFirebase, 
  getAllUsersFromFirebase, 
  syncTransactionToFirebase 
} from '../firebaseSync';

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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarId, setAvatarId] = useState('avatar_1');
  const [pin, setPin] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref.trim());
      }
    } catch (e) {
      console.error('Error parsing URL referral code', e);
    }
  }, []);

  // Complete Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanReferral = referralCode.trim().toLowerCase();

    // Validations
    if (!cleanUsername) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }
    if (!cleanEmail) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 numeric digits');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch all existing users to validate uniqueness and process referral
      const allUsers = await getAllUsersFromFirebase();
      
      // Verify username/email uniqueness
      const emailExists = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        setError('An account with this email already exists.');
        setIsLoading(false);
        return;
      }
      const usernameExists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
      if (usernameExists) {
        setError('This username is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      // Check referral code validity if entered
      let referrerUser: User | null = null;
      if (cleanReferral) {
        // Referral code is the referrer's numeric referralCode or username
        referrerUser = allUsers.find(u => (u.referralCode && u.referralCode.toLowerCase() === cleanReferral) || u.username.toLowerCase() === cleanReferral) || null;
        if (!referrerUser) {
          setError('Referral code not found. Please check or leave blank.');
          setIsLoading(false);
          return;
        }
        if (referrerUser.email.toLowerCase() === cleanEmail || referrerUser.username.toLowerCase() === cleanUsername) {
          setError('You cannot refer yourself.');
          setIsLoading(false);
          return;
        }
      }

      // Initialize base parameters
      let initialBalance = 0.00;
      let newUserReferredBy = '';

      // If referred, set welcome bonus
      if (referrerUser) {
        initialBalance = 2000.00; // ₦2,000 Sign-up Welcome Bonus
        newUserReferredBy = referrerUser.username;
      }

      // Generate a unique 6-digit numeric referral code
      let numericReferralCode = Math.floor(100000 + Math.random() * 900000).toString();
      while (allUsers.some(u => u.referralCode === numericReferralCode)) {
        numericReferralCode = Math.floor(100000 + Math.random() * 900000).toString();
      }

      const newUser: User = {
        username: cleanUsername,
        email: cleanEmail,
        pin,
        balance: initialBalance,
        hideBalance: false,
        avatarUrl: AVATAR_PRESETS.find((a) => a.id === avatarId)?.emoji || '🧑🏾‍💻',
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        darkMode: false,
        referredBy: newUserReferredBy,
        referralCode: numericReferralCode, // Unique 6-digit numeric referral code
        referralCount: 0,
        referralEarnings: 0,
        kycStatus: 'unverified',
        cardActivationStatus: 'unverified'
      };

      // 2. Save new user to Firebase
      await syncUserToFirebase(newUser);

      // If there was a referrer, reward them and update their profile
      if (referrerUser) {
        const referrerUpdated: User = {
          ...referrerUser,
          balance: (referrerUser.balance || 0) + 3000.00, // ₦3,000 commission
          referralCount: (referrerUser.referralCount || 0) + 1,
          referralEarnings: (referrerUser.referralEarnings || 0) + 3000.00
        };

        // Sync referrer update to Firebase
        await syncUserToFirebase(referrerUpdated);

        // Generate Referrer's transaction log
        const referrerTx: Transaction = {
          id: `TX-REF-${Math.floor(100000 + Math.random() * 900000)}`,
          type: 'deposit',
          title: 'Referral Commission',
          subtitle: `Earned ₦3,000 for inviting @${cleanUsername}`,
          amount: 3000,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`
        };

        await syncTransactionToFirebase(referrerUser.email, referrerTx);

        // Also save referrer's transaction locally if they are on this machine
        const refSavedTxs = JSON.parse(localStorage.getItem(`velora_txs_${referrerUser.email}`) || '[]');
        refSavedTxs.unshift(referrerTx);
        localStorage.setItem(`velora_txs_${referrerUser.email}`, JSON.stringify(refSavedTxs));

        // Generate New User's welcome transaction log
        const welcomeTx: Transaction = {
          id: `TX-WEL-${Math.floor(100000 + Math.random() * 900000)}`,
          type: 'deposit',
          title: 'Referral Welcome Bonus',
          subtitle: `Welcome! Invited by @${referrerUser.username}`,
          amount: 2000,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`
        };

        await syncTransactionToFirebase(cleanEmail, welcomeTx);

        // Save new user's transaction locally
        const newUserTxs = [welcomeTx];
        localStorage.setItem(`velora_txs_${cleanEmail}`, JSON.stringify(newUserTxs));

        // Update referrer locally in the accounts list
        const accountsList = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
        const updatedAccountsList = accountsList.map((acc: any) => {
          if (acc.email.toLowerCase() === referrerUser!.email.toLowerCase()) {
            return referrerUpdated;
          }
          return acc;
        });
        updatedAccountsList.push(newUser);
        localStorage.setItem('velora_accounts', JSON.stringify(updatedAccountsList));
      } else {
        // No referrer, just add new user to local accounts
        const accountsList = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
        accountsList.push(newUser);
        localStorage.setItem('velora_accounts', JSON.stringify(accountsList));
      }

      // Save new user as logged in
      localStorage.setItem('velora_current_user', JSON.stringify(newUser));

      onRegisterComplete(newUser);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-300">
      {/* Background Graphic Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-800/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden relative transition-all duration-300">
        
        {/* Branding header */}
        <div className="pt-8 pb-3 text-center px-6">
          <div className="inline-flex items-center justify-center gap-2 mb-1.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-orange-500/20">
              V
            </div>
            <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Volerapay</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Create your borderless multi-currency wallet in seconds</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleRegister} className="px-6 sm:px-8 pb-8 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
              {error}
            </div>
          )}

          {/* Grid Layout for Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="e.g. marvelous"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl text-xs focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl text-xs focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                />
              </div>
            </div>

            {/* 6-Digit PIN passcode */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">6-Digit Passcode PIN</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 6) setPin(val);
                  }}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl text-xs tracking-widest font-bold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                />
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                Referral Code <span className="text-[10px] font-normal text-zinc-400">(Optional)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Friend's Username"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl text-xs focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all placeholder:text-zinc-400/80"
                />
              </div>
            </div>

          </div>

          {/* Choose Avatar - Single Page Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Choose Visual Avatar</label>
              <span className="text-[10px] font-medium text-orange-500 bg-orange-100/50 dark:bg-orange-950/20 px-2 py-0.5 rounded-full">
                Customizes Dashboard
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatarId(preset.id)}
                    disabled={isLoading}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30'
                        : 'border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-100 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{preset.emoji}</span>
                    <span className="text-[8px] font-medium text-zinc-500 dark:text-zinc-400 text-center truncate w-full">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Referral Reward Callout Banner */}
          <div className="p-3 bg-orange-500/5 dark:bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
              <strong className="text-orange-500 dark:text-orange-400 font-semibold">Volerapay Partner Rewards:</strong> Input a friend's referral code to unlock ₦2,000 instant welcome bonus! Your friend gets ₦3,000 commission.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 text-white font-semibold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-zinc-900/10 dark:shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating your wallet...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center w-full">
                Create Account & Claim Bonus <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          {/* Navigate to Login link */}
          <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 pt-2">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              disabled={isLoading}
              className="text-orange-500 hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              Log In
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
