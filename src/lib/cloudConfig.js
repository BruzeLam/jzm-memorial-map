const url = process.env.REACT_APP_SUPABASE_URL || '';
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const adminEmail = (process.env.REACT_APP_ADMIN_EMAIL || '').trim().toLowerCase();

export function isCloudEnabled() {
  return Boolean(url && anonKey);
}

export function getAdminEmail() {
  return adminEmail;
}

export function isAdminUser(user) {
  if (!user?.email || !adminEmail) return false;
  return user.email.trim().toLowerCase() === adminEmail;
}

export { url as supabaseUrl, anonKey as supabaseAnonKey };
