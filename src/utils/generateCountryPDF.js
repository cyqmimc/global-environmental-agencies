/**
 * Generate a professional country environmental report PDF.
 * Uses jsPDF + svg2pdf.js for English; canvas-based CJK rendering for Chinese.
 */
import {
  computeStateIndices,
  computeGovernanceIndices,
  computePercentile,
  percentileToGrade,
  GRADE_COLORS_HEX,
  STATE_DIMENSIONS,
  GOVERNANCE_DIMENSIONS,
  DEFAULT_STATE_WEIGHTS,
  DEFAULT_GOVERNANCE_WEIGHTS,
} from "./score";
import { formatCarbonIntensity } from "./derived";
import { NDC_RATING_CONFIG } from "../constants";
import { addZhText, countZhLines } from "./chineseTextToPDF";

// --- PDF Chart Helpers (pure SVG DOM, no React) ---

function createSVGElement(tag, attrs = {}, children = []) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const child of children) {
    if (typeof child === "string") {
      el.textContent = child;
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

function createRadarSVG(labels, datasets, size = 200) {
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const n = labels.length;
  const pts = labels.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { cos: Math.cos(a), sin: Math.sin(a) };
  });

  const svg = createSVGElement("svg", {
    viewBox: `0 0 ${size} ${size}`,
    width: size, height: size,
    xmlns: "http://www.w3.org/2000/svg",
  });

  for (const s of [25, 50, 75, 100]) {
    const polyPts = pts.map(p => `${cx + p.cos * r * s / 100},${cy + p.sin * r * s / 100}`).join(" ");
    svg.appendChild(createSVGElement("polygon", { points: polyPts, fill: "none", stroke: "#e5e7eb", "stroke-width": "0.8" }));
  }
  pts.forEach(p => svg.appendChild(createSVGElement("line", {
    x1: cx, y1: cy, x2: cx + p.cos * r, y2: cy + p.sin * r, stroke: "#e5e7eb", "stroke-width": "0.8"
  })));
  datasets.forEach(ds => {
    const polyPts = ds.data.map((v, i) => {
      const ratio = Math.min(v, 100) / 100;
      return `${cx + pts[i].cos * r * ratio},${cy + pts[i].sin * r * ratio}`;
    }).join(" ");
    svg.appendChild(createSVGElement("polygon", {
      points: polyPts, fill: ds.color + "33", stroke: ds.color,
      "stroke-width": ds.dash ? "1" : "1.5", "stroke-dasharray": ds.dash ? "4 4" : "none"
    }));
    if (!ds.dash) {
      ds.data.forEach((v, i) => {
        const ratio = Math.min(v, 100) / 100;
        svg.appendChild(createSVGElement("circle", {
          cx: cx + pts[i].cos * r * ratio, cy: cy + pts[i].sin * r * ratio, r: "2.5", fill: ds.color
        }));
      });
    }
  });
  labels.forEach((label, i) => {
    const lr = r + 16;
    const x = cx + pts[i].cos * lr, y = cy + pts[i].sin * lr;
    const anchor = pts[i].cos < -0.1 ? "end" : pts[i].cos > 0.1 ? "start" : "middle";
    svg.appendChild(createSVGElement("text", {
      x, y, "text-anchor": anchor, "dominant-baseline": "central",
      fill: "#6b7280", "font-size": "9", "font-family": "Helvetica, sans-serif"
    }, [label]));
  });
  return svg;
}

function createTrendSVG(datasets, yUnit = "", width = 240, height = 100) {
  const padTop = 12, padBot = 20, padLeft = 36, padRight = 8;
  const plotW = width - padLeft - padRight, plotH = height - padTop - padBot;
  const allPts = datasets.flatMap(ds => ds.data || []);
  if (!allPts.length) return null;

  const years = [...new Set(allPts.map(p => p.year))].sort((a, b) => a - b);
  const vals = allPts.map(p => p.value);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const rng = maxV - minV || 1;
  const yMin = Math.max(0, minV - rng * 0.1), yMax = maxV + rng * 0.1;
  const xS = yr => padLeft + ((yr - years[0]) / (years[years.length - 1] - years[0] || 1)) * plotW;
  const yS = v => padTop + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const svg = createSVGElement("svg", {
    viewBox: `0 0 ${width} ${height}`, width, height,
    xmlns: "http://www.w3.org/2000/svg",
  });

  const fmtY = v => Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
  for (let i = 0; i <= 3; i++) {
    const v = yMin + ((yMax - yMin) / 3) * i;
    const y = yS(v);
    svg.appendChild(createSVGElement("line", { x1: padLeft, y1: y, x2: width - padRight, y2: y, stroke: "#e5e7eb", "stroke-width": "0.5" }));
    svg.appendChild(createSVGElement("text", { x: padLeft - 3, y, "text-anchor": "end", "dominant-baseline": "central", fill: "#9ca3af", "font-size": "7", "font-family": "Helvetica" }, [fmtY(v) + yUnit]));
  }
  years.forEach(yr => svg.appendChild(createSVGElement("text", {
    x: xS(yr), y: padTop + plotH + 12, "text-anchor": "middle", fill: "#9ca3af", "font-size": "7", "font-family": "Helvetica"
  }, [String(yr)])));

  datasets.forEach(ds => {
    if (!ds.data?.length) return;
    const sorted = [...ds.data].sort((a, b) => a.year - b.year);
    const segs = [];
    let seg = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].year - sorted[i - 1].year > 1) {
        segs.push({ pts: seg, gap: false });
        segs.push({ pts: [sorted[i - 1], sorted[i]], gap: true });
        seg = [sorted[i]];
      } else { seg.push(sorted[i]); }
    }
    if (seg.length) segs.push({ pts: seg, gap: false });

    segs.forEach(s => {
      const d = s.pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xS(p.year)} ${yS(p.value)}`).join(" ");
      svg.appendChild(createSVGElement("path", {
        d, fill: "none", stroke: ds.color, "stroke-width": s.gap ? "1" : "1.5",
        "stroke-dasharray": s.gap ? "4 2" : "none", opacity: s.gap ? "0.5" : "1"
      }));
    });
    sorted.forEach(p => svg.appendChild(createSVGElement("circle", {
      cx: xS(p.year), cy: yS(p.value), r: "2", fill: ds.color
    })));
  });
  return svg;
}

// --- Scorecard logic ---
// Percentile/grade math and the State/Governance index computation itself
// live in ./score.js (shared with Scorecard.jsx and RankingsView.jsx). Only
// PDF-specific display formatting stays here.

function formatStateRaw(key, country) {
  const dim = STATE_DIMENSIONS.find((d) => d.key === key);
  const value = dim.getRaw(country);
  if (value == null) return "—";
  if (key === "epi") return `${value}`;
  if (key === "air") return `${value.toFixed(1)} µg/m³`;
  return `${value.toFixed(1)}%`;
}

function formatGovernanceRaw(key, country) {
  switch (key) {
    case "ndcRating": return country.parisAgreement?.ndcRating ?? "—";
    case "carbonPricing":
      return country.carbonPricing?.priceUSD != null
        ? `$${country.carbonPricing.priceUSD}x${country.carbonPricing.coveragePercent ?? 0}%`
        : "—";
    case "btr": return country.reportingStatus?.btrSubmitted == null ? "—" : country.reportingStatus.btrSubmitted ? "Y" : "N";
    case "kigali": return country.montrealProtocol?.kigaliAmendment == null ? "—" : country.montrealProtocol.kigaliAmendment ? "Y" : "N";
    case "ndc3": return country.parisAgreement?.ndc3Submitted == null ? "—" : country.parisAgreement.ndc3Submitted ? "Y" : "N";
    case "ldn": return country.desertification?.ldnTargetSet == null ? "—" : country.desertification.ldnTargetSet ? "Y" : "N";
    case "renewable": return country.wb?.renewableEnergy != null ? `${country.wb.renewableEnergy.toFixed(1)}%` : "—";
    case "carbonIntensity": {
      const dim = GOVERNANCE_DIMENSIONS.find((d) => d.key === "carbonIntensity");
      return formatCarbonIntensity(dim.getRaw(country));
    }
    default: return "—";
  }
}

// --- Main PDF Generator ---

export async function generateCountryPDF(country, language, globalAvg, allCountries, stateWeights = DEFAULT_STATE_WEIGHTS, governanceWeights = DEFAULT_GOVERNANCE_WEIGHTS) {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([
    import("jspdf"),
    import("svg2pdf.js"),
  ]);

  const isZh = language === "zh";
  const t = (zh, en) => isZh ? zh : en;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const ML = 15, MR = 15, MT = 15;
  const CW = W - ML - MR;
  let y = MT;

  const GREEN = [22, 163, 74];
  const GRAY = [107, 114, 128];
  const DARK = [31, 41, 55];
  const LIGHT = [243, 244, 246];

  function addPage() { doc.addPage(); y = MT; drawFooter(); }
  function checkPageBreak(needed) { if (y + needed > H - 20) addPage(); }

  function drawFooter() {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    const date = new Date().toISOString().slice(0, 10);
    const footerLeft = t(
      `生成于 ${date} | 数据来源: 世界银行、耶鲁EPI、气候行动追踪、IQAir、UNFCCC`,
      `Generated ${date} | Data: World Bank, Yale EPI, Climate Action Tracker, IQAir, UNFCCC`
    );
    const footerRight = t("全球环境治理追踪系统", "Global Environmental Governance Tracker");
    if (isZh) {
      addZhText(doc, footerLeft, ML, H - 8, { fontSize: 7, color: GRAY });
      addZhText(doc, footerRight, W - MR, H - 8, { fontSize: 7, color: GRAY, align: "right" });
    } else {
      doc.text(footerLeft, ML, H - 8);
      doc.text(footerRight, W - MR, H - 8, { align: "right" });
    }
  }

  function sectionTitle(text) {
    checkPageBreak(12);
    if (isZh) {
      addZhText(doc, text, ML, y, { fontSize: 11, color: GREEN, bold: true });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.text(text, ML, y);
    }
    y += 2;
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    doc.line(ML, y, ML + CW, y);
    y += 5;
  }

  // --- PAGE 1: Header ---
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 32, "F");

  doc.setTextColor(255, 255, 255);
  const countryName = t(country.countryZh, country.countryEn);
  const agencyName = t(country.agencyZh, country.agencyEn);

  if (isZh) {
    addZhText(doc, countryName, ML, 14, { fontSize: 20, color: "#ffffff", bold: true });
    addZhText(doc, agencyName, ML, 21, { fontSize: 10, color: "#ffffff" });
  } else {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(country.countryEn, ML, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(country.agencyEn, ML, 21);
  }

  doc.setFontSize(8);
  const badges = [
    country.region,
    `${t("成立", "Est.")} ${country.established}`,
    `EPI ${country.epiScore}`,
    country.netZeroTarget ? `${t("净零", "Net Zero")} ${country.netZeroTarget}` : null,
  ].filter(Boolean);
  let bx = ML;
  badges.forEach(badge => {
    const tw = doc.getTextWidth(badge) + 6;
    doc.setFillColor(255, 255, 255, 50);
    doc.roundedRect(bx, 24, tw, 5, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(badge, bx + 3, 27.8);
    bx += tw + 2;
  });

  y = 40;
  drawFooter();

  // --- Scorecard: two independent indices (State = endowment, Governance =
  // policy performance) — see src/utils/score.js for why these are kept
  // separate rather than blended into one number.
  sectionTitle(t("环境成绩单", "Environmental Scorecard"));

  const stateResults = computeStateIndices(allCountries, stateWeights);
  const governanceResults = computeGovernanceIndices(allCountries, governanceWeights);

  function drawIndexBlock(title, results, dimensions, formatRaw) {
    checkPageBreak(15 + dimensions.length * 6 + 6);
    const myResult = results.get(country);
    const allScores = allCountries.map(c => results.get(c)?.score).filter(v => v != null);
    const pct = myResult?.score != null ? computePercentile(myResult.score, allScores) : null;
    const grade = percentileToGrade(pct);
    const gradeColor = grade ? (GRADE_COLORS_HEX[grade] || "#6b7280") : "#9ca3af";

    if (isZh) addZhText(doc, title, ML, y, { fontSize: 9, color: GREEN, bold: true });
    else { doc.setFontSize(9); doc.setTextColor(...GREEN); doc.setFont("helvetica", "bold"); doc.text(title, ML, y); }
    y += 6;

    doc.setFillColor(gradeColor);
    doc.circle(ML + 8, y + 5, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(grade ?? "—", ML + 8, y + 6.5, { align: "center" });

    const scoreLabel = myResult?.score != null
      ? t(`评分: ${myResult.score}/100`, `Score: ${myResult.score}/100`)
      : t("数据不足（有效维度 <4）", "Insufficient data (<4 valid dimensions)");
    const rankLabel = pct != null
      ? t(`在 ${allScores.length} 个有效国家中排名前 ${Math.round(100 - pct)}%`, `Top ${Math.round(pct)}% of ${allScores.length} scored countries`)
      : "";

    if (isZh) {
      addZhText(doc, scoreLabel, ML + 20, y + 3, { fontSize: 10, color: DARK, bold: true });
      if (rankLabel) addZhText(doc, rankLabel, ML + 20, y + 8, { fontSize: 8, color: GRAY });
    } else {
      doc.setTextColor(...DARK);
      doc.setFontSize(10);
      doc.text(scoreLabel, ML + 20, y + 3);
      if (rankLabel) { doc.setFontSize(8); doc.setTextColor(...GRAY); doc.text(rankLabel, ML + 20, y + 8); }
    }

    y += 15;

    dimensions.forEach(dim => {
      const dimScore = myResult?.dimScores?.[dim.key];
      const dimGrade = dimScore != null ? percentileToGrade(dimScore) : null;
      const gc = dimGrade ? (GRADE_COLORS_HEX[dimGrade] || "#6b7280") : "#d1d5db";
      const label = isZh ? dim.zh : dim.en;

      if (isZh) addZhText(doc, label, ML, y + 3, { fontSize: 7.5, color: GRAY });
      else { doc.setFontSize(7.5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal"); doc.text(label, ML, y + 3); }

      const barX = ML + 35, barW = CW - 55;
      doc.setFillColor(...LIGHT);
      doc.roundedRect(barX, y + 0.5, barW, 3.5, 1, 1, "F");
      if (dimScore != null) {
        const fillW = Math.max(1, barW * dimScore / 100);
        doc.setFillColor(gc);
        doc.roundedRect(barX, y + 0.5, fillW, 3.5, 1, 1, "F");
      }

      doc.setTextColor(...GRAY);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(formatRaw(dim.key, country), ML + CW, y + 3, { align: "right" });

      y += 6;
    });

    y += 4;
  }

  drawIndexBlock(t("状态指数（禀赋）", "State Index (Endowment)"), stateResults, STATE_DIMENSIONS, formatStateRaw);
  drawIndexBlock(t("治理指数（绩效）", "Governance Index (Performance)"), governanceResults, GOVERNANCE_DIMENSIONS, (key) => formatGovernanceRaw(key, country));

  // --- Key Metrics Grid ---
  sectionTitle(t("关键指标", "Key Indicators"));

  const dy = country.wb?.dataYear || {};
  const metrics = [
    { label: t("森林覆盖率", "Forest Area"), value: (country.wb?.forestArea?.toFixed(1) ?? "—") + "%", avg: globalAvg.forestCoverage + "%", year: dy.forestArea },
    { label: t("可再生能源", "Renewable Energy"), value: (country.wb?.renewableEnergy?.toFixed(1) ?? "—") + "%", avg: globalAvg.renewableEnergy + "%", year: dy.renewableEnergy },
    { label: t("自然保护区", "Protected Areas"), value: (country.wb?.protectedAreas?.toFixed(1) ?? "—") + "%", avg: globalAvg.protectedAreas + "%", year: dy.protectedAreas },
    { label: "PM2.5 (µg/m³)", value: country.wb?.pm25?.toFixed(1) ?? "—", avg: String(globalAvg.pm25), year: dy.pm25 },
    { label: t("人均CO₂ (吨)", "CO₂/Capita (t)"), value: country.wb?.co2PerCapita?.toFixed(1) ?? "—", avg: String(globalAvg.co2PerCapita), year: dy.co2Mt },
    { label: "EPI Score", value: String(country.epiScore ?? "—"), avg: "Max 100", year: null },
  ];

  const colW = CW / 3;
  metrics.forEach((m, i) => {
    const col = i % 3;
    if (i > 0 && col === 0) y += 16;
    const mx = ML + col * colW;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, y, colW - 3, 14, 2, 2, "F");

    doc.setTextColor(...DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(m.value, mx + (colW - 3) / 2, y + 5.5, { align: "center" });

    const avgLabel = t(`均 ${m.avg}`, `Avg ${m.avg}`) + (m.year ? ` | ${m.year}` : "");

    if (isZh) {
      addZhText(doc, m.label, mx + (colW - 3) / 2, y + 9.5, { fontSize: 6.5, color: GRAY, align: "center" });
      addZhText(doc, avgLabel, mx + (colW - 3) / 2, y + 12.5, { fontSize: 6, color: GRAY, align: "center" });
    } else {
      doc.setTextColor(...GRAY);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text(m.label, mx + (colW - 3) / 2, y + 9.5, { align: "center" });
      doc.text(avgLabel, mx + (colW - 3) / 2, y + 12.5, { align: "center" });
    }
  });

  y += 20;

  // --- Compliance Overview ---
  sectionTitle(t("履约状况", "Compliance Status"));

  const ndcCfg = NDC_RATING_CONFIG[country.parisAgreement?.ndcRating] || {};
  const compliance = [
    {
      label: t("NDC 评级", "NDC Rating"),
      value: t(ndcCfg.zh, ndcCfg.en) || "N/A",
      good: ["1.5C", "2C", "almost_sufficient"].includes(country.parisAgreement?.ndcRating),
    },
    {
      label: t("碳价", "Carbon Price"),
      value: country.carbonPricing?.priceUSD != null
        ? `$${country.carbonPricing.priceUSD}/${t("吨", "t")}`
        : t("无", "None"),
      good: country.carbonPricing?.priceUSD != null,
    },
    {
      label: t("BTR 状态", "BTR Status"),
      value: country.reportingStatus?.btrSubmitted
        ? t(`已提交 (${country.reportingStatus.btrYear || ""})`, `Submitted (${country.reportingStatus.btrYear || ""})`)
        : t("待提交", "Pending"),
      good: country.reportingStatus?.btrSubmitted,
    },
    {
      label: t("基加利修正案", "Kigali Amendment"),
      value: country.montrealProtocol?.kigaliAmendment ? t("已批准", "Ratified") : t("未批准", "Not ratified"),
      good: country.montrealProtocol?.kigaliAmendment,
    },
    {
      label: "CBD 30×30",
      value: (country.wb?.protectedAreas ?? 0) >= 30
        ? t(`达标 (${country.wb?.protectedAreas?.toFixed(1)}%)`, `Met (${country.wb?.protectedAreas?.toFixed(1)}%)`)
        : `${country.wb?.protectedAreas?.toFixed(1) ?? "—"}%`,
      good: (country.wb?.protectedAreas ?? 0) >= 30,
    },
  ];

  compliance.forEach(c => {
    const statusColor = c.good ? [22, 163, 74] : [220, 38, 38];
    doc.setFillColor(...statusColor);
    doc.circle(ML + 40, y + 2, 1.5, "F");

    if (isZh) {
      addZhText(doc, c.label, ML, y + 3, { fontSize: 8, color: GRAY });
      addZhText(doc, c.value, ML + 44, y + 3, { fontSize: 8, color: DARK, bold: true });
    } else {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(c.label, ML, y + 3);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.text(c.value, ML + 44, y + 3);
    }
    y += 6;
  });

  y += 4;

  // --- PAGE 2: Charts + Laws + Treaties ---
  if (y > H - 100) addPage();

  // Radar Chart
  if (country.wb) {
    sectionTitle(t("环境综合画像", "Environmental Profile"));

    const radarLabels = isZh
      ? ["森林", "可再生", "保护区", "空气", "碳效率", "EPI"]
      : ["Forest", "Renewable", "Protected", "Air Quality", "CO₂ Eff.", "EPI"];

    const radarSVG = createRadarSVG(radarLabels, [
      {
        label: t(country.countryZh, country.countryEn),
        data: [
          Math.min(country.wb.forestArea ?? 0, 100),
          Math.min(country.wb.renewableEnergy ?? 0, 100),
          Math.min(country.wb.protectedAreas ?? 0, 100),
          Math.max(0, 100 - (country.wb.pm25 ?? 100)),
          Math.max(0, 100 - Math.min((country.wb.co2PerCapita ?? 0) * 5, 100)),
          country.epiScore ?? 0,
        ],
        color: "#22c55e",
      },
      {
        label: t("全球平均", "Global Average"),
        data: [
          globalAvg.forestCoverage ?? 0,
          globalAvg.renewableEnergy ?? 0,
          globalAvg.protectedAreas ?? 0,
          Math.max(0, 100 - (globalAvg.pm25 ?? 100)),
          Math.max(0, 100 - Math.min((globalAvg.co2PerCapita ?? 0) * 5, 100)),
          50,
        ],
        color: "#9ca3af",
        dash: true,
      },
    ], 200);

    document.body.appendChild(radarSVG);
    radarSVG.style.position = "absolute";
    radarSVG.style.left = "-9999px";
    await svg2pdf(radarSVG, doc, { x: ML + (CW - 60) / 2, y, width: 60, height: 60 });
    document.body.removeChild(radarSVG);

    y += 62;
    doc.setFontSize(7);
    doc.setFillColor(34, 197, 94);
    doc.rect(ML + CW / 2 - 30, y, 3, 3, "F");
    const legendCountry = t(country.countryZh, country.countryEn);
    const legendGlobal = t("全球平均", "Global Average");
    if (isZh) {
      addZhText(doc, legendCountry, ML + CW / 2 - 25, y + 2.5, { fontSize: 7, color: GRAY });
      doc.setFillColor(156, 163, 175);
      doc.rect(ML + CW / 2 + 20, y, 3, 3, "F");
      addZhText(doc, legendGlobal, ML + CW / 2 + 25, y + 2.5, { fontSize: 7, color: GRAY });
    } else {
      doc.setTextColor(...GRAY);
      doc.text(legendCountry, ML + CW / 2 - 25, y + 2.5);
      doc.setFillColor(156, 163, 175);
      doc.rect(ML + CW / 2 + 10, y, 3, 3, "F");
      doc.text(legendGlobal, ML + CW / 2 + 15, y + 2.5);
    }
    y += 8;
  }

  // Trend Charts
  if (country.wb?.history) {
    const trendMetrics = [
      { key: "co2Mt", label: t("CO₂排放 (Mt)", "CO₂ Emissions (Mt)"), color: "#dc2626" },
      { key: "pm25", label: "PM2.5 (µg/m³)", color: "#d97706" },
      { key: "forestArea", label: t("森林覆盖率", "Forest Area %"), unit: "%", color: "#16a34a" },
      { key: "renewableEnergy", label: t("可再生能源", "Renewable Energy %"), unit: "%", color: "#059669" },
    ].filter(m => country.wb.history[m.key]?.length > 1);

    if (trendMetrics.length > 0) {
      checkPageBreak(50);
      sectionTitle(t("历史趋势", "Historical Trends"));

      const trendW = (CW - 6) / 2;
      for (const [i, m] of trendMetrics.entries()) {
        const col = i % 2;
        if (i > 0 && col === 0) y += 42;
        const tx = ML + col * (trendW + 6);

        if (isZh) {
          addZhText(doc, m.label, tx + trendW / 2, y + 3, { fontSize: 7, color: GRAY, align: "center" });
        } else {
          doc.setFontSize(7);
          doc.setTextColor(...GRAY);
          doc.text(m.label, tx + trendW / 2, y + 3, { align: "center" });
        }

        const tsvg = createTrendSVG(
          [{ data: country.wb.history[m.key], color: m.color }],
          m.unit || "", trendW * 2.8, 90
        );
        if (tsvg) {
          document.body.appendChild(tsvg);
          tsvg.style.position = "absolute";
          tsvg.style.left = "-9999px";
          try {
            await svg2pdf(tsvg, doc, { x: tx, y: y + 4, width: trendW, height: 32 });
          } finally {
            document.body.removeChild(tsvg);
          }
        }
      }
      y += 42;
    }
  }

  // Key Laws
  if (country.keyLaws?.length) {
    checkPageBreak(30);
    sectionTitle(t("核心环保法律", "Key Environmental Laws"));

    country.keyLaws.forEach(law => {
      checkPageBreak(7);
      doc.setFontSize(7.5);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.text(`${law.year}`, ML, y + 3);

      const lawName = isZh
        ? (law.nameZh || law.nameEn || law.name || "")
        : (law.nameEn || law.name || law.nameZh || "");

      if (isZh && lawName) {
        const numLines = countZhLines(lawName, CW - 15, 7.5);
        addZhText(doc, lawName, ML + 14, y + 3, { fontSize: 7.5, color: DARK, maxWidthMm: CW - 15 });
        y += numLines * 3.5 + 2;
      } else {
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(lawName, CW - 15);
        doc.text(lines, ML + 14, y + 3);
        y += lines.length * 3.5 + 2;
      }
    });
    y += 3;
  }

  // Treaties
  if (country.treaties?.length) {
    checkPageBreak(20);
    sectionTitle(t("重点公约（节选）", "Selected Treaties"));

    const cols = 3;
    const tw = CW / cols;
    country.treaties.forEach((treaty, i) => {
      const col = i % cols;
      if (i > 0 && col === 0) y += 5;
      if (col === 0) checkPageBreak(7);
      doc.setFontSize(7);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "normal");
      doc.text("• " + treaty, ML + col * tw, y + 3);
    });
    y += 8;
  }

  // NDC History
  if (country.parisAgreement?.ndcHistory?.length) {
    checkPageBreak(20);
    sectionTitle(t("NDC 提交历史", "NDC Submission History"));

    country.parisAgreement.ndcHistory.forEach(h => {
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(String(h.year), ML, y + 3);
      doc.setTextColor(...DARK);
      doc.text(h.version, ML + 14, y + 3);
      y += 5;
    });

    const ndcTarget = isZh
      ? (country.parisAgreement.ndcTargetZh || country.parisAgreement.ndcTargetEn || "")
      : (country.parisAgreement.ndcTargetEn || country.parisAgreement.ndcTargetZh || "");

    if (ndcTarget) {
      y += 2;
      const targetFull = t("目标: ", "Target: ") + ndcTarget;
      if (isZh) {
        const numLines = countZhLines(targetFull, CW, 7);
        addZhText(doc, targetFull, ML, y + 3, { fontSize: 7, color: GRAY, maxWidthMm: CW });
        y += numLines * 3 + 3;
      } else {
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.setFont("helvetica", "italic");
        const lines = doc.splitTextToSize(targetFull, CW);
        doc.text(lines, ML, y + 3);
        y += lines.length * 3 + 3;
      }
    }
  }

  // Save
  const nameForFile = (isZh ? country.countryZh : country.countryEn) || country.countryEn;
  const filename = isZh
    ? `${nameForFile}-环境报告-${new Date().toISOString().slice(0, 10)}.pdf`
    : `${country.countryEn.replace(/\s+/g, "-")}-Environmental-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
