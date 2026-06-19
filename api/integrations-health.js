/** Vercel Serverless：外接平台状态（仅协作者） */

import { requireEditor } from './lib/adminAuth.js';
import { runAllIntegrationChecks } from './lib/integrationChecks.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await requireEditor(req, res);
  if (!auth) return;

  const started = Date.now();
  const platforms = await runAllIntegrationChecks();

  res.status(200).json({
    ok: platforms.every((p) => !p.configured || p.ok),
    checkedAt: new Date().toISOString(),
    totalMs: Date.now() - started,
    platforms,
    note: '高德与 Stripe 为可选服务；未配置时不影响核心功能。',
  });
}
