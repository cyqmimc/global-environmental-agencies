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
├── wb-data.json               # 世界银行指标（脚本生成）
└── world-map.svg              # SVG 世界地图
scripts/
├── fetch-world-bank-data.js   # 世界银行 API 数据拉取
└── check-updates.js           # 数据过期检测
```

## 综合评分方法论

排行榜和成绩单使用 6 维加权综合评分（0-100）：

| 维度 | 权重 | 数据来源 | 说明 |
|------|------|---------|------|
| EPI 评分 | 25% | Yale EPI | 环境绩效综合指数 |
| 可再生能源 | 20% | World Bank | 占总能源消费比例 |
| 森林覆盖 | 15% | World Bank | 占国土面积比例 |
| 自然保护区 | 15% | World Bank | 占国土面积比例 |
| 空气质量 | 15% | World Bank | PM2.5 反向计算 |
| 碳效率 | 10% | World Bank | 人均 CO₂ 反向计算 |

成绩单等级基于 80 国数据集的百分位排名：A+（前 5%）→ F（后 15%）。

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

## 许可证

- 代码: MIT
- 地图: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) (simple-world-map by Al MacDonald / Fritz Lekschas)
- 数据: 各数据源各自的开放许可
