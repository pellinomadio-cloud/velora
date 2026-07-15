import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Headphones,
  Eye,
  EyeOff,
  Send,
  Wifi,
  Phone,
  MoreHorizontal,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CheckCircle,
  HelpCircle,
  Home,
  QrCode,
  Gift,
  CreditCard,
  User as UserIcon,
  Globe,
  Settings,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  Briefcase,
  Building,
  Search,
  History,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
  Smartphone,
  Download,
  Check
} from 'lucide-react';
import { User, Transaction, ESimPlan } from '../types';
import { EARN_COMPANIES, EarnCompany } from '../data/companies';
import {
  syncUserToFirebase,
  syncTransactionToFirebase,
  syncJoinedCompanyToFirebase,
  getUserTransactionsFromFirebase,
  getUserJoinedCompaniesFromFirebase,
  getSystemConfigFromFirebase
} from '../firebaseSync';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Import Tabs
import ESimTab from './ESimTab';
import ScanPayTab from './ScanPayTab';
import CardTab from './CardTab';
import ProfileTab from './ProfileTab';
import KYCPage from './KYCPage';
import AdminPanel from './AdminPanel';
import VeloraEarnPage from './VeloraEarnPage';
import VeloraWithdrawPage from './VeloraWithdrawPage';
import VeloraTransactionsPage from './VeloraTransactionsPage';
import VeloraDataPage from './VeloraDataPage';
import VeloraAirtimePage from './VeloraAirtimePage';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateUser?: (updated: User) => void;
}

export default function Dashboard({ user: initialUser, onLogout, darkMode, onToggleDarkMode, onUpdateUser }: DashboardProps) {
  // Current user local state
  const [user, setUser] = useState<User>(initialUser);

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<'home' | 'esim' | 'scan' | 'card' | 'profile'>('home');

  // Multi-screen state: 'main' dashboard tabs vs custom overlay screens
  const [currentScreen, setCurrentScreen] = useState<'main' | 'kyc' | 'admin' | 'earn' | 'withdraw' | 'transactions' | 'data' | 'airtime'>('main');

  const refreshUserFromStorage = () => {
    const current = localStorage.getItem('velora_current_user');
    if (current) {
      try {
        const parsed = JSON.parse(current);
        setUser(parsed);
        if (onUpdateUser) {
          onUpdateUser(parsed);
        }
      } catch (e) {
        console.error('Failed to reload user from storage', e);
      }
    }
  };

  const handleKycSubmit = (proofBase64: string, plan: 'two_key' | 'three_key' | 'unlimited') => {
    const updatedUser: User = {
      ...user,
      kycStatus: 'pending',
      kycPlan: plan,
      kycPaymentProof: proofBase64,
    };
    updateGlobalUser(updatedUser);
  };

  // Interactive UI States
  const [hideBalance, setHideBalance] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Install Volera States
  const [showInstallFloat, setShowInstallFloat] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installDeviceTab, setInstallDeviceTab] = useState<'android' | 'ios'>(() => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        return 'ios';
      }
    }
    return 'android';
  });
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (isStandalone) return true;
    }
    return localStorage.getItem('velora_pwa_installed') === 'true';
  });
  const [isNewUserRegistered, setIsNewUserRegistered] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Monitor browser PWA prompt capability and standalone/installation events
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('Volera was installed natively');
      setIsPwaInstalled(true);
      setShowInstallFloat(false);
      localStorage.setItem('velora_pwa_installed', 'true');
    };

    // Check on mount if we are running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsPwaInstalled(true);
      setShowInstallFloat(false);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check for newly registered user on mount
  useEffect(() => {
    const justRegistered = localStorage.getItem('velora_just_registered');
    if (justRegistered === 'true') {
      setIsNewUserRegistered(true);
      localStorage.removeItem('velora_just_registered'); // clear to avoid repeating
    }
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      // Synchronous user gesture: Show native browser install/download dialog immediately
      try {
        const promptEvent = deferredPrompt;
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        console.log(`User native installation choice outcome: ${choiceResult.outcome}`);
        
        if (choiceResult.outcome === 'accepted') {
          // Instantly complete and record the native installation
          setIsPwaInstalled(true);
          localStorage.setItem('velora_pwa_installed', 'true');
          setShowInstallFloat(false);
          setShowInstallModal(false);
        }
      } catch (err) {
        console.warn('Native prompt failed:', err);
      } finally {
        setDeferredPrompt(null);
      }
    }
  };
  
  // Transaction / Modal states
  const [activeModal, setActiveModal] = useState<'add_money' | 'withdraw' | 'airtime' | 'data' | 'earn' | 'trade' | 'transactions' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Form fields
  const [inputAmount, setInputAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('MTN');
  const [billType, setBillType] = useState('Electricity');
  const [tradeUsdtAmount, setTradeUsdtAmount] = useState('10'); // convert to Naira

  // Custom bank withdrawal fields
  const [withdrawBank, setWithdrawBank] = useState('GTBank');
  const [withdrawAccountNum, setWithdrawAccountNum] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Velora Earn states
  const [earnSearch, setEarnSearch] = useState('');
  const [earnSector, setEarnSector] = useState<'All' | 'Energy & Gas' | 'Agriculture & Food' | 'Real Estate & Infra' | 'Local Trade & Retail' | 'Tech & Digital'>('All');
  
  // Live Payouts Ticker
  interface LiveWithdrawal {
    id: string;
    name: string;
    amount: number;
    bank: string;
    timeAgo: string;
  }

  const [liveWithdrawals, setLiveWithdrawals] = useState<LiveWithdrawal[]>([
    { id: 'tx-lw1', name: 'Alfred', amount: 149000, bank: 'UBA', timeAgo: 'Just now' },
    { id: 'tx-lw2', name: 'Fatima', amount: 85000, bank: 'GTBank', timeAgo: '2m ago' },
    { id: 'tx-lw3', name: 'Chidi', amount: 210000, bank: 'Zenith Bank', timeAgo: '5m ago' },
  ]);

  useEffect(() => {
    const names = [
      'Alfred', 'Amadi', 'Chioma', 'Fatima', 'Yusuf', 'Chidi', 'Tunde', 
      'Blessing', 'Olumide', 'Emeka', 'Amina', 'Zainab', 'Damilola', 
      'Ngozi', 'Ibrahim', 'Chinedu', 'Sade', 'Kelechi'
    ];
    const banks = [
      'UBA', 'Access Bank', 'GTBank', 'Zenith Bank', 'Kuda Bank', 
      'Moniepoint', 'OPay', 'Sterling Bank', 'First Bank', 'Fidelity Bank'
    ];
    const amounts = [15000, 32000, 48500, 75000, 98000, 120000, 149000, 185000, 210000, 250000, 310000, 420000];

    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const bank = banks[Math.floor(Math.random() * banks.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      const id = 'tx-lw' + Math.floor(100 + Math.random() * 900);

      const newTx: LiveWithdrawal = {
        id,
        name,
        amount,
        bank,
        timeAgo: 'Just now'
      };

      setLiveWithdrawals((prev) => {
        const updated = prev.map((item) => {
          if (item.timeAgo === 'Just now') return { ...item, timeAgo: '1m ago' };
          if (item.timeAgo === '1m ago') return { ...item, timeAgo: '3m ago' };
          if (item.timeAgo === '3m ago') return { ...item, timeAgo: '5m ago' };
          return item;
        });
        return [newTx, ...updated.slice(0, 2)];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  
  // Transactions search and filter states
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'in' | 'out'>('all');
  const [joinedCompanies, setJoinedCompanies] = useState<{ companyId: string; joinedAt: string }[]>(() => {
    const saved = localStorage.getItem(`velora_joined_companies_${user.email}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [joinedTodayCount, setJoinedTodayCount] = useState<number>(() => {
    const saved = localStorage.getItem(`velora_join_today_${user.email}`);
    if (saved) {
      const { count, date } = JSON.parse(saved);
      const today = new Date().toDateString();
      if (date === today) {
        return count;
      }
    }
    return 0;
  });
  
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  // Helper to get active companies (non-expired)
  const getActiveJoinedCompanies = () => {
    return joinedCompanies.filter((jc) => {
      if (user.kycStatus !== 'verified') {
        const elapsedMs = Date.now() - new Date(jc.joinedAt).getTime();
        const isExpired = elapsedMs > 24 * 60 * 60 * 1000;
        return !isExpired;
      }
      return true;
    });
  };

  // Auto-resolve account name for withdrawals on entering 10 digits
  useEffect(() => {
    if (withdrawAccountNum.length === 10) {
      const names = [
        'Emeka Nwosu', 'Oluwaseun Adebayo', 'Musa Ibrahim', 'Fatima Bello',
        'Chinedu Okeke', 'Yusuf Abubakar', 'Chioma Nwachukwu', 'Babajide Cole',
        'Adesola Balogun', 'Ngozi Ezekwesili', 'Haruna Danjuma', 'Ifeanyi Uzor'
      ];
      const index = parseInt(withdrawAccountNum) % names.length;
      setWithdrawAccountName(names[index]);
    } else {
      setWithdrawAccountName('');
    }
  }, [withdrawAccountNum]);

  // Passive background earnings simulator (adds to user.balance in real-time & calculates offline profit)
  useEffect(() => {
    if (!user?.email || joinedCompanies.length === 0) return;

    // 1. Process Offline Earnings when mounting or changing joinedCompanies
    const lastActiveStr = localStorage.getItem(`velora_last_active_time_${user.email}`);
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      const now = Date.now();
      const elapsedMs = now - lastActive;
      
      if (elapsedMs > 5000) { // If away for more than 5 seconds
        const elapsedSeconds = elapsedMs / 1000;
        const activeDetails = EARN_COMPANIES.filter((c) =>
          joinedCompanies.some((jc) => {
            if (user.kycStatus !== 'verified') {
              const elapsedMs = Date.now() - new Date(jc.joinedAt).getTime();
              const isExpired = elapsedMs > 24 * 60 * 60 * 1000;
              return jc.companyId === c.id && !isExpired;
            }
            return jc.companyId === c.id;
          })
        );
        
        if (activeDetails.length > 0) {
          // c.dailyEarning is already multiplied by 35 in the data file.
          // In the real-time simulator, we yield (c.dailyEarning / 14400) every 3 seconds.
          // That is: (c.dailyEarning / 14400 / 3) = (c.dailyEarning / 43200) per second.
          const earnRatePerSecond = activeDetails.reduce((sum, c) => sum + (c.dailyEarning / 43200), 0);
          const offlineEarnings = earnRatePerSecond * elapsedSeconds;

          if (offlineEarnings > 0.01) {
            setUser((prev) => {
              if (!prev) return prev;
              const updatedBalance = prev.balance + offlineEarnings;
              const updatedUser = { ...prev, balance: updatedBalance };

              localStorage.setItem('velora_current_user', JSON.stringify(updatedUser));
              
              const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
              const index = accounts.findIndex((acc: any) => acc.email.toLowerCase() === updatedUser.email.toLowerCase());
              if (index !== -1) {
                accounts[index] = updatedUser;
                localStorage.setItem('velora_accounts', JSON.stringify(accounts));
              }

              // Create an offline earnings notification transaction
              const offlineTx: Transaction = {
                id: `TX-OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`,
                type: 'deposit',
                title: 'Passive Offline Revenue',
                subtitle: `Earned ₦${offlineEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} passively while offline`,
                amount: offlineEarnings,
                date: new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                status: 'completed',
                recipient: 'Volerapay Wallet',
                reference: `OFF-${Math.floor(100000 + Math.random() * 900000)}`
              };

              // Add to transaction list
              const savedTxs = localStorage.getItem(`velora_txs_${updatedUser.email}`);
              const existingTxs = savedTxs ? JSON.parse(savedTxs) : [];
              localStorage.setItem(`velora_txs_${updatedUser.email}`, JSON.stringify([offlineTx, ...existingTxs]));
              
              // Also add to transactions state
              setTimeout(() => {
                setTransactions(prevTxs => [offlineTx, ...prevTxs]);
              }, 100);

              // Sync updated user to Firebase immediately
              syncUserToFirebase(updatedUser).catch(err => console.warn('Failed to sync offline earnings:', err));

              return updatedUser;
            });
          }
        }
      }
    }

    // Set initial heartbeat
    localStorage.setItem(`velora_last_active_time_${user.email}`, Date.now().toString());

    // 2. Real-time active simulation loop
    const interval = setInterval(() => {
      const activeDetails = EARN_COMPANIES.filter((c) =>
        joinedCompanies.some((jc) => {
          if (user.kycStatus !== 'verified') {
            const elapsedMs = Date.now() - new Date(jc.joinedAt).getTime();
            const isExpired = elapsedMs > 24 * 60 * 60 * 1000;
            return jc.companyId === c.id && !isExpired;
          }
          return jc.companyId === c.id;
        })
      );
      if (activeDetails.length === 0) {
        localStorage.setItem(`velora_last_active_time_${user.email}`, Date.now().toString());
        return;
      }

      const earnedAmount = activeDetails.reduce((sum, c) => sum + (c.dailyEarning / 14400), 0);

      if (earnedAmount > 0) {
        setUser((prev) => {
          if (!prev) return prev;
          const updatedBalance = prev.balance + earnedAmount;
          const updatedUser = { ...prev, balance: updatedBalance };

          localStorage.setItem('velora_current_user', JSON.stringify(updatedUser));
          
          const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
          const index = accounts.findIndex((acc: any) => acc.email.toLowerCase() === updatedUser.email.toLowerCase());
          if (index !== -1) {
            accounts[index] = updatedUser;
            localStorage.setItem('velora_accounts', JSON.stringify(accounts));
          }
          
          // Sync to Firebase to keep the DB intact
          syncUserToFirebase(updatedUser).catch(err => console.warn('Failed to sync active earnings:', err));
          
          return updatedUser;
        });
      }

      // Record heartbeat
      localStorage.setItem(`velora_last_active_time_${user.email}`, Date.now().toString());
    }, 3000);

    return () => clearInterval(interval);
  }, [joinedCompanies, user.email, user.kycStatus]);

  // Keep a mutable ref to the latest user object to avoid stale closures in listeners
  const latestUserRef = React.useRef(user);
  useEffect(() => {
    latestUserRef.current = user;
  }, [user]);

  // Listen to real-time changes of the user profile on Firestore
  useEffect(() => {
    if (!user || !user.email) return;
    const userRef = doc(db, 'users', user.email.toLowerCase());
    
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as User;
        const currentRefUser = latestUserRef.current;
        // Check if any of the critical fields changed (using a small delta for float balance)
        if (
          Math.abs((data.balance || 0) - (currentRefUser.balance || 0)) > 0.01 ||
          data.kycStatus !== currentRefUser.kycStatus ||
          data.kycPlan !== currentRefUser.kycPlan ||
          data.cardActivationStatus !== currentRefUser.cardActivationStatus ||
          data.isBanned !== currentRefUser.isBanned ||
          data.username !== currentRefUser.username ||
          data.avatarUrl !== currentRefUser.avatarUrl
        ) {
          setUser(data);
          localStorage.setItem('velora_current_user', JSON.stringify(data));
          
          // Update in local accounts list as well
          const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
          const idx = accounts.findIndex((a: any) => a.email.toLowerCase() === user.email.toLowerCase());
          if (idx !== -1) {
            accounts[idx] = data;
            localStorage.setItem('velora_accounts', JSON.stringify(accounts));
          }
          
          if (onUpdateUser) {
            onUpdateUser(data);
          }
        }
      }
    }, (err) => {
      console.warn('Real-time listener failed, using offline states:', err);
    });

    return () => unsubscribe();
  }, [user.email]);

  // Load and save accounts/transactions locally and from Firestore
  useEffect(() => {
    // Local fallback
    const savedTxs = localStorage.getItem(`velora_txs_${user.email}`);
    if (savedTxs) {
      setTransactions(JSON.parse(savedTxs));
    } else {
      setTransactions([]);
    }

    // Pull transactions and joined companies from Firestore
    getUserTransactionsFromFirebase(user.email).then((fbTxs) => {
      if (fbTxs.length > 0) {
        setTransactions(fbTxs);
        localStorage.setItem(`velora_txs_${user.email}`, JSON.stringify(fbTxs));
      }
    }).catch(err => console.warn('Failed to load transactions from Firebase:', err));

    getUserJoinedCompaniesFromFirebase(user.email).then((fbJcs) => {
      if (fbJcs.length > 0) {
        setJoinedCompanies(fbJcs);
        localStorage.setItem(`velora_joined_companies_${user.email}`, JSON.stringify(fbJcs));
      }
    }).catch(err => console.warn('Failed to load joined companies from Firebase:', err));

  }, [user.email]);

  const updateGlobalUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('velora_current_user', JSON.stringify(updated));
    
    // Update in registered accounts list
    const accounts = JSON.parse(localStorage.getItem('velora_accounts') || '[]');
    const index = accounts.findIndex((acc: any) => acc.email.toLowerCase() === updated.email.toLowerCase());
    if (index !== -1) {
      accounts[index] = updated;
      localStorage.setItem('velora_accounts', JSON.stringify(accounts));
    }

    if (onUpdateUser) {
      onUpdateUser(updated);
    }

    // Sync to Firebase
    syncUserToFirebase(updated).catch(err => console.error('Failed to sync updated user:', err));
  };

  const addTransaction = (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`velora_txs_${user.email}`, JSON.stringify(updated));

    // Sync to Firebase
    syncTransactionToFirebase(user.email, newTx).catch(err => console.error('Failed to sync transaction to Firebase:', err));
  };

  // 1. Add Money Handler
  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    
    const amt = parseFloat(inputAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid amount.');
      return;
    }

    const updatedUser = { ...user, balance: user.balance + amt };
    updateGlobalUser(updatedUser);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'deposit',
      title: 'Wallet Funded',
      subtitle: 'Credit via instant bank checkout',
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    };
    addTransaction(tx);

    setModalSuccess(true);
    setInputAmount('');
    setTimeout(() => {
      setModalSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  // 2. Bank Withdrawal Handler
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (user.kycStatus !== 'verified') {
      setModalError('KYC Verification Required: You must complete your KYC verification before you can authorize withdrawals.');
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid withdrawal amount.');
      return;
    }

    if (amt < 500) {
      setModalError('Minimum withdrawal amount is ₦500.00');
      return;
    }

    if (user.balance < amt) {
      setModalError('Insufficient wallet balance to perform withdrawal.');
      return;
    }

    const updatedUser = { ...user, balance: user.balance - amt };
    updateGlobalUser(updatedUser);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'send',
      title: `Bank Withdrawal`,
      subtitle: `Transferred ₦${amt.toLocaleString()} to ${withdrawBank} (${withdrawAccountNum})`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      recipient: withdrawBank
    };
    addTransaction(tx);

    setModalSuccess(true);
    setWithdrawAmount('');
    setWithdrawAccountNum('');
    setWithdrawAccountName('');
    setTimeout(() => {
      setModalSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  const getUserDailyJoinLimit = (u: User) => {
    if (u.kycStatus !== 'verified') {
      return 1;
    }
    if (u.kycPlan === 'two_key') return 2;
    if (u.kycPlan === 'three_key') return 3;
    if (u.kycPlan === 'unlimited') return Infinity;
    return 3; // Default fallback
  };

  // Joint Company handler for Velora Earn
  const handleJoinCompany = (companyId: string): string | null => {
    if (user.kycStatus !== 'verified') {
      if (joinedCompanies.length >= 1) {
        return "KYC Account Activation Required! Unverified trial accounts can only join a revenue pool once. Please complete your KYC Verification to unlock daily revenue pools.";
      }
    }

    if (joinedCompanies.some(c => c.companyId === companyId)) {
      return "You have already joined this company!";
    }

    const today = new Date().toDateString();
    const savedLimit = localStorage.getItem(`velora_join_today_${user.email}`);
    let currentCount = 0;
    if (savedLimit) {
      const { count, date } = JSON.parse(savedLimit);
      if (date === today) {
        currentCount = count;
      }
    }

    const dailyLimit = getUserDailyJoinLimit(user);
    if (currentCount >= dailyLimit) {
      return `Daily limit reached! Your plan allows up to ${dailyLimit === Infinity ? 'unlimited' : dailyLimit} joins per day. Upgrade your KYC Plan to get more keys.`;
    }

    const newJoin = { companyId, joinedAt: new Date().toISOString() };
    const updatedJoined = [...joinedCompanies, newJoin];
    setJoinedCompanies(updatedJoined);
    localStorage.setItem(`velora_joined_companies_${user.email}`, JSON.stringify(updatedJoined));

    // Sync joined company to Firebase
    syncJoinedCompanyToFirebase(user.email, newJoin).catch(err => console.error('Failed to sync joined company to Firebase:', err));

    const newCount = currentCount + 1;
    setJoinedTodayCount(newCount);
    localStorage.setItem(`velora_join_today_${user.email}`, JSON.stringify({ count: newCount, date: today }));

    const company = EARN_COMPANIES.find(c => c.id === companyId);
    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'deposit',
      title: `Joined ${company?.name || 'Revenue Partner'}`,
      subtitle: `Daily payout: ₦${company?.dailyEarning.toLocaleString()}/day passively started`,
      amount: 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    };
    addTransaction(tx);
    return null;
  };

  // 3. Buy Airtime Handler
  const handleAirtimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const amt = parseFloat(inputAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter an airtime voucher amount.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setModalError('Please enter a valid telephone number.');
      return;
    }
    if (user.balance < amt) {
      setModalError('Insufficient wallet funds to purchase airtime.');
      return;
    }

    const updatedUser = { ...user, balance: user.balance - amt };
    updateGlobalUser(updatedUser);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'airtime',
      title: `Airtime Topup (${selectedOperator})`,
      subtitle: `Voucher sent directly to ${phoneNumber}`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      recipient: phoneNumber
    };
    addTransaction(tx);

    setModalSuccess(true);
    setInputAmount('');
    setPhoneNumber('');
    setTimeout(() => {
      setModalSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  // 4. Buy Data Handler
  const handleDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const amt = parseFloat(inputAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a data bundle plan price.');
      return;
    }
    if (!phoneNumber.trim()) {
      setModalError('Please enter a recipient telephone number.');
      return;
    }
    if (user.balance < amt) {
      setModalError('Insufficient wallet balance to purchase data.');
      return;
    }

    const updatedUser = { ...user, balance: user.balance - amt };
    updateGlobalUser(updatedUser);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'data',
      title: `Data Bundle Bundle Loaded`,
      subtitle: `4G/5G Internet Profile added to ${phoneNumber}`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      recipient: phoneNumber
    };
    addTransaction(tx);

    setModalSuccess(true);
    setInputAmount('');
    setPhoneNumber('');
    setTimeout(() => {
      setModalSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  // 5. Pay Bills Handler
  const handleBillsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const amt = parseFloat(inputAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a payment invoice amount.');
      return;
    }
    if (user.balance < amt) {
      setModalError('Insufficient wallet balance to settle invoice.');
      return;
    }

    const updatedUser = { ...user, balance: user.balance - amt };
    updateGlobalUser(updatedUser);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'bills',
      title: `${billType} Utility Settled`,
      subtitle: 'Paid securely via Volerapay biller network',
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    };
    addTransaction(tx);

    setModalSuccess(true);
    setInputAmount('');
    setTimeout(() => {
      setModalSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  // 6. USDT Trade Quick Convert Handler
  const handleUsdtTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const usdtAmt = parseFloat(tradeUsdtAmount);
    if (isNaN(usdtAmt) || usdtAmt <= 0) {
      setModalError('Please enter a valid USDT volume.');
      return;
    }

    const equivalentNaira = usdtAmt * 1381.02;

    // Simulate trading crypto into Naira cash wallet
    const updatedUser = { ...user, balance: user.balance + equivalentNaira };
    updateGlobalUser(updatedUser);

    const tx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'exchange',
      title: `USDT Converted to Cash`,
      subtitle: `Exchanged ${usdtAmt} USDT at rate 1,381.02`,
      amount: equivalentNaira,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    };
    addTransaction(tx);

    setModalSuccess(true);
    setTimeout(() => {
      setModalSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  const handleEsimPurchase = (plan: ESimPlan) => {
    const updatedUser = { ...user, balance: user.balance - plan.price };
    updateGlobalUser(updatedUser);
  };

  const handleDeductBalance = (amount: number) => {
    const updatedUser = { ...user, balance: user.balance - amount };
    updateGlobalUser(updatedUser);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex justify-center items-start ${darkMode ? 'dark bg-zinc-950' : 'bg-white'}`}>
      
      {/* Mobile Frame Wrapper to emulate the gorgeous layout exactly */}
      <div className={`w-full max-w-md bg-white dark:bg-zinc-900 h-screen max-h-screen shadow-2xl relative flex flex-col justify-between ${currentScreen === 'main' ? 'pb-24' : 'pb-6'} overflow-hidden border-x border-slate-100 dark:border-zinc-800/80`}>
        
        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          
          {currentScreen === 'kyc' ? (
            <KYCPage
              user={user}
              onBack={() => setCurrentScreen('main')}
              onSubmitKYC={handleKycSubmit}
            />
          ) : currentScreen === 'admin' ? (
            <AdminPanel
              onBack={() => setCurrentScreen('main')}
              onRefreshUser={refreshUserFromStorage}
            />
          ) : currentScreen === 'earn' ? (
            <VeloraEarnPage
              user={user}
              joinedCompanies={joinedCompanies}
              joinedTodayCount={joinedTodayCount}
              onJoinCompany={handleJoinCompany}
              onBack={() => setCurrentScreen('main')}
            />
          ) : currentScreen === 'withdraw' ? (
            <VeloraWithdrawPage
              user={user}
              onDeductBalance={handleDeductBalance}
              onAddTransaction={addTransaction}
              onBack={() => setCurrentScreen('main')}
              onOpenKyc={() => setCurrentScreen('kyc')}
              onOpenCard={() => {
                setCurrentScreen('main');
                setActiveTab('card');
              }}
            />
          ) : currentScreen === 'transactions' ? (
            <VeloraTransactionsPage
              user={user}
              transactions={transactions}
              onBack={() => setCurrentScreen('main')}
            />
          ) : currentScreen === 'data' ? (
            <VeloraDataPage
              user={user}
              onDeductBalance={handleDeductBalance}
              onAddTransaction={addTransaction}
              onBack={() => setCurrentScreen('main')}
            />
          ) : currentScreen === 'airtime' ? (
            <VeloraAirtimePage
              user={user}
              onDeductBalance={handleDeductBalance}
              onAddTransaction={addTransaction}
              onBack={() => setCurrentScreen('main')}
              onOpenKyc={() => setCurrentScreen('kyc')}
            />
          ) : (
            <>
          
          {/* HEADER SECTION */}
          {activeTab === 'home' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#ECEEF0] dark:bg-zinc-800 flex items-center justify-center relative border border-slate-200/50 dark:border-zinc-700/50 shadow-inner">
                  {user.avatarUrl === '🧑🏾‍💻' ? (
                    <svg viewBox="0 0 100 100" className="w-10 h-10 select-none">
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
                    <span className="text-2xl select-none">{user.avatarUrl}</span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Hello,</p>
                  <h1 className="text-sm font-extrabold text-zinc-800 dark:text-white capitalize tracking-tight mt-0.5">
                    {user.username}
                  </h1>
                </div>
              </div>

              {/* Action Buttons on right */}
              <div className="flex items-center gap-2">
                {/* Help Button with custom pink banner */}
                <div className="relative">
                  <span className="absolute top-[-8px] right-[-4px] bg-[#FF3B69] text-white font-extrabold text-[8px] px-1 py-0.5 rounded-full scale-90 tracking-wide z-10 uppercase">
                    HELP
                  </span>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="p-2.5 rounded-full border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <Headphones className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications Button */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-full border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all relative cursor-pointer animate-none"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC TAB CONTROLLER */}
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                
                {/* Pending Withdrawal Warning Banner */}
                {transactions.some(tx => tx.status === 'pending' && tx.type === 'send') && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/30 rounded-3xl flex items-start gap-2.5 shadow-sm">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 text-left">
                      <p className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">Ongoing Withdrawal Processing</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-450 leading-relaxed font-semibold">
                        Please <button onClick={() => setActiveTab('card')} className="font-black text-orange-500 hover:underline bg-transparent border-none p-0 cursor-pointer">activate virtual card</button> to complete your ongoing withdrawal.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. WALLET BALANCE CARD (Matches visual screenshot exactly) */}
                <div className="w-full bg-[#1E1F22] dark:bg-zinc-950 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-[230px] border border-white/5">
                  {/* Subtle Grid overlay inside card */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  {/* Top section: Title & Eye toggle */}
                  <div className="flex items-center gap-1.5 opacity-80 z-10">
                    <span className="text-xs font-semibold tracking-wide text-zinc-400">
                      Wallet Balance ({displayCurrency})
                    </span>
                    <button
                      onClick={() => setHideBalance(!hideBalance)}
                      className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-all cursor-pointer"
                    >
                      {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Mid section: Balance value & Add Money button */}
                  <div className="flex items-center justify-between my-2 z-10">
                    <p className="text-2xl font-black tracking-tight">
                      {hideBalance ? (
                        displayCurrency === 'USD' ? '$••••••' : '₦••••••'
                      ) : displayCurrency === 'USD' ? (
                        `$${(user.balance / 1381.02).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        `₦${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </p>

                    <button
                      onClick={() => {
                        setCurrentScreen('transactions');
                      }}
                      className="px-4 py-2 rounded-full border border-orange-500 hover:border-orange-600 text-white text-xs font-bold transition-all bg-transparent cursor-pointer hover:bg-orange-500/15 flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5 text-orange-500" />
                      Transactions
                    </button>
                  </div>

                  {/* Bottom overlay pill of actions */}
                  <div className="bg-[#2D2E32]/90 dark:bg-zinc-900/90 rounded-2xl p-3 flex justify-around items-center gap-1 z-10 border border-white/5">
                    
                    {/* Action 1: Withdraw */}
                    <button
                      onClick={() => {
                        setCurrentScreen('withdraw');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/10 dark:bg-zinc-800/80 group-hover:bg-orange-500/20 group-hover:text-orange-400 flex items-center justify-center text-white transition-all">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-300 tracking-wide">Withdraw</span>
                    </button>

                    {/* Action 2: KYC */}
                    <button
                      onClick={() => {
                        setCurrentScreen('kyc');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-amber-500/10 dark:bg-amber-500/5 ring-1 ring-amber-500/20 group-hover:ring-amber-500/40 group-hover:bg-amber-500/25 group-hover:text-amber-400 flex items-center justify-center text-amber-500 dark:text-amber-400 transition-all">
                        <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 tracking-wide">KYC</span>
                    </button>

                    {/* Action 3: Support */}
                    <button
                      onClick={() => {
                        let link = 'https://t.me/VolerapaySupportDesk';
                        const saved = localStorage.getItem('velora_company_account');
                        if (saved) {
                          try {
                            const parsed = JSON.parse(saved);
                            if (parsed.supportLink) {
                              link = parsed.supportLink;
                            }
                          } catch (e) {}
                        }
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-sky-500/10 dark:bg-sky-500/5 ring-1 ring-sky-500/20 group-hover:ring-sky-500/40 group-hover:bg-sky-500/25 group-hover:text-sky-400 flex items-center justify-center text-sky-500 dark:text-sky-400 transition-all">
                        <MessageCircle className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                      </div>
                      <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 tracking-wide">Support</span>
                    </button>

                    {/* Action 4: Velora Earn */}
                    <button
                      onClick={() => {
                        setModalError('');
                        setCurrentScreen('earn');
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/10 dark:bg-zinc-800/80 group-hover:bg-orange-500/20 group-hover:text-orange-400 flex items-center justify-center text-white transition-all">
                        <Briefcase className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-300 tracking-wide">Volerapay Earn</span>
                    </button>
                  </div>
                </div>

                {/* 1.5. NEW DIRECT MOBILE APP DOWNLOAD TOGGLE (No Install Bonus/Rewards) */}
                <div className="p-4.5 rounded-[28px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Premium Green and Gold Naira Logo preview */}
                      <div className="w-10 h-10 rounded-xl bg-[#047857] border border-[#F59E0B]/30 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="text-[#F59E0B] font-black text-lg">₦</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-[11px] font-black text-zinc-800 dark:text-white uppercase tracking-wider">
                          Direct App Installation
                        </h3>
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5 leading-relaxed">
                          Download Volera directly to your phone's app drawer for full standalone performance.
                        </p>
                      </div>
                    </div>

                    {/* Green & Gold Toggle Switch */}
                    <button
                      onClick={() => {
                        setShowInstallModal(true);
                      }}
                      className="flex items-center cursor-pointer shrink-0"
                    >
                      <div className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ${isPwaInstalled ? 'bg-[#047857]' : 'bg-zinc-300 dark:bg-zinc-850'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${isPwaInstalled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Tiny instruction footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 dark:border-zinc-850/50">
                    <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-[#047857]" /> Standalone WebAPK Support
                    </span>
                    <button
                      onClick={() => setShowInstallModal(true)}
                      className="text-[9px] font-black text-orange-500 hover:underline uppercase tracking-wider"
                    >
                      Install Guide &rarr;
                    </button>
                  </div>
                </div>

                {/* 2. VOLERAPAY REVENUE CONVERTER SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-zinc-800 dark:text-white">Volerapay Revenue</h2>
                    <button
                      onClick={() => setActiveModal('trade')}
                      className="text-xs font-bold text-orange-500 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Active Rates
                    </button>
                  </div>

                  {/* Trade prompt banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/70 to-pink-50/70 dark:from-zinc-950/40 dark:to-zinc-900/40 border border-orange-100/30 dark:border-zinc-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200">
                          {user.kycStatus === 'verified'
                            ? 'USDT to Volerapay Revenue Conversion!'
                            : user.kycStatus === 'pending'
                              ? 'KYC Verification Pending Approval'
                              : 'Complete KYC to unlock Revenue!'}
                        </p>
                        {(!user.kycStatus || user.kycStatus === 'unverified') && (
                          <p className="text-[9px] text-zinc-400 mt-0.5">Activate account with ₦7,500 to unlock Revenue.</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (user.kycStatus === 'verified') {
                            setDisplayCurrency((prev) => (prev === 'NGN' ? 'USD' : 'NGN'));
                          } else {
                            setModalError('');
                            setActiveModal('trade');
                          }
                        }}
                        className="px-4 py-2 bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-[10px] font-black rounded-full transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        {user.kycStatus === 'verified'
                          ? 'Convert now'
                          : user.kycStatus === 'pending'
                            ? 'Pending'
                            : 'Unlock'}
                      </button>
                    </div>

                    {/* Perpetual Live Revenue Loading Bar */}
                    <div className="flex items-center justify-between pt-2.5 text-[9px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/50 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="w-2.5 h-2.5 border border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Live revenue feeds syncing...</span>
                      </div>
                      <span className="animate-pulse text-orange-500 font-bold uppercase tracking-wider text-[8px]">Live streaming active</span>
                    </div>
                  </div>

                  {/* Horizontal Rates List */}
                  <div className="grid grid-cols-3 gap-2.5">
                    
                    {/* Rate 1: USDT */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-[10px] font-extrabold text-emerald-600">T</div>
                        <span className="text-[9px] text-zinc-400">→</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden flex flex-row">
                          <div className="bg-emerald-600 w-[7px] h-full" />
                          <div className="bg-white w-[6px] h-full" />
                          <div className="bg-emerald-600 w-[7px] h-full" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold">1 USDT =</p>
                        <p className="text-[11px] font-black text-zinc-800 dark:text-white mt-0.5">₦1,381.02</p>
                      </div>
                    </div>

                    {/* Rate 2: Cedis */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full overflow-hidden flex flex-col">
                          <div className="bg-[#EF2B2D] h-[6px] w-full" />
                          <div className="bg-[#FCD116] h-[8px] w-full flex items-center justify-center text-[5px] font-bold text-black select-none">★</div>
                          <div className="bg-[#00AA4F] h-[6px] w-full" />
                        </div>
                        <span className="text-[9px] text-zinc-400">→</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden flex flex-row">
                          <div className="bg-emerald-600 w-[7px] h-full" />
                          <div className="bg-white w-[6px] h-full" />
                          <div className="bg-emerald-600 w-[7px] h-full" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold">1 Cedis =</p>
                        <p className="text-[11px] font-black text-zinc-800 dark:text-white mt-0.5">₦122.02</p>
                      </div>
                    </div>

                    {/* Rate 3: Shilling */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 shadow-sm flex flex-col justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full overflow-hidden flex flex-col justify-center bg-black relative border border-black/10">
                          <div className="bg-black h-[5px] w-full" />
                          <div className="bg-white h-[1px] w-full" />
                          <div className="bg-[#9E202B] h-[6px] w-full" />
                          <div className="bg-white h-[1px] w-full" />
                          <div className="bg-emerald-700 h-[5px] w-full" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-1.5 h-3 bg-[#9E202B] rounded-full border border-white flex items-center justify-center">
                              <div className="w-[1px] h-2 bg-white" />
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-zinc-400">→</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden flex flex-row">
                          <div className="bg-emerald-600 w-[7px] h-full" />
                          <div className="bg-white w-[6px] h-full" />
                          <div className="bg-emerald-600 w-[7px] h-full" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold">1 Shilling =</p>
                        <p className="text-[11px] font-black text-zinc-800 dark:text-white mt-0.5">₦10.50</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. LIVE WITHDRAWAL FEED */}
                <div className="bg-slate-50 dark:bg-zinc-950/60 rounded-3xl p-4.5 border border-slate-100 dark:border-zinc-850/80 shadow-sm space-y-3 min-h-[175px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-black tracking-wider text-zinc-800 dark:text-white uppercase">Live Payouts Feed</h4>
                    </div>
                    <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full">
                      Volerapay Instant
                    </span>
                  </div>

                  <div className="relative overflow-hidden h-[115px] flex flex-col justify-start">
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {liveWithdrawals.map((tx) => (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="p-2.5 bg-white dark:bg-zinc-900/90 border border-slate-100 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shrink-0">
                                <ArrowUpRight className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                                  <span className="text-orange-500 font-black">{tx.name}</span>
                                  <span className="text-zinc-400 font-normal ml-1">withdrew to {tx.bank}</span>
                                </p>
                                <p className="text-[9px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <span className="text-zinc-400 font-medium">{tx.timeAgo}</span>
                                  <span className="text-zinc-300 dark:text-zinc-750">•</span>
                                  <span className="text-emerald-500 font-bold">Instant Payout</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                                ₦{tx.amount.toLocaleString()}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>



              </motion.div>
            )}

            {/* TAB: eSIM */}
            {activeTab === 'esim' && (
              <motion.div
                key="esim"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <ESimTab
                  user={user}
                  onPurchasePlan={handleEsimPurchase}
                  onAddTransaction={addTransaction}
                />
              </motion.div>
            )}

            {/* TAB: Scan Pay */}
            {activeTab === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <ScanPayTab
                  user={user}
                  onDeductBalance={handleDeductBalance}
                  onAddTransaction={addTransaction}
                  onUpdateUser={updateGlobalUser}
                />
              </motion.div>
            )}

            {/* TAB: Virtual Cards */}
            {activeTab === 'card' && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <CardTab
                  user={user}
                  onDeductBalance={handleDeductBalance}
                  onAddTransaction={addTransaction}
                  onOpenAdmin={() => setCurrentScreen('admin')}
                  onUpdateUser={updateGlobalUser}
                  onOpenKyc={() => setCurrentScreen('kyc')}
                />
              </motion.div>
            )}

            {/* TAB: Profile & Security */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileTab
                  user={user}
                  onUpdateUser={updateGlobalUser}
                  onLogout={onLogout}
                  darkMode={darkMode}
                  onToggleDarkMode={onToggleDarkMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </>
          )}

        </div>

        {/* BOTTOM NAVIGATION TABS (Perfect match) */}
        {currentScreen === 'main' && (
          <div className="absolute bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-850 p-3 flex justify-around items-center text-white z-40">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 select-none cursor-pointer transition-all ${
              activeTab === 'home' ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'home' ? 'bg-white/10' : ''}`}>
              <Home className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Home</span>
          </button>

          {/* Tab 2: eSIM */}
          <button
            onClick={() => setActiveTab('esim')}
            className={`flex flex-col items-center gap-1 select-none cursor-pointer transition-all ${
              activeTab === 'esim' ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'esim' ? 'bg-white/10' : ''}`}>
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">eSIM</span>
          </button>

          {/* Tab 3: Referral */}
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center gap-1 select-none cursor-pointer transition-all ${
              activeTab === 'scan' ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'scan' ? 'bg-white/10' : ''}`}>
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Referral</span>
          </button>

          {/* Tab 4: Card */}
          <button
            onClick={() => setActiveTab('card')}
            className={`flex flex-col items-center gap-1 select-none cursor-pointer transition-all ${
              activeTab === 'card' ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'card' ? 'bg-white/10' : ''}`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Card</span>
          </button>

          {/* Tab 5: Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 select-none cursor-pointer transition-all ${
              activeTab === 'profile' ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'profile' ? 'bg-white/10' : ''}`}>
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Profile</span>
          </button>

        </div>
        )}

        {/* NOTIFICATIONS DRAWER POPUP */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-0 bottom-24 mx-4 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 p-5 rounded-3xl shadow-2xl z-50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-2">
                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-orange-500" /> Notifications Tray
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[160px] overflow-y-auto no-scrollbar">
                <div className="p-2.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/35 dark:border-orange-950/20 rounded-xl">
                  <p className="text-xs font-bold text-zinc-800 dark:text-white">Volerapay pre-funded gift! 🎁</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">We pre-funded your registration with ₦150,000 for realistic trial trades.</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                  <p className="text-xs font-bold text-zinc-800 dark:text-white">Security Guard Enabled</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Your 6-digit payment PIN code is active.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HELP DESK MODAL POPUP */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-0 bottom-24 mx-4 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 p-5 rounded-3xl shadow-2xl z-50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-2">
                <h3 className="text-sm font-black text-zinc-800 dark:text-white flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-orange-500" /> Volerapay Live Helpdesk
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Welcome to Volerapay help services. Need support? Ask our agents about transfers, virtual debit cards, or roaming eSIM profiles.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-850 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  ⚡ 24/7 Priority support at: <span className="font-bold text-orange-500">support@volerapay.com</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING ACTION MODALS (Add money, send, airtime, data, bills, trade) */}
        <AnimatePresence>
          {activeModal && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-end z-50">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full bg-white dark:bg-zinc-900 rounded-t-[36px] p-6 space-y-4 max-h-[85%] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-800 dark:text-white capitalize">
                      {activeModal === 'earn' ? 'Volerapay Earn Pools' : activeModal === 'withdraw' ? 'Secure Bank Withdrawal' : activeModal === 'transactions' ? 'Transaction History' : activeModal.replace('_', ' ')}
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      {activeModal === 'transactions' ? 'Complete archive of your ledger activity' : 'Complete transaction securely'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setModalError('');
                    }}
                    className="p-2 bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Success Animation */}
                {modalSuccess ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle className="w-10 h-10 stroke-[2.5px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-800 dark:text-white">Transaction Successful</h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Your ledger activity is updated immediately.</p>
                    </div>
                  </div>
                ) : (
                  /* Dynamic Modal Forms */
                  <div>
                    {modalError && (
                      <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-950/50">
                        {modalError}
                      </div>
                    )}

                    {/* Form 1: Add Money */}
                    {activeModal === 'add_money' && (
                      <form onSubmit={handleAddMoneySubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Amount to add (Naira)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
                            <input
                              type="number"
                              required
                              placeholder="e.g. 10000"
                              value={inputAmount}
                              onChange={(e) => setInputAmount(e.target.value)}
                              className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Quick select buttons */}
                        <div className="grid grid-cols-4 gap-2">
                          {[2000, 5000, 10000, 25000].map((v) => (
                            <button
                              type="button"
                              key={v}
                              onClick={() => setInputAmount(v.toString())}
                              className="py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500 dark:hover:border-orange-500 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              +₦{v.toLocaleString()}
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
                        >
                          Confirm & Fund Account
                        </button>
                      </form>
                    )}

                    {/* Form 2: Bank Withdrawal */}
                    {activeModal === 'withdraw' && (
                      user.kycStatus === 'verified' ? (
                        <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Select Bank</label>
                            <select
                              value={withdrawBank}
                              onChange={(e) => setWithdrawBank(e.target.value)}
                              className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            >
                              <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                              <option value="Access Bank">Access Bank</option>
                              <option value="Zenith Bank">Zenith Bank</option>
                              <option value="UBA">United Bank for Africa (UBA)</option>
                              <option value="First Bank">First Bank of Nigeria</option>
                              <option value="Kuda Bank">Kuda Bank</option>
                              <option value="OPay">OPay</option>
                              <option value="Moniepoint">Moniepoint</option>
                              <option value="Wema Bank">Wema Bank (ALAT)</option>
                              <option value="Fidelity Bank">Fidelity Bank</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Account Number</label>
                              <input
                                type="text"
                                maxLength={10}
                                required
                                placeholder="10-digit NUBAN Number"
                                value={withdrawAccountNum}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setWithdrawAccountNum(val);
                                }}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white font-mono"
                              />
                            </div>

                            {withdrawAccountName && (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/50 rounded-2xl flex items-center gap-2.5">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Resolved Account Name</p>
                                  <p className="text-xs font-extrabold text-zinc-800 dark:text-emerald-400">{withdrawAccountName}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Amount to Withdraw (₦)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
                              <input
                                type="number"
                                required
                                placeholder="e.g. 5000"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                              />
                            </div>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-zinc-400">Avail. Bal: ₦{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              <button
                                type="button"
                                onClick={() => setWithdrawAmount(Math.floor(user.balance).toString())}
                                className="text-[10px] font-bold text-orange-500 hover:underline bg-transparent border-none cursor-pointer"
                              >
                                Withdraw All
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md"
                          >
                            Withdraw Funds Instantly
                          </button>
                        </form>
                      ) : (
                        <div className="py-6 text-center space-y-5">
                          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto shadow-sm">
                            <ShieldAlert className="w-7 h-7 stroke-[2px]" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-black text-zinc-800 dark:text-white tracking-tight">KYC Authentication Required</h4>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
                              {user.kycStatus === 'pending'
                                ? "Your KYC verification is currently pending security review. Once verified by our support admins, you can instantly withdraw your accumulated earnings."
                                : "To safeguard accounts and comply with federal cash regulations, active KYC verification is required. Complete verification with an activation deposit."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveModal(null);
                              setCurrentScreen('kyc');
                            }}
                            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md animate-pulse"
                          >
                            {user.kycStatus === 'pending' ? 'View Status' : 'Complete KYC Verification Now'}
                          </button>
                        </div>
                      )
                    )}

                    {/* Form 3: Airtime */}
                    {activeModal === 'airtime' && (
                      <form onSubmit={handleAirtimeSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Telecom Operator</label>
                            <select
                              value={selectedOperator}
                              onChange={(e) => setSelectedOperator(e.target.value)}
                              className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            >
                              <option>MTN</option>
                              <option>Airtel</option>
                              <option>Glo</option>
                              <option>9mobile</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone Number</label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. 08123456789"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full px-3 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Topup Voucher Amount</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
                            <input
                              type="number"
                              required
                              placeholder="e.g. 1000"
                              value={inputAmount}
                              onChange={(e) => setInputAmount(e.target.value)}
                              className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
                        >
                          Purchase Airtime
                        </button>
                      </form>
                    )}

                    {/* Form 4: Data Bundle */}
                    {activeModal === 'data' && (
                      <form onSubmit={handleDataSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Recipient Mobile Phone</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 08123456789"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">Data Plan Selection</label>
                          <select
                            onChange={(e) => setInputAmount(e.target.value)}
                            className="w-full px-3 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                          >
                            <option value="">Choose a super plan...</option>
                            <option value="1000">1.5 GB • 30 Days (₦1,000)</option>
                            <option value="2500">5.0 GB • 30 Days (₦2,500)</option>
                            <option value="5000">15.0 GB • 30 Days (₦5,000)</option>
                            <option value="12000">Unlimited 5G Lite • 30 Days (₦12,000)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 mt-4 bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
                        >
                          Activate Plan
                        </button>
                      </form>
                    )}

                    {/* Form 5: Velora Earn (Replaced Pay Bills) */}
                    {activeModal === 'earn' && (
                      <div className="space-y-4">
                        {/* Statistics Banner */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/80 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-semibold">Active Joined Pools:</span>
                            <span className="font-black text-orange-500">
                              {getActiveJoinedCompanies().length} of {joinedCompanies.length} Pools
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-semibold">Today's Remaining Joins:</span>
                            <span className="font-black text-emerald-500">
                              {getUserDailyJoinLimit(user) === Infinity 
                                ? 'Unlimited Keys' 
                                : `${Math.max(0, getUserDailyJoinLimit(user) - joinedTodayCount)} of ${getUserDailyJoinLimit(user)} left`}
                            </span>
                          </div>
                          <div className="h-[1px] bg-slate-200 dark:bg-zinc-800" />
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                              Estimated Passive Earning:
                            </span>
                            <span className="font-black text-emerald-500">
                              +₦{EARN_COMPANIES.filter(c => getActiveJoinedCompanies().some(jc => jc.companyId === c.id))
                                .reduce((sum, c) => sum + c.dailyEarning, 0)
                                .toLocaleString('en-US', { minimumFractionDigits: 2 })}/day
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-400 leading-relaxed text-center italic mt-1">
                            Joined pools automatically stream Naira directly to your live wallet balance every few seconds.
                          </p>
                        </div>

                        {/* Expired Pool Warning Banner */}
                        {user.kycStatus !== 'verified' && joinedCompanies.some((jc) => Date.now() - new Date(jc.joinedAt).getTime() > 24 * 60 * 60 * 1000) && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] rounded-xl border border-amber-200 dark:border-amber-900/30 flex items-start gap-2 text-left font-semibold">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="font-extrabold text-[11px] uppercase tracking-wide text-amber-850 dark:text-amber-450">⚠️ Trial Revenue Expired</p>
                              <p className="mt-0.5 leading-relaxed text-amber-600 dark:text-amber-400">
                                Your 24-hour trial period has ended. Your active pool has ceased earning. Complete your <strong className="font-bold underline">KYC Verification</strong> to unlock unlimited passive income.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Search and Category Filter */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              placeholder="Search 50 different revenue companies..."
                              value={earnSearch}
                              onChange={(e) => setEarnSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            />
                          </div>

                          {/* Sector Pills */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                            {(['All', 'Energy & Gas', 'Agriculture & Food', 'Real Estate & Infra', 'Local Trade & Retail', 'Tech & Digital'] as const).map((sector) => (
                              <button
                                type="button"
                                key={sector}
                                onClick={() => setEarnSector(sector)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                  earnSector === sector
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-slate-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                                }`}
                              >
                                {sector}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* List of 50 Companies */}
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                          {EARN_COMPANIES.filter((c) => {
                            const matchSearch = c.name.toLowerCase().includes(earnSearch.toLowerCase()) || c.description.toLowerCase().includes(earnSearch.toLowerCase());
                            const matchSector = earnSector === 'All' || c.sector === earnSector;
                            return matchSearch && matchSector;
                          }).map((co) => {
                            const jc = joinedCompanies.find((jc) => jc.companyId === co.id);
                            const isJoined = !!jc;
                            const isExpired = !!(jc && user.kycStatus !== 'verified' && (Date.now() - new Date(jc.joinedAt).getTime() > 24 * 60 * 60 * 1000));
                            return (
                              <div
                                key={co.id}
                                className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl flex items-center justify-between gap-3 shadow-sm transition-all hover:border-orange-500/20"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-zinc-950 flex items-center justify-center text-lg shrink-0 border border-slate-100 dark:border-zinc-850">
                                    {co.emoji}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-xs font-black text-zinc-800 dark:text-white truncate">{co.name}</h4>
                                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 text-[8px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">{co.sector.split(' ')[0]}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1 leading-normal">{co.description}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Earning: +₦{co.dailyEarning.toLocaleString()}/day</p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={isJoined}
                                  onClick={() => handleJoinCompany(co.id)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shrink-0 cursor-pointer ${
                                    isExpired
                                      ? 'bg-red-100 dark:bg-red-950/30 text-red-650 dark:text-red-400 cursor-default'
                                      : isJoined
                                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                                        : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white'
                                  }`}
                                >
                                  {isExpired ? 'Expired ⏳' : isJoined ? 'Joined ✔' : 'Join Pool'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Form 6: Trade Converter */}
                    {activeModal === 'trade' && (
                      user.kycStatus === 'verified' ? (
                        <form onSubmit={handleUsdtTradeSubmit} className="space-y-4">
                          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl text-center flex flex-col items-center justify-center space-y-1">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs font-black text-zinc-800 dark:text-white">Active Conversion Rate</span>
                            <span className="text-[11px] text-zinc-400">1 USDT = ₦1,381.02</span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Convert USDT Volume</label>
                            <div className="relative">
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">USDT</span>
                              <input
                                type="number"
                                required
                                placeholder="e.g. 100"
                                value={tradeUsdtAmount}
                                onChange={(e) => setTradeUsdtAmount(e.target.value)}
                                className="w-full pl-4 pr-16 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-semibold text-zinc-400">Equivalent Naira credit:</span>
                            <span className="text-sm font-black text-emerald-500">
                              ₦{((parseFloat(tradeUsdtAmount) || 0) * 1381.02).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                          >
                            Instant Sell to Wallet <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="py-6 text-center space-y-5">
                          <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
                            <ShieldAlert className="w-7 h-7 stroke-[2px]" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-black text-zinc-800 dark:text-white tracking-tight">KYC Verification Required</h4>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
                              {user.kycStatus === 'pending'
                                ? "Your KYC payment receipt has been submitted and is currently pending review by security admins. Once approved, instant trading will be unlocked."
                                : "You must complete your KYC verification before you can access crypto-to-cash trading features. Please activate your account to proceed."}
                            </p>
                          </div>
                          {user.kycStatus === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModal(null);
                                setCurrentScreen('kyc');
                              }}
                              className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                            >
                              Check Verification Status
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModal(null);
                                setCurrentScreen('kyc');
                              }}
                              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all hover:scale-[1.01] cursor-pointer shadow-md"
                            >
                              Complete KYC Now
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {/* Form 7: Transaction History */}
                    {activeModal === 'transactions' && (
                      <div className="space-y-4">
                        {/* Quick Stats banner */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/80">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Total Inflow</span>
                            <p className="text-sm font-black text-emerald-500 mt-1">
                              +₦{transactions
                                .filter(t => t.type === 'deposit' || t.type === 'exchange')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/80">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Total Outflow</span>
                            <p className="text-sm font-black text-orange-500 mt-1">
                              -₦{transactions
                                .filter(t => t.type !== 'deposit' && t.type !== 'exchange')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Search and Filter */}
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              placeholder="Search by title, subtitle, or ID..."
                              value={txSearch}
                              onChange={(e) => setTxSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 text-zinc-800 dark:text-white"
                            />
                          </div>
                          
                          {/* Segment Filter pills */}
                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                            {(['all', 'in', 'out'] as const).map((mode) => (
                              <button
                                type="button"
                                key={mode}
                                onClick={() => setTxFilter(mode)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black capitalize transition-all cursor-pointer ${
                                  txFilter === mode
                                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10'
                                    : 'bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {mode === 'all' ? 'All Transactions' : mode === 'in' ? 'Money In' : 'Money Out'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar pt-1">
                          {transactions
                            .filter((t) => {
                              const matchSearch = t.title.toLowerCase().includes(txSearch.toLowerCase()) || 
                                                  t.subtitle.toLowerCase().includes(txSearch.toLowerCase()) ||
                                                  t.id.toLowerCase().includes(txSearch.toLowerCase());
                              const matchType = txFilter === 'all' 
                                ? true 
                                : txFilter === 'in' 
                                  ? (t.type === 'deposit' || t.type === 'exchange') 
                                  : (t.type !== 'deposit' && t.type !== 'exchange');
                              return matchSearch && matchType;
                            })
                            .map((tx) => (
                              <div
                                key={tx.id}
                                className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850/60 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`p-2.5 rounded-xl shrink-0 ${
                                    tx.type === 'deposit' || tx.type === 'exchange'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                                      : 'bg-orange-50 dark:bg-orange-950/20 text-orange-500'
                                  }`}>
                                    {tx.type === 'deposit' || tx.type === 'exchange' ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-zinc-850 dark:text-white truncate">{tx.title}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1 leading-normal">{tx.subtitle}</p>
                                    <p className="text-[8px] font-mono text-zinc-400 dark:text-zinc-650 mt-1 uppercase tracking-wide">Ref: {tx.id}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`text-xs font-black ${
                                    tx.type === 'deposit' || tx.type === 'exchange' ? 'text-emerald-500' : 'text-zinc-850 dark:text-white'
                                  }`}>
                                    {tx.type === 'deposit' || tx.type === 'exchange' ? '+' : '-'}₦{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-[9px] text-zinc-400 mt-0.5">{tx.date}</p>
                                </div>
                              </div>
                            ))}

                          {transactions.filter((t) => {
                            const matchSearch = t.title.toLowerCase().includes(txSearch.toLowerCase()) || 
                                                t.subtitle.toLowerCase().includes(txSearch.toLowerCase()) ||
                                                t.id.toLowerCase().includes(txSearch.toLowerCase());
                            const matchType = txFilter === 'all' 
                              ? true 
                              : txFilter === 'in' 
                                ? (t.type === 'deposit' || t.type === 'exchange') 
                                : (t.type !== 'deposit' && t.type !== 'exchange');
                            return matchSearch && matchType;
                          }).length === 0 && (
                            <div className="text-center py-8 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100/50 dark:border-zinc-850/50">
                              <p className="text-xs text-zinc-400">No matching transactions found.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Immersive Installation Modal */}
        <AnimatePresence>
          {showInstallModal && (
            <div className="fixed inset-0 bg-black/70 dark:bg-zinc-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-[32px] overflow-hidden shadow-2xl relative p-6 space-y-6 select-none"
              >
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="absolute right-5 top-5 p-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Brand Logo & Presentation */}
                <div className="text-center space-y-3 pt-2">
                  <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-gradient-to-tr from-[#047857]/10 to-[#F59E0B]/10 dark:from-[#047857]/25 dark:to-[#F59E0B]/5">
                    {/* Beautiful Geometric Volera App Logo - Green & Gold Naira design */}
                    <svg className="w-20 h-20 drop-shadow-[0_0_25px_rgba(4,120,87,0.35)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="46" stroke="url(#goldGradModal)" strokeWidth="1.5" strokeLinecap="round" className="animate-[spin_20s_linear_infinite_reverse]" strokeDasharray="6 8" />
                      <circle cx="50" cy="50" r="41" stroke="url(#goldGradModal)" strokeWidth="4.5" strokeLinecap="round" className="animate-[spin_12s_linear_infinite]" strokeDasharray="160 50" />
                      <circle cx="50" cy="50" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      
                      <polygon points="50,22 75,36 75,64 50,78 25,64 25,36" fill="url(#greenBackdropModal)" stroke="url(#goldBorderModal)" strokeWidth="1.5" />
                      
                      {/* Bold Stylized Naira Currency Sign */}
                      <text x="50" y="59" textAnchor="middle" fill="url(#goldGradModal)" fontSize="28" fontWeight="900" fontFamily="sans-serif">₦</text>
                      
                      <circle cx="50" cy="42" r="2.5" fill="#FFFFFF" className="animate-pulse opacity-40" />
                      
                      <defs>
                        <linearGradient id="goldGradModal" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="50%" stopColor="#D97706" />
                          <stop offset="100%" stopColor="#92400E" />
                        </linearGradient>
                        <linearGradient id="greenBackdropModal" x1="50" y1="22" x2="50" y2="78" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#065F46" />
                          <stop offset="100%" stopColor="#022C22" />
                        </linearGradient>
                        <linearGradient id="goldBorderModal" x1="25" y1="36" x2="75" y2="64" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#D97706" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                      Install Volera Web App
                    </h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-normal font-semibold">
                      Run Volera natively on your phone with zero app-store downloads. Secure, light, and hyper-responsive.
                    </p>
                  </div>
                </div>

                {/* Segmented Device Selector tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850">
                  <button
                    onClick={() => setInstallDeviceTab('android')}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      installDeviceTab === 'android'
                        ? 'bg-white dark:bg-zinc-850 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Android OS
                  </button>
                  <button
                    onClick={() => setInstallDeviceTab('ios')}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      installDeviceTab === 'ios'
                        ? 'bg-white dark:bg-zinc-850 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.37-6.15-2.92-2.35-6.72-6.83-11.4-13.43-5.23-7.41-9.57-16-13.01-25.77-3.44-9.77-5.17-19.16-5.17-28.16 0-14.03 3.86-25.04 11.58-33.02 7.71-7.98 17.11-12 28.19-12.06 5.43 0 10.99 1.51 16.66 4.54 5.68 3.03 9.4 4.54 11.16 4.54 1.48 0 5.16-1.53 11.06-4.58 5.9-3.05 11.1-4.51 15.61-4.4 15.42.33 26.96 5.97 34.62 16.92-13.43 8.16-20.01 19.34-19.75 33.56.27 10.66 4.13 19.38 11.58 26.16 7.45 6.78 16.14 10.5 26.06 11.16-.6 2.92-1.84 6.36-3.71 10.33zM119.53 19.14c0 10.33-4.12 19.57-12.35 27.72-8.23 8.16-17.58 12.56-28.06 13.2-1.03-10.79 3.19-20.35 11.47-28.69 8.28-8.34 18.06-12.8 28.15-13.39.79 1.16.79 1.16.79 1.16z" />
                    </svg>
                    Apple iOS
                  </button>
                </div>

                {/* Steps and Guide Container */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100/60 dark:border-zinc-850/50 text-left space-y-3.5">
                  {typeof window !== 'undefined' && window.self !== window.top && (
                    <div className="p-3 mb-2 bg-emerald-500/10 border border-[#047857]/20 rounded-2xl flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-left space-y-1">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          Active Preview Editor Detected
                        </p>
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 leading-normal">
                          Browsers prevent app installations inside preview frames. Please click the <strong className="font-extrabold text-emerald-600">external open tab button</strong> in top right to run Volera in your main browser, then click Install!
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Manual Steps:
                  </p>
                  
                  {installDeviceTab === 'android' ? (
                    <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#047857]/10 text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-black">1</span>
                        <span>Open Chrome options by tapping the Menu icon (<strong className="font-extrabold text-zinc-900 dark:text-white">⋮</strong>) in the top-right toolbar.</span>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#047857]/10 text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-black">2</span>
                        <span>Find and select <strong className="font-extrabold text-zinc-900 dark:text-white">"Add to Home screen"</strong> or <strong className="font-extrabold text-zinc-900 dark:text-white">"Install app"</strong>.</span>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#047857]/10 text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-black">3</span>
                        <span>Confirm prompt to place Volera securely on your home screen launcher.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#047857]/10 text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-black">1</span>
                        <span>Tap Safari's <strong className="font-extrabold text-zinc-900 dark:text-white">Share</strong> button (<strong className="font-extrabold text-zinc-900 dark:text-white">⎋</strong>) on the bottom navigation bar.</span>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#047857]/10 text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-black">2</span>
                        <span>Scroll through options and click <strong className="font-extrabold text-zinc-900 dark:text-white">"Add to Home Screen"</strong> (<strong className="font-extrabold text-zinc-900 dark:text-white">+</strong>).</span>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#047857]/10 text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-black">3</span>
                        <span>Tap <strong className="font-extrabold text-zinc-900 dark:text-white">Add</strong> in the top-right corner to save launcher icon.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Automated installation engine panel */}
                <div className="space-y-3.5 text-center">
                  {deferredPrompt ? (
                    <button
                      onClick={handleNativeInstall}
                      className="w-full py-4 bg-[#047857] hover:bg-[#035e43] border border-[#F59E0B]/30 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:shadow-emerald-600/15 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" />
                      <span>DOWNLOAD & INSTALL VOLERA</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-[#047857]/20 rounded-2xl text-left space-y-2">
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> Direct App Installation
                      </p>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed">
                        Volera is a modern Progressive Web App (PWA). When you install it, Google Chrome builds and downloads a <strong>real app</strong> (WebAPK) directly onto your Android device. It will appear inside your phone's app drawer, has full standalone memory, and launches full-screen without web browser bars — exactly like OPay or other native apps!
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer specs */}
                <div className="text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-relaxed pt-1.5 border-t border-slate-50 dark:border-zinc-850">
                  Volera PWA Secure Shell (v2.4.0) • Offline-ready • 2.4 MB
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
