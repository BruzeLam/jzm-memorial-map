import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

function getBootstrapAdminEmail() {
  return (process.env.REACT_APP_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
}

function extractBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/** 校验协作者 JWT；成功返回 { user, supabase }，失败则写 res 并返回 null */
export async function requireEditor(req, res) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'unauthorized', message: '请先登录协作者账号' });
    return null;
  }

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    res.status(503).json({ error: 'not_configured', message: 'Supabase 未配置' });
    return null;
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email) {
    res.status(401).json({ error: 'unauthorized', message: '登录已过期，请重新登录' });
    return null;
  }

  const email = user.email.trim().toLowerCase();
  const bootstrap = getBootstrapAdminEmail();
  if (bootstrap && email === bootstrap) {
    return { user, supabase, token };
  }

  const { data: row, error: collabError } = await supabase
    .from('collaborators')
    .select('email, role')
    .eq('email', email)
    .maybeSingle();

  if (collabError) {
    res.status(403).json({
      error: 'forbidden',
      message: `无法验证协作者身份：${collabError.message}`,
    });
    return null;
  }

  if (!row) {
    res.status(403).json({ error: 'forbidden', message: '当前账号不是协作者' });
    return null;
  }

  return { user, supabase, token };
}
