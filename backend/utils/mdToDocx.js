import MarkdownIt from 'markdown-it';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ExternalHyperlink,
  ShadingType,
} from 'docx';

const md = new MarkdownIt({ html: false, linkify: true });

const HEADING_MAP = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
};

function renderInline(children = [], accentHex) {
  const runs = [];
  let bold = false;
  let italic = false;
  let inCode = false;
  let linkHref = null;
  let linkBuffer = [];

  const flushLink = () => {
    if (linkHref !== null) {
      runs.push(
        new ExternalHyperlink({
          link: linkHref,
          children: linkBuffer.map(
            t => new TextRun({ text: t, color: accentHex, underline: {}, bold, italics: italic })
          ),
        })
      );
      linkHref = null;
      linkBuffer = [];
    }
  };

  for (const token of children) {
    switch (token.type) {
      case 'text':
        if (linkHref !== null) linkBuffer.push(token.content);
        else
          runs.push(
            new TextRun({
              text: token.content,
              bold,
              italics: italic,
              font: inCode ? 'Consolas' : undefined,
              shading: inCode ? { type: ShadingType.CLEAR, fill: 'F0F0F0' } : undefined,
            })
          );
        break;
      case 'strong_open': bold = true; break;
      case 'strong_close': bold = false; break;
      case 'em_open': italic = true; break;
      case 'em_close': italic = false; break;
      case 'code_inline':
        runs.push(
          new TextRun({
            text: token.content,
            font: 'Consolas',
            shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
          })
        );
        break;
      case 'link_open':
        linkHref = token.attrGet('href');
        break;
      case 'link_close':
        flushLink();
        break;
      case 'softbreak':
      case 'hardbreak':
        runs.push(new TextRun({ text: ' ', break: 1 }));
        break;
      default:
        break;
    }
  }
  flushLink();
  return runs.length ? runs : [new TextRun('')];
}

export async function markdownToDocx(markdownText, title = 'AI Response', options = {}) {
  const { accentColor = '#7c5cfc' } = options;
  const accentHex = accentColor.replace('#', '');

  const tokens = md.parse(markdownText, {});
  const children = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
  ];

  let listStack = []; // track ordered/unordered + depth

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token.type) {
      case 'heading_open': {
        const level = HEADING_MAP[token.tag] || HeadingLevel.HEADING_4;
        const inline = tokens[i + 1];
        children.push(
          new Paragraph({ heading: level, children: renderInline(inline.children, accentHex) })
        );
        break;
      }

      case 'paragraph_open': {
        const inline = tokens[i + 1];
        const parentList = listStack[listStack.length - 1];
        if (parentList) {
          children.push(
            new Paragraph({
              children: renderInline(inline.children, accentHex),
              bullet: parentList.type === 'bullet' ? { level: listStack.length - 1 } : undefined,
              numbering: parentList.type === 'ordered'
                ? { reference: 'default-numbering', level: listStack.length - 1 }
                : undefined,
            })
          );
        } else {
          children.push(new Paragraph({ children: renderInline(inline.children, accentHex) }));
        }
        break;
      }

      case 'bullet_list_open':
        listStack.push({ type: 'bullet' });
        break;
      case 'ordered_list_open':
        listStack.push({ type: 'ordered' });
        break;
      case 'bullet_list_close':
      case 'ordered_list_close':
        listStack.pop();
        break;

      case 'blockquote_open': {
        // collect until blockquote_close, render as indented italic paragraphs
        let j = i + 1;
        while (tokens[j] && tokens[j].type !== 'blockquote_close') {
          if (tokens[j].type === 'inline') {
            children.push(
              new Paragraph({
                indent: { left: 480 },
                border: { left: { color: accentHex, space: 8, style: BorderStyle.SINGLE, size: 12 } },
                children: renderInline(tokens[j].children, accentHex).map(
                  r => (r instanceof TextRun ? r : r)
                ),
              })
            );
          }
          j++;
        }
        i = j;
        break;
      }

      case 'fence':
      case 'code_block': {
        const lines = token.content.replace(/\n$/, '').split('\n');
        for (const line of lines) {
          children.push(
            new Paragraph({
              shading: { type: ShadingType.CLEAR, fill: '1E1E1E' },
              children: [new TextRun({ text: line || ' ', font: 'Consolas', color: 'D4D4D4', size: 20 })],
            })
          );
        }
        children.push(new Paragraph({ text: '' }));
        break;
      }

      case 'hr':
        children.push(
          new Paragraph({
            border: { bottom: { color: 'CCCCCC', space: 1, style: BorderStyle.SINGLE, size: 6 } },
          })
        );
        break;

      case 'table_open': {
        const rows = [];
        let j = i + 1;
        while (tokens[j] && tokens[j].type !== 'table_close') {
          if (tokens[j].type === 'tr_open') {
            const cells = [];
            let k = j + 1;
            while (tokens[k] && tokens[k].type !== 'tr_close') {
              if (tokens[k].type === 'inline') {
                cells.push(
                  new TableCell({
                    children: [new Paragraph({ children: renderInline(tokens[k].children, accentHex) })],
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  })
                );
              }
              k++;
            }
            rows.push(new TableRow({ children: cells }));
            j = k;
          }
          j++;
        }
        children.push(
          new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
        );
        children.push(new Paragraph({ text: '' }));
        i = j;
        break;
      }

      default:
        break;
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            { level: 0, format: 'decimal', text: '%1.', alignment: 'start' },
          ],
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}