/* On The Rocks Mobile Bar: the opening scene, the menu and the booking form. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smoothstep = (a, b, v) => {
    const t = clamp((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ------------------------------------------------------------------ */
  /* Header: menu toggle, and its look while it sits over the scene      */
  /* ------------------------------------------------------------------ */

  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('site-nav');

  const setNavOpen = (open) => {
    if (!toggle || !header) return;
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-nav-open', open);
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      setNavOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setNavOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNavOpen(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Opening scene: a camera that moves from outside the bar, through    */
  /* its service window, as the page scrolls                             */
  /* ------------------------------------------------------------------ */

  const scene = document.querySelector('[data-scene]');
  if (scene) initScene(scene);

  function initScene(scene) {
    const stage = scene.querySelector('[data-scene-stage]');
    const world = scene.querySelector('[data-scene-world]');
    const bar = scene.querySelector('[data-scene-bar]');
    const words = Array.from(scene.querySelectorAll('[data-scene-word]'));
    const nearLights = scene.querySelector('[data-scene-lights-near]');
    const glow = scene.querySelector('[data-scene-glow]');
    const dusk = scene.querySelector('[data-scene-dusk]');
    const intro = scene.querySelector('[data-scene-intro]');
    const cue = scene.querySelector('[data-scene-cue]');
    const inside = scene.querySelector('[data-scene-inside]');
    const plate = scene.querySelector('[data-scene-plate]');

    const perspective = parseFloat(getComputedStyle(root).getPropertyValue('--scene-perspective')) || 1000;
    const nearZ = nearLights ? parseFloat(getComputedStyle(nearLights).getPropertyValue('--z')) || 0 : 0;

    // Phases of the camera move, as fractions of the scroll through the scene.
    const TRAVEL = [0.04, 0.92]; // camera leaves its seat .. reaches the window
    const PAN = [0.04, 0.7];     // window drifts to the centre of the view
    const HEADER_OVER_UNTIL = 0.3;
    const INTRO_MS = 1800;       // the arrival animation on load
    const INTRO_PULLBACK = -220;

    let geometry = null;
    let target = 0;
    let progress = 0;
    let pointerTarget = { x: 0, y: 0 };
    let pointer = { x: 0, y: 0 };
    let introStart = 0;
    let introT = 1;
    let frameQueued = false;

    const motionOn = () => !reduceMotion.matches;

    loadSkyVideo();

    function loadSkyVideo() {
      const src = scene.dataset.skyVideo;
      if (!src || !plate || !motionOn()) return;
      const video = document.createElement('video');
      video.className = 'scene__sky-video';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('aria-hidden', 'true');
      video.src = src;
      video.addEventListener('error', () => video.remove(), { once: true });
      plate.insertBefore(video, plate.querySelector('.scene__haze'));
    }

    function measure() {
      const styles = getComputedStyle(bar);
      const wx = parseFloat(styles.getPropertyValue('--wx'));
      const wy = parseFloat(styles.getPropertyValue('--wy'));
      const ww = parseFloat(styles.getPropertyValue('--ww'));
      const wh = parseFloat(styles.getPropertyValue('--wh'));
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      // offset* ignore transforms, so this is the bar as laid out at depth 0.
      const windowX = bar.offsetLeft + wx * bar.offsetWidth - sw / 2;
      const windowY = bar.offsetTop + wy * bar.offsetHeight - sh / 2;
      // How much bigger the window must get to fill the view.
      const fill = Math.max((sw * 1.1) / (ww * bar.offsetWidth), (sh * 1.1) / (wh * bar.offsetHeight));
      const scaleEnd = Math.min(Math.max(fill, 1.01), 1 / (1 - 0.94));
      geometry = { windowX, windowY, scaleEnd };
    }

    function readScroll() {
      const distance = scene.offsetHeight - stage.offsetHeight;
      const top = scene.getBoundingClientRect().top;
      target = distance > 0 ? clamp(-top / distance) : 0;
      if (header) {
        const overScene = scene.getBoundingClientRect().bottom > header.offsetHeight && target < HEADER_OVER_UNTIL;
        header.classList.toggle('is-over-scene', overScene);
      }
    }

    function queue() {
      if (frameQueued) return;
      frameQueued = true;
      requestAnimationFrame(render);
    }

    function render(now) {
      frameQueued = false;
      if (!geometry) measure();

      if (!motionOn()) {
        clearMotion();
        return;
      }

      if (introT < 1) introT = clamp((now - introStart) / INTRO_MS);
      progress += (target - progress) * 0.14;
      if (Math.abs(target - progress) < 0.0004) progress = target;
      pointer.x += (pointerTarget.x - pointer.x) * 0.08;
      pointer.y += (pointerTarget.y - pointer.y) * 0.08;

      const p = progress;
      const arrive = easeOut(introT);
      // Zoom grows geometrically so the approach feels steady, not rushed at the end.
      const travel = Math.pow(clamp((p - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0])), 1.35);
      const scale = Math.pow(geometry.scaleEnd, travel);
      const pan = easeInOut(clamp((p - PAN[0]) / (PAN[1] - PAN[0])));

      // Camera: pull in from further back on load, then travel to the window.
      const camZ = perspective * (1 - 1 / scale) + (1 - arrive) * INTRO_PULLBACK;
      const tx = -geometry.windowX * pan;
      const ty = -geometry.windowY * pan;
      // Seated outside: looking slightly up, turning a little with the pointer.
      const settle = 1 - smoothstep(0, 0.35, p);
      const rotY = pointer.x * 5 * settle;
      const rotX = (2 - pointer.y * 3) * settle;
      world.style.transform =
        `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${camZ.toFixed(2)}px) ` +
        `rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg)`;

      // The title parts like curtains, then fades.
      const part = smoothstep(0, 0.45, p);
      const wordsOpacity = (1 - smoothstep(0.22, 0.48, p)) * smoothstep(0.1, 0.7, introT);
      words.forEach((word) => {
        const dir = Number(word.dataset.sceneWord) || 0;
        const rise = (1 - arrive) * 48;
        word.style.transform = `translate3d(${(dir * part * 18).toFixed(3)}vw, ${rise.toFixed(2)}px, 0)`;
        word.style.opacity = wordsOpacity.toFixed(3);
      });

      // Near string lights pass overhead and are gone before the camera reaches them.
      if (nearLights) {
        const reach = perspective - nearZ;
        const lightsOpacity = 1 - smoothstep(reach * 0.35, reach * 0.75, camZ);
        nearLights.style.opacity = lightsOpacity.toFixed(3);
        nearLights.style.visibility = lightsOpacity <= 0.01 ? 'hidden' : '';
      }

      if (glow) glow.style.opacity = smoothstep(0.3, 0.85, p).toFixed(3);
      if (dusk) dusk.style.opacity = (smoothstep(0.15, 0.8, p) * 0.6).toFixed(3);

      if (intro) {
        const introOpacity = (1 - smoothstep(0, 0.12, p)) * smoothstep(0.35, 0.9, introT);
        intro.style.opacity = introOpacity.toFixed(3);
        intro.style.transform = `translateY(${((1 - smoothstep(0.35, 0.9, introT)) * 16 - p * 120).toFixed(2)}px)`;
        intro.style.visibility = introOpacity <= 0.01 ? 'hidden' : '';
      }
      if (cue) cue.style.opacity = ((1 - smoothstep(0, 0.05, p)) * smoothstep(0.7, 1, introT)).toFixed(3);
      if (inside) inside.style.opacity = smoothstep(0.82, 0.97, p).toFixed(3);

      const settling =
        introT < 1 ||
        progress !== target ||
        Math.abs(pointerTarget.x - pointer.x) > 0.001 ||
        Math.abs(pointerTarget.y - pointer.y) > 0.001;
      if (settling) queue();
    }

    function clearMotion() {
      world.style.transform = '';
      [glow, dusk, intro, cue, inside, nearLights, ...words].forEach((el) => {
        if (!el) return;
        el.style.opacity = '';
        el.style.transform = '';
        el.style.visibility = '';
      });
    }

    function onResize() {
      measure();
      readScroll();
      queue();
    }

    window.addEventListener('scroll', () => { readScroll(); queue(); }, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);
    reduceMotion.addEventListener?.('change', onResize);

    window.addEventListener('pointermove', (event) => {
      if (!finePointer.matches) return;
      pointerTarget = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
      queue();
    }, { passive: true });

    // First frame: set the starting state, then let the stage fade in.
    measure();
    readScroll();
    progress = target;
    if (motionOn() && target < 0.02) {
      introT = 0;
      introStart = performance.now();
    }
    render(performance.now());
    root.classList.remove('scene-pending');
    if (introT < 1) introStart = performance.now();
    queue();
  }

  /* ------------------------------------------------------------------ */
  /* Booking form                                                        */
  /* ------------------------------------------------------------------ */

  const form = document.querySelector('[data-booking-form]');
  if (form) initForm(form);

  function initForm(form) {
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[type="submit"]');
    const date = form.querySelector('input[type="date"]');

    if (date) {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      date.min = local.toISOString().slice(0, 10);
    }

    const show = (kind, message) => {
      status.dataset.kind = kind;
      status.textContent = message;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      if (form.action.includes('REPLACE_WITH')) {
        show('notice', "Online booking isn't switched on yet. For now, please message us on Facebook or Instagram with your event type, date and package.");
        return;
      }

      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      show('', '');

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Form service answered ${response.status}`);
        form.reset();
        show('success', "Thanks! Your inquiry is in, and we'll get back to you about your date.");
      } catch (error) {
        show('error', 'Your inquiry didn’t send. Please try again, or message us on Facebook or Instagram.');
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Small things                                                        */
  /* ------------------------------------------------------------------ */

  // "Ask about Gold" fills in the package on the form.
  document.querySelectorAll('[data-package]').forEach((link) => {
    link.addEventListener('click', () => {
      const select = document.getElementById('f-package');
      if (select) select.value = link.dataset.package;
    });
  });

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
