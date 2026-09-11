import { questions, categories } from '../../src/questions.js';

const scoreMap = { yes: 1, partial: 0.5, no: 0, unknown: 0.25 };

export function scoreAssessment(answers = {}) {
  const totals = Object.fromEntries(categories.map((category) => [category, { got: 0, possible: 0 }]));
  const findings = [];

  for (const question of questions) {
    const answer = answers[question.id] || 'unknown';
    const multiplier = scoreMap[answer] ?? 0.25;

    totals[question.category].possible += question.weight;
    totals[question.category].got += question.weight * multiplier;

    if (multiplier < 1) {
      const severity = question.weight >= 5 && multiplier === 0
        ? 'critical'
        : question.weight >= 4 && multiplier <= 0.5
          ? 'high'
          : 'medium';

      findings.push({
        id: question.id,
        category: question.category,
        severity,
        title: question.text,
        recommendation: question.help,
        impact: question.weight,
        multiplier
      });
    }
  }

  const scores = {};
  for (const category of categories) {
    scores[category] = Math.round((totals[category].got / totals[category].possible) * 100);
  }

  const overall = Math.round(categories.reduce((sum, category) => sum + scores[category], 0) / categories.length);
  const severityRank = { critical: 3, high: 2, medium: 1 };

  findings.sort((a, b) =>
    severityRank[b.severity] - severityRank[a.severity] ||
    b.impact - a.impact ||
    a.multiplier - b.multiplier
  );

  return { overall, scores, findings: findings.slice(0, 5) };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
