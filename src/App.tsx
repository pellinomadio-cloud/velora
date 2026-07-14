import React, { useState, useEffect } from 'react';
import { User } from './types';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { syncUserToFirebase, seedUsersToFirebase } from './firebaseSync';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'register' | 'login'>('register');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashProgress, setSplashProgress] = useState<number>(0);

  // Splash Screen Loader progress
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowSplash(false), 350); // buttery-smooth transition delay
          return 100;
        }
        return prev + 2;
      });
    }, 25);
    return () => clearInterval(interval);
  }, []);

  // Redirect to register view if a referral link is detected
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isRefPath = window.location.pathname.includes('/ref');
      const hasRefParam = params.has('code') || params.has('ref');
      
      const code = params.get('code') || params.get('ref');
      if (code) {
        const cleanCode = code.trim().toLowerCase();
        sessionStorage.setItem('pending_referral_code', cleanCode);
        localStorage.setItem('pending_referral_code', cleanCode);
      }

      if (isRefPath || hasRefParam) {
        setAuthView('register');
      }
    } catch (e) {
      console.error('Error handling referral routing:', e);
    }
  }, []);

  // Initialize Auth state & Dark Mode preferences
  useEffect(() => {
    // 1. Current User
    const storedUser = localStorage.getItem('velora_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setDarkMode(parsed.darkMode || false);

        // Fetch latest version from Firestore to ensure balance and state are completely accurate on refresh!
        const fetchLatestUser = async () => {
          try {
            const userRef = doc(db, 'users', parsed.email.toLowerCase().trim());
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const latestUser = snap.data() as User;
              setCurrentUser(latestUser);
              setDarkMode(latestUser.darkMode || false);
              localStorage.setItem('velora_current_user', JSON.stringify(latestUser));
            }
          } catch (e) {
            console.error('Failed to auto-refresh user on mount:', e);
          }
        };
        fetchLatestUser();
      } catch (err) {
        console.error('Failed to parse current user:', err);
      }
    }

    // 2. Default Accounts seeding
    const accountsStr = localStorage.getItem('velora_accounts');
    let accounts: User[] = [];
    if (!accountsStr) {
      // Seed a default demo account so the app starts with content immediately!
      const demoAccount: User = {
        username: 'marvelous olatunji',
        email: 'marvelous@velora.com',
        pin: '123456',
        balance: 150000.00, // Pre-funded with ₦150,000 for realistic trades
        hideBalance: false,
        avatarUrl: '🧑🏾‍💻',
        joinedAt: 'July 2026',
        darkMode: false,
      };
      accounts = [demoAccount];
      localStorage.setItem('velora_accounts', JSON.stringify(accounts));
    } else {
      try {
        accounts = JSON.parse(accountsStr);
      } catch (e) {
        console.error('Failed to parse accounts:', e);
      }
    }

    // Seed/Sync existing local accounts to Firestore in background
    if (accounts.length > 0) {
      seedUsersToFirebase(accounts).catch(err => console.error('Seeding users to firebase failed:', err));
    }
  }, []);

  // Sync Dark Mode state to DOM classlist
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleRegisterComplete = (newUser: User) => {
    setCurrentUser(newUser);
    setDarkMode(newUser.darkMode);
  };

  const handleLoginComplete = (user: User) => {
    setCurrentUser(user);
    setDarkMode(user.darkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('velora_current_user');
    setCurrentUser(null);
    setAuthView('login');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('velora_current_user', JSON.stringify(updatedUser));

    // Update in list
    const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
    const index = accounts.findIndex((acc: User) => acc.email.toLowerCase() === updatedUser.email.toLowerCase());
    if (index !== -1) {
      accounts[index] = updatedUser;
      localStorage.setItem('velora_accounts', JSON.stringify(accounts));
    }

    // Sync to Firebase
    syncUserToFirebase(updatedUser).catch(err => console.error('Failed to sync updated user:', err));
  };

  const handleToggleDarkMode = () => {
    if (!currentUser) return;
    const newMode = !darkMode;
    setDarkMode(newMode);
    handleUpdateUser({ ...currentUser, darkMode: newMode });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      {showSplash ? (
        <div className="fixed inset-0 z-[9999] bg-[#090A0C] flex flex-col items-center justify-center p-6 text-white overflow-hidden select-none">
          {/* Ambient Radial Gradient Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.12)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none" />
          
          {/* Subtle decorative grid lines for advanced high-fidelity feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          <div className="flex flex-col items-center max-w-sm w-full text-center space-y-8 relative z-10">
            {/* Logo container with neon ring effect */}
            <div className="relative p-1">
              <svg className="w-24 h-24 drop-shadow-[0_0_25px_rgba(249,115,22,0.45)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="url(#logoGradSplash)" strokeWidth="5" strokeLinecap="round" className="animate-[spin_10s_linear_infinite]" strokeDasharray="180 50" />
                <path d="M50 18 L76 34 V60 L50 82 L24 60 V34 L50 18 Z" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <path d="M32 36 L50 25 L68 36 V58 L50 72 L32 58 V36 Z" fill="url(#innerGradSplash)" />
                <path d="M41 38 H46 L50 54 L54 38 H59 L52 62 H48 L41 38 Z" fill="white" />
                <circle cx="50" cy="71" r="2.5" fill="#F97316" className="animate-ping" />
                <defs>
                  <linearGradient id="logoGradSplash" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="innerGradSplash" x1="32" y1="25" x2="68" y2="72" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(249,115,22,0.2)" />
                    <stop offset="100%" stopColor="rgba(234,88,12,0.02)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* App Title & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-[0.3em] text-white uppercase font-sans">
                VOLERA
              </h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
                Infinite Wealth • Borderless Liquid Yield
              </p>
            </div>

            {/* Loader bar and status */}
            <div className="w-48 space-y-2 pt-4">
              <div className="h-[3px] w-full bg-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-75 ease-out rounded-full"
                  style={{ width: `${splashProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 tracking-wider">
                <span className="uppercase">Loading Secure Shell</span>
                <span>{splashProgress}%</span>
              </div>
            </div>
          </div>

          {/* Brand/Security Compliance Footer */}
          <div className="absolute bottom-8 left-6 right-6 text-center text-[9px] font-medium text-zinc-600 uppercase tracking-[0.15em] leading-relaxed">
            Central Bank Licensed Multi-Currency Ledger
            <br />
            <span className="text-[8px] opacity-60">Volera Digital Bank (v2.4.0) • Encrypted TLS 1.3</span>
          </div>
        </div>
      ) : (
        currentUser ? (
          currentUser.isBanned ? (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-center">
              <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-850 p-8 rounded-3xl shadow-xl space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Volerapay Account Suspended</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your account (<strong className="font-extrabold">{currentUser.email}</strong>) has been restricted and suspended by central security compliance administrators for outstanding fees or terms violation.
                  </p>
                  <p className="text-[11px] text-red-500 font-bold bg-red-50 dark:bg-red-950/10 p-3.5 rounded-2xl border border-red-100 dark:border-red-950/25 leading-relaxed">
                    To appeal or resolve compliance locks, please contact our compliance desk at <strong className="underline">support@volerapay.com</strong>.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
                >
                  Logout of Account
                </button>
              </div>
            </div>
          ) : (
            <Dashboard
              user={currentUser}
              onLogout={handleLogout}
              darkMode={darkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onUpdateUser={handleUpdateUser}
            />
          )
        ) : authView === 'register' ? (
          <RegistrationPage
            onRegisterComplete={handleRegisterComplete}
            onNavigateToLogin={() => setAuthView('login')}
          />
        ) : (
          <LoginPage
            onLoginComplete={handleLoginComplete}
            onNavigateToRegister={() => setAuthView('register')}
          />
        )
      )}
    </div>
  );
}
