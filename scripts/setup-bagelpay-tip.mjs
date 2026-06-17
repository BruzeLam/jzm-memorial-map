#!/usr/bin/env node
/**
 * 一键配置 BagelPay 赞赏（创建 $0.01 基础产品 + 可选写入 Vercel）
 *
 * 用法（只需 BagelPay Developer 里的 API Key）：
 *
 *   BAGELPAY_API_KEY=bagel_test_xxxx node scripts/setup-bagelpay-tip.mjs
 *
 * 同时写入 Vercel（需已 vercel login）：
 *
 *   BAGELPAY_API_KEY=bagel_test_xxxx node scripts/setup-bagelpay-tip.mjs --vercel
 *
 * Live 模式：
 *
 *   BAGELPAY_API_KEY=bagel_live_xxxx BAGELPAY_API_BASE=https://live.bagelpay.io node scripts/setup-bagelpay-tip.mjs --vercel
 */

import { execSync } from 'node:child_process';

const UNIT_NAME = 'memorial-map-tip-unit';
const UNIT_PRICE_USD = 0.01;

const apiKey = process.env.BAGELPAY_API_KEY?.trim();
const apiBase = (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
const pushVercel = process.argv.includes('--vercel');

if (!apiKey) {
  console.error(`
缺少 BAGELPAY_API_KEY。

1. 打开 https://app.bagelpay.io → Developer → Create API Key
2. 在本机终端执行（勿提交 Git）：

   BAGELPAY_API_KEY=bagel_test_你的Key node scripts/setup-bagelpay-tip.mjs --vercel
`);
  process.exit(1);
}

async function bagelFetch(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.code !== 200) {
    throw new Error(json.msg || json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

async function findOrCreateUnitProduct() {
  const list = await bagelFetch('/api/products/list?pageNum=1&pageSize=100');
  const items = list?.items || [];
  const existing = items.find(
    (p) => p.name === UNIT_NAME && !p.is_archive && p.billing_type === 'single_payment'
  );
  if (existing?.product_id) {
    console.log(`✓ 已存在基础产品 ${existing.product_id} (${UNIT_NAME})`);
    return existing.product_id;
  }

  const created = await bagelFetch('/api/products/create', {
    method: 'POST',
    body: JSON.stringify({
      name: UNIT_NAME,
      description: 'Memorial map tip unit ($0.01) · 图样图森破 / +1s / 谈笑风生 / 自定义',
      price: UNIT_PRICE_USD,
      currency: 'USD',
      billing_type: 'single_payment',
      tax_inclusive: false,
      tax_category: 'digital_products',
      recurring_interval: 'monthly',
      trial_days: 0,
    }),
  });

  console.log(`✓ 已创建基础产品 ${created.product_id} · $${UNIT_PRICE_USD}/份`);
  console.log(`  三档：1 份=¥0.01 · 817 份=¥8.17 · 1926 份=¥19.26 · 自定义=份数×0.01`);
  return created.product_id;
}

function vercelEnvAdd(name, value, env = 'production') {
  try {
    execSync(`npx vercel env add ${name} ${env}`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf8',
    });
    console.log(`✓ Vercel ${env}: ${name}`);
  } catch {
    console.warn(`⚠ Vercel ${name} 可能已存在，请在 Dashboard 手动更新`);
  }
}

async function main() {
  console.log(`BagelPay 赞赏一键配置 (${apiBase.includes('test') ? 'Test' : 'Live'})\n`);

  const productId = await findOrCreateUnitProduct();

  console.log('\n--- 写入 Vercel 环境变量（手动）---');
  console.log(`BAGELPAY_API_KEY=${apiKey.slice(0, 12)}…`);
  console.log(`BAGELPAY_TIP_PRODUCT_ID=${productId}`);
  console.log(`BAGELPAY_API_BASE=${apiBase}`);

  if (pushVercel) {
    console.log('\n--- 正在写入 Vercel ---');
    for (const env of ['production', 'preview', 'development']) {
      vercelEnvAdd('BAGELPAY_API_KEY', apiKey, env);
      vercelEnvAdd('BAGELPAY_TIP_PRODUCT_ID', productId, env);
      vercelEnvAdd('BAGELPAY_API_BASE', apiBase, env);
    }
    console.log('\n✓ 请在 Vercel Deployments 点 Redeploy，或 push 代码触发部署');
  } else {
    console.log('\n提示：加 --vercel 可自动写入 Vercel（需 npx vercel login）');
  }
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
