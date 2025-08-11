
    /*
     * Fluidni horizontalni scroll (bez snapanja na cijeli slajd)
     * – Kotačić: pretvaramo vertikalni deltaY u horizontalno pomicanje (malo po malo).
     * – Lerp animacija (requestAnimationFrame) daje glatko “klizna vrata” osjećaj.
     * – Klik na navigaciju: glatko se pozicionira na točan slajd.
     * – Touch/drag: prirodno povlačenje lijevo/desno.
     */
    (() => {
      const slidesEl = document.getElementById('slides');
      const navLinks = Array.from(document.querySelectorAll('#navLinks a'));
      const logoLink = document.getElementById('logoLink');
      const loader = document.getElementById('loader');

  // 1) Parametri
const SCROLL_SENSITIVITY = 3.0;  // ok je
const SMOOTHING = 0.06;          // niže = dulje klizi prema targetu
const FRICTION = 0.965;          // bliže 1 = dulje klizi
const MAX_SPEED = 80;            // dopuštamo malo veću brzinu
let velocity = 0;


      const KEY_STEP_VW = 0.6;        // tipke lijevo/desno pomak za 60% širine ekrana

      let viewportW = () => window.innerWidth;
      let slideCount = 0;
      let maxScroll = 0;      // maksimalni X u px
      let target = 0;         // meta pozicija (scrollX)
      let current = 0;        // stvarna pozicija (lerp prema targetu)
      let rafId = null;

      const $slides = () => Array.from(document.querySelectorAll('.slide'));

      function measure() {
        slideCount = $slides().length;
        maxScroll = Math.max(0, slideCount * viewportW() - viewportW());
        clampTarget();
      }

      function clampTarget() {
        target = Math.max(0, Math.min(maxScroll, target));
      }

      function setTransform(x) {
        slidesEl.style.transform = `translate3d(${-x}px, 0, 0)`;
        updateActiveNav();
      }

      function updateActiveNav() {
        // koji je “dominantni” slajd u fokusu?
        const idx = Math.round(current / viewportW());
        navLinks.forEach(a => a.classList.toggle('active', Number(a.dataset.target) === idx));
      }

     function animate() {
  target += velocity;
  velocity *= FRICTION;
  if (target <= 0 || target >= maxScroll) {
  velocity *= 0.6;           // manji “odskok” na rubovima
}
if (Math.abs(velocity) < 0.02) velocity = 0;

  clampTarget();

  const diff = target - current;
  if (Math.abs(diff) < 0.1) {
    current = target;
  } else {
    current += diff * SMOOTHING;
  }

  setTransform(current);
  rafId = requestAnimationFrame(animate);
}


      function scrollBy(deltaPx) {
        target += deltaPx;
        clampTarget();
      }

      function scrollToSlide(index) {
        target = Math.max(0, Math.min(maxScroll, index * viewportW()));
      }
window.addEventListener('wheel', (e) => {
  e.preventDefault();
// 2) Kotačić -> brzina (zamijeni faktor)
velocity += e.deltaY * SCROLL_SENSITIVITY * 0.09;
  // limitiraj brzinu da ne poludi
  if (velocity >  MAX_SPEED) velocity =  MAX_SPEED;
  if (velocity < -MAX_SPEED) velocity = -MAX_SPEED;
}, { passive: false });
      // ===== Tipkovnica =====
      window.addEventListener('keydown', (e) => {
        const step = viewportW() * KEY_STEP_VW;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { scrollBy(+step); }
        if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { scrollBy(-step); }
        if (e.key === 'Home') { scrollToSlide(0); }
        if (e.key === 'End')  { scrollToSlide(slideCount - 1); }
      });

      // ===== Dodir / Drag =====
      let dragging = false;
      let startX = 0, startY = 0;
      let startTarget = 0;

      window.addEventListener('pointerdown', (e) => {
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        startTarget = target;
      });

      window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // ako je horizontalni pomak dominantan, tretiraj kao drag
        if (Math.abs(dx) > Math.abs(dy)) {
          e.preventDefault();
          target = startTarget - dx; // povlačenje lijevo -> ide udesno
          clampTarget();
        }
      }, { passive: false });

      window.addEventListener('pointerup', () => { dragging = false; });
      window.addEventListener('pointercancel', () => { dragging = false; });

      // ===== Navigacija klikom =====
      navLinks.forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const t = Number(a.dataset.target || 0);
        if (!Number.isNaN(t)) scrollToSlide(t);
      }));
      document.body.addEventListener('click', (e) => {
        const targetEl = e.target.closest('[data-target]');
        if (!targetEl) return;
        e.preventDefault();
        const t = Number(targetEl.dataset.target);
        if (!Number.isNaN(t)) scrollToSlide(t);
      });
      logoLink.addEventListener('click', (e) => { e.preventDefault(); scrollToSlide(0); });

      // ===== Resize =====
      window.addEventListener('resize', () => {
        const ratio = maxScroll === 0 ? 0 : (current / maxScroll);
        measure();
        // zadrži približno isti relativni položaj nakon promjene širine
        current = ratio * maxScroll;
        target = current;
        setTransform(current);
      });

      // ===== Loader =====
      function hideLoader() {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 600);
      }

      // init
      measure();
      setTransform(0);
      rafId = requestAnimationFrame(animate);
      window.addEventListener('load', () => setTimeout(hideLoader, 400));
    })();