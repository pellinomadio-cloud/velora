import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserType } from '../types';
import { Moon, Sun, Shield, LogOut, Mail, User, Calendar, CreditCard, ChevronRight, Check } from 'lucide-react';

interface ProfileTabProps {
  user: UserType;
  onUpdateUser: (updatedUser: UserType) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const AVATARS = ['🧑🏾‍💻', '👩🏽‍🎨', '🧑🏻‍💼', '🦊', '🦁', '🦄', '🐼', '🐨', '🦖'];

export default function ProfileTab({ user, onUpdateUser, onLogout, darkMode, onToggleDarkMode }: ProfileTabProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [pinChangeOpen, setPinChangeOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleSaveUsername = () => {
    if (newUsername.trim().length >= 3) {
      onUpdateUser({ ...user, username: newUsername.trim() });
      setIsEditingName(false);
    }
  };

  const handleSelectAvatar = (emoji: string) => {
    onUpdateUser({ ...user, avatarUrl: emoji });
    setAvatarMenuOpen(false);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess(false);

    if (oldPin !== user.pin) {
      setPinError('Current PIN is incorrect');
      return;
    }
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setPinError('New PIN must be exactly 6 digits');
      return;
    }
    if (newPin === oldPin) {
      setPinError('New PIN must be different from current PIN');
      return;
    }

    onUpdateUser({ ...user, pin: newPin });
    setPinSuccess(true);
    setOldPin('');
    setNewPin('');
    setTimeout(() => {
      setPinChangeOpen(false);
      setPinSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#ECEEF0] dark:bg-zinc-850 flex items-center justify-center relative border-2 border-slate-200/50 dark:border-zinc-700/50 shadow-inner select-none">
            {user.avatarUrl === '🧑🏾‍💻' ? (
              <svg viewBox="0 0 100 100" className="w-20 h-20 select-none">
                <circle cx="50" cy="50" r="50" fill="#ECEEF0" />
                <path d="M43,65 L57,65 L57,75 L43,75 Z" fill="#8D5537" />
                <path d="M25,85 C25,75 35,70 50,70 C65,70 75,75 75,85 L75,100 L25,100 Z" fill="#3F3F46" />
                <circle cx="50" cy="45" r="22" fill="#8D5537" />
                <path d="M28,40 C28,25 35,20 50,20 C65,20 72,25 72,40 C72,32 70,27 65,25 C60,23 40,23 35,25 C30,27 28,32 28,40 Z" fill="#18181B" />
                <path d="M28,45 C28,58 35,68 50,68 C65,68 72,58 72,45 C72,60 62,68 50,68 C38,68 28,60 28,45 Z" fill="#18181B" />
                <rect x="35" cy="40" width="12" height="8" rx="2" fill="none" stroke="#18181B" strokeWidth="2.5" />
                <rect x="53" cy="40" width="12" height="8" rx="2" fill="none" stroke="#18181B" strokeWidth="2.5" />
                <line x1="47" y1="44" x2="53" y2="44" stroke="#18181B" strokeWidth="2.5" />
                <circle cx="41" cy="44" r="2" fill="#18181B" />
                <circle cx="59" cy="44" r="2" fill="#18181B" />
                <path d="M48,47 L52,47 L50,51 Z" fill="#703F25" />
                <path d="M44,56 Q50,60 56,56" fill="none" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-5xl select-none">{user.avatarUrl}</span>
            )}
          </div>
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="absolute bottom-0 right-0 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md hover:scale-105 transition-all text-xs font-bold cursor-pointer"
          >
            Edit
          </button>
        </div>

        {avatarMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-wrap gap-2 justify-center"
          >
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectAvatar(emoji)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-2xl hover:scale-110 active:scale-90 transition-all shadow-sm border border-slate-100 dark:border-zinc-850 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}

        <div className="mt-4 w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2 max-w-[240px] mx-auto">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-center text-zinc-800 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleSaveUsername}
                className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white capitalize">
                {user.username}
              </h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-orange-500 hover:underline font-medium cursor-pointer"
              >
                Rename
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{user.email}</p>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="text-left p-3 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-slate-100/50 dark:border-zinc-850">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total Savings</span>
            <p className="text-base font-bold text-zinc-800 dark:text-white mt-0.5">₦{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="text-left p-3 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-slate-100/50 dark:border-zinc-850">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Member Since</span>
            <p className="text-base font-bold text-zinc-800 dark:text-white mt-0.5">{user.joinedAt}</p>
          </div>
        </div>
      </div>

      {/* Settings Options List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60">
        
        {/* Toggle Dark Mode Option */}
        <div className="flex items-center justify-between p-4 hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 transition-all">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400'}`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-white">Dark Theme Mode</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Toggle dark visual mode across the app</p>
            </div>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer ${
              darkMode ? 'bg-orange-500' : 'bg-slate-200 dark:bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Change Passcode PIN */}
        <div className="p-4">
          <button
            onClick={() => setPinChangeOpen(!pinChangeOpen)}
            className="w-full flex items-center justify-between text-left group bg-transparent border-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/20 text-orange-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-white group-hover:text-orange-500 transition-colors">Change 6-Digit PIN</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Secure your payments and registration PIN</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {pinChangeOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              onSubmit={handleChangePin}
              className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3"
            >
              {pinError && (
                <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-950/50 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Passcode PIN changed successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Current PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white tracking-widest font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">New 6-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white tracking-widest font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Save New Passcode
              </button>
            </motion.form>
          )}
        </div>

        {/* Security Summary & Quick Info */}
        <div className="p-4 flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-950/10">
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-zinc-800 dark:text-white">Authorized Access</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Email triggers security codes to: {user.email}</p>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full py-4 bg-red-500/10 hover:bg-red-500/15 text-red-500 dark:text-red-400 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 border border-red-500/10 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Log Out of Account
      </button>
    </div>
  );
}
