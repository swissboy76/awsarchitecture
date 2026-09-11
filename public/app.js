const $ = s => document.querySelector(s);
const state = { questions: [], index: 0, answers: {}, result: null };

const labels = { security:'Security', reliability:'Reliability', cost:'Cost', operations:'Operations', performance:'Performance', sustainability:'Sustainability' };
const options = [
  ['yes','Yes','Consistently in place'],
  ['partial','Partly','Some coverage / inconsistent'],
  ['no','No','Not currently in place'],
  ['unknown','Not sure','I do not know']
];

async function loadQuestions(){
  const r = await fetch('/api/questions');
  const data = await r.json(); state.questions = data.questions;
}

function renderQuestion(){
  const q = state.questions[state.index];
  const pct = Math.round((state.index / state.questions.length) * 100);
  $('#progressText').textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  $('#progressPct').textContent = `${pct}%`;
  $('#progressBar').style.width = `${pct}%`;
  $('#questionCard').innerHTML = `
    <div class="eyebrow">${labels[q.category].toUpperCase()}</div>
    <h2>${q.text}</h2><p class="question-help">${q.help}</p>
    <div class="answers">${options.map(([v,t,s]) => `<button class="answer ${state.answers[q.id]===v?'selected':''}" data-value="${v}"><strong>${t}</strong><span>${s}</span></button>`).join('')}</div>
    <div class="question-nav"><button class="ghost" id="backBtn" ${state.index===0?'disabled':''}>Back</button></div>`;
  document.querySelectorAll('.answer').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.value)));
  $('#backBtn').addEventListener('click', () => { if(state.index>0){ state.index--; renderQuestion(); } });
}

async function choose(value){
  const q = state.questions[state.index]; state.answers[q.id] = value;
  if(state.index < state.questions.length - 1){ state.index++; renderQuestion(); return; }
  await calculate();
}

async function calculate(){
  const r = await fetch('/api/assessment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers:state.answers})});
  state.result = await r.json(); showResults();
}

function showResults(){
  $('#assessment').classList.add('hidden'); $('#results').classList.remove('hidden');
  $('#overallScore').textContent = state.result.overall;
  $('#scoreLabel').textContent = state.result.overall >= 80 ? 'Strong foundation' : state.result.overall >= 65 ? 'Good, with material gaps' : state.result.overall >= 50 ? 'Improvement required' : 'Priority remediation required';
  $('#categoryScores').innerHTML = Object.entries(state.result.scores).map(([k,v]) => `<article><span>${labels[k]}</span><strong>${v}</strong><div class="mini"><i style="width:${v}%"></i></div></article>`).join('');
  $('#findings').innerHTML = state.result.findings.map((f,i)=>`<article class="finding"><div class="rank">${i+1}</div><div><div class="severity ${f.severity}">${f.severity}</div><h4>${f.title}</h4><p>${f.recommendation}</p></div></article>`).join('');
  window.scrollTo({top:0,behavior:'smooth'});
}

$('#startBtn').addEventListener('click', async () => {
  if(!state.questions.length) await loadQuestions();
  $('#home').classList.add('hidden'); $('#assessment').classList.remove('hidden'); renderQuestion();
});

$('#leadForm').addEventListener('submit', async e => {
  e.preventDefault(); const status=$('#formStatus'); status.textContent='Saving…';
  const r=await fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:$('#name').value,company:$('#company').value,email:$('#email').value,marketingConsent:$('#marketingConsent').checked,answers:state.answers})});
  const data=await r.json();
  if(!r.ok){ status.textContent=data.error || 'Something went wrong.'; status.className='status error'; return; }
  status.textContent='Saved. You are on the early-access list.'; status.className='status success';
});
