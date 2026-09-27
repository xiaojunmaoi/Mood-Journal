(() => {
  'use strict';
  const J = window.Journal, Store = window.JournalStore;
  const $ = selector => document.querySelector(selector);
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const icon = name => { const img = el('img', 'icon'); img.src = `assets/icons/${name}.svg`; img.alt = ''; return img; };
  const button = (label, cls, click) => { const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', click); return b; };
  function face(mood) { const span = el('span', 'mood-face'); span.style.setProperty('--face-position', `${(mood - 1) * 25}%`); span.setAttribute('aria-hidden', 'true'); return span; }
  function moodLabel(mood) { const span = el('span', 'mini-mood'); if (mood) span.append(face(mood), document.createTextNode(J.moods[mood - 1])); return span; }
  const dateLabel = day => new Date(`${day}T12:00:00`).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' });
  function examples() {
    const files = ['lake', 'cafe', 'sunset'];
    const titles = ['山水之间，慢下来', '窗边的一杯咖啡', '晚霞替今天收尾'];
    const notes = ['今天沿着湖边走了很久。\n风从山那边吹来，连呼吸都轻了。\n\n拍下湖水、山和路边的小花，\n想记住这段不用赶路的时间。', '拐进一家小店，遇见了喜欢的光。\n一杯咖啡的时间，就这样慢慢过去。', '回家的路上抬头看了一眼。\n原来平凡的一天，也会有温柔的结尾。'];
    return files.map((file, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const photos = (i === 0 ? files : [file]).map((name, index) => ({ id: `demo-${i}-${index}`, src: `assets/journal-demo-${name}.webp`, name: titles[index] }));
      return J.createEntry({ id: `example-photo-${i}`, title: titles[i], note: notes[i], date: d.toISOString(), mood: i === 0 ? 5 : null, photos, tags: [] });
    });
  }
  function create(api) {
    let active = '', currentId = null, filter = 'all', editor = null, managing = false, processing = false, saving = false;
    let revision = 0, dirty = false, draftTimer, draftChain = Promise.resolve(), routeVersion = 0;
    let demoDrafts = new Map(), preview = [], previewIndex = 0, pendingImport = null;
    const urls = new Map();
    function photoURL(photo) {
      if (photo.blob instanceof Blob) {
        const found = urls.get(photo.id);
        if (found?.blob === photo.blob) return found.url;
        if (found) URL.revokeObjectURL(found.url);
        const url = URL.createObjectURL(photo.blob); urls.set(photo.id, { blob: photo.blob, url }); return url;
      }
      return /^assets\/journal-demo-(lake|cafe|sunset)\.webp$/.test(photo.src || '') ? photo.src : '';
    }
    function gcURLs() {
      const live = new Set([...api.data().flatMap(e => e.photos || []), ...(editor?.photos || []), ...preview].map(p => p.id));
      for (const [id, value] of urls) if (!live.has(id)) { URL.revokeObjectURL(value.url); urls.delete(id); }
    }
    function image(photo, className) {
      const img = el('img', className); img.src = photoURL(photo); img.alt = photo.name || '手帐照片'; img.loading = 'lazy';
      img.addEventListener('error', () => { img.alt = '照片暂时无法显示，请重新打开这篇日记。'; }); return img;
    }
    function renderAlbum() {
      const now = new Date(); $('#album-month').textContent = `${now.getFullYear()} · ${now.getMonth() + 1}月${api.isDemo() ? ' · 示例手帐' : ''}`;
      const all = J.sorted(api.data()).filter(entry => filter !== 'photos' || entry.photos?.length);
      const grid = $('#album-list'); grid.replaceChildren();
      $('#album-backup').hidden = api.isDemo();
      if (!all.length) {
        const empty = el('div', 'empty-state'); empty.append(icon('notebook'), el('h3', '', filter === 'photos' ? '还没有照片记录' : '有些日子，一张照片就能记住。'), el('p', '', '拍下生活，也留下一点当时的心情。'), button('记录第一个片刻', 'button outline', () => api.goto('write'))); grid.append(empty); return;
      }
      all.forEach(entry => {
        const link = el('a', `album-card${entry.photos?.length ? '' : ' text-entry'}`); link.href = `#entry/${encodeURIComponent(entry.id)}`;
        if (entry.photos?.length) { const cover = el('div', 'album-cover'); cover.append(image(entry.photos[0]), el('span', 'photo-badge', `${entry.photos.length}张`)); link.append(cover); }
        const text = el('div', 'album-card-copy'), meta = el('div', 'album-meta'); meta.append(el('time', '', dateLabel(J.entryDay(entry))));
        if (entry.mood) meta.append(moodLabel(entry.mood));
        text.append(meta, el('h2', '', entry.title || (entry.note ? entry.note.split('\n')[0].slice(0, 36) : '留住这一刻')));
        if (entry.note) text.append(el('p', 'album-excerpt', entry.note));
        link.append(text); grid.append(link);
      });
      gcURLs();
    }
    function showViewer(photos, index = 0) { preview = photos; previewIndex = index; paintViewer(); if (!$('#photo-viewer').open) $('#photo-viewer').showModal(); }
    function paintViewer() {
      const photo = preview[previewIndex]; if (!photo) return;
      $('#viewer-image').src = photoURL(photo); $('#viewer-image').alt = photo.name || `第 ${previewIndex + 1} 张日记照片`;
      $('#viewer-position').textContent = `${previewIndex + 1} / ${preview.length}`;
      $('#viewer-prev').disabled = previewIndex === 0; $('#viewer-next').disabled = previewIndex === preview.length - 1;
    }
    function stepViewer(step) { previewIndex = Math.max(0, Math.min(preview.length - 1, previewIndex + step)); paintViewer(); }
    function renderDetail() {
      const entry = api.data().find(x => x.id === currentId);
      if (!entry) { api.toast('这篇日记不存在或已被删除。'); api.goto('album'); return; }
      $('#detail-date').textContent = `${J.entryDay(entry).replaceAll('-', '.')} · ${dateLabel(J.entryDay(entry)).split('周')[1] ? `周${dateLabel(J.entryDay(entry)).split('周')[1]}` : ''}${api.isDemo() ? ' · 示例记录' : ''}`;
      $('#detail-title').textContent = entry.title || (entry.note ? entry.note.split('\n')[0].slice(0, 36) : '留住这一刻');
      $('#detail-note').textContent = entry.note; $('#detail-note').hidden = !entry.note;
      $('#detail-photos').replaceChildren();
      (entry.photos || []).forEach((photo, i) => { const b = button('', 'detail-photo', () => showViewer(entry.photos, i)); b.setAttribute('aria-label', `查看第 ${i + 1} 张照片`); b.append(image(photo)); $('#detail-photos').append(b); });
      $('#detail-mood').replaceChildren(moodLabel(entry.mood)); $('#detail-mood').hidden = !entry.mood;
      $('#detail-tags').replaceChildren(...entry.tags.map(t => el('span', '', t)));
      $('.entry-menu').open = false; gcURLs();
    }
    function draftKey() { return editor?.editingId ? `edit:${editor.editingId}` : 'new'; }
    function readEditor() {
      if (!editor) return;
      editor.title = $('#editor-title').value; editor.note = $('#editor-body').value; editor.day = $('#editor-date').value;
      editor.tags = [...document.querySelectorAll('#editor-tag-options input:checked')].map(x => x.value);
    }
    function hasContent() { return editor && (editor.title || editor.note || editor.photos.length || editor.mood || editor.editingId); }
    function setDraftStatus(text, failed = false) { $('#draft-status').textContent = text; $('#draft-status').classList.toggle('failed', failed); }
    function changed() {
      readEditor(); revision++; dirty = true; clearTimeout(draftTimer);
      $('#editor-count').textContent = `${editor.note.length} / 5000`; $('#editor-count').classList.toggle('over', editor.note.length > 5000);
      $('#editor-error').hidden = true; $('#discard-draft').hidden = false;
      setDraftStatus(api.isDemo() ? '示例草稿 · 不影响个人记录' : '正在保存草稿…');
      draftTimer = setTimeout(() => flushDraft().catch(() => {}), 450);
    }
    async function flushDraft() {
      clearTimeout(draftTimer);
      if (!editor || !dirty) return draftChain;
      readEditor();
      const snapshot = structuredClone(editor), key = draftKey(), version = revision, isDemo = api.isDemo();
      draftChain = draftChain.catch(() => {}).then(async () => {
        if (isDemo) { if (hasContent()) demoDrafts.set(key, snapshot); else demoDrafts.delete(key); }
        else if (snapshot.title || snapshot.note || snapshot.photos.length || snapshot.mood || snapshot.editingId) await Store.saveDraft(key, snapshot);
        else await Store.deleteDraft(key);
        if (version === revision) { dirty = false; setDraftStatus(isDemo ? '示例草稿 · 仅本次体验保留' : '草稿已保存到本机'); }
      }).catch(error => { setDraftStatus('草稿保存失败，请重试或先备份文字。', true); throw error; });
      return draftChain;
    }
    function syncMood() {
      $('#editor-mood-value').replaceChildren();
      if (editor.mood) $('#editor-mood-value').append(face(editor.mood), document.createTextNode(J.moods[editor.mood - 1]));
      else $('#editor-mood-value').textContent = '先不填写';
      document.querySelectorAll('#album-mood-options button').forEach((b, i) => b.setAttribute('aria-pressed', String(editor.mood === i + 1)));
    }
    function renderPhotos() {
      const grid = $('#editor-photos'); grid.replaceChildren(); $('#photo-count').textContent = `${editor.photos.length} / 9`;
      $('#manage-photos').textContent = managing ? '完成' : '管理'; $('#manage-photos').setAttribute('aria-pressed', String(managing)); $('#manage-photos').disabled = processing || !editor.photos.length;
      editor.photos.forEach((photo, i) => {
        const cell = el('div', 'editor-photo'), thumb = button('', 'photo-thumb', () => showViewer(editor.photos, i)); thumb.setAttribute('aria-label', `预览第 ${i + 1} 张照片`); thumb.append(image(photo)); cell.append(thumb);
        if (i === 0) cell.append(el('span', 'cover-label', '封面'));
        if (managing) {
          const actions = el('div', 'photo-edit-actions');
          const move = (step) => { const target = i + step; [editor.photos[i], editor.photos[target]] = [editor.photos[target], editor.photos[i]]; changed(); renderPhotos(); };
          const prev = button('', '', () => move(-1)); prev.append(icon('caret-left')); prev.setAttribute('aria-label', `将第 ${i + 1} 张照片前移`); prev.disabled = !i || processing;
          const next = button('', '', () => move(1)); next.append(icon('caret-right')); next.setAttribute('aria-label', `将第 ${i + 1} 张照片后移`); next.disabled = i === editor.photos.length - 1 || processing;
          const cover = button('封面', '', () => { editor.photos.unshift(...editor.photos.splice(i, 1)); changed(); renderPhotos(); }); cover.disabled = !i || processing;
          const remove = button('移除', '', () => { editor.photos.splice(i, 1); changed(); renderPhotos(); }); remove.disabled = processing;
          actions.append(prev, next, cover, remove); cell.append(actions);
        }
        grid.append(cell);
      });
      if (editor.photos.length < 9) { const add = button('', 'photo-add', () => $('#photo-input').click()); add.append(icon('plus'), el('span', '', '添加照片')); add.disabled = processing; grid.append(add); }
      $('#camera-photo').disabled = processing || editor.photos.length >= 9;
    }
    async function openEditor(id) {
      const token = ++routeVersion;
      await api.ready();
      if (token !== routeVersion) return;
      const original = id ? api.data().find(e => e.id === id) : null;
      if (id && !original) { api.goto('album'); return; }
      const key = id ? `edit:${id}` : 'new';
      let draft;
      try { draft = api.isDemo() ? demoDrafts.get(key) : await Store.getDraft(key); } catch { setDraftStatus('草稿暂不可用，请勿关闭尚未保存的内容。', true); }
      if (token !== routeVersion) return;
      editor = structuredClone(draft || { ...(original || {}), title: original?.title || '', note: original?.note || '', day: original ? J.entryDay(original) : J.dayKey(new Date()), photos: original?.photos || [], mood: original?.mood || null, tags: original?.tags || [], editingId: id || null });
      managing = false; dirty = false; revision++; $('#editor-heading').textContent = id ? '编辑日记' : '新建日记';
      $('#editor-title').value = editor.title; $('#editor-body').value = editor.note; $('#editor-date').value = editor.day; $('#editor-date').max = J.dayKey(new Date());
      $('#editor-count').textContent = `${editor.note.length} / 5000`; $('#editor-count').classList.toggle('over', editor.note.length > 5000);
      $('#editor-error').hidden = true; $('#photo-progress').hidden = true; $('#editor-save').disabled = false; $('#editor-save').textContent = '保存';
      $('#discard-draft').hidden = !draft;
      setDraftStatus(api.isDemo() ? '示例体验 · 不影响个人记录' : draft ? '已恢复本机草稿' : id ? '修改不会影响原记录，直到保存' : '开始记录一个片刻');
      document.querySelectorAll('#editor-tag-options input').forEach(input => { input.checked = editor.tags.includes(input.value); });
      syncMood(); renderPhotos(); gcURLs();
    }
    async function normalizePhoto(file) {
      if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} 超过 20 MB，请选择较小的照片。`);
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') throw new Error(`${file.name} 暂不支持，请选择 JPG、PNG 或 WebP 照片。`);
      let bitmap;
      try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { throw new Error(`${file.name} 无法解码，请转成 JPG、PNG 或 WebP 后重试。`); }
      try {
        if (bitmap.width * bitmap.height > 50000000) throw new Error(`${file.name} 尺寸过大，请先缩小后再添加。`);
        const ratio = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height)), canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .84));
        if (!blob) throw new Error('照片处理失败，请重试。');
        return { id: crypto.randomUUID(), blob, width: canvas.width, height: canvas.height, name: file.name.slice(0, 200) };
      } finally { bitmap.close(); }
    }
    async function addPhotos(files) {
      if (!files.length || processing || saving) return;
      if (files.length + editor.photos.length > 9) { showError(`还可以添加 ${9 - editor.photos.length} 张，请重新选择；已有照片保留。`); return; }
      processing = true; $('#editor-save').disabled = true; $('#photo-progress').hidden = false; renderPhotos();
      const failures = [];
      for (let i = 0; i < files.length; i++) {
        $('#photo-progress').textContent = `正在整理照片 ${i + 1} / ${files.length}…`;
        try { editor.photos.push(await normalizePhoto(files[i])); changed(); } catch (error) { failures.push(error.message); }
      }
      processing = false; $('#editor-save').disabled = false; $('#photo-progress').hidden = true; renderPhotos();
      try { await flushDraft(); } catch { failures.push('照片草稿尚未保存，请保留页面并重试。'); }
      if (failures.length) showError(failures.join('\n')); else api.toast('照片已添加，可以写下当时的感受。');
    }
    function showError(message) { $('#editor-error').textContent = message; $('#editor-error').hidden = false; }
    async function saveEditor(event) {
      event.preventDefault(); if (processing || saving || !editor) return;
      readEditor(); let entry;
      try { if (!J.validDay(editor.day) || editor.day > J.dayKey(new Date())) throw new Error('请选择今天或过去的有效日期。'); entry = J.createEntry({ ...editor, id: editor.editingId || undefined, date: editor.editingId ? editor.date : new Date().toISOString(), updatedAt: new Date().toISOString() }); } catch (error) { showError(error.message); return; }
      saving = true; $('#editor-save').disabled = true; $('#editor-save').textContent = '保存中';
      try {
        clearTimeout(draftTimer); await draftChain.catch(() => {});
        await api.save(entry, draftKey()); demoDrafts.delete(draftKey()); dirty = false; editor = null;
        api.toast(api.isDemo() ? '已保存到示例手帐' : '照片和文字，已经好好收下了。'); api.goto(`entry/${encodeURIComponent(entry.id)}`);
      } catch (error) { showError(`未能保存：${error.message} 当前内容已保留，请重试。`); }
      finally { saving = false; $('#editor-save').disabled = false; $('#editor-save').textContent = '保存'; }
    }
    async function beforeLeave(next) {
      if (!['write', 'edit'].includes(active.split('/')[0]) || next === active) return true;
      if (processing || saving) { api.toast('照片正在处理或保存，请稍等片刻。'); return false; }
      try { await flushDraft(); return true; } catch { return window.confirm('草稿未能保存。仍然离开会有丢失风险，确定离开吗？'); }
    }
    async function route(next) {
      if (next === active) { render(); return; }
      active = next;
      if (next === 'write' || next.startsWith('edit/')) await openEditor(next.startsWith('edit/') ? decodeURIComponent(next.slice(5)) : null);
      else { routeVersion++; if (next === 'album') renderAlbum(); if (next.startsWith('entry/')) { currentId = decodeURIComponent(next.slice(6)); renderDetail(); } }
    }
    function render() { if (active === 'album') renderAlbum(); else if (active.startsWith('entry/')) renderDetail(); }
    ['editor-title', 'editor-body', 'editor-date'].forEach(id => $(`#${id}`).addEventListener('input', changed));
    $('#album-form').addEventListener('submit', saveEditor);
    $('#editor-cancel').addEventListener('click', () => api.goto(editor?.editingId ? `entry/${encodeURIComponent(editor.editingId)}` : 'album'));
    $('#discard-draft').addEventListener('click', async () => {
      if (processing || saving || !window.confirm('丢弃这份未提交的草稿？已保存的日记不会改变。')) return;
      try { clearTimeout(draftTimer); await draftChain.catch(() => {}); const key = draftKey(); if (api.isDemo()) demoDrafts.delete(key); else await Store.deleteDraft(key); dirty = false; const id = editor.editingId; editor = null; api.goto(id ? `entry/${encodeURIComponent(id)}` : 'album'); } catch { showError('草稿未能删除，请重试。'); }
    });
    $('#manage-photos').addEventListener('click', () => { managing = !managing; renderPhotos(); });
    $('#photo-input').addEventListener('change', event => { const files = [...event.target.files]; event.target.value = ''; addPhotos(files); });
    $('#camera-input').addEventListener('change', event => { const files = [...event.target.files]; event.target.value = ''; addPhotos(files); });
    $('#camera-photo').addEventListener('click', () => $('#camera-input').click());
    $('#editor-mood').addEventListener('click', () => $('#album-mood-dialog').showModal());
    J.moods.forEach((label, i) => {
      const b = button('', '', () => { editor.mood = i + 1; syncMood(); changed(); $('#album-mood-dialog').close(); }); b.setAttribute('aria-label', label); b.setAttribute('aria-pressed', 'false'); b.append(face(i + 1), el('span', '', label)); $('#album-mood-options').append(b);
    });
    $('#clear-album-mood').addEventListener('click', () => { editor.mood = null; syncMood(); changed(); $('#album-mood-dialog').close(); });
    J.tags.forEach(tag => { const label = el('label', 'tag-chip'), input = el('input'); input.type = 'checkbox'; input.value = tag; input.addEventListener('change', changed); label.append(input, el('span', '', tag)); $('#editor-tag-options').append(label); });
    document.querySelectorAll('[data-album-filter]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.albumFilter; document.querySelectorAll('[data-album-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderAlbum(); }));
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(`#${b.dataset.close}`).close()));
    $('#viewer-prev').addEventListener('click', () => stepViewer(-1)); $('#viewer-next').addEventListener('click', () => stepViewer(1));
    $('#photo-viewer').addEventListener('keydown', event => { if (event.key === 'ArrowLeft') stepViewer(-1); if (event.key === 'ArrowRight') stepViewer(1); });
    let touchX = null;
    $('#viewer-image').addEventListener('touchstart', e => { touchX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    $('#viewer-image').addEventListener('touchend', e => { if (touchX !== null) { const delta = e.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 60) stepViewer(delta < 0 ? 1 : -1); } touchX = null; }, { passive: true });
    $('#photo-viewer').addEventListener('close', () => { preview = []; $('#viewer-image').removeAttribute('src'); gcURLs(); });
    $('#detail-edit').addEventListener('click', () => api.goto(`edit/${encodeURIComponent(currentId)}`));
    $('#detail-delete').addEventListener('click', () => { $('#album-delete-error').hidden = true; $('#album-delete-dialog').showModal(); });
    $('#album-delete-confirm').addEventListener('click', async () => {
      $('#album-delete-confirm').disabled = true;
      try { await api.remove(currentId); $('#album-delete-dialog').close(); api.goto('album'); api.toast('这篇日记已删除，相册原图不受影响。'); } catch { $('#album-delete-error').textContent = '删除未完成，原记录已保留，请重试。'; $('#album-delete-error').hidden = false; }
      finally { $('#album-delete-confirm').disabled = false; }
    });
    $('#album-backup').addEventListener('click', () => { $('#backup-status').textContent = ''; $('#confirm-import').hidden = true; pendingImport = null; $('#backup-dialog').showModal(); });
    $('#export-journal').addEventListener('click', async () => {
      $('#export-journal').disabled = true; $('#backup-status').textContent = '正在收好文字和照片，请稍候…';
      try {
        const content = JSON.stringify(await Store.exportData(await Store.list()));
        if (new Blob([content]).size > 100 * 1024 * 1024) throw new Error('本版图文备份上限为 100 MB，当前超出上限；原记录未改变。');
        const filename = `xinqing-journal-${J.dayKey(new Date())}.json`;
        if (window.Capacitor?.isNativePlatform()) {
          const fs = Capacitor.registerPlugin('Filesystem'), share = Capacitor.registerPlugin('Share');
          const file = await fs.writeFile({ path: filename, directory: 'CACHE', data: content, encoding: 'utf8' });
          await share.share({ title: '保存心晴图文备份', url: file.uri, dialogTitle: '将备份保存到文件或发送到电脑' });
          $('#backup-status').textContent = '已打开系统保存 / 分享窗口，请确认备份文件已保存。';
        } else {
          const url = URL.createObjectURL(new Blob([content], { type: 'application/json' })), a = el('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
          $('#backup-status').textContent = '备份文件已生成，请检查下载位置。';
        }
      } catch (error) { $('#backup-status').textContent = `备份未完成：${error.message}`; }
      finally { $('#export-journal').disabled = false; }
    });
    $('#import-journal').addEventListener('click', () => $('#backup-input').click());
    $('#backup-input').addEventListener('change', async event => {
      const file = event.target.files[0]; event.target.value = ''; if (!file) return;
      pendingImport = null; $('#confirm-import').hidden = true; $('#import-journal').disabled = true; $('#backup-status').textContent = '正在检查备份照片与记录…';
      try { const records = await Store.readBackup(file), ids = new Set((await Store.list()).map(e => e.id)), skipped = records.filter(e => ids.has(e.id)).length; pendingImport = records; $('#backup-status').textContent = `备份中有 ${records.length} 篇日记、${records.reduce((sum, e) => sum + e.photos.length, 0)} 张照片。\n将新增 ${records.length - skipped} 篇，跳过 ${skipped} 篇已有记录。`; $('#confirm-import').hidden = records.length === skipped; }
      catch (error) { $('#backup-status').textContent = `无法导入：${error.message}`; }
      finally { $('#import-journal').disabled = false; }
    });
    $('#confirm-import').addEventListener('click', async () => {
      if (!pendingImport) return;
      $('#confirm-import').disabled = true;
      try { const result = await Store.importRecords(pendingImport); await api.refresh(); pendingImport = null; $('#confirm-import').hidden = true; $('#backup-status').textContent = `已新增 ${result.added} 篇，跳过 ${result.skipped} 篇已有记录。`; }
      catch (error) { $('#backup-status').textContent = `导入失败，没有提交本次变更：${error.message}`; }
      finally { $('#confirm-import').disabled = false; }
    });
    window.addEventListener('beforeunload', event => { if (dirty || processing || saving) { event.preventDefault(); event.returnValue = ''; } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && editor) flushDraft().catch(() => {}); });
    return { route, render, beforeLeave, flushDraft };
  }
  window.AlbumUI = { create, examples };
})();