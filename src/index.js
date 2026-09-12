import { getAssessment } from './questions.js';
import { aiAssessment, scoreAiAssessment } from './aiQuestions.js';
import { seoPages, seoMarkup, guideSection } from './seo.js';
import { handleAdminRequest } from './admin.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const scoreMap = { yes: 1, partial: 0.5, no: 0, unknown: 0.25 };

function scoreAssessment(mode, answers = {}) {
  if (mode === 'ai') return scoreAiAssessment(answers);

  const assessment = getAssessment(mode);
  const categoryKeys = assessment.categories.map(c => c.key);
  const totals = Object.fromEntries(categoryKeys.map(key => [key, { got: 0, possible: 0 }]));
  const findings = [];

  for (const q of assessment.questions) {
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
        title: q.finding || q.text,
        recommendation: q.help,
        impact: q.weight,
        multiplier
      });
    }
  }

  const scores = {};
  for (const key of categoryKeys) {
    scores[key] = totals[key].possible ? Math.round((totals[key].got / totals[key].possible) * 100) : 0;
  }

  const overall = Math.round(categoryKeys.reduce((sum, key) => sum + scores[key], 0) / categoryKeys.length);
  const severityRank = { critical: 3, high: 2, medium: 1 };
  findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.impact - a.impact || a.multiplier - b.multiplier);

  return {
    mode: assessment.id,
    title: assessment.title,
    categories: assessment.categories,
    overall,
    scores,
    findings: findings.slice(0, 5)
  };
}

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function legacyScores(mode, scores) {
  if (mode === 'technical') {
    return {
      security: scores.security ?? 0,
      reliability: scores.reliability ?? 0,
      cost: scores.cost ?? 0,
      operations: scores.operations ?? 0,
      performance: scores.performance ?? 0,
      sustainability: scores.sustainability ?? 0
    };
  }

  if (mode === 'ai') {
    return {
      security: scores.starting ?? 0,
      reliability: scores.knowledge ?? 0,
      cost: scores.process ?? 0,
      operations: scores.information ?? 0,
      performance: scores.customers ?? 0,
      sustainability: scores.starting ?? 0
    };
  }

  return {
    security: scores.security ?? 0,
    reliability: scores.recovery ?? 0,
    cost: scores.cost ?? 0,
    operations: scores.management ?? 0,
    performance: scores.continuity ?? 0,
    sustainability: scores.confidence ?? 0
  };
}

function normalisePath(pathname) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

async function serveAsset(request, env, assetPath) {
  const publicPath = normalisePath(new URL(request.url).pathname);
  const url = new URL(request.url);
  url.pathname = assetPath;
  const response = await env.ASSETS.fetch(new Request(url.toString(), request));

  if (!seoPages[publicPath] || !response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  let html = await response.text();
  html = html.replace('</head>', `${seoMarkup(publicPath)}</head>`);
  const guides = guideSection(publicPath);
  if (guides) html = html.replace('</main>', `${guides}</main>`);

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, headers });
}

const marketingPages = {
  '/ai-repetitive-admin': '/ai-repetitive-admin.html',
  '/ai-business-knowledge': '/ai-business-knowledge.html',
  '/ai-customer-service': '/ai-customer-service.html',
  '/ai-reporting': '/ai-reporting.html',
  '/ai-small-business': '/ai-small-business.html',
  '/aws-health-check': '/aws-health-check.html',
  '/aws-cost-review': '/aws-cost-review.html',
  '/aws-backup-risk': '/aws-backup-risk.html',
  '/aws-security-check': '/aws-security-check.html',
  '/cloud-readiness-small-business': '/cloud-readiness-small-business.html'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/admin/')) {
      return handleAdminRequest(request, env, url);
    }

    if (url.pathname === '/api/questions' && request.method === 'GET') {
      const requestedMode = url.searchParams.get('mode') || 'simple';
      const assessment = requestedMode === 'ai' ? aiAssessment : getAssessment(requestedMode);
      return json({
        mode: assessment.id,
        title: assessment.title,
        description: assessment.description,
        categories: assessment.categories,
        questions: assessment.questions
      });
    }

    if (url.pathname === '/api/assessment' && request.method === 'POST') {
      try {
        const body = await request.json();
        return json(scoreAssessment(body?.mode || 'simple', body?.answers || {}));
      } catch {
        return json({ error: 'Invalid request body' }, 400);
      }
    }

    if (url.pathname === '/api/lead' && request.method === 'POST') {
      try {
        const body = await request.json();
        const {
          name = '',
          email = '',
          company = '',
          marketingConsent = false,
          mode = 'simple',
          answers = {},
          qualification = {}
        } = body || {};

        if (!validEmail(email)) return json({ error: 'Please enter a valid email address.' }, 400);

        const leadId = crypto.randomUUID();
        const assessmentId = crypto.randomUUID();
        const result = scoreAssessment(mode, answers);
        const storedScores = legacyScores(result.mode, result.scores);
        const storedAnswers = { mode: result.mode, answers, qualification };

        await env.DB.batch([
          env.DB.prepare(`INSERT INTO leads (id, name, email, company, marketing_consent) VALUES (?, ?, ?, ?, ?)`)
            .bind(leadId, String(name).slice(0, 120), email.toLowerCase(), String(company).slice(0, 160), marketingConsent ? 1 : 0),
          env.DB.prepare(`INSERT INTO assessments
            (id, lead_id, overall_score, security_score, reliability_score, cost_score, operations_score, performance_score, sustainability_score, top_findings_json, answers_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(
              assessmentId, leadId, result.overall,
              storedScores.security, storedScores.reliability, storedScores.cost,
              storedScores.operations, storedScores.performance, storedScores.sustainability,
              JSON.stringify(result.findings), JSON.stringify(storedAnswers)
            )
        ]);

        return json({ ok: true, leadId, assessmentId, ...result }, 201);
      } catch (err) {
        console.error(err);
        return json({ error: 'Unable to save your assessment.' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);

    if (url.pathname === '/home') return Response.redirect('https://cloudfixer.org/', 301);
    if (url.pathname === '/') return serveAsset(request, env, '/home.html');
    if (url.pathname === '/aws' || url.pathname === '/aws/') return serveAsset(request, env, '/index.html');
    if (url.pathname === '/ai' || url.pathname === '/ai/') return serveAsset(request, env, '/ai.html');
    if (url.pathname === '/cloud-readiness' || url.pathname === '/cloud-readiness/') return serveAsset(request, env, '/cloud-readiness.html');
    if (url.pathname === '/cloud-migration' || url.pathname === '/cloud-migration/') return serveAsset(request, env, '/cloud-migration.html');

    const marketingPath = normalisePath(url.pathname);
    if (marketingPages[marketingPath]) return serveAsset(request, env, marketingPages[marketingPath]);

    return env.ASSETS.fetch(request);
  }
};
