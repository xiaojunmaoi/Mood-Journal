(() => {
  'use strict';
  const sounds = {
    rain: { name: '细雨', icon: 'cloud-rain', copy: '听雨滴轻轻落在叶片上。' },
    ocean: { name: '海浪', icon: 'waves', copy: '让思绪，跟着海浪慢慢放松。' },
    forest: { name: '森林', icon: 'tree', copy: '在树影与鸟鸣之间，停留片刻。' },
    stream: { name: '溪流', icon: 'drop', copy: '听潺潺的流水，不急着向前。' }
  };
  const notes = [
    { kind: 'breathe', name: '呼吸', title: '慢下来，和自己在一起。', copy: '停下一分钟，陪自己呼吸。', image: 'assets/daisies-transparent.png', caption: '一呼一吸，都是新的开始。', action: '开始呼吸练习' },
    { kind: 'noise', name: '白噪音', title: '让自然，陪你静一静。', copy: '选一种声音，给思绪留一点空白。', caption: '可随时暂停，按自己的节奏来。', action: '播放海浪' },
    { kind: 'walk', name: '散步', title: '走一走，看见不一样的风景。', copy: '出去走走，给自己5分钟。', image: 'assets/walking-transparent.png', caption: '走一走，风会带来新的心情。', action: '查看散步建议' }
  ];
  const make = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text) n.textContent = text; return n; };
  const image = (src, className, alt = '') => { const n = make('img', className); n.src = src; n.alt = alt; n.draggable = false; return n; };
  const icon = name => image(`assets/icons/${name}.svg`, 'icon');
  const button = (text, className, click) => { const n = make('button', className, text); n.type = 'button'; n.addEventListener('click', click); return n; };
  const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  function create({ openActivity }) {
    let selected = 'ocean', active = 2, player = null, session = null, timer = null;
    let volume = .4, timerChoice = 0, pointerStart = null, suppressClick = false;
    const viewport = document.querySelector('#care-carousel');
    const stage = document.querySelector('#care-stage');
    const dots = document.querySelector('#care-dots');
    const soundButtons = [];
    const artworks = {};
    let artStatus, artRetry;
    function renderArtwork() {
      Object.entries(artworks).forEach(([key, entry]) => { entry.img.hidden = key !== selected || entry.state !== 'ready'; });
      const state = artworks[selected]?.state;
      artStatus.hidden = state === 'ready';
      artStatus.textContent = state === 'error' ? '插画暂时没能加载。' : `正在准备${sounds[selected].name}插画…`;
      artRetry.hidden = state !== 'error';
    }
    function loadArtwork(key, retry = false) {
      const entry = artworks[key], version = ++entry.version;
      entry.state = 'loading';
      entry.img.onload = async () => {
        try {
          await entry.img.decode();
          if (version === entry.version) { entry.state = 'ready'; renderArtwork(); }
        } catch {
          if (version === entry.version) { entry.state = 'error'; renderArtwork(); }
        }
      };
      entry.img.onerror = () => { if (version === entry.version) { entry.state = 'error'; renderArtwork(); } };
      entry.img.src = `assets/sound-${key}.webp${retry ? `?retry=${Date.now()}` : ''}`;
      renderArtwork();
    }
    function buildArtwork() {
      const gallery = make('div', 'note-art sound-art-gallery');
      artStatus = make('p', 'sound-art-status'); artStatus.setAttribute('role', 'status');
      artRetry = button('重新加载插画', 'sound-art-retry', () => loadArtwork(selected, true)); artRetry.hidden = true;
      Object.entries(sounds).forEach(([key, sound]) => {
        const img = make('img', 'sound-art'); img.dataset.sound = key; img.alt = `水彩${sound.name}`; img.draggable = false; img.hidden = true;
        artworks[key] = { img, state: 'loading', version: 0 }; gallery.append(img);
      });
      gallery.append(artStatus, artRetry);
      Object.keys(sounds).forEach(key => loadArtwork(key));
      return gallery;
    }
    function buildSoundChoices(container, detailed, choose) {
      container.setAttribute('role', 'group'); container.setAttribute('aria-label', '选择自然声音');
      Object.entries(sounds).forEach(([key, sound]) => {
        const b = button('', detailed ? 'sound-tile' : 'sound-chip', () => choose(key));
        b.dataset.sound = key; b.setAttribute('aria-label', sound.name); b.setAttribute('aria-pressed', String(key === selected));
        if (detailed) b.append(image(`assets/sound-${key}.webp`, 'sound-thumbnail'));
        const label = make('span', 'sound-label'); label.append(icon(sound.icon), document.createTextNode(sound.name)); b.append(label);
        container.append(b); soundButtons.push(b);
      });
    }
    const slides = notes.map((note, index) => {
      const slide = make('article', `care-slide care-slide-${note.kind}`);
      slide.dataset.kind = note.kind; slide.setAttribute('role', 'group'); slide.setAttribute('aria-roledescription', '便签'); slide.setAttribute('aria-label', `${note.name}，第${index + 1}张，共3张`);
      const tape = make('span', 'note-tape'); tape.setAttribute('aria-hidden', 'true');
      const heading = make('h2', 'note-title');
      const lines = { breathe: ['慢下来，', '和自己在一起。'], noise: ['让自然，', '陪你静一静。'], walk: ['走一走，', '看见不一样的风景。'] };
      lines[note.kind].forEach(line => heading.append(make('span', '', line)));
      const art = note.kind === 'noise' ? buildArtwork() : image(note.image, 'note-art', note.kind === 'breathe' ? '水彩雏菊' : '水彩帆布鞋');
      const content = make('div', 'note-content');
      content.append(make('p', 'note-category', note.name), heading, make('p', 'note-copy', note.copy), art);
      if (note.kind === 'noise') {
        const choices = make('div', 'note-sounds'); buildSoundChoices(choices, false, selectSound); content.append(choices);
      } else content.append(make('p', 'note-caption handwritten', note.caption));
      const action = button('', `button ${note.kind === 'noise' ? 'primary' : 'outline'} note-action`, () => openActivity(note.kind, note.kind === 'noise'));
      action.dataset.careStart = note.kind; action.append(icon(note.kind === 'noise' ? 'play' : 'arrow-right'), make('span', '', note.action));
      content.append(action, make('p', 'note-footnote', note.kind === 'noise' ? note.caption : note.kind === 'breathe' ? '1分钟 · 跟着舒服的节奏' : '5分钟 · 给自己一个小休息'));
      slide.append(tape, content); stage.append(slide);
      const peek = button('', `care-peek care-peek-${index}`, () => select(note.kind));
      peek.dataset.kind = note.kind; peek.append(make('span', '', note.name));
      peek.setAttribute('aria-label', `切换到${note.name}便签`); stage.append(peek);
      const dot = button('', 'care-dot', () => select(note.kind)); dot.setAttribute('aria-label', `查看${note.name}，第${index + 1}张，共3张`); dots.append(dot);
      dot.dataset.kind = note.kind;
      return { slide, peek, dot };
    });
    function select(kind) {
      const index = notes.findIndex(note => note.kind === kind); if (index < 0) return;
      active = index;
      slides.forEach(({ slide, peek, dot }, i) => {
        const depth = (i - active + notes.length) % notes.length;
        const position = depth === 0 ? 'current' : depth === 1 ? 'next' : 'previous';
        slide.dataset.depth = depth; peek.dataset.depth = depth;
        slide.dataset.position = position; slide.inert = i !== active; slide.setAttribute('aria-hidden', String(i !== active));
        peek.hidden = i === active; peek.dataset.position = position;
        dot.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
      document.querySelector('#care-position').textContent = `${notes[active].name} · ${active + 1} / 3`;
    }
    function step(direction) { select(notes[(active + direction + 3) % 3].kind); }
    document.querySelector('#care-prev').addEventListener('click', () => step(-1));
    document.querySelector('#care-next').addEventListener('click', () => step(1));
    viewport.addEventListener('keydown', event => {
      if (event.target.matches('input, select, textarea')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); viewport.focus({ preventScroll: true }); }
    });
    stage.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') pointerStart = { x: event.clientX, y: event.clientY }; });
    stage.addEventListener('pointerup', event => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y; pointerStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { step(dx < 0 ? 1 : -1); suppressClick = true; setTimeout(() => { suppressClick = false; }, 400); }
    });
    stage.addEventListener('pointercancel', () => { pointerStart = null; });
    stage.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; } }, true);

    function selectSound(key) {
      if (!sounds[key]) return;
      selected = key;
      for (let i = soundButtons.length - 1; i >= 0; i--) {
        const b = soundButtons[i]; if (!b.isConnected) { soundButtons.splice(i, 1); continue; }
        b.setAttribute('aria-pressed', String(b.dataset.sound === key));
      }
      renderArtwork();
      stage.querySelector('[data-care-start=noise] span').textContent = `播放${sounds[key].name}`;
      if (player) player.select(key);
      updateSoundUI();
    }
    function totalElapsed() { return session ? session.elapsed + (session.playing ? Date.now() - session.started : 0) : 0; }
    function updateSoundUI() {
      if (!session) return;
      const state = player?.state || 'idle', name = sounds[selected].name;
      if (session.lastState !== `${state}:${selected}`) {
      session.status.textContent = state === 'playing' ? `正在播放 · ${name}` : state === 'loading' ? `正在准备${name}…` : state === 'paused' ? `已暂停 · ${name}` : state === 'error' ? '声音暂时未能加载，请重试或换一种声音。' : `已选择${name}，准备好时点一下播放`;
      session.copy.textContent = sounds[selected].copy;
      session.toggle.replaceChildren(icon(state === 'playing' ? 'pause' : 'play'), document.createTextNode(state === 'playing' ? '暂停' : state === 'loading' ? '取消加载' : state === 'error' ? '重新播放' : state === 'paused' ? '继续播放' : `播放${name}`));
      session.wave.classList.toggle('is-playing', state === 'playing');
        session.lastState = `${state}:${selected}`;
      }
      session.remaining.textContent = session.limit ? `剩余 ${clock(Math.max(0, Math.ceil((session.limit - totalElapsed()) / 1000)))}` : '不定时 · 随时可以结束';
    }
    function stopSound() {
      clearInterval(timer); timer = null;
      session = null;
      const old = player; player = null; old?.dispose();
    }
    function openSound({ content, controls, finish }) {
      stopSound();
      const choices = make('div', 'sound-grid'); buildSoundChoices(choices, true, selectSound); content.append(choices);
      const playback = make('div', 'sound-playback'), wave = icon('waves'); wave.classList.add('sound-wave');
      const text = make('div'), status = make('p', 'sound-status'), copy = make('p', 'muted small-text'); status.id = 'noise-status'; status.setAttribute('role', 'status'); text.append(status, copy); playback.append(wave, text); content.append(playback);
      const volumeRow = make('label', 'sound-volume'); volumeRow.append(icon('speaker-high'), document.createTextNode('音量'));
      const range = make('input'); range.type = 'range'; range.min = '0'; range.max = '100'; range.value = String(volume * 100); range.id = 'noise-volume'; range.setAttribute('aria-label', '白噪音音量');
      const value = make('output', '', `${Math.round(volume * 100)}%`); value.htmlFor = 'noise-volume';
      range.addEventListener('input', () => { volume = Number(range.value) / 100; value.textContent = `${range.value}%`; player?.setVolume(volume); }); volumeRow.append(range, value); content.append(volumeRow);
      const timerRow = make('div', 'sound-timer'); timerRow.append(make('span', '', '定时停止'));
      const choicesTimer = make('div', 'timer-options'); choicesTimer.setAttribute('role', 'group'); choicesTimer.setAttribute('aria-label', '定时停止');
      [0, 5, 15, 30].forEach(minutes => {
        const b = button(minutes ? `${minutes}分钟` : '不定时', 'timer-choice', () => {
          timerChoice = minutes; session.limit = minutes ? totalElapsed() + minutes * 60000 : 0;
          choicesTimer.querySelectorAll('button').forEach(choice => choice.setAttribute('aria-pressed', String(choice === b))); updateSoundUI();
        }); b.dataset.minutes = minutes; b.setAttribute('aria-pressed', String(timerChoice === minutes)); choicesTimer.append(b);
      }); timerRow.append(choicesTimer); content.append(timerRow);
      const remaining = make('p', 'sound-remaining'); remaining.id = 'noise-remaining'; content.append(remaining);
      const toggle = button('', 'button primary', () => player.wantsPlayback ? player.pause() : player.play()); toggle.id = 'noise-toggle';
      controls.append(toggle, button('结束休息', 'button outline', finish));
      session = { elapsed: 0, started: 0, playing: false, limit: timerChoice * 60000, status, copy, toggle, wave, remaining };
      player = new window.NatureAudio({ onChange: p => {
        if (!session) return;
        if (session.playing && p.state !== 'playing') session.elapsed += Date.now() - session.started;
        if (!session.playing && p.state === 'playing') session.started = Date.now();
        session.playing = p.state === 'playing'; updateSoundUI();
      }});
      player.setVolume(volume); player.select(selected); updateSoundUI();
      timer = setInterval(() => {
        if (!session) return;
        if (session.limit && totalElapsed() >= session.limit) { finish(); return; }
        updateSoundUI();
      }, 250);
    }
    select('walk'); selectSound(selected);
    return { select, openSound, stopSound, playSound: () => player?.play(), selectedSound: () => selected };
  }
  window.CareUI = { create, sounds };
})();
