// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/** @type {Record<string, string>} */
const languageLabels = {
  cpp: 'C++', 'c++': 'C++', c: 'C', csharp: 'C#', cs: 'C#',
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
  jsx: 'JSX', tsx: 'TSX', py: 'Python', python: 'Python',
  bash: 'Bash', sh: 'Shell', shell: 'Shell', zsh: 'Zsh',
  html: 'HTML', css: 'CSS', json: 'JSON', yaml: 'YAML', yml: 'YAML',
  sql: 'SQL', java: 'Java', go: 'Go', rust: 'Rust', md: 'Markdown', markdown: 'Markdown',
};

// https://astro.build/config
export default defineConfig({
  // 网站的正式主地址。
  site: 'https://imisslog.com',
  trailingSlash: 'always',
  redirects: { '/notes/': { destination: '/writing/', status: 301 } },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      transformers: [{
        // Astro's content digest includes this name, but not the hook body.
        // Bump it when changing the generated markup to invalidate stored HTML.
        name: 'code-language-toolbar-v2',
        root(node) {
          const lang = this.options.lang;
          const label = typeof lang === 'string' && !['', 'text', 'txt', 'plaintext'].includes(lang)
            ? languageLabels[lang] ?? lang : '';
          const pre = node.children.find(child => child.type === 'element' && child.tagName === 'pre');
          if (!pre || pre.type !== 'element') return;
          // Keep the label outside <pre><code> so selecting code excludes it.
          node.children = [{
            type: 'element', tagName: 'div', properties: { className: ['code-block'] },
            children: [
              { type: 'element', tagName: 'div', properties: { className: ['code-toolbar'] },
                children: label ? [{ type: 'element', tagName: 'span', properties: { className: ['code-language'] },
                  children: [{ type: 'text', value: label }] }] : [] },
              pre,
            ],
          }];
        },
      }],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
