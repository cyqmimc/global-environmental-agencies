# 数据维护指南 / Data Maintenance Guide

运行 `npm run check-updates` 查看哪些数据需要更新。

## 快速更新（一键）

```bash
npm run update-all   # = build + WB + UN SDG + split + validate + check
```

## 数据流架构

```
data/countries/<iso>.json (源文件, 80 个文件, 手动编辑 —— 详见 CONTRIBUTING.md)
    └── build-countries.js ──→ countries.json (生成文件, 入库但不手动编辑)
                                    ├── split-countries.js ──→ countries-core.json (首屏)
                                    │                      └─→ countries-detail.json (懒加载)
                                    └── fetch-world-bank-data.js ──→ wb-latest.json (最新值, 首屏)
                                                               └──→ wb-history.json (时间序列, 空闲预取)

前端合并: country = { ...core数据, wb: wb-latest数据 }
空闲预取: country.wb.history = wb-history数据；country = { ...country, ...detail数据 }

UN SDG API ──→ fetch-un-sdg-data.js ──→ sdg-latest.json（4 个环境指标，构建期静态生成）
前端合并: country.sdg = sdg-latest.countries[iso]
```

**`countries.json` / `countries-core.json` / `countries-detail.json` 是生成文件，不要手动编辑** ——
编辑 `data/countries/<iso>.json`，然后跑 `npm run build-data`。CI 会用
`npm run verify-data` 校验生成文件与源文件逐字节一致，直接改生成文件会在 CI 里被拦下。
完整的字段说明、必填项与数据来源要求见 `CONTRIBUTING.md`。

**重要**: `wb-latest.json` 中 PM2.5 数据来自 IQAir 2024（优先于 WB 卫星数据），`fetch-data` 会自动保留 IQAir 覆盖值不被 WB 旧数据覆盖（同时同步到 `wb-history.json` 的 2024 数据点）。

## 自动化数据

| 数据 | 命令 | 更新频率 | 说明 |
|------|------|---------|------|
| 世界银行环境指标 | `npm run fetch-data` | 每季度 | CO₂(AR5→2024)、森林、可再生能源、PM2.5、保护区、人口、GDP |
| 联合国 SDG 环境指标 | `npm run fetch-sdg-data` | 每季度 | 6.4.2 水压力、12.2.2 材料效率、14.5.1 海洋 KBA、15.3.1 土地退化 |
| PM2.5 补充 | 手动更新 wb-latest.json | 每年 | IQAir World Air Quality Report (地面监测, 优先于WB卫星数据) |
| 碳定价 | 手动更新 countries.json | 每年 | WB Carbon Pricing Dashboard Excel 下载 |

## 手动维护数据

### 高频更新（每年1次）

| 字段 | 数据源 | URL |
|------|--------|-----|
| `carbonPricing` | World Bank Carbon Pricing Dashboard | https://carbonpricingdashboard.worldbank.org/ |
| `reportingStatus` | UNFCCC Reporting Status | https://unfccc.int/BR |
| `parisAgreement.ndcHistory` | UNFCCC NDC Registry | https://unfccc.int/NDCREG |
| `parisAgreement.ndcRating` | Climate Action Tracker | https://climateactiontracker.org/countries/ |
| `parisAgreement.ndc3*` (NDC 3.0 第三轮) | UNFCCC NDC Registry | https://unfccc.int/NDCREG |
| `desertification` (UNCCD/LDN) | UNCCD LDN TSP + 国家档案 | https://www.unccd.int/our-work/ldn-target-setting-programme |

### 公约履约扩展（UNCCD 与 NDC 3.0）

两份独立的源数据文件保证数据可追溯：

```
scripts/data/desertification.json  # 80 国 UNCCD 状态（Annex / 受影响 / LDN / NAP / 中英文承诺 / 源URL）
scripts/data/ndc3.json             # 80 国 NDC 3.0 提交（日期 / 目标 / UNFCCC Registry URL）
```

合并到 `countries.json` 一键命令：

```bash
node scripts/merge-treaty-extensions.js   # 幂等：每次运行覆盖已有字段
```

**权威来源（官方）**：
- UNCCD LDN Target Setting Programme — https://www.unccd.int/our-work/ldn-target-setting-programme
- UNCCD 国家档案 — https://www.unccd.int/our-work/country-profile
- UNCCD 区域实施附件（Annex I–V）— https://www.unccd.int/convention/regional-implementation-annexes
- UNCCD PRAIS 报告系统 — https://prais.unccd.int
- UNFCCC NDC Registry（NDC 3.0 第三轮）— https://unfccc.int/NDCREG

更新流程：

1. 在 `scripts/data/desertification.json` 或 `scripts/data/ndc3.json` 编辑对应国家条目（**每条数据都必须保留 `source` URL**）
2. 运行 `node scripts/merge-treaty-extensions.js`（写入 `data/countries/<iso>.json`，不是 `public/countries.json`）
3. 运行 `npm run build-data` 重生成 `countries.json` + core/detail
4. 运行 `node scripts/validate-schema.js` 验证字段类型 + 日期格式 + 源 URL 存在

### 中频更新（每1-2年）

| 字段 | 数据源 | URL |
|------|--------|-----|
| `epiScore` | Yale EPI (每2年发布) | https://epi.yale.edu/ |
| `parisAgreement.ndcTargetZh/En` | UNFCCC NDC Registry | https://unfccc.int/NDCREG |
| `netZeroTarget` | Net Zero Tracker | https://zerotracker.net/ |
| `keyLaws` | Climate Change Laws of the World | https://climate-laws.org/ |
| `montrealProtocol.kigaliAmendment` | UNEP Ozone Secretariat | https://ozone.unep.org/treaties/montreal-protocol/amendments/kigali-amendment |

### 低频更新（变动时更新）

| 字段 | 数据源 | 触发条件 |
|------|--------|---------|
| `agencyEn/Zh`, `website` | 各国政府官网 | 政府换届或机构改革时 |
| `cbd.commitmentZh/En` | CBD Secretariat | CBD COP 会议后 |
| `treaties` | UNTS / 各公约秘书处 | 新公约批准时 |
| `responsibilities` | 各国政府官网 | 机构职能调整时 |
| `descriptionZh/En` | 手动撰写 | 重大政策变化时 |

## 新增国家流程

完整流程（字段含义、必填项、数据来源要求）见 `CONTRIBUTING.md`。简述：

1. 新建 `data/countries/<iso>.json`（参考现有同类国家的字段结构）
2. 确保 `isoCode` 与 `flagUrl` 中的国家代码、文件名三者一致
3. 运行 `npm run build-data` 生成 `countries.json` + core/detail
4. 运行 `npm run fetch-data` 自动拉取该国 WB 数据
5. 运行 `npm run validate` 与 `npm run check-updates` 验证无缺失字段
6. 运行 `npm run build` 确认构建通过

## 数据质量检查

```bash
# 完整检查
npm run check-updates

# 重新拉取世界银行数据
npm run fetch-data

# 验证 JSON 格式
node -e "JSON.parse(require('fs').readFileSync('public/countries.json','utf8')); console.log('OK')"
```

## 上次更新记录

| 数据类别 | 更新日期 | 操作人 |
|---------|---------|--------|
| 世界银行指标 | 2026-09-01 | 刷新至最新 WB 数据（人口/GDP 主要更新至2025年）；保留 IQAir 2024 PM2.5 覆盖值 |
| 碳定价数据 | 2026-04-03 | WB Carbon Pricing Dashboard (2025-04-01数据) |
| NDC 评级 | 2026-04-02 | 手动录入 |
| NDC 3.0 (2035目标) | 2026-09-01 | 63/80 国已提交；按 UNFCCC NDC Registry 核对提交日期，明确目标保留官方数值 |
| NDC 截止日 | 2026-04-03 | 批量更新 2025→2030 |
| BTR 报告状态 | 2026-09-01 | 71/80 国已提交；按 UNFCCC BTR Registry 核对，并修正已提交记录的状态标签 |
| 巴黎协定 NDC | 2026-04-01 | 手动录入 |
| 蒙特利尔议定书 | 2026-04-01 | 手动录入 |
| CBD 30×30 | 2026-04-01 | 手动录入 |
| 机构信息 | 2026-04-01 | 手动录入 |
| EPI 评分 | 2026-04-01 | 手动录入 (2024 EPI) |
| 联合国 SDG 环境指标 | 2026-09-01 | UN Global SDG Indicators Database 2026.Q2.G.02；各系列采用最新共同年份 |
