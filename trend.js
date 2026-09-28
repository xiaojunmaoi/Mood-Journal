(() => {
  'use strict';
  const J = window.Journal;
  const $ = selector => document.querySelector(selector);
  const createNode = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const formatRange = range => `${range.start.replaceAll('-', '.')} — ${(range.start.slice(0, 4) === range.end.slice(0, 4) ? range.end.slice(5) : range.end).replaceAll('-', '.')}`;
  const rangeName = range => range.preset === 'custom' ? '自定义' : `近${range.preset}天`;

  function create(api) {
    const storageKey = 'xinqing.trend-range.v1';
    let selection = { preset: '7' }, range, stats, returnFocus, frame;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved) { J.dateRange(saved); selection = saved; }
    } catch { /* A missing or invalid display preference never blocks reading a diary. */ }
    const dialog = $('#range-dialog');
    const views = [...document.querySelectorAll('[data-trend]')].map(root => ({
      root, menu: root.querySelector('.trend-filter'), canvas: root.querySelector('canvas'),
      tooltip: root.querySelector('.chart-tooltip'), announcement: root.querySelector('.chart-announcement'),
      selected: null, geometry: null, days: new Map()
    }));

    function closeMenus(except) {
      let closed = false;
      for (const view of views) if (view.menu !== except && view.menu.open) { view.menu.open = false; closed = true; }
      return closed;
    }
    function apply(next) {
      J.dateRange(next);
      selection = { ...next };
      try { localStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Session selection still works when persistence is unavailable. */ }
      for (const view of views) { view.selected = null; view.tooltip.hidden = true; view.announcement.textContent = ''; }
      closeMenus(); render();
    }
    function positionDialog() {
      if (!dialog.open || innerWidth <= 640 || !returnFocus) return;
      const anchor = returnFocus.getBoundingClientRect(), box = dialog.getBoundingClientRect();
      dialog.style.left = `${Math.max(16, Math.min(anchor.right - box.width, innerWidth - box.width - 16))}px`;
      dialog.style.top = `${Math.max(16, Math.min(anchor.bottom + 10, innerHeight - box.height - 16))}px`;
    }
    function openCustom(view) {
      returnFocus = view.menu.querySelector('summary');
      closeMenus();
      const current = J.dateRange(selection);
      $('#range-start').value = current.start; $('#range-end').value = current.end;
      $('#range-start').max = $('#range-end').max = J.dayKey(new Date());
      $('#range-error').hidden = true;
      dialog.showModal(); positionDialog();
    }
    $('#range-form').addEventListener('submit', event => {
      event.preventDefault();
      try {
        apply({ preset: 'custom', start: $('#range-start').value, end: $('#range-end').value });
        dialog.close();
      } catch (error) {
        $('#range-error').textContent = error.message; $('#range-error').hidden = false;
        positionDialog();
      }
    });
    ['#range-cancel', '#range-close'].forEach(id => $(id).addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => { if (!dialog.open) returnFocus?.focus({ preventScroll: true }); });
    window.addEventListener('resize', () => { views.forEach(view => { view.tooltip.hidden = true; }); positionDialog(); });
    document.addEventListener('click', event => {
      for (const view of views) if (!view.menu.contains(event.target)) view.menu.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || dialog.open) return;
      const active = views.find(view => view.menu.open);
      if (active) { event.preventDefault(); closeMenus(); active.menu.querySelector('summary').focus(); }
    });
    for (const view of views) {
      view.menu.addEventListener('toggle', () => {
        view.menu.querySelector('summary').setAttribute('aria-expanded', String(view.menu.open));
        if (view.menu.open) closeMenus(view.menu);
      });
      view.root.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.range === 'custom') openCustom(view);
        else { apply({ preset: button.dataset.range }); view.menu.querySelector('summary').focus({ preventScroll: true }); }
      }));
      view.root.querySelector('.change-range').addEventListener('click', event => {
        event.stopPropagation(); view.menu.open = true; view.menu.querySelector('summary').focus();
      });
      view.canvas.addEventListener('pointermove', event => {
        if (event.pointerType === 'mouse' && !view.selected) inspectPoint(view, event, false);
      });
      view.canvas.addEventListener('pointerleave', () => { if (!view.selected) view.tooltip.hidden = true; });
      view.canvas.addEventListener('click', event => inspectPoint(view, event, true));
      view.canvas.addEventListener('keydown', event => {
        if (event.key === 'Escape') { view.selected = null; view.tooltip.hidden = true; return; }
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !stats.days.length) return;
        event.preventDefault();
        const index = stats.days.findIndex(day => day.key === view.selected);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? stats.days.length - 1 : index < 0 ? (event.key === 'ArrowLeft' ? stats.days.length - 1 : 0) : Math.max(0, Math.min(stats.days.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)));
        showPoint(view, stats.days[next].key, true);
      });
    }

    function inspectPoint(view, event, pin) {
      if (!view.geometry || !stats.days.length) return;
      const box = view.canvas.getBoundingClientRect(), { left, plotWidth } = view.geometry;
      const x = event.clientX - box.left;
      if (x < left - 8 || x > left + plotWidth + 8) return;
      const offset = Math.max(0, Math.min(range.length - 1, Math.round((x - left) / plotWidth * (range.length - 1))));
      showPoint(view, J.shiftDay(range.start, offset), pin);
    }
    function showPoint(view, key, announce) {
      if (!view.geometry) return;
      if (announce) view.selected = key;
      const day = view.days.get(key), { left, plotWidth, width } = view.geometry;
      const x = range.length === 1 ? left + plotWidth / 2 : left + (J.dayNumber(key) - J.dayNumber(range.start)) / (range.length - 1) * plotWidth;
      const copy = day ? `${Number.isInteger(day.value) ? J.moods[day.value - 1] + ' · ' : ''}均值 ${day.value.toFixed(1)} / 5 · ${day.count}条记录` : '这一天没有填写心情的记录';
      view.tooltip.replaceChildren(createNode('strong', '', key.replaceAll('-', '.')), createNode('span', '', copy));
      view.tooltip.hidden = false;
      const half = view.tooltip.offsetWidth / 2;
      view.tooltip.style.left = `${Math.max(half + 4, Math.min(x, width - half - 4))}px`;
      if (announce) view.announcement.textContent = `${key}，${copy}`;
    }
    function draw(view) {
      const canvas = view.canvas, width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
      const left = 46, right = 19, top = 17, bottom = 30, plotWidth = width - left - right;
      const px = key => range.length === 1 ? left + plotWidth / 2 : left + (J.dayNumber(key) - J.dayNumber(range.start)) / (range.length - 1) * plotWidth;
      const py = value => top + (5 - value) / 4 * (height - top - bottom);
      view.geometry = { width, left, plotWidth };
      view.days = new Map(stats.days.map(day => [day.key, day]));
      ctx.font = '11px "Microsoft YaHei", sans-serif'; ctx.textBaseline = 'middle';
      for (const value of [1, 3, 5]) {
        const y = py(value); ctx.strokeStyle = stats.days.length ? '#ded5c88c' : '#ded5c844'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
        ctx.fillStyle = '#8b7d6b'; ctx.textAlign = 'right'; ctx.fillText(J.moods[value - 1], left - 8, y);
      }
      const count = Math.min(range.length, width < 400 ? 5 : 7);
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : Math.round(i * (range.length - 1) / (count - 1));
        const key = J.shiftDay(range.start, offset), x = px(key);
        ctx.strokeStyle = '#e4dbcf55'; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, height - bottom); ctx.stroke();
        ctx.fillStyle = key === J.dayKey(new Date()) ? '#b9654b' : '#8b7d6b'; ctx.textAlign = 'center';
        ctx.fillText(`${Number(key.slice(5, 7))}/${Number(key.slice(8))}`, x, height - 10);
      }
      ctx.strokeStyle = '#b9654b'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.beginPath();
      let previous;
      for (const day of stats.days) {
        if (previous && J.dayNumber(day.key) - J.dayNumber(previous.key) === 1) ctx.lineTo(px(day.key), py(day.value));
        else ctx.moveTo(px(day.key), py(day.value));
        previous = day;
      }
      ctx.stroke(); ctx.fillStyle = '#b9654b';
      for (const day of stats.days) { ctx.beginPath(); ctx.arc(px(day.key), py(day.value), range.length > 90 ? 2.5 : 3.8, 0, Math.PI * 2); ctx.fill(); }
      const summary = stats.days.length <= 31 ? stats.days.map(d => `${d.key}：${d.value.toFixed(1)}分，${d.count}条`).join('；') : `共${stats.days.length}天有心情记录`;
      canvas.setAttribute('aria-label', `${formatRange(range)}心情轨迹；${stats.totalCount}条心情记录。${summary}。左右方向键查看有记录的日期。`);
      if (view.selected) showPoint(view, view.selected, false);
    }
    function render() {
      try { range = J.dateRange(selection); } catch { selection = { preset: '7' }; range = J.dateRange(selection); }
      stats = J.rangeStats(api.data(), range);
      for (const view of views) {
        view.root.querySelector('.range-name').textContent = rangeName(range);
        view.root.querySelector('.range-dates').textContent = formatRange(range);
        view.root.querySelector('.data-label').textContent = api.isDemo() ? '示例数据' : '我的记录';
        view.root.querySelectorAll('[data-range]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.range === range.preset)));
        view.root.querySelector('.chart-empty').hidden = Boolean(stats.days.length);
      }
      const container = $('#trigger-bars'); container.replaceChildren();
      for (const { tag, count } of stats.triggers) {
        const row = createNode('div', 'trigger-row'), track = createNode('span', 'trigger-track'), fill = createNode('span');
        fill.style.width = `${count / stats.triggers[0].count * 100}%`; track.append(fill);
        row.append(createNode('span', '', tag), track, createNode('span', '', `${count}次`)); container.append(row);
      }
      $('#trigger-range-caption').textContent = `${range.preset === 'custom' ? formatRange(range) : rangeName(range)}，低落记录中出现的影响因素`;
      $('#trigger-insight').textContent = stats.triggers.length ? `这段时间的 ${stats.lowCount} 条低落记录中，有 ${stats.triggers[0].count} 条提到了“${stats.triggers[0].tag}”。回看这些片刻，或许能发现相似的情境。` : stats.lowCount ? '有些感受还没有找到原因，也没有关系。下次记录时，可以试着选一个影响因素。' : '这段时间还没有可整理的低落记录。按自己的节奏，慢慢记下就好。';
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => views.forEach(draw));
    }
    return { render, closeMenus };
  }
  window.TrendUI = { create };
})();
