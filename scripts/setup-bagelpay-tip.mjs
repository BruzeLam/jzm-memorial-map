#!/usr/bin/env node
/**
 * 一键配置 BagelPay 赞赏（三档固定 USD 产品 · BagelPay 不支持 $0.01）
 *
 *   BAGELPAY_API_KEY=bagel_test_xxxx npm run setup:tip -- --vercel
 *
 * 复用已有 $0.69 产品（图样图森破档）：
 *
 *   BAGELPAY_TIP_PRODUCT_001=prod_2067059748633677826 BAGELPAY_API_KEY=xxx npm run setup:tip -- --vercel
 */

import { execSync } from 'node:child_process';

const TIERS = [
  {
    envKey: 'BAGELPAY_TIP_PRODUCT_001',
    name: 'memorial-tip-toosimple',
    priceUsd: 0.69,
    desc: '图样图森破 · 略表心意（BagelPay 最低档约 $0.69）',
    reuseEnv: 'BAGELPAY_TIP_PRODUCT_001',
  },
  {
    envKey: 'BAGELPAY_TIP_PRODUCT_817',
    name: 'memorial-tip-plus1s',
    priceUsd: 1.0,
    desc: '续一秒 (+1s) · 8·17',
  },
  {
    envKey: 'BAGELPAY_TIP_PRODUCT_1926',
    name: 'memorial-tip-talk',
    priceUsd: 2.69,
    desc: '谈笑风生 · 1926',
  },
];

const UNIT_NAME = 'memorial-tip-unit';
const UNIT_PRICE_USD = 1.0;

const apiKey = process.env.BAGELPAY_API_KEY?.trim();
const apiBase = (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
const pushVercel = process.argv.includes('--vercel');

if (!apiKey) {
  console.error(`
缺少 BAGELPAY_API_KEY。Developer → Create API Key 后执行：

  BAGELPAY_API_KEY=bagel_test_xxx npm run setup:tip -- --vercel

已有 $0.69 产品可复用：
  BAGELPAY_TIP_PRODUCT_001=prod_2067059748633677826 BAGELPAY_API_KEY=xxx npm run setup:tip -- --vercel
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

async function findProductByName(name) {
  const list = await bagelFetch('/api/products/list?pageNum=1&pageSize=100');
  return (list?.items || []).find(
    (p) => p.name === name && !p.is_archive && p.billing_type === 'single_payment'
  );
}

async function createProduct(name, description, priceUsd) {
  const prices = [priceUsd, 0.99, 1.0, 2.69, 2.99].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );
  let lastErr;
  for (const price of prices) {
    try {
      const created = await bagelFetch('/api/products/create', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          price,
          currency: 'USD',
          billing_type: 'single_payment',
          tax_inclusive: false,
          tax_category: 'digital_products',
          recurring_interval: 'monthly',
          trial_days: 0,
        }),
      });
      console.log(`✓ 已创建 ${name} · $${price} → ${created.product_id}`);
      return created.product_id;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`无法创建产品 ${name}`);
}

async function ensureTierProduct(tier) {
  const reuse = process.env[tier.reuseEnv || tier.envKey]?.trim();
  if (reuse) {
    console.log(`✓ 复用 ${tier.envKey}=${reuse} (${tier.name})`);
    return reuse;
  }
  const existing = await findProductByName(tier.name);
  if (existing?.product_id) {
    console.log(`✓ 已存在 ${tier.name} → ${existing.product_id} ($${existing.price})`);
    return existing.product_id;
  }
  return createProduct(tier.name, tier.desc, tier.priceUsd);
}

async function ensureUnitProduct() {
  const reuse = process.env.BAGELPAY_TIP_PRODUCT_UNIT?.trim();
  if (reuse) {
    console.log(`✓ 复用自定义档 BAGELPAY_TIP_PRODUCT_UNIT=${reuse}`);
    return reuse;
  }
  const existing = await findProductByName(UNIT_NAME);
  if (existing?.product_id) {
    console.log(`✓ 已存在 ${UNIT_NAME} → ${existing.product_id}`);
    return existing.product_id;
  }
  return createProduct(
    UNIT_NAME,
    'Memorial map custom tip unit ($1) · 闷声发大财',
    UNIT_PRICE_USD
  );
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
    console.warn(`⚠ Vercel ${name} 可能已存在，请手动更新`);
  }
}

async function main() {
  console.log(`BagelPay 赞赏配置 (${apiBase.includes('test') ? 'Test' : 'Live'})\n`);
  console.log('说明：BagelPay 仅支持 USD 定价，Dashboard 通常不允许 $0.01。');
  console.log('界面仍显示 ¥0.01 / ¥8.17 / ¥19.26（膜蛤梗），收银台按 USD 产品扣款。\n');

  const ids = {};
  for (const tier of TIERS) {
    ids[tier.envKey] = await ensureTierProduct(tier);
  }
  ids.BAGELPAY_TIP_PRODUCT_UNIT = await ensureUnitProduct();

  console.log('\n--- 环境变量 ---');
  console.log(`BAGELPAY_API_KEY=${apiKey.slice(0, 14)}…`);
  for (const [k, v] of Object.entries(ids)) {
    console.log(`${k}=${v}`);
  }
  console.log(`BAGELPAY_TIP_UNIT_USD=1`);
  console.log(`BAGELPAY_API_BASE=${apiBase}`);

  if (pushVercel) {
    console.log('\n--- 写入 Vercel ---');
    for (const env of ['production', 'preview', 'development']) {
      vercelEnvAdd('BAGELPAY_API_KEY', apiKey, env);
      vercelEnvAdd('BAGELPAY_API_BASE', apiBase, env);
      vercelEnvAdd('BAGELPAY_TIP_UNIT_USD', '1', env);
      for (const [k, v] of Object.entries(ids)) {
        vercelEnvAdd(k, v, env);
      }
    }
    console.log('\n✓ 完成后 Redeploy 或 push 触发部署');
  }
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
