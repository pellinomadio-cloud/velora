import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Copy, Check, Users, TrendingUp, Sparkles, Send, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { User, Transaction } from '../types';
import { 
  getAllUsersFromFirebase, 
  syncUserToFirebase, 
  syncTransactionToFirebase 
} from '../firebaseSync';

interface ScanPayTabProps {
  user: User;
  onDeductBalance: (amount: number) => void;
  onAddTransaction: (tx: any) => void;
  onUpdateUser?: (user: User) => void;
}

export default function ScanPayTab({ user, onDeductBalance, onAddTransaction, onUpdateUser }: ScanPayTabProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referredUsers, setReferredUsers] = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Simulation Form States
  const [simName, setSimName] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simPin, setSimPin] = useState('123456');
  const [simError, setSimError] = useState('');
  const [simSuccess, setSimSuccess] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Copy helpers
  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.username.toLowerCase());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `https://volerapay.com/register?ref=${user.username.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Load referred users list
  const loadReferredUsers = async () => {
    setLoadingList(true);
    try {
      const allUsers = await getAllUsersFromFirebase();
      const filtered = allUsers.filter(u => u.referredBy?.toLowerCase() === user.username.toLowerCase());
      setReferredUsers(filtered);
    } catch (err) {
      console.warn('Failed to fetch referrals list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadReferredUsers();
  }, [user.username]);

  // Handle Invitation Simulation
  const handleSimulateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimError('');
    setSimSuccess('');
    setIsSimulating(true);

    const cleanName = simName.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = simEmail.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      setSimError('Username must be at least 3 characters');
      setIsSimulating(false);
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setSimError('Please enter a valid email address');
      setIsSimulating(false);
      return;
    }
    if (simPin.length !== 6 || !/^\d+$/.test(simPin)) {
      setSimError('PIN must be 6 numeric digits');
      setIsSimulating(false);
      return;
    }

    try {
      const allUsers = await getAllUsersFromFirebase();
      
      // Check uniqueness
      const emailExists = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        setSimError('A simulated user with this email already exists.');
        setIsSimulating(false);
        return;
      }
      const usernameExists = allUsers.some(u => u.username.toLowerCase() === cleanName);
      if (usernameExists) {
        setSimError('This username is already taken by another simulated user.');
        setIsSimulating(false);
        return;
      }

      // Create simulated friend user
      const friendAvatar = ['👩🏽‍🎨', '🦊', '🦁', '🦄', '🧑🏻‍💼', '🧑🏾‍💻'][Math.floor(Math.random() * 6)];
      const simulatedFriend: User = {
        username: cleanName,
        email: cleanEmail,
        pin: simPin,
        balance: 2000.00, // Pre-funded with sign-up welcome bonus!
        hideBalance: false,
        avatarUrl: friendAvatar,
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        darkMode: false,
        referredBy: user.username,
        referralCode: cleanName,
        referralCount: 0,
        referralEarnings: 0,
        kycStatus: 'unverified',
        cardActivationStatus: 'unverified'
      };

      // 1. Save new simulated friend to Firebase
      await syncUserToFirebase(simulatedFriend);

      // Create transaction log for simulated friend's welcome bonus
      const friendTx: Transaction = {
        id: `TX-WEL-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'deposit',
        title: 'Referral Welcome Bonus',
        subtitle: `Welcome to Volerapay! Invited by @${user.username}`,
        amount: 2000,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`
      };
      await syncTransactionToFirebase(cleanEmail, friendTx);

      // Also save locally
      localStorage.setItem(`velora_txs_${cleanEmail}`, JSON.stringify([friendTx]));

      // 2. Update current logged-in user profile
      const updatedCurrentUser: User = {
        ...user,
        balance: (user.balance || 0) + 3000.00, // Earn ₦3,000 commission!
        referralCount: (user.referralCount || 0) + 1,
        referralEarnings: (user.referralEarnings || 0) + 3000.00
      };

      await syncUserToFirebase(updatedCurrentUser);

      // Create transaction log for current user's referral commission
      const commissionTx: Transaction = {
        id: `TX-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'deposit',
        title: 'Referral Commission',
        subtitle: `Invited @${cleanName} successfully`,
        amount: 3000,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`
      };
      await syncTransactionToFirebase(user.email, commissionTx);

      // Trigger app state updates
      onAddTransaction(commissionTx);
      if (onUpdateUser) {
        onUpdateUser(updatedCurrentUser);
      }

      // Add to local registered accounts list
      const accountsList = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
      accountsList.push(simulatedFriend);
      localStorage.setItem('velora_accounts', JSON.stringify(accountsList));

      // Clear input fields & show success message
      setSimName('');
      setSimEmail('');
      setSimSuccess(`Successfully simulated registration! ₦3,000 commission has been added to your balance, and @${cleanName} was pre-funded with ₦2,000 welcome reward!`);
      
      // Reload referrals list
      loadReferredUsers();
    } catch (err) {
      console.error('Simulation failed:', err);
      setSimError('Simulation failed. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Invitation Panel */}
      <div className="p-6 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/15 dark:border-orange-500/10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[25%] h-[25%] bg-orange-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
            <Gift className="w-7 h-7" />
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
              Volerapay Partner Rewards
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Invite partners to Volerapay. Get <strong className="text-orange-500 font-bold">₦3,000</strong> commission on sign-up. They get <strong className="text-orange-500 font-bold">₦2,000</strong> welcome bonus instantly!
            </p>
          </div>
        </div>

        {/* Copy Referral Details block */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-slate-100 dark:border-zinc-850">
          
          {/* Referral Code */}
          <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Your Referral Code</span>
              <span className="text-sm font-extrabold text-zinc-800 dark:text-white font-mono lowercase tracking-wide">{user.username.toLowerCase()}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`p-2 rounded-xl transition-all ${
                copiedCode 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer'
              }`}
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Referral Link */}
          <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Referral Link</span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[150px] sm:max-w-[180px] block">
                volerapay.com/?ref={user.username.toLowerCase()}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-xl transition-all ${
                copiedLink 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        
        {/* Total Invites */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total Referrals</span>
            <span className="text-base font-black text-zinc-800 dark:text-white mt-1">
              {user.referralCount || 0}
            </span>
          </div>
        </div>

        {/* Passive Earnings */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total Earnings</span>
            <span className="text-base font-black text-emerald-500 mt-1">
              ₦{(user.referralEarnings || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Reward Status */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Current Rate</span>
            <span className="text-base font-black text-zinc-800 dark:text-white mt-1">
              ₦3K <span className="text-[10px] text-zinc-400 font-normal">/ invite</span>
            </span>
          </div>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Simulation Invitation Form */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-850">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Simulate Partner Registration</h3>
          </div>
          
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Test the referral loops on-screen! Enter details for a simulated friend registering with your code. Both wallets will update and fund in real-time.
          </p>

          <form onSubmit={handleSimulateInvitation} className="space-y-3">
            {simError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] rounded-xl border border-red-100 dark:border-red-950/50">
                {simError}
              </div>
            )}

            {simSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] rounded-xl border border-emerald-100 dark:border-emerald-950/50 leading-relaxed">
                {simSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Username</label>
                <input
                  type="text"
                  placeholder="e.g. olawale"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value.replace(/\s+/g, ''))}
                  disabled={isSimulating}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. friend@mail.com"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  disabled={isSimulating}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white transition-all"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Simulating Sign-Up...
                </>
              ) : (
                <>
                  Simulate Partner Sign-Up <UserPlus className="w-3.5 h-3.5" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Referred Partners List */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Your Referred Partners</h3>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              {referredUsers.length} total
            </span>
          </div>

          {loadingList ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-[10px] text-zinc-400 font-medium">Fetching partners...</span>
            </div>
          ) : referredUsers.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center justify-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/60 rounded-full flex items-center justify-center text-zinc-400">
                <Users className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No partner referrals yet</h4>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px] mx-auto">
                  Share your personalized referral code with friends to start earning passive bonuses.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {referredUsers.map((refUser, i) => (
                <div 
                  key={refUser.email || i}
                  className="p-3 bg-slate-50/60 dark:bg-zinc-950/40 rounded-2xl border border-slate-100/60 dark:border-zinc-850/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{refUser.avatarUrl || '🧑🏾‍💻'}</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-white">@{refUser.username}</h4>
                      <p className="text-[9px] text-zinc-400 mt-0.5">Joined {refUser.joinedAt}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                    Active Partner
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
