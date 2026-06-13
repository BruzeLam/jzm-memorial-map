import { isPortfolioDemoData } from '../config/branding';

const url = process.env.REACT_APP_SUPABASE_URL || '';
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const adminEmail = (process.env.REACT_APP_ADMIN_EMAIL || '').trim().toLowerCase();

export function isCloudEnabled() {
  if (isPortfolioDemoData()) return false;
  return Boolean(url && anonKey);
}

export function getAdminEmail() {
  return adminEmail;
}

/** 环境变量中的初始超管（迁移 collaborators 表之前的 fallback） */
export function isBootstrapAdmin(user) {
  if (!user?.email || !adminEmail) return false;
  return user.email.trim().toLowerCase() === adminEmail;
}

/** @deprecated 使用 isBootstrapAdmin 或协作者表 */
export function isAdminUser(user) {
  return isBootstrapAdmin(user);
}

export { url as supabaseUrl, anonKey as supabaseAnonKey };
