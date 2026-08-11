/**
 * Renders Chinese text via browser Canvas (system CJK fonts) and embeds as PNG
 * into a jsPDF document. Avoids font embedding complexity for CJK characters.
 *
 * y is always the text BASELINE position, matching jsPDF doc.text() convention.
 * Returns { heightMm, numLines } for the caller to advance y.
 */

const SCALE = 3;                         // render at 3× for sharpness
const PX_PER_MM = 96 / 25.4;            // pixels per mm at 96 DPI
const CJK_FONT = "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC','Hiragino Sans GB',sans-serif";
const PT_TO_MM = 25.4 / 72;             // 1pt → mm

function pxToMm(px) {
  return px / (SCALE * PX_PER_MM);
}

function colorToStyle(color) {
  if (Array.isArray(color)) return `rgb(${color[0]},${color[1]},${color[2]})`;
  return color;
}

// Shared offscreen canvas for text measurement
let measureCtx = null;
function getMeasureCtx(fontCSS) {
  if (!measureCtx) {
    const mc = document.createElement('canvas');
    mc.width = mc.height = 1;
    measureCtx = mc.getContext('2d');
  }
  measureCtx.font = fontCSS;
  return measureCtx;
}

function wrapChinese(text, fontCSS, maxPx) {
  const ctx = getMeasureCtx(fontCSS);
  const lines = [];
  let cur = '';
  for (const ch of String(text)) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxPx && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Add Chinese text to jsPDF doc.
 * @param {object} doc       jsPDF instance
 * @param {string} text      Text to render
 * @param {number} x         Left edge in mm
 * @param {number} y         Baseline in mm (same convention as doc.text)
 * @param {object} opts
 *   fontSize  {number}  Font size in points (default 10)
 *   color     {Array|string} RGB array or hex string (default dark gray)
 *   bold      {boolean}
 *   maxWidthMm {number} Wrap at this width in mm (0 = no wrap)
 *   align     {'left'|'right'|'center'}
 * @returns {{ heightMm: number, numLines: number }}
 */
export function addZhText(doc, text, x, y, {
  fontSize = 10,
  color = [31, 41, 55],
  bold = false,
  maxWidthMm = 0,
  align = 'left',
} = {}) {
  if (!text) return { heightMm: 0, numLines: 0 };

  const colorStr = colorToStyle(color);
  const fontPx = Math.round(fontSize * (96 / 72) * SCALE);
  const fontCSS = `${bold ? 'bold ' : ''}${fontPx}px ${CJK_FONT}`;
  const lineH = fontPx * 1.3;
  const ascPx = fontPx * 0.78; // CJK characters sit mostly above baseline
  const pad = 4;

  let lines;
  if (maxWidthMm > 0) {
    const maxPx = maxWidthMm * PX_PER_MM * SCALE;
    lines = wrapChinese(String(text), fontCSS, maxPx);
  } else {
    lines = [String(text)];
  }

  const ctx = getMeasureCtx(fontCSS);
  const lineWidths = lines.map(l => ctx.measureText(l).width);
  const cW = Math.ceil(Math.max(1, ...lineWidths)) + pad * 2;
  const cH = Math.ceil(lineH * lines.length) + pad * 2;

  const cv = document.createElement('canvas');
  cv.width = cW;
  cv.height = cH;
  const c = cv.getContext('2d');
  c.font = fontCSS;
  c.fillStyle = colorStr;
  c.textBaseline = 'alphabetic';

  lines.forEach((line, i) => {
    let lx = pad;
    if (align === 'right') lx = cW - pad - lineWidths[i];
    else if (align === 'center') lx = (cW - lineWidths[i]) / 2;
    c.fillText(line, lx, pad + ascPx + i * lineH);
  });

  const imgW = pxToMm(cW);
  const imgH = pxToMm(cH);
  const ascMm = pxToMm(ascPx + pad);

  let imgX = x;
  if (align === 'right') imgX = x - imgW;
  else if (align === 'center') imgX = x - imgW / 2;

  // Place image so first-line baseline aligns with y
  doc.addImage(cv.toDataURL('image/png'), 'PNG', imgX, y - ascMm, imgW, imgH);

  return { heightMm: imgH, numLines: lines.length };
}

/**
 * Measure how many lines Chinese text would occupy at a given width.
 * Used by callers that need to pre-compute y advancement.
 */
export function countZhLines(text, maxWidthMm, fontSize) {
  if (!text) return 0;
  const fontPx = Math.round(fontSize * (96 / 72) * SCALE);
  const fontCSS = `${fontPx}px ${CJK_FONT}`;
  const maxPx = maxWidthMm * PX_PER_MM * SCALE;
  return wrapChinese(String(text), fontCSS, maxPx).length;
}
