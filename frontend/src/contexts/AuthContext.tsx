import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { deriveKey } from '../utils/crypto';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  vaultKey: CryptoKey | null;
  unlockVault: (passphrase: string) => Promise<void>;
  isVaultUnlocked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
  vaultKey: null,
  unlockVault: async () => {},
  isVaultUnlocked: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [initializingVault, setInitializingVault] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Attempt to auto-restore vault from session storage
        const savedPassphrase = sessionStorage.getItem(`dams_vault_pass_${user.uid}`);
        if (savedPassphrase) {
          try {
            const key = await deriveKey(savedPassphrase, user.uid);
            setVaultKey(key);
          } catch (e) {
            console.error("Failed to auto-restore vault key:", e);
            sessionStorage.removeItem(`dams_vault_pass_${user.uid}`);
          }
        }
      } else {
        setVaultKey(null);
      }
      setInitializingVault(false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const unlockVault = async (passphrase: string) => {
    if (!currentUser) throw new Error("No user logged in");
    const key = await deriveKey(passphrase, currentUser.uid);
    setVaultKey(key);
    sessionStorage.setItem(`dams_vault_pass_${currentUser.uid}`, passphrase);
  };

  const logout = async () => {
    if (currentUser) {
      sessionStorage.removeItem(`dams_vault_pass_${currentUser.uid}`);
    }
    setVaultKey(null);
    await firebaseSignOut(auth);
  };
  
  const isAdmin = currentUser?.email === 'bandarunikitha97@gmail.com';
  const isVaultUnlocked = !!vaultKey;

  const isContextLoading = loading || (!!currentUser && initializingVault);

  return (
    <AuthContext.Provider value={{ currentUser, loading: isContextLoading, isAdmin, logout, vaultKey, unlockVault, isVaultUnlocked }}>
      {!isContextLoading && children}
    </AuthContext.Provider>
  );
};
