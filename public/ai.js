const $ = s => document.querySelector(s);
const state = { questions: [], categories: [], index: 0, answers: {}, result: null };

const options = [
  ['yes','Yes','This happens regularly'],
  ['partial','Sometimes','It happens, but not all the time'],
  ['no','No','Not really'],
  ['unknown','Not sure','I would need to ask someone']
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
  if(score >= 75) return 'Lots of practical opportunities to explore';
  if(score >= 50) return 'Several useful opportunities stand out';
  if(score >= 25) return 'A few focused opportunities are worth a look';
  return 'Your best opportunities may be quite specific';
}

function paidOffersHtml(){
  return `
    <section class="paid-offers" aria-label="Paid CloudFIXER AI reports" style="margin-top:30px">
      <div style="margin-bottom:14px">
        <div class="eyebrow">WANT THE FULL PLAN?</div>
        <h3 style="margin:.35rem 0;color:var(--wine-dark)">Turn what you have just uncovered into a practical plan.</h3>
        <p style="margin:0;color:#766d6f">We turn your answers into a prioritised list of realistic improvements for your business.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:13px">
        <article style="border:1px solid #dbc7c9;background:#fff;border-radius:14px;padding:20px;box-shadow:0 10px 28px rgba(74,31,35,.045)">
          <div class="eyebrow">MOST POPULAR</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">AI Opportunity Action Plan</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine);margin-bottom:10px">£9.99</div>
          <p style="color:#766d6f;margin-top:0">Your strongest opportunities, where they sit in the business, likely benefit, quick wins and what to look at first.</p>
          <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f5eeee;color:var(--wine);font-size:.72rem;font-weight:800">Checkout being connected</span>
        </article>
        <article style="border:1px solid var(--line);background:#faf8f7;border-radius:14px;padding:20px">
          <div class="eyebrow">GO DEEPER</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">AI Roadmap</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine-dark);margin-bottom:10px">£19.99</div>
          <p style="color:#766d6f;margin-top:0">Everything in the Action Plan, plus implementation difficulty, dependencies and a simple 30 / 60 / 90-day roadmap.</p>
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
    state.result.overall >= 75 ? 'score-strong' :
    state.result.overall >= 50 ? 'score-good' :
    state.result.overall >= 25 ? 'score-warning' : 'score-risk'
  );

  $('#overallScore').textContent = state.result.overall;
  $('#scoreLabel').textContent = scoreLabel(state.result.overall);
  $('#resultSummary').textContent = 'This is an opportunity score, not a test of how advanced your business is. A higher score simply means your answers revealed more repetitive work, hard-to-find knowledge or information-heavy tasks where AI or automation may be useful.';
  $('#categoryScores').innerHTML = Object.entries(state.result.scores)
    .map(([k,v]) => `<article><span>${labelFor(k)}</span><strong>${v}</strong><div class="mini"><i style="width:${v}%"></i></div></article>`)
    .join('');

  const findings = state.result.findings.length ? state.result.findings : [{severity:'low',title:'No obvious broad opportunity stood out from these questions.',recommendation:'That does not mean AI cannot help. A useful next step would be to look closely at one specific process that feels slow, repetitive or difficult to hand over.'}];
  $('#findings').innerHTML = findings.map((f,i)=>`<article class="finding"><div class="rank">${i+1}</div><div><div class="severity ${f.severity}">${f.severity === 'high' ? 'strong opportunity' : f.severity === 'medium' ? 'worth exploring' : 'possible opportunity'}</div><h4>${f.title}</h4><p>${f.recommendation}</p></div></article>`).join('');

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
