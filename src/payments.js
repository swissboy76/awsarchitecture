const PRODUCT_CATALOG = {
  ai_action_plan: {
    priceId: 'price_1UEne6HbnuffggY3n0ZthDdu',
    title: 'AI Opportunity Action Plan',
    amount: 999,
    modes: ['ai'],
    tier: 'action'
  },
  ai_roadmap: {
    priceId: 'price_1UEneCHbnuffggY3w3uHsVRn',
    title: 'AI Roadmap',
    amount: 1999,
    modes: ['ai'],
    tier: 'roadmap'
  },
  aws_action_plan: {
    priceId: 'price_1UEneHHbnuffggY3P7Qy27o4',
    title: 'AWS Cloud Action Plan',
    amount: 999,
    modes: ['simple', 'technical'],
    tier: 'action'
  },
  aws_detailed_review: {
    priceId: 'price_1UEneMHbnuffggY3sMpcmF0I',
    title: 'Detailed AWS Review',
    amount: 1999,
    modes: ['simple', 'technical'],
    tier: 'roadmap'
  }
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function ensurePaymentTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    product_key TEXT NOT NULL,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount_pence INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'gbp',
    status TEXT NOT NULL DEFAULT 'pending',
    customer_email TEXT,
    delivery_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TEXT,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
  )`).run();
}

async function stripeRequest(env, path, init = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured on this Worker.');
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${env.STRIPE_SECRET_KEY}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/x-www-form-urlencoded');
  const response = await fetch(`https://api.stripe.com${path}`, { ...init, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Stripe request failed.');
  return data;
}

async function createAnonymousAssessment(env, mode, answers, result, legacyScores) {
  const assessmentId = crypto.randomUUID();
  const scores = legacyScores(mode, result.scores || {});
  await env.DB.prepare(`INSERT INTO assessments
    (id, lead_id, overall_score, security_score, reliability_score, cost_score, operations_score, performance_score, sustainability_score, top_findings_json, answers_json)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      assessmentId,
      result.overall ?? 0,
      scores.security, scores.reliability, scores.cost,
      scores.operations, scores.performance, scores.sustainability,
      JSON.stringify(result.findings || []),
      JSON.stringify({ mode, answers, qualification: {} })
    ).run();
  return assessmentId;
}

export async function createCheckout(request, env, scoreAssessment, legacyScores) {
  try {
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not fully activated yet.' }, 503);
    await ensurePaymentTables(env);

    const body = await request.json();
    const productKey = String(body?.productKey || '');
    const mode = String(body?.mode || '');
    const answers = body?.answers && typeof body.answers === 'object' ? body.answers : {};
    const email = validEmail(body?.email) ? body.email.toLowerCase() : '';
    const product = PRODUCT_CATALOG[productKey];

    if (!product || !product.modes.includes(mode)) return json({ error: 'That product is not available for this assessment.' }, 400);

    let assessmentId = typeof body?.assessmentId === 'string' ? body.assessmentId : '';
    if (assessmentId) {
      const existing = await env.DB.prepare('SELECT id FROM assessments WHERE id = ?').bind(assessmentId).first();
      if (!existing) assessmentId = '';
    }

    if (!assessmentId) {
      const result = scoreAssessment(mode, answers);
      assessmentId = await createAnonymousAssessment(env, mode, answers, result, legacyScores);
    }

    const orderId = crypto.randomUUID();
    const deliveryToken = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`;
    await env.DB.prepare(`INSERT INTO orders (id, assessment_id, product_key, amount_pence, status, customer_email, delivery_token)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)`)
      .bind(orderId, assessmentId, productKey, product.amount, email || null, deliveryToken).run();

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][price]', product.priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', 'https://cloudfixer.org/payment-success?session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', mode === 'ai' ? 'https://cloudfixer.org/ai?payment=cancelled' : 'https://cloudfixer.org/aws?payment=cancelled');
    params.set('client_reference_id', orderId);
    params.set('metadata[order_id]', orderId);
    params.set('metadata[assessment_id]', assessmentId);
    params.set('metadata[product_key]', productKey);
    if (email) params.set('customer_email', email);

    const session = await stripeRequest(env, '/v1/checkout/sessions', { method: 'POST', body: params.toString() });
    await env.DB.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').bind(session.id, orderId).run();
    return json({ ok: true, checkoutUrl: session.url, orderId, assessmentId });
  } catch (error) {
    console.error('Checkout error', error);
    return json({ error: error.message || 'Unable to start checkout.' }, 500);
  }
}

function parseSignature(header) {
  const parts = String(header || '').split(',').map(p => p.trim().split('='));
  const timestamp = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  return { timestamp, signatures };
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifyStripeSignature(payload, header, secret) {
  if (!secret) return false;
  const { timestamp, signatures } = parseSignature(header);
  if (!timestamp || !signatures.length) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = hex(digest);
  return signatures.some(sig => constantTimeEqual(expected, sig));
}

async function markSessionPaid(env, session) {
  const orderId = session?.metadata?.order_id || session?.client_reference_id;
  if (!orderId) return;
  const email = session?.customer_details?.email || session?.customer_email || null;
  await ensurePaymentTables(env);
  await env.DB.prepare(`UPDATE orders
    SET status = 'paid', stripe_session_id = ?, stripe_payment_intent_id = ?, customer_email = COALESCE(?, customer_email), paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
    WHERE id = ?`)
    .bind(session.id || null, session.payment_intent || null, email, orderId).run();
}

export async function handleStripeWebhook(request, env) {
  try {
    const payload = await request.text();
    const verified = await verifyStripeSignature(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
    if (!verified) return json({ error: 'Invalid webhook signature.' }, 400);
    const event = JSON.parse(payload);
    const session = event?.data?.object;

    if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && session?.payment_status === 'paid') {
      await markSessionPaid(env, session);
    } else if (event.type === 'checkout.session.expired') {
      await ensurePaymentTables(env);
      const orderId = session?.metadata?.order_id || session?.client_reference_id;
      if (orderId) await env.DB.prepare("UPDATE orders SET status = 'expired' WHERE id = ? AND status = 'pending'").bind(orderId).run();
    }
    return json({ received: true });
  } catch (error) {
    console.error('Webhook error', error);
    return json({ error: 'Webhook processing failed.' }, 400);
  }
}

export async function getOrderStatus(request, env) {
  try {
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not fully activated yet.' }, 503);
    await ensurePaymentTables(env);
    const sessionId = new URL(request.url).searchParams.get('session_id');
    if (!sessionId || !sessionId.startsWith('cs_')) return json({ error: 'Missing checkout session.' }, 400);

    const session = await stripeRequest(env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.payment_status === 'paid') await markSessionPaid(env, session);
    const order = await env.DB.prepare('SELECT id, product_key, status, delivery_token FROM orders WHERE stripe_session_id = ?').bind(sessionId).first();
    if (!order) return json({ error: 'Order not found.' }, 404);
    const product = PRODUCT_CATALOG[order.product_key];
    return json({
      paid: order.status === 'paid',
      status: order.status,
      product: product?.title || 'CloudFIXER report',
      reportUrl: order.status === 'paid' ? `/paid-report?token=${encodeURIComponent(order.delivery_token)}` : null
    });
  } catch (error) {
    console.error('Order status error', error);
    return json({ error: 'Unable to confirm payment.' }, 500);
  }
}

function reportPayload(order, assessment) {
  const product = PRODUCT_CATALOG[order.product_key];
  const findings = JSON.parse(assessment.top_findings_json || '[]');
  const stored = JSON.parse(assessment.answers_json || '{}');
  const isAi = stored.mode === 'ai';
  const roadmap = product?.tier === 'roadmap';
  const top = findings.slice(0, roadmap ? 5 : 3);

  return {
    title: product?.title || 'CloudFIXER Report',
    assessmentType: isAi ? 'AI Opportunity Assessment' : 'AWS Cloud Assessment',
    overall: assessment.overall_score,
    executiveSummary: isAi
      ? `Your assessment identified ${top.length} priority areas where reducing repetitive work, improving access to knowledge or simplifying information handling could create practical value.`
      : `Your assessment identified ${top.length} priority areas to strengthen your AWS environment. The recommendations are ordered to help you address material risk and operational gaps first.`,
    priorities: top.map((finding, index) => ({
      priority: index + 1,
      title: finding.title,
      recommendation: finding.recommendation,
      severity: finding.severity
    })),
    roadmap: roadmap ? [
      { period: 'Now', action: top[0]?.recommendation || 'Confirm the highest-priority finding and assign an owner.' },
      { period: 'Next 30 days', action: top[1]?.recommendation || 'Address the next material gap and document the change.' },
      { period: '30–60 days', action: top[2]?.recommendation || 'Review progress and tackle the next priority.' },
      { period: '60–90 days', action: top[3]?.recommendation || 'Reassess the environment and measure the improvement.' }
    ] : [],
    note: 'This automated report is based on the answers supplied in your CloudFIXER assessment. It is designed as practical guidance, not a substitute for a formal audit or professional advice specific to your circumstances.'
  };
}

export async function getPaidReport(request, env) {
  try {
    await ensurePaymentTables(env);
    const token = new URL(request.url).searchParams.get('token');
    if (!token || token.length < 40) return json({ error: 'Invalid report link.' }, 400);
    const order = await env.DB.prepare(`SELECT id, assessment_id, product_key, status FROM orders WHERE delivery_token = ?`).bind(token).first();
    if (!order || order.status !== 'paid') return json({ error: 'This report has not been unlocked.' }, 403);
    const assessment = await env.DB.prepare(`SELECT overall_score, top_findings_json, answers_json FROM assessments WHERE id = ?`).bind(order.assessment_id).first();
    if (!assessment) return json({ error: 'Assessment not found.' }, 404);
    return json(reportPayload(order, assessment));
  } catch (error) {
    console.error('Paid report error', error);
    return json({ error: 'Unable to load this report.' }, 500);
  }
}

export { PRODUCT_CATALOG };
