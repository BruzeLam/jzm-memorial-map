import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { addCollaborator, removeCollaborator } from '../services/collaborators';
import { formatAuthEmailErrorZh } from '../utils/authErrors';

const ROLE_LABEL = { admin: '超级管理员', editor: '协作者' };

export default function AdminCollaborators() {
  const { user, isSuperAdmin, collaborators, reloadCollaborators, signInWithEmail } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="admin-card p-6 text-sm text-memorial-muted">
        仅超级管理员可管理协作者账号。
        <Link to="/admin" className="block mt-3 text-memorial-navy hover:underline">← 返回概览</Link>
      </div>
    );
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    setStatus('');
    setSubmitting(true);
    try {
      await addCollaborator({
        email,
        role,
        invitedBy: user?.email,
        notes: notes.trim() || null,
      });
      await reloadCollaborators();
      setEmail('');
      setNotes('');
      setStatus(`已添加 ${email.trim()}，请让对方在首页点击「添加」或访问 /admin/login 用该邮箱收魔法链接登录。`);
    } catch (err) {
      setStatus(`失败：${err.message || '无法添加'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (targetEmail) => {
    if (targetEmail === user?.email?.toLowerCase()) {
      setStatus('不能移除当前登录的超级管理员自己。');
      return;
    }
    const admins = collaborators.filter((c) => c.role === 'admin');
    if (admins.length <= 1 && admins[0]?.email === targetEmail) {
      setStatus('至少保留一名超级管理员。');
      return;
    }
    if (!window.confirm(`确定移除协作者 ${targetEmail}？`)) return;
    setStatus('');
    try {
      await removeCollaborator(targetEmail);
      await reloadCollaborators();
      setStatus(`已移除 ${targetEmail}`);
    } catch (err) {
      setStatus(`失败：${err.message || '无法移除'}`);
    }
  };

  const handleSendLink = async (targetEmail) => {
    setStatus('');
    try {
      await signInWithEmail(targetEmail, { redirectTo: `${window.location.origin}/admin` });
      setStatus(`已向 ${targetEmail} 发送登录链接（可用于首次登录）。`);
    } catch (err) {
      setStatus(`发送失败：${formatAuthEmailErrorZh(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-memorial-navy">协作者账号</h1>
        <p className="text-sm text-memorial-muted mt-1">
          访客只读；列表中的邮箱登录后可编辑地图与后台内容。超级管理员可邀请他人并分配角色。
        </p>
      </div>

      <form onSubmit={handleAdd} className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-memorial-ink">邀请协作者</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-memorial-muted mb-1">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm border border-memorial-border rounded-lg px-3 py-2"
              placeholder="collaborator@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-memorial-muted mb-1">角色</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-sm memorial-input"
            >
              <option value="editor">协作者（可编辑内容）</option>
              <option value="admin">超级管理员（可编辑 + 管理账号）</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-memorial-muted mb-1">备注（可选）</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-sm border border-memorial-border rounded-lg px-3 py-2"
            placeholder="如：负责华南地区标点"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg memorial-btn-primary text-sm font-medium disabled:opacity-50"
        >
          {submitting ? '添加中…' : '添加协作者'}
        </button>
      </form>

      {status && (
        <div className="text-sm px-4 py-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-memorial-navy">
          {status}
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="px-4 py-3 border-b border-memorial-border/60 text-sm font-semibold text-memorial-ink">
          当前协作者（{collaborators.length}）
        </div>
        <ul className="divide-y divide-memorial-border/60">
          {collaborators.map((c) => (
            <li key={c.email} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-memorial-navy truncate">{c.email}</div>
                <div className="text-xs text-memorial-muted mt-0.5">
                  {ROLE_LABEL[c.role] || c.role}
                  {c.notes ? ` · ${c.notes}` : ''}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendLink(c.email)}
                  className="text-xs px-2 py-1 rounded border border-memorial-border hover:bg-memorial-cream"
                >
                  发登录链接
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(c.email)}
                  className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                >
                  移除
                </button>
              </div>
            </li>
          ))}
          {collaborators.length === 0 && (
            <li className="px-4 py-6 text-sm text-memorial-muted text-center">暂无协作者，请先执行数据库迁移脚本。</li>
          )}
        </ul>
      </div>
    </div>
  );
}
