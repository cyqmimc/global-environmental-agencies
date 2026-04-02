/**
 * Data freshness checker
 * Scans all data sources and reports what may need updating.
 *
 * Usage: npm run check-updates
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const NOW = new Date();
const YEAR = NOW.getFullYear();
const MONTH = NOW.getMonth() + 1;

const warnings = [];
const ok = [];

function warn(msg) { warnings.push(`⚠  ${msg}`); }
function good(msg) { ok.push(`✓  ${msg}`); }

function monthsSince(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  return (NOW - d) / (1000 * 60 * 60 * 24 * 30);
}

function main() {
  console.log("🔍 Checking data freshness...\n");

  // --- 1. World Bank data ---
  let wbData;
  try {
    wbData = JSON.parse(readFileSync(resolve(ROOT, "public/wb-data.json"), "utf-8"));
  } catch {
    warn("wb-data.json not found! Run: npm run fetch-data");
  }

  if (wbData) {
    const fetchedAt = wbData.meta?.fetchedAt;
    const months = monthsSince(fetchedAt);
    if (months > 6) {
      warn(`世界银行数据已 ${Math.round(months)} 个月未更新 (fetched: ${fetchedAt?.slice(0, 10)}). Run: npm run fetch-data`);
    } else if (months > 3) {
      warn(`世界银行数据已 ${Math.round(months)} 个月未更新 (fetched: ${fetchedAt?.slice(0, 10)}), 建议季度更新`);
    } else {
      good(`世界银行数据较新 (${fetchedAt?.slice(0, 10)})`);
    }

    // Check indicator data year staleness
    const yearCounts = {};
    for (const c of Object.values(wbData.countries)) {
      for (const [key, year] of Object.entries(c.dataYear || {})) {
        if (!yearCounts[key]) yearCounts[key] = {};
        if (year) yearCounts[key][year] = (yearCounts[key][year] || 0) + 1;
      }
    }
    for (const [indicator, years] of Object.entries(yearCounts)) {
      const maxYear = Math.max(...Object.keys(years).map(Number));
      if (YEAR - maxYear >= 4) {
        warn(`WB 指标 ${indicator} 数据最新仅到 ${maxYear} 年，滞后 ${YEAR - maxYear} 年`);
      }
    }
  }

  // --- 2. Countries curated data ---
  let countries;
  try {
    countries = JSON.parse(readFileSync(resolve(ROOT, "public/countries.json"), "utf-8"));
  } catch {
    warn("countries.json not found!");
    printReport();
    return;
  }

  good(`收录 ${countries.length} 个国家`);

  // --- 3. NDC deadline check ---
  const pastDeadline = countries.filter(c => {
    const deadline = c.parisAgreement?.nextNdcDeadline;
    return deadline && deadline <= YEAR;
  });
  if (pastDeadline.length > 0) {
    warn(`${pastDeadline.length} 个国家的 NDC 更新截止日已到/已过 (${YEAR}): ${pastDeadline.map(c => c.isoCode).join(", ")}`);
    warn(`→ 需核查这些国家是否已提交新版 NDC，更新 parisAgreement.ndcHistory 和 ndcTargetZh/En`);
  } else {
    good("所有国家 NDC 截止日未到");
  }

  // --- 4. BTR reporting check ---
  const btrPending = countries.filter(c => !c.reportingStatus?.btrSubmitted);
  if (btrPending.length > 0) {
    warn(`${btrPending.length} 个国家 BTR 待提交: ${btrPending.map(c => c.isoCode).join(", ")}`);
    warn(`→ BTR1 截止日为 2024 年底，建议定期核查 UNFCCC 网站更新提交状态`);
  }
  const btrDone = countries.length - btrPending.length;
  good(`${btrDone} 个国家已提交 BTR`);

  // --- 5. Carbon pricing staleness ---
  const noPricing = countries.filter(c => !c.carbonPricing);
  if (noPricing.length > 0) {
    warn(`${noPricing.length} 个国家缺少碳定价数据`);
  }
  // Carbon prices change annually - recommend yearly check
  warn("碳定价数据建议每年更新一次 (来源: World Bank Carbon Pricing Dashboard)");

  // --- 6. EPI score check ---
  // EPI is published every 2 years by Yale
  const epiScores = countries.map(c => c.epiScore).filter(Boolean);
  if (epiScores.length > 0) {
    good(`EPI 评分覆盖 ${epiScores.length}/${countries.length} 个国家 (Yale EPI 每2年更新)`);
  }

  // --- 7. Agency website spot check ---
  const noWebsite = countries.filter(c => !c.website);
  if (noWebsite.length > 0) {
    warn(`${noWebsite.length} 个国家缺少官网链接`);
  } else {
    good("所有国家官网链接完整（建议半年核查一次链接有效性）");
  }

  // --- 8. Key laws check ---
  const noLaws = countries.filter(c => !c.keyLaws || c.keyLaws.length === 0);
  if (noLaws.length > 0) {
    warn(`${noLaws.length} 个国家缺少核心法律数据`);
  } else {
    good(`所有国家均有核心环保法律数据`);
  }

  // --- 9. Missing fields check ---
  const requiredFields = ["parisAgreement", "montrealProtocol", "cbd", "carbonPricing", "reportingStatus", "epiScore", "netZeroTarget"];
  for (const field of requiredFields) {
    const missing = countries.filter(c => !c[field]);
    if (missing.length > 0) {
      warn(`${missing.length} 个国家缺少 ${field} 字段: ${missing.map(c => c.isoCode).join(", ")}`);
    }
  }

  // --- 10. Country coverage ---
  const regionCounts = {};
  countries.forEach(c => { regionCounts[c.region] = (regionCounts[c.region] || 0) + 1; });
  const regionInfo = Object.entries(regionCounts).map(([r, n]) => `${r}: ${n}`).join(", ");
  good(`地区分布: ${regionInfo}`);

  printReport();
}

function printReport() {
  console.log("─── 检查结果 ───\n");

  if (ok.length > 0) {
    ok.forEach(m => console.log(`  \x1b[32m${m}\x1b[0m`));
    console.log();
  }

  if (warnings.length > 0) {
    warnings.forEach(m => console.log(`  \x1b[33m${m}\x1b[0m`));
    console.log();
  }

  console.log(`  总计: ${ok.length} 项正常, ${warnings.length} 项需关注\n`);

  if (warnings.length > 0) {
    console.log("📋 数据源参考: 查看 DATA-MAINTENANCE.md 获取各字段更新来源\n");
  }
}

main();
