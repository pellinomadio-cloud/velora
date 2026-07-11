import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, KeyRound, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { User, Transaction } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  syncUserToFirebase, 
  getAllUsersFromFirebase, 
  syncTransactionToFirebase 
} from '../firebaseSync';

interface LoginPageProps {
  onLoginComplete: (user: User) => void;
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onLoginComplete, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Google Auth pending registration states
  const [googlePendingUser, setGooglePendingUser] = useState<{ email: string; displayName?: string } | null>(null);
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingPin, setPendingPin] = useState('');
  const [pendingReferralCode, setPendingReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
            onLoginComplete(firebaseUser); // This will render the suspension page
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
          onLoginComplete(firebaseUser);
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
        referrerUser = allUsers.find(u => u.username.toLowerCase() === cleanReferral) || null;
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
        referralCode: cleanUsername,
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
      onLoginComplete(newUser);
    } catch (err) {
      console.error('Failed to complete Google registration:', err);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !pin.trim()) {
      setError('Both email and PIN are required.');
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();

    try {
      // 1. Try to fetch user from Firebase
      const userRef = doc(db, 'users', trimmedEmail);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const firebaseUser = snap.data() as User;
        if (firebaseUser.pin === pin) {
          // Success! Save to local storage & login
          const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
          const idx = accounts.findIndex((a: User) => a.email.toLowerCase() === trimmedEmail);
          if (idx !== -1) {
            accounts[idx] = firebaseUser;
          } else {
            accounts.push(firebaseUser);
          }
          localStorage.setItem('velora_accounts', JSON.stringify(accounts));
          localStorage.setItem('velora_current_user', JSON.stringify(firebaseUser));
          onLoginComplete(firebaseUser);
          return;
        } else {
          setError('Invalid email or 6-digit PIN code. Please try again.');
          return;
        }
      }
    } catch (err) {
      console.warn('Firebase login check failed, falling back to local database:', err);
    }

    // 2. Fallback to LocalStorage
    const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
    const matchedUser = accounts.find(
      (acc: User) => acc.email.toLowerCase() === trimmedEmail && acc.pin === pin
    );

    if (!matchedUser) {
      setError('Invalid email or 6-digit PIN code. Please try again.');
      return;
    }

    localStorage.setItem('velora_current_user', JSON.stringify(matchedUser));
    
    // Attempt async sync to firebase since they logged in locally
    syncUserToFirebase(matchedUser).catch(err => console.error('Failed to sync on local login:', err));
    
    onLoginComplete(matchedUser);
  };

  // Add digit to pin
  const handleDigitPress = (digit: string) => {
    setError('');
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  // Pin backspace helper
  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  if (isDomainError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-800/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 relative transition-all duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Authorize App Domain</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Firebase requires authorization to allow Google Account Sign-In</p>
          </div>

          <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300">
            <p className="leading-relaxed">
              Google Sign-In failed because this application's domain is not yet allowlisted in your Firebase project. To enable it, follow these steps:
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
              Try Sign-In Again
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
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
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
                placeholder="e.g. marvelous@volerapay.com"
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

        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-slate-100 dark:border-zinc-800 w-full absolute" />
          <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 relative z-10 uppercase tracking-wider">
            Or Continue With
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.5l3.85 2.99C6.16 6.88 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.3-4.8 3.3-8.42z"
              />
              <path
                fill="#FBBC05"
                d="M5.24 14.51c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.39 7.5C.5 9.3 0 11.1 0 13s.5 3.7 1.39 5.5l3.85-2.99z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.09 7.96-2.96l-3.6-2.79c-.99.66-2.26 1.07-3.6 1.07-3.13 0-5.84-1.84-6.76-4.51L1.39 16.8C3.37 20.35 7.35 23 12 23z"
              />
            </svg>
          )}
          <span>Google Account</span>
        </button>

        <div className="mt-6 flex flex-col gap-2 items-center text-center">
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
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
