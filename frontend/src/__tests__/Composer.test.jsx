import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Composer from '../components/Chat/Composer';

describe('Composer', () => {
  it('renders contenteditable input', () => {
    const { container } = render(<Composer onSend={() => {}} />);
    const editor = container.querySelector('[contenteditable]');
    expect(editor).toBeTruthy();
  });

  it('renders send button (last button in composer)', () => {
    const { container } = render(<Composer onSend={() => {}} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onSend when text is entered and Cmd+Enter pressed', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const editor = document.querySelector('[contenteditable]');
    fireEvent.input(editor, { target: { textContent: 'test message' } });
    fireEvent.keyDown(editor, { key: 'Enter', metaKey: true });
    expect(onSend).toHaveBeenCalledWith('test message', false);
  });

  it('does not send on plain Enter without modifier', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const editor = document.querySelector('[contenteditable]');
    fireEvent.input(editor, { target: { textContent: 'test' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });
});