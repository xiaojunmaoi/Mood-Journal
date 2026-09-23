(function (root) {
  'use strict';
  // One owner for every media element, including loads that finish after closing.
  class NatureAudio {
    constructor({ onChange = () => {}, createAudio = src => new Audio(src), fadeDuration = 450 } = {}) {
      Object.assign(this, { onChange, createAudio, fadeDuration, sound: 'rain', state: 'idle', volume: .4, epoch: 0, current: null, fade: null, wantsPlayback: false });
      this.tracks = new Set();
      this.positions = {};
    }
    notify(state) { this.state = state; this.onChange(this); }
    stopTrack(track) { if (!track) return; track.pause(); track.onerror = null; track.onloadedmetadata = null; this.tracks.delete(track); }
    cancelFade() { clearInterval(this.fade); this.fade = null; }
    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value) || 0));
      if (!this.fade && this.current) this.current.volume = this.volume;
    }
    select(sound) {
      if (!['rain', 'ocean', 'forest', 'stream'].includes(sound) || sound === this.sound) return Promise.resolve();
      this.sound = sound;
      if (this.wantsPlayback) return this.start();
      this.notify(this.state === 'error' ? 'idle' : this.state);
      return Promise.resolve();
    }
    play() { this.wantsPlayback = true; return this.state === 'playing' ? Promise.resolve() : this.start(); }
    async start() {
      const token = ++this.epoch;
      this.cancelFade();
      for (const track of this.tracks) if (track !== this.current) this.stopTrack(track);
      const old = this.current, sound = this.sound;
      const next = this.createAudio(`assets/audio/${sound}.m4a`);
      next.soundKey = sound; next.loop = true; next.preload = 'auto'; next.volume = 0;
      next.onloadedmetadata = () => { if (this.positions[sound]) next.currentTime = this.positions[sound]; };
      this.tracks.add(next);
      const fail = () => {
        if (token !== this.epoch) return;
        ++this.epoch; this.cancelFade(); this.wantsPlayback = false;
        for (const track of this.tracks) this.stopTrack(track);
        this.current = null; this.notify('error');
      };
      next.onerror = fail;
      this.notify('loading');
      try {
        await next.play();
        if (token !== this.epoch || !this.wantsPlayback) { this.stopTrack(next); return; }
        this.current = next;
        const oldVolume = old?.volume || 0;
        this.notify('playing');
        if (!this.fadeDuration) { next.volume = this.volume; this.stopTrack(old); return; }
        const started = Date.now();
        this.fade = setInterval(() => {
          const progress = Math.min(1, (Date.now() - started) / this.fadeDuration);
          next.volume = this.volume * progress;
          if (old) old.volume = oldVolume * (1 - progress);
          if (progress === 1) { this.cancelFade(); this.stopTrack(old); }
        }, 30);
      } catch { this.stopTrack(next); fail(); }
    }
    pause() {
      ++this.epoch; this.wantsPlayback = false; this.cancelFade();
      if (this.current) this.positions[this.current.soundKey] = this.current.currentTime;
      for (const track of this.tracks) this.stopTrack(track);
      this.current = null; this.notify('paused');
    }
    dispose() {
      ++this.epoch; this.wantsPlayback = false; this.cancelFade();
      for (const track of this.tracks) this.stopTrack(track);
      this.current = null; this.notify('idle');
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = NatureAudio;
  else root.NatureAudio = NatureAudio;
})(typeof window !== 'undefined' ? window : globalThis);
