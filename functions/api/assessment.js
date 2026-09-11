import { json, scoreAssessment } from '../_lib/scoring.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    return json(scoreAssessment(body?.answers || {}));
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
}
