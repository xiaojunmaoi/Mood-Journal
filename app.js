(() => {
  'use strict';
  const J = window.Journal;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const icon = name => { const img = el('img'); img.src = `assets/icons/${name}.svg`; img.alt = ''; return img; };
  const ENTRY_KEY = 'xinqing.entries.v1', CARE_KEY = 'xinqing.care.v1';
  let entries = [], careLogs = [], demo = false, demoEntries = [...window.AlbumUI.examples(), ...J.examples()], demoCare = [], editingId = null, deletingId = null;
  let selectedMood = 0, currentSuggestion = 'walk', page = 'today', toastTimeout;
  let rawCorrupt = null, album, readyPromise, storageReady = false;
  const drafts = { personal: { mood: 0, tags: [], note: '' }, demo: { mood: 4, tags: ['工作'], note: '' } };
  const activityNames = { breathe: '1分钟呼吸练习', rain: '温柔雨声', noise: '白噪音', walk: '5分钟散步' };
  let activity = null, activityTimer = null;
  const care = window.CareUI.create({ openActivity });

  function warning(message) { $('#storage-warning').textContent = message; $('#storage-warning').hidden = false; }
  try {
    const raw = localStorage.getItem(ENTRY_KEY);
    const parsed = J.parseEntries(raw);
    entries = parsed.entries;
    if (parsed.error) { rawCorrupt = raw; warning('部分本地记录无法读取。可用记录已保留，原始数据会在下次保存时备份。'); }
    const careRaw = localStorage.getItem(CARE_KEY);
    if (careRaw) {
      const data = JSON.parse(careRaw);
      careLogs = Array.isArray(data) ? data.filter(x => x && activityNames[x.kind] && typeof x.date === 'string' && Number.isFinite(Date.parse(x.date)) && ['好一点了', '差不多', '更难受了', '未填写'].includes(x.feedback)) : [];
    }
  } catch { warning('浏览器存储暂不可用或数据格式异常。保存时会再次检查，请勿将这里作为重要记录的唯一备份。'); }

  function persist(key, value) {
    try {
      if (key === ENTRY_KEY && rawCorrupt !== null) { localStorage.setItem(`${ENTRY_KEY}.backup.${Date.now()}`, rawCorrupt); rawCorrupt = null; }
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { warning('未能保存到浏览器，可能是存储已满或权限受限。你的输入仍保留在页面中，请先复制备份。'); return false; }
  }
  function toast(message) { clearTimeout(toastTimeout); $('#toast').textContent = message; $('#toast').hidden = false; toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 3600); }
  function data() { return demo ? demoEntries : entries; }
  function feedbackData() { return demo ? demoCare : careLogs; }
  function shortDate(value) { return new Date(value).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }); }
  function setDate() {
    const now = new Date();
    $('#date-month').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    $('#date-weekday').textContent = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    $('#date-day').textContent = String(now.getDate()).padStart(2, '0');
  }
  function tagsSelected() { return $$('#tag-options input:checked').map(input => input.value); }
  function buildForm() {
    J.moods.forEach((label, i) => {
      const wrapper = el('label', 'mood-choice');
      const input = el('input'); input.type = 'radio'; input.name = 'mood'; input.value = String(i + 1); input.setAttribute('aria-label', label);
      const face = el('span', 'mood-face'); face.style.setProperty('--face-position', `${i * 25}%`); face.setAttribute('aria-hidden', 'true');
      wrapper.append(input, face, el('span', 'mood-label', label));
      $('#mood-options').append(wrapper);
      input.addEventListener('change', () => { selectedMood = i + 1; $('#form-error').hidden = true; updateSuggestion(J.recommend({ mood: selectedMood, tags: tagsSelected() })); });
    });
    J.tags.forEach(tag => {
      const wrapper = el('label', 'tag-chip');
      const input = el('input'); input.type = 'checkbox'; input.value = tag;
      wrapper.append(input, el('span', '', tag)); $('#tag-options').append(wrapper);
      input.addEventListener('change', () => updateSuggestion(J.recommend({ mood: selectedMood || 3, tags: tagsSelected() })));
    });
    $('#journal-note').addEventListener('input', updateCounter);
  }
  function updateCounter() { $('#note-count').textContent = `${$('#journal-note').value.length} / 500`; }
  function setForm(entry = { mood: 0, tags: [], note: '' }) {
    selectedMood = entry.mood;
    $$('#mood-options input').forEach(input => { input.checked = Number(input.value) === entry.mood; });
    $$('#tag-options input').forEach(input => { input.checked = entry.tags.includes(input.value); });
    $('#journal-note').value = entry.note;
    updateCounter(); $('#form-error').hidden = true; $('#save-success').hidden = true;
    $('#save-entry').replaceChildren(document.createTextNode(editingId ? '保存修改' : '记下这一刻'), Object.assign(icon('arrow-right'), { className: 'icon' }));
    $('#cancel-edit').hidden = !editingId;
  }
  async function saveEntry(event) {
    event.preventDefault();
    if ($('#save-entry').disabled) return;
    let entry;
    try {
      const existing = editingId ? data().find(e => e.id === editingId) : null;
      entry = J.createEntry({ id: existing?.id, date: existing?.date, mood: selectedMood, tags: tagsSelected(), note: $('#journal-note').value });
    } catch (error) { $('#form-error').textContent = error.message; $('#form-error').hidden = false; $('#mood-options input').focus(); return; }
    const wasEditing = Boolean(editingId);
    $('#save-entry').disabled = true;
    try { await saveRecord(entry); } catch (error) { warning(`未能保存：${error.message} 输入已保留，请重试。`); return; } finally { $('#save-entry').disabled = false; }
    editingId = null; setForm(); updateSuggestion(J.recommend(entry)); renderData();
    $('#save-success').textContent = demo ? '示例已更新，个人手帐没有改变。' : wasEditing ? '修改已保存。每一种感受，都值得被认真对待。' : '已记下你的感受。现在，给自己留一点时间吧。';
    $('#save-success').hidden = false;
    toast(demo ? '已保存到示例手帐' : wasEditing ? '日记已更新' : '这一刻，已经好好收下了。');
  }
  function updateSuggestion(kind) {
    currentSuggestion = kind === 'rain' ? 'noise' : kind;
    care.select(currentSuggestion);
  }
  async function refreshRecords() { if (storageReady) entries = await window.JournalStore.list(); renderData(); }
  async function saveRecord(entry, draftKey) {
    await readyPromise;
    if (demo) { demoEntries = data().some(e => e.id === entry.id) ? data().map(e => e.id === entry.id ? entry : e) : [...data(), entry]; }
    else { if (!storageReady) throw new Error('本机数据库暂不可用'); await window.JournalStore.save(entry, draftKey); entries = await window.JournalStore.list(); }
    renderData();
  }
  async function removeRecord(id) {
    await readyPromise;
    if (demo) demoEntries = data().filter(e => e.id !== id);
    else { if (!storageReady) throw new Error('本机数据库暂不可用'); await window.JournalStore.remove(id); entries = await window.JournalStore.list(); }
    // The caller navigates away before re-rendering a removed detail.
  }
  async function changePage(next) {
    next = /^(today|review|care|album|write|entry\/[^/]+|edit\/[^/]+)$/.test(next) ? next : 'today';
    if (album && !await album.beforeLeave(next)) { history.replaceState(null, '', `#${page}`); return; }
    $('#save-success').hidden = true;
    page = next;
    const surface = next === 'write' || next.startsWith('edit/') ? 'editor' : next.startsWith('entry/') ? 'entry' : next;
    const nav = ['album', 'editor', 'entry'].includes(surface) ? 'review' : surface;
    document.body.dataset.surface = surface;
    $$('.page').forEach(section => { section.hidden = section.id !== `page-${surface}`; });
    $$('.main-nav a').forEach(link => { const active = link.dataset.page === nav; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    document.title = `${{ today: '今日心情', review: '情绪回顾', care: '自我关怀', album: '我的手帐', editor: '写日记', entry: '日记' }[surface]} · 心晴`;
    if (album) { try { await readyPromise; await album.route(next); } catch (error) { toast(`页面暂未准备好：${error.message}`); } }
    renderData();
  }
  function goto(next) { if (location.hash === `#${next}`) changePage(next); else location.hash = next; window.scrollTo({ top: 0, behavior: 'instant' }); }
  function toggleDemo() {
    drafts[demo ? 'demo' : 'personal'] = { mood: selectedMood, tags: tagsSelected(), note: $('#journal-note').value, editingId };
    demo = !demo;
    editingId = drafts[demo ? 'demo' : 'personal'].editingId || null;
    if (editingId && !data().some(entry => entry.id === editingId)) editingId = null;
    $('#demo-banner').hidden = !demo;
    $('#demo-toggle span').textContent = demo ? '退出示例' : '查看示例';
    setForm(drafts[demo ? 'demo' : 'personal']);
    updateSuggestion(J.recommend({ mood: selectedMood || 3, tags: tagsSelected() }));
    renderData(); toast(demo ? '进入示例手帐，不影响个人记录' : '已回到你的手帐');
  }
  function chart(canvas, emptyEl) {
    if (!canvas.clientWidth) return;
    const days = J.weekly(data()), width = canvas.clientWidth, height = canvas.clientHeight;
    const hasRecords = days.some(d => d.value !== null);
    const scale = window.devicePixelRatio || 1; canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
    const left = width < 380 ? 43 : 51, right = 15, top = 12, bottom = 28;
    const px = i => left + i * (width - left - right) / 6;
    const py = value => top + (5 - value) / 4 * (height - top - bottom);
    ctx.font = `${width < 380 ? 10 : 11}px "Microsoft YaHei", sans-serif`; ctx.textBaseline = 'middle';
    [1, 3, 5].forEach(value => { const y = py(value); ctx.strokeStyle = hasRecords ? '#ded5c875' : '#ded5c83b'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke(); ctx.fillStyle = '#998b79'; ctx.textAlign = 'right'; ctx.fillText(J.moods[value - 1], left - 11, y); });
    days.forEach((day, i) => { const x = px(i); ctx.strokeStyle = hasRecords ? '#e4dbcf66' : '#e4dbcf20'; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, height - bottom); ctx.stroke(); ctx.fillStyle = i === 6 ? '#b9654b' : '#9b8e7c'; ctx.textAlign = 'center'; ctx.fillText(day.label, x, height - 9); });
    ctx.strokeStyle = '#bd795f'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.beginPath(); let started = false;
    days.forEach((day, i) => { if (day.value === null) { started = false; return; } if (started) ctx.lineTo(px(i), py(day.value)); else ctx.moveTo(px(i), py(day.value)); started = true; }); ctx.stroke();
    days.forEach((day, i) => { if (day.value === null) return; ctx.beginPath(); ctx.arc(px(i), py(day.value), 4.4, 0, Math.PI * 2); ctx.fillStyle = '#b96a50'; ctx.fill(); });
    const summary = days.map(d => `${d.label}：${d.value === null ? '无记录' : `${d.value.toFixed(1)}分，${d.count}条记录`}`).join('；');
    canvas.setAttribute('aria-label', `最近7天心情自评（1至5分）。${summary}`);
    emptyEl.hidden = hasRecords;
  }
  function renderTriggers() {
    const stats = J.triggers(data()), container = $('#trigger-bars'); container.replaceChildren();
    stats.forEach(({ tag, count }) => {
      const row = el('div', 'trigger-row'), track = el('span', 'trigger-track'), fill = el('span'); fill.style.width = `${count / stats[0].count * 100}%`; track.append(fill); row.append(el('span', '', tag), track, el('span', '', `${count}次`)); container.append(row);
    });
    const keys = new Set(J.weekly([]).map(d => d.key));
    const low = data().filter(e => e.mood >= 1 && e.mood <= 2 && keys.has(J.entryDay(e))).length;
    $('#trigger-insight').textContent = stats.length ? `最近7天的 ${low} 条低落记录中，有 ${stats[0].count} 条提到了“${stats[0].tag}”。回看这些片刻，或许能发现相似的情境。` : low ? '有些感受还没有找到原因，也没有关系。下次记录时，可以试着选一个影响因素。' : '这里还没有足够的低落记录可供整理。不必为了分析而记录，按自己的节奏就好。';
  }
  function emptyState(title, copy, action) {
    const wrap = el('div', 'empty-state'); wrap.append(icon('notebook'), el('h3', '', title), el('p', '', copy));
    if (action) { const button = el('button', 'button outline', '记下此刻的心情'); button.type = 'button'; button.addEventListener('click', () => goto('today')); wrap.append(button); }
    return wrap;
  }
  function renderCareHistory() {
    const list = $('#care-history-list'); list.replaceChildren();
    if (!feedbackData().length) { list.append(emptyState('给自己留一点时间，就很好。', demo ? '在示例中也可以体验一次练习，反馈不会写入个人记录。' : '完成一项小练习后，这里会收好你的关怀记录。', false)); return; }
    [...feedbackData()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12).forEach(item => {
      const row = el('div', 'care-history-row'); row.append(el('span', '', item.kind === 'noise' && window.CareUI.sounds[item.sound] ? `白噪音 · ${window.CareUI.sounds[item.sound].name}` : activityNames[item.kind]), el('span', 'care-feedback-label', item.feedback), el('time', 'date', shortDate(item.date))); list.append(row);
    });
  }
  function renderData() {
    setDate(); $('#home-data-label').textContent = $('#review-data-label').textContent = demo ? '示例数据' : '我的记录';
    renderTriggers(); renderCareHistory(); album?.render();
    requestAnimationFrame(() => { chart($('#home-chart'), $('#home-chart-empty')); chart($('#review-chart'), $('#review-chart-empty')); });
  }

  function cleanupActivity() {
    clearInterval(activityTimer); activityTimer = null;
    care.stopSound();
  }
  function control(text, className, handler) { const button = el('button', `button ${className}`, text); button.type = 'button'; button.addEventListener('click', handler); return button; }
  function clockText(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function elapsed() { return activity.elapsed + (activity.running ? Date.now() - activity.started : 0); }
  function updateTimer() {
    if (!activity || activity.kind === 'noise') return;
    const milliseconds = elapsed(), seconds = Math.max(0, activity.duration - Math.floor(milliseconds / 1000));
    $('#timer-readout').textContent = clockText(seconds);
    if (activity.kind === 'breathe') {
      const inhale = Math.floor(milliseconds / 4000) % 2 === 0, orb = $('#breathing-orb');
      orb.textContent = activity.running ? (inhale ? '轻轻吸气' : '慢慢呼气') : activity.elapsed ? '暂停片刻' : '准备好了';
      orb.classList.toggle('inhale', activity.running && inhale); orb.classList.toggle('exhale', activity.running && !inhale);
    }
    if (seconds === 0) finishActivity();
  }
  function toggleTimer() {
    if (activity.running) { activity.elapsed += Date.now() - activity.started; activity.running = false; clearInterval(activityTimer); activityTimer = null; $('#timer-toggle').textContent = '继续练习'; }
    else { activity.running = true; activity.started = Date.now(); $('#timer-toggle').textContent = '暂停一下'; activityTimer = setInterval(updateTimer, 250); }
    updateTimer();
  }
  function openActivity(kind, autoPlay = false) {
    cleanupActivity();
    activity = { kind, elapsed: 0, running: false, started: 0, duration: kind === 'walk' ? 300 : 60, demo, entryId: data().length ? [...data()].sort((a,b) => new Date(b.date) - new Date(a.date))[0].id : null };
    $('#activity-title').textContent = activityNames[kind];
    $('#activity-dialog').classList.toggle('noise-dialog', kind === 'noise');
    $('#activity-eyebrow').textContent = demo ? '示例体验 · 不影响个人记录' : '把这一小段时间，留给自己';
    $('#activity-feedback').hidden = true; $('#activity-content').hidden = false; $('#activity-controls').hidden = false;
    const content = $('#activity-content'), controls = $('#activity-controls'); content.replaceChildren(); controls.replaceChildren();
    $('#activity-description').textContent = { breathe: '不用刻意深呼吸，以舒服的节奏，轻轻吸气、慢慢呼气。', noise: '选一种自然的声音，陪自己慢下来。', walk: '不用走很远，也不用计步。只是一段属于自己的小休息。' }[kind];
    $('#activity-note').textContent = kind === 'breathe' ? '感到不适时，请停下来，恢复自然呼吸。' : kind === 'noise' ? '关闭窗口后，声音会停止。' : '留意周围环境，以身体舒服为准。计时暂停后可以随时继续。';
    if (kind === 'breathe') { const orb = el('div', 'breathing-orb', '准备好了'); orb.id = 'breathing-orb'; content.append(orb); }
    if (kind === 'walk') {
      const steps = el('ol', 'walk-steps'); ['起身舒展一下，找一段安全、方便行走的路。', '放慢脚步，看看身边三样不同颜色的事物。', '把注意力放在脚步上，不急着想下一件事。'].forEach(text => steps.append(el('li', '', text))); content.append(steps);
    }
    if (kind === 'noise') {
      care.openSound({ content, controls, finish: finishActivity });
    } else {
      const timer = el('p', 'timer-readout', clockText(activity.duration)); timer.id = 'timer-readout'; timer.setAttribute('aria-label', '剩余时间'); content.append(timer);
      const toggle = control('开始练习', 'primary', toggleTimer); toggle.id = 'timer-toggle'; controls.append(toggle, control('结束并记录感受', 'outline', finishActivity));
    }
    $('#activity-dialog').showModal();
    if (kind === 'noise' && autoPlay) care.playSound();
  }
  function finishActivity() {
    if (!activity) return;
    cleanupActivity(); activity.running = false;
    $('#activity-content').hidden = true; $('#activity-controls').hidden = true; $('#activity-feedback').hidden = false;
    $('#activity-description').textContent = '谢谢你，愿意为自己留出这一小段时间。';
    $('#activity-note').textContent = '不需要立刻好起来，愿意照顾自己就已经很好。';
  }
  function saveFeedback(feedback) {
    if (!activity) return;
    const item = { kind: activity.kind, ...(activity.kind === 'noise' ? { sound: care.selectedSound() } : {}), date: new Date().toISOString(), feedback, entryId: activity.entryId };
    const next = [...(activity.demo ? demoCare : careLogs), item];
    if (!activity.demo && !persist(CARE_KEY, next)) { toast('反馈未能保存，请先检查浏览器存储。'); return; }
    if (activity.demo) demoCare = next; else careLogs = next;
    $('#activity-dialog').close(); renderCareHistory();
    toast(feedback === '更难受了' ? '谢谢你如实记录。可以先停下来，找信任的人陪一会儿。' : '这段照顾自己的时光，已经记下了。');
  }

  buildForm(); setForm();
  $('#mood-form').addEventListener('submit', saveEntry);
  $('#cancel-edit').addEventListener('click', () => { editingId = null; setForm(); toast('已取消编辑，原记录没有改变。'); });
  $('#demo-toggle').addEventListener('click', toggleDemo); $('#demo-exit').addEventListener('click', toggleDemo);
  $$('[data-goto]').forEach(button => button.addEventListener('click', () => goto(button.dataset.goto)));
  window.addEventListener('hashchange', () => changePage(location.hash.slice(1)));
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView(); });
  let resizeTimeout; window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(renderData, 100); });
  $$('[data-activity]').forEach(button => button.addEventListener('click', () => openActivity(button.dataset.activity)));
  $('#close-activity').addEventListener('click', () => $('#activity-dialog').close());
  $('#activity-dialog').addEventListener('close', () => { if ($('#activity-dialog').open) return; cleanupActivity(); activity = null; });
  $$('[data-feedback]').forEach(button => button.addEventListener('click', () => saveFeedback(button.dataset.feedback)));
  $('#skip-feedback').addEventListener('click', () => saveFeedback('未填写'));
  $('#cancel-delete').addEventListener('click', () => $('#confirm-dialog').close());
  $('#privacy-button').addEventListener('click', () => $('#privacy-dialog').showModal());
  ['#close-privacy', '#privacy-understood'].forEach(selector => $(selector).addEventListener('click', () => $('#privacy-dialog').close()));
  window.addEventListener('pagehide', cleanupActivity);
  album = window.AlbumUI.create({ data, isDemo: () => demo, ready: () => readyPromise, save: saveRecord, remove: removeRecord, refresh: refreshRecords, goto, toast });
  readyPromise = window.JournalStore.init().then(saved => { entries = saved; storageReady = true; renderData(); }).catch(error => { warning(`图文存储暂不可用：${error.message} 旧记录仍可查看，请勿清除浏览器数据。`); });
  if (window.Capacitor?.isNativePlatform()) {
    window.Capacitor.registerPlugin('App').addListener('backButton', () => {
      const dialog = document.querySelector('dialog[open]');
      if (dialog) { dialog.close(); return; }
      if (page === 'write' || page.startsWith('edit/')) { $('#editor-cancel').click(); return; }
      if (page.startsWith('entry/')) { goto('album'); return; }
      if (page !== 'today') { goto('today'); return; }
      window.Capacitor.registerPlugin('App').minimizeApp();
    }).catch(() => {});
  }
  changePage(location.hash.slice(1));
})();
