/** Vercel Serverless：智能问链路诊断（仅协作者） */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { requireEditor } from './lib/adminAuth.js';
import { getFullBuiltInMarkersSync, getCoreBuiltInMarkersSync } from './lib/builtInMarkersServer.js';
import { loadMarkersForAgent, searchMarkersForAgent, summarizeMarkerForPrompt } from './lib/agentMarkers.js';
import { isAggregateQuestion, computeMapStatistics } from './lib/agentStats.js';
import { getAgentSystemPrompt, buildAgentUserPrompt } from './lib/agentPrompt.js';
import { getAgentSubject } from './lib/agentContext.js';

function step(name, fn) {
  const started = Date.now();
  return Promise.resolve()
    .then(fn)
    .then((detail) => ({
      name,
      ok: true,
      ms: Date.now() - started,
      ...detail,
    }))
    .catch((err) => ({
      name,
      ok: false,
      ms: Date.now() - started,
      error: err?.message || String(err),
    }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = await requireEditor(req, res);
  if (!auth) return;

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const runPipeline = Boolean(body?.runPipeline);

  const steps = [];

  steps.push(
    await step('env', () => {
      const deepseekKey = Boolean(process.env.DEEPSEEK_API_KEY);
      const supabaseUrl = Boolean(
        process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
      );
      const supabaseKey = Boolean(
        process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      return {
        deepseekKey,
        supabaseUrl,
        supabaseKey,
        adminEmail: Boolean(
          process.env.REACT_APP_ADMIN_EMAIL || process.env.ADMIN_EMAIL
        ),
      };
    })
  );

  steps.push(
    await step('builtInCatalog', () => {
      const core = getCoreBuiltInMarkersSync();
      const full = getFullBuiltInMarkersSync();
      return {
        coreCount: core.length,
        fullCount: full.length,
        extendedCount: full.length - core.length,
      };
    })
  );

  steps.push(
    await step('markerCatalog', async () => {
      const markers = await loadMarkersForAgent();
      return { catalogSize: markers.length };
    })
  );

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    steps.push(
      await step('deepseekPing', async () => {
        const deepseek = createDeepSeek({ apiKey });
        const { text, usage } = await generateText({
          model: deepseek('deepseek-chat'),
          prompt: '回复 exactly: ok',
          maxTokens: 8,
          temperature: 0,
        });
        return {
          model: 'deepseek-chat',
          replyPreview: (text || '').trim().slice(0, 40),
          promptTokens: usage?.promptTokens ?? null,
          completionTokens: usage?.completionTokens ?? null,
        };
      })
    );
  } else {
    steps.push({
      name: 'deepseekPing',
      ok: false,
      ms: 0,
      error: 'DEEPSEEK_API_KEY 未配置',
    });
  }

  if (runPipeline && apiKey) {
    const sampleQuestion = '他到过哪些国家？';
    const subject = getAgentSubject();
    steps.push(
      await step('pipelineSearch', async () => {
        const markers = await loadMarkersForAgent();
        const aggregate = isAggregateQuestion(sampleQuestion);
        const { hits, usedLlmPlanner } = await searchMarkersForAgent(markers, sampleQuestion, {
          apiKey,
        });
        const statistics = aggregate ? computeMapStatistics(markers, sampleQuestion) : null;
        return {
          question: sampleQuestion,
          aggregate,
          matchCount: hits.length,
          catalogSize: markers.length,
          usedLlmPlanner,
          statisticsFocus: statistics?.focus ?? null,
          foreignCountries: statistics?.footprint?.distinctForeignCountries ?? null,
        };
      })
    );

    steps.push(
      await step('pipelineGenerate', async () => {
        const sampleQuestion = '他到过哪些国家？';
        const markers = await loadMarkersForAgent();
        const aggregate = isAggregateQuestion(sampleQuestion);
        const { hits } = await searchMarkersForAgent(markers, sampleQuestion, { apiKey });
        const statistics = aggregate ? computeMapStatistics(markers, sampleQuestion) : null;
        const summaries = aggregate ? [] : hits.map(summarizeMarkerForPrompt);

        const deepseek = createDeepSeek({ apiKey });
        const { text, usage } = await generateText({
          model: deepseek('deepseek-chat'),
          system: getAgentSystemPrompt({
            skipBackground: true,
            subject,
            aggregate,
          }),
          prompt: buildAgentUserPrompt(sampleQuestion, summaries, [], {
            matchCount: hits.length,
            catalogSize: markers.length,
            statistics,
            subject,
            aggregate,
          }),
          maxTokens: 400,
          temperature: 0.3,
        });

        return {
          replyPreview: (text || '').trim().slice(0, 120),
          promptTokens: usage?.promptTokens ?? null,
          completionTokens: usage?.completionTokens ?? null,
        };
      })
    );
  }

  const ok = steps.every((s) => s.ok);
  res.status(ok ? 200 : 503).json({
    ok,
    checkedAt: new Date().toISOString(),
    steps,
  });
}
