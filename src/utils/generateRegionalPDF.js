/**
 * Generate a regional / filtered-country environmental summary report PDF.
 * The PDF uses English labels because jsPDF built-in fonts do not support CJK.
 */
import { computeCompositeScore } from "../components/RankingsView";
import { NDC_RATING_CONFIG } from "../constants";

const GREEN = [22, 163, 74];
const EMERALD = [5, 150, 105];
const DARK = [31, 41, 55];
const GRAY = [107, 114, 128];
const LIGHT = [243, 244, 246];
const BORDER = [229, 231, 235];

function fmt(value, digits = 1, suffix = "") {
  return value == null || !Number.isFinite(value) ? "-" : `${Number(value).toFixed(digits)}${suffix}`;
}

function avg(items, fn, digits = 1) {
  const vals = items.map(fn).filter((v) => v != null && Number.isFinite(v));
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(digits) : null;
}

function count(items, fn) {
  return items.filter(fn).length;
}

function safeName(text) {
  return String(text || "regional-report")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ndcLabel(country) {
  const key = country.parisAgreement?.ndcRating;
  return key ? (NDC_RATING_CONFIG[key]?.en || key.replace(/_/g, " ")) : "N/A";
}

function splitText(doc, text, width) {
  return doc.splitTextToSize(String(text || "-"), width);
}

function barColor(score) {
  if (score >= 70) return [34, 197, 94];
  if (score >= 55) return [132, 204, 22];
  if (score >= 40) return [234, 179, 8];
  if (score >= 25) return [249, 115, 22];
  return [239, 68, 68];
}

function drawBar(doc, x, y, width, pct, color) {
  doc.setFillColor(...LIGHT);
  doc.roundedRect(x, y, width, 3.2, 1, 1, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, Math.max(1, width * Math.max(0, Math.min(100, pct)) / 100), 3.2, 1, 1, "F");
}

export async function generateRegionalPDF(countries, options = {}) {
  const [{ jsPDF }] = await Promise.all([import("jspdf")]);
  const items = [...countries].filter(Boolean);
  if (!items.length) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const ML = 15;
  const MR = 15;
  const MT = 16;
  const CW = W - ML - MR;
  let y = MT;
  const toc = [];

  const scopeName = options.regionName || "Filtered Countries";
  const subtitle = options.filterSummary || `${items.length} countries`;
  const date = new Date().toISOString().slice(0, 10);
  const sorted = [...items].sort((a, b) => computeCompositeScore(b) - computeCompositeScore(a));
  const regionalAvg = {
    composite: avg(items, computeCompositeScore),
    epi: avg(items, (c) => c.epiScore),
    renewable: avg(items, (c) => c.wb?.renewableEnergy),
    forest: avg(items, (c) => c.wb?.forestArea ?? c.data?.forestCoverage),
    protected: avg(items, (c) => c.wb?.protectedAreas),
    pm25: avg(items, (c) => c.wb?.pm25),
    co2pc: avg(items, (c) => c.wb?.co2PerCapita),
  };

  function addPage() {
    doc.addPage();
    y = MT;
  }

  function checkPageBreak(needed) {
    if (y + needed > H - 22) addPage();
  }

  function sectionTitle(title) {
    checkPageBreak(18);
    toc.push({ title, page: doc.getNumberOfPages() });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...GREEN);
    doc.text(title, ML, y);
    y += 2.5;
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    doc.line(ML, y, ML + CW, y);
    y += 7;
  }

  function metricCard(label, value, x, cardY, width) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(x, cardY, width, 18, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text(String(value), x + width / 2, cardY + 7, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(label, x + width / 2, cardY + 13, { align: "center" });
  }

  function smallTable(headers, rows, widths) {
    const rowH = 7;
    checkPageBreak(rowH * (rows.length + 2));
    doc.setFillColor(...LIGHT);
    doc.rect(ML, y, CW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    let x = ML;
    headers.forEach((h, i) => {
      doc.text(h, x + 1.5, y + 4.5);
      x += widths[i];
    });
    y += rowH;

    rows.forEach((row, ri) => {
      checkPageBreak(rowH + 2);
      if (ri % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(ML, y, CW, rowH, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...DARK);
      x = ML;
      row.forEach((cell, i) => {
        const lines = splitText(doc, cell, widths[i] - 3);
        doc.text(lines.slice(0, 1), x + 1.5, y + 4.5);
        x += widths[i];
      });
      y += rowH;
    });
    y += 4;
  }

  // Cover
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 86, "F");
  doc.setFillColor(...EMERALD);
  doc.rect(0, 72, W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.text("Regional Environmental", ML, 30);
  doc.text("Governance Report", ML, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(scopeName, ML, 56);
  doc.setFontSize(9);
  doc.text(`Generated ${date} | ${subtitle}`, ML, 66);

  y = 105;
  metricCard("Countries", items.length, ML, y, 40);
  metricCard("Avg Composite", fmt(regionalAvg.composite, 1), ML + 47, y, 40);
  metricCard("Avg EPI", fmt(regionalAvg.epi, 1), ML + 94, y, 40);
  metricCard("Avg PM2.5", fmt(regionalAvg.pm25, 1), ML + 141, y, 39);
  y += 32;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const intro = `This report summarizes environmental agencies, key indicators, climate-policy compliance, and country-level performance for ${scopeName}.`;
  doc.text(splitText(doc, intro, CW), ML, y);
  y += 18;
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Data sources: World Bank, Yale EPI, Climate Action Tracker, IQAir, UNFCCC, national government websites.", ML, H - 28);

  // Reserved TOC page
  addPage();
  const tocPage = doc.getNumberOfPages();
  addPage();

  sectionTitle("Regional Overview");
  const cardW = (CW - 12) / 4;
  const topY = y;
  metricCard("Renewable Energy", fmt(regionalAvg.renewable, 1, "%"), ML, topY, cardW);
  metricCard("Forest Area", fmt(regionalAvg.forest, 1, "%"), ML + cardW + 4, topY, cardW);
  metricCard("Protected Areas", fmt(regionalAvg.protected, 1, "%"), ML + (cardW + 4) * 2, topY, cardW);
  metricCard("CO2 / Capita", fmt(regionalAvg.co2pc, 1, " t"), ML + (cardW + 4) * 3, topY, cardW);
  y += 25;

  const complianceRows = [
    ["Carbon pricing", `${count(items, (c) => c.carbonPricing?.priceUSD != null)} / ${items.length}`],
    ["BTR submitted", `${count(items, (c) => c.reportingStatus?.btrSubmitted)} / ${items.length}`],
    ["Kigali Amendment", `${count(items, (c) => c.montrealProtocol?.kigaliAmendment)} / ${items.length}`],
    ["NDC 3.0 submitted", `${count(items, (c) => c.parisAgreement?.ndc3Submitted)} / ${items.length}`],
    ["CBD 30x30 met", `${count(items, (c) => (c.wb?.protectedAreas ?? 0) >= 30)} / ${items.length}`],
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("Compliance Snapshot", ML, y);
  y += 6;
  complianceRows.forEach(([label, value]) => {
    const pct = items.length ? (Number(value.split(" / ")[0]) / items.length) * 100 : 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(label, ML, y + 3);
    drawBar(doc, ML + 45, y + 0.5, 95, pct, pct >= 60 ? [34, 197, 94] : pct >= 30 ? [234, 179, 8] : [239, 68, 68]);
    doc.setTextColor(...DARK);
    doc.text(value, ML + CW, y + 3, { align: "right" });
    y += 6.5;
  });
  y += 4;

  sectionTitle("Country Ranking");
  const rankRows = sorted.slice(0, 25).map((c, idx) => [
    String(idx + 1),
    c.countryEn,
    fmt(computeCompositeScore(c), 1),
    fmt(c.epiScore, 1),
    fmt(c.wb?.renewableEnergy, 1, "%"),
    fmt(c.wb?.pm25, 1),
    ndcLabel(c),
  ]);
  smallTable(
    ["#", "Country", "Score", "EPI", "Renew", "PM2.5", "NDC"],
    rankRows,
    [10, 45, 20, 18, 22, 20, 45]
  );

  sectionTitle("Policy And Treaty Summary");
  const ndcCounts = items.reduce((acc, c) => {
    const label = ndcLabel(c);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  Object.entries(ndcCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, value]) => {
      checkPageBreak(7);
      const pct = (value / items.length) * 100;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(label, ML, y + 3);
      drawBar(doc, ML + 52, y + 0.5, 95, pct, [34, 197, 94]);
      doc.setTextColor(...DARK);
      doc.text(`${value}`, ML + CW, y + 3, { align: "right" });
      y += 6.5;
    });
  y += 5;

  addPage();
  sectionTitle("Country Profiles");
  sorted.forEach((c) => {
    checkPageBreak(31);
    const score = computeCompositeScore(c);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(ML, y, CW, 25, 2, 2, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(c.countryEn, ML + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(splitText(doc, c.agencyEn || "-", 70), ML + 3, y + 10);
    doc.setTextColor(...DARK);
    doc.text(`Score ${fmt(score, 1)}`, ML + 82, y + 5);
    drawBar(doc, ML + 102, y + 2.5, 38, score, barColor(score));
    doc.setTextColor(...GRAY);
    doc.text(`EPI ${fmt(c.epiScore, 1)} | Renew ${fmt(c.wb?.renewableEnergy, 1, "%")} | PM2.5 ${fmt(c.wb?.pm25, 1)} | CO2/cap ${fmt(c.wb?.co2PerCapita, 1)}`, ML + 82, y + 11);
    doc.text(`NDC: ${ndcLabel(c)} | Carbon price: ${c.carbonPricing?.priceUSD != null ? `$${c.carbonPricing.priceUSD}/t` : "None"}`, ML + 82, y + 16);
    const laws = (c.keyLaws || []).slice(0, 2).map((law) => `${law.year} ${law.nameEn || law.name || ""}`).join("; ");
    doc.text(splitText(doc, `Key laws: ${laws || "-"}`, 95).slice(0, 2), ML + 82, y + 21);
    y += 30;
  });

  // Fill table of contents after page numbers are known.
  const currentPage = doc.getNumberOfPages();
  doc.setPage(tocPage);
  y = MT;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...GREEN);
  doc.text("Contents", ML, y);
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text(scopeName, ML, y);
  y += 12;
  toc.forEach((item) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(item.title, ML, y);
    doc.setTextColor(...GRAY);
    doc.text(String(item.page), W - MR, y, { align: "right" });
    doc.setDrawColor(230, 230, 230);
    doc.line(ML, y + 2, W - MR, y + 2);
    y += 10;
  });

  // Page footers.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text("Global Environmental Governance Tracker", ML, H - 8);
    doc.text(`Page ${p} / ${pages}`, W - MR, H - 8, { align: "right" });
  }
  doc.setPage(currentPage);

  const filename = `${safeName(scopeName)}-Environmental-Summary-${date}.pdf`;
  doc.save(filename);
}
