import { markdownToPdf, buildStyledHtml } from '../utils/mdToPdf.js';
import { markdownToDocx } from '../utils/mdToDocx.js';

export const convertToPdf = async (req, res) => {
  try {
    const {
      markdownText, title, format = 'pdf',
      font, headingColor, accentColor, lineHeight, paraGap, pdfMargin,
      includeToc, highlightTheme, showPageNumbers, watermarkText, pageTheme,
    } = req.body;

    if (!markdownText || !markdownText.trim()) {
      return res.status(400).json({ error: 'markdownText is required' });
    }

    const safeTitle = title || 'Untitled';
    const safeFilename = safeTitle.replace(/[^a-z0-9]/gi, '_');
    const options = {
      font, headingColor, accentColor, lineHeight, paraGap, pdfMargin,
      includeToc, highlightTheme, showPageNumbers, watermarkText, pageTheme,
    };

    if (format === 'html') {
      const html = buildStyledHtml(markdownText, safeTitle, options);
      res.set({ 'Content-Type': 'text/html', 'Content-Disposition': `attachment; filename="${safeFilename}.html"` });
      return res.send(html);
    }

    if (format === 'docx') {
      const buffer = await markdownToDocx(markdownText, safeTitle, options);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFilename}.docx"`
      });
      return res.send(buffer);
    }

    const pdfBuffer = await markdownToPdf(markdownText, safeTitle, options);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${safeFilename}.pdf"` });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: 'Failed to generate file' });
  }
};