# 🌍 全球环境治理观察 / Global Environmental Governance Tracker

一站式查看全球 80 个国家的环保机构、环境数据与公约履约情况。

A one-stop platform to explore environmental agencies, data, and treaty compliance for 80 countries worldwide.

## 功能 / Features

### 数据与可视化
- **80 个国家** — 覆盖 G20 全部成员、主要排放国、6 大洲代表
- **SVG 世界地图** — 按 EPI / NDC 评级 / 碳价 / 可再生能源 4 种指标着色，点击查看详情
- **世界银行数据** — 森林面积、CO₂排放、可再生能源、PM2.5、自然保护区等 8 项指标
- **6 维雷达图** — 森林 / 可再生能源 / 保护区 / 空气质量 / 碳效率 / EPI 环境画像

### 公约履约追踪
- **巴黎协定** — NDC 承诺、雄心评级（1.5°C / 不足 / 严重不足）、提交时间线、下次更新提醒
- **蒙特利尔议定书** — 基加利修正案状态、HFC 削减承诺
- **生物多样性公约** — 30×30 目标进度条（世界银行保护区数据自动计算）
- **碳定价机制** — ETS / 碳税 / 碳价 / 覆盖率
- **透明度报告** — BTR 提交状态
- **五行合规仪表盘** — NDC 雄心 → 碳定价 → 透明度 → 蒙特利尔 → CBD 一眼全览

### 排行榜与评分
- **综合排行榜** — 6 维加权综合评分，可按各指标排序
- **国家成绩单** — A+ 到 F 等级评分卡，6 个维度各自评级 + 综合评分，适合截图分享
- **双行筛选** — 履约状态（NDC/碳价/BTR/基加利/30×30）+ 职能领域，可叠加

### 工具功能
- **国家对比** — 选择 2-3 个国家并排对比所有指标 + 图表
- **中英双语** — 所有内容支持中英文切换
- **CSV 导出** — 导出筛选结果，含全部数据字段
- **URL 状态同步** — 筛选条件写入 URL，可分享
- **关于页** — 数据来源、方法论、许可证、反馈入口
- **公共 JSON API** — 零后端静态接口，供第三方引用（见下方「公共 API」）
- **嵌入式卡片** — 一行 iframe 代码把任意国家的数据卡片嵌进别的网页（见下方「嵌入式卡片」）

## 技术栈

- **前端**: React 18 + Vite 8 + Tailwind CSS v4
- **图表**: Chart.js (Bar + Radar)
- **地图**: SVG 世界地图 (55KB, CC BY-SA 3.0)
- **数据**: 世界银行 Open Data API（静态生成，零运行时依赖）
- **部署**: 纯静态，无后端

## 快速开始

```bash
npm install
npm run dev          # 启动开发服务器
npm run build        # 生产构建
```

## 数据维护

```bash
npm run fetch-data      # 拉取最新世界银行数据（建议每季度）
npm run check-updates   # 检查哪些数据需要更新
```

详见 [DATA-MAINTENANCE.md](DATA-MAINTENANCE.md)。

## 项目结构

```
src/
├── App.jsx                    # 主组件（状态管理、布局、视图切换）
├── WorldMap.jsx               # SVG 世界地图组件
├── constants.js               # 常量和工具函数
└── components/
    ├── DetailDialog.jsx       # 国家详情弹窗（含成绩单 + 合规仪表盘）
    ├── CompareDialog.jsx      # 国家对比弹窗
    ├── RankingsView.jsx       # 排行榜视图（综合评分 + 排序表格）
    ├── Scorecard.jsx          # 国家成绩单（A-F 评级）
    └── AboutPage.jsx          # 关于页（数据来源 + 方法论）
public/
├── countries.json             # 80 国策展数据（手动维护）
├── wb-latest.json             # 世界银行最新指标值（脚本生成，首屏加载）
├── wb-history.json            # 世界银行历史时间序列（脚本生成，空闲预取）
└── world-map.svg              # SVG 世界地图
scripts/
├── fetch-world-bank-data.js   # 世界银行 API 数据拉取
└── check-updates.js           # 数据过期检测
```

## 综合评分方法论

排行榜和成绩单使用两个独立的 0-100 指数（`src/utils/score.js`），而非单一混合分数：

| 指数 | 含义 | 维度 |
|------|------|------|
| 状态指数（禀赋） | 自然条件与既有环境状况 | 森林覆盖 25% + 自然保护区 25% + 空气质量 25% + EPI 评分 25% |
| 治理指数（绩效） | 政策选择与执行 | NDC 雄心评级 20% + 碳定价强度 15% + BTR 提交 10% + 基加利修正案 10% + NDC 3.0 提交 15% + LDN 目标设定 10% + 可再生能源占比 10% + 碳强度 10% |

两者刻意不合并——合并会重新制造"森林多的国家天然高分"这类偏差。各维度先按数据集内 winsorized min-max 归一化，缺失维度不计入且剩余权重按比例重新分配；有效维度不足 4 个则不给分（"数据不足"）。权重可在排行榜「调整权重」面板中自定义，并写入分享链接（`?w=`）。

成绩单等级基于 80 国数据集的百分位排名，两个指数各自独立计算：A+（前 5%）→ F（后 15%）。

## 数据来源

| 数据 | 来源 |
|------|------|
| 环境指标 | [World Bank Open Data](https://data.worldbank.org/) |
| NDC 评级 | [Climate Action Tracker](https://climateactiontracker.org/) |
| EPI 评分 | [Yale EPI](https://epi.yale.edu/) |
| NDC 承诺 | [UNFCCC NDC Registry](https://unfccc.int/NDCREG) |
| 碳定价 | [World Bank Carbon Pricing Dashboard](https://carbonpricingdashboard.worldbank.org/) |
| 公约状态 | UNFCCC / UNEP Ozone Secretariat / CBD Secretariat |
| 核心法律 | [Climate Change Laws of the World](https://climate-laws.org/) |

## 公共 API

零后端的静态 JSON 接口，构建期生成（`scripts/generate-api.js`），随站点一起部署，不需要另外申请 key。

| 端点 | 内容 |
|------|------|
| `GET /api/v1/countries.json` | 全部 80 国，字段已扁平化 |
| `GET /api/v1/country/<iso>.json` | 单个国家（`<iso>` 为小写 2 位 ISO 3166-1 alpha-2，如 `us`） |
| `GET /api/v1/rankings.json` | 按治理指数排序的排行榜（State + Governance 双分数，默认权重） |

每个响应都带 `_meta`：`version`（API 版本）、`generatedAt`（生成时间）、`project`（本项目信息）、`suggestedCitation`（建议引用文本）、`license`（见下）。CORS 已开放（`Access-Control-Allow-Origin: *`），可直接在浏览器 `fetch()` 跨域调用；响应长缓存（`vercel.json`），内容只在每次构建部署时更新。

**⚠️ 许可证不是单一的——这是最容易踩坑的地方。** `_meta.license.fields` 精确列出每个字段对应哪个来源、哪种许可：

| 字段范围 | 来源 | 许可证 | 说明 |
|---|---|---|---|
| `isoCode`、`countryEn/Zh`、`agencyEn/Zh`、`region`、`carbonPrice*`、`btr*`、`kigaliAmendmentRatified`、`ndc3Submitted`、`ldnTargetSet`、`state*`/`governance*`（本项目计算的评分） | 本项目自行策展/计算 | CC BY 4.0 | 请注明引用本项目（见下方建议引用文本） |
| `epiScore`、`epiScoreYear` | [Yale EPI](https://epi.yale.edu/) | **CC BY-NC-SA 4.0** | **仅限非商业用途，且需以相同许可再分发**——商业产品中使用前请先核实 Yale EPI 自己的条款 |
| `ndcRating` | [Climate Action Tracker](https://climateactiontracker.org/) | **未开放许可** | CAT 的独立评估，批量转载或商业使用前建议先联系 CAT |
| `forestAreaPercent`、`co2Mt`、`co2PerCapitaT`、`renewableEnergyPercent`、`pm25`、`protectedAreaPercent`（及各自 `*Year`） | [World Bank Open Data](https://data.worldbank.org/) | CC BY 4.0 | 需署名 |

**建议引用文本**（同样写在每条响应的 `_meta.suggestedCitation` 里）：

> Global Environmental Governance Tracker (2026). Retrieved from `https://<本站域名>/api/v1/`. Underlying figures are from World Bank Open Data, Yale EPI, and Climate Action Tracker — see `_meta.license.fields` for which source applies to which field before reuse.

简单说：批量转载/展示 `epiScore` 或 `ndcRating` 之前，先看一眼对应来源自己的条款；其余字段按 CC BY 4.0 署名即可自由使用。

## 嵌入式卡片

把任意国家的只读数据卡片嵌进第三方页面，一个 `<iframe>` 搞定，自动撑高，不需要写任何 JS 逻辑（除了下面这段现成的自适应高度监听脚本）：

```html
<iframe
  src="https://<本站域名>/embed/country/us?lang=en&theme=light"
  id="gegt-embed-us"
  title="Environmental data — US"
  style="width:100%;max-width:420px;border:0;display:block;"
  height="220"
  loading="lazy"
></iframe>
<script>
window.addEventListener("message", function (e) {
  if (e.data && e.data.type === "gegt:embed-resize" && e.data.iso === "us") {
    var el = document.getElementById("gegt-embed-us");
    if (el) el.style.height = e.data.height + "px";
  }
});
</script>
```

国家详情页的「Embed」按钮会自动生成并复制上面这段代码（含当前语言/主题）到剪贴板，不需要手写。

- `?lang=zh|en` — 卡片语言，默认 `zh`
- `?theme=light|dark` — 配色，跟随嵌入页自己的主题（不读取访问者浏览器的系统深色模式偏好，因为那和宿主页面的设计无关）
- 卡片本身无外边框（`border:0` 由调用方在 `<iframe>` 上设置），高度通过 `postMessage({type:"gegt:embed-resize", iso, height}, "*")` 实时上报，宿主页监听后设置 iframe 高度即可，无需内部滚动条
- 卡片内容为只读展示（国家名 + 机构 + State/Governance 双评分 + NDC 评级 + 碳价 + 数据年份 + 回链），不含筛选/交互
- 卡片底部固定展示数据来源与许可证提示（见上方「公共 API」许可证表）——这不是可选项，是为了不让嵌入方无意中违反 Yale EPI / CAT 的条款

## 许可证

- 代码: MIT
- 地图: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) (simple-world-map by Al MacDonald / Fritz Lekschas)
- 数据: 各数据源各自的开放许可（World Bank: CC BY 4.0，Yale EPI: CC BY-NC-SA 4.0，Climate Action Tracker: 未开放许可 等）——逐字段的精确对照见上方「公共 API」章节
