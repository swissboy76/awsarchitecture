import { questions } from '../../src/questions.js';
import { json } from '../_lib/scoring.js';

export async function onRequestGet() {
  return json({ questions });
}
