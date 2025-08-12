/* 0) Hamburger */
document.getElementById('hamburgerBtn')?.addEventListener('click', function () {
  this.classList.toggle('open');
  document.getElementById('navLinks')?.classList.toggle('active');
});

const isMobile = window.innerWidth <= 900;

/* 1) Horizontal slider SAMO na desktopu */
if (!isMobile) {
  (() => {
    const slidesEl = document.getElementById('slides');
    const navRoot  = document.getElementById('navLinks');
    const logoLink = document.getElementById('logoLink');
    if (!slidesEl) return;

    const sliderWrap = slidesEl.parentElement || slidesEl;

    // Parametri
    const SCROLL_SENSITIVITY = 2.0;
    const SMOOTHING = 0.06;
    const FRICTION = 0.965;
    const MAX_SPEED = 60;
    const KEY_STEP_VW = 0.6;

    let velocity = 0;
    let slideCount = 0;
    let maxScroll = 0;
    let target = 0;
    let current = 0;

    const $slides = () => Array.from(document.querySelectorAll('.slide'));
    const viewportW = () => window.innerWidth;

    function measure() {
      slideCount = $slides().length;
      maxScroll = Math.max(0, slideCount * viewportW() - viewportW());
      clampTarget();
    }
    function clampTarget() { target = Math.max(0, Math.min(maxScroll, target)); }
    function setTransform(x) {
      slidesEl.style.transform = `translate3d(${-x}px,0,0)`;
      updateActiveNav();
    }
    function updateActiveNav() {
      if (!navRoot) return;
      const idx = Math.round(current / viewportW());
      navRoot.querySelectorAll('a[data-target]').forEach(a =>
        a.classList.toggle('active', Number(a.dataset.target) === idx)
      );
    }
    function animate() {
      target += velocity;
      velocity *= FRICTION;
      if (target <= 0 || target >= maxScroll) velocity *= 0.6;
      if (Math.abs(velocity) < 0.02) velocity = 0;

      clampTarget();
      const diff = target - current;
      current = Math.abs(diff) < 0.1 ? target : current + diff * SMOOTHING;
      setTransform(current);
      requestAnimationFrame(animate);
    }
    function scrollBy(dx) { target += dx; clampTarget(); }
    function scrollToSlide(i) { target = Math.max(0, Math.min(maxScroll, i * viewportW())); }

    // Wheel samo nad sliderom
    sliderWrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      velocity += e.deltaY * SCROLL_SENSITIVITY * 0.09;
      velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velocity));
    }, { passive: false });

    // Drag
    let dragging = false, startX = 0, startY = 0, startTarget = 0;
    sliderWrap.addEventListener('pointerdown', (e) => {
      dragging = true; startX = e.clientX; startY = e.clientY; startTarget = target;
      sliderWrap.setPointerCapture?.(e.pointerId);
    });
    sliderWrap.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); target = startTarget - dx; clampTarget(); }
    }, { passive: false });
    const endDrag = (e) => { dragging = false; sliderWrap.releasePointerCapture?.(e.pointerId); };
    sliderWrap.addEventListener('pointerup', endDrag);
    sliderWrap.addEventListener('pointercancel', endDrag);
    sliderWrap.addEventListener('pointerleave', () => { dragging = false; });

    // Tipkovnica
    window.addEventListener('keydown', (e) => {
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const step = viewportW() * KEY_STEP_VW;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') scrollBy(+step);
      if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   scrollBy(-step);
      if (e.key === 'Home') scrollToSlide(0);
      if (e.key === 'End')  scrollToSlide($slides().length - 1);
    });

    // Navigacija klik
    document.getElementById('navLinks')?.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-target]'); if (!a) return;
      e.preventDefault(); const t = Number(a.dataset.target || 0);
      if (!Number.isNaN(t)) scrollToSlide(t);
    });

    document.getElementById('logoLink')?.addEventListener('click', (e) => {
      e.preventDefault(); scrollToSlide(0);
    });

    // Resize
    window.addEventListener('resize', () => {
      const ratio = maxScroll === 0 ? 0 : (current / maxScroll);
      measure(); current = ratio * maxScroll; target = current; setTransform(current);
    });

    // Init
    measure();
    setTransform(0);
    requestAnimationFrame(animate);
  })();
} else {
  // Mobitel: omogućimo normalni vertical scroll
  const viewport = document.getElementById('viewport');
  if (viewport) { viewport.style.overflowY = 'auto'; viewport.style.overflowX = 'hidden'; }
}

/* 2) Falling letters (uvijek) */
(() => {
  const titles = document.querySelectorAll('.title');
  titles.forEach(title => {
    const text = title.textContent;
    title.textContent = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.setProperty('--char-index', i);
      title.appendChild(span);
    });
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('animate'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.3 });
  titles.forEach(t => observer.observe(t));
})();
/* ===============================
   3) Lightbox (uvijek radi)
   =============================== */
(() => {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-header">
      <div class="lb-title"></div>
      <button class="lightbox-close" aria-label="Zatvori">✕</button>
    </div>
    <div class="lightbox-nav">
      <button class="lb-btn lb-prev" aria-label="Prethodna">‹</button>
      <button class="lb-btn lb-next" aria-label="Sljedeća">›</button>
    </div>
    <img class="lightbox-img" alt="">
  `;
  document.body.appendChild(lb);

  const imgEl = lb.querySelector('.lightbox-img');
  const titleEl = lb.querySelector('.lb-title');
  const btnPrev = lb.querySelector('.lb-prev');
  const btnNext = lb.querySelector('.lb-next');
  const btnClose = lb.querySelector('.lightbox-close');

  let images = [];
  let idx = 0;

  function show(i) {
    idx = (i + images.length) % images.length;
    imgEl.src = images[idx];
  }
  function open(imagesArr, title, startIndex = 0) {
    images = imagesArr;
    titleEl.textContent = title || '';
    show(startIndex);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;

    const imgs = (card.getAttribute('data-images') || '')
      .split('|').map(s => s.trim()).filter(Boolean);
    if (!imgs.length) return;

    const title = card.getAttribute('data-title') || '';
    open(imgs, title, 0);
  });

  btnPrev.addEventListener('click', () => show(idx - 1));
  btnNext.addEventListener('click', () => show(idx + 1));
  btnClose.addEventListener('click', close);

  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft')  show(idx - 1);
  });

  let sx = 0, sy = 0, dragging = false;
  lb.addEventListener('pointerdown', (e) => { dragging = true; sx = e.clientX; sy = e.clientY; });
  lb.addEventListener('pointerup',   (e) => {
    if (!dragging) return; dragging = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx < 0) show(idx + 1); else show(idx - 1);
    }
  });
})();

(() => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  function hideLoader() {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 600);
  }
  window.addEventListener('load', () => setTimeout(hideLoader, 400));
})();
