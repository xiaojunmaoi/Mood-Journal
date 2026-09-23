const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const binary = process.env.AGENT_BROWSER_BIN;
if (!binary) throw new Error('Set AGENT_BROWSER_BIN.');
const session = 'xinqing-care-acceptance';
function command(...args) { return execFileSync(binary, ['--session', session, ...args], { encoding: 'utf8', timeout: 30000 }); }
function evaluate(code) { return JSON.parse(execFileSync(binary, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 30000 }).trim()); }
function check(value, text) { assert.ok(value, text); console.log(`PASS: ${text}`); }
const text = selector => command('get', 'text', selector).trim();
command('open', process.env.TEST_URL || 'http://127.0.0.1:4174');
command('set', 'viewport', '1487', '1058');
evaluate(`window.__media = []; const NativeAudio = window.Audio; window.Audio = function(src) { const media = new NativeAudio(src); window.__media.push(media); return media; }; true`);
check(evaluate('document.querySelectorAll(".care-slide").length === 3'), 'exactly three care notes');
command('click', '#care-next');
check(text('#care-position').includes('1 / 3'), 'last note loops forward to first');
command('click', '#care-prev');
check(text('#care-position').includes('3 / 3'), 'first note loops backward to last');
command('click', '.care-dot:nth-child(2)');
command('wait', '450');
check(text('#care-position').includes('白噪音 · 2 / 3'), 'position dots select the named note');
check(evaluate('document.querySelectorAll(".care-slide:not([inert])").length === 1'), 'only the current note controls enter keyboard navigation');
command('click', '.care-slide-noise [data-sound=forest]');
check(evaluate('window.__media.length === 0'), 'changing a sound selection never auto plays');
check(text('[data-care-start=noise]').includes('森林'), 'selected sound updates the homepage action');
command('click', '[data-care-start=noise]');
command('wait', '800');
check(text('#noise-status').includes('正在播放 · 森林'), 'homepage play opens and starts the selected recording');
check(evaluate('window.__media.some(m => !m.paused && m.currentTime > 0 && m.duration > 10)'), 'real local audio decodes and advances');
for (const sound of ['rain', 'ocean', 'stream']) {
  command('click', `.sound-tile[data-sound=${sound}]`); command('wait', '700');
  check(evaluate(`window.__media.filter(m => !m.paused).length === 1 && window.__media.find(m => !m.paused).src.includes('/${sound}.m4a')`), `switch to ${sound} leaves only one recording playing`);
}
evaluate(`const input = document.querySelector('#noise-volume'); input.value = 20; input.dispatchEvent(new Event('input', { bubbles: true })); true`);
check(evaluate('Math.abs(window.__media.find(m => !m.paused).volume - .2) < .01'), 'volume control changes actual playback volume');
command('click', '[data-minutes="5"]');
command('wait', '1100');
check(text('#noise-remaining') !== '剩余 05:00', 'sleep timer counts down while playing');
command('click', '#noise-toggle');
const paused = text('#noise-remaining'); command('wait', '1100');
check(text('#noise-remaining') === paused && evaluate('window.__media.every(m=>m.paused)'), 'pause freezes both sound and remaining listening time');
command('click', '.sound-tile[data-sound=ocean]');
check(evaluate('window.__media.every(m=>m.paused)'), 'switching while paused remains silent');
command('click', '#noise-toggle'); command('wait', '650');
evaluate('window.__originalNow = Date.now; Date.now = () => window.__originalNow() + 301000; true');
command('wait', '350');
check(evaluate('!document.querySelector("#activity-feedback").hidden && window.__media.every(m=>m.paused)'), 'timer expiry stops playback and opens feedback');
evaluate('Date.now = window.__originalNow; true');
command('click', '[data-feedback="好一点了"]');
check(evaluate(`JSON.parse(localStorage.getItem('xinqing.care.v1')).some(item => item.kind === 'noise' && item.sound === 'ocean')`), 'feedback stores the selected natural sound');
command('click', '[data-page=care]');
command('click', '[data-activity=noise]');
check(evaluate('window.__media.every(m=>m.paused)'), 'care entry opens the selector silently');
command('click', '#noise-toggle'); command('wait', '600');
command('click', '#close-activity');
check(evaluate('window.__media.every(m=>m.paused)'), 'closing the dialog stops audio');
command('click', '[data-page=today]');
evaluate(`document.querySelector('#care-carousel').dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight',bubbles:true})); true`);
check(text('#care-position').includes('散步'), 'keyboard right arrow advances notes');
command('set', 'viewport', '390', '844');
evaluate(`const stage=document.querySelector('#care-stage'); stage.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',clientX:280,clientY:100,bubbles:true})); stage.dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch',clientX:90,clientY:105,bubbles:true})); true`);
check(text('#care-position').includes('呼吸'), 'horizontal touch gesture advances the carousel');
command('wait', '450');
for (const width of [320, 390, 768, 1024, 1487, 1912]) {
  command('set', 'viewport', String(width), '1058');
  command('click', '.care-dot:nth-child(2)'); command('wait', '430');
  check(evaluate(`document.documentElement.scrollWidth <= innerWidth && (() => {const a=document.querySelector('.care-slide-noise'), b=a.querySelector('.note-footnote');return b.getBoundingClientRect().bottom < a.getBoundingClientRect().bottom - 5})()`), `carousel fits ${width}px and keeps caption inside paper`);
}
check(evaluate('Array.from(document.images).every(i=>i.complete && i.naturalWidth > 0)'), 'all illustrations and icons load');
check(command('errors').trim() === '', 'no uncaught browser errors');
console.log('Care feature acceptance passed.');
