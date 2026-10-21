'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Shield, Clock, Globe } from 'lucide-react';
import { formatDateTimeVN } from '@/lib/utils';

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityType?: string;
  entityId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  timestamp: string;
  createdAt?: string;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AuditDiffModalProps {
  log: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDiffModal({ log, isOpen, onClose }: AuditDiffModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log.details ?? log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasBeforeAfter =
    log.details &&
    typeof log.details === 'object' &&
    ('before' in log.details || 'after' in log.details);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-salon-charcoal rounded-2xl border border-salon-gold/25 shadow-luxury-dark flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-salon-gold/15 flex items-center justify-between bg-salon-noir/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-salon-gold/15 border border-salon-gold/30 flex items-center justify-center text-salon-gold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-salon-ivory">
                Chi Tiết Sự Kiện Kiểm Toán
              </h3>
              <p className="text-xs text-zinc-400 font-mono">ID: {log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-salon-noir/40 border border-salon-gold/10 text-xs">
            <div>
              <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">
                Người thực hiện
              </span>
              <span className="font-semibold text-salon-ivory mt-0.5 block truncate">
                {log.actorName || log.actorEmail || 'Hệ thống'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">
                Vai trò
              </span>
              <span className="font-semibold text-salon-gold mt-0.5 block">
                {log.actorRole || 'SYSTEM'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">
                Hành động
              </span>
              <span className="font-bold text-amber-300 mt-0.5 block">{log.action}</span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">
                Thực thể
              </span>
              <span className="font-semibold text-blue-300 mt-0.5 block truncate">
                {log.entity} {log.entityId ? `(#${log.entityId})` : ''}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Thời gian
              </span>
              <span className="text-zinc-300 mt-0.5 block">
                {formatDateTimeVN(log.timestamp || log.createdAt || '')}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                <Globe className="w-3 h-3" /> Địa chỉ IP
              </span>
              <span className="font-mono text-zinc-300 mt-0.5 block">
                {log.ipAddress || '127.0.0.1'}
              </span>
            </div>
          </div>

          {/* Diff View */}
          {hasBeforeAfter ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                So Sánh Thay Đổi (Before / After)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="text-xs font-bold text-rose-300 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span>Dữ Liệu Trước (Before)</span>
                  </div>
                  <pre className="text-xs font-mono text-rose-200/90 whitespace-pre-wrap overflow-x-auto max-h-72 p-2 rounded bg-black/40">
                    {JSON.stringify(log.details?.before, null, 2) || '(null)'}
                  </pre>
                </div>

                {/* After */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <div className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Dữ Liệu Sau (After)</span>
                  </div>
                  <pre className="text-xs font-mono text-emerald-200/90 whitespace-pre-wrap overflow-x-auto max-h-72 p-2 rounded bg-black/40">
                    {JSON.stringify(log.details?.after, null, 2) || '(null)'}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Dữ Liệu Chi Tiết (Raw JSON)
              </h4>
              <pre className="text-xs font-mono text-zinc-300 p-4 rounded-xl bg-salon-noir border border-salon-gold/15 whitespace-pre-wrap overflow-x-auto max-h-80">
                {JSON.stringify(log.details ?? log, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-salon-gold/15 flex items-center justify-between bg-salon-noir/60">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-salon-gold hover:text-salon-gold-light border border-salon-gold/30 hover:border-salon-gold rounded-lg transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép JSON'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
