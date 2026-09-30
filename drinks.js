(() => {
  'use strict';
  const Store = window.DrinkStore, $ = selector => document.querySelector(selector);
  const tasteOptions = ['清爽', '酸甜', '微甜', '微苦', '果香', '柑橘', '花香', '茶香', '草本', '醇厚', '辛香', '气泡'];
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const icon = name => { const n = el('img', 'icon'); n.src = 'assets/icons/' + name + '.svg'; n.alt = ''; return n; };
  const button = (text, cls, action) => { const n = el('button', cls, text); n.type = 'button'; n.addEventListener('click', action); return n; };
  function examples() {
    const createdAt = new Date().toISOString();
    return [
      { id: 'example-lime', name: '青柠金汤力', illustration: 'lime', tags: '清爽、柑橘', alcohol: 'yes', ingredients: '金酒 30 ml\n汤力水 120 ml\n青柠 2 片\n冰块 适量', steps: '杯中装入冰块，加入金酒。\n倒入汤力水，轻轻搅拌。\n放入青柠片，按口味调整。', note: '示例配方，可以按自己的喜好另存一份。' },
      { id: 'example-orange', name: '橙香威士忌酸', illustration: 'orange', tags: '酸甜、果香', alcohol: 'yes', ingredients: '威士忌 30 ml\n柠檬汁 15 ml\n橙汁 15 ml\n糖浆 10 ml\n冰块 适量', steps: '材料加冰摇匀，过滤后倒入杯中。\n用一小片橙皮装饰。', note: '这是一份示例调配记录，酸甜可按自己的口味调整。' },
      { id: 'example-tea', name: '桂花乌龙气泡', illustration: 'tea', tags: '茶香、清爽', alcohol: 'no', ingredients: '冷乌龙茶 100 ml\n气泡水 100 ml\n桂花蜜 适量\n冰块 适量', steps: '茶汤放凉，加入冰块与桂花蜜。\n沿杯壁倒入气泡水，轻轻搅匀。', note: '桂花香里，留一点乌龙的回甘。' }
    ].map(x => Store.record({ ...x, createdAt, kind: 'recipe' }));
  }
  function create(api) {
    let personal = [], demoRecords = examples(), active = '', mode = api.isDemo(), filter = 'all', currentId, editor = null, editingId = null;
    let readyError = '', routeVersion = 0, dirty = false, revision = 0, draftTimer, draftChain = Promise.resolve(), processing = false, saving = false, cropDraft, drag, pendingImport;
    let listScroll = 0, restoreScroll = false, selectedTastes = [], editorTastes = [];
    const urls = new Map(), demoDrafts = new Map();
    const ready = Store.init().then(async () => { personal = await Store.list(); }).catch(error => { readyError = error.message; });
    const data = () => api.isDemo() ? demoRecords : personal;
    const key = () => editingId ? 'edit:' + editingId : 'new';
    const isEditor = route => route === 'drink-write' || route.startsWith('drink-edit/');
    function photoURL(value) {
      if (!value.photo?.blob) return 'assets/drink-' + (value.illustration || 'tea') + '.webp';
      if (!urls.has(value.photo.blob)) urls.set(value.photo.blob, URL.createObjectURL(value.photo.blob));
      return urls.get(value.photo.blob);
    }
    function gc() {
      const blobs = new Set([...personal, ...demoRecords, ...(editor ? [editor] : [])].map(d => d.photo?.blob).filter(Boolean));
      for (const [blob, url] of urls) if (!blobs.has(blob)) { URL.revokeObjectURL(url); urls.delete(blob); }
    }
    function cover(value, cls = '', crop = value.crop, forceCrop = false) {
      const cropped = forceCrop || value.photoFit === 'crop';
      const wrapper = el('div', 'drink-cover' + (cls ? ' ' + cls : '') + (cropped ? ' is-cropped' : ' is-contained'));
      const img = el('img'); img.src = photoURL(value); img.alt = value.name || '饮品封面'; img.loading = 'lazy'; img.decoding = 'async';
      if (cropped) {
        const rect = Store.cropStyle(value.photo, crop);
        for (const name of ['width', 'height', 'left', 'top']) img.style[name] = rect[name] + '%';
      }
      wrapper.append(img); return wrapper;
    }
    function tags(value) {
      const n = el('div', 'drink-tags');
      Store.tagList(value.tags).forEach(t => n.append(el('span', '', t)));
      if (value.alcohol !== 'unknown') n.append(el('span', 'drink-alcohol', value.alcohol === 'no' ? '无酒精' : '含酒精'));
      return n;
    }
    function renderList() {
      const grid = $('#drinks-grid'); grid.replaceChildren();
      $('#drinks-backup').hidden = api.isDemo();
      $('#drinks-status').textContent = readyError ? '本机酒单暂不可用：' + readyError : '';
      const values = data().filter(d => filter === 'all' || d.kind === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (!values.length) {
        const empty = el('div', 'drinks-empty'), image = el('img'); image.src = 'assets/drink-tea.webp'; image.alt = '';
        empty.append(image, el('h3', '', data().length ? '这个分类还没有收录' : '把喜欢的味道，收进自己的酒单。'), el('p', '', '一张照片，一份配方，或一句真心的推荐。'));
        const actions = el('div'); actions.append(button('收录第一杯', 'button primary', () => api.goto('drink-write')));
        if (!api.isDemo()) actions.append(button('看看示例酒单', 'text-button', api.toggleDemo));
        empty.append(actions); grid.append(empty);
      }
      for (const value of values) {
        const card = el('a', 'drink-card'); card.href = '#drink/' + encodeURIComponent(value.id); card.setAttribute('aria-label', '查看' + value.name);
        card.append(cover(value), el('h3', '', value.name), tags(value));
        const action = el('span', 'drink-cta', value.kind === 'recipe' ? '查看配方' : '查看推荐'); action.append(icon('arrow-right')); card.append(action);
        card.addEventListener('click', () => { listScroll = window.scrollY; }); grid.append(card);
      }
      gc();
    }
    function renderDetail() {
      const value = data().find(x => x.id === currentId);
      if (!value) { api.toast('这条酒单记录不存在或已删除。'); api.goto('drinks'); return; }
      $('#drink-detail-name').textContent = value.name;
      $('#drink-detail-kind').textContent = (value.kind === 'recipe' ? '可以自己调' : '好喝推荐') + (api.isDemo() ? ' · 示例' : '');
      $('#drink-detail-picture').replaceChildren(cover(value));
      $('#drink-detail-tags').replaceChildren(...tags(value).children);
      for (const [field, id] of [['ingredients', 'ingredients'], ['steps', 'steps'], ['note', 'note']]) {
        $('#drink-' + id + '-section').hidden = field !== 'note' && value.kind !== 'recipe';
        $('#drink-detail-' + id).textContent = value[field] || (field === 'note' ? '还没有补充，喜欢的细节可以慢慢记。' : '暂未填写，可以通过编辑补充。');
      }
      $('#drink-note-title').textContent = value.kind === 'recipe' ? '我的心得' : '推荐理由';
      $('#drink-detail-picture').onclick = () => { $('#drink-full-image').src = photoURL(value); $('#drink-full-image').alt = value.name; $('#drink-image-dialog').showModal(); };
      gc();
    }
    function readEditor() {
      if (!editor) return;
      for (const name of ['name', 'ingredients', 'steps', 'note', 'alcohol']) editor[name] = $('#drink-' + name).value;
      editor.tags = selectedTastes.join('、');
      editor.kind = document.querySelector('[name=drink-kind]:checked').value;
    }
    function paintTastes() {
      const group = $('#drink-tastes'); group.replaceChildren();
      for (const taste of editorTastes) {
        const choice = button(taste, 'drink-taste-choice', () => {
          const next = selectedTastes.includes(taste) ? selectedTastes.filter(t => t !== taste) : [...selectedTastes, taste];
          if (next.join('、').length > 100) { api.toast('口味标签有些多了，先取消几个再选择。'); return; }
          selectedTastes = next; paintTastes(); changed();
          [...group.children].find(b => b.dataset.taste === taste)?.focus({ preventScroll: true });
        });
        choice.dataset.taste = taste; choice.setAttribute('aria-pressed', String(selectedTastes.includes(taste))); group.append(choice);
      }
    }
    function setType() {
      const kind = document.querySelector('[name=drink-kind]:checked').value;
      $('#drink-recipe-fields').hidden = kind !== 'recipe';
      $('#drink-note-label').replaceChildren(document.createTextNode(kind === 'recipe' ? '我的心得 ' : '推荐理由 '), el('span', '', '选填'));
    }
    function changed() {
      if (!editor) return;
      readEditor(); dirty = true; revision++; clearTimeout(draftTimer);
      $('#drink-editor-error').hidden = true; $('#drink-discard').hidden = false;
      $('#drink-draft-status').textContent = api.isDemo() ? '示例草稿' : '正在保存草稿…';
      if (!processing) draftTimer = setTimeout(() => flushDraft().catch(() => {}), 500);
    }
    async function flushDraft() {
      clearTimeout(draftTimer);
      if (!editor || !dirty || processing) return draftChain;
      readEditor();
      const snapshot = structuredClone(editor), version = revision, draftKey = key(), demo = api.isDemo();
      draftChain = draftChain.catch(() => {}).then(async () => {
        if (demo) demoDrafts.set(draftKey, snapshot); else await Store.setDraft(draftKey, snapshot);
        if (revision === version) { dirty = false; $('#drink-draft-status').textContent = demo ? '示例草稿' : '草稿已保存'; }
      }).catch(error => { $('#drink-draft-status').textContent = '草稿保存失败，请保留页面并重试。'; throw error; });
      return draftChain;
    }
    function paintCover() {
      const next = cover(editor); $('#drink-cover-preview').className = next.className; $('#drink-cover-preview').replaceChildren(...next.children);
      $('#drink-cover-state').textContent = editor.photo ? '已选择照片' : '默认插画';
      $('#drink-fit-full').setAttribute('aria-pressed', String(editor.photoFit !== 'crop'));
      $('#drink-crop').setAttribute('aria-pressed', String(editor.photoFit === 'crop'));
      $('#drink-fit-full').disabled = processing;
      $('#drink-crop').disabled = processing || !editor.photo;
      ['drink-upload', 'drink-camera', 'drink-default'].forEach(id => { $('#' + id).disabled = processing; });
    }
    async function openEditor(id) {
      const token = ++routeVersion; editingId = id || null;
      const value = id ? data().find(x => x.id === id) : null;
      if (id && !value) { api.goto('drinks'); return; }
      let draft;
      try { draft = api.isDemo() ? demoDrafts.get(key()) : await Store.getDraft(key()); }
      catch { /* A visible warning is retained until a successful save. */ }
      if (token !== routeVersion) return;
      editor = structuredClone(draft || value || { name: '', kind: 'recipe', tags: '', ingredients: '', steps: '', note: '', alcohol: 'unknown', photo: null, illustration: 'tea', crop: { x: 50, y: 50, zoom: 1 } });
      for (const field of ['name', 'ingredients', 'steps', 'note', 'alcohol']) $('#drink-' + field).value = editor[field];
      selectedTastes = Store.tagList(editor.tags); editorTastes = [...new Set([...tasteOptions, ...selectedTastes])]; paintTastes();
      document.querySelector('[name=drink-kind][value=' + editor.kind + ']').checked = true;
      dirty = false; revision++; setType(); paintCover();
      $('#drink-editor-title').textContent = id ? '编辑这一杯的味道' : '收录一杯喜欢的味道';
      $('#drink-draft-status').textContent = readyError || (draft ? (api.isDemo() ? '示例草稿' : '已恢复草稿') : '');
      $('#drink-editor-error').hidden = true; $('#drink-discard').hidden = !draft;
      $('#drink-save').disabled = Boolean(readyError && !api.isDemo()); $('#drink-save').textContent = '保存到酒单';
      gc();
    }
    function error(message) { $('#drink-editor-error').textContent = message; $('#drink-editor-error').hidden = false; }
    async function upload(file) {
      if (!file || !editor || processing || saving) return;
      processing = true; clearTimeout(draftTimer); paintCover(); $('#drink-save').disabled = true;
      $('#drink-photo-progress').hidden = false; $('#drink-photo-progress').textContent = '正在整理照片，可以继续填写内容…';
      try { const photo = await PhotoTools.normalize(file); editor.photo = photo; editor.photoFit = 'contain'; editor.crop = { x: 50, y: 50, zoom: 1 }; changed(); }
      catch (e) { error(e.message + ' 原封面已保留。'); }
      finally { processing = false; paintCover(); $('#drink-save').disabled = false; $('#drink-photo-progress').hidden = true; gc(); if (dirty) flushDraft().catch(() => {}); }
    }
    async function save(event) {
      event.preventDefault(); if (!editor || processing || saving) return;
      readEditor(); let value;
      try { value = Store.record({ ...editor, id: editingId || undefined }); } catch (e) { error(e.message); $('#drink-name').focus(); return; }
      saving = true; clearTimeout(draftTimer); $('#drink-save').disabled = true; $('#drink-save').textContent = '正在收好…';
      try {
        await draftChain.catch(() => {});
        if (api.isDemo()) { demoRecords = editingId ? demoRecords.map(x => x.id === editingId ? value : x) : [value, ...demoRecords]; demoDrafts.delete(key()); }
        else { await Store.save(value, key()); personal = await Store.list(); }
        dirty = false; editor = null; api.toast(api.isDemo() ? '已保存到示例酒单' : '这一杯的味道，已经收好了。'); api.goto('drink/' + encodeURIComponent(value.id));
      } catch (e) { error('未能保存：' + e.message + ' 当前内容已保留。'); }
      finally { saving = false; $('#drink-save').disabled = false; $('#drink-save').textContent = '保存到酒单'; }
    }
    function paintCrop() {
      const next = cover(editor, '', cropDraft, true); $('#drink-crop-stage').className = next.className; $('#drink-crop-stage').replaceChildren(...next.children);
      for (const name of ['x', 'y', 'zoom']) $('#drink-crop-' + name).value = cropDraft[name];
    }
    function beginCrop() { if (!editor?.photo || processing) return; cropDraft = { ...editor.crop }; paintCrop(); $('#drink-crop-dialog').showModal(); }
    async function beforeLeave(next) {
      if (!isEditor(active) || next === active) return true;
      if (processing || saving) { api.toast('照片正在处理或保存，请稍等片刻。'); return false; }
      try { await flushDraft(); return true; } catch { return window.confirm('酒单草稿未能保存。仍然离开可能丢失内容，确定离开吗？'); }
    }
    async function route(next) {
      await ready;
      if (next === active && mode === api.isDemo()) { render(); return; }
      const previous = active; mode = api.isDemo(); active = next;
      if (isEditor(next)) await openEditor(next.startsWith('drink-edit/') ? decodeURIComponent(next.slice(11)) : null);
      else {
        routeVersion++; editor = null;
        if (next === 'drinks') { renderList(); if (previous.startsWith('drink/')) { restoreScroll = true; requestAnimationFrame(() => { if (restoreScroll && active === 'drinks') window.scrollTo(0, listScroll); restoreScroll = false; }); } }
        if (next.startsWith('drink/')) { currentId = decodeURIComponent(next.slice(6)); renderDetail(); }
      }
    }
    function render() { if (active === 'drinks') renderList(); else if (active.startsWith('drink/')) renderDetail(); }
    document.querySelectorAll('[data-drink-filter]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.drinkFilter; document.querySelectorAll('[data-drink-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderList(); }));
    $('#drink-form').addEventListener('submit', save);
    $('#drink-form').addEventListener('input', event => { if (!event.target.matches('input[type=file]')) changed(); });
    document.querySelectorAll('[name=drink-kind]').forEach(radio => radio.addEventListener('change', () => { setType(); changed(); }));
    const cancel = () => api.goto(editingId ? 'drink/' + encodeURIComponent(editingId) : 'drinks');
    $('#drink-editor-back').addEventListener('click', cancel); $('#drink-editor-cancel').addEventListener('click', cancel);
    $('#drink-upload').addEventListener('click', () => $('#drink-photo-input').click());
    $('#drink-camera').addEventListener('click', () => $('#drink-camera-input').click());
    ['drink-photo-input', 'drink-camera-input'].forEach(id => $('#' + id).addEventListener('change', event => { const file = event.target.files[0]; event.target.value = ''; upload(file); }));
    $('#drink-default').addEventListener('click', () => { if (processing) return; editor.photo = null; editor.photoFit = 'contain'; editor.illustration = 'tea'; editor.crop = { x: 50, y: 50, zoom: 1 }; changed(); paintCover(); gc(); });
    $('#drink-crop').addEventListener('click', beginCrop);
    $('#drink-fit-full').addEventListener('click', () => { if (processing || !editor) return; editor.photoFit = 'contain'; changed(); paintCover(); });
    for (const name of ['x', 'y', 'zoom']) $('#drink-crop-' + name).addEventListener('input', event => { cropDraft[name] = Number(event.target.value); paintCrop(); });
    $('#drink-crop-reset').addEventListener('click', () => { cropDraft = { x: 50, y: 50, zoom: 1 }; paintCrop(); });
    $('#drink-crop-apply').addEventListener('click', () => { editor.crop = { ...cropDraft }; editor.photoFit = 'crop'; changed(); paintCover(); $('#drink-crop-dialog').close(); });
    const stage = $('#drink-crop-stage');
    stage.addEventListener('pointerdown', event => { drag = { x: event.clientX, y: event.clientY, crop: { ...cropDraft } }; stage.setPointerCapture(event.pointerId); });
    stage.addEventListener('pointermove', event => {
      if (!drag) return;
      const r = Store.cropStyle(editor.photo, drag.crop), box = stage.getBoundingClientRect();
      const dx = (r.width - 100) * box.width / 100, dy = (r.height - 100) * box.height / 100;
      cropDraft.x = dx > 0 ? Math.max(0, Math.min(100, drag.crop.x - (event.clientX - drag.x) / dx * 100)) : 50;
      cropDraft.y = dy > 0 ? Math.max(0, Math.min(100, drag.crop.y - (event.clientY - drag.y) / dy * 100)) : 50; paintCrop();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => stage.addEventListener(name, () => { drag = null; }));
    stage.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); const name = event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? 'x' : 'y'; cropDraft[name] = Math.max(0, Math.min(100, cropDraft[name] + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -5 : 5))); paintCrop(); });
    $('#drink-discard').addEventListener('click', async () => {
      if (processing || saving || !window.confirm('丢弃这份未保存的酒单草稿？已保存的内容不会改变。')) return;
      try { clearTimeout(draftTimer); await draftChain.catch(() => {}); if (api.isDemo()) demoDrafts.delete(key()); else await Store.clearDraft(key()); dirty = false; editor = null; cancel(); } catch (e) { error(e.message); }
    });
    $('#drink-detail-edit').addEventListener('click', () => api.goto('drink-edit/' + encodeURIComponent(currentId)));
    $('#drink-detail-delete').addEventListener('click', () => { $('#drink-delete-error').hidden = true; $('#drink-delete-dialog').showModal(); });
    $('#drink-delete-confirm').addEventListener('click', async () => {
      $('#drink-delete-confirm').disabled = true;
      try { if (api.isDemo()) demoRecords = demoRecords.filter(x => x.id !== currentId); else { await Store.remove(currentId); personal = await Store.list(); } $('#drink-delete-dialog').close(); api.goto('drinks'); api.toast('这条酒单记录已删除。'); }
      catch (e) { $('#drink-delete-error').textContent = e.message; $('#drink-delete-error').hidden = false; }
      finally { $('#drink-delete-confirm').disabled = false; }
    });
    $('#drink-image-dialog').addEventListener('close', () => $('#drink-full-image').removeAttribute('src'));
    $('#drinks-backup').addEventListener('click', () => { pendingImport = null; $('#drinks-import-confirm').hidden = true; $('#drinks-backup-status').textContent = ''; $('#drinks-backup-dialog').showModal(); });
    $('#drinks-export').addEventListener('click', async () => {
      $('#drinks-export').disabled = true; $('#drinks-backup-status').textContent = '正在收好酒单与照片…';
      try {
        const content = JSON.stringify(await Store.exportData()), filename = 'xinqing-drinks-' + Journal.dayKey(new Date()) + '.json';
        if (new Blob([content]).size > 100 * 1024 * 1024) throw new Error('当前备份超过 100 MB，原酒单未改变。');
        if (window.Capacitor?.isNativePlatform()) { const file = await Capacitor.registerPlugin('Filesystem').writeFile({ path: filename, directory: 'CACHE', data: content, encoding: 'utf8' }); await Capacitor.registerPlugin('Share').share({ title: '保存心晴酒单备份', url: file.uri, dialogTitle: '保存酒单备份文件' }); $('#drinks-backup-status').textContent = '已打开系统分享窗口，请确认备份文件已保存。'; }
        else { const url = URL.createObjectURL(new Blob([content], { type: 'application/json' })), a = el('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); $('#drinks-backup-status').textContent = '备份已生成，请查看下载位置。'; }
      } catch (e) { $('#drinks-backup-status').textContent = '备份未完成：' + e.message; }
      finally { $('#drinks-export').disabled = false; }
    });
    $('#drinks-import').addEventListener('click', () => $('#drinks-backup-input').click());
    $('#drinks-backup-input').addEventListener('change', async event => {
      const file = event.target.files[0]; event.target.value = ''; if (!file) return;
      pendingImport = null; $('#drinks-import-confirm').hidden = true; $('#drinks-import').disabled = true; $('#drinks-backup-status').textContent = '正在检查酒单备份…';
      try { const records = await Store.readBackup(file), ids = new Set((await Store.list()).map(x => x.id)), fresh = records.filter(x => !ids.has(x.id)); pendingImport = records; $('#drinks-backup-status').textContent = '将新增 ' + fresh.length + ' 杯，跳过 ' + (records.length - fresh.length) + ' 杯已有记录。'; $('#drinks-import-confirm').hidden = !fresh.length; }
      catch (e) { $('#drinks-backup-status').textContent = '无法导入：' + e.message; }
      finally { $('#drinks-import').disabled = false; }
    });
    $('#drinks-import-confirm').addEventListener('click', async () => {
      if (!pendingImport) return;
      $('#drinks-import-confirm').disabled = true;
      try { const result = await Store.importRecords(pendingImport); personal = await Store.list(); pendingImport = null; $('#drinks-import-confirm').hidden = true; $('#drinks-backup-status').textContent = '已新增 ' + result.added + ' 杯，跳过 ' + result.skipped + ' 杯已有记录。'; renderList(); }
      catch (e) { $('#drinks-backup-status').textContent = '导入未完成：' + e.message; }
      finally { $('#drinks-import-confirm').disabled = false; }
    });
    window.addEventListener('beforeunload', event => { if (dirty || processing || saving) { event.preventDefault(); event.returnValue = ''; } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && isEditor(active)) flushDraft().catch(() => {}); });
    return { route, render, beforeLeave, ready };
  }
  window.DrinksUI = { create };
})();
