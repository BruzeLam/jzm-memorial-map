import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../admin/useAdminAuth';
import { getAdminEmail, isCloudEnabled } from '../lib/cloudConfig';
import { useI18n } from '../i18n/LanguageContext';

export default function EditorLoginModal({ onClose }) {
  const { t } = useI18n();
  const { signInWithEmail } = useAdminAuth();
  const [email, setEmail] = useState(getAdminEmail() || '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || t('editorLogin.sendFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{t('editorLogin.title')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('editorLogin.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label={t('editorLogin.close')}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!isCloudEnabled() ? (
            <p className="text-sm text-gray-600">{t('editorLogin.notConfigured')}</p>
          ) : sent ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              {t('editorLogin.sent', { email })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('editorLogin.emailLabel')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-xs text-gray-500">{t('editorLogin.adminOnly')}</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? t('editorLogin.sending') : t('editorLogin.sendLink')}
              </button>
            </form>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <Link
              to="/admin/login"
              onClick={onClose}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('editorLogin.goAdmin')} →
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              {t('editorLogin.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
