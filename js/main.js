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
  /* Header: menu toggle                                                 */
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
  /* Opening scene: the shutter rolls up, then the camera moves in        */
  /* through the service window as the page scrolls.                     */
  /* Depth is done with 2D transforms: each layer is scaled and moved as  */
  /* a 3D camera would see it at its depth, which renders reliably on     */
  /* every phone (no preserve-3d).                                        */
  /* ------------------------------------------------------------------ */

  const scene = document.querySelector('[data-scene]');
  if (scene) initScene(scene);

  function initScene(scene) {
    const stage = scene.querySelector('[data-scene-stage]');
    const frame = scene.querySelector('[data-scene-frame]');
    const layers = Array.from(scene.querySelectorAll('.scene__layer')).map((el) => ({
      el,
      z: parseFloat(el.dataset.depth) || 0,
    }));
    const shutter = scene.querySelector('[data-scene-shutter]');
    const name = scene.querySelector('[data-scene-name]');
    const glow = scene.querySelector('[data-scene-glow]');
    const fade = scene.querySelector('[data-scene-fade]');
    const intro = scene.querySelector('[data-scene-intro]');
    const cue = scene.querySelector('[data-scene-cue]');

    const P = 1000;                // camera perspective, px
    // The service window in the photograph, as fractions of its width and height
    // (centre x, centre y, width, height). Matches .scene__shutter in the CSS.
    const WINDOW = { x: 0.5537, y: 0.3307, w: 0.201, h: 0.2331 };

    // Phases, as fractions of the scroll through the scene.
    const SHUTTER = [0.04, 0.3];   // the shutter rolls up
    const TRAVEL = [0.1, 0.92];    // the camera moves to the window
    const PAN = [0.08, 0.7];       // the window drifts to the centre
    const MAX_ZOOM = 7;            // beyond this the photo turns soft
    const INTRO_MS = 1800;
    const INTRO_PULLBACK = -180;

    let geometry = null;
    let target = 0;
    let progress = 0;
    let pointerTarget = { x: 0, y: 0 };
    let pointer = { x: 0, y: 0 };
    let introStart = 0;
    let introT = 1;
    let frameQueued = false;

    const motionOn = () => !reduceMotion.matches;

    function measure() {
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      // offset* ignore transforms: this is the photo as laid out at rest.
      const fw = frame.offsetWidth;
      const fh = frame.offsetHeight;
      const windowX = frame.offsetLeft + WINDOW.x * fw - sw / 2;
      const windowY = frame.offsetTop + WINDOW.y * fh - sh / 2;
      const fill = Math.max((sw * 1.05) / (WINDOW.w * fw), (sh * 1.05) / (WINDOW.h * fh));
      geometry = { windowX, windowY, scaleEnd: clamp(fill, 1.01, MAX_ZOOM) };
    }

    function readScroll() {
      const distance = scene.offsetHeight - stage.offsetHeight;
      const top = scene.getBoundingClientRect().top;
      target = distance > 0 ? clamp(-top / distance) : 0;
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
      const travel = Math.pow(clamp((p - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0])), 1.35);
      const zoom = Math.pow(geometry.scaleEnd, travel);
      const pan = easeInOut(clamp((p - PAN[0]) / (PAN[1] - PAN[0])));
      const settle = 1 - smoothstep(0, 0.3, p);

      // The camera: its distance (camZ) and its sideways offset (tx, ty).
      const camZ = P * (1 - 1 / zoom) + (1 - arrive) * INTRO_PULLBACK;
      const tx = -geometry.windowX * pan - pointer.x * 18 * settle - (1 - arrive) * 60;
      const ty = -geometry.windowY * pan - pointer.y * 10 * settle;

      layers.forEach(({ el, z }) => {
        const depth = P - z - camZ;
        if (depth < 30) {
          el.style.visibility = 'hidden';
          return;
        }
        const scale = (P - z) / depth;
        const shift = (P / (P - z)) * scale;
        el.style.visibility = '';
        el.style.transform =
          `translate3d(${(tx * shift).toFixed(2)}px, ${(ty * shift).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      });

      if (shutter) {
        const open = easeInOut(clamp((p - SHUTTER[0]) / (SHUTTER[1] - SHUTTER[0])));
        shutter.style.transform = `translate3d(0, ${(-open * 100).toFixed(2)}%, 0)`;
      }
      if (name) {
        name.style.opacity = ((1 - smoothstep(0.02, 0.12, p)) * smoothstep(0.2, 0.8, introT)).toFixed(3);
      }
      if (glow) glow.style.opacity = smoothstep(0.2, 0.8, p).toFixed(3);
      if (fade) fade.style.opacity = smoothstep(0.84, 0.97, p).toFixed(3);
      if (intro) {
        const shown = (1 - smoothstep(0, 0.08, p)) * smoothstep(0.35, 0.9, introT);
        intro.style.opacity = shown.toFixed(3);
        intro.style.transform = `translateY(${((1 - smoothstep(0.35, 0.9, introT)) * 16).toFixed(2)}px)`;
        intro.style.visibility = shown <= 0.01 ? 'hidden' : '';
      }
      if (cue) cue.style.opacity = ((1 - smoothstep(0, 0.04, p)) * smoothstep(0.7, 1, introT)).toFixed(3);

      const settling =
        introT < 1 ||
        progress !== target ||
        Math.abs(pointerTarget.x - pointer.x) > 0.001 ||
        Math.abs(pointerTarget.y - pointer.y) > 0.001;
      if (settling) queue();
    }

    function clearMotion() {
      layers.forEach(({ el }) => {
        el.style.transform = '';
        el.style.visibility = '';
      });
      [shutter, name, glow, fade, intro, cue].forEach((el) => {
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
