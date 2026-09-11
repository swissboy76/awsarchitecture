export const aiAssessment = {
  id: 'ai',
  title: 'AI Opportunity Assessment',
  description: 'A guided look at how work actually happens in your business, where time is lost, where knowledge is hard to access and where AI may be able to help.',
  categories: [
    { key: 'process', label: 'Repetitive Work' },
    { key: 'knowledge', label: 'Business Knowledge' },
    { key: 'customers', label: 'Customer Work' },
    { key: 'information', label: 'Information & Reporting' },
    { key: 'starting', label: 'Where to Start' }
  ],
  questions: [
    { id: 'repeat_admin', category: 'process', weight: 5, text: 'Do people in your business repeat the same admin tasks every day or every week?', help: 'Think about copying information, checking forms, preparing updates, chasing responses, renaming files or producing the same kinds of documents.', finding: 'Repeated admin looks like a strong area to explore for AI or automation.' },
    { id: 'copy_between_systems', category: 'process', weight: 5, text: 'Do staff copy information from emails, documents or one system into another?', help: 'For example: taking details from an email and entering them into a spreadsheet, CRM, finance system or booking system.', finding: 'Moving information between systems may be using staff time that could be reduced.' },
    { id: 'documents_manual', category: 'process', weight: 4, text: 'Do people spend time reading, sorting, summarising or extracting information from documents?', help: 'This could include invoices, applications, forms, contracts, reports, meeting notes or long email threads.', finding: 'Document handling may be a practical AI opportunity.' },
    { id: 'chasing_handoffs', category: 'process', weight: 4, text: 'Do routine jobs get slowed down because someone has to chase, check or pass information to the next person?', help: 'Think about approvals, handovers, missing information and work that sits in inboxes waiting for somebody to act.', finding: 'Manual handovers and chasing may be slowing down routine work.' },

    { id: 'same_questions_staff', category: 'knowledge', weight: 5, text: 'Do staff regularly ask the same questions about how things should be done?', help: 'Examples include procedures, prices, policies, product information, customer rules, technical details or “who knows how to do this?”.', finding: 'Repeated internal questions suggest your business knowledge could be made easier to access.' },
    { id: 'key_person_dependency', category: 'knowledge', weight: 5, text: 'Would parts of the business struggle if one or two experienced people were unavailable?', help: 'This often means valuable knowledge exists mainly in people’s heads rather than somewhere the rest of the business can use it.', finding: 'Important knowledge may depend too heavily on a small number of people.' },
    { id: 'knowledge_scattered', category: 'knowledge', weight: 4, text: 'Is useful business knowledge spread across shared drives, emails, documents and different systems?', help: 'If staff know the answer exists but struggle to find the right version, that is a useful signal.', finding: 'Scattered business knowledge may be a good candidate for an AI-assisted search or knowledge service.' },
    { id: 'onboarding_manual', category: 'knowledge', weight: 3, text: 'Does training a new member of staff depend heavily on somebody showing them where everything is and how things work?', help: 'A lot of SME knowledge transfer happens informally. Making that knowledge easier to access can reduce the burden on experienced staff.', finding: 'Onboarding may be relying on informal knowledge that could be captured and reused.' },

    { id: 'repeat_customer_questions', category: 'customers', weight: 5, text: 'Do customers regularly ask the same kinds of questions?', help: 'Think about availability, pricing, order status, policies, product details, appointments, delivery, support or what happens next.', finding: 'Repeated customer questions may be suitable for AI-assisted responses or self-service.' },
    { id: 'similar_replies', category: 'customers', weight: 4, text: 'Do staff spend time writing very similar emails, quotes, updates or responses?', help: 'AI can often help prepare a first draft using approved business information, with a person still checking the final response.', finding: 'Repeated drafting may be an easy place to save staff time.' },
    { id: 'feedback_unused', category: 'customers', weight: 3, text: 'Do you collect customer emails, reviews or feedback but rarely have time to look for patterns?', help: 'AI can help group comments and highlight recurring themes without somebody reading everything manually.', finding: 'Customer feedback may contain useful patterns that are currently difficult to extract.' },

    { id: 'manual_reporting', category: 'information', weight: 4, text: 'Do people spend time assembling regular reports or management information by hand?', help: 'For example: copying figures into spreadsheets, creating weekly summaries or pulling together information from several systems.', finding: 'Reporting may be more manual than it needs to be.' },
    { id: 'information_search', category: 'information', weight: 4, text: 'Does finding the right customer, project or business information take longer than it should?', help: 'The problem may not be lack of information — it may simply be spread across too many places.', finding: 'Finding business information may be taking unnecessary time.' },
    { id: 'data_questions', category: 'information', weight: 3, text: 'Are there useful questions about the business that are difficult to answer from the data you already have?', help: 'For example: which jobs take longest, why customers contact you, what work is most profitable or where delays happen.', finding: 'Existing business data may be able to answer more useful questions with better analysis.' },

    { id: 'one_process_to_fix', category: 'starting', weight: 5, text: 'Is there at least one job or process that you would happily make faster, easier or less dependent on people remembering things?', help: 'You do not need an “AI strategy”. A good first project is usually one irritating, repetitive or knowledge-heavy piece of work with a clear benefit.', finding: 'You already have the ingredients for a focused first AI improvement project.' }
  ]
};

const opportunityMap = { yes: 1, partial: 0.6, no: 0, unknown: 0.25 };

export function scoreAiAssessment(answers = {}) {
  const categoryKeys = aiAssessment.categories.map(c => c.key);
  const totals = Object.fromEntries(categoryKeys.map(key => [key, { got: 0, possible: 0 }]));
  const findings = [];

  for (const q of aiAssessment.questions) {
    const answer = answers[q.id] || 'unknown';
    const multiplier = opportunityMap[answer] ?? 0.25;
    totals[q.category].possible += q.weight;
    totals[q.category].got += q.weight * multiplier;

    if (multiplier > 0) {
      findings.push({
        id: q.id,
        category: q.category,
        severity: multiplier >= 1 && q.weight >= 5 ? 'high' : multiplier >= 0.6 ? 'medium' : 'low',
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
    findings: findings.slice(0, 6)
  };
}
