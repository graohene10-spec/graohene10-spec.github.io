import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderArticle } from './build.mjs';
import { convertLatexArticle } from './latex-article.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const item={slug:'current',title:'A < B & C',excerpt:'"Quoted"',tags:['数学 & 物理'],author:'Kerf',index:1,wordCount:350,minutes:1,body:'<p>Text.</p>'};
const html=renderArticle(item,{slug:'previous',title:'Previous'},{slug:'next',title:'Next'});
assert.match(html,/class="prev" href="\/writing\/previous\/" rel="prev"/);
assert.match(html,/class="next" href="\/writing\/next\/" rel="next"/);
assert.match(html,/A &lt; B &amp; C/);
assert.ok(html.includes(encodeURIComponent('数学 & 物理')));
const single=renderArticle(item);
assert.equal((single.match(/aria-disabled="true"/g)||[]).length,2);
assert.ok(!single.includes('rel="next"'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/articles.json'),'utf8'));
const pages=['index.html','404.html',...catalog.map(article=>`writing/${article.slug}/index.html`)];
let links=0;
for(const page of pages){
 const content=fs.readFileSync(path.join(root,page),'utf8');
 for(const match of content.matchAll(/(?:src|href)="([^"]+)"/g)){
  const target=match[1];if(/^(https?:|mailto:|#|data:)/.test(target))continue;
  const pathname=decodeURIComponent(target.split(/[?#]/)[0]);
  let file=pathname.startsWith('/')?path.join(root,pathname):path.resolve(root,path.dirname(page),pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  assert.ok(fs.existsSync(file),`${page}: missing ${target}`);links++;
 }
}
const katexCSS=fs.readFileSync(path.join(root,'assets/vendor/katex/katex.min.css'),'utf8');
for(const [,font] of katexCSS.matchAll(/url\(([^)]+)\)/g))assert.ok(fs.existsSync(path.join(root,'assets/vendor/katex',font.replace(/["']/g,''))),`Missing font: ${font}`);
console.log(`Passed: article navigation, boundaries, escaping, ${links} local links, and all math fonts.`);
for(const article of catalog.filter(a=>a.bodyFile.endsWith('.tex'))){
 const source=fs.readFileSync(path.join(root,'content',article.bodyFile),'utf8');
 const converted=convertLatexArticle(source);
 const document=source.split('\\begin{document}')[1].split('\\end{document}')[0];
 const displayDollars=(document.match(/\$\$[\s\S]*?\$\$/g)||[]).length;
 const expectedMath=(document.replace(/\$\$[\s\S]*?\$\$/g,'').match(/\$/g)||[]).length/2+displayDollars+(document.match(/\\\[/g)||[]).length+(document.match(/\\\(/g)||[]).length+(document.match(/\\begin\{(?:equation|align)\}/g)||[]).length;
 assert.equal(converted.stats.mathCount,expectedMath,'Every source formula must render');
 assert.equal(converted.stats.sections,(document.match(/\\section\{/g)||[]).length);
 assert.equal(converted.stats.referenceCount,(document.match(/\\eqref\{/g)||[]).length);
 const ids=[...converted.body.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'Unique section and equation anchors');
 for(const [,target] of converted.body.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(target),`Missing anchor ${target}`);
 assert.ok(!converted.body.includes('katex-error'));
 if(article.slug==='quantum-mechanics-introduction')assert.match(converted.body,/本文到此只保留复合空间的基本结构/);
 if(article.slug==='tensors-for-physics'){
  assert.match(converted.body,/改名时也不能让新的指标名称与同一项中已有的其他指标发生冲突/);
  assert.equal((converted.body.match(/<li>/g)||[]).length,converted.stats.sections+4,'All source list items and TOC entries');
  assert.match(converted.body,/class="tensor-diagram"/);
  assert.ok(!converted.body.includes('fancyhead'));
 }
 console.log(`Passed: ${article.slug}: ${JSON.stringify(converted.stats)}`);
}
