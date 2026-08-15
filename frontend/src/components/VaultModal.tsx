import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShieldAlert, Key, Unlock, ShieldCheck, Loader2, LogOut } from 'lucide-react';

// Verification canary details
const CANARY_TEXT = "dams_vault_unlocked";

const VaultModal = () => {
  const { currentUser, unlockVault, isVaultUnlocked, logout } = useAuth();
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [checkingCanary, setCheckingCanary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkUserVaultStatus = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'vaultCanaries', currentUser.uid);
        const docSnap = await getDoc(docRef);
        setIsNewUser(!docSnap.exists());
      } catch (err) {
        console.error("Error checking vault status:", err);
        setError("Failed to connect to security database.");
      } finally {
        setCheckingCanary(false);
      }
    };
    checkUserVaultStatus();
  }, [currentUser]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || passphrase.length < 6) {
      setError("Passphrase must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isNewUser) {
        if (passphrase !== confirmPassphrase) {
          setError("Passphrases do not match.");
          setLoading(false);
          return;
        }

        // 1. Derive the key
        await unlockVault(passphrase);
        const tempKey = await unlockVaultKey(passphrase, currentUser.uid);

        // 2. Encrypt canary text to save to Firestore
        const encoder = new TextEncoder();
        const data = encoder.encode(CANARY_TEXT);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          tempKey,
          data
        );

        // 3. Save to Firestore
        const docRef = doc(db, 'vaultCanaries', currentUser.uid);
        await setDoc(docRef, {
          encryptedCanary: arrayBufferToBase64(encryptedBuffer),
          iv: arrayBufferToBase64(iv.buffer)
        });

      } else {
        // Fetch canary
        const docRef = doc(db, 'vaultCanaries', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setIsNewUser(true);
          setLoading(false);
          return;
        }

        const { encryptedCanary, iv: ivBase64 } = docSnap.data();
        const tempKey = await unlockVaultKey(passphrase, currentUser.uid);
        
        const encryptedBytes = base64ToArrayBuffer(encryptedCanary);
        const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

        try {
          // Decrypt canary
          const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            tempKey,
            encryptedBytes
          );

          const decoder = new TextDecoder();
          const decryptedText = decoder.decode(decryptedBuffer);

          if (decryptedText === CANARY_TEXT) {
            // Success! Save the key in context
            await unlockVault(passphrase);
          } else {
            throw new Error("Canary mismatch");
          }
        } catch (decryptionError) {
          setError("Incorrect passphrase. Please try again.");
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to configure security vault.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to derive key locally for temporary validation
  const unlockVaultKey = async (pass: string, uid: string) => {
    const { deriveKey } = await import('../utils/crypto');
    return await deriveKey(pass, uid);
  };

  // Encoding helpers
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  if (isVaultUnlocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            {isNewUser ? (
              <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {checkingCanary ? 'Checking Vault Status...' : isNewUser ? 'Configure Secure Vault' : 'Unlock Your Secure Vault'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              {isNewUser 
                ? 'Create a Vault Passphrase. All your files will be encrypted locally in your browser. If you lose this, your files are gone forever.'
                : 'Enter your Vault Passphrase to decrypt your files locally in your browser.'}
            </p>
          </div>

          {checkingCanary ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vault Passphrase
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {isNewUser && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Confirm Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat passphrase"
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isNewUser ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Initialize Vault</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>Unlock Vault</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={logout}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-70 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-lg transition-all mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultModal;
