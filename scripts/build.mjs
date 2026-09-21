import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertLatexArticle } from './latex-article.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://graohene10-spec.github.io';
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const logo = `<svg class="site-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 27C9 13 19 6 32 9M8 31C22 32 31 22 31 8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M10 11C11 23 19 29 28 28" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle class="mark-dot" cx="14" cy="20" r="3.2" fill="#245af3"/></svg>`;
const themeButton = `<button class="theme-toggle" type="button" data-theme-toggle aria-label="切换到深色模式" title="切换到深色模式" aria-pressed="false"><svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.2 14.2A8.5 8.5 0 0 1 9.8 3.8a8.5 8.5 0 1 0 10.4 10.4Z"/></svg><svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button>`;
export function header(active = 'about', home = false) {
  const prefix = home ? '' : '/';
  return `<header class="site-header"><div class="header-inner"><a class="wordmark" href="/" aria-label="Kerf 个人主页">${logo}<span>Kerf<span class="blue-dot">.</span></span></a><nav aria-label="主要导航">${[['about','关于'],['projects','项目'],['writing','文字']].map(([id,label])=>`<a class="nav-link" href="${prefix}#${id}"${active===id?' aria-current="location"':''}>${label}</a>`).join('')}<a class="nav-github" href="https://github.com/graohene10-spec" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>${themeButton}</nav></div></header>`;
}
function footer(article = false) {
  return `<footer class="site-footer container"><div><a class="footer-name" href="/#about">Kerf<span class="blue-dot">.</span></a><span>© 2026</span>${article?'<span class="article-footer-progress">已读 <span data-reading-progress>0%</span></span>':''}</div><div class="footer-links"><a href="https://github.com/graohene10-spec" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="${article?'#article-title':'#about'}">回到顶部 ↑</a></div></footer>`;
}
const tagLink = tag => `/?tag=${encodeURIComponent(tag)}#writing`;
const articleUrl = article => `/writing/${article.slug}/`;
export function renderArticle(article, previous, next) {
  const name=escapeHtml(article.title), author=escapeHtml(article.author || 'Kerf');
  const navigation=(item, direction)=>item?`<a class="${direction}" href="${articleUrl(item)}" rel="${direction}"><small>${direction==='prev'?'← 上一篇':'下一篇 →'}</small><strong>${escapeHtml(item.title)}</strong></a>`:`<span class="${direction}" aria-disabled="true"><small>${direction==='prev'?'← 上一篇':'下一篇 →'}</small><strong>${direction==='prev'?'这是第一篇文字':'暂无下一篇'}</strong></span>`;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fafbfc"><title>${name} · Kerf</title><meta name="description" content="${escapeHtml(article.excerpt)}"><meta name="author" content="${author}"><link rel="canonical" href="${base}${articleUrl(article)}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><script src="/assets/site.js"></script><link rel="stylesheet" href="/assets/home.css"><link rel="stylesheet" href="/assets/writing.css"><link rel="stylesheet" href="/assets/vendor/katex/katex.min.css"><script src="/assets/vendor/katex/katex.min.js" defer></script><script src="/assets/vendor/katex/auto-render.min.js" defer></script><script src="/assets/reading.js" defer></script></head>
<body><a class="skip-link" href="#article-content">跳到文章正文</a><div class="reading-progress" aria-hidden="true"></div>${header('writing')}
<main class="article-shell"><a class="article-back" href="/#writing"><span aria-hidden="true">←</span> 返回文字列表</a><article aria-labelledby="article-title"><header class="article-heading"><div class="eyebrow">WRITING / ${String(article.index+1).padStart(2,'0')}</div><h1 id="article-title">${name}</h1><div class="article-metadata"><span>${author}</span><span class="meta-separator" aria-hidden="true"></span><span>${article.wordCount.toLocaleString('zh-CN')} 字</span><span class="meta-separator" aria-hidden="true"></span><span>约 ${article.minutes} 分钟</span><div class="article-tags">${article.tags.map(tag=>`<a class="article-tag" href="${tagLink(tag)}" aria-label="查看${escapeHtml(tag)}分类">${escapeHtml(tag)}</a>`).join('')}</div></div></header>
<div class="article-prose" id="article-content">${article.body}</div><div class="article-end" aria-label="文章结束">END</div></article>
<nav class="article-pagination" aria-label="文章切换">${navigation(previous,'prev')}${navigation(next,'next')}</nav><div class="article-return"><a href="/#writing">查看全部文字</a></div></main>${footer(true)}</body></html>\n`;
}

export function buildSite() {
  const contentRoot=path.join(root,'content');
  const catalog=JSON.parse(fs.readFileSync(path.join(contentRoot,'articles.json'),'utf8'));
  const slugs=new Set();
  const articles=catalog.map((item,index)=>{
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) throw new Error(`Invalid or duplicate slug: ${item.slug}`);
    slugs.add(item.slug);
    if (!item.title || !Array.isArray(item.tags) || !item.tags.every(tag=>typeof tag==='string'&&tag.trim())) throw new Error('Article title and tags are required');
    const file=path.resolve(contentRoot,item.bodyFile);
    if(!file.startsWith(contentRoot+path.sep)) throw new Error('Article source must be inside content/');
    const source=fs.readFileSync(file,'utf8');
    const converted=file.endsWith('.tex')?convertLatexArticle(source):null;
    const body=converted?.body ?? source;
    const plain=body.replace(/<[^>]+>/g,'').replace(/&(?:amp|quot|#39|lt|gt);/g,'x').replace(/\s/g,'');
    const wordCount=converted?.wordCount ?? Array.from(plain).length;
    return {...item,index,body,wordCount,minutes:Math.max(1,Math.ceil(wordCount/350))};
  });
  const tags=[...new Set(articles.flatMap(article=>article.tags))];
  const cards=articles.map(article=>`<article class="writing-card" data-article-tags="${escapeHtml(JSON.stringify(article.tags))}"><a class="writing-card-link" href="${articleUrl(article)}"><span class="writing-index" aria-hidden="true">${String(article.index+1).padStart(2,'0')}</span><div><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.excerpt)}</p><div class="writing-card-meta">${article.tags.map(tag=>`<span class="article-tag">${escapeHtml(tag)}</span>`).join('')}<span class="reading-estimate">${article.wordCount.toLocaleString('zh-CN')} 字 <span aria-hidden="true">·</span> 约 ${article.minutes} 分钟</span></div></div><span class="writing-enter" aria-hidden="true"><span>阅读全文</span><span class="arrow">↗</span></span></a></article>`).join('\n');
  const writing=`<!-- WRITING:START -->
    <section id="writing" class="writing-section" aria-labelledby="writing-title"><div class="section-heading"><div><div class="eyebrow">WRITING & NOTES</div><h2 id="writing-title">文字<span class="project-count" aria-label="${articles.length} 篇文字">${String(articles.length).padStart(2,'0')}</span></h2></div><p>在这里，留下一些文字。</p></div><div class="writing-toolbar"><div class="tag-filters" role="group" aria-label="按标签筛选文章"><button class="tag-filter" type="button" data-tag-filter="" aria-pressed="true">全部</button>${tags.map(tag=>`<button class="tag-filter" type="button" data-tag-filter="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(tag)}</button>`).join('')}</div><p class="writing-status" id="writing-status" role="status" aria-live="polite">${articles.length} 篇文字</p></div><div class="writing-list">${cards}</div></section>
    <!-- WRITING:END -->`;
  const homeFile=path.join(root,'index.html');
  let home=fs.readFileSync(homeFile,'utf8').replace(/<header class="site-header">[\s\S]*?<\/header>/,header('about',true));
  if(home.includes('<!-- WRITING:START -->')) home=home.replace(/<!-- WRITING:START -->[\s\S]*?<!-- WRITING:END -->/,writing);
  else home=home.replace('  </main>',`    ${writing}\n  </main>`);
  fs.writeFileSync(homeFile,home);
  articles.forEach((article,index)=>{
    const destination=path.join(root,'writing',article.slug);fs.mkdirSync(destination,{recursive:true});
    fs.writeFileSync(path.join(destination,'index.html'),renderArticle(article,articles[index-1],articles[index+1]));
  });
  const errorFile=path.join(root,'404.html');
  let errorPage=fs.readFileSync(errorFile,'utf8').replace(/<header class="site-header">[\s\S]*?<\/header>/,header(''));
  if(!errorPage.includes('/assets/site.js')) errorPage=errorPage.replace('</head>','<script src="/assets/site.js"></script><link rel="stylesheet" href="/assets/writing.css"></head>');
  fs.writeFileSync(errorFile,errorPage);
  console.log(`Built ${articles.length} article(s), homepage cards and site navigation.`);
  return articles;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildSite();
