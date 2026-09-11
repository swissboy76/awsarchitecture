export const aiAssessment = {
  id: 'ai',
  title: 'AI Opportunity Assessment',
  description: 'Eight quick questions about how work actually happens in your business, where time is lost and where AI or automation may be able to help.',
  categories: [
    { key: 'process', label: 'Processes' },
    { key: 'knowledge', label: 'Business Knowledge' },
    { key: 'customers', label: 'Customer Work' },
    { key: 'information', label: 'Reporting & Information' }
  ],
  questions: [
    { id: 'repeat_admin', category: 'process', weight: 5, text: 'Do people regularly repeat the same admin or data-entry tasks?', help: 'Think about copying details, checking forms, updating records, preparing the same documents or carrying out the same steps every day or week.', finding: 'Repeated admin looks like a strong opportunity for automation or AI assistance.' },
    { id: 'copy_between_systems', category: 'process', weight: 5, text: 'Do staff copy information between emails, spreadsheets or different systems?', help: 'For example: taking details from an email and putting them into a spreadsheet, CRM, finance system or booking system.', finding: 'Moving information between systems may be using staff time that could be reduced.' },
    { id: 'documents_manual', category: 'process', weight: 4, text: 'Do documents, forms or emails require a lot of manual reading, checking or summarising?', help: 'This could include invoices, applications, contracts, reports, meeting notes or long email threads.', finding: 'Document and email handling may be a practical AI opportunity.' },
    { id: 'chasing_handoffs', category: 'process', weight: 4, text: 'Do processes often stall because someone has to chase another person for information or approval?', help: 'Think about handovers, approvals, missing information and work that sits in inboxes waiting for somebody to act.', finding: 'Manual handovers and chasing may be slowing down routine work.' },

    { id: 'key_person_dependency', category: 'knowledge', weight: 5, text: 'Is important know-how concentrated in a few people rather than easy for everyone to find?', help: 'If the right answer often depends on knowing who to ask, valuable knowledge may be trapped in people rather than available to the business.', finding: 'Important knowledge may depend too heavily on a small number of people.' },
    { id: 'repeat_questions', category: 'customers', weight: 5, text: 'Do staff repeatedly answer the same questions from colleagues or customers?', help: 'This might be about procedures, prices, policies, availability, product details, support or what happens next.', finding: 'Repeated questions may be a strong opportunity for AI-assisted answers or self-service.' },
    { id: 'manual_reporting', category: 'information', weight: 4, text: 'Does producing reports or understanding business information involve a lot of manual spreadsheet work?', help: 'Think about copying figures, assembling weekly updates or pulling information together from several places.', finding: 'Reporting and analysis may be more manual than they need to be.' },
    { id: 'one_process_to_fix', category: 'process', weight: 5, text: 'Is there one task or process everyone agrees takes more time than it should?', help: 'A useful first AI project is usually one irritating, repetitive or knowledge-heavy piece of work with a clear business benefit.', finding: 'You already have a strong candidate for a focused first AI improvement project.' }
  ]
};

const opportunityMap = { yes: 1, partial: 0.6, no: 0, unknown: 0.25 };

export function scoreAiAssessment(answers = {}) {
  const categoryKeys = aiAssessment.categories.map(c => c.key);
  const totals = Object.fromEntries(categoryKeys.map(key => [key, { got: 0, possible: 0 }]));
  const findings = [];
  const categoryOpportunityCounts = Object.fromEntries(categoryKeys.map(key => [key, 0]));
  let strongOpportunityCount = 0;

  for (const q of aiAssessment.questions) {
    const answer = answers[q.id] || 'unknown';
    const multiplier = opportunityMap[answer] ?? 0.25;
    totals[q.category].possible += q.weight;
    totals[q.category].got += q.weight * multiplier;

    if (answer === 'yes') {
      strongOpportunityCount += 1;
      categoryOpportunityCounts[q.category] += 1;
    }

    if (multiplier > 0) {
      findings.push({
        id: q.id,
        category: q.category,
        severity: answer === 'yes' ? 'high' : answer === 'partial' ? 'medium' : 'low',
        title: q.finding,
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
  const severityRank = { high: 3, medium: 2, low: 1 };
  findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.impact - a.impact || b.multiplier - a.multiplier);

  return {
    mode: 'ai',
    title: aiAssessment.title,
    categories: aiAssessment.categories,
    overall,
    scores,
    strongOpportunityCount,
    categoryOpportunityCounts,
    findings: findings.slice(0, 5)
  };
}
