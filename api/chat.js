/** Vercel Serverless：导览 Agent（DeepSeek + 站内检索） */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import {
  loadMarkersForAgent,
  searchMarkersForAgent,
  summarizeMarkerForPrompt,
  toMapHits,
} from './lib/agentMarkers.js';
import { getAgentSystemPrompt, buildAgentUserPrompt, shouldSkipBackgroundSupplement } from './lib/agentPrompt.js';
import { getAgentSubject } from './lib/agentContext.js';
import { isAggregateQuestion, computeMapStatistics } from './lib/agentStats.js';

const MAX_MESSAGE_LEN = 800;
const MAX_HISTORY = 8;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'not_configured',
      message: '导览助手尚未配置（需在 Vercel 设置 DEEPSEEK_API_KEY）',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'invalid_json', message: '请求格式无效' });
      return;
    }
  }

  const message = (body?.message || '').trim();
  if (!message) {
    res.status(400).json({ error: 'empty_message', message: '请输入问题' });
    return;
  }
  if (message.length > MAX_MESSAGE_LEN) {
    res.status(400).json({ error: 'message_too_long', message: '问题过长，请精简后重试' });
    return;
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .slice(-MAX_HISTORY)
    : [];

  try {
    const subject = getAgentSubject();
    const allMarkers = await loadMarkersForAgent();
    const { hits, usedLlmPlanner } = await searchMarkersForAgent(allMarkers, message, { apiKey });
    const statistics =
      isAggregateQuestion(message) || hits.length === 0
        ? computeMapStatistics(allMarkers, message)
        : null;
    const summaries = hits.map(summarizeMarkerForPrompt);
    const mapHits = toMapHits(hits);
    const skipBackground = shouldSkipBackgroundSupplement(message, hits.length) || Boolean(statistics);

    const deepseek = createDeepSeek({ apiKey });
    const { text } = await generateText({
      model: deepseek('deepseek-chat'),
      system: getAgentSystemPrompt({ skipBackground, subject }),
      prompt: buildAgentUserPrompt(message, summaries, history, {
        matchCount: hits.length,
        statistics,
        subject,
      }),
      maxTokens: skipBackground ? 1000 : 1200,
      temperature: 0.3,
    });

    res.status(200).json({
      reply: text.trim(),
      mapHits,
      matchCount: hits.length,
      usedLlmPlanner,
    });
  } catch (err) {
    console.error('[agent/chat]', err);
    const errMsg = String(err?.message || err?.data?.error?.message || '');
    if (err?.statusCode === 402 || /insufficient balance/i.test(errMsg)) {
      res.status(402).json({
        error: 'insufficient_balance',
        message: 'DeepSeek 账户余额不足，请在 platform.deepseek.com 充值后重试',
      });
      return;
    }
    if (/invalid.*api.*key|authentication/i.test(errMsg)) {
      res.status(401).json({
        error: 'invalid_api_key',
        message: 'DeepSeek API Key 无效，请在 Vercel 环境变量中检查 DEEPSEEK_API_KEY',
      });
      return;
    }
    res.status(500).json({
      error: 'agent_failed',
      message: '导览助手暂时不可用，请稍后重试',
    });
  }
}
