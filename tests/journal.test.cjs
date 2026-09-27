const test = require('node:test');
const assert = require('node:assert/strict');
const J = require('../journal.js');

test('图文记录允许不选心情，拒绝空白和超长内容', () => {
  assert.throws(() => J.createEntry({ mood: 0 }));
  assert.throws(() => J.createEntry({ mood: 6, note: '文字' }));
  assert.throws(() => J.createEntry({ title: '只有标题', tags: ['工作'] }));
  assert.throws(() => J.createEntry({ note: 'x'.repeat(5001) }));
  assert.throws(() => J.createEntry({ note: '文字', photos: Array(10).fill({}) }));
  const entry = J.createEntry({ mood: null, tags: ['工作', '工作', 'unknown'], note: 'x'.repeat(5000) });
  assert.equal(entry.note.length, 5000);
  assert.equal(entry.mood, null);
  assert.deepEqual(entry.tags, ['工作']);
  assert.ok(entry.id);
  assert.equal(J.createEntry({ photos: [{ id: 'photo' }] }).photos.length, 1);
});

test('补记日期稳定且无心情的图文记录不影响均值或低落因素', () => {
  const now = new Date(2026, 8, 27, 12), date = now.toISOString();
  const entries = [J.createEntry({ note: '照片日记', mood: null, tags: ['工作'], date }), J.createEntry({ mood: 4, date }), J.createEntry({ mood: 2, date, day: '2026-09-25', tags: ['睡眠'] })];
  const days = J.weekly(entries, now);
  assert.equal(days[6].value, 4); assert.equal(days[6].count, 1);
  assert.equal(days[4].value, 2);
  assert.deepEqual(J.triggers(entries, now), [{ tag: '睡眠', count: 1 }]);
  assert.equal(J.sorted(entries).at(-1).day, '2026-09-25');
  assert.equal(J.validDay('2026-02-30'), false);
});

test('七天趋势只聚合同一本地日期的记录，不把空白日视作低落', () => {
  const now = new Date(2026, 8, 22, 12);
  const entries = [{ mood: 2, date: new Date(2026, 8, 22, 0, 10).toISOString() }, { mood: 4, date: new Date(2026, 8, 22, 22).toISOString() }, { mood: 1, date: new Date(2026, 8, 10).toISOString() }];
  const days = J.weekly(entries, now);
  assert.equal(days.length, 7);
  assert.equal(days[0].key, '2026-09-16');
  assert.equal(days[0].value, null);
  assert.equal(days[6].value, 3);
  assert.equal(days[6].count, 2);
});

test('触发因素只统计最近七天低落记录，每条记录的相同标签计一次', () => {
  const now = new Date(2026, 8, 22, 12);
  const date = now.toISOString();
  const result = J.triggers([{ mood: 1, date, tags: ['工作', '工作'] }, { mood: 2, date, tags: ['工作', '睡眠'] }, { mood: 5, date, tags: ['睡眠'] }, { mood: 1, date: new Date(2026, 8, 1).toISOString(), tags: ['学业'] }], now);
  assert.deepEqual(result, [{ tag: '工作', count: 2 }, { tag: '睡眠', count: 1 }]);
});

test('读取异常或不合法存储时返回可辨识错误，不信任外部字段', () => {
  assert.equal(J.parseEntries('{broken').error, true);
  assert.equal(J.parseEntries('{}').error, true);
  const result = J.parseEntries(JSON.stringify([{ id: 'ok', mood: 3, date: '2026-09-22T00:00:00Z', tags: ['睡眠'], note: '<img src=x onerror=alert(1)>' }, null, { mood: 9 }]));
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].note, '<img src=x onerror=alert(1)>');
  assert.equal(result.error, true);
});

test('示例数据每次返回独立记录，不产生未来日期', () => {
  const now = new Date(2026, 8, 22, 9);
  const a = J.examples(now), b = J.examples(now);
  a[0].note = 'changed';
  assert.notEqual(a[0].note, b[0].note);
  assert.ok(b.every(e => new Date(e.date) <= now));
  assert.equal(J.weekly([], now).filter(d => d.value !== null).length, 0);
});

test('关怀建议随标签变化，但不会输出诊断', () => {
  assert.equal(J.recommend({ mood: 2, tags: ['工作'] }), 'walk');
  assert.equal(J.recommend({ mood: 1, tags: ['睡眠'] }), 'rain');
  assert.equal(J.recommend({ mood: 1, tags: [] }), 'breathe');
});
