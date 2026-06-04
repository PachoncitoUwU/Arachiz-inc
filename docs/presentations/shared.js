// Arachiz Presentation Engine v2
(function () {
  const slides  = Array.from(document.querySelectorAll('.slide'));
  const counter = document.getElementById('slide-counter');
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const progress= document.getElementById('progress');
  const total   = slides.length;
  let current   = 0;
  let animating = false;

  function goTo(n, dir) {
    if (n < 0 || n >= total || animating) return;
    animating = true;

    const prev = current;
    current = n;

    // Remove active, add exit on old slide
    slides[prev].classList.remove('active');
    slides[prev].classList.add('exit');

    // Activate new slide
    slides[current].classList.add('active');

    // Clean up exit class after transition
    setTimeout(() => {
      slides[prev].classList.remove('exit');
      animating = false;
    }, 580);

    // Update UI
    if (counter) counter.textContent = (current + 1) + ' / ' + total;
    if (prevBtn)  prevBtn.disabled  = current === 0;
    if (nextBtn)  nextBtn.disabled  = current === total - 1;
    if (progress) progress.style.width = ((current + 1) / total * 100) + '%';

    // Sync sidebar dots if present
    document.querySelectorAll('[data-slide]').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.slide) === current);
    });
  }

  // Button controls
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const map = {
      'ArrowRight': 1, 'ArrowDown': 1, ' ': 1,
      'ArrowLeft': -1, 'ArrowUp': -1,
    };
    if (map[e.key] !== undefined) { e.preventDefault(); goTo(current + map[e.key]); }
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End')  goTo(total - 1);
  });

  // Touch swipe
  let touchX = 0;
  document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) goTo(current + (dx < 0 ? 1 : -1));
  });

  // Sidebar items
  document.querySelectorAll('[data-slide]').forEach(el => {
    el.addEventListener('click', () => goTo(parseInt(el.dataset.slide)));
  });

  // Init
  goTo(0);

  // Expose for sidebar
  window._arachizGoTo = goTo;
})();
