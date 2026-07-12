import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DissolveEffect from '../components/Chat/DissolveEffect';

describe('DissolveEffect', () => {
  it('renders a canvas element', () => {
    const { container } = render(
      <DissolveEffect text="test" duration={100} onComplete={() => {}} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});