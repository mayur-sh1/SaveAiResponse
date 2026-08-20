import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/axios';
import './Converter.css';

const FONTS = [
  { key: 'inter', label: 'Inter', category: 'Sans', family: "'Inter', sans-serif", hint: 'Clean, modern default' },
  { key: 'roboto', label: 'Roboto', category: 'Sans', family: "'Roboto', sans-serif", hint: 'Familiar, neutral' },
  { key: 'lora', label: 'Lora', category: 'Serif', family: "'Lora', serif", hint: 'Warm reading serif' },
  { key: 'merriweather', label: 'Merriweather', category: 'Serif', family: "'Merriweather', serif", hint: 'Formal, print-like' },
  { key: 'jetbrains', label: 'JetBrains Mono', category: 'Mono', family: "'JetBrains Mono', monospace", hint: 'Code-first look' },
];
const CATEGORIES = ['All', 'Sans', 'Serif', 'Mono'];

const PALETTES = [
  { key: 'ink', label: 'Ink', heading: '#1a1a1a', accent: '#7c5cfc' },
  { key: 'ocean', label: 'Ocean', heading: '#0f172a', accent: '#0ea5e9' },
  { key: 'forest', label: 'Forest', heading: '#14532d', accent: '#16a34a' },
  { key: 'sunset', label: 'Sunset', heading: '#7c2d12', accent: '#ea580c' },
  { key: 'berry', label: 'Berry', heading: '#581c87', accent: '#a855f7' },
  { key: 'mono', label: 'Mono', heading: '#111111', accent: '#4b5563' },
  { key: 'gold', label: 'Gold', heading: '#78350f', accent: '#d97706' },
];

const SPACING_OPTIONS = [
  { key: 'compact', label: 'Compact', hint: 'Fit more per page', lineHeight: 1.5, paraGap: '0.8em', pdfMargin: '10mm' },
  { key: 'comfortable', label: 'Comfortable', hint: 'Balanced default', lineHeight: 1.8, paraGap: '1.1em', pdfMargin: '14mm' },
  { key: 'spacious', label: 'Spacious', hint: 'Easiest to read', lineHeight: 2.1, paraGap: '1.5em', pdfMargin: '20mm' },
];

const HIGHLIGHT_THEMES = [
  { key: 'github', label: 'GitHub' },
  { key: 'dracula', label: 'Dracula' },
  { key: 'monokai', label: 'Monokai' },
];

const FORMATS = [
  { key: 'pdf', label: 'PDF' },
  { key: 'docx', label: 'Word (.docx)' },
  { key: 'html', label: 'HTML' },
  { key: 'md', label: 'Markdown' },
];

// Bundled presets — the headline feature
const THEMES = [
  {
    key: 'classic', label: 'Classic Ink', desc: 'Clean and neutral', deco: 'none',
    font: 'inter', palette: 'ink', spacing: 'comfortable',
  },
  {
    key: 'bloom', label: 'Sunset Bloom', desc: 'Warm gradient corner', deco: 'bloom-corner',
    font: 'lora', palette: 'sunset', spacing: 'comfortable',
  },
  {
    key: 'wave', label: 'Emerald Wave', desc: 'Curved band accent', deco: 'wave-band',
    font: 'inter', palette: 'forest', spacing: 'comfortable',
  },
  {
    key: 'ring', label: 'Golden Ring', desc: 'Concentric ring corner', deco: 'ring-corner',
    font: 'merriweather', palette: 'gold', spacing: 'comfortable',
  },
  {
    key: 'confetti', label: 'Prism Confetti', desc: 'Playful diamond cluster', deco: 'confetti-corner',
    font: 'roboto', palette: 'berry', spacing: 'compact',
  },
  {
    key: 'report', label: 'Slate Report', desc: 'Bold top band, corporate', deco: 'topband',
    font: 'inter', palette: 'mono', spacing: 'spacious',
  },
];

const DECO_COLORS = { 'bloom-corner': null, 'ring-corner': null, 'wave-band': null, 'confetti-corner': null, topband: null, none: null };

const STYLE_TABS = ['Theme', 'Font', 'Color', 'Spacing', 'Extras'];

export default function Converter({ onBack }) {
  const [markdownText, setMarkdownText] = useState('');
  const [title, setTitle] = useState('Untitled Response');
  const [fontKey, setFontKey] = useState('inter');
  const [category, setCategory] = useState('All');
  const [paletteKey, setPaletteKey] = useState('ink');
  const [spacingKey, setSpacingKey] = useState('comfortable');
  const [decoKey, setDecoKey] = useState('none');
  const [activeThemeKey, setActiveThemeKey] = useState('classic');
  const [styleTab, setStyleTab] = useState('Theme');
  const [format, setFormat] = useState('pdf');
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [includeToc, setIncludeToc] = useState(false);
  const [highlightTheme, setHighlightTheme] = useState('github');
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');

  const activeFont = FONTS.find(f => f.key === fontKey);
  const activePalette = PALETTES.find(p => p.key === paletteKey);
  const activeSpacing = SPACING_OPTIONS.find(s => s.key === spacingKey);
  const visibleFonts = category === 'All' ? FONTS : FONTS.filter(f => f.category === category);
  const activeFormat = FORMATS.find(f => f.key === format);

  const applyTheme = (theme) => {
    setActiveThemeKey(theme.key);
    setFontKey(theme.font);
    setPaletteKey(theme.palette);
    setSpacingKey(theme.spacing);
    setDecoKey(theme.deco);
  };

  const previewStyle = {
    fontFamily: activeFont.family,
    '--heading-color': activePalette.heading,
    '--accent-color': activePalette.accent,
    '--line-height': activeSpacing.lineHeight,
    '--para-gap': activeSpacing.paraGap,
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    if (!markdownText.trim()) return;
    const safeName = (title || 'document').replace(/[^a-z0-9]/gi, '_');

    if (format === 'md') {
      const blob = new Blob([markdownText], { type: 'text/markdown' });
      triggerDownload(blob, `${safeName}.md`);
      showToast('Markdown downloaded');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        '/documents/convert',
        {
          markdownText, title, format,
          font: fontKey,
          headingColor: activePalette.heading,
          accentColor: activePalette.accent,
          lineHeight: activeSpacing.lineHeight,
          paraGap: activeSpacing.paraGap,
          pdfMargin: activeSpacing.pdfMargin,
          includeToc, highlightTheme, showPageNumbers, watermarkText,
          pageTheme: decoKey,
        },
        { responseType: 'blob' }
      );
      const ext = format === 'html' ? 'html' : format === 'docx' ? 'docx' : 'pdf';
      triggerDownload(res.data, `${safeName}.${ext}`);
      showToast(`${ext.toUpperCase()} downloaded`);
    } catch (err) {
      console.error(err);
      showToast('Something went wrong — check server logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="converter-page">
      <Helmet>
  <title>Convert Markdown to PDF — SaveAiResponse</title>
  <meta name="description" content="Paste markdown, pick a theme, font, and color palette, and download as PDF, DOCX, or HTML." />
</Helmet>
      <header className="converter-header">
        <div className="header-left">
          <button className="back-link" onClick={onBack}>← Back</button>
          <input
            className="title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Untitled Response"
          />
        </div>

        <div className="download-group">
          <button className="btn-download" onClick={handleDownload} disabled={loading || !markdownText.trim()}>
            {loading && <span className="spinner" />}
            {loading ? 'Generating…' : `Download ${activeFormat.label}`}
          </button>
          <button className="format-toggle" onClick={() => setFormatMenuOpen(o => !o)} disabled={loading} aria-label="Choose export format">▾</button>
          {formatMenuOpen && (
            <div className="format-menu" onMouseLeave={() => setFormatMenuOpen(false)}>
              {FORMATS.map(f => (
                <button key={f.key} className={`format-menu-item ${format === f.key ? 'selected' : ''}`} onClick={() => { setFormat(f.key); setFormatMenuOpen(false); }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="converter-body">
        <div className="pane editor-pane">
          <div className="pane-label">Markdown</div>
          <textarea
            className="editor"
            value={markdownText}
            onChange={e => setMarkdownText(e.target.value)}
            placeholder="Paste the AI response here — copy button is at the end of any reply."
            spellCheck={false}
          />
        </div>

        <div className="pane preview-pane">
          <div className="pane-label">Preview</div>
          <div className={`preview deco-${decoKey}`} style={previewStyle}>
            {decoKey === 'bloom-corner' && (
              <>
                <div className="deco-bloom" style={{ background: `radial-gradient(circle, ${activePalette.accent}55, transparent 70%)` }} />
                <div className="deco-bloom deco-bloom-2" style={{ background: `radial-gradient(circle, ${activePalette.accent}33, transparent 70%)` }} />
              </>
            )}
            {decoKey === 'ring-corner' && (
              <>
                <div className="deco-ring" style={{ borderColor: `${activePalette.accent}88` }} />
                <div className="deco-ring deco-ring-2" style={{ borderColor: `${activePalette.accent}55` }} />
              </>
            )}
            {decoKey === 'wave-band' && (
              <div className="deco-wave" style={{ background: `linear-gradient(120deg, ${activePalette.accent}, ${activePalette.accent}aa)` }} />
            )}
            {decoKey === 'confetti-corner' && (
              <div className="deco-confetti">
                <span style={{ background: activePalette.accent }} />
                <span style={{ background: `${activePalette.accent}cc` }} />
                <span style={{ background: `${activePalette.accent}99` }} />
                <span style={{ background: `${activePalette.accent}66` }} />
              </div>
            )}
            {decoKey === 'topband' && (
              <>
                <div className="deco-topband" style={{ background: activePalette.heading }} />
                <div className="deco-topband-accent" style={{ background: activePalette.accent }} />
              </>
            )}

            <div className={`deco-layer-content ${decoKey === 'topband' ? 'has-topband' : ''}`}>
              {markdownText.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownText}</ReactMarkdown>
              ) : (
                <p className="preview-empty">Your PDF preview shows up here as you type.</p>
              )}
            </div>
          </div>
        </div>

        <div className="pane style-pane">
          <div className="style-tabs">
            {STYLE_TABS.map(tab => (
              <button key={tab} className={`style-tab ${styleTab === tab ? 'active' : ''}`} onClick={() => setStyleTab(tab)}>
                {tab}
              </button>
            ))}
          </div>

          {styleTab === 'Theme' && (
            <div className="themes-grid">
              {THEMES.map(theme => {
                const pal = PALETTES.find(p => p.key === theme.palette);
                return (
                  <button
                    key={theme.key}
                    className={`theme-card ${activeThemeKey === theme.key ? 'selected' : ''}`}
                    onClick={() => applyTheme(theme)}
                  >
                    <div className="theme-card-preview">
                      <div className={`theme-mini-deco deco-${theme.deco}`}>
                        {theme.deco === 'bloom-corner' && <div className="mini-bloom" style={{ background: pal.accent }} />}
                        {theme.deco === 'ring-corner' && <div className="mini-ring" style={{ borderColor: pal.accent }} />}
                        {theme.deco === 'wave-band' && <div className="mini-wave" style={{ background: pal.accent }} />}
                        {theme.deco === 'confetti-corner' && <div className="mini-confetti" style={{ background: pal.accent }} />}
                        {theme.deco === 'topband' && <div className="mini-topband" style={{ background: pal.heading }} />}
                      </div>
                      <div className="theme-mini-lines">
                        <div className="mini-line-h" style={{ background: pal.heading }} />
                        <div className="mini-line" />
                        <div className="mini-line short" />
                      </div>
                      <div className="theme-card-shine" />
                    </div>
                    <div className="theme-card-info">
                      <span className="theme-card-name">{theme.label}</span>
                      <span className="theme-card-desc">{theme.desc}</span>
                    </div>
                    {activeThemeKey === theme.key && <span className="theme-badge">Active</span>}
                  </button>
                );
              })}
            </div>
          )}

          {styleTab === 'Font' && (
            <>
              <div className="category-row">
                {CATEGORIES.map(cat => (
                  <button key={cat} className={`category-btn ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
                ))}
              </div>
              <div className="option-list">
                {visibleFonts.map(f => (
                  <button key={f.key} className={`option-item ${fontKey === f.key ? 'selected' : ''}`} style={{ fontFamily: f.family }} onClick={() => setFontKey(f.key)}>
                    <span className="option-name">{f.label}</span>
                    <span className="option-hint">{f.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {styleTab === 'Color' && (
            <div className="option-list palette-list">
              {PALETTES.map(p => (
                <button key={p.key} className={`option-item palette-item ${paletteKey === p.key ? 'selected' : ''}`} onClick={() => setPaletteKey(p.key)}>
                  <span className="swatch-pair">
                    <span className="swatch" style={{ background: p.heading }} />
                    <span className="swatch" style={{ background: p.accent }} />
                  </span>
                  <span className="option-name">{p.label}</span>
                </button>
              ))}
            </div>
          )}

          {styleTab === 'Spacing' && (
            <div className="option-list">
              {SPACING_OPTIONS.map(s => (
                <button key={s.key} className={`option-item ${spacingKey === s.key ? 'selected' : ''}`} onClick={() => setSpacingKey(s.key)}>
                  <span className="option-name">{s.label}</span>
                  <span className="option-hint">{s.hint}</span>
                </button>
              ))}
            </div>
          )}

          {styleTab === 'Extras' && (
            <div className="extras-panel">
              <label className="toggle-row">
                <span>Table of contents</span>
                <input type="checkbox" checked={includeToc} onChange={e => setIncludeToc(e.target.checked)} />
              </label>
              <label className="toggle-row">
                <span>Page numbers</span>
                <input type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} />
              </label>
              <div className="extras-block">
                <div className="extras-label">Code theme</div>
                <div className="theme-row">
                  {HIGHLIGHT_THEMES.map(t => (
                    <button key={t.key} className={`theme-btn ${highlightTheme === t.key ? 'active' : ''}`} onClick={() => setHighlightTheme(t.key)}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="extras-block">
                <div className="extras-label">Watermark (optional)</div>
                <input className="watermark-input" type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="e.g. DRAFT" />
              </div>
              <p className="extras-note">TOC, page numbers, code theme, and watermark apply to PDF exports.</p>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}