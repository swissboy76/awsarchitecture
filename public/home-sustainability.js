document.addEventListener('DOMContentLoaded', () => {
  const heading = document.querySelector('#services .section-head h2');
  if (heading && heading.textContent.includes('Four practical ways')) {
    heading.textContent = 'Five practical ways to make technology work better.';
  }

  const grid = document.querySelector('#services .service-grid');
  if (!grid || grid.querySelector('[data-sustainable-card]')) return;

  const card = document.createElement('article');
  card.className = 'service-card sustainable';
  card.dataset.num = '05';
  card.dataset.sustainableCard = 'true';
  card.style.setProperty('--accent', '#3d6d58');
  card.style.setProperty('--dark', '#244b3c');
  card.style.setProperty('--soft', '#eaf3ee');
  card.style.gridColumn = '1 / -1';
  card.style.minHeight = '310px';

  card.innerHTML = `
    <span class="free-tag">Specialist review</span>
    <div class="service-kicker">SUSTAINABLE CLOUD & AI</div>
    <h3>Reduce carbon, water use and wasted compute.</h3>
    <p>Design cloud, AI and data platforms around lower-carbon power, efficient infrastructure and data centres with genuinely low operational water consumption.</p>
    <ul>
      <li>Lower-carbon cloud and compute placement</li>
      <li>Closed-loop, non-evaporative cooling criteria</li>
      <li>Carbon-aware AI and GPU workloads</li>
      <li>Storage lifecycle, retention and data reduction</li>
    </ul>
    <a class="secondary" href="/sustainable-cloud-ai" style="color:#244b3c;border-color:#b9d0c2;background:#f7fbf8">Explore sustainable cloud & AI</a>`;

  grid.appendChild(card);
});
