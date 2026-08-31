import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReviewBadge, CIBadge, SLABadge } from './StatusBadges';

describe('StatusBadges', () => {
  describe('ReviewBadge', () => {
    it('renders Approved review badge', () => {
      render(<ReviewBadge decision="APPROVED" />);
      expect(screen.getByText(/Approved/i)).toBeInTheDocument();
    });

    it('renders Changes Requested review badge', () => {
      render(<ReviewBadge decision="CHANGES_REQUESTED" />);
      expect(screen.getByText(/Changes Requested/i)).toBeInTheDocument();
    });

    it('renders Draft review badge', () => {
      render(<ReviewBadge decision="DRAFT" />);
      expect(screen.getByText(/Draft/i)).toBeInTheDocument();
    });

    it('renders Review Required badge for REVIEW_REQUIRED or default', () => {
      render(<ReviewBadge decision="REVIEW_REQUIRED" />);
      expect(screen.getByText(/Review Required/i)).toBeInTheDocument();
    });
  });

  describe('CIBadge', () => {
    it('renders CI passing badge', () => {
      render(<CIBadge status="SUCCESS" />);
      expect(screen.getByLabelText(/CI Passing/i)).toBeInTheDocument();
    });

    it('renders CI failing badge', () => {
      render(<CIBadge status="FAILURE" />);
      expect(screen.getByLabelText(/CI Failing/i)).toBeInTheDocument();
    });

    it('renders CI pending badge', () => {
      render(<CIBadge status="PENDING" />);
      expect(screen.getByLabelText(/CI Pending/i)).toBeInTheDocument();
    });

    it('renders No CI Status badge for NEUTRAL or default', () => {
      render(<CIBadge status="NEUTRAL" />);
      expect(screen.getByLabelText(/No CI Status/i)).toBeInTheDocument();
    });
  });

  describe('SLABadge', () => {
    it('renders Stale SLA warning badge', () => {
      render(<SLABadge status="stale" />);
      expect(screen.getByText(/Stale > 48h/i)).toBeInTheDocument();
    });

    it('renders warning SLA badge', () => {
      render(<SLABadge status="warning" />);
      expect(screen.getByText(/> 24h idle/i)).toBeInTheDocument();
    });

    it('renders normal/active SLA badge', () => {
      render(<SLABadge status="normal" />);
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });
  });
});
