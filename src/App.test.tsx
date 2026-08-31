import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Smoke Test', () => {
  it('renders app title', () => {
    render(<App />);
    expect(screen.getByText(/GitHub PR Dashboard/i)).toBeInTheDocument();
  });
});
