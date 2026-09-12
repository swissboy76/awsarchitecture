const adminJson = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private'
  }
});

function authorised(request, env) {
  if (!env.ADMIN_API_TOKEN) return false;
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${env.ADMIN_API_TOKEN}`;
}

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function handleAdminRequest(request, env, url) {
  if (!env.ADMIN_API_TOKEN) {
    return adminJson({ error: 'Admin API is not configured.' }, 503);
  }

  if (!authorised(request, env)) {
    return adminJson({ error: 'Unauthorized' }, 401);
  }

  if (request.method !== 'GET') {
    return adminJson({ error: 'Method not allowed' }, 405);
  }

  if (url.pathname === '/api/admin/assessments') {
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 10, 1), 20);

    const result = await env.DB.prepare(`
      SELECT
        a.id,
        a.lead_id,
        a.overall_score,
        a.created_at,
        a.answers_json,
        l.name,
        l.email,
        l.company
      FROM assessments a
      LEFT JOIN leads l ON l.id = a.lead_id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    const assessments = (result.results || []).map(row => {
      const stored = parseJson(row.answers_json, {}) || {};
      return {
        id: row.id,
        leadId: row.lead_id,
        createdAt: row.created_at,
        mode: stored.mode || 'unknown',
        overallScore: row.overall_score,
        name: row.name || '',
        company: row.company || '',
        email: row.email || ''
      };
    });

    return adminJson({ assessments });
  }

  const match = url.pathname.match(/^\/api\/admin\/assessments\/([^/]+)$/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    const row = await env.DB.prepare(`
      SELECT
        a.*,
        l.name,
        l.email,
        l.company,
        l.marketing_consent
      FROM assessments a
      LEFT JOIN leads l ON l.id = a.lead_id
      WHERE a.id = ?
      LIMIT 1
    `).bind(id).first();

    if (!row) return adminJson({ error: 'Assessment not found' }, 404);

    const stored = parseJson(row.answers_json, {}) || {};
    return adminJson({
      assessment: {
        id: row.id,
        leadId: row.lead_id,
        createdAt: row.created_at,
        mode: stored.mode || 'unknown',
        answers: stored.answers || {},
        qualification: stored.qualification || {},
        scores: {
          overall: row.overall_score,
          security: row.security_score,
          reliability: row.reliability_score,
          cost: row.cost_score,
          operations: row.operations_score,
          performance: row.performance_score,
          sustainability: row.sustainability_score
        },
        findings: parseJson(row.top_findings_json, []) || [],
        lead: {
          name: row.name || '',
          email: row.email || '',
          company: row.company || '',
          marketingConsent: Boolean(row.marketing_consent)
        }
      }
    });
  }

  return adminJson({ error: 'Not found' }, 404);
}
