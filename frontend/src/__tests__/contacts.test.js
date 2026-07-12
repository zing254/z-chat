import { describe, it, expect } from 'vitest';
import { getAllContacts, getContact, searchContacts } from '../lib/contacts';
import pkg from 'tweetnacl-util';
const { decodeBase64 } = pkg;

describe('contacts', () => {
  it('returns all contacts with valid 32-byte public keys', () => {
    const contacts = getAllContacts();
    expect(contacts.length).toBeGreaterThan(0);
    for (const c of contacts) {
      const bytes = decodeBase64(c.publicKey);
      expect(bytes.length).toBe(32);
    }
  });

  it('looks up a contact by id', () => {
    const first = getAllContacts()[0];
    expect(getContact(first.id).username).toBe(first.username);
  });

  it('falls back to unknown for missing ids', () => {
    const missing = getContact('nope');
    expect(missing.username).toBe('Unknown');
    expect(missing.publicKey).toBe('');
  });

  it('searches contacts case-insensitively', () => {
    const results = searchContacts('neon');
    expect(results.some(c => c.username.toLowerCase().includes('neon'))).toBe(true);
  });
});
