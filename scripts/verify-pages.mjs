import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
const output = resolve('dist');
const pages = ['index.html', 'portfolio.html', 'motion.html', 'scenes.html'];
for (const file of [...pages, '.nojekyll', 'favicon.svg', 'assets/Mahesh-Resume.pdf']) {
  if (!(await stat(resolve(output, file))).isFile()) throw new Error('Missing Pages file: ' + file);
}
const visited = new Set();
async function check(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const content = await readFile(file, 'utf8');
  const references = file.endsWith('.css')
    ? [...content.matchAll(/url\(\s*['"]?([^\s'")]+)['"]?\s*\)/g)].map(m => m[1])
    : [...content.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]);
  for (const ref of references) {
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(ref)) continue;
    if (ref.startsWith('/')) throw new Error('Root-relative URL will break repository Pages: ' + ref);
    const relative = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (!relative) continue;
    const target = resolve(dirname(file), relative);
    if (!target.startsWith(output + sep)) throw new Error('URL escapes dist: ' + ref);
    if (!(await stat(target)).isFile()) throw new Error('Missing asset: ' + ref);
    if (target.endsWith('.css')) await check(target);
  }
}
for (const page of pages) await check(resolve(output, page));
console.log('Pages output verified: four entries, local links, styles, fonts and resume.');
