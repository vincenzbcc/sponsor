/**
 * Motore principale basato sui tre MP4 originali, raccordati e ottimizzati.
 * Scarica le clip iniziali invece di 252 frame WebP e mantiene in RAM
 * soltanto i fotogrammi gestiti dal decoder video del browser.
 */
(() => {
  'use strict';

  const paths = {
    intro: 'videos/intro.mp4',
    destra: 'videos/destra.mp4',
    sinistra: 'videos/sinistra.mp4',
    'destra-reverse': 'videos/destra-reverse.mp4',
    'sinistra-reverse': 'videos/sinistra-reverse.mp4',
  };
  const sources = new Map();
  const videos = [...document.querySelectorAll('.scene-video')];
  const menu = document.querySelector('#s-menu');
  const panels = [...document.querySelectorAll('.screen.panel')];
  const lantern = document.querySelector('.lantern');
  const loading = document.querySelector('#loading');
  const loadingValue = document.querySelector('#loading-value');
  const loadingBar = document.querySelector('#loading-bar');
  const loadingStatus = document.querySelector('#loading-status');
  const loadingRetry = document.querySelector('#loading-retry');
  const compactScene = matchMedia('(max-aspect-ratio: 5/4)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let active = 0;
  let screen = 'welcome';
  let position = 'menu';
  let busy = false;
  let queuedTarget = null;
  let focusFrame = 0;
  let wheelDistance = 0;
  let lastWheel = 0;

  const setProgress = (value, label) => {
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    loadingValue.textContent = `${percent}%`;
    loadingBar.style.setProperty('--loading-progress', `${percent}%`);
    loadingBar.setAttribute('aria-valuenow', String(percent));
    loadingStatus.textContent = label;
  };

  function updateUI(name) {
    screen = name;
    document.body.dataset.screen = name;
    menu.inert = name !== 'menu';
    for (const panel of panels) panel.inert = panel.id !== `s-${name}`;
  }

  async function downloadGroup(names, progressStart, progressEnd, label) {
    const responses = await Promise.all(names.map(async name => {
      const response = await fetch(paths[name], { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Video non disponibile: ${paths[name]}`);
      return { name, response, size: Number(response.headers.get('content-length')) || 1 };
    }));
    const total = responses.reduce((sum, item) => sum + item.size, 0);
    const loaded = new Map(responses.map(item => [item.name, 0]));

    await Promise.all(responses.map(async item => {
      if (!item.response.body) {
        const blob = await item.response.blob();
        sources.set(item.name, URL.createObjectURL(blob));
        loaded.set(item.name, blob.size);
        return;
      }
      const reader = item.response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded.set(item.name, loaded.get(item.name) + value.byteLength);
        const bytes = [...loaded.values()].reduce((sum, count) => sum + count, 0);
        setProgress(progressStart + (bytes / total) * (progressEnd - progressStart), label);
      }
      const blob = new Blob(chunks, { type: 'video/mp4' });
      sources.set(item.name, URL.createObjectURL(blob));
    }));
  }

  function waitFor(video, event) {
    return new Promise((resolve, reject) => {
      const ready = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(video.error || new Error('Impossibile preparare il video')); };
      const cleanup = () => {
        video.removeEventListener(event, ready);
        video.removeEventListener('error', failed);
      };
      video.addEventListener(event, ready, { once: true });
      video.addEventListener('error', failed, { once: true });
    });
  }

  function focalPoint(target) {
    if (!compactScene.matches) return 50;
    if (target === 'sinistra') return 60;
    if (target === 'destra') return 38;
    return 50;
  }

  function animateFocus(video, from, to) {
    cancelAnimationFrame(focusFrame);
    const tick = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      let t = Math.min(1, video.currentTime / duration);
      t = t * t * (3 - 2 * t);
      video.style.objectPosition = `${from + (to - from) * t}% 50%`;
      if (!video.paused && !video.ended) focusFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  async function play(name, fromFocus, toFocus) {
    const next = 1 - active;
    const incoming = videos[next];
    const outgoing = videos[active];
    incoming.pause();
    incoming.src = sources.get(name) || paths[name];
    incoming.style.objectPosition = `${fromFocus}% 50%`;
    incoming.load();
    await waitFor(incoming, 'canplay');
    incoming.classList.add('is-active');
    outgoing.classList.remove('is-active');
    outgoing.pause();
    outgoing.removeAttribute('src');
    outgoing.load();
    active = next;
    incoming.currentTime = 0;
    const ended = waitFor(incoming, 'ended');
    const playing = incoming.play();
    animateFocus(incoming, fromFocus, toFocus);
    await playing;
    await ended;
    incoming.style.objectPosition = `${toFocus}% 50%`;
  }

  async function transitionTo(target) {
    if (target === position || (target !== 'menu' && !['sinistra', 'destra'].includes(target))) return;
    if (busy) {
      queuedTarget = target;
      return;
    }
    busy = true;
    updateUI('moving');
    try {
      if (position !== 'menu') {
        await play(`${position}-reverse`, focalPoint(position), focalPoint('menu'));
        position = 'menu';
      }
      if (target !== 'menu') {
        await play(target, focalPoint('menu'), focalPoint(target));
        position = target;
      }
      updateUI(position);
    } catch (error) {
      console.error(error);
      updateUI(position);
    } finally {
      busy = false;
      if (queuedTarget && queuedTarget !== position) {
        const next = queuedTarget;
        queuedTarget = null;
        transitionTo(next);
      } else {
        queuedTarget = null;
      }
    }
  }

  async function enter() {
    if (screen !== 'welcome' || busy) return;
    if (reduceMotion) {
      position = 'menu';
      updateUI('menu');
      return;
    }
    busy = true;
    updateUI('moving');
    try {
      await play('intro', 50, 50);
      position = 'menu';
      updateUI('menu');
    } finally {
      busy = false;
    }
  }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-go]');
    if (nav) {
      transitionTo(nav.dataset.go);
      return;
    }
    if (event.target.closest('#s-welcome')) enter();
  });

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    lantern.style.setProperty('--lantern-x', `${event.clientX}px`);
    lantern.style.setProperty('--lantern-y', `${event.clientY}px`);
    lantern.classList.add('is-lit');
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => lantern.classList.remove('is-lit'));
  window.addEventListener('blur', () => lantern.classList.remove('is-lit'));

  let touchStart = null;
  menu.addEventListener('touchstart', event => { touchStart = event.touches[0] || null; }, { passive: true });
  menu.addEventListener('touchend', event => {
    if (!touchStart) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.clientX;
    const dy = end.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy)) transitionTo(dx > 0 ? 'sinistra' : 'destra');
  }, { passive: true });

  window.addEventListener('wheel', event => {
    if (screen !== 'menu' || event.ctrlKey || event.target.closest('#debug')) return;
    const now = performance.now();
    const primary = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (now - lastWheel > 230 || Math.sign(wheelDistance) !== Math.sign(primary)) wheelDistance = 0;
    lastWheel = now;
    wheelDistance += primary * (event.deltaMode === 0 ? 1 : 16);
    if (Math.abs(wheelDistance) >= 65) {
      transitionTo(wheelDistance < 0 ? 'sinistra' : 'destra');
      wheelDistance = 0;
    }
  }, { passive: true });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') transitionTo('menu');
    if (screen === 'menu' && event.key === 'ArrowLeft') transitionTo('sinistra');
    if (screen === 'menu' && event.key === 'ArrowRight') transitionTo('destra');
  });

  async function start() {
    try {
      setProgress(1, 'Preparazione dei video');
      if (location.protocol === 'file:') {
        for (const [name, path] of Object.entries(paths)) sources.set(name, path);
        setProgress(92, 'Apertura delle animazioni locali');
      } else {
        await downloadGroup(['intro', 'destra', 'sinistra'], 1, 92, 'Scaricamento delle animazioni');
      }
      const first = videos[active];
      first.src = sources.get('intro');
      first.load();
      await waitFor(first, 'loadeddata');
      first.currentTime = 0;
      first.classList.add('is-active');
      setProgress(100, 'Il prototipo è pronto');
      loading.classList.add('is-complete');
      loading.setAttribute('aria-busy', 'false');
      setTimeout(() => document.body.classList.add('ready'), 420);
      if (location.protocol !== 'file:') downloadGroup(['destra-reverse', 'sinistra-reverse'], 100, 100, 'Preparazione dei ritorni').catch(console.error);
    } catch (error) {
      console.error(error);
      loadingStatus.textContent = 'Connessione interrotta. Riprova per completare il caricamento.';
      loadingRetry.hidden = false;
    }
  }

  loadingRetry.addEventListener('click', () => location.reload());
  window.videoPrototype = { transitionTo, enter, sources, videos, get screen() { return screen; } };
  // Compatibilità con area personale e prenotazioni, che usano l'API pubblica del motore principale.
  window.barber = {
    goTo: transitionTo,
    enter,
    reset: () => location.reload(),
  };
  start();
})();
