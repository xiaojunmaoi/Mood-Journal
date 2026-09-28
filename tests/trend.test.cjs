const test = require('node:test');
const assert = require('node:assert/strict');
const J = require('../journal.js');
const now = new Date(2026, 8, 28, 12);

test('近7天和30天包含今天，跨月跨年和闰日按自然日计算', () => {
  assert.deepEqual(J.dateRange({preset:'30'}, now), {preset:'30',start:'2026-08-30',end:'2026-09-28',length:30});
  assert.equal(J.dateRange({preset:'7'}, new Date(2026,0,3,12)).start,'2025-12-28');
  assert.equal(J.dateRange({preset:'7'}, new Date(2024,2,2,12)).start,'2024-02-25');
  assert.equal(J.shiftDay('2024-02-28',1),'2024-02-29');
  assert.equal(J.dateRange({preset:'custom',start:'2024-02-28',end:'2024-03-01'},now).length,3);
});
test('自定义日期含首尾及单日，拒绝反向、未来和不存在的日期', () => {
  assert.equal(J.dateRange({preset:'custom',start:'2026-09-28',end:'2026-09-28'},now).length,1);
  for(const selection of [{preset:'all'}, {preset:'custom',start:'2026-02-30',end:'2026-09-28'}, {preset:'custom',start:'2026-09-28',end:'2026-09-27'}, {preset:'custom',start:'2026-09-28',end:'2026-09-29'}, {preset:'custom',start:'',end:''}]) assert.throws(()=>J.dateRange(selection,now));
});
test('任意范围曲线和因素使用相同记录，忽略无心情日记且不重复标签', () => {
  const rows=[['2026-08-29',1,['人际']],['2026-08-30',2,['家庭']],['2026-09-08',1,['学业','学业']],['2026-09-22',5,['睡眠']],['2026-09-28',4,['工作']],['2026-09-28',2,['睡眠','睡眠']],['2026-09-10',null,['工作']]];
  const entries=rows.map(([day,mood,tags])=>({day,date:now.toISOString(),mood,tags}));
  const week=J.rangeStats(entries,J.dateRange({preset:'7'},now));
  assert.equal(week.totalCount,3);assert.equal(week.lowCount,1);assert.deepEqual(week.triggers,[{tag:'睡眠',count:1}]);
  const month=J.rangeStats(entries,J.dateRange({preset:'30'},now));
  assert.equal(month.totalCount,5);assert.equal(month.lowCount,3);
  assert.deepEqual(month.days.map(d=>d.key),['2026-08-30','2026-09-08','2026-09-22','2026-09-28']);
  assert.equal(month.days.at(-1).value,3);assert.equal(month.days.at(-1).count,2);
  assert.deepEqual(month.triggers,[{tag:'家庭',count:1},{tag:'学业',count:1},{tag:'睡眠',count:1}]);
});
test('无记录与跨多年的范围保持稀疏，补记日期优先于创建时间', () => {
  const range=J.dateRange({preset:'custom',start:'1900-01-01',end:'2026-09-28'},now);
  assert.deepEqual(J.rangeStats([],range),{days:[],triggers:[],lowCount:0,totalCount:0});
  const stats=J.rangeStats([{day:'1901-01-01',date:now.toISOString(),mood:4,tags:[]}],range);
  assert.equal(stats.days.length,1);assert.equal(stats.days[0].key,'1901-01-01');
});
