import React, { useState, useEffect } from 'react';
import { User } from './types';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { syncUserToFirebase, seedUsersToFirebase } from './firebaseSync';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'register' | 'login'>('register');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Initialize Auth state & Dark Mode preferences
  useEffect(() => {
    // 1. Current User
    const storedUser = localStorage.getItem('velora_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setDarkMode(parsed.darkMode || false);
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
      {currentUser ? (
        currentUser.isBanned ? (
          <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-850 p-8 rounded-3xl shadow-xl space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Velora Account Suspended</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your account (<strong className="font-extrabold">{currentUser.email}</strong>) has been restricted and suspended by central security compliance administrators for outstanding fees or terms violation.
                </p>
                <p className="text-[11px] text-red-500 font-bold bg-red-50 dark:bg-red-950/10 p-3.5 rounded-2xl border border-red-100 dark:border-red-950/25 leading-relaxed">
                  To appeal or resolve compliance locks, please contact our compliance desk at <strong className="underline">support@velora.com</strong>.
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
      )}
    </div>
  );
}
