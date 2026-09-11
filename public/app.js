const $ = s => document.querySelector(s);
const state = { mode: null, questions: [], categories: [], index: 0, answers: {}, result: null };

const options = [
  ['yes','Yes','Consistently in place'],
  ['partial','Partly','Some coverage / inconsistent'],
  ['no','No','Not currently in place'],
  ['unknown','Not sure','I do not know']
];

async function loadQuestions(mode){
  const r = await fetch(`/api/questions?mode=${encodeURIComponent(mode)}`);
  if(!r.ok) throw new Error('Unable to load assessment');
  const data = await r.json();
  state.mode = data.mode;
  state.questions = data.questions;
  state.categories = data.categories;
  state.index = 0;
  state.answers = {};
  state.result = null;
  $('#assessmentMode').textContent = data.mode === 'simple' ? 'PLAIN-ENGLISH HEALTH CHECK' : 'TECHNICAL ASSESSMENT';
  $('#assessmentTitle').textContent = data.title;
  $('#assessmentDescription').textContent = data.description;
}

function labelFor(key){
  return state.categories.find(c => c.key === key)?.label || key;
}

function renderQuestion(){
  const q = state.questions[state.index];
  const pct = Math.round((state.index / state.questions.length) * 100);
  $('#progressText').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  $('#progressPct').textContent = `${pct}%`;
  $('#progressBar').style.width = `${pct}%`;
  $('#questionCard').innerHTML = `
    <div class="eyebrow">${labelFor(q.category).toUpperCase()}</div>
    <h2>${q.text}</h2><p class="question-help">${q.help}</p>
    <div class="answers">${options.map(([v,t,s]) => `<button class="answer ${state.answers[q.id]===v?'selected':''}" data-value="${v}"><strong>${t}</strong><span>${s}</span></button>`).join('')}</div>
    <div class="question-nav"><button class="ghost" id="backBtn" ${state.index===0?'disabled':''}>Back</button></div>`;
  document.querySelectorAll('.answer').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.value)));
  $('#backBtn').addEventListener('click', () => { if(state.index>0){ state.index--; renderQuestion(); } });
}

async function choose(value){
  const q = state.questions[state.index];
  state.answers[q.id] = value;
  if(state.index < state.questions.length - 1){ state.index++; renderQuestion(); return; }
  await calculate();
}

async function calculate(){
  const r = await fetch('/api/assessment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:state.mode,answers:state.answers})});
  if(!r.ok) throw new Error('Unable to calculate result');
  state.result = await r.json();
  state.categories = state.result.categories;
  showResults();
}

function paidOffersHtml(){
  const technical = state.mode === 'technical';
  const actionTitle = technical ? 'AWS Architecture Action Plan' : 'AWS Cloud Action Plan';
  const deeperTitle = technical ? 'Detailed Architecture Review' : 'Detailed Cloud Review';
  return `
    <section class="paid-offers" aria-label="Paid CloudFIXER reports" style="margin-top:30px">
      <div style="margin-bottom:14px">
        <div class="eyebrow">WANT THE FULL PLAN?</div>
        <h3 style="margin:.35rem 0;color:var(--wine-dark)">Turn your free result into clear next steps.</h3>
        <p style="margin:0;color:#766d6f">Low-cost, automatically generated reports are designed to be an easy next step for SMEs — no sales call required.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:13px">
        <article style="border:1px solid #dbc7c9;background:#fff;border-radius:14px;padding:20px;box-shadow:0 10px 28px rgba(74,31,35,.045)">
          <div class="eyebrow">MOST POPULAR</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">${actionTitle}</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine);margin-bottom:10px">£9.99</div>
          <p style="color:#766d6f;margin-top:0">Your prioritised findings, what they mean for the business, quick wins and a practical do-now / do-next action list.</p>
          <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f5eeee;color:var(--wine);font-size:.72rem;font-weight:800">Checkout being connected</span>
        </article>
        <article style="border:1px solid var(--line);background:#faf8f7;border-radius:14px;padding:20px">
          <div class="eyebrow">GO DEEPER</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">${deeperTitle}</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine-dark);margin-bottom:10px">£19.99</div>
          <p style="color:#766d6f;margin-top:0">Everything in the Action Plan plus deeper recommendations, priorities, dependencies and a simple improvement roadmap.</p>
          <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f1eeee;color:#756c6e;font-size:.72rem;font-weight:800">Checkout being connected</span>
        </article>
      </div>
    </section>`;
}

function showResults(){
  $('#assessment').classList.add('hidden');
  const results = $('#results');
  results.classList.remove('hidden','score-strong','score-good','score-warning','score-risk');
  results.classList.add(
    state.result.overall >= 80 ? 'score-strong' :
    state.result.overall >= 65 ? 'score-good' :
    state.result.overall >= 50 ? 'score-warning' : 'score-risk'
  );

  $('#overallScore').textContent = state.result.overall;
  $('#resultMode').textContent = state.mode === 'simple' ? 'YOUR AWS CLOUD HEALTH RESULT' : 'YOUR TECHNICAL ASSESSMENT RESULT';
  $('#scoreLabel').textContent = state.result.overall >= 80 ? 'Strong foundation' : state.result.overall >= 65 ? 'Good, with material gaps' : state.result.overall >= 50 ? 'Improvement required' : 'Priority attention recommended';
  $('#resultSummary').textContent = state.mode === 'simple'
    ? 'This is a high-level business health indicator designed to show where a deeper AWS review could be valuable.'
    : 'Use this as a prioritisation signal rather than a formal AWS Well-Architected Review.';
  $('#categoryScores').innerHTML = Object.entries(state.result.scores).map(([k,v]) => `<article><span>${labelFor(k)}</span><strong>${v}</strong><div class="mini"><i style="width:${v}%"></i></div></article>`).join('');
  $('#findings').innerHTML = state.result.findings.map((f,i)=>`<article class="finding"><div class="rank">${i+1}</div><div><div class="severity ${f.severity}">${f.severity}</div><h4>${f.title}</h4><p>${f.recommendation}</p></div></article>`).join('');

  if(state.mode === 'simple'){
    $('#resultAction').innerHTML = '<strong>You do not need to solve these issues yourself.</strong><span>A deeper review can turn these signals into a clear, prioritised action plan for your business.</span>';
    $('#qualificationFields').classList.remove('hidden');
    $('#leadIntro').textContent = 'Tell us a little about your AWS use so we can put this result in context and identify where an expert review could help most.';
  } else {
    $('#resultAction').innerHTML = '<strong>Want to go deeper?</strong><span>The next stage can combine this questionnaire with an automated AWS inventory and evidence-based architecture review.</span>';
    $('#qualificationFields').classList.add('hidden');
    $('#leadIntro').textContent = 'Save this technical assessment and join the early-access list for the detailed automated architecture report.';
  }

  results.querySelector('.paid-offers')?.remove();
  $('#resultAction').insertAdjacentHTML('afterend', paidOffersHtml());
  window.scrollTo({top:0,behavior:'smooth'});
}

async function startAssessment(mode){
  try {
    await loadQuestions(mode);
    $('#home').classList.add('hidden');
    $('#results').classList.add('hidden');
    $('#assessment').classList.remove('hidden');
    renderQuestion();
    window.scrollTo({top:0,behavior:'smooth'});
  } catch {
    alert('Unable to load the assessment. Please try again.');
  }
}

document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => startAssessment(btn.dataset.mode)));

$('#changePathBtn').addEventListener('click', () => {
  $('#assessment').classList.add('hidden');
  $('#results').classList.add('hidden');
  $('#home').classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
});

$('#leadForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status=$('#formStatus');
  status.textContent='Saving…';
  status.className='status';

  const qualification = state.mode === 'simple' ? {
    monthlyAwsSpend: $('#awsSpend').value,
    awsManager: $('#awsManager').value,
    mainConcern: $('#mainConcern').value
  } : {};

  const r=await fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
    name:$('#name').value,
    company:$('#company').value,
    email:$('#email').value,
    marketingConsent:$('#marketingConsent').checked,
    mode:state.mode,
    answers:state.answers,
    qualification
  })});
  const data=await r.json();
  if(!r.ok){ status.textContent=data.error || 'Something went wrong.'; status.className='status error'; return; }
  status.textContent='Saved. Your assessment has been recorded.';
  status.className='status success';
});
