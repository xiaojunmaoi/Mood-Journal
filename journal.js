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
  function shiftDay(day, offset) {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + offset);
    return dayKey(date);
  }
  function dayNumber(day) { return Date.parse(`${day}T00:00:00Z`) / 86400000; }
  function dateRange(selection = { preset: '7' }, now = new Date()) {
    const today = dayKey(now), preset = String(selection?.preset);
    if (preset === '7' || preset === '30') {
      return { preset, start: shiftDay(today, 1 - Number(preset)), end: today, length: Number(preset) };
    }
    if (preset !== 'custom' || !validDay(selection.start) || !validDay(selection.end)) throw new Error('请选择有效的开始和结束日期。');
    if (selection.start > selection.end) throw new Error('开始日期不能晚于结束日期。');
    if (selection.end > today) throw new Error('结束日期不能晚于今天。');
    return { preset, start: selection.start, end: selection.end, length: dayNumber(selection.end) - dayNumber(selection.start) + 1 };
  }
  function rangeStats(entries, range) {
    const grouped = new Map(), counts = {};
    let lowCount = 0, totalCount = 0;
    for (const entry of entries) {
      if (!Number.isInteger(entry.mood) || entry.mood < 1 || entry.mood > 5) continue;
      const key = entryDay(entry);
      if (!validDay(key) || key < range.start || key > range.end) continue;
      const day = grouped.get(key) || { key, count: 0, sum: 0 };
      day.count++; day.sum += entry.mood; grouped.set(key, day); totalCount++;
      if (entry.mood <= 2) {
        lowCount++;
        for (const tag of new Set(entry.tags || [])) if (tags.includes(tag)) counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    // Keep only observed days: even a multi-year range need not allocate every empty date.
    const days = [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key)).map(d => ({ key: d.key, label: `${Number(d.key.slice(5, 7))}/${Number(d.key.slice(8))}`, count: d.count, value: d.sum / d.count }));
    const triggers = Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
    return { days, triggers, lowCount, totalCount };
  }
  function weekly(entries, now = new Date()) {
    const range = dateRange({ preset: '7' }, now), days = new Map(rangeStats(entries, range).days.map(d => [d.key, d]));
    return Array.from({ length: 7 }, (_, i) => {
      const key = shiftDay(range.start, i);
      return days.get(key) || { key, label: `${Number(key.slice(5, 7))}/${Number(key.slice(8))}`, count: 0, value: null };
    });
  }
  function triggers(entries, now = new Date()) { return rangeStats(entries, dateRange({ preset: '7' }, now)).triggers; }
  function examples(now = new Date()) {
    const notes = ['事情有一点多，先把今天最重要的一件做好。', '午后和朋友聊了聊天，轻松了一些。', '昨晚睡得晚，今天想早点休息。', '计划没能全部完成，允许自己慢一点。', '午休出去散步，看到了路边的小花。', '把拖了很久的事情做完了，松了一口气。', '今天的阳光很好，给自己留了一点时间。'];
    const recent = [2, 3, 2, 2, 3, 3, 4].map((mood, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i, i === 6 ? 0 : 18);
      return { id: `example-${i}`, date: date.toISOString(), mood, tags: i === 2 ? ['睡眠'] : i === 1 ? ['人际'] : ['工作'], note: notes[i] };
    });
    const earlier = [];
    for (let offset = 7; offset < 30; offset++) {
      if ([10, 17, 24].includes(offset)) continue;
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 18);
      earlier.push({ id: `example-history-${offset}`, date: date.toISOString(), mood: [3, 4, 4, 2, 3, 2, 4][offset % 7], tags: [offset % 3 === 0 ? '睡眠' : '工作'], note: notes[offset % notes.length] });
    }
    return [...earlier, ...recent];
  }
  function recommend(entry) {
    if (entry.tags.includes('睡眠')) return 'rain';
    if (entry.tags.includes('工作') || entry.tags.includes('学业')) return 'walk';
    return entry.mood <= 2 ? 'breathe' : 'walk';
  }
  const api = { tags, moods, dayKey, validDay, entryDay, sorted, createEntry, parseEntries, weekly, triggers, shiftDay, dayNumber, dateRange, rangeStats, examples, recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Journal = api;
})(typeof window !== 'undefined' ? window : globalThis);
