import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { isCloudEnabled } from '../lib/cloudConfig';

export default function AccountBar({ onLoginClick, compact = false }) {
  const { t } = useI18n();
  const { user, isEditor, isSuperAdmin, signOut, loading } = useAuth();

  if (!isCloudEnabled()) return null;

  const email = user?.email || '';
  const shortEmail = email.length > 22 ? `${email.slice(0, 20)}…` : email;
  const isContributor = Boolean(user && !isEditor);

  const roleLabel = isSuperAdmin
    ? t('account.roleAdmin')
    : isEditor
      ? t('account.roleEditor')
      : isContributor
        ? t('account.roleContributor')
        : '';

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className={`border-t border-gray-100 bg-gray-50 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
        <p className="text-xs text-gray-400">{t('account.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white ${
          compact ? 'px-2 py-2' : 'px-3 py-2.5'
        }`}
      >
        {!compact && (
          <p className="text-xs text-gray-500 mb-2 leading-relaxed">{t('account.loginHint')}</p>
        )}
        <button
          type="button"
          onClick={onLoginClick}
          className={`w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors ${
            compact ? 'text-xs py-1.5 px-2' : 'text-sm py-2 px-3'
          }`}
        >
          {t('account.login')}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white ${
        compact ? 'px-2 py-2' : 'px-3 py-2.5'
      }`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden>
          👤
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 truncate" title={email}>
            {shortEmail}
          </p>
          {roleLabel && (
            <p className="text-[11px] text-gray-500 mt-0.5">{roleLabel}</p>
          )}
          {!isEditor && isContributor && !compact && (
            <p className="text-[11px] text-amber-800 mt-1 leading-snug">{t('account.contributorHint')}</p>
          )}
        </div>
      </div>

      <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
        {isEditor && (
          <>
            <Link
              to="/admin"
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            >
              {t('account.adminPanel')}
            </Link>
            <Link
              to="/admin/review"
              className="text-[11px] px-2 py-1 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900"
            >
              {t('account.reviewPanel')}
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-[11px] px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
        >
          {t('account.logout')}
        </button>
      </div>
    </div>
  );
}
