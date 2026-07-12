import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncryption } from '../hooks/useEncryption';
import { AuthProvider } from '../context/AuthContext';

describe('useEncryption', () => {
  it('should become ready after initialization', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useEncryption(), { wrapper });

    await vi.waitFor(() => expect(result.current.ready).toBe(true), { timeout: 5000 });
  }, 10000);

  it('should generate a new key pair', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useEncryption(), { wrapper });
    await vi.waitFor(() => expect(result.current.ready).toBe(true), { timeout: 5000 });

    let newPair;
    await act(async () => {
      newPair = await result.current.generateNewKeyPair();
    });
    expect(newPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(newPair.secretKey).toBeInstanceOf(Uint8Array);
  }, 10000);

  it('should return a public key string', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useEncryption(), { wrapper });
    await vi.waitFor(() => expect(result.current.ready).toBe(true), { timeout: 5000 });

    const pkStr = result.current.getPublicKeyString();
    expect(pkStr).toBeTruthy();
    expect(typeof pkStr).toBe('string');
  }, 10000);
});