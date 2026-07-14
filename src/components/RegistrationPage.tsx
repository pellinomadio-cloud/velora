import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, User as UserIcon, Lock, CheckCircle2, ArrowRight, Gift, KeyRound, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { User, Transaction } from '../types';
import { 
  syncUserToFirebase, 
  getAllUsersFromFirebase, 
  syncTransactionToFirebase 
} from '../firebaseSync';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

  // Google Sign-In pending registration states
  const [googlePendingUser, setGooglePendingUser] = useState<{ email: string; displayName?: string } | null>(null);
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingPin, setPendingPin] = useState('');
  const [pendingReferralCode, setPendingReferralCode] = useState('');
  const [isDomainError, setIsDomainError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDomain = () => {
    try {
      navigator.clipboard.writeText(window.location.hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy domain', e);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsDomainError(false);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userObj = result.user;
      if (userObj && userObj.email) {
        const userEmail = userObj.email.toLowerCase().trim();
        
        // Try to fetch user document from Firestore
        const userRef = doc(db, 'users', userEmail);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const firebaseUser = snap.data() as User;
          
          // Check if banned
          if (firebaseUser.isBanned) {
            setError('This account has been suspended by central compliance.');
            setIsLoading(false);
            onRegisterComplete(firebaseUser); // This will render the suspension page
            return;
          }

          // Success! Save to local storage & login
          const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
          const idx = accounts.findIndex((a: User) => a.email.toLowerCase() === userEmail);
          if (idx !== -1) {
            accounts[idx] = firebaseUser;
          } else {
            accounts.push(firebaseUser);
          }
          localStorage.setItem('velora_accounts', JSON.stringify(accounts));
          localStorage.setItem('velora_current_user', JSON.stringify(firebaseUser));
          onRegisterComplete(firebaseUser);
        } else {
          // Doesn't exist, we transition to complete profile step
          const cleanName = (userObj.displayName || '').toLowerCase().replace(/\s+/g, '');
          setPendingUsername(cleanName);
          setGooglePendingUser({
            email: userEmail,
            displayName: userObj.displayName || '',
          });
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('auth/unauthorized-domain') || err?.message?.includes('unauthorized-domain')) {
        setIsDomainError(true);
      } else {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePendingUser) return;
    setError('');
    setIsLoading(true);

    const cleanUsername = pendingUsername.toLowerCase().trim().replace(/\s+/g, '');
    const cleanEmail = googlePendingUser.email.toLowerCase().trim();
    const cleanReferral = pendingReferralCode.trim().toLowerCase();

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
    if (pendingPin.length !== 6 || !/^\d{6}$/.test(pendingPin)) {
      setError('PIN must be exactly 6 numeric digits');
      setIsLoading(false);
      return;
    }

    try {
      const allUsers = await getAllUsersFromFirebase();
      
      // Verify username uniqueness
      const usernameExists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
      if (usernameExists) {
        setError('This username is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }

      // Check referral code validity if entered
      let referrerUser: User | null = null;
      if (cleanReferral) {
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

      if (referrerUser) {
        initialBalance = 2000.00; // ₦2,000 welcome bonus
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
        pin: pendingPin,
        balance: initialBalance,
        hideBalance: false,
        avatarUrl: '🧑🏾‍💻', // Default visual avatar emoji
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        darkMode: false,
        referredBy: newUserReferredBy,
        referralCode: numericReferralCode,
        referralCount: 0,
        referralEarnings: 0,
        kycStatus: 'unverified',
        cardActivationStatus: 'unverified'
      };

      // Save user to Firestore
      await syncUserToFirebase(newUser);

      // Reward referrer if exists
      if (referrerUser) {
        const referrerUpdated: User = {
          ...referrerUser,
          balance: (referrerUser.balance || 0) + 3000.00,
          referralCount: (referrerUser.referralCount || 0) + 1,
          referralEarnings: (referrerUser.referralEarnings || 0) + 3000.00
        };

        await syncUserToFirebase(referrerUpdated);

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

        // Save referrer transaction locally
        const refSavedTxs = JSON.parse(localStorage.getItem(`velora_txs_${referrerUser.email}`) || '[]');
        refSavedTxs.unshift(referrerTx);
        localStorage.setItem(`velora_txs_${referrerUser.email}`, JSON.stringify(refSavedTxs));

        // Create new user welcome transaction log
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

        // Save new user transaction locally
        localStorage.setItem(`velora_txs_${cleanEmail}`, JSON.stringify([welcomeTx]));

        // Update local accounts list
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
        const accountsList = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
        accountsList.push(newUser);
        localStorage.setItem('velora_accounts', JSON.stringify(accountsList));
      }

      // Save as currently logged in user
      localStorage.setItem('velora_current_user', JSON.stringify(newUser));
      onRegisterComplete(newUser);
    } catch (err) {
      console.error('Failed to complete Google registration:', err);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isDomainError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-800/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 relative transition-all duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Authorize App Domain</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Firebase requires authorization to allow Google Account Registration</p>
          </div>

          <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300">
            <p className="leading-relaxed">
              Google Registration failed because this application's domain is not yet allowlisted in your Firebase project. To enable it, follow these steps:
            </p>

            <ol className="list-decimal pl-4 space-y-2.5 font-medium">
              <li>
                Open the{' '}
                <a 
                  href="https://console.firebase.google.com/project/velora-a969e/authentication/settings" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-orange-500 hover:underline inline-flex items-center gap-0.5 font-semibold"
                >
                  Firebase Console Settings <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Click on the <strong className="text-zinc-900 dark:text-white">Authorized domains</strong> option under settings.
              </li>
              <li>
                Click the <strong className="text-zinc-900 dark:text-white">Add domain</strong> button.
              </li>
              <li>
                Paste this domain and click <strong className="text-zinc-950 dark:text-white">Add</strong>:
              </li>
            </ol>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl flex items-center justify-between font-mono text-zinc-800 dark:text-zinc-200 text-xs shadow-inner">
              <span className="truncate pr-2">{window.location.hostname}</span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white rounded-xl text-[10px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="leading-relaxed bg-orange-500/5 border border-orange-500/10 rounded-2xl p-3 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
              💡 <span className="font-bold">Note:</span> If you are using a custom Firebase project instead of <strong className="font-extrabold text-zinc-900 dark:text-white">velora-a969e</strong>, select your corresponding project first in the console, then go to Authentication &rarr; Settings &rarr; Authorized Domains.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex-1 py-3 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-semibold rounded-2xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
            >
              Try Registration Again
            </button>
            <button
              type="button"
              onClick={() => setIsDomainError(false)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (googlePendingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-800/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden p-8 relative transition-all duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/20">
                V
              </div>
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Volerapay</span>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Complete Google Wallet Setup</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure your borderless digital wallet credentials</p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
              {error}
            </div>
          )}

          <form onSubmit={handleGoogleRegistrationSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Verified Google Email</label>
              <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-950/50 border border-slate-200/50 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl text-xs flex items-center justify-between font-medium">
                <span>{googlePendingUser.email}</span>
                <span className="text-[9px] font-black tracking-tight text-emerald-500 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ✓ VERIFIED
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Username</label>
              <input
                type="text"
                placeholder="e.g. marvelous"
                value={pendingUsername}
                onChange={(e) => setPendingUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">6-Digit Passcode PIN</label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={pendingPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 6) setPendingPin(val);
                }}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs tracking-widest font-bold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                Referral Code <span className="text-[10px] font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Friend's Username"
                value={pendingReferralCode}
                onChange={(e) => setPendingReferralCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-zinc-800 dark:text-white transition-all placeholder:text-zinc-400/80"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-semibold rounded-2xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isLoading ? 'Creating wallet...' : 'Create Account & Log In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setGooglePendingUser(null);
                setError('');
              }}
              className="w-full py-2.5 bg-transparent border border-dashed border-slate-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 text-xs font-semibold rounded-2xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

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
