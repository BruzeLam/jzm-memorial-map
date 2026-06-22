import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { isCloudEnabled, getAdminEmail } from '../lib/cloudConfig';
import { getBranding } from '../config/branding';
import { formatAuthEmailErrorZh } from '../utils/authErrors';

export default function AdminLogin() {
  const { signInWithEmail } = useAdminAuth();
  const [email, setEmail] = useState(getAdminEmail() || '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isCloudEnabled()) {
    return (
      <div className="admin-shell items-center justify-center p-4">
        <div className="admin-card p-6 max-w-md w-full">
          <h1 className="text-lg font-bold font-memorial text-memorial-navy mb-2">后台未配置</h1>
          <p className="text-sm text-memorial-muted mb-4">
            请在环境变量中设置 <code className="text-xs bg-memorial-cream px-1 rounded">REACT_APP_SUPABASE_URL</code>、
            <code className="text-xs bg-memorial-cream px-1 rounded">REACT_APP_SUPABASE_ANON_KEY</code> 与{' '}
            <code className="text-xs bg-memorial-cream px-1 rounded">REACT_APP_ADMIN_EMAIL</code>。
          </p>
          <Link to="/" className="text-sm text-memorial-navy hover:underline">← 返回地图</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(formatAuthEmailErrorZh(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell items-center justify-center p-4 bg-gradient-to-b from-memorial-cream-dark to-memorial-cream">
      <div className="admin-card p-6 max-w-md w-full">
        <p className="text-xs text-memorial-muted mb-1">{getBranding().adminTitle}</p>
        <h1 className="text-xl font-memorial font-bold text-memorial-navy mb-1">超级管理员登录</h1>
        <p className="text-sm text-memorial-muted mb-6">{getBranding().adminSubtitle}</p>

        {sent ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 mb-4">
            登录链接已发送至 <strong>{email}</strong>，请查收邮件并点击链接完成登录。
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">管理员邮箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
                placeholder="your@email.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 memorial-btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? '发送中…' : '发送魔法链接'}
            </button>
          </form>
        )}

        <Link to="/" className="inline-block mt-6 text-sm text-memorial-muted hover:text-memorial-ink">← 返回地图</Link>
      </div>
    </div>
  );
}
