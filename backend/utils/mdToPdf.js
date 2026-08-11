import MarkdownIt from 'markdown-it';
import puppeteer from 'puppeteer';
import hljs from 'highlight.js';

const FONT_MAP = {
  inter: { family: "'Inter', sans-serif", importName: 'Inter:wght@400;600;700' },
  roboto: { family: "'Roboto', sans-serif", importName: 'Roboto:wght@400;500;700' },
  lora: { family: "'Lora', serif", importName: 'Lora:wght@400;600;700' },
  merriweather: { family: "'Merriweather', serif", importName: 'Merriweather:wght@400;700' },
  jetbrains: { family: "'JetBrains Mono', monospace", importName: 'JetBrains+Mono:wght@400;600' },
};

const HLJS_THEMES = {
  github: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
  dracula: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dracula.min.css',
  monokai: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css',
};

const DECORATIONS = {
  none: () => '',
  'bloom-corner': (accent) => `
    <div class="deco-bloom" style="background: radial-gradient(circle, ${accent}55, transparent 70%);"></div>
    <div class="deco-bloom deco-bloom-2" style="background: radial-gradient(circle, ${accent}33, transparent 70%);"></div>
  `,
  'ring-corner': (accent) => `
    <div class="deco-ring" style="border-color: ${accent}88;"></div>
    <div class="deco-ring deco-ring-2" style="border-color: ${accent}55;"></div>
  `,
  'wave-band': (accent) => `
    <div class="deco-wave" style="background: linear-gradient(120deg, ${accent}, ${accent}aa);"></div>
  `,
  'confetti-corner': (accent) => `
    <div class="deco-confetti">
      <span style="background:${accent}"></span>
      <span style="background:${accent}cc"></span>
      <span style="background:${accent}99"></span>
      <span style="background:${accent}66"></span>
    </div>
  `,
  topband: (accent, heading) => `
    <div class="deco-topband" style="background:${heading};"></div>
    <div class="deco-topband-accent" style="background:${accent};"></div>
  `,
};

const DECO_CSS = `
  .deco-bloom { position: fixed; top: -80px; right: -80px; width: 260px; height: 260px; border-radius: 50%; z-index: 0; }
  .deco-bloom-2 { top: -40px; right: 40px; width: 160px; height: 160px; }
  .deco-ring { position: fixed; top: -60px; right: -60px; width: 220px; height: 220px; border: 22px solid; border-radius: 50%; z-index: 0; }
  .deco-ring-2 { top: -20px; right: -20px; width: 140px; height: 140px; border-width: 14px; }
  .deco-wave { position: fixed; bottom: -50px; left: -60px; width: 260px; height: 140px; border-radius: 50%; z-index: 0; opacity: 0.85; }
  .deco-confetti { position: fixed; top: 24px; left: 24px; z-index: 0; }
  .deco-confetti span { position: absolute; width: 14px; height: 14px; transform: rotate(45deg); border-radius: 3px; }
  .deco-confetti span:nth-child(1) { top: 0; left: 0; }
  .deco-confetti span:nth-child(2) { top: 18px; left: 22px; }
  .deco-confetti span:nth-child(3) { top: -6px; left: 34px; }
  .deco-confetti span:nth-child(4) { top: 26px; left: 4px; }
  .deco-topband { position: fixed; top: 0; left: 0; right: 0; height: 64px; z-index: 0; }
  .deco-topband-accent { position: fixed; top: 64px; left: 0; right: 0; height: 4px; z-index: 0; }
  .deco-layer-content { position: relative; z-index: 1; }
`;

const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (_) {}
    }
    return md.utils.escapeHtml(str);
  }
});

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

function renderWithHeadingIds(markdownText) {
  const tokens = md.parse(markdownText, {});
  const headings = [];
  const usedSlugs = new Set();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.replace('h', ''), 10);
      const inline = tokens[i + 1];
      const text = inline ? inline.content : '';
      let slug = slugify(text) || `section-${i}`;
      let unique = slug;
      let n = 2;
      while (usedSlugs.has(unique)) unique = `${slug}-${n++}`;
      usedSlugs.add(unique);
      token.attrSet('id', unique);
      if (level <= 3) headings.push({ level, text, slug: unique });
    }
  }
  return { html: md.renderer.render(tokens, md.options, {}), headings };
}

function buildTocHtml(headings) {
  if (!headings.length) return '';
  const minLevel = Math.min(...headings.map(h => h.level));
  const items = headings
    .map(h => `<li style="margin-left:${(h.level - minLevel) * 18}px"><a href="#${h.slug}">${h.text}</a></li>`)
    .join('');
  return `<div class="toc-block"><div class="toc-title">Contents</div><ul class="toc-list">${items}</ul></div>`;
}

export function buildStyledHtml(markdownText, title, options = {}) {
  const {
    font = 'inter',
    headingColor = '#1a1a1a',
    accentColor = '#7c5cfc',
    lineHeight = 1.8,
    paraGap = '1.1em',
    includeToc = false,
    highlightTheme = 'github',
    watermarkText = '',
    pageTheme = 'none',
  } = options;

  const fontDef = FONT_MAP[font] || FONT_MAP.inter;
  const hljsCssUrl = HLJS_THEMES[highlightTheme] || HLJS_THEMES.github;
  const { html: contentHtml, headings } = renderWithHeadingIds(markdownText);
  const tocHtml = includeToc ? buildTocHtml(headings) : '';
  const decoFn = DECORATIONS[pageTheme] || DECORATIONS.none;
  const decoHtml = decoFn(accentColor, headingColor);
  const isTopBand = pageTheme === 'topband';

  const watermarkCss = watermarkText
    ? `
      .deco-layer-content::before {
        content: "${watermarkText.replace(/"/g, '\\"')}";
        position: fixed; top: 45%; left: 50%;
        transform: translate(-50%, -50%) rotate(-32deg);
        font-size: 64px; font-weight: 700; color: rgba(0,0,0,0.06);
        white-space: nowrap; z-index: 0; pointer-events: none;
      }`
    : '';

  return `
  <html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=${fontDef.importName}&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${hljsCssUrl}">
    <style>
      body { font-family: ${fontDef.family}; line-height: ${lineHeight}; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 8px 4px; position: relative; }
      ${isTopBand ? 'body { padding-top: 88px; }' : ''}
      h1, h2, h3, h4 { font-family: ${fontDef.family}; color: ${headingColor}; margin-top: 1.2em; margin-bottom: 0.5em; }
      h1:first-of-type { margin-top: 0; ${isTopBand ? '' : 'border-bottom: 2px solid #eee; padding-bottom: 8px;'} }
      p { margin: 0 0 ${paraGap}; }
      a { color: ${accentColor}; }
      strong { color: ${headingColor}; }
      ul, ol { margin: 0 0 ${paraGap}; padding-left: 1.4em; }
      li { margin-bottom: 0.5em; }
      code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
      pre { padding: 16px 18px; border-radius: 8px; overflow-x: auto; margin: ${paraGap} 0; }
      pre code.hljs { padding: 0; background: transparent; }
      blockquote { border-left: 4px solid ${accentColor}; padding-left: 16px; color: #555; margin: ${paraGap} 0; }
      table { border-collapse: collapse; width: 100%; margin: ${paraGap} 0; }
      th, td { border: 1px solid #ddd; padding: 8px 12px; }
      img { max-width: 100%; }
      hr { border: none; border-top: 1px solid #ddd; margin: 1.8em 0; }
      .toc-block { border: 1px solid #e5e5e5; border-radius: 8px; padding: 18px 22px; margin: 0 0 1.8em; background: #fafafa; }
      .toc-title { font-weight: 700; font-size: 0.8em; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 10px; }
      .toc-list { list-style: none; margin: 0; padding: 0; }
      .toc-list li { margin-bottom: 6px; }
      .toc-list a { text-decoration: none; color: ${accentColor}; font-size: 0.95em; }
      ${DECO_CSS}
      ${watermarkCss}
    </style>
  </head>
  <body>
    ${decoHtml}
    <div class="deco-layer-content">
      ${tocHtml}
      ${contentHtml}
    </div>
  </body>
  </html>`;
}

export async function markdownToPdf(markdownText, title = 'AI Response', options = {}) {
  const { pdfMargin = '14mm', showPageNumbers = false } = options;
  const fullHtml = buildStyledHtml(markdownText, title, options);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
    ],
  });

  try {
    const page = await browser.newPage();

    page.on('error', (err) => console.error('Page crashed:', err));
    page.on('pageerror', (err) => console.error('Page JS error:', err));

    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: pdfMargin,
        bottom: showPageNumbers ? '18mm' : pdfMargin,
        left: pdfMargin,
        right: pdfMargin,
      },
    };

    if (showPageNumbers) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = '<span></span>';
      pdfOptions.footerTemplate = `
        <div style="width:100%; font-size:9px; color:#999; text-align:center; font-family:sans-serif;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`;
    }

    return await page.pdf(pdfOptions);
  } finally {
    await browser.close();
  }
}