// Run on https://my.golden-success.com/attendance (javascript_tool in Chrome).
// Returns a JSON string mapping every placeholder in attendance-post-4x5.html to its value.
(() => {
  const TOP = 3;
  const table = document.querySelector('table');
  if (!table) throw new Error('Attendance table not found');
  const rows = [...table.querySelectorAll('tbody tr')]
    .map(r => [...r.children].map(c => c.innerText.trim().replace(/\s+/g, ' ')))
    .filter(r => r.length >= 10);
  // Columns: 0 EMPLOYEE NO., 1 PERSON, 2 STATUS, 3 WORKING DAY OFF, 4 ABSENTS, 5 LEAVE,
  //          6 LATES, 7 UNDERTIME, 8 OVERTIME, 9 INCOMPLETE
  const num = s => parseInt(s, 10) || 0;
  const sec = s => { if (!s) return 0; const [h, m, x] = s.split(':').map(Number); return h * 3600 + m * 60 + (x || 0); };
  const hm = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`; };
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Ranked list HTML: top N by value (ties broken by name), shared rank for equal values,
  // plus a note when more people share the last shown value.
  const ranked = (getVal, label) => {
    const list = rows.map(r => ({ name: r[1], v: getVal(r) })).filter(x => x.v > 0)
      .sort((a, b) => b.v - a.v || a.name.localeCompare(b.name));
    if (!list.length) return '<li class="none">None this cut-off</li>';
    const shown = list.slice(0, TOP);
    let html = shown.map(x => {
      const rank = list.findIndex(y => y.v === x.v) + 1;
      return `<li><span class="rk">${rank}</span><span class="nm">${esc(x.name)}</span><span class="vl">${label(x.v)}</span></li>`;
    }).join('');
    const lastV = shown[shown.length - 1].v;
    const tied = list.slice(TOP).filter(x => x.v === lastV).length;
    if (tied) html += `<li class="more">+${tied} more with ${label(lastV)}</li>`;
    return html;
  };

  const period = (document.body.innerText.match(/\d{1,2} [A-Z]{3} \d{4} – \d{1,2} [A-Z]{3} \d{4}/) || [''])[0]
    .replace(/\b([A-Z])([A-Z]{2})\b/g, (_, a, b) => a + b.toLowerCase());
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Also kept on window so a long result can be read back one key at a time,
  // e.g. window.__attendance.ABSENT_TOP, if the tool output gets truncated.
  return JSON.stringify(window.__attendance = {
    PERIOD: period,
    DATE_TIME: today,
    EMP_TOTAL: String(rows.length),
    EMP_REGULAR: String(rows.filter(r => r[2] === 'REGULAR').length),
    EMP_PARTTIME: String(rows.filter(r => r[2] === 'PART-TIME').length),
    ABSENT_PEOPLE: String(rows.filter(r => num(r[4])).length),
    LATE_PEOPLE: String(rows.filter(r => sec(r[6])).length),
    UT_PEOPLE: String(rows.filter(r => sec(r[7])).length),
    PERFECT: String(rows.filter(r => !num(r[4]) && !num(r[5]) && !sec(r[6]) && !sec(r[7]) && !num(r[9])).length),
    INC_PEOPLE: String(rows.filter(r => num(r[9])).length),
    LEAVE_DAYS: String(rows.reduce((a, r) => a + num(r[5]), 0)),
    LEAVE_PEOPLE: String(rows.filter(r => num(r[5])).length),
    ABSENT_TOP: ranked(r => num(r[4]), v => `${v} day${v === 1 ? '' : 's'}`),
    LATE_TOP: ranked(r => sec(r[6]), hm),
    UT_TOP: ranked(r => sec(r[7]), hm),
  });
})()
