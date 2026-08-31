import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileCode2, Check, HelpCircle } from 'lucide-react';
import { ReviewDecision, CIStatus, SLAStatus } from '../types';

export const ReviewBadge: React.FC<{ decision: ReviewDecision }> = ({ decision }) => {
  switch (decision) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">
          <Check className="w-3 h-3 text-emerald-400" /> Approved
        </span>
      );
    case 'CHANGES_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950/70 border border-rose-700/60 text-rose-300">
          <XCircle className="w-3 h-3 text-rose-400" /> Changes Requested
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400">
          <FileCode2 className="w-3 h-3" /> Draft
        </span>
      );
    case 'REVIEW_REQUIRED':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 border border-amber-700/60 text-amber-300">
          <Clock className="w-3 h-3 text-amber-400" /> Review Required
        </span>
      );
  }
};

export const CIBadge: React.FC<{ status: CIStatus }> = ({ status }) => {
  switch (status) {
    case 'SUCCESS':
      return (
        <span aria-label="CI Passing" title="All checks passed" className="text-emerald-400 inline-flex items-center">
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    case 'FAILURE':
      return (
        <span aria-label="CI Failing" title="Checks failing" className="text-rose-400 inline-flex items-center">
          <XCircle className="w-4 h-4" />
        </span>
      );
    case 'PENDING':
      return (
        <span aria-label="CI Pending" title="Checks in progress" className="text-amber-400 inline-flex items-center animate-pulse">
          <Clock className="w-4 h-4" />
        </span>
      );
    case 'NEUTRAL':
    default:
      return (
        <span aria-label="No CI Status" title="No checks reported" className="text-slate-600 inline-flex items-center">
          <HelpCircle className="w-4 h-4" />
        </span>
      );
  }
};

export const SLABadge: React.FC<{ status: SLAStatus }> = ({ status }) => {
  switch (status) {
    case 'stale':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 border border-rose-800 text-rose-300">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> Stale &gt; 48h
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
          <Clock className="w-3 h-3 text-amber-400" /> &gt; 24h idle
        </span>
      );
    case 'normal':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-emerald-400/80 bg-emerald-950/30">
          Active
        </span>
      );
  }
};
