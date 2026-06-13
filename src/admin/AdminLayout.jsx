import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { getBranding } from '../config/branding';

export default function AdminLayout() {
  const { user, isEditor, isSuperAdmin, loading, signOut } = useAdminAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        加载中…
      </div>
    );
  }

  if (!user || !isEditor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full border border-gray-200 text-center">
          <p className="text-sm text-gray-700 mb-4">
            {user && !isEditor
              ? `当前账号 ${user.email} 不在协作者列表中，无法编辑。请联系超级管理员邀请。`
              : '请先登录协作者账号。'}
          </p>
          <Link
            to="/admin/login"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/admin" className="font-serif font-bold text-gray-900 text-sm shrink-0">
            {getBranding().adminTitle}
          </Link>
          <nav className="flex gap-3 text-xs text-gray-600">
            <Link to="/admin" className="hover:text-blue-600">概览</Link>
            <Link to="/admin/markers" className="hover:text-blue-600">地点</Link>
            <Link to="/admin/review" className="hover:text-blue-600">审核</Link>
            {isSuperAdmin && (
              <Link to="/admin/collaborators" className="hover:text-blue-600">协作者</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[180px]">{user.email}</span>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-800">查看站点</Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
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
