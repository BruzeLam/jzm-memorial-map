import React from 'react';
import { useI18n } from '../i18n/LanguageContext';

export default function SubmissionSuccessModal({ onClose }) {
  const { t } = useI18n();

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t('submission.successTitle')}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{t('submission.successBody')}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
