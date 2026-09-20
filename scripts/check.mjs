import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderArticle } from './build.mjs';
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
