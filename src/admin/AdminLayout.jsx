import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { getBranding } from '../config/branding';

export default function AdminLayout() {
  const { user, isEditor, isSuperAdmin, loading, signOut } = useAdminAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="admin-shell items-center justify-center text-sm text-memorial-muted">
        加载中…
      </div>
    );
  }

  if (!user || !isEditor) {
    return (
      <div className="admin-shell items-center justify-center p-4">
        <div className="admin-card p-6 max-w-md w-full text-center">
          <p className="text-sm text-memorial-ink mb-4">
            {user && !isEditor
              ? `当前账号 ${user.email} 不在协作者列表中，无法编辑。请联系超级管理员邀请。`
              : '请先登录协作者账号。'}
          </p>
          <Link to="/admin/login" className="inline-block memorial-btn-primary text-sm px-4 py-2">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/admin" className="admin-header-title">
            {getBranding().adminTitle}
          </Link>
          <nav className="flex gap-3">
            <Link to="/admin" className="admin-nav-link">概览</Link>
            <Link to="/admin/markers" className="admin-nav-link">地点</Link>
            <Link to="/admin/review" className="admin-nav-link">审核</Link>
            <Link to="/admin/integrations" className="admin-nav-link">外接服务</Link>
            <Link to="/admin/agent" className="admin-nav-link">智能问</Link>
            {isSuperAdmin && (
              <Link to="/admin/collaborators" className="admin-nav-link">协作者</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-memorial-muted hidden sm:inline truncate max-w-[180px]">{user.email}</span>
          <Link to="/" className="admin-nav-link">查看站点</Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs px-2 py-1 rounded-lg memorial-btn-secondary"
          >
            退出
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
