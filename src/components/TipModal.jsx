import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { TIP_TIERS, TIP_CUSTOM_UNIT_USD, formatTipUsd } from '../lib/tipConfig';

async function createCheckoutSession({ tierId, amountUsd }) {
  const res = await fetch('/api/tip/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tierId ? { tierId } : { amountUsd }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || '创建支付失败');
  }
  return data.checkoutUrl;
}

export default function TipModal({ open, testMode = false, customUnitUsd = TIP_CUSTOM_UNIT_USD, onClose }) {
  const { t } = useI18n();
  const [customAmount, setCustomAmount] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const resetCheckout = useCallback(() => {
    setCheckoutUrl('');
    setError('');
    setIframeBlocked(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetCheckout();
      setCustomAmount('');
    }
  }, [open, resetCheckout]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        if (checkoutUrl) resetCheckout();
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, checkoutUrl, onClose, resetCheckout]);

  const startCheckout = async ({ tierId, amountUsd }) => {
    setLoading(true);
    setError('');
    setIframeBlocked(false);
    try {
      const url = await createCheckoutSession({ tierId, amountUsd });
      setCheckoutUrl(url);
    } catch (err) {
      setError(err.message || t('tip.checkoutError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTier = (tier) => {
    startCheckout({ tierId: tier.id });
  };

  const handleCustom = () => {
    const amount = Number.parseFloat(customAmount);
    if (!Number.isFinite(amount) || amount < customUnitUsd) {
      setError(t('tip.invalidAmountCustom', { min: formatTipUsd(customUnitUsd) }));
      return;
    }
    if (amount > 9999) {
      setError(t('tip.amountTooLarge'));
      return;
    }
    startCheckout({ amountUsd: Math.round(amount * 100) / 100 });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[7500] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-modal-title"
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#faf6ef] border border-[#d4bc8a] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-[#e8dcc8] bg-gradient-to-b from-[#faf6ef] to-[#f5efe3]">
          <div>
            <h2 id="tip-modal-title" className="text-base font-semibold text-[#1e3a5f]">
              {t('tip.title')}
            </h2>
            <p className="text-xs text-[#6b5b45] mt-1 leading-relaxed">{t('tip.subtitle')}</p>
            {testMode && (
              <p className="text-[10px] text-amber-800 font-medium mt-1.5">{t('account.supportTipTest')}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
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
                title={t('tip.checkoutFrameTitle')}
                src={checkoutUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="payment *"
                onError={() => setIframeBlocked(true)}
              />
              {iframeBlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-white/95 text-center">
                  <p className="text-sm text-gray-600">{t('tip.iframeBlocked')}</p>
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-sm font-medium"
                  >
                    {t('tip.openInNewTab')}
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-2">
              {TIP_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleTier(tier)}
                  className="w-full flex items-center gap-3 rounded-xl border border-[#d4bc8a] bg-white/80 hover:bg-white hover:border-[#c9a86c] px-3 py-3 text-left transition-colors disabled:opacity-60"
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {tier.id === 'toosimple' ? '🍵' : tier.id === 'plus1s' ? '⏱️' : '🎙️'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-[#1e3a5f]">{tier.label}</span>
                    <span className="block text-[11px] text-[#6b5b45] mt-0.5 truncate">{tier.subtitle}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-[#8b6914] tabular-nums">
                    {formatTipUsd(tier.priceUsd)}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-dashed border-[#c9a86c] bg-[#f5efe3]/80 p-3">
              <p className="text-xs font-medium text-[#1e3a5f] mb-2">{t('tip.customLabel')}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b5b45]">$</span>
                  <input
                    type="number"
                    min={customUnitUsd}
                    max="9999"
                    step="0.01"
                    inputMode="decimal"
                    placeholder={String(customUnitUsd)}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-[#d4bc8a] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                  />
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCustom}
                  className="shrink-0 px-4 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white text-sm font-medium disabled:opacity-60"
                >
                  {loading ? '…' : t('tip.pay')}
                </button>
              </div>
              <p className="text-[10px] text-[#6b5b45] mt-2">{t('tip.customHint', { min: formatTipUsd(customUnitUsd) })}</p>
            </div>

            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {loading && (
              <p className="text-xs text-center text-[#6b5b45] animate-pulse">{t('tip.loading')}</p>
            )}

            <p className="text-[10px] text-center text-[#6b5b45]/80 leading-relaxed">{t('tip.walletNote')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
