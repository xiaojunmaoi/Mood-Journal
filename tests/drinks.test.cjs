const test = require('node:test'), assert = require('node:assert/strict');
const { record, cropStyle, tagList } = require('../drink-store.js');
test('酒单拒绝空白名称，保留用户文本并约束类型和裁剪', () => {
  assert.throws(()=>record({name:'  '}),/名字/);
  const d=record({name:'青柠',kind:'recommendation',alcohol:'no',crop:{x:-50,y:999,zoom:20},note:'<script>hello</script>'});
  assert.equal(d.kind,'recommendation');assert.deepEqual(d.crop,{x:0,y:100,zoom:3});assert.equal(d.note,'<script>hello</script>');assert.equal(d.alcohol,'no');
});
test('裁剪在横竖图和缩放下覆盖画框，不拉伸或越界留白', () => {
  for(const photo of [{width:4000,height:3000},{width:3000,height:4000},{width:5000,height:1200}]){
    for(const zoom of [1,1.5,3])for(const x of [0,50,100])for(const y of [0,50,100]){
      const r=cropStyle(photo,{x,y,zoom});assert.ok(r.width>=100&&r.height>=100);assert.ok(r.left<=0&&r.top<=0);assert.ok(r.left+r.width>=99.999&&r.top+r.height>=99.999);
      assert.ok(Math.abs((r.width/r.height)*(4/3)-photo.width/photo.height)<0.00001);
    }
  }
  assert.equal(cropStyle({width:2000,height:1000}).left,-25);
});
test('旧记录默认完整显示，只有显式裁剪才启用裁剪模式', () => {
  assert.equal(record({name:'旧照片',crop:{zoom:2}}).photoFit,'contain');
  assert.equal(record({name:'手动裁剪',photoFit:'crop'}).photoFit,'crop');
  assert.equal(record({name:'恢复完整',photoFit:'contain',crop:{zoom:2}}).photoFit,'contain');
  assert.deepEqual(tagList('清爽、木质香,清爽，酸甜·茶香'),['清爽','木质香','酸甜','茶香']);
});
