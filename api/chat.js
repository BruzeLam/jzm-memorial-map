/** Vercel Serverless：导览 Agent（DeepSeek + 站内检索） */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import {
  loadMarkersForAgent,
  searchMarkersForAgent,
  summarizeMarkerForPrompt,
  toMapHits,
} from './lib/agentMarkers.js';
import { AGENT_SYSTEM_PROMPT, buildAgentUserPrompt } from './lib/agentPrompt.js';

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
    const allMarkers = await loadMarkersForAgent();
    const hits = searchMarkersForAgent(allMarkers, message);
    const summaries = hits.map(summarizeMarkerForPrompt);
    const mapHits = toMapHits(hits);

    const deepseek = createDeepSeek({ apiKey });
    const { text } = await generateText({
      model: deepseek('deepseek-chat'),
      system: AGENT_SYSTEM_PROMPT,
      prompt: buildAgentUserPrompt(message, summaries, history),
      maxTokens: 1200,
      temperature: 0.4,
    });

    res.status(200).json({
      reply: text.trim(),
      mapHits,
      matchCount: hits.length,
    });
  } catch (err) {
    console.error('[agent/chat]', err);
    res.status(500).json({
      error: 'agent_failed',
      message: '导览助手暂时不可用，请稍后重试',
    });
  }
}
