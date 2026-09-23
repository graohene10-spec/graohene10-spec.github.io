import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const katex = require('../assets/vendor/katex/katex.min.js');
const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// A deliberately bounded importer: unsupported source constructs fail the build.
export function convertLatexArticle(source) {
  const macros = {};
  const argument = (text, start) => {
    if (text[start] !== '{') throw new Error(`Expected argument near ${text.slice(start, start + 60)}`);
    let depth = 1, end = start + 1;
    while (end < text.length && depth) {
      if (text[end] === '\\') { end += 2; continue; }
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
      end++;
    }
    if (depth) throw new Error('Unclosed LaTeX argument');
    return { value: text.slice(start + 1, end - 1), end };
  };
  for (const m of source.matchAll(/\\newcommand\{(\\\w+)\}(?:\[\d\])?/g)) {
    if (m[1] !== '\\important') macros[m[1]] = argument(source, m.index + m[0].length).value;
  }
  for (const m of source.matchAll(/\\DeclareMathOperator\{(\\\w+)\}\{([^}]+)\}/g)) macros[m[1]] = `\\operatorname{${m[2]}}`;
  const document = source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (!document) throw new Error('Missing LaTeX document');
  const input = document[1].replace(/(?<!\\)%[^\n]*/g, '').replace(/\\maketitle|\\vspace\{[^}]*\}|\\Needspace\{[^}]*\}|\\thispagestyle\{[^}]*\}|\\noindent/g, '')
    .replace(/\\begin\{center\}\s*\{\\LARGE\\bfseries[^{}]*\\par\}\s*\\end\{center\}/g, '').trim();
  const labels = new Map(), sections = [], blocks = [];
  let section = 0, subsection = 0, equation = 0, mathCount = 0, referenceCount = 0, proseText = '';
  const renderMath = (tex, display) => katex.renderToString(tex.replace(/\\\r?\n/g, '\\ '), {
      displayMode: display, macros: { ...macros }, throwOnError: true, trust: false,
      strict: code => code === 'unicodeTextInMathMode' ? 'ignore' : 'error'
    });
  const math = (tex, display) => {
    mathCount++;
    if (tex.includes('\\begin{tikzcd}')) {
      // This diagram has a dedicated responsive web layout; never silently drop TikZ.
      const expected = String.raw`\begin{tikzcd}[column sep=large,row sep=large]
V\times W \arrow[r,"B"] \arrow[d,"\otimes"'] & U \\
V\otimes W \arrow[ur,dashed,"\exists!\,\widetilde B"'] &
\end{tikzcd}`;
      if (tex.replace(/\s/g, '') !== expected.replace(/\s/g, '')) throw new Error('Unsupported commutative diagram: provide a faithful web layout first');
      const label = (name, formula) => `<span class="diagram-${name}">${renderMath(formula, false)}</span>`;
      return `<figure class="tensor-diagram" aria-label="张量积的普适性质交换图"><div class="tensor-diagram-canvas"><svg viewBox="0 0 480 220" fill="none" aria-hidden="true"><defs><marker id="tensor-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" stroke="currentColor" stroke-width="1.4"/></marker></defs><g stroke="currentColor" stroke-width="1.6" marker-end="url(#tensor-map-arrow)"><path d="M150 38H365"/><path d="M90 63V165"/><path d="M155 178L363 58" stroke-dasharray="6 5"/></g></svg>${label('source',String.raw`V\times W`)}${label('target','U')}${label('product',String.raw`V\otimes W`)}${label('direct','B')}${label('tensor',String.raw`\otimes`)}${label('unique',String.raw`\exists!\,\widetilde B`)}</div><figcaption>直接作用与经过张量积空间的两条路径，得到相同的结果。</figcaption></figure>`;
    }
    return renderMath(tex, display);
  };
  const numbered = (tex, align) => {
    // Split only top-level align rows, never matrix rows.
    const rows = []; let start = 0, depth = 0;
    if (align) {
      const tokens = /\\begin\{[^}]+\}|\\end\{[^}]+\}|\\\\/g;
      for (const t of tex.matchAll(tokens)) {
        if (t[0].startsWith('\\begin')) depth++;
        else if (t[0].startsWith('\\end')) depth--;
        else if (depth === 0) { rows.push(tex.slice(start, t.index)); start = t.index + 2; }
      }
    }
    rows.push(tex.slice(start));
    const ids = [];
    const tagged = rows.map(row => {
      const number = `${section}.${++equation}`;
      const id = `equation-${number.replace('.', '-')}`;
      ids.push(id);
      row = row.replace(/\\label\{([^}]+)\}/g, (_, label) => {
        if (labels.has(label)) throw new Error(`Duplicate equation label: ${label}`);
        labels.set(label, { number, id }); return '';
      });
      return `${row.trim()}\\tag{${number}}`;
    }).join('\\\\\n');
    return `<div class="article-equation">${ids.map(id => `<span id="${id}" class="equation-anchor"></span>`).join('')}${math(align ? `\\begin{align}${tagged}\\end{align}` : tagged, true)}</div>`;
  };
  let i = 0, textStart = 0;
  const lists = [];
  const flush = end => { if (input.slice(textStart, end).trim()) blocks.push({ type: 'text', value: input.slice(textStart, end) }); };
  while (i < input.length) {
    const rest = input.slice(i);
    const heading = rest.match(/^\\(section|subsection)\{/);
    const env = rest.match(/^\\begin\{(equation|align|abstract)\}/);
    const list = rest.match(/^\\(begin|end)\{(itemize|enumerate)\}/);
    if (list || /^\\item\b/.test(rest)) {
      flush(i);
      if (list?.[1] === 'begin') {
        const tag = list[2] === 'itemize' ? 'ul' : 'ol';
        lists.push({tag, item:false}); blocks.push({type:'html',value:`<${tag} class="article-list">`});
      } else if (list) {
        const current = lists.pop();
        if (!current || current.tag !== (list[2] === 'itemize' ? 'ul' : 'ol')) throw new Error('Mismatched list environment');
        blocks.push({type:'html',value:`${current.item ? '</li>' : ''}</${current.tag}>`});
      } else {
        const current = lists.at(-1);
        if (!current) throw new Error('List item outside list');
        blocks.push({type:'html',value:`${current.item ? '</li>' : ''}<li>`}); current.item = true;
      }
      i += list ? list[0].length : 5; textStart = i;
    } else if (heading) {
      flush(i);
      const arg = argument(input, i + heading[0].length - 1);
      if (heading[1] === 'section') { section++; subsection = 0; equation = 0; sections.push({ id: `section-${section}`, title: arg.value, number: section }); }
      else subsection++;
      blocks.push({type:'heading', level:heading[1] === 'section' ? 2 : 3, id:subsection ? `section-${section}-${subsection}` : `section-${section}`, value:arg.value, number:subsection ? `${section}.${subsection}` : `${section}`});
      i = arg.end; textStart = i;
    } else if (env || rest.startsWith('\\[') || rest.startsWith('$$')) {
      flush(i);
      const opener = env ? env[0] : rest.startsWith('$$') ? '$$' : '\\[', closer = env ? `\\end{${env[1]}}` : opener === '$$' ? '$$' : '\\]';
      const end = input.indexOf(closer, i + opener.length);
      if (end < 0) throw new Error(`Unclosed ${opener}`);
      const value = input.slice(i + opener.length, end);
      if (env?.[1] === 'abstract') blocks.push({type:'abstract', value});
      else blocks.push({type:'html', value: env ? numbered(value, env[1] === 'align') : `<div class="article-equation">${math(value, true)}</div>`});
      i = end + closer.length; textStart = i;
    } else i++;
  }
  flush(i);
  if (lists.length) throw new Error('Unclosed list environment');
  const inline = text => {
    let result = '', cursor = 0;
    while (cursor < text.length) {
      if (text[cursor] === '$' || text.slice(cursor, cursor + 2) === '\\(') {
        const parens = text[cursor] === '\\';
        const start = cursor + (parens ? 2 : 1);
        const end = text.indexOf(parens ? '\\)' : '$', start);
        if (end < 0) throw new Error('Unclosed inline math');
        result += math(text.slice(start, end), false); cursor = end + (parens ? 2 : 1);
      } else if (text[cursor] === '\\') {
        const command = text.slice(cursor).match(/^\\(textbf|important|eqref)\{/);
        if (!command) throw new Error(`Unsupported prose command: ${text.slice(cursor, cursor + 70)}`);
        const arg = argument(text, cursor + command[0].length - 1);
        if (command[1] === 'eqref') {
          const target = labels.get(arg.value);
          if (!target) throw new Error(`Unresolved equation reference: ${arg.value}`);
          referenceCount++;
          result += `<a class="equation-reference" href="#${target.id}" aria-label="公式 ${target.number}">(${target.number})</a>`;
        } else result += `<strong>${inline(arg.value)}</strong>${command[1] === 'important' ? '　' : ''}`;
        cursor = arg.end;
      } else {
        const chunk = text.slice(cursor).match(/^[^$\\]+/)[0];
        proseText += chunk;
        result += escape(chunk.replace(/\s*\n\s*/g, ' ').replace(/---/g, '—').replace(/--/g, '–'));
        cursor += chunk.length;
      }
    }
    return result;
  };
  const paragraphs = text => text.trim().split(/\n\s*\n/).filter(Boolean).map(p => `<p>${inline(p.trim())}</p>`).join('\n');
  let body = blocks.map(block => {
    if (block.type === 'html') return block.value;
    if (block.type === 'heading') return `<h${block.level} id="${block.id}"><span class="section-number">${block.number}</span> ${inline(block.value)}</h${block.level}>`;
    if (block.type === 'abstract') return `<aside class="article-abstract" aria-label="阅读说明"><strong>阅读说明</strong>${paragraphs(block.value)}</aside>`;
    return paragraphs(block.value);
  }).join('\n');
  const toc = `<details class="article-toc" open><summary>目录 <span>${sections.length} 个章节</span></summary><ol>${sections.map(s => `<li><a href="#${s.id}">${escape(s.title)}</a></li>`).join('')}</ol></details>`;
  body = body.includes('</aside>') ? body.replace('</aside>', `</aside>\n${toc}`) : body.replace('<h2 ', `${toc}\n<h2 `);
  const wordCount = Array.from(proseText.replace(/\s/g, '')).length;
  return { body, wordCount, stats: { sections:sections.length, equations: (body.match(/class="equation-anchor"/g) || []).length, mathCount, referenceCount } };
}
