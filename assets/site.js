(() => {
  'use strict';
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try { preference = localStorage.getItem('kerf-theme'); } catch {}
  if (!['light', 'dark'].includes(preference)) preference = null;
  const preferredTheme = () => preference || (systemTheme.matches ? 'dark' : 'light');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#14171d' : '#fafbfc');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = `切换到${dark ? '浅' : '深'}色模式`;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.setAttribute('aria-pressed', String(dark));
    });
  }
  applyTheme(preferredTheme());
  systemTheme.addEventListener('change', () => { if (!preference) applyTheme(preferredTheme()); });
  window.addEventListener('storage', event => {
    if (event.key !== 'kerf-theme') return;
    preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
    applyTheme(preferredTheme());
  });
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(preferredTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('kerf-theme', preference); } catch {}
      applyTheme(preference);
    }));

    const filters = [...document.querySelectorAll('[data-tag-filter]')];
    const cards = [...document.querySelectorAll('[data-article-tags]')];
    if (!filters.length) return;
    function filterArticles(tag, updateUrl = false) {
      if (!filters.some(button => button.dataset.tagFilter === tag)) tag = '';
      let visible = 0;
      cards.forEach(card => {
        const show = !tag || JSON.parse(card.dataset.articleTags).includes(tag);
        card.hidden = !show;
        if (show) visible++;
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tagFilter === tag)));
      const status = document.getElementById('writing-status');
      if (status) status.textContent = `${tag ? tag + ' · ' : ''}${visible} 篇文字`;
      if (updateUrl) {
        const url = new URL(location.href);
        if (tag) url.searchParams.set('tag', tag); else url.searchParams.delete('tag');
        url.hash = 'writing';
        history.replaceState(null, '', url);
      }
    }
    filters.forEach(button => button.addEventListener('click', () => filterArticles(button.dataset.tagFilter, true)));
    const syncFilter = () => filterArticles(new URL(location.href).searchParams.get('tag') || '');
    window.addEventListener('popstate', syncFilter);
    syncFilter();
  });
})();
