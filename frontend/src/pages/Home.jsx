import './Home.css';
import { Helmet } from 'react-helmet-async';

export default function Home({ onConvertClick }) {
  return (
    
    <div className="page">
      <Helmet>
        <title>SaveAiResponse — Turn AI Chat Responses into Custom PDFs</title>
        <meta name="description" content="Copy any AI response in markdown, paste it in, and export a custom-styled PDF, DOCX, or HTML in seconds." />
      </Helmet>
      
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-mark">⌘</span>
          <span className="logo-text">
            Save<span className="accent">Ai</span>Response
          </span>
        </div>
      </header>

      {/* Hero — two column */}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">STOP BURNING TOKENS ON EXPORTS</p>
          <h1 className="headline">
            Save AI responses.
            <br />
            Don't waste tokens <span className="strike-wrap">making them pretty</span>.
          </h1>
          <p className="subhead">
            Asking your AI to "reformat this as a PDF" costs you a full generation —
            every single time. Copy the raw markdown instead, paste it here, and get a
            polished, professional PDF in seconds. Zero tokens. Every time.
          </p>
          <div className="cta-row">
            <button className="btn-primary" onClick={onConvertClick}>Convert a Response →</button>
            <a href="#how-it-works" className="btn-ghost">See how it works</a>
          </div>
        </div>

        {/* Right side: markdown → styled PDF simulation */}
        <div className="hero-visual" aria-hidden="true">
          <div className="sim-card sim-markdown">
            <div className="sim-card-bar">
              <span className="sim-dot" />
              <span className="sim-dot" />
              <span className="sim-dot" />
              <span className="sim-card-label">response.md</span>
            </div>
            <div className="sim-card-body mono">
              <div className="sim-line"><span className="tok-hash">##</span> Quarterly Summary</div>
              <div className="sim-line sim-line-short">Revenue grew <span className="tok-bold">18%</span></div>
              <div className="sim-line sim-line-med">this quarter, driven by:</div>
              <div className="sim-line sim-line-list">- New enterprise deals</div>
              <div className="sim-line sim-line-list">- Lower churn</div>
              <div className="sim-line sim-line-code">```revenue.up(18%)```</div>
            </div>
          </div>

          <div className="sim-arrow">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="sim-card sim-pdf">
            <div className="sim-card-bar sim-card-bar-pdf">
              <span className="sim-pdf-badge">PDF</span>
              <span className="sim-card-label">Quarterly_Summary.pdf</span>
            </div>
            <div className="sim-card-body">
              <div className="sim-pdf-heading">Quarterly Summary</div>
              <div className="sim-pdf-accent-bar" />
              <div className="sim-pdf-line" />
              <div className="sim-pdf-line" style={{ width: '82%' }} />
              <div className="sim-pdf-bullet"><span className="sim-pdf-dot" />New enterprise deals</div>
              <div className="sim-pdf-bullet"><span className="sim-pdf-dot" />Lower churn</div>
            </div>
          </div>

          <div className="sim-glow" />
        </div>
      </section>

      {/* Signature element: token receipt */}
      <section className="receipt-wrap">
        <div className="receipt">
          <div className="receipt-row bad">
            <span className="receipt-label">
              <span className="dot dot-bad" />
              "Turn this into a PDF" prompt
            </span>
            <span className="receipt-value">~800 tokens</span>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-row good">
            <span className="receipt-label">
              <span className="dot dot-good" />
              Copy response → paste → convert
            </span>
            <span className="receipt-value">0 tokens</span>
          </div>
          <div className="receipt-footer">Same result. Your context stays yours.</div>
        </div>
      </section>

      {/* How it works */}
      <section className="steps" id="how-it-works">
        <h2 className="section-title">How it works</h2>
        <div className="steps-grid">
          <div className="step">
            <span className="step-num">01</span>
            <h3>Copy the response</h3>
            <p>
              At the end of any AI reply, there's a copy button — click it. This
              copies the full response in markdown, formatting included.
            </p>
          </div>
          <div className="step">
            <span className="step-num">02</span>
            <h3>Paste it here</h3>
            <p>
              Drop it into the markdown box. Headings, code blocks, tables, and
              lists all carry over exactly as written.
            </p>
          </div>
          <div className="step">
            <span className="step-num">03</span>
            <h3>Export the PDF</h3>
            <p>
              One click renders a clean, print-ready document — no AI generation
              needed, no tokens spent.
            </p>
          </div>
        </div>
      </section>

      {/* Explicit "how to copy" callout */}
      <section className="callout">
        <div className="callout-card">
          <span className="callout-tag">TIP</span>
          <h3>Where's the copy button?</h3>
          <p>
            Look at the bottom of any AI response — Claude, ChatGPT, and most
            assistants place a small copy icon right below the reply. Click it,
            the whole response (in markdown) is on your clipboard. Come back
            here and paste it in.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="logo-text small">
          Save<span className="accent">Ai</span>Response
        </span>
        <span className="footer-tagline">Built for people who talk to AI a lot.</span>
      </footer>
    </div>
  );
}