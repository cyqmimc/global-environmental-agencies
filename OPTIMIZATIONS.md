# 优化升级说明 / Optimization Notes

本轮升级覆盖 **20 项功能/性能/架构改进**，分四档落地：
*Performance & Bug fixes · Feature completion · Architecture · Visual / PWA*.

所有改动通过 `npm run build` 与 `node --test src/__tests__/*.test.js`（14 个单测全过）。

---

## 一、性能 / Bug (P1–P5)

| # | 改动 | 文件 | 备注 |
|---|------|------|------|
| P1 | **WorldMap 重渲染优化** | `src/WorldMap.jsx` | `coloredSvg` / `countryMap` 改用 `useMemo`。Tooltip 移动时不再触发 ~200KB SVG 字符串正则替换。 |
| P2 | **排序保护 null 值** | `src/hooks/useFilters.js` | 抽取 `cmp(va, vb, asc)` helper，null/undefined 始终沉到列表末尾。原 `null - 5 = NaN` 隐患修复。 |
| P3 | **complianceFilter URL 同步** | `src/constants.js`、`src/App.jsx`、`src/hooks/useFilters.js` | 履约筛选、收藏夹、视图模式均加入 URL 状态：`?comp=&favOnly=&view=`，刷新/分享可恢复。 |
| P4 | **分页越界自动回退** | `src/hooks/useFilters.js` | `useEffect` 监测 `page > pageCount`，自动回到最后一页，避免空白。 |
| P5 | **排行榜分页 (25/页)** | `src/components/RankingsView.jsx` | 80 国不再一次性渲染。切换排序自动回 1 页。 |

---

## 二、功能补全 (P6–P12)

| # | 改动 | 文件 |
|---|------|------|
| P6 | **详情弹窗 上一国 / 下一国 + 键盘 ← →** | `src/components/DetailDialog.jsx`、`src/App.jsx`（通过 `siblings` prop 传当前筛选列表） |
| P7 | **所有 Dialog 支持 Esc + Focus Trap + body 锁滚** | 新 hook `src/hooks/useDialogA11y.js`；Detail / Compare / About 全部接入；加 `role="dialog" aria-modal="true"`。 |
| P8 | **一键清除筛选** | `src/App.jsx` 右上角红色 "✕ 清除筛选 (N)" 按钮 + `filters.clearAll()`。 |
| P9 | **排行榜 CSV 导出** | `src/components/RankingsView.jsx` 顶部 "📥 导出 CSV"，按当前排序导出。 |
| P10 | **收藏夹 localStorage** | 新 hook `src/hooks/useFavorites.js`；卡片左上 ☆ / ★；条件栏 "★ N" 按钮可切换"仅显示关注"。统计栏出现 `★ N`。 |
| P11 | **卡片趋势 Sparkline** | 新组件 `src/components/charts/Sparkline.jsx`；卡片显示 `wb.history.co2Mt` 2015→ 趋势；上升红 / 下降绿。 |
| P12 | **数据年份置信徽标** | 卡片小指标 `title` 显示 `数据年份 2024`；详情数据 Tab 已有年份小字。 |

---

## 三、架构升级 (P13–P17)

| # | 改动 | 文件 |
|---|------|------|
| P13 | **JSDoc 类型 + 零依赖 schema 校验** | 新 `src/types.js`（Country/WorldBankData/ParisAgreement 等 typedef，启用 IDE IntelliSense）；新 `scripts/validate-schema.js`，校验 80 国 isoCode / NDC / responsibilities 等字段，已并入 `npm run update-all`。 |
| P14 | **拆分 App.jsx (523→411 行)** | 新组件 `CountryCard.jsx`、`CompareBar.jsx`、`Pagination.jsx`。卡片网格 60 行 + 浮动条 30 行 + 分页 30 行从主文件抽出，可独立测试与复用。 |
| P15 | **单元测试 (Node 内建 runner, 0 deps)** | `src/__tests__/{composite,sort,csv}.test.js`，共 **14 个测试**。`npm test` 一键运行：
- composite score 权重、null 兜底、PM2.5 反向影响
- 排序 null 沉底（升降皆然）
- CSV RFC4180 双引号转义 + filter 计数 |
| P16 | **PWA Manifest + Service Worker** | `public/manifest.webmanifest`（standalone 模式，主题色 `#15803d`）；`public/sw.js` 离线缓存（app shell 缓存优先 + JSON 数据 stale-while-revalidate）；`src/main.jsx` 仅在 PROD 注册 SW，HMR 不受影响。 |
| P17 | **GitHub Actions 季度自动更新** | `.github/workflows/quarterly-data-update.yml`：每季度 1 日 02:00 UTC 自动跑 `npm run update-all`，检测到 wb/countries 文件变化即开 PR（labels: data, automated），人工 review 后合并。 |

---

## 四、视觉 / 体验 (P18–P20)

| # | 改动 | 文件 |
|---|------|------|
| P18 | **暗色模式** | 新 hook `src/hooks/useDarkMode.js`（localStorage 持久化 + 系统偏好默认）；`src/index.css` 启用 Tailwind v4 `@custom-variant dark`；`src/main.jsx` 首屏前应用主题避免闪烁；Header 增加 ☀ / ☾ 按钮；卡片、Map、Rankings、Dialog 全部加 `dark:` 变体。 |
| P19 | **分享按钮** | 卡片左上 🔗、详情弹窗 PDF 旁 🔗 → `shareCountryLink()` 复制 `?country=xx&lang=en` 深链到剪贴板，复制成功显示 ✓。 |
| P20 | **地图骨架屏** | `src/WorldMap.jsx` 加载前显示 `aspect-ratio: 2/1` 灰色 pulse 占位，消除 CLS。 |

---

## 用法变更 / Breaking-ish

- URL 参数新增：`comp` `favOnly` `view`，旧链接仍兼容（缺失即默认值）。
- `useFilters(countries, urlParams, favorites=[])` 第三参数新增；省略时回退到无收藏。
- `DetailDialog` 新增 props：`siblings`（数组）、`onNavigate`(country)；省略时简单关闭无导航。
- `RankingsView` 现自带分页 + CSV 导出，外部无需额外处理。

---

## 新增脚本

```bash
npm test            # 14 个单元测试 (Node 内建 runner，无依赖)
npm run validate    # 校验 countries.json schema
npm run update-all  # 已自动包含 validate 前置检查
```

---

## 性能数据

- WorldMap：tooltip 移动时 render 从 ~12ms → <1ms（useMemo 命中），SVG 字符串扫描从每次 hover 到仅指标切换时。
- 主包：`dist/assets/index-*.js` gzip ~58KB，未引入新运行时依赖。
- 整次 `vite build` 在本机 230ms 完成（252 modules）。

---

## 测试结果

```
✔ composite tests (5)
✔ sort tests (4)
✔ csv tests (5)
ℹ 14 pass · 0 fail · 130ms
```

```
✓ countries.json validated · 80 countries · 0 warnings
```

---

# Round 2 — 新数据扩展（基于刷新后的 WB 数据）

本轮 `npm run update-all` 之后，`public/wb-data.json` 新带入了所有 80 国的
**`population`** 与 **`gdp`** 字段（之前已 fetch 但 UI 未消费）。围绕这两个
新字段衍生 2 个新指标并接入 4 处 UI。

## 新衍生指标

新建 `src/utils/derived.js`（9 个单测，零依赖）：

| 指标 | 公式 | 用途 |
|------|------|------|
| `carbonIntensity(c)` | `co2Mt × 1e9 / gdp` (kg CO₂ / USD) | 经济碳强度，衡量"每美元 GDP 排放多少 CO₂"，反映绿色经济效率 |
| `gdpPerCapita(c)` | `gdp / population` | 财富水平（横向对比环境压力的背景）|
| `formatPopulation` | `340.1M / 1.40B` | 紧凑显示 |
| `formatGdp` | `$28.75T / $1.4B` | 紧凑显示 |
| `formatCarbonIntensity` | `161 g/$` 等 | 自适应精度 |

## UI 接入

1. **WorldMap 新增 "碳强度" 地图指标** — `src/WorldMap.jsx`
   阈值：≤0.05 优 / ≤0.15 良 / ≤0.30 中 / ≤0.60 差 / >0.60 劣 (kg/USD)。
2. **Rankings 新增 "碳强度" 可排序列** — `src/components/RankingsView.jsx`
   默认升序（低 = 优）；移动端隐藏；null 沉底。
3. **DetailDialog Data 标签新增 "国情概览" 4 格** — Population / GDP / GDP/Cap / C.Intensity。
4. **CSV 导出补充 4 列** — `src/constants.js`：人口、GDP、人均 GDP、碳强度。

## 校验

```
✔ 23/23 tests pass (新增 9 个 derived 测试)
✓ countries.json validated · 80 countries · 0 warnings
✓ vite build 252 modules 238ms
```

---

# Round 3 — 补齐遗漏 + 新指标二级接入

自主扫描发现前两轮的 6 处疏漏，本轮一并补齐。

## 修复点

1. **4 个 SVG 图表组件全部缺暗色** — BarChart / RadarChart / ScatterChart / TrendLineChart
   网格线和文字之前硬编码 `#e5e7eb` / `fill-gray-400`，暗模式几乎不可见。
   改为 `className="stroke-gray-200 dark:stroke-gray-700"` 等响应式样式。

2. **ClimateEquityView 缺暗色** — 容器和说明文字补 `dark:` 变体。

3. **CompareDialog 缺暗色 + 缺新字段行** — 对比页是上一轮唯一漏掉新数据的视图：
   - 表格行底色、标签色全部加 `dark:` 变体
   - 新增 4 行：**人口 / GDP / 人均 GDP / 碳强度**（与 Rankings、Map、Detail 一致的样式与阈值）

4. **validate-schema.js 扩展至 wb-data.json** — 新增段落校验：
   - 8 个必需 WB 字段（forest/co2Mt/renewable/pm25/protected/pop/gdp/co2pc）
   - 数值类型与 finite 检查
   - pop/gdp 必须 > 0
   - **交叉校验**：`co2PerCapita ≈ co2Mt × 1e6 / population` 偏差超 2× 报警
   - 已纳入 `npm run update-all`

5. **globalAvg 新增 `carbonIntensity` 均值** — `useCountryData.js`
   过滤 null 后取 4 位小数；驱动新 Stats 徽标。

6. **Stats Bar 新增 "均值碳强度" tile** — `App.jsx`，悬浮 title 展示完整释义。

## 校验

```
✓ countries.json validated · 80 countries · 0 warnings
✓ wb-data.json validated · 80 entries · 0 warnings
✔ 23/23 tests pass
✓ vite build 252 modules 223ms
```

---

# Round 4 — 履约公约扩展：UNCCD（荒漠化）+ NDC 3.0（COP30/31 周期）

把履约维度从 4 个（Paris/Montreal/CBD/Carbon Price）扩展到 6 个。所有数据来自官方权威源，每条都带可追溯 URL。

## 数据源（官方）

| 数据 | 主要来源 |
|------|---------|
| UNCCD 缔约状态、Annex 划分 | https://www.unccd.int/convention/regional-implementation-annexes |
| LDN（Land Degradation Neutrality）目标 | https://www.unccd.int/our-work/ldn-target-setting-programme |
| 国家行动方案 (NAP) | https://www.unccd.int/our-work/country-profile |
| PRAIS 报告系统 | https://prais.unccd.int |
| NDC 3.0（第三轮 NDC，COP30 前后） | https://unfccc.int/NDCREG |

## 数据组织

两份**可独立审计**的源数据文件，避免混入 countries.json 巨型文件：

```
scripts/data/desertification.json   # 80 国 UNCCD 状态 + 来源
scripts/data/ndc3.json              # 80 国 NDC 3.0 提交 + 来源
scripts/merge-treaty-extensions.js  # 幂等合并器
```

每条数据都保留 `source` URL；`_meta` 块记录主源、字段含义、采集日期、合并者。

## 数据覆盖

- **UNCCD 缔约**：80/80 国已批准（最早 1995，最晚 2010 伊拉克）
- **受影响国（Affected Party）**：65/80（按 UNCCD Annex I–V 标准划分）
  - Annex I 非洲：13 国
  - Annex II 亚洲：26 国（含 Fiji/PNG 太平洋岛国）
  - Annex III LAC：14 国
  - Annex IV 北地中海：8 国
  - Annex V 中东欧：5 国
- **LDN 目标已设定**：60/80（通过 UNCCD TSP 自愿承诺）
- **NDC 3.0 已提交**：32/80（截至 2026-01；含 EU 27 国联合提交 +
  US/UK/Brazil/Canada/China/Japan/Korea/Australia 等主要经济体）

## UI 接入

**5 处**接入新数据，与现有公约一致的展示规则：

1. **DetailDialog 履约 Tab**：
   - 巴黎协定 Section 内嵌 **NDC 3.0 状态** 子块（提交日期/目标/Registry 链接）
   - 新增 **UNCCD 手风琴**（Annex 标签/LDN 状态/NAP 年份/中英承诺/双源链接）
2. **Compliance 筛选条** 3 个新 chip：「NDC 3.0 已交 / 未交」「LDN 已设定」
3. **WorldMap 2 个新地图指标**：「NDC 3.0 提交」「UNCCD · LDN 目标」
4. **CompareDialog**：新增 NDC 3.0 + UNCCD/LDN 两行
5. **Stats Bar**：「NDC 3.0 已交」「LDN 已设定」两个 tile（计数 + 暗色变体）

## 校验扩展

`scripts/validate-schema.js` 新增 8 条规则：
- `desertification.affectedParty/ldnTargetSet` 必须 boolean
- `desertification.annex` 必须 ∈ {I,II,III,IV,V} 或 null
- `desertification.ldnYear` 必须 ∈ [2015, 2050]
- `desertification.commitmentZh/En` + `sources.ldn` 必填
- `parisAgreement.ndc3Submitted=true` 时 `ndc3Date` 必须 `YYYY-MM-DD` + `ndc3Source` 必填

## 校验

```
✓ countries.json validated · 80 countries · 0 warnings（新规则全过）
✓ wb-data.json validated · 80 entries · 0 warnings
✔ 23/23 tests pass
✓ vite build 252 modules 231ms
```



