import { describe, it, expect } from 'vitest';
import ChatWindow from '../pages/ChatWindow';

describe('ChatWindow', () => {
  it('exports a valid React component', () => {
    expect(typeof ChatWindow).toBe('function');
  });

  // The full component requires an authenticated user via AuthContext.
  // Integration test for ChatWindow belongs in E2E (Playwright) with a real browser.
});