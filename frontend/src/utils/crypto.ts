/**
 * Browser-based cryptographic helpers using Web Crypto API.
 */

// Derive a stable salt from a user's unique Firebase UID
async function deriveSaltFromUid(uid: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(uid + "dams-salt-v1");
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Derives a 256-bit AES-GCM key from a user passphrase and their Firebase UID.
 */
export async function deriveKey(passphrase: string, uid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  const salt = await deriveSaltFromUid(uid);

  // Import raw passphrase as a key-producing base
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM 256 key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // key is not exportable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a File object using the derived CryptoKey.
 * Returns a Blob containing [12-byte IV | ciphertext].
 */
export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
  const fileBytes = await file.arrayBuffer();
  
  // Generate random 12-byte IV (96-bit nonce)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    fileBytes as ArrayBuffer
  );

  // Combine IV (12 bytes) and ciphertext
  const ivAndCiphertext = new Uint8Array(12 + ciphertextBuffer.byteLength);
  ivAndCiphertext.set(iv, 0);
  ivAndCiphertext.set(new Uint8Array(ciphertextBuffer), 12);

  return new Blob([ivAndCiphertext], { type: 'application/octet-stream' });
}

/**
 * Decrypts a Blob object using the derived CryptoKey.
 * Extracts the 12-byte IV from the front and decrypts the rest.
 */
export async function decryptBlob(encryptedBlob: Blob, key: CryptoKey, originalMimeType: string): Promise<Blob> {
  const encryptedBytes = await encryptedBlob.arrayBuffer();
  
  if (encryptedBytes.byteLength < 12) {
    throw new Error("Invalid encrypted data (too short)");
  }

  // Split IV and ciphertext
  const iv = new Uint8Array(encryptedBytes, 0, 12);
  const ciphertext = new Uint8Array(encryptedBytes, 12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext as unknown as BufferSource
  );

  return new Blob([decryptedBuffer], { type: originalMimeType });
}
