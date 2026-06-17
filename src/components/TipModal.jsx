import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { TIP_TIERS, formatTipCny } from '../lib/tipConfig';

export default function TipModal({ open, methods, stripeTestMode = false, onClose }) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState(methods[0]?.id);

  const active = useMemo(
    () => methods.find((m) => m.id === activeId) || methods[0],
    [methods, activeId]
  );

  useEffect(() => {
    if (open && methods[0]) setActiveId(methods[0].id);
  }, [open, methods]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !active) return null;

  const isStripe = active.type === 'stripe';
  const showTabs = methods.length > 1;

  return (
    <div
      className="fixed inset-0 z-[7500] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-modal-title"
    >
      <div
        className={`relative w-full flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#faf6ef] border border-[#d4bc8a] shadow-xl overflow-hidden ${
          isStripe ? 'sm:max-w-lg max-h-[92vh]' : 'sm:max-w-md max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-[#e8dcc8]">
          <div>
            <h2 id="tip-modal-title" className="text-base font-semibold text-[#1e3a5f]">
              {t('tip.title')}
            </h2>
            <p className="text-xs text-[#6b5b45] mt-1 leading-relaxed">
              {isStripe ? t('tip.stripeSubtitle') : t('tip.domesticSubtitle')}
            </p>
            {isStripe && stripeTestMode && (
              <p className="text-[10px] text-amber-800 font-medium mt-1.5">{t('tip.stripeTest')}</p>
            )}
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

        {showTabs && (
          <div className="px-4 pt-3 pb-0">
            <div className="flex rounded-xl bg-[#efe6d4]/60 p-1 gap-1 overflow-x-auto">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveId(m.id)}
                  className={`flex-1 min-w-0 py-2 px-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active.id === m.id
                      ? 'bg-white text-[#1e3a5f] shadow-sm'
                      : 'text-[#6b5b45] hover:text-[#1e3a5f]'
                  }`}
                >
                  {m.type === 'wechat' && '💚 '}
                  {m.type === 'alipay' && '💙 '}
                  {m.type === 'stripe' && '💳 '}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isStripe ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-end px-4 py-2 border-b border-[#e8dcc8] bg-white/60">
              <a
                href={active.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#8b6914] hover:underline"
              >
                {t('tip.openInNewTab')}
              </a>
            </div>
            <div className="relative flex-1 min-h-[420px] sm:min-h-[480px] bg-white">
              <iframe
                title={t('tip.stripeFrameTitle')}
                src={active.paymentUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="payment *"
              />
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto px-4 py-4 space-y-4">
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
        )}
      </div>
    </div>
  );
}
