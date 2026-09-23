const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const binary = process.env.AGENT_BROWSER_BIN;
if (!binary) throw new Error('Set AGENT_BROWSER_BIN.');
const session = 'xinqing-stack-v3';
const url = process.env.TEST_URL || 'http://127.0.0.1:4174';
const command = (...args) => execFileSync(binary, ['--session', session, ...args], { encoding: 'utf8', timeout: 30000 });
const evaluate = code => JSON.parse(execFileSync(binary, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 30000 }).trim());
function check(value, message) { assert.ok(value, message); console.log(`PASS: ${message}`); }
command('open', url); command('reload'); command('set', 'viewport', '1487', '1058');
const order = ['breathe', 'noise', 'walk'];
for (let i = 0; i < 3; i++) {
  command('click', `.care-dot:nth-child(${i + 1})`); command('wait', '430');
  check(evaluate(`document.querySelector('.care-slide[data-depth="0"]')?.dataset.kind === '${order[i]}'`), `dot ${i + 1} opens ${order[i]}`);
  check(evaluate(`document.querySelector('.care-peek[data-depth="1"]')?.dataset.kind === '${order[(i + 1) % 3]}' && document.querySelector('.care-peek[data-depth="2"]')?.dataset.kind === '${order[(i + 2) % 3]}'`), 'right-hand sheets follow the same forward order as the dots');
  check(evaluate(`document.querySelectorAll('.care-dot[aria-current="true"]').length === 1 && document.querySelector('.care-dot[aria-current="true"]').dataset.kind === '${order[i]}'`), 'one active dot matches the front sheet');
  check(evaluate(`(() => {const cards=[0,1,2].map(d=>document.querySelector('.care-slide[data-depth="'+d+'"]').getBoundingClientRect());return cards[0].left < cards[1].left && cards[1].left < cards[2].left && [1,2].every(d=>getComputedStyle(document.querySelector('.care-slide[data-depth="'+d+'"] .note-content')).visibility==='hidden')})()`), 'sheets step only rightward and hide covered content');
  command('click', '.care-peek[data-depth="1"]'); command('wait', '360');
  check(evaluate(`document.querySelector('.care-slide[data-depth="0"]').dataset.kind === '${order[(i + 1) % 3]}' && document.querySelector('.care-dot[aria-current="true"]').dataset.kind === '${order[(i + 1) % 3]}'`), 'nearest exposed sheet opens the next note and selects its matching dot');
  command('click', '#care-prev'); command('wait', '360');
  check(evaluate(`document.querySelector('.care-slide[data-depth="0"]').dataset.kind === '${order[i]}'`), 'previous arrow restores the same ordered note');
}
command('click', '.care-dot:nth-child(2)'); command('wait', '430');
for (const sound of ['rain', 'forest', 'stream', 'ocean']) {
  command('click', `.note-sounds [data-sound=${sound}]`);
  check(evaluate(`(() => {const visible=[...document.querySelectorAll('.sound-art')].filter(i=>!i.hidden);return visible.length <= 1 && visible.every(i=>i.dataset.sound==='${sound}')})()`), 'a new selection never displays the previous sound artwork');
  check(evaluate(`new Promise(resolve=>{const start=Date.now();const tick=()=>{const img=document.querySelector('.sound-art[data-sound="${sound}"]');if(img && !img.hidden && img.complete && img.naturalWidth)resolve(true);else if(Date.now()-start>7000)resolve(false);else setTimeout(tick,50)};tick()})`), `${sound} illustration becomes ready and visible`);
}
evaluate(`['rain','ocean','forest','stream'].forEach(s=>document.querySelector('.note-sounds [data-sound='+s+']').click()); true`);
check(evaluate(`document.querySelector('.sound-art:not([hidden])').dataset.sound === 'stream' && document.querySelector('.note-sounds [aria-pressed="true"]').dataset.sound === 'stream'`), 'rapid choices keep only the last illustration and selection');
for (const width of [320,390,768,1024,1487,1912]) {
  command('set','viewport',String(width),'1058'); command('wait','150');
  check(evaluate(`document.documentElement.scrollWidth <= innerWidth && (()=>{const s=document.querySelector('.care-slide[data-depth="0"]'), caption=s.querySelector('.note-footnote');return caption.getBoundingClientRect().bottom < s.getBoundingClientRect().bottom - 5})()`), `right-hand stack fits ${width}px`);
}
command('network', 'route', '**/sound-stream.webp*', '--abort');
try {
  command('reload'); command('set','viewport','1487','1058');
  command('click', '.care-dot:nth-child(2)'); command('wait','360');
  command('click', '.note-sounds [data-sound=stream]');
  check(evaluate(`new Promise(resolve=>{const start=Date.now();const tick=()=>{if(!document.querySelector('.sound-art-retry').hidden)resolve(true);else if(Date.now()-start>5000)resolve(false);else setTimeout(tick,50)};tick()})`), 'failed artwork exposes a retry control');
  check(evaluate(`document.querySelectorAll('.sound-art:not([hidden])').length === 0 && document.querySelector('.note-sounds [aria-pressed="true"]').dataset.sound === 'stream'`), 'an unavailable illustration never leaves a different sound visible');
  command('network','unroute','**/sound-stream.webp*');
  command('click','.sound-art-retry');
  check(evaluate(`new Promise(resolve=>{const start=Date.now();const tick=()=>{const img=document.querySelector('.sound-art[data-sound=stream]');if(!img.hidden && img.complete && img.naturalWidth)resolve(true);else if(Date.now()-start>7000)resolve(false);else setTimeout(tick,50)};tick()})`), 'retry restores only the selected illustration');
} finally { command('network', 'unroute', '**/sound-stream.webp*'); }
console.log('Right-hand stack and illustration synchronization passed.');
