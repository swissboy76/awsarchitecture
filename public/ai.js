const $ = s => document.querySelector(s);
const state = { questions: [], categories: [], index: 0, answers: {}, result: null };

const options = [
  ['yes','Yes','This is generally in place'],
  ['partial','Partly','Some of the time / inconsistent'],
  ['no','No','There is clear room to improve'],
  ['unknown','Not sure','I do not know']
];

async function loadAssessment(){
  const r = await fetch('/api/questions?mode=ai');
  if(!r.ok) throw new Error('Unable to load assessment');
  const data = await r.json();
  state.questions = data.questions;
  state.categories = data.categories;
  state.index = 0;
  state.answers = {};
  state.result = null;
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
    <h2>${q.text}</h2>
    <p class="question-help">${q.help}</p>
    <div class="answers">${options.map(([v,t,s]) => `<button class="answer ${state.answers[q.id]===v?'selected':''}" data-value="${v}"><strong>${t}</strong><span>${s}</span></button>`).join('')}</div>
    <div class="question-nav"><button class="ghost" id="backBtn" ${state.index===0?'disabled':''}>Back</button></div>`;
  document.querySelectorAll('.answer').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.value)));
  $('#backBtn').addEventListener('click', () => { if(state.index>0){ state.index--; renderQuestion(); } });
}

async function choose(value){
  const q = state.questions[state.index];
  state.answers[q.id] = value;
  if(state.index < state.questions.length - 1){
    state.index++;
    renderQuestion();
    return;
  }
  await calculate();
}

async function calculate(){
  const r = await fetch('/api/assessment', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({mode:'ai', answers:state.answers})
  });
  if(!r.ok) throw new Error('Unable to calculate result');
  state.result = await r.json();
  state.categories = state.result.categories;
  showResults();
}

function scoreLabel(score){
  if(score >= 80) return 'Strong foundations for practical AI';
  if(score >= 65) return 'Good foundations, with useful opportunities';
  if(score >= 50) return 'Several worthwhile opportunities to explore';
  return 'Significant opportunity to improve how work and knowledge flow';
}

function paidOffersHtml(){
  return `
    <section class="paid-offers" aria-label="Paid CloudFIXER AI reports" style="margin-top:30px">
      <div style="margin-bottom:14px">
        <div class="eyebrow">WANT THE FULL PLAN?</div>
        <h3 style="margin:.35rem 0;color:var(--wine-dark)">Turn these opportunities into something you can act on.</h3>
        <p style="margin:0;color:#766d6f">Simple, low-cost reports for SMEs. No sales call, no consultancy package, no enterprise programme.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:13px">
        <article style="border:1px solid #dbc7c9;background:#fff;border-radius:14px;padding:20px;box-shadow:0 10px 28px rgba(74,31,35,.045)">
          <div class="eyebrow">MOST POPULAR</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">AI Opportunity Action Plan</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine);margin-bottom:10px">£9.99</div>
          <p style="color:#766d6f;margin-top:0">Your strongest AI opportunities, likely business benefit, quick wins, sensible cautions and a prioritised do-now / do-next list.</p>
          <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f5eeee;color:var(--wine);font-size:.72rem;font-weight:800">Checkout being connected</span>
        </article>
        <article style="border:1px solid var(--line);background:#faf8f7;border-radius:14px;padding:20px">
          <div class="eyebrow">GO DEEPER</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">AI Roadmap</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine-dark);margin-bottom:10px">£19.99</div>
          <p style="color:#766d6f;margin-top:0">Everything in the Action Plan plus implementation difficulty, dependencies, suggested approaches and a simple 30 / 60 / 90-day roadmap.</p>
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
  $('#scoreLabel').textContent = scoreLabel(state.result.overall);
  $('#resultSummary').textContent = 'This score reflects how ready your current processes, knowledge, customer service and information are for useful AI. Lower-scoring areas are often where the most practical opportunities exist.';
  $('#categoryScores').innerHTML = Object.entries(state.result.scores)
    .map(([k,v]) => `<article><span>${labelFor(k)}</span><strong>${v}</strong><div class="mini"><i style="width:${v}%"></i></div></article>`)
    .join('');

  const findings = state.result.findings.length ? state.result.findings : [{severity:'medium',title:'Your answers suggest a relatively mature starting point.',recommendation:'The next step would be to identify one or two targeted use cases with a clear business benefit rather than introducing AI everywhere.'}];
  $('#findings').innerHTML = findings.map((f,i)=>`<article class="finding"><div class="rank">${i+1}</div><div><div class="severity ${f.severity}">${f.severity === 'critical' ? 'high opportunity' : f.severity === 'high' ? 'opportunity' : 'consider'}</div><h4>${f.title}</h4><p>${f.recommendation}</p></div></article>`).join('');

  results.querySelector('.paid-offers')?.remove();
  document.querySelector('.result-action').insertAdjacentHTML('afterend', paidOffersHtml());
  window.scrollTo({top:0,behavior:'smooth'});
}

async function start(){
  try{
    await loadAssessment();
    $('#home').classList.add('hidden');
    $('#results').classList.add('hidden');
    $('#assessment').classList.remove('hidden');
    renderQuestion();
    window.scrollTo({top:0,behavior:'smooth'});
  }catch{
    alert('Unable to load the assessment. Please try again.');
  }
}

$('#startAi').addEventListener('click', start);
$('#restartBtn').addEventListener('click', () => {
  $('#assessment').classList.add('hidden');
  $('#results').classList.add('hidden');
  $('#home').classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
});

$('#leadForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('#formStatus');
  status.textContent = 'Saving…';
  status.className = 'status';

  const qualification = {
    employees: $('#employees').value,
    aiGoal: $('#aiGoal').value,
    currentAiUse: $('#aiUse').value
  };

  const r = await fetch('/api/lead', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      name:$('#name').value,
      company:$('#company').value,
      email:$('#email').value,
      marketingConsent:$('#marketingConsent').checked,
      mode:'ai',
      answers:state.answers,
      qualification
    })
  });

  const data = await r.json();
  if(!r.ok){
    status.textContent = data.error || 'Something went wrong.';
    status.className = 'status error';
    return;
  }
  status.textContent = 'Saved. Your AI opportunity assessment has been recorded.';
  status.className = 'status success';
});
