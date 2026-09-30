/* Separate collection: existing diaries and photos are never rewritten by the shop. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DrinkStore = api;
})(globalThis, () => {
  'use strict';
  let db, opening;
  const validAssets = ['lime', 'orange', 'tea'];
  const text = (value, max) => String(value ?? '').trim().slice(0, max);
  function record(input) {
    if (!input || typeof input !== 'object') throw new Error('酒单内容无法读取。');
    const name = text(input.name, 60);
    if (!name) throw new Error('先给这一杯起个名字吧。');
    const kind = input.kind === 'recommendation' ? 'recommendation' : 'recipe';
    const crop = input.crop || {};
    const bounded = (n, fallback, min, max) => Number.isFinite(Number(n)) ? Math.max(min, Math.min(max, Number(n))) : fallback;
    return {
      id: text(input.id, 160) || crypto.randomUUID(), name, kind,
      tags: text(input.tags, 100), ingredients: text(input.ingredients, 3000), steps: text(input.steps, 5000), note: text(input.note, 3000),
      alcohol: ['yes', 'no', 'unknown'].includes(input.alcohol) ? input.alcohol : 'unknown',
      photo: input.photo?.blob instanceof Blob ? input.photo : null,
      illustration: validAssets.includes(input.illustration) ? input.illustration : 'tea',
      crop: { x: bounded(crop.x, 50, 0, 100), y: bounded(crop.y, 50, 0, 100), zoom: bounded(crop.zoom, 1, 1, 3) },
      createdAt: Number.isFinite(Date.parse(input.createdAt)) ? input.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  // Percent coordinates keep the same non-destructive crop at every screen size.
  function cropStyle(photo, crop = {}) {
    const ratio = photo?.width > 0 && photo?.height > 0 ? photo.width / photo.height : 4 / 3;
    const zoom = Math.max(1, Math.min(3, Number(crop.zoom) || 1));
    const width = Math.max(1, ratio / (4 / 3)) * 100 * zoom;
    const height = Math.max(1, (4 / 3) / ratio) * 100 * zoom;
    const x = Math.max(0, Math.min(100, Number(crop.x ?? 50) || 0)), y = Math.max(0, Math.min(100, Number(crop.y ?? 50) || 0));
    return { width, height, left: (100 - width) * x / 100, top: (100 - height) * y / 100 };
  }
  function init() {
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      const req = indexedDB.open('xinqing-drinks', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('drinks', { keyPath: 'id' }); req.result.createObjectStore('drafts'); };
      req.onsuccess = () => { db = req.result; db.onversionchange = () => db.close(); resolve(); };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('请关闭其他心晴页面后重试。'));
    });
    return opening;
  }
  async function transaction(stores, mode, work) {
    await init();
    return new Promise((resolve, reject) => {
      let tx, value;
      try {
        tx = db.transaction(stores, mode);
        const req = work(tx);
        if (req) req.onsuccess = () => { value = req.result; };
        tx.oncomplete = () => resolve(value);
        tx.onabort = tx.onerror = () => reject(tx.error || new Error('本机酒单未能保存，请保留当前内容后重试。'));
      } catch (error) { tx?.abort(); reject(error); }
    });
  }
  const list = () => transaction(['drinks'], 'readonly', tx => tx.objectStore('drinks').getAll());
  const save = (value, key) => transaction(['drinks', 'drafts'], 'readwrite', tx => { tx.objectStore('drinks').put(record(value)); tx.objectStore('drafts').delete(key); });
  const remove = id => transaction(['drinks', 'drafts'], 'readwrite', tx => { tx.objectStore('drinks').delete(id); tx.objectStore('drafts').delete('edit:' + id); });
  const getDraft = key => transaction(['drafts'], 'readonly', tx => tx.objectStore('drafts').get(key));
  const setDraft = (key, value) => transaction(['drafts'], 'readwrite', tx => tx.objectStore('drafts').put(value, key));
  const clearDraft = key => transaction(['drafts'], 'readwrite', tx => tx.objectStore('drafts').delete(key));
  const dataURL = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('照片读取失败')); reader.readAsDataURL(blob); });
  async function exportData() {
    const drinks = [];
    for (const value of await list()) {
      const item = { ...value, photo: null };
      if (value.photo) { const { blob, ...meta } = value.photo; item.photo = { ...meta, data: await dataURL(blob) }; }
      drinks.push(item);
    }
    return { format: 'xinqing-drinks', version: 1, exportedAt: new Date().toISOString(), drinks };
  }
  async function readBackup(file) {
    if (file.size > 100 * 1024 * 1024) throw new Error('请选择 100 MB 以内的酒单备份。');
    const data = JSON.parse(await file.text());
    if (data.format !== 'xinqing-drinks' || data.version !== 1 || !Array.isArray(data.drinks) || data.drinks.length > 1000) throw new Error('这不是可识别的心晴酒单备份。');
    const ids = new Set(), records = [];
    for (const raw of data.drinks) {
      if (!raw || typeof raw.id !== 'string' || !raw.id || raw.id.length > 160 || ids.has(raw.id) || typeof raw.name !== 'string' || !raw.name.trim() || !['recipe', 'recommendation'].includes(raw.kind)) throw new Error('备份格式不完整，尚未导入任何内容。');
      ids.add(raw.id);
      let photo = null;
      if (raw.photo) {
        const content = raw.photo.data;
        if (typeof content !== 'string' || content.length > 12 * 1024 * 1024 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(content)) throw new Error('备份中的图片格式不受支持。');
        const [header, encoded] = content.split(','), bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: header.slice(5, header.indexOf(';')) });
        photo = await PhotoTools.normalize(new File([blob], text(raw.photo.name, 200) || '酒单照片', { type: blob.type }));
      }
      records.push(record({ ...raw, photo }));
    }
    return records;
  }
  function importRecords(records) {
    let added = 0, skipped = 0;
    return transaction(['drinks'], 'readwrite', tx => {
      const store = tx.objectStore('drinks');
      for (const item of records) { const req = store.get(item.id); req.onsuccess = () => { if (req.result) skipped++; else { store.add(item); added++; } }; }
    }).then(() => ({ added, skipped }));
  }
  return { record, cropStyle, init, list, save, remove, getDraft, setDraft, clearDraft, exportData, readBackup, importRecords };
});
