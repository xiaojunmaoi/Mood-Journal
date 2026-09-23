const { test } = require('node:test');
const assert = require('node:assert/strict');
function setup() {
  const Player = require('../nature-audio.js');
  const media = [];
  const player = new Player({ fadeDuration: 0, createAudio: src => {
    const audio = { src, volume: 0, currentTime: 0, paused: true, pause() { this.paused = true; }, play() { this.paused = false; return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); } };
    media.push(audio); return audio;
  }});
  return { player, media };
}

test('selection is silent; playback switches to one selected track and can pause', async () => {
  const { player, media } = setup();
  player.select('ocean');
  assert.equal(media.length, 0);
  const start = player.play(); media[0].resolve(); await start;
  assert.equal(player.state, 'playing');
  const change = player.select('forest'); media[1].resolve(); await change;
  assert.equal(media[0].paused, true);
  assert.equal(media[1].paused, false);
  player.pause();
  assert.equal(media[1].paused, true);
  assert.equal(player.state, 'paused');
});

test('closing or rapidly switching invalidates pending playback without ghost audio', async () => {
  const { player, media } = setup();
  const stale = player.play();
  const current = player.select('stream');
  media[1].resolve(); await current;
  media[0].resolve(); await stale;
  assert.equal(media[0].paused, true);
  assert.equal(player.sound, 'stream');
  assert.equal(player.state, 'playing');
  player.pause();
  const pending = player.play(); player.dispose(); media[2].resolve(); await pending;
  assert.ok(media.every(audio => audio.paused));
  assert.equal(player.state, 'idle');
});

test('failed sound loading stops audio, exposes failure and permits retry', async () => {
  const { player, media } = setup();
  const failed = player.play(); media[0].reject(new Error('network')); await failed;
  assert.equal(player.state, 'error');
  assert.ok(media[0].paused);
  const retry = player.play(); media[1].resolve(); await retry;
  player.setVolume(.2);
  assert.equal(media[1].volume, .2);
  assert.equal(player.state, 'playing');
  player.dispose();
});
