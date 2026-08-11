/**
 * Generate a regional / filtered-country environmental summary report PDF.
 * Supports both English and Chinese output based on options.language.
 * Chinese text is rendered via canvas (system CJK fonts) to avoid font embedding.
 */
import { computeCompositeScore } from "../components/RankingsView";
import { NDC_RATING_CONFIG } from "../constants";
import { addZhText } from "./chineseTextToPDF";

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
    .replace(/[^a-z0-9一-鿿]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ndcLabel(country, isZh) {
  const key = country.parisAgreement?.ndcRating;
  if (!key) return "N/A";
  const cfg = NDC_RATING_CONFIG[key];
  if (!cfg) return key.replace(/_/g, " ");
  return isZh ? cfg.zh : cfg.en;
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

  const isZh = options.language === "zh";
  const t = (zh, en) => isZh ? zh : en;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const ML = 15;
  const MR = 15;
  const MT = 16;
  const CW = W - ML - MR;
  let y = MT;
  const toc = [];

  // Helper for text rendering (Chinese via canvas, English via jsPDF)
  function txt(text, x, yPos, { fontSize = 10, color = DARK, bold = false, align = "left" } = {}) {
    if (!text) return;
    if (isZh) {
      addZhText(doc, text, x, yPos, { fontSize, color, bold, align });
    } else {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...(Array.isArray(color) ? color : [0, 0, 0]));
      doc.text(String(text), x, yPos, { align });
    }
  }

  // Country display name
  function countryName(c) {
    return isZh ? (c.countryZh || c.countryEn) : c.countryEn;
  }

  const scopeName = options.regionName || t("筛选结果", "Filtered Countries");
  const subtitle = options.filterSummary || `${items.length} ${t("个国家", "countries")}`;
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
    if (isZh) {
      addZhText(doc, title, ML, y, { fontSize: 14, color: GREEN, bold: true });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...GREEN);
      doc.text(title, ML, y);
    }
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
    if (isZh) {
      addZhText(doc, label, x + width / 2, cardY + 13, { fontSize: 7, color: GRAY, align: "center" });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(label, x + width / 2, cardY + 13, { align: "center" });
    }
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
        // Country name column (index 1) may need Chinese rendering
        if (isZh && i === 1 && /[一-鿿]/.test(String(cell))) {
          addZhText(doc, String(cell), x + 1.5, y + 4.5, { fontSize: 7, color: DARK });
        } else {
          const lines = splitText(doc, cell, widths[i] - 3);
          doc.text(lines.slice(0, 1), x + 1.5, y + 4.5);
        }
        x += widths[i];
      });
      y += rowH;
    });
    y += 4;
  }

  // --- Cover ---
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 86, "F");
  doc.setFillColor(...EMERALD);
  doc.rect(0, 72, W, 14, "F");
  doc.setTextColor(255, 255, 255);

  if (isZh) {
    addZhText(doc, t("区域环境治理报告", "Regional Environmental Governance Report"), ML, 30, {
      fontSize: 24, color: "#ffffff", bold: true
    });
    addZhText(doc, scopeName, ML, 52, { fontSize: 13, color: "#ffffff" });
    addZhText(doc, `${t("生成于", "Generated")} ${date} | ${subtitle}`, ML, 64, { fontSize: 9, color: "#ffffff" });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(27);
    doc.text("Regional Environmental", ML, 30);
    doc.text("Governance Report", ML, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(scopeName, ML, 56);
    doc.setFontSize(9);
    doc.text(`Generated ${date} | ${subtitle}`, ML, 66);
  }

  y = 105;
  metricCard(t("国家数量", "Countries"), items.length, ML, y, 40);
  metricCard(t("平均综合分", "Avg Composite"), fmt(regionalAvg.composite, 1), ML + 47, y, 40);
  metricCard(t("平均EPI", "Avg EPI"), fmt(regionalAvg.epi, 1), ML + 94, y, 40);
  metricCard("Avg PM2.5", fmt(regionalAvg.pm25, 1), ML + 141, y, 39);
  y += 32;

  const introText = t(
    `本报告汇总了 ${scopeName} 的环境机构、关键指标、气候政策合规情况及各国表现。`,
    `This report summarizes environmental agencies, key indicators, climate-policy compliance, and country-level performance for ${scopeName}.`
  );
  if (isZh) {
    addZhText(doc, introText, ML, y, { fontSize: 10, color: DARK, maxWidthMm: CW });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(splitText(doc, introText, CW), ML, y);
  }
  y += 18;

  const sourceText = t(
    "数据来源: 世界银行、耶鲁EPI、气候行动追踪、IQAir、UNFCCC、各国政府官网。",
    "Data sources: World Bank, Yale EPI, Climate Action Tracker, IQAir, UNFCCC, national government websites."
  );
  if (isZh) {
    addZhText(doc, sourceText, ML, H - 28, { fontSize: 8, color: GRAY });
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(sourceText, ML, H - 28);
  }

  // Reserved TOC page
  addPage();
  const tocPage = doc.getNumberOfPages();
  addPage();

  sectionTitle(t("区域概况", "Regional Overview"));
  const cardW = (CW - 12) / 4;
  const topY = y;
  metricCard(t("可再生能源", "Renewable Energy"), fmt(regionalAvg.renewable, 1, "%"), ML, topY, cardW);
  metricCard(t("森林覆盖", "Forest Area"), fmt(regionalAvg.forest, 1, "%"), ML + cardW + 4, topY, cardW);
  metricCard(t("自然保护区", "Protected Areas"), fmt(regionalAvg.protected, 1, "%"), ML + (cardW + 4) * 2, topY, cardW);
  metricCard(t("人均CO₂", "CO2 / Capita"), fmt(regionalAvg.co2pc, 1, " t"), ML + (cardW + 4) * 3, topY, cardW);
  y += 25;

  const complianceRows = [
    [t("碳定价", "Carbon pricing"), `${count(items, (c) => c.carbonPricing?.priceUSD != null)} / ${items.length}`],
    [t("BTR 已提交", "BTR submitted"), `${count(items, (c) => c.reportingStatus?.btrSubmitted)} / ${items.length}`],
    [t("基加利修正案", "Kigali Amendment"), `${count(items, (c) => c.montrealProtocol?.kigaliAmendment)} / ${items.length}`],
    [t("NDC 3.0 已提交", "NDC 3.0 submitted"), `${count(items, (c) => c.parisAgreement?.ndc3Submitted)} / ${items.length}`],
    [t("CBD 30×30 达标", "CBD 30x30 met"), `${count(items, (c) => (c.wb?.protectedAreas ?? 0) >= 30)} / ${items.length}`],
  ];

  txt(t("合规快照", "Compliance Snapshot"), ML, y, { fontSize: 9, color: DARK, bold: true });
  y += 6;
  complianceRows.forEach(([label, value]) => {
    const pct = items.length ? (Number(value.split(" / ")[0]) / items.length) * 100 : 0;
    if (isZh) {
      addZhText(doc, label, ML, y + 3, { fontSize: 8, color: GRAY });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(label, ML, y + 3);
    }
    drawBar(doc, ML + 45, y + 0.5, 95, pct, pct >= 60 ? [34, 197, 94] : pct >= 30 ? [234, 179, 8] : [239, 68, 68]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(value, ML + CW, y + 3, { align: "right" });
    y += 6.5;
  });
  y += 4;

  sectionTitle(t("国家排名", "Country Ranking"));
  const rankRows = sorted.slice(0, 25).map((c, idx) => [
    String(idx + 1),
    countryName(c),
    fmt(computeCompositeScore(c), 1),
    fmt(c.epiScore, 1),
    fmt(c.wb?.renewableEnergy, 1, "%"),
    fmt(c.wb?.pm25, 1),
    ndcLabel(c, isZh),
  ]);
  smallTable(
    ["#", t("国家", "Country"), t("评分", "Score"), "EPI", t("可再生", "Renew"), "PM2.5", "NDC"],
    rankRows,
    [10, 45, 20, 18, 22, 20, 45]
  );

  sectionTitle(t("政策与公约概况", "Policy And Treaty Summary"));
  const ndcCounts = items.reduce((acc, c) => {
    const label = ndcLabel(c, isZh);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  Object.entries(ndcCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, value]) => {
      checkPageBreak(7);
      const pct = (value / items.length) * 100;
      if (isZh) {
        addZhText(doc, label, ML, y + 3, { fontSize: 8, color: GRAY });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(label, ML, y + 3);
      }
      drawBar(doc, ML + 52, y + 0.5, 95, pct, [34, 197, 94]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(`${value}`, ML + CW, y + 3, { align: "right" });
      y += 6.5;
    });
  y += 5;

  addPage();
  sectionTitle(t("国家档案", "Country Profiles"));
  sorted.forEach((c) => {
    checkPageBreak(31);
    const score = computeCompositeScore(c);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(ML, y, CW, 25, 2, 2, "D");

    const cName = countryName(c);
    const agencyDisplay = isZh ? (c.agencyZh || c.agencyEn || "-") : (c.agencyEn || "-");

    if (isZh) {
      addZhText(doc, cName, ML + 3, y + 5, { fontSize: 9, color: DARK, bold: true });
      addZhText(doc, agencyDisplay, ML + 3, y + 10, { fontSize: 7, color: GRAY, maxWidthMm: 70 });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(c.countryEn, ML + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(splitText(doc, c.agencyEn || "-", 70), ML + 3, y + 10);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.text(`${t("评分", "Score")} ${fmt(score, 1)}`, ML + 82, y + 5);
    drawBar(doc, ML + 102, y + 2.5, 38, score, barColor(score));
    doc.setTextColor(...GRAY);
    doc.text(`EPI ${fmt(c.epiScore, 1)} | ${t("可再生", "Renew")} ${fmt(c.wb?.renewableEnergy, 1, "%")} | PM2.5 ${fmt(c.wb?.pm25, 1)} | CO₂/cap ${fmt(c.wb?.co2PerCapita, 1)}`, ML + 82, y + 11);
    const ndcStr = ndcLabel(c, isZh);
    const priceStr = c.carbonPricing?.priceUSD != null ? `$${c.carbonPricing.priceUSD}/${t("吨","t")}` : t("无","None");
    if (isZh) {
      addZhText(doc, `NDC: ${ndcStr} | ${t("碳价", "碳价")}: ${priceStr}`, ML + 82, y + 16, { fontSize: 7, color: GRAY });
    } else {
      doc.text(`NDC: ${ndcStr} | Carbon price: ${priceStr}`, ML + 82, y + 16);
    }
    const laws = (c.keyLaws || []).slice(0, 2).map((law) => {
      const name = isZh ? (law.nameZh || law.nameEn || law.name || "") : (law.nameEn || law.name || "");
      return `${law.year} ${name}`;
    }).join("; ");
    const lawsPrefix = t("主要法律: ", "Key laws: ");
    if (isZh) {
      addZhText(doc, lawsPrefix + (laws || "-"), ML + 82, y + 21, { fontSize: 7, color: GRAY, maxWidthMm: 95 });
    } else {
      doc.text(splitText(doc, `Key laws: ${laws || "-"}`, 95).slice(0, 2), ML + 82, y + 21);
    }
    y += 30;
  });

  // Fill table of contents
  const currentPage = doc.getNumberOfPages();
  doc.setPage(tocPage);
  y = MT;
  const tocTitle = t("目录", "Contents");
  if (isZh) {
    addZhText(doc, tocTitle, ML, y, { fontSize: 22, color: GREEN, bold: true });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...GREEN);
    doc.text(tocTitle, ML, y);
  }
  y += 12;

  if (isZh) {
    addZhText(doc, scopeName, ML, y, { fontSize: 9, color: GRAY });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(scopeName, ML, y);
  }
  y += 12;

  toc.forEach((item) => {
    if (isZh) {
      addZhText(doc, item.title, ML, y, { fontSize: 10, color: DARK });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text(item.title, ML, y);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(String(item.page), W - MR, y, { align: "right" });
    doc.setDrawColor(230, 230, 230);
    doc.line(ML, y + 2, W - MR, y + 2);
    y += 10;
  });

  // Page footers
  const pages = doc.getNumberOfPages();
  const footerRight = t("全球环境治理追踪系统", "Global Environmental Governance Tracker");
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    if (isZh) {
      addZhText(doc, footerRight, ML, H - 8, { fontSize: 7, color: GRAY });
    } else {
      doc.text("Global Environmental Governance Tracker", ML, H - 8);
    }
    doc.text(`${t("第", "Page")} ${p} / ${pages}`, W - MR, H - 8, { align: "right" });
  }
  doc.setPage(currentPage);

  const filename = `${safeName(scopeName)}-${t("环境报告", "Environmental-Summary")}-${date}.pdf`;
  doc.save(filename);
}
