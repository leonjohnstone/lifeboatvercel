const list = document.querySelector('#list');
const search = document.querySelector('#search');

const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long' });
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
const sourceUrl = (iso) => `https://www.crossfit.com/workout/${iso.slice(0,4)}/${iso.slice(5,7)}/${iso.slice(8,10)}`;
const codeFromIso = (iso) => `01${iso.slice(5,7)}${iso.slice(8,10)}`;

const embedded = new Map((window.FIRST100_ENTRIES || []).map(e => [e.date, e.text]));
const entries = (window.FIRST100_DAYS || []).map((iso, idx) => ({
  day: idx + 1,
  date: iso,
  code: codeFromIso(iso),
  title: dayFmt.format(new Date(`${iso}T12:00:00Z`)),
  text: embedded.get(iso) || '',
  url: sourceUrl(iso),
  loaded: embedded.has(iso)
}));

function matches(entry, q) {
  if (!q) return true;
  const haystack = `${entry.day} ${entry.date} ${entry.code} ${entry.title} ${entry.text}`.toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function render() {
  const q = search.value.trim();
  const filtered = entries.filter(e => matches(e, q));
  list.innerHTML = '';
  let currentMonth = '';

  for (const entry of filtered) {
    const month = monthName.format(new Date(`${entry.date}T12:00:00Z`));
    if (month !== currentMonth) {
      currentMonth = month;
      const h = document.createElement('h2');
      h.className = 'month';
      h.textContent = month;
      list.appendChild(h);
    }

    const article = document.createElement('article');
    article.className = 'entry';
    if (!entry.loaded) article.classList.add('fallback');

    const details = document.createElement('details');
    details.open = true;

    const summary = document.createElement('summary');
    summary.innerHTML = `<span class="day">Day ${entry.day}</span><span class="date">${entry.date}</span><span class="code">${entry.code}</span>`;

    const source = document.createElement('a');
    source.href = entry.url;
    source.textContent = 'Original';
    source.className = 'source';
    source.target = '_blank';
    source.rel = 'noopener';

    const pre = document.createElement('pre');
    pre.textContent = entry.text;

    details.appendChild(summary);
    details.appendChild(pre);
    article.appendChild(details);
    article.appendChild(source);
    list.appendChild(article);
  }

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No entries match that search.';
    list.appendChild(empty);
  }
}

search.addEventListener('input', render);
render();
