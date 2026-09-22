// Run after starting serve.cjs, using an isolated agent-browser session.
// Requires AGENT_BROWSER_BIN to point to the installed agent-browser executable.
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const binary = process.env.AGENT_BROWSER_BIN;
if (!binary) throw new Error('Set AGENT_BROWSER_BIN first.');
const session = 'xinqing-prototype';
function command(...args) { return execFileSync(binary, ['--session', session, ...args], { encoding: 'utf8', timeout: 30000 }); }
function evaluate(code) { const result = execFileSync(binary, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 30000 }); return JSON.parse(result.trim()); }
function check(condition, message) { assert.ok(condition, message); console.log(`PASS: ${message}`); }
const personalCount = () => evaluate("JSON.parse(localStorage.getItem('xinqing.entries.v1') || '[]').length");

command('open', 'http://127.0.0.1:4173/#today');
command('reload');
command('click', '.mood-choice:nth-child(2)');
command('click', '.tag-chip:nth-child(2)');
command('fill', '#journal-note', '自动化测试记录：保存后可刷新恢复。');
command('click', '#save-entry');
command('reload');
check(evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(document.querySelector("#home-chart-empty").hidden))))'), 'saved diary survives page navigation and redraw');
command('click', '[data-page=review]');
const count = personalCount();
check(count > 0, 'personal test fixture exists');
command('click', '.entry-actions button:first-child');
command('fill', '#journal-note', '编辑验证：给自己留一点时间。');
command('click', '#demo-toggle');
command('click', '#demo-toggle');
check(command('get', 'text', '#save-entry').includes('保存修改'), 'editing identity survives entering and leaving examples');
command('click', '#save-entry');
check(personalCount() === count, 'editing updates the existing diary without duplicating it');
command('click', '[data-page=review]');
check(command('get', 'text', '#entry-list').includes('编辑验证'), 'updated text is visible in history');

command('click', '#demo-toggle');
command('click', '[data-page=today]');
command('click', '.mood-choice:nth-child(5)');
command('fill', '#journal-note', '这是示例内容，不应进入个人手帐。');
command('click', '#save-entry');
check(personalCount() === count, 'sample save does not change personal storage');
command('click', '#demo-toggle');
command('click', '[data-page=review]');
check(!command('get', 'text', '#entry-list').includes('这是示例内容'), 'sample content remains isolated');
evaluate('document.querySelector(".skip-link").click()');
check(evaluate('!document.querySelector("#page-review").hidden'), 'skip link preserves the current page');

command('click', '.entry-actions button:first-child');
const payload = '<img src=x onerror="window.__noteExecuted=1">';
command('fill', '#journal-note', payload);
command('click', '#save-entry');
command('click', '[data-page=review]');
check(command('get', 'text', '#entry-list').includes(payload), 'HTML in a note remains literal text');
check(evaluate('document.querySelectorAll(".entry-note img").length') === 0, 'note text cannot insert executable HTML');
command('click', '.entry-actions button:last-child');
command('click', '#cancel-delete');
check(personalCount() === count, 'canceling deletion keeps the diary');
command('click', '.entry-actions button:last-child');
command('click', '#confirm-delete');
check(personalCount() === count - 1, 'confirmed deletion updates stored diaries');

command('click', '[data-page=care]');
command('click', '[data-activity=breathe]');
command('click', '#timer-toggle');
command('wait', '1200');
check(command('get', 'text', '#timer-readout').trim() !== '01:00', 'breathing timer counts down');
command('click', '#timer-toggle');
const paused = command('get', 'text', '#timer-readout').trim();
command('wait', '1100');
check(command('get', 'text', '#timer-readout').trim() === paused, 'pause freezes the breathing timer');
command('click', '#activity-controls .outline');
command('click', '[data-feedback="好一点了"]');
check(command('get', 'text', '#care-history-list').includes('好一点了'), 'care feedback is saved and displayed');
command('click', '[data-activity=rain]');
command('click', '#rain-toggle');
check(command('get', 'text', '#rain-status').includes('正在'), 'rain audio starts from a user action');
command('click', '#rain-toggle');
check(command('get', 'text', '#rain-status').includes('暂停'), 'rain audio can pause');
command('click', '#close-activity');
command('click', '[data-activity=walk]');
check(evaluate('document.querySelectorAll(".walk-steps li").length') === 3, 'walking activity contains three actionable steps');
command('click', '#close-activity');

evaluate('document.querySelector("[data-activity=breathe]").click(); document.querySelector("#activity-dialog").close(); document.querySelector("[data-activity=walk]").click(); true');
command('click', '#timer-toggle');
command('wait', '1100');
check(command('get', 'text', '#timer-readout').trim() !== '05:00', 'queued close event does not cancel a newly opened activity');
command('click', '#close-activity');
command('set', 'viewport', '390', '844');
command('click', '[data-page=today]');
check(evaluate('document.documentElement.scrollWidth <= innerWidth'), 'mobile page has no horizontal overflow');
check(evaluate('Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).length') === 0, 'all local images load');
command('screenshot', 'docs/mobile-home.png', '--full');
command('click', '[data-page=care]');
command('click', '[data-activity=breathe]');
check(evaluate('document.querySelector("#activity-dialog").getBoundingClientRect().width < innerWidth'), 'activity dialog fits the mobile viewport');
command('screenshot', 'docs/mobile-activity.png');
command('click', '#close-activity');
command('set', 'viewport', '1487', '1058');
command('click', '[data-page=today]');
command('click', '#demo-toggle');
command('click', '.mood-choice:nth-child(4)');
command('check', '.tag-chip:nth-child(2) input');
command('wait', '3800');
command('screenshot', 'docs/desktop-demo.png');
check(command('errors').trim() === '', 'browser reports no uncaught page errors');
console.log('Browser workflow checks passed.');
