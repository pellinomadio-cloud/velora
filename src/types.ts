export interface User {
  username: string;
  email: string;
  pin: string; // 6-digit number password
  balance: number; // in Naira (₦)
  hideBalance: boolean;
  avatarUrl: string; // avatar reference or base64
  joinedAt: string;
  darkMode: boolean;
  kycStatus?: 'unverified' | 'pending' | 'verified';
  kycPaymentProof?: string;
  cardActivationStatus?: 'unverified' | 'pending' | 'verified';
  cardActivationProof?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'send' | 'airtime' | 'data' | 'bills' | 'exchange';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  recipient?: string;
  reference?: string;
}

export interface ESimPlan {
  id: string;
  country: string;
  dataLimit: string;
  validity: string;
  price: number;
  carrier: string;
  isActive: boolean;
}

export interface VirtualCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  color: string;
  type: 'visa' | 'mastercard';
  isFrozen: boolean;
  balance: number;
}
