import { useEffect, useState, useCallback } from 'react';
import { generateKeyPair, encryptMessage, decryptMessage } from '../lib/crypto/naclWrapper';
import { encodeBase64 } from 'tweetnacl-util';
import { loadKeyPair, saveKeyPair } from '../lib/store/keyStore';
import { useAuth } from '../context/AuthContext';

export function useEncryption() {
  const { user, keyPair, signIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function init() {
      let stored = await loadKeyPair();
      if (!stored) {
        stored = generateKeyPair();
        await saveKeyPair(stored);
      }
      // AuthContext already restores the persisted identity from localStorage;
      // bind the loaded keypair to it so the session survives a reload and
      // previously-received ciphertext stays decryptable. When no identity
      // exists yet (first visit), fall back to binding the keypair with a
      // null user so encrypt/decrypt/getPublicKey still work.
      if (!keyPair) {
        signIn(user || null, stored);
      }
      setReady(true);
    }
    init();
  }, [user, keyPair, signIn]);

  const generateNewKeyPair = useCallback(async () => {
    setGenerating(true);
    const newPair = generateKeyPair();
    await saveKeyPair(newPair);
    setGenerating(false);
    return newPair;
  }, []);

  const encrypt = useCallback((plainText, recipientPublicKey) => {
    if (!keyPair) throw new Error('Keys not ready');
    return encryptMessage(plainText, recipientPublicKey, keyPair.secretKey);
  }, [keyPair]);

  const decrypt = useCallback((payload) => {
    if (!keyPair) throw new Error('Keys not ready');
    return decryptMessage(payload, keyPair.secretKey);
  }, [keyPair]);

  const getPublicKeyString = useCallback(() => {
    if (!keyPair) return '';
    return encodeBase64(keyPair.publicKey);
  }, [keyPair]);

  return { ready, generating, generateNewKeyPair, encrypt, decrypt, getPublicKeyString };
}