import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Users, ShieldCheck, ShieldAlert, Eye, X, Check, Search, Trash2, RotateCcw } from 'lucide-react';
import { User } from '../types';

interface AdminPanelProps {
  onBack: () => void;
  onRefreshUser: () => void; // Trigger root updates if needed
}

export default function AdminPanel({ onBack, onRefreshUser }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Compliance database
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unverified' | 'pending' | 'verified'>('all');
  
  // Section for switcher: KYC vs. Card Activation
  const [adminSection, setAdminSection] = useState<'kyc' | 'cards'>('kyc');

  // Selected receipt visualizer modal
  const [activeReceiptImg, setActiveReceiptImg] = useState<string | null>(null);
  const [activeReceiptUser, setActiveReceiptUser] = useState<User | null>(null);
  const [receiptType, setReceiptType] = useState<'kyc' | 'card'>('kyc');

  // Load account records
  const loadUsers = () => {
    const saved = localStorage.getItem('velora_accounts');
    if (saved) {
      try {
        setUsersList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse users list', e);
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'MAVELL999') {
      setIsAuthenticated(true);
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Invalid Administrator Passkey. Access Denied.');
    }
  };

  // KYC Status Modifiers
  const handleApproveKyc = (userEmail: string) => {
    const updated = usersList.map((usr) => {
      if (usr.email.toLowerCase() === userEmail.toLowerCase()) {
        return { ...usr, kycStatus: 'verified' as const };
      }
      return usr;
    });

    setUsersList(updated);
    localStorage.setItem('velora_accounts', JSON.stringify(updated));

    // Also update current user if they are the one currently logged in!
    const curr = localStorage.getItem('velora_current_user');
    if (curr) {
      try {
        const parsed: User = JSON.parse(curr);
        if (parsed.email.toLowerCase() === userEmail.toLowerCase()) {
          parsed.kycStatus = 'verified';
          localStorage.setItem('velora_current_user', JSON.stringify(parsed));
        }
      } catch (err) {}
    }
    onRefreshUser();
  };

  const handleRejectKyc = (userEmail: string) => {
    const updated = usersList.map((usr) => {
      if (usr.email.toLowerCase() === userEmail.toLowerCase()) {
        return { ...usr, kycStatus: 'unverified' as const, kycPaymentProof: undefined };
      }
      return usr;
    });

    setUsersList(updated);
    localStorage.setItem('velora_accounts', JSON.stringify(updated));

    // Also update current user
    const curr = localStorage.getItem('velora_current_user');
    if (curr) {
      try {
        const parsed: User = JSON.parse(curr);
        if (parsed.email.toLowerCase() === userEmail.toLowerCase()) {
          parsed.kycStatus = 'unverified';
          parsed.kycPaymentProof = undefined;
          localStorage.setItem('velora_current_user', JSON.stringify(parsed));
        }
      } catch (err) {}
    }
    onRefreshUser();
  };

  // Card Activation Modifiers
  const handleApproveCard = (userEmail: string) => {
    const updated = usersList.map((usr) => {
      if (usr.email.toLowerCase() === userEmail.toLowerCase()) {
        return { ...usr, cardActivationStatus: 'verified' as const };
      }
      return usr;
    });

    setUsersList(updated);
    localStorage.setItem('velora_accounts', JSON.stringify(updated));

    // Also update current user if they are the one currently logged in!
    const curr = localStorage.getItem('velora_current_user');
    if (curr) {
      try {
        const parsed: User = JSON.parse(curr);
        if (parsed.email.toLowerCase() === userEmail.toLowerCase()) {
          parsed.cardActivationStatus = 'verified';
          localStorage.setItem('velora_current_user', JSON.stringify(parsed));
        }
      } catch (err) {}
    }
    onRefreshUser();
  };

  const handleRejectCard = (userEmail: string) => {
    const updated = usersList.map((usr) => {
      if (usr.email.toLowerCase() === userEmail.toLowerCase()) {
        return { ...usr, cardActivationStatus: 'unverified' as const, cardActivationProof: undefined };
      }
      return usr;
    });

    setUsersList(updated);
    localStorage.setItem('velora_accounts', JSON.stringify(updated));

    // Also update current user
    const curr = localStorage.getItem('velora_current_user');
    if (curr) {
      try {
        const parsed: User = JSON.parse(curr);
        if (parsed.email.toLowerCase() === userEmail.toLowerCase()) {
          parsed.cardActivationStatus = 'unverified';
          parsed.cardActivationProof = undefined;
          localStorage.setItem('velora_current_user', JSON.stringify(parsed));
        }
      } catch (err) {}
    }
    onRefreshUser();
  };

  // Reset user balance (to help test ₦0.00 naira logic easily)
  const handleResetBalance = (userEmail: string) => {
    const updated = usersList.map((usr) => {
      if (usr.email.toLowerCase() === userEmail.toLowerCase()) {
        return { ...usr, balance: 0.00 };
      }
      return usr;
    });

    setUsersList(updated);
    localStorage.setItem('velora_accounts', JSON.stringify(updated));

    const curr = localStorage.getItem('velora_current_user');
    if (curr) {
      try {
        const parsed: User = JSON.parse(curr);
        if (parsed.email.toLowerCase() === userEmail.toLowerCase()) {
          parsed.balance = 0.00;
          localStorage.setItem('velora_current_user', JSON.stringify(parsed));
        }
      } catch (err) {}
    }
    onRefreshUser();
  };

  // Filter and search
  const filteredUsers = usersList.filter((usr) => {
    const matchesSearch =
      usr.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusVal = adminSection === 'kyc' 
      ? (usr.kycStatus || 'unverified') 
      : (usr.cardActivationStatus || 'unverified');
      
    const matchesFilter = filterStatus === 'all' || statusVal === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-red-600 dark:text-red-500 tracking-tight flex items-center gap-1.5">
            Compliance Command Hub
          </h2>
          <p className="text-[10px] text-zinc-400">Verifications & Security Operations</p>
        </div>
      </div>

      {!isAuthenticated ? (
        // Auth gate
        <div className="flex-1 flex flex-col justify-center items-center px-4 max-w-sm mx-auto w-full py-12">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mb-4 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-white text-center mb-1">Administrative Sign-In</h3>
          <p className="text-[11px] text-zinc-400 text-center mb-6">Enter secure credentials to manage accounts and approve KYC activations.</p>

          {loginError && (
            <div className="w-full p-3 mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded-xl border border-red-100 dark:border-red-950/50">
              {loginError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Security Passkey</label>
              <input
                type="password"
                placeholder="Enter admin password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold tracking-widest text-center focus:outline-none focus:border-red-500 text-zinc-800 dark:text-white"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              Authorize Access
            </button>
          </form>
        </div>
      ) : (
        // Admin workspace
        <div className="flex-1 flex flex-col min-h-0 space-y-4 pb-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Total accounts</span>
              <span className="text-sm font-black text-zinc-800 dark:text-white mt-1">{usersList.length}</span>
            </div>
            <div className="p-3 bg-orange-50/50 dark:bg-orange-950/10 rounded-2xl border border-orange-100/20 dark:border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">Pending KYC</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400 mt-1">
                {usersList.filter(u => u.kycStatus === 'pending').length}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/20 dark:border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Pending Cards</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {usersList.filter(u => u.cardActivationStatus === 'pending').length}
              </span>
            </div>
          </div>

          {/* Section Selector Switcher */}
          <div className="flex gap-2 p-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800 rounded-2xl">
            <button
              onClick={() => {
                setAdminSection('kyc');
                setFilterStatus('all');
              }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border-none ${
                adminSection === 'kyc'
                  ? 'bg-zinc-900 dark:bg-orange-500 text-white shadow-md'
                  : 'bg-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              KYC Verifications ({usersList.filter(u => u.kycStatus === 'pending').length})
            </button>
            <button
              onClick={() => {
                setAdminSection('cards');
                setFilterStatus('all');
              }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border-none ${
                adminSection === 'cards'
                  ? 'bg-zinc-900 dark:bg-orange-500 text-white shadow-md'
                  : 'bg-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              Card Activations ({usersList.filter(u => u.cardActivationStatus === 'pending').length})
            </button>
          </div>

          {/* Search and filter controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none focus:border-red-500 text-zinc-800 dark:text-white"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'verified', label: 'Verified / Active' },
                { id: 'unverified', label: 'Unverified / Inactive' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    filterStatus === tab.id
                      ? 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-zinc-500 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* User compliance rows */}
          <div className="flex-1 overflow-y-auto no-scrollbar border border-slate-100 dark:border-zinc-850 rounded-3xl divide-y divide-slate-100 dark:divide-zinc-850">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-xs text-zinc-400 py-12">No matching accounts found.</p>
            ) : (
              filteredUsers.map((usr) => {
                const isKycType = adminSection === 'kyc';
                const statusVal = isKycType ? (usr.kycStatus || 'unverified') : (usr.cardActivationStatus || 'unverified');
                const proofImg = isKycType ? usr.kycPaymentProof : usr.cardActivationProof;

                return (
                  <div key={usr.email} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-zinc-800 dark:text-white truncate max-w-[120px]">
                            {usr.username}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            statusVal === 'verified'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : statusVal === 'pending'
                                ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 animate-pulse'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                          }`}>
                            {isKycType ? 'KYC: ' : 'CARD: '}{statusVal.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[180px]">{usr.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block font-bold">Primary balance</span>
                        <span className="text-xs font-black text-zinc-900 dark:text-white">₦{usr.balance.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions and Proof Display */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-100 dark:border-zinc-850">
                      {/* Left: display receipt if exists */}
                      <div>
                        {proofImg ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceiptImg(proofImg);
                              setActiveReceiptUser(usr);
                              setReceiptType(isKycType ? 'kyc' : 'card');
                            }}
                            className="px-2.5 py-1.5 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 border border-orange-100/50 dark:border-orange-950/40 text-orange-600 dark:text-orange-400 text-[9px] font-black rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-[9px] text-zinc-400 font-medium italic">No receipt uploaded</span>
                        )}
                      </div>

                      {/* Right: administrative controls */}
                      <div className="flex items-center gap-1">
                        {statusVal !== 'verified' && (
                          <button
                            onClick={() => {
                              if (isKycType) {
                                handleApproveKyc(usr.email);
                              } else {
                                handleApproveCard(usr.email);
                              }
                            }}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm"
                            title={isKycType ? 'Approve KYC' : 'Approve Card Activation'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {statusVal !== 'unverified' && (
                          <button
                            onClick={() => {
                              if (isKycType) {
                                handleRejectKyc(usr.email);
                              } else {
                                handleRejectCard(usr.email);
                              }
                            }}
                            className="p-1.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-red-500 hover:text-white text-zinc-500 dark:text-zinc-400 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            title={isKycType ? 'Reject KYC' : 'Reject Card Activation'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {usr.balance > 0 && (
                          <button
                            onClick={() => handleResetBalance(usr.email)}
                            className="p-1.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-red-500 hover:text-white text-zinc-400 dark:text-zinc-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            title="Reset Balance to ₦0.00"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Receipt Image */}
      {activeReceiptImg && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center text-white border-b border-zinc-800 pb-4">
            <div>
              <p className="text-xs font-bold text-zinc-400">
                {receiptType === 'kyc' ? 'KYC Proof' : 'Virtual Card Activation Proof'}
              </p>
              <h4 className="text-sm font-black text-white">{activeReceiptUser?.username}</h4>
            </div>
            <button
              onClick={() => {
                setActiveReceiptImg(null);
                setActiveReceiptUser(null);
              }}
              className="p-2 bg-zinc-850 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Image stage */}
          <div className="flex-1 flex items-center justify-center overflow-hidden py-6">
            <img
              src={activeReceiptImg}
              alt="Transfer Proof receipt screenshot"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/5"
            />
          </div>

          {/* Action Footer */}
          <div className="flex gap-4 border-t border-zinc-800 pt-4">
            <button
              onClick={() => {
                if (activeReceiptUser) {
                  if (receiptType === 'kyc') {
                    handleRejectKyc(activeReceiptUser.email);
                  } else {
                    handleRejectCard(activeReceiptUser.email);
                  }
                  setActiveReceiptImg(null);
                  setActiveReceiptUser(null);
                }
              }}
              className="flex-1 py-3 bg-zinc-800 hover:bg-red-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Decline Proof
            </button>
            <button
              onClick={() => {
                if (activeReceiptUser) {
                  if (receiptType === 'kyc') {
                    handleApproveKyc(activeReceiptUser.email);
                  } else {
                    handleApproveCard(activeReceiptUser.email);
                  }
                  setActiveReceiptImg(null);
                  setActiveReceiptUser(null);
                }
              }}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              Approve Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
