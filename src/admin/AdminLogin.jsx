import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { isCloudEnabled, getAdminEmail } from '../lib/cloudConfig';
import { getBranding } from '../config/branding';

export default function AdminLogin() {
  const { signInWithEmail } = useAdminAuth();
  const [email, setEmail] = useState(getAdminEmail() || '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isCloudEnabled()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-200">
          <h1 className="text-lg font-bold text-gray-800 mb-2">后台未配置</h1>
          <p className="text-sm text-gray-600 mb-4">
            请在环境变量中设置 <code className="text-xs bg-gray-100 px-1 rounded">REACT_APP_SUPABASE_URL</code>、
            <code className="text-xs bg-gray-100 px-1 rounded">REACT_APP_SUPABASE_ANON_KEY</code> 与{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">REACT_APP_ADMIN_EMAIL</code>。
          </p>
          <Link to="/" className="text-sm text-blue-600 hover:underline">← 返回地图</Link>
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
      setError(err.message || '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">{getBranding().adminTitle}</p>
        <h1 className="text-xl font-serif font-bold text-gray-900 mb-1">超级管理员登录</h1>
        <p className="text-sm text-gray-600 mb-6">{getBranding().adminSubtitle}</p>

        {sent ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 mb-4">
            登录链接已发送至 <strong>{email}</strong>，请查收邮件并点击链接完成登录。
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">管理员邮箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? '发送中…' : '发送魔法链接'}
            </button>
          </form>
        )}

        <Link to="/" className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-800">← 返回地图</Link>
      </div>
    </div>
  );
}
