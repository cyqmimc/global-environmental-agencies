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
