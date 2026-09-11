import { questions, categories } from './questions.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const scoreMap = { yes: 1, partial: 0.5, no: 0, unknown: 0.25 };

function scoreAssessment(answers) {
  const totals = Object.fromEntries(categories.map(c => [c, { got: 0, possible: 0 }]));
  const findings = [];

  for (const q of questions) {
    const answer = answers[q.id] || 'unknown';
    const multiplier = scoreMap[answer] ?? 0.25;
    totals[q.category].possible += q.weight;
    totals[q.category].got += q.weight * multiplier;

    if (multiplier < 1) {
      const severity = q.weight >= 5 && multiplier === 0 ? 'critical' : (q.weight >= 4 && multiplier <= 0.5 ? 'high' : 'medium');
      findings.push({
        id: q.id,
        category: q.category,
        severity,
        title: q.text,
        recommendation: q.help,
        impact: q.weight,
        multiplier
      });
    }
  }

  const scores = {};
  for (const c of categories) scores[c] = Math.round((totals[c].got / totals[c].possible) * 100);

  const overall = Math.round(categories.reduce((sum, c) => sum + scores[c], 0) / categories.length);
  const severityRank = { critical: 3, high: 2, medium: 1 };
  findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.impact - a.impact || a.multiplier - b.multiplier);

  return { overall, scores, findings: findings.slice(0, 5) };
}

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/questions' && request.method === 'GET') {
      return json({ questions });
    }

    if (url.pathname === '/api/assessment' && request.method === 'POST') {
      try {
        const body = await request.json();
        const answers = body?.answers || {};
        const result = scoreAssessment(answers);
        return json(result);
      } catch {
        return json({ error: 'Invalid request body' }, 400);
      }
    }

    if (url.pathname === '/api/lead' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name = '', email = '', company = '', marketingConsent = false, answers = {} } = body || {};
        if (!validEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400);

        const leadId = crypto.randomUUID();
        const assessmentId = crypto.randomUUID();
        const result = scoreAssessment(answers);

        await env.DB.batch([
          env.DB.prepare(`INSERT INTO leads (id, name, email, company, marketing_consent) VALUES (?, ?, ?, ?, ?)`)
            .bind(leadId, String(name).slice(0, 120), email.toLowerCase(), String(company).slice(0, 160), marketingConsent ? 1 : 0),
          env.DB.prepare(`INSERT INTO assessments
            (id, lead_id, overall_score, security_score, reliability_score, cost_score, operations_score, performance_score, sustainability_score, top_findings_json, answers_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(
              assessmentId, leadId, result.overall,
              result.scores.security, result.scores.reliability, result.scores.cost,
              result.scores.operations, result.scores.performance, result.scores.sustainability,
              JSON.stringify(result.findings), JSON.stringify(answers)
            )
        ]);

        return json({ ok: true, leadId, assessmentId, ...result }, 201);
      } catch (err) {
        console.error(err);
        return json({ error: 'Unable to save your assessment.' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  }
};
