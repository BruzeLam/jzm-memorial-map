import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { TIP_TIERS, formatTipCny } from '../lib/tipConfig';

export default function TipModalDomestic({ open, channels, onClose }) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState(channels[0]?.id || 'wechat');

  const active = useMemo(
    () => channels.find((c) => c.id === activeId) || channels[0],
    [channels, activeId]
  );

  useEffect(() => {
    if (open && channels[0]) setActiveId(channels[0].id);
  }, [open, channels]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !active) return null;

  return (
    <div
      className="fixed inset-0 z-[7500] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-domestic-title"
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#faf6ef] border border-[#d4bc8a] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-[#e8dcc8]">
          <div>
            <h2 id="tip-domestic-title" className="text-base font-semibold text-[#1e3a5f]">
              {t('tip.title')}
            </h2>
            <p className="text-xs text-[#6b5b45] mt-1 leading-relaxed">{t('tip.domesticSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full text-[#6b5b45] hover:bg-[#efe6d4] text-lg leading-none"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-4">
          {channels.length > 1 && (
            <div className="flex rounded-xl bg-[#efe6d4]/60 p-1 gap-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveId(ch.id)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active.id === ch.id
                      ? 'bg-white text-[#1e3a5f] shadow-sm'
                      : 'text-[#6b5b45] hover:text-[#1e3a5f]'
                  }`}
                >
                  {ch.id === 'wechat' ? '💚 ' : '💙 '}
                  {ch.label}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-[#d4bc8a] bg-white p-4 text-center">
            <p className="text-sm font-medium text-[#1e3a5f] mb-3">
              {t('tip.scanToPay', { channel: active.label })}
            </p>
            <div className="inline-block p-2 rounded-xl bg-white border border-gray-100 shadow-inner">
              <img
                src={active.qrUrl}
                alt={active.label}
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain mx-auto"
              />
            </div>
            <p className="text-[11px] text-[#6b5b45] mt-3 leading-relaxed">{t('tip.domesticScanHint')}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#1e3a5f]">{t('tip.suggestAmounts')}</p>
            {TIP_TIERS.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center gap-3 rounded-xl border border-[#e8dcc8] bg-white/70 px-3 py-2.5"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {tier.id === 'toosimple' ? '🍵' : tier.id === 'plus1s' ? '⏱️' : '🎙️'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[#1e3a5f]">{tier.label}</span>
                  <span className="block text-[10px] text-[#6b5b45] truncate">{tier.subtitle}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[#8b6914] tabular-nums">
                  {formatTipCny(tier.suggestCny)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center text-[#6b5b45]/90 leading-relaxed">{t('tip.domesticFooter')}</p>
        </div>
      </div>
    </div>
  );
}
