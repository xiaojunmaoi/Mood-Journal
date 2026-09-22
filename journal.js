(function (root) {
  'use strict';
  const tags = ['学业', '工作', '人际', '家庭', '睡眠', '身体', '其他'];
  const moods = ['很低落', '不太好', '一般', '还不错', '很开心'];
  function dayKey(value) {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function createEntry(input) {
    if (!Number.isInteger(input.mood) || input.mood < 1 || input.mood > 5) throw new Error('先选一个最接近此刻的心情吧。');
    return { id: input.id || (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`), mood: input.mood, tags: [...new Set((Array.isArray(input.tags) ? input.tags : []).filter(t => tags.includes(t)))], note: String(input.note || '').trim().slice(0, 500), date: input.date && Number.isFinite(Date.parse(input.date)) ? input.date : new Date().toISOString() };
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
      const values = entries.filter(e => dayKey(e.date) === key);
      return { key, label: `${date.getMonth() + 1}/${date.getDate()}`, count: values.length, value: values.length ? values.reduce((sum, e) => sum + e.mood, 0) / values.length : null };
    });
  }
  function triggers(entries, now = new Date()) {
    const keys = new Set(weekly([], now).map(d => d.key));
    const counts = {};
    entries.filter(e => e.mood <= 2 && keys.has(dayKey(e.date))).forEach(e => [...new Set(e.tags)].filter(t => tags.includes(t)).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
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
  const api = { tags, moods, dayKey, createEntry, parseEntries, weekly, triggers, examples, recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Journal = api;
})(typeof window !== 'undefined' ? window : globalThis);
