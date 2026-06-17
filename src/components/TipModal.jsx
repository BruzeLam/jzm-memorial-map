import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { formatTipHkd } from '../lib/tipConfig';

function TierIcon({ tierId }) {
  if (tierId === 'plus1s') return '⏱️';
  if (tierId === 'small') return '🍵';
  return '🎙️';
}

export default function TipModal({ open, tiers = [], stripeTestMode = false, onClose }) {
  const { t } = useI18n();
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const resetCheckout = useCallback(() => setCheckoutUrl(''), []);

  useEffect(() => {
    if (open) setCheckoutUrl('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (checkoutUrl) resetCheckout();
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, checkoutUrl, resetCheckout]);

  if (!open || !tiers.length) return null;

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
          checkoutUrl ? 'sm:max-w-lg max-h-[92vh]' : 'sm:max-w-md max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-[#e8dcc8]">
          <div>
            <h2 id="tip-modal-title" className="text-base font-semibold text-[#1e3a5f]">
              {t('tip.title')}
            </h2>
            <p className="text-xs text-[#6b5b45] mt-1 leading-relaxed">{t('tip.subtitle')}</p>
            {stripeTestMode && (
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

        {checkoutUrl ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e8dcc8] bg-white/60">
              <button
                type="button"
                onClick={resetCheckout}
                className="text-xs text-[#1e3a5f] hover:underline"
              >
                ← {t('tip.backToTiers')}
              </button>
              <a
                href={checkoutUrl}
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
                src={checkoutUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="payment *"
              />
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto px-4 py-4 space-y-2">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setCheckoutUrl(tier.paymentUrl)}
                className="w-full flex items-center gap-3 rounded-xl border border-[#d4bc8a] bg-white/80 hover:bg-white hover:border-[#c9a86c] px-3 py-3 text-left transition-colors"
              >
                <span className="text-2xl leading-none" aria-hidden>
                  <TierIcon tierId={tier.id} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#1e3a5f]">{tier.label}</span>
                  <span className="block text-[11px] text-[#6b5b45] mt-0.5 truncate">{tier.subtitle}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[#8b6914] tabular-nums">
                  {formatTipHkd(tier.priceHkd)}
                </span>
              </button>
            ))}
            <p className="text-[10px] text-center text-[#6b5b45]/90 leading-relaxed pt-2">
              {t('tip.tierHint')}
            </p>
            <p className="text-[10px] text-center text-[#6b5b45]/90 leading-relaxed">
              {t('tip.footer')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
