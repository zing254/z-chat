import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '../components/Chat/MessageBubble';

describe('MessageBubble', () => {
  it('renders outgoing message with text', () => {
    const msg = {
      messageId: '1',
      direction: 'outgoing',
      plaintext: 'Hello world',
      status: 'sent',
      ttl: 0,
      timestamp: Date.now(),
    };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders incoming message with text', () => {
    const msg = {
      messageId: '2',
      direction: 'incoming',
      plaintext: 'Secret message',
      status: 'delivered',
      ttl: 0,
      timestamp: Date.now(),
    };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText('Secret message')).toBeTruthy();
  });

  it('renders burned log for deleted messages', () => {
    const msg = {
      messageId: '3',
      direction: 'incoming',
      plaintext: '',
      status: 'deleted',
      isBurned: true,
      burnTimestamp: Date.now(),
      timestamp: Date.now(),
    };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText(/Message burned/i)).toBeTruthy();
  });
});