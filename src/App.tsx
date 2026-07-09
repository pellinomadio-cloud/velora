import React, { useState, useEffect } from 'react';
import { User } from './types';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

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
    const accounts = localStorage.getItem('velora_accounts');
    if (!accounts) {
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
      localStorage.setItem('velora_accounts', JSON.stringify([demoAccount]));
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
        <Dashboard
          user={currentUser}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
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
