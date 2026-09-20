(() => {
  'use strict';
  const prose = document.querySelector('.article-prose');
  if (!prose) return;
  const progress = document.querySelector('.reading-progress');
  const readout = document.querySelector('[data-reading-progress]');
  let pending = false;
  function updateProgress() {
    const bounds = prose.getBoundingClientRect();
    const distance = Math.max(1, bounds.height - (innerHeight - 110));
    const value = Math.min(1, Math.max(0, (110 - bounds.top) / distance));
    progress?.style.setProperty('--read', `${value * 100}%`);
    if (readout) readout.textContent = `${Math.round(value * 100)}%`;
    pending = false;
  }
  function scheduleProgress() {
    if (!pending) { pending = true; requestAnimationFrame(updateProgress); }
  }
  addEventListener('scroll', scheduleProgress, { passive: true });
  addEventListener('resize', scheduleProgress);
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(prose, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      trust: false,
      strict: 'warn',
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    });
  }
  updateProgress();
  document.fonts?.ready.then(updateProgress);
})();
