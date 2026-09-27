/* Records, photo Blobs and drafts commit in IndexedDB transactions. Legacy data is kept intact. */
(() => {
  'use strict';
  let database;
  const DB = 'xinqing-journal', LEGACY = 'xinqing.entries.v1';
  function transaction(stores, mode, work) {
    return new Promise((resolve, reject) => {
      let tx, result;
      try {
        tx = database.transaction(stores, mode);
        const request = work(tx);
        if (request) request.onsuccess = () => { result = request.result; };
        tx.oncomplete = () => resolve(result);
        tx.onabort = tx.onerror = () => reject(tx.error || new Error('本机存储未能完成，请保留当前内容并重试。'));
      } catch (error) { if (tx) tx.abort(); reject(error); }
    });
  }
  async function init() {
    database = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('entries', { keyPath: 'id' });
        request.result.createObjectStore('drafts');
        request.result.createObjectStore('meta');
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('请关闭其他打开的心晴页面后重试。'));
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    });
    const migrated = await transaction(['meta'], 'readonly', tx => tx.objectStore('meta').get('legacy-migrated'));
    if (!migrated) {
      const raw = localStorage.getItem(LEGACY), parsed = Journal.parseEntries(raw);
      await transaction(['entries', 'meta'], 'readwrite', tx => {
        for (const entry of parsed.entries) tx.objectStore('entries').put(entry);
        tx.objectStore('meta').put(true, 'legacy-migrated');
        if (raw) tx.objectStore('meta').put(raw, 'legacy-original');
        if (parsed.error) tx.objectStore('meta').put(true, 'legacy-warning');
      });
    }
    return list();
  }
  const list = () => transaction(['entries'], 'readonly', tx => tx.objectStore('entries').getAll());
  function save(entry, draftKey) {
    return transaction(['entries', 'drafts'], 'readwrite', tx => {
      tx.objectStore('entries').put(entry);
      if (draftKey) tx.objectStore('drafts').delete(draftKey);
    });
  }
  const remove = id => transaction(['entries', 'drafts'], 'readwrite', tx => { tx.objectStore('entries').delete(id); tx.objectStore('drafts').delete(`edit:${id}`); });
  const getDraft = key => transaction(['drafts'], 'readonly', tx => tx.objectStore('drafts').get(key));
  const saveDraft = (key, value) => transaction(['drafts'], 'readwrite', tx => tx.objectStore('drafts').put(value, key));
  const deleteDraft = key => transaction(['drafts'], 'readwrite', tx => tx.objectStore('drafts').delete(key));
  const dataURL = blob => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error('照片读取失败。')); r.readAsDataURL(blob); });
  async function exportData(entries) {
    const records = [];
    for (const entry of entries) {
      const photos = [];
      for (const photo of entry.photos || []) {
        if (!(photo.blob instanceof Blob)) throw new Error('有照片未能读取，备份已停止，请先检查这篇日记。');
        const { blob, src, ...meta } = photo;
        photos.push({ ...meta, data: await dataURL(blob) });
      }
      records.push({ ...entry, photos });
    }
    return { format: 'xinqing-photo-journal', version: 1, exportedAt: new Date().toISOString(), entries: records };
  }
  async function readBackup(file) {
    if (file.size > 100 * 1024 * 1024) throw new Error('本版仅支持 100 MB 以内的图文备份文件。');
    const bundle = JSON.parse(await file.text());
    if (bundle.format !== 'xinqing-photo-journal' || bundle.version !== 1 || !Array.isArray(bundle.entries) || bundle.entries.length > 10000) throw new Error('这不是可识别的心晴图文备份。');
    const ids = new Set(), records = [];
    for (const raw of bundle.entries) {
      if (!raw || typeof raw.id !== 'string' || !raw.id || raw.id.length > 200 || ids.has(raw.id) || typeof raw.note !== 'string' || !Array.isArray(raw.tags) || !Array.isArray(raw.photos) || raw.photos.length > 9 || !Number.isFinite(Date.parse(raw.date))) throw new Error('备份记录格式不完整，尚未导入任何内容。');
      ids.add(raw.id);
      const photos = [];
      for (const photo of raw.photos) {
        if (!photo || typeof photo.data !== 'string' || photo.data.length > 15 * 1024 * 1024 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data)) throw new Error('备份中的照片格式不受支持。');
        const [header, content] = photo.data.split(','), decoded = atob(content);
        const blob = new Blob([Uint8Array.from(decoded, c => c.charCodeAt(0))], { type: header.slice(5, header.indexOf(';')) });
        const bitmap = await createImageBitmap(blob);
        if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 50000000) { bitmap.close(); throw new Error('备份中的照片尺寸异常。'); }
        photos.push({ id: crypto.randomUUID(), blob, name: String(photo.name || '照片').slice(0, 200), width: bitmap.width, height: bitmap.height });
        bitmap.close();
      }
      const record = Journal.createEntry({ id: raw.id, title: raw.title, mood: raw.mood, note: raw.note, tags: raw.tags, day: raw.day, date: raw.date, updatedAt: raw.updatedAt, photos });
      if (record.day > Journal.dayKey(new Date())) throw new Error('备份中包含未来日期，请检查后再导入。');
      records.push(record);
    }
    return records;
  }
  function importRecords(records) {
    let added = 0, skipped = 0;
    return transaction(['entries'], 'readwrite', tx => {
      const store = tx.objectStore('entries');
      records.forEach(entry => {
        const request = store.get(entry.id);
        request.onsuccess = () => { if (request.result) skipped++; else { store.add(entry); added++; } };
      });
    }).then(() => ({ added, skipped }));
  }
  window.JournalStore = { init, list, save, remove, getDraft, saveDraft, deleteDraft, exportData, readBackup, importRecords };
})();