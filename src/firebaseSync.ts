import { doc, setDoc, getDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { User, Transaction } from './types';

// Sync a user profile to firestore
export async function syncUserToFirebase(user: User): Promise<void> {
  if (!user || !user.email) return;
  const path = `users/${user.email.toLowerCase()}`;
  try {
    const userRef = doc(db, 'users', user.email.toLowerCase());
    await setDoc(userRef, {
      username: user.username,
      email: user.email,
      pin: user.pin,
      balance: user.balance,
      hideBalance: user.hideBalance,
      avatarUrl: user.avatarUrl,
      joinedAt: user.joinedAt,
      darkMode: user.darkMode,
      kycStatus: user.kycStatus || 'unverified',
      kycPlan: user.kycPlan || 'two_key',
      kycPaymentProof: user.kycPaymentProof || '',
      cardActivationStatus: user.cardActivationStatus || 'unverified',
      cardActivationProof: user.cardActivationProof || '',
      isBanned: user.isBanned || false,
      referredBy: user.referredBy || '',
      referralCode: user.referralCode || '',
      referralCount: user.referralCount || 0,
      referralEarnings: user.referralEarnings || 0
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync a single transaction to user subcollection
export async function syncTransactionToFirebase(email: string, tx: Transaction): Promise<void> {
  if (!email || !tx || !tx.id) return;
  const path = `users/${email.toLowerCase()}/transactions/${tx.id}`;
  try {
    const txRef = doc(db, 'users', email.toLowerCase(), 'transactions', tx.id);
    await setDoc(txRef, {
      id: tx.id,
      type: tx.type,
      title: tx.title,
      subtitle: tx.subtitle || '',
      amount: tx.amount,
      date: tx.date,
      status: tx.status,
      recipient: tx.recipient || '',
      reference: tx.reference || ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync a joined company to user subcollection
export async function syncJoinedCompanyToFirebase(email: string, jc: { companyId: string; joinedAt: string }): Promise<void> {
  if (!email || !jc || !jc.companyId) return;
  const path = `users/${email.toLowerCase()}/joinedCompanies/${jc.companyId}`;
  try {
    const jcRef = doc(db, 'users', email.toLowerCase(), 'joinedCompanies', jc.companyId);
    await setDoc(jcRef, {
      companyId: jc.companyId,
      joinedAt: jc.joinedAt
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remove joined company from user subcollection
export async function removeJoinedCompanyFromFirebase(email: string, companyId: string): Promise<void> {
  if (!email || !companyId) return;
  const path = `users/${email.toLowerCase()}/joinedCompanies/${companyId}`;
  try {
    const jcRef = doc(db, 'users', email.toLowerCase(), 'joinedCompanies', companyId);
    await deleteDoc(jcRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Fetch all users from firestore (for Admin dashboard)
export async function getAllUsersFromFirebase(): Promise<User[]> {
  const path = 'users';
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        username: data.username,
        email: data.email,
        pin: data.pin,
        balance: data.balance,
        hideBalance: data.hideBalance || false,
        avatarUrl: data.avatarUrl || '🧑🏾‍💻',
        joinedAt: data.joinedAt,
        darkMode: data.darkMode || false,
        kycStatus: data.kycStatus,
        kycPlan: data.kycPlan,
        kycPaymentProof: data.kycPaymentProof,
        cardActivationStatus: data.cardActivationStatus,
        cardActivationProof: data.cardActivationProof,
        isBanned: data.isBanned || false,
        referredBy: data.referredBy || '',
        referralCode: data.referralCode || '',
        referralCount: data.referralCount || 0,
        referralEarnings: data.referralEarnings || 0
      });
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Fetch system config
export async function getSystemConfigFromFirebase(): Promise<any> {
  const path = 'system/config';
  try {
    const configRef = doc(db, 'system', 'config');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Update system config
export async function updateSystemConfigInFirebase(config: { accountNumber: string; accountName: string; fee: number; supportLink: string }): Promise<void> {
  const path = 'system/config';
  try {
    const configRef = doc(db, 'system', 'config');
    await setDoc(configRef, config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch subcollection data for a single user (Transactions)
export async function getUserTransactionsFromFirebase(email: string): Promise<Transaction[]> {
  if (!email) return [];
  const path = `users/${email.toLowerCase()}/transactions`;
  try {
    const txCol = collection(db, 'users', email.toLowerCase(), 'transactions');
    const snapshot = await getDocs(txCol);
    const txs: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      txs.push({
        id: data.id,
        type: data.type,
        title: data.title,
        subtitle: data.subtitle || '',
        amount: data.amount,
        date: data.date,
        status: data.status,
        recipient: data.recipient || '',
        reference: data.reference || ''
      });
    });
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Fetch subcollection data for joined companies
export async function getUserJoinedCompaniesFromFirebase(email: string): Promise<{ companyId: string; joinedAt: string }[]> {
  if (!email) return [];
  const path = `users/${email.toLowerCase()}/joinedCompanies`;
  try {
    const jcCol = collection(db, 'users', email.toLowerCase(), 'joinedCompanies');
    const snapshot = await getDocs(jcCol);
    const jcs: { companyId: string; joinedAt: string }[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      jcs.push({
        companyId: data.companyId,
        joinedAt: data.joinedAt
      });
    });
    return jcs;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Helper to seed or batch sync all existing localStorage users to Firebase on admin load or app load
export async function seedUsersToFirebase(localUsers: User[]): Promise<void> {
  for (const user of localUsers) {
    try {
      const userRef = doc(db, 'users', user.email.toLowerCase());
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await syncUserToFirebase(user);
        
        // Also sync any existing offline transactions if stored locally
        const savedTxs = localStorage.getItem(`velora_txs_${user.email}`);
        if (savedTxs) {
          const parsedTxs: Transaction[] = JSON.parse(savedTxs);
          for (const tx of parsedTxs) {
            await syncTransactionToFirebase(user.email, tx);
          }
        }

        // Also sync any joined companies
        const savedCompanies = localStorage.getItem(`velora_joined_companies_${user.email}`);
        if (savedCompanies) {
          const parsedCos = JSON.parse(savedCompanies);
          for (const jc of parsedCos) {
            await syncJoinedCompanyToFirebase(user.email, jc);
          }
        }
      }
    } catch (err) {
      console.error('Error seeding user to Firebase:', user.email, err);
    }
  }
}
