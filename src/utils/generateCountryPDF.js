/**
 * Generate a professional country environmental report PDF.
 * Uses jsPDF + svg2pdf.js, lazy-loaded at click time.
 */
import { computeCompositeScore } from "../components/RankingsView";
import { TREATY_LABELS, NDC_RATING_CONFIG } from "../constants";

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

  // Grid rings
  for (const s of [25, 50, 75, 100]) {
    const polyPts = pts.map(p => `${cx + p.cos * r * s / 100},${cy + p.sin * r * s / 100}`).join(" ");
    svg.appendChild(createSVGElement("polygon", { points: polyPts, fill: "none", stroke: "#e5e7eb", "stroke-width": "0.8" }));
  }
  // Axis lines
  pts.forEach(p => svg.appendChild(createSVGElement("line", {
    x1: cx, y1: cy, x2: cx + p.cos * r, y2: cy + p.sin * r, stroke: "#e5e7eb", "stroke-width": "0.8"
  })));
  // Data polygons
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
  // Labels
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

  // Y grid
  const fmtY = v => Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
  for (let i = 0; i <= 3; i++) {
    const v = yMin + ((yMax - yMin) / 3) * i;
    const y = yS(v);
    svg.appendChild(createSVGElement("line", { x1: padLeft, y1: y, x2: width - padRight, y2: y, stroke: "#e5e7eb", "stroke-width": "0.5" }));
    svg.appendChild(createSVGElement("text", { x: padLeft - 3, y, "text-anchor": "end", "dominant-baseline": "central", fill: "#9ca3af", "font-size": "7", "font-family": "Helvetica" }, [fmtY(v) + yUnit]));
  }
  // X labels
  years.forEach(yr => svg.appendChild(createSVGElement("text", {
    x: xS(yr), y: padTop + plotH + 12, "text-anchor": "middle", fill: "#9ca3af", "font-size": "7", "font-family": "Helvetica"
  }, [String(yr)])));

  // Lines + dots
  datasets.forEach(ds => {
    if (!ds.data?.length) return;
    const sorted = [...ds.data].sort((a, b) => a.year - b.year);
    // Split into segments for gap handling
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

// --- Scorecard logic (replicated from Scorecard.jsx) ---

function computePercentile(value, allValues) {
  if (!allValues.length) return 50;
  return (allValues.filter(v => v < value).length / allValues.length) * 100;
}

function percentileToGrade(p) {
  if (p >= 95) return "A+"; if (p >= 85) return "A"; if (p >= 70) return "B+";
  if (p >= 50) return "B"; if (p >= 30) return "C"; if (p >= 15) return "D"; return "F";
}

const GRADE_COLORS = {
  "A+": "#166534", A: "#16a34a", "B+": "#84cc16", B: "#eab308",
  C: "#f97316", D: "#dc2626", F: "#7f1d1d"
};

function getDimValue(c, dim) {
  switch (dim) {
    case "forest": return Math.min(c.wb?.forestArea ?? 0, 100);
    case "renewable": return Math.min(c.wb?.renewableEnergy ?? 0, 100);
    case "protected": return Math.min(c.wb?.protectedAreas ?? 0, 100);
    case "air": return 100 - Math.min(c.wb?.pm25 ?? 100, 100);
    case "co2": return 100 - Math.min((c.wb?.co2PerCapita ?? 0) * 5, 100);
    case "epi": return c.epiScore ?? 0;
    default: return 0;
  }
}

const DIMS = [
  { key: "epi", label: "EPI Score" },
  { key: "renewable", label: "Renewable Energy" },
  { key: "forest", label: "Forest Coverage" },
  { key: "protected", label: "Protected Areas" },
  { key: "air", label: "Air Quality" },
  { key: "co2", label: "CO₂ Efficiency" },
];

// --- Main PDF Generator ---

export async function generateCountryPDF(country, language, globalAvg, allCountries) {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([
    import("jspdf"),
    import("svg2pdf.js"),
  ]);

  const t = (zh, en) => language === "zh" ? zh : en;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const ML = 15, MR = 15, MT = 15;
  const CW = W - ML - MR; // content width
  let y = MT;

  // Colors
  const GREEN = [22, 163, 74];   // green-600
  const GRAY = [107, 114, 128];  // gray-500
  const DARK = [31, 41, 55];     // gray-800
  const LIGHT = [243, 244, 246]; // gray-100

  // --- Helper functions ---
  function addPage() { doc.addPage(); y = MT; drawFooter(); }

  function checkPageBreak(needed) { if (y + needed > H - 20) addPage(); }

  function drawFooter() {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    const date = new Date().toISOString().slice(0, 10);
    doc.text(`Generated ${date} | Data: World Bank, Yale EPI, Climate Action Tracker, IQAir, UNFCCC`, ML, H - 8);
    doc.text(`Global Environmental Governance Tracker`, W - MR, H - 8, { align: "right" });
  }

  function sectionTitle(text) {
    checkPageBreak(12);
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.text(text, ML, y);
    y += 2;
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    doc.line(ML, y, ML + CW, y);
    y += 5;
  }

  function labelValue(label, value, x, width) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(String(value ?? "—"), x + width, y, { align: "right" });
  }

  // --- PAGE 1: Header + Overview ---
  // Green header bar
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 32, "F");

  // Country name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(country.countryEn, ML, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(country.agencyEn, ML, 21);

  // Badges
  doc.setFontSize(8);
  const badges = [
    country.region,
    `Est. ${country.established}`,
    `EPI ${country.epiScore}`,
    country.netZeroTarget ? `Net Zero ${country.netZeroTarget}` : null,
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

  // --- Scorecard ---
  sectionTitle(t("环境成绩单", "Environmental Scorecard"));

  const allComposite = allCountries.map(c => computeCompositeScore(c));
  const myComposite = computeCompositeScore(country);
  const overallPct = computePercentile(myComposite, allComposite);
  const overallGrade = percentileToGrade(overallPct);

  // Grade circle
  const gradeColor = GRADE_COLORS[overallGrade] || "#6b7280";
  doc.setFillColor(gradeColor);
  doc.circle(ML + 8, y + 5, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(overallGrade, ML + 8, y + 6.5, { align: "center" });

  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.text(`Composite Score: ${myComposite}/100`, ML + 20, y + 3);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Top ${Math.round(overallPct)}% of ${allCountries.length} countries`, ML + 20, y + 8);

  y += 15;

  // Dimension bars
  DIMS.forEach(dim => {
    const allVals = allCountries.map(c => getDimValue(c, dim.key));
    const myVal = getDimValue(country, dim.key);
    const pct = computePercentile(myVal, allVals);
    const grade = percentileToGrade(pct);
    const gc = GRADE_COLORS[grade] || "#6b7280";

    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(dim.label, ML, y + 3);

    // Grade badge
    doc.setFillColor(gc);
    doc.roundedRect(ML + 35, y, 8, 4.5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(grade, ML + 39, y + 3.2, { align: "center" });

    // Bar
    const barX = ML + 46, barW = CW - 60;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(barX, y + 0.5, barW, 3.5, 1, 1, "F");
    const fillW = Math.max(1, barW * pct / 100);
    const barColor = pct >= 70 ? [34, 197, 94] : pct >= 40 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(...barColor);
    doc.roundedRect(barX, y + 0.5, fillW, 3.5, 1, 1, "F");

    // Percentile
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`${Math.round(pct)}%`, ML + CW, y + 3, { align: "right" });

    y += 6;
  });

  y += 4;

  // --- Key Metrics Grid ---
  sectionTitle(t("关键指标", "Key Indicators"));

  const dy = country.wb?.dataYear || {};
  const metrics = [
    { label: t("森林覆盖率", "Forest Area"), value: country.wb?.forestArea?.toFixed(1) + "%" ?? "—", avg: globalAvg.forestCoverage + "%", year: dy.forestArea },
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

    doc.setTextColor(...GRAY);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(m.label, mx + (colW - 3) / 2, y + 9.5, { align: "center" });
    doc.text(`Avg ${m.avg}${m.year ? ` | ${m.year}` : ""}`, mx + (colW - 3) / 2, y + 12.5, { align: "center" });
  });

  y += 20;

  // --- Compliance Overview ---
  sectionTitle(t("履约状况", "Compliance Status"));

  const ndcCfg = NDC_RATING_CONFIG[country.parisAgreement?.ndcRating] || {};
  const compliance = [
    { label: "NDC Rating", value: ndcCfg.en || "N/A", good: ["1.5C", "2C", "almost_sufficient"].includes(country.parisAgreement?.ndcRating) },
    { label: "Carbon Price", value: country.carbonPricing?.priceUSD != null ? `$${country.carbonPricing.priceUSD}/t` : "None", good: country.carbonPricing?.priceUSD != null },
    { label: "BTR Status", value: country.reportingStatus?.btrSubmitted ? `Submitted (${country.reportingStatus.btrYear})` : "Pending", good: country.reportingStatus?.btrSubmitted },
    { label: "Kigali Amendment", value: country.montrealProtocol?.kigaliAmendment ? "Ratified" : "Not ratified", good: country.montrealProtocol?.kigaliAmendment },
    { label: "CBD 30×30", value: (country.wb?.protectedAreas ?? 0) >= 30 ? `Met (${country.wb?.protectedAreas?.toFixed(1)}%)` : `${country.wb?.protectedAreas?.toFixed(1) ?? "—"}%`, good: (country.wb?.protectedAreas ?? 0) >= 30 },
  ];

  compliance.forEach(c => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(c.label, ML, y + 3);

    const statusColor = c.good ? [22, 163, 74] : [220, 38, 38];
    doc.setFillColor(...statusColor);
    doc.circle(ML + 40, y + 2, 1.5, "F");

    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(c.value, ML + 44, y + 3);
    y += 6;
  });

  y += 4;

  // --- PAGE 2: Charts + Laws + Treaties ---
  if (y > H - 100) addPage();

  // Radar Chart
  if (country.wb) {
    sectionTitle(t("环境综合画像", "Environmental Profile"));

    const radarLabels = ["Forest", "Renewable", "Protected", "Air Quality", "CO₂ Eff.", "EPI"];
    const radarSVG = createRadarSVG(radarLabels, [
      {
        label: country.countryEn,
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
        label: "Global Average",
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

    // Embed SVG via svg2pdf.js
    document.body.appendChild(radarSVG);
    radarSVG.style.position = "absolute";
    radarSVG.style.left = "-9999px";
    await svg2pdf(radarSVG, doc, { x: ML + (CW - 60) / 2, y, width: 60, height: 60 });
    document.body.removeChild(radarSVG);

    // Legend
    y += 62;
    doc.setFontSize(7);
    doc.setFillColor(34, 197, 94);
    doc.rect(ML + CW / 2 - 30, y, 3, 3, "F");
    doc.setTextColor(...GRAY);
    doc.text(country.countryEn, ML + CW / 2 - 25, y + 2.5);
    doc.setFillColor(156, 163, 175);
    doc.rect(ML + CW / 2 + 10, y, 3, 3, "F");
    doc.text("Global Average", ML + CW / 2 + 15, y + 2.5);
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
      trendMetrics.forEach((m, i) => {
        const col = i % 2;
        if (i > 0 && col === 0) y += 42;
        const tx = ML + col * (trendW + 6);

        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(m.label, tx + trendW / 2, y + 3, { align: "center" });

        const tsvg = createTrendSVG(
          [{ data: country.wb.history[m.key], color: m.color }],
          m.unit || "", trendW * 2.8, 90
        );
        if (tsvg) {
          document.body.appendChild(tsvg);
          tsvg.style.position = "absolute";
          tsvg.style.left = "-9999px";
          svg2pdf(tsvg, doc, { x: tx, y: y + 4, width: trendW, height: 32 });
          document.body.removeChild(tsvg);
        }
      });
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
      doc.setFont("helvetica", "normal");
      const lawName = language === "zh" ? (law.nameZh || law.nameEn || law.name) : (law.nameEn || law.name);
      const lines = doc.splitTextToSize(lawName, CW - 15);
      doc.text(lines, ML + 14, y + 3);
      y += lines.length * 3.5 + 2;
    });
    y += 3;
  }

  // Treaties
  if (country.treaties?.length) {
    checkPageBreak(20);
    sectionTitle(t("国际公约", "International Treaties"));

    const cols = 3;
    const tw = CW / cols;
    country.treaties.forEach((treaty, i) => {
      const col = i % cols;
      if (i > 0 && col === 0) y += 5;
      if (col === 0) checkPageBreak(7);
      doc.setFontSize(7);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "normal");
      const name = language === "zh" ? (TREATY_LABELS[treaty] || treaty) : treaty;
      doc.text("• " + name, ML + col * tw, y + 3);
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
      doc.text(String(h.year), ML, y + 3);
      doc.setTextColor(...DARK);
      doc.text(h.version, ML + 14, y + 3);
      y += 5;
    });

    if (country.parisAgreement.ndcTargetEn) {
      y += 2;
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "italic");
      const target = language === "zh" ? country.parisAgreement.ndcTargetZh : country.parisAgreement.ndcTargetEn;
      const lines = doc.splitTextToSize(t("目标: ", "Target: ") + target, CW);
      doc.text(lines, ML, y + 3);
      y += lines.length * 3 + 3;
    }
  }

  // Save
  const filename = `${country.countryEn.replace(/\s+/g, "-")}-Environmental-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
