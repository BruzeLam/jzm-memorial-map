import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { isCloudEnabled } from '../lib/cloudConfig';
import { useTipAvailable } from '../hooks/useTipAvailable';
import TipModal from './TipModal';
import { fetchMySubmissionStats } from '../services/submissions';

function getDisplayName(email) {
  if (!email) return '';
  const local = email.split('@')[0] || email;
  return local.length > 14 ? `${local.slice(0, 12)}…` : local;
}

function getInitial(email) {
  if (!email) return '?';
  const ch = email.trim()[0];
  return ch ? ch.toUpperCase() : '?';
}

function StatCard({ value, label, badge }) {
  return (
    <div className="relative flex-1 min-w-0 rounded-xl bg-gray-50 border border-gray-100 px-2 py-2.5 text-center">
      {badge != null && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold px-1 py-0.5 rounded-full bg-emerald-500 text-white leading-none">
          +{badge}
        </span>
      )}
      <div className="text-lg font-semibold text-gray-900 tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-gray-500 mt-1 leading-tight">{label}</div>
    </div>
  );
}

function MenuRow({ icon, label, onClick, to, href, danger = false }) {
  const className = `flex w-full items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${
    danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  }`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        <span className="w-5 text-center text-base leading-none" aria-hidden>{icon}</span>
        <span>{label}</span>
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        <span className="w-5 text-center text-base leading-none" aria-hidden>{icon}</span>
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <span className="w-5 text-center text-base leading-none" aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function LanguageSection({ onPick }) {
  const { t, locale, setLocale, localeOptions } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const current = localeOptions.find((o) => o.code === locale);

  return (
    <div className="px-1.5 pb-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm rounded-lg text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-2.5">
          <span className="w-5 text-center" aria-hidden>🌐</span>
          <span>{t('sidebar.languageLabel')}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>{current?.native || locale}</span>
          <span className="text-gray-400">{expanded ? '▲' : '›'}</span>
        </span>
      </button>
      {expanded && (
        <div className="mx-1 mt-0.5 max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/80">
          {localeOptions.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                setLocale(opt.code);
                onPick?.();
              }}
              className={`flex w-full items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-white ${
                locale === opt.code ? 'text-blue-700 font-medium bg-blue-50/80' : 'text-gray-700'
              }`}
            >
              <span>{opt.native}</span>
              {locale === opt.code && <span className="text-blue-600 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocalDataSection({ dataReadOnly, onResetToSample, onClearAll, onClose }) {
  const { t } = useI18n();
  if (dataReadOnly || isCloudEnabled() || !onResetToSample) return null;

  return (
    <div className="px-1.5 pb-1 border-t border-gray-100 pt-1">
      <MenuRow
        icon="🔄"
        label={t('sidebar.restoreSample')}
        onClick={() => {
          onResetToSample();
          onClose();
        }}
      />
      <MenuRow
        icon="🗑️"
        label={t('sidebar.clearAll')}
        onClick={() => {
          if (window.confirm(t('sidebar.confirmClearAll'))) {
            onClearAll?.();
            onClose();
          }
        }}
        danger
      />
    </div>
  );
}

export default function AccountMenu({
  onLoginClick,
  dataReadOnly = false,
  onResetToSample,
  onClearAll,
}) {
  const { t } = useI18n();
  const cloudOn = isCloudEnabled();
  const { user, isEditor, isSuperAdmin, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const { enabled: tipEnabled, testMode: tipTestMode } = useTipAvailable();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const rootRef = useRef(null);

  const isContributor = Boolean(user && !isEditor);
  const email = user?.email || '';

  const roleLabel = isSuperAdmin
    ? t('account.roleAdmin')
    : isEditor
      ? t('account.roleEditor')
      : isContributor
        ? t('account.roleContributor')
        : '';

  const loadStats = useCallback(async () => {
    if (!user || !cloudOn) return;
    setStatsLoading(true);
    try {
      const next = await fetchMySubmissionStats();
      setStats(next);
    } catch {
      setStats({ total: 0, pending: 0, approved: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [user, cloudOn]);

  useEffect(() => {
    if (!open || !user || !cloudOn) return undefined;
    loadStats();
    return undefined;
  }, [open, user, cloudOn, loadStats]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
  };

  const handleLogin = () => {
    close();
    onLoginClick?.();
  };

  const avatarClass = user
    ? isEditor
      ? 'bg-red-700'
      : 'bg-blue-600'
    : 'bg-gray-400';

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg font-semibold text-white shrink-0 transition-all ring-1 ring-gray-300 shadow-sm ${
          avatarClass
        } ${open ? 'ring-2 ring-blue-300 ring-offset-1' : 'hover:brightness-95'}`}
        aria-label={t('account.openMenu')}
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={loading}
      >
        {user ? getInitial(email) : '👤'}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-200 bg-white shadow-xl z-[1000] overflow-hidden account-menu-panel"
          role="dialog"
          aria-label={t('account.menuTitle')}
        >
          {user && cloudOn ? (
            <>
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-base shrink-0 ${avatarClass}`}
                    aria-hidden
                  >
                    {getInitial(email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(email)}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5" title={email}>
                      {email}
                    </p>
                  </div>
                  {roleLabel && (
                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {roleLabel}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <StatCard
                    value={statsLoading ? '…' : stats.total}
                    label={t('account.myUploads')}
                  />
                  <StatCard
                    value={statsLoading ? '…' : stats.pending}
                    label={t('account.pendingReview')}
                    badge={stats.pending}
                  />
                  <StatCard value="—" label={t('account.myComments')} />
                </div>
                {!statsLoading && stats.pending > 0 && !isEditor && (
                  <p className="text-[11px] text-amber-800 mt-2 leading-snug">{t('account.contributorHint')}</p>
                )}
              </div>

              <div className="p-1.5 border-b border-gray-100">
                {isEditor && (
                  <>
                    <MenuRow icon="⚙️" label={t('account.adminPanel')} to="/admin" onClick={close} />
                    <MenuRow icon="📋" label={t('account.reviewPanel')} to="/admin/review" onClick={close} />
                  </>
                )}
                <MenuRow icon="↩" label={t('account.logout')} onClick={handleSignOut} danger />
              </div>
            </>
          ) : cloudOn ? (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{t('account.menuTitle')}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{t('account.loginHint')}</p>
              <button
                type="button"
                onClick={handleLogin}
                className="mt-4 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 transition-colors"
              >
                {t('account.login')}
              </button>
            </div>
          ) : (
            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{t('account.menuTitle')}</p>
            </div>
          )}

          {tipEnabled && (
            <div className="px-1.5 py-1.5 border-b border-gray-100">
              <MenuRow
                icon="☕"
                label={t('account.supportTip')}
                onClick={() => {
                  setTipOpen(true);
                  close();
                }}
              />
              <p className="px-3 pt-0.5 pb-1 text-[10px] text-gray-500 leading-snug">
                {t('account.supportTipHint')}
              </p>
            </div>
          )}

          <LanguageSection />
          <LocalDataSection
            dataReadOnly={dataReadOnly}
            onResetToSample={onResetToSample}
            onClearAll={onClearAll}
            onClose={close}
          />
        </div>
      )}
      <TipModal open={tipOpen} testMode={tipTestMode} onClose={() => setTipOpen(false)} />
    </div>
  );
}
