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
  const hasAnswer = Boolean(state.answers[q.id]);
  const isLast = state.index === state.questions.length - 1;

  $('#progressText').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  $('#progressPct').textContent = `${pct}%`;
  $('#progressBar').style.width = `${pct}%`;
  $('#questionCard').innerHTML = `
    <div class="eyebrow">${labelFor(q.category).toUpperCase()}</div>
    <h2>${q.text}</h2>
    <p class="question-help">${q.help}</p>
    <div class="answers">${options.map(([v,t,s]) => `<button class="answer ${state.answers[q.id]===v?'selected':''}" data-value="${v}" type="button"><strong>${t}</strong><span>${s}</span></button>`).join('')}</div>
    <div class="question-nav" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <button class="ghost" id="backBtn" type="button" ${state.index===0?'disabled':''}>Back</button>
      <button class="primary" id="nextBtn" type="button" ${hasAnswer?'':'disabled'}>${isLast ? 'See my result' : 'Next'}</button>
    </div>`;

  document.querySelectorAll('.answer').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.value)));
  $('#backBtn').addEventListener('click', () => {
    if(state.index > 0){
      state.index--;
      renderQuestion();
    }
  });
  $('#nextBtn').addEventListener('click', nextQuestion);
}

function choose(value){
  const q = state.questions[state.index];
  state.answers[q.id] = value;
  document.querySelectorAll('.answer').forEach(btn => btn.classList.toggle('selected', btn.dataset.value === value));
  $('#nextBtn').disabled = false;
}

async function nextQuestion(){
  const q = state.questions[state.index];
  if(!state.answers[q.id]) return;
  if(state.index < state.questions.length - 1){
    state.index++;
    renderQuestion();
    return;
  }

  const nextBtn = $('#nextBtn');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Calculating…';
  try{
    await calculate();
  }catch{
    nextBtn.disabled = false;
    nextBtn.textContent = 'See my result';
    alert('Unable to calculate your result. Please try again.');
  }
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

function opportunityLabel(count){
  if(count >= 5) return 'You have several strong places to start';
  if(count >= 3) return 'A few strong opportunities stand out';
  if(count >= 1) return 'A focused opportunity stands out';
  return 'No obvious broad opportunity stood out';
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
          <button class="primary buy-report" type="button" data-product="ai_action_plan">Buy and unlock instantly</button>
        </article>
        <article style="border:1px solid var(--line);background:#faf8f7;border-radius:14px;padding:20px">
          <div class="eyebrow">GO DEEPER</div>
          <h3 style="margin:8px 0 3px;color:var(--wine-dark)">AI Roadmap</h3>
          <div style="font-size:2rem;font-weight:750;color:var(--wine-dark);margin-bottom:10px">£19.99</div>
          <p style="color:#766d6f;margin-top:0">Everything in the Action Plan, plus implementation difficulty, dependencies and a simple 30 / 60 / 90-day roadmap.</p>
          <button class="secondary buy-report" type="button" data-product="ai_roadmap">Buy AI roadmap</button>
        </article>
      </div>
    </section>`;
}

function showResults(){
  $('#assessment').classList.add('hidden');
  const results = $('#results');
  const strong = state.result.strongOpportunityCount ?? 0;
  results.classList.remove('hidden','score-strong','score-good','score-warning','score-risk');
  results.classList.add(strong >= 5 ? 'score-strong' : strong >= 3 ? 'score-good' : strong >= 1 ? 'score-warning' : 'score-risk');

  $('#overallScore').textContent = strong;
  const unit = document.querySelector('.score-hero>div:first-child small');
  if(unit) unit.textContent = strong === 1 ? 'strong opportunity' : 'strong opportunities';
  $('#scoreLabel').textContent = opportunityLabel(strong);
  $('#resultSummary').textContent = 'These are areas where your answers suggest there is repeated work, hard-to-find knowledge or information-heavy activity worth exploring. This is not a maturity score.';

  const counts = state.result.categoryOpportunityCounts || {};
  $('#categoryScores').innerHTML = state.categories
    .map(c => {
      const count = counts[c.key] || 0;
      return `<article><span>${c.label}</span><strong>${count}</strong><div style="font-size:.78rem;color:#807678;margin-top:4px">${count === 1 ? 'strong signal' : 'strong signals'}</div></article>`;
    })
    .join('');

  const findings = state.result.findings.length ? state.result.findings : [{severity:'low',title:'No obvious broad opportunity stood out from these questions.',recommendation:'That does not mean AI cannot help. A useful next step would be to look closely at one specific process that feels slow, repetitive or difficult to hand over.'}];
  $('#findings').innerHTML = findings.map((f,i)=>`<article class="finding"><div class="rank">${i+1}</div><div><div class="severity ${f.severity}">${f.severity === 'high' ? 'strong opportunity' : f.severity === 'medium' ? 'worth exploring' : 'possible opportunity'}</div><h4>${f.title}</h4><p>${f.recommendation}</p></div></article>`).join('');

  results.querySelector('.paid-offers')?.remove();
  document.querySelector('.result-action').insertAdjacentHTML('afterend', paidOffersHtml());
  document.querySelectorAll('.buy-report').forEach(button => button.addEventListener('click', () => startCheckout(button)));
  window.scrollTo({top:0,behavior:'smooth'});
}

async function startCheckout(button){
  const original=button.textContent;
  button.disabled=true;
  button.textContent='Opening secure checkout…';
  try{
    const response=await fetch('/api/checkout',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        productKey:button.dataset.product,
        mode:'ai',
        answers:state.answers,
        email:$('#email')?.value||''
      })
    });
    const data=await response.json();
    if(!response.ok||!data.checkoutUrl) throw new Error(data.error||'Unable to start checkout.');
    location.href=data.checkoutUrl;
  }catch(error){
    button.disabled=false;
    button.textContent=original;
    alert(error.message);
  }
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
