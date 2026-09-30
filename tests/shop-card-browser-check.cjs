const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict'),fs=require('node:fs');
const bin=process.env.AGENT_BROWSER_BIN,session=process.env.BROWSER_SESSION||'shop-cards-'+Date.now(),base=process.env.TEST_URL||'http://127.0.0.1:4179';
const run=(...a)=>execFileSync(bin,['--session',session,...a],{encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
const ev=c=>JSON.parse(execFileSync(bin,['--session',session,'eval','--stdin'],{input:c,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024}).trim());
const wait=c=>assert(ev('new Promise(r=>{const end=Date.now()+15000;const tick=async()=>{if(await('+c+'))return r(true);if(Date.now()>end)return r(false);setTimeout(tick,50)};tick()})'),c);
const check=(v,m)=>{assert(v,m);console.log('PASS '+m)};
const shot=n=>{ev('Promise.all([...document.images].filter(i=>i.offsetWidth).map(i=>i.decode().catch(()=>{}))).then(()=>true)');run('screenshot','output/'+n+'.png')};
execFileSync(bin,['--session',session,'open',base+'/#drinks'],{stdio:'ignore',timeout:30000});wait('typeof DrinkStore!=="undefined"');
check(ev('DrinkStore.list().then(a=>a.length===0)'),'test profile is separate and initially empty');
ev(`(async()=>{
 const photo=async(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#d9dfcb';ctx.fillRect(0,0,w,h);ctx.fillStyle='#b9654b';ctx.fillRect(0,0,w,18);ctx.fillRect(0,h-18,w,18);return PhotoTools.normalize(new File([await new Promise(r=>c.toBlob(r,'image/png'))],'edges.png',{type:'image/png'}))};
 await DrinkStore.save({id:'card-portrait',name:'竖图完整显示',photo:await photo(400,900),tags:'清爽、柑橘、花香、草本',ingredients:'金酒 30 ml\\n汤力水 120 ml\\n青柠 2 片',kind:'recipe'},'test');
 await DrinkStore.save({id:'card-wide',name:'横图与很长的名称'.repeat(5),photo:await photo(1200,400),tags:'特别长的自定义口味标签'.repeat(4),note:'<script>window.injected=true</script>'.repeat(12),kind:'recommendation'},'test');
 await DrinkStore.save({id:'card-empty',name:'只填名称也能保存',kind:'recipe'},'test');
 return true;
})()`);
run('reload');wait('document.querySelectorAll(".drink-card").length===3');
check(ev('[...document.querySelectorAll(".drink-card")].some(c=>c.textContent.includes("金酒 30 ml · 汤力水 120 ml"))'),'recipe excerpt comes from saved ingredients with line breaks normalized');
check(ev('!window.injected && [...document.querySelectorAll(".drink-card-excerpt p")].some(p=>p.textContent.includes("<script>"))'),'note excerpt is rendered safely as literal text');
check(ev(`!document.querySelector('a[href="#drink/card-empty"] .drink-card-excerpt')`),'missing notes do not produce placeholder copy');
const report=[];
for(const width of [320,360,390,640,768,1024,1100,1200,1440,1600,1920]){
 run('set','viewport',String(width),'1000');
 ev('Promise.all([...document.querySelectorAll(".drink-card img")].map(i=>i.decode())).then(()=>document.fonts.ready).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true)))))');
 const result=ev(`(()=>{
 const cards=[...document.querySelectorAll('.drink-card')];const rects=cards.map(c=>c.getBoundingClientRect());const photos=[...document.querySelectorAll('.drink-thumbnail.is-contained>img')];
 return {width:innerWidth,noOverflow:document.documentElement.scrollWidth<=innerWidth,columns:getComputedStyle(document.querySelector('.drinks-grid')).gridTemplateColumns.split(' ').length,
   fits:cards.every(c=>[...c.querySelectorAll('h3,.drink-tags,.drink-card-excerpt,.drink-cta')].every(e=>{const a=e.getBoundingClientRect(),b=c.getBoundingClientRect();return !e.getClientRects().length||(a.left>=b.left&&a.right<=b.right+.5)})),
   photos:photos.every(i=>{const s=getComputedStyle(i),r=i.getBoundingClientRect(),w=r.width-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth),h=r.height-parseFloat(s.borderTopWidth)-parseFloat(s.borderBottomWidth);return Math.abs(w/h-i.naturalWidth/i.naturalHeight)<.03}),
   cards:rects.map(r=>({x:r.x,y:r.y,w:r.width,h:r.height}))}
 })()`);
 check(result.noOverflow&&result.fits,'long title/tags/notes stay inside cards at '+width);
 check(result.photos,'portrait and landscape preserve full natural aspect at '+width);
 check(result.columns===(width>1100?2:1),'appropriate desktop/mobile columns at '+width);
 report.push(result);
}
run('set','viewport','390','844');
run('click','a[href="#drink/card-portrait"]');wait('document.body.dataset.surface==="drink-detail"');
check(ev('document.querySelector("#drink-detail-name").textContent==="竖图完整显示"'),'whole card opens its own detail');
ev('location.hash="#drinks";true');wait('document.body.dataset.surface==="drinks" && document.querySelectorAll(".drink-card").length===3');ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
ev('scrollTo(0,0);true');run('click','[data-drink-filter=recommendation]');wait('document.querySelectorAll(".drink-card").length===1');check(ev('document.querySelectorAll(".drink-card").length===1'),'recommendation filter still works');
run('click','[data-drink-filter=all]');
run('click','#demo-toggle');wait('!document.querySelector("#demo-banner").hidden && document.querySelectorAll(".drink-card").length===3');
for(const [w,h,name]of [[1600,1000,'shop-v132-desktop'],[390,844,'shop-v132-mobile']]){
 run('set','viewport',String(w),String(h));ev('scrollTo(0,0);true');shot(name);
 if(w===390){ev('document.querySelector(".drinks-grid").scrollIntoView({block:"start"});scrollBy(0,-20);true');shot('shop-v132-mobile-cards')}
}
fs.writeFileSync('output/shop-v132-layout-report.json',JSON.stringify(report,null,2));
check(!run('errors').trim(),'no browser errors');
console.log('Recipe card checks passed');
