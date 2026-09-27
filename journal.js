(function (root) {
  'use strict';
  const tags = ['学业', '工作', '人际', '家庭', '睡眠', '身体', '其他'];
  const moods = ['很低落', '不太好', '一般', '还不错', '很开心'];
  function dayKey(value) {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function validDay(day) { if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false; const d = new Date(`${day}T12:00:00`); return Number.isFinite(d.getTime()) && dayKey(d) === day; }
  function entryDay(entry) { return entry.day || dayKey(entry.date); }
  function sorted(entries) { return [...entries].sort((a, b) => entryDay(b).localeCompare(entryDay(a)) || b.date.localeCompare(a.date)); }
  function createEntry(input) {
    const mood = input.mood === 0 || input.mood == null ? null : input.mood;
    if (mood !== null && (!Number.isInteger(mood) || mood < 1 || mood > 5)) throw new Error('请选择有效的心情。');
    const note = String(input.note || '').trim(), title = String(input.title || '').trim();
    const photos = Array.isArray(input.photos) ? input.photos : [];
    if (note.length > 5000) throw new Error('日记最多可以写 5,000 字，请稍作整理后保存。');
    if (title.length > 40) throw new Error('标题最多 40 字。');
    if (photos.length > 9) throw new Error('每篇日记最多放 9 张照片。');
    if (!mood && !note && !photos.length) throw new Error('选一个心情、写一句话，或添加一张照片再保存吧。');
    const date = input.date && Number.isFinite(Date.parse(input.date)) ? input.date : new Date().toISOString();
    const day = input.day || dayKey(date);
    if (!validDay(day)) throw new Error('请选择有效的记录日期。');
    return { id: input.id || (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`), mood, tags: [...new Set((Array.isArray(input.tags) ? input.tags : []).filter(t => tags.includes(t)))], note, title, photos, date, day, updatedAt: input.updatedAt || date };
  }
  function parseEntries(raw) {
    if (!raw) return { entries: [], error: false };
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return { entries: [], error: true };
      const valid = data.filter(e => e && typeof e.id === 'string' && Number.isInteger(e.mood) && e.mood >= 1 && e.mood <= 5 && typeof e.date === 'string' && Number.isFinite(Date.parse(e.date)) && typeof e.note === 'string' && Array.isArray(e.tags));
      return { entries: valid.map(createEntry), error: valid.length !== data.length };
    } catch { return { entries: [], error: true }; }
  }
  function weekly(entries, now = new Date()) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
      const key = dayKey(date);
      const values = entries.filter(e => entryDay(e) === key && Number.isInteger(e.mood) && e.mood >= 1 && e.mood <= 5);
      return { key, label: `${date.getMonth() + 1}/${date.getDate()}`, count: values.length, value: values.length ? values.reduce((sum, e) => sum + e.mood, 0) / values.length : null };
    });
  }
  function triggers(entries, now = new Date()) {
    const keys = new Set(weekly([], now).map(d => d.key));
    const counts = {};
    entries.filter(e => e.mood >= 1 && e.mood <= 2 && keys.has(entryDay(e))).forEach(e => [...new Set(e.tags)].filter(t => tags.includes(t)).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  }
  function examples(now = new Date()) {
    const notes = ['事情有一点多，先把今天最重要的一件做好。', '午后和朋友聊了聊天，轻松了一些。', '昨晚睡得晚，今天想早点休息。', '计划没能全部完成，允许自己慢一点。', '午休出去散步，看到了路边的小花。', '把拖了很久的事情做完了，松了一口气。', '今天的阳光很好，给自己留了一点时间。'];
    return [2, 3, 2, 2, 3, 3, 4].map((mood, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i, i === 6 ? 0 : 18);
      return { id: `example-${i}`, date: date.toISOString(), mood, tags: i === 2 ? ['睡眠'] : i === 1 ? ['人际'] : ['工作'], note: notes[i] };
    });
  }
  function recommend(entry) {
    if (entry.tags.includes('睡眠')) return 'rain';
    if (entry.tags.includes('工作') || entry.tags.includes('学业')) return 'walk';
    return entry.mood <= 2 ? 'breathe' : 'walk';
  }
  const api = { tags, moods, dayKey, validDay, entryDay, sorted, createEntry, parseEntries, weekly, triggers, examples, recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Journal = api;
})(typeof window !== 'undefined' ? window : globalThis);
