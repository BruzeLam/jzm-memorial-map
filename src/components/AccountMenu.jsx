import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { isCloudEnabled } from '../lib/cloudConfig';
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

function MenuRow({ icon, label, onClick, to, danger = false }) {
  const className = `flex w-full items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${
    danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
  }`;

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

export default function AccountMenu({ onLoginClick }) {
  const { t } = useI18n();
  const { user, isEditor, isSuperAdmin, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
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
    if (!user) return;
    setStatsLoading(true);
    try {
      const next = await fetchMySubmissionStats();
      setStats(next);
    } catch {
      setStats({ total: 0, pending: 0, approved: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    loadStats();
    return undefined;
  }, [open, user, loadStats]);

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

  if (!isCloudEnabled()) return null;

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
  };

  const handleLogin = () => {
    close();
    onLoginClick?.();
  };

  const triggerLabel = user ? getDisplayName(email) : t('account.guest');

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-xl border transition-all ${
          open
            ? 'border-blue-300 bg-white shadow-sm ring-2 ring-blue-100'
            : 'border-gray-200/80 bg-white/80 hover:bg-white hover:border-gray-300 hover:shadow-sm'
        } ${user ? 'pl-1 pr-2 py-1' : 'p-1.5'}`}
        aria-label={t('account.openMenu')}
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={loading}
      >
        <span
          className={`flex items-center justify-center rounded-lg font-semibold text-white shrink-0 ${
            user ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-base bg-gray-400'
          } ${user ? (isEditor ? 'bg-red-700' : 'bg-blue-600') : ''}`}
          aria-hidden
        >
          {user ? getInitial(email) : '👤'}
        </span>
        {user && (
          <span className="hidden sm:block max-w-[72px] truncate text-xs font-medium text-gray-700">
            {triggerLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-200 bg-white shadow-xl z-[1000] overflow-hidden account-menu-panel"
          role="dialog"
          aria-label={t('account.menuTitle')}
        >
          {user ? (
            <>
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-base shrink-0 ${
                      isEditor ? 'bg-red-700' : 'bg-blue-600'
                    }`}
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

              <div className="p-1.5">
                {isEditor && (
                  <>
                    <MenuRow icon="⚙️" label={t('account.adminPanel')} to="/admin" onClick={close} />
                    <MenuRow icon="📋" label={t('account.reviewPanel')} to="/admin/review" onClick={close} />
                  </>
                )}
                <MenuRow icon="↩" label={t('account.logout')} onClick={handleSignOut} danger />
              </div>
            </>
          ) : (
            <div className="p-4">
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
          )}
        </div>
      )}
    </div>
  );
}
