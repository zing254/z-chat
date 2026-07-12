import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GhostModeProvider, useGhostMode } from '../context/GhostModeContext';

describe('GhostModeContext', () => {
  it('defaults to ghost mode off and toggles', () => {
    const wrapper = ({ children }) => <GhostModeProvider>{children}</GhostModeProvider>;
    const { result } = renderHook(() => useGhostMode(), { wrapper });

    expect(result.current.ghostMode).toBe(false);
    act(() => result.current.toggleGhostMode());
    expect(result.current.ghostMode).toBe(true);
    act(() => result.current.toggleGhostMode());
    expect(result.current.ghostMode).toBe(false);
  });
});
