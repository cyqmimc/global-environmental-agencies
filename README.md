# 🌍 全球环境治理观察 / Global Environmental Governance Tracker

一站式查看全球 80 个国家的环保机构、环境数据与公约履约情况。

A one-stop platform to explore environmental agencies, data, and treaty compliance for 80 countries worldwide.

## 功能 / Features

- **80 个国家** — 覆盖 G20 全部成员、主要排放国、6 大洲代表
- **SVG 世界地图** — 按 EPI / NDC 评级 / 碳价 / 可再生能源 4 种指标着色，点击查看详情
- **世界银行实时数据** — 森林面积、CO₂排放、可再生能源、PM2.5、自然保护区等 8 项指标
- **三大公约履约追踪**
  - 巴黎协定 — NDC 承诺、雄心评级（1.5°C / 不足 / 严重不足）、提交时间线
  - 蒙特利尔议定书 — 基加利修正案状态、HFC 削减承诺
  - 生物多样性公约 — 30×30 目标进度条（世界银行保护区数据自动计算）
- **碳定价机制** — ETS / 碳税 / 碳价 / 覆盖率
- **透明度报告** — BTR 提交状态
- **五行合规仪表盘** — NDC 雄心 → 碳定价 → 透明度 → 蒙特利尔 → CBD 一眼全览
- **国家对比** — 选择 2-3 个国家并排对比所有指标 + 图表
- **6 维雷达图** — 森林 / 可再生能源 / 保护区 / 空气质量 / 碳效率 / EPI 环境画像
- **中英双语** — 所有内容支持中英文切换
- **CSV 导出** — 导出筛选结果，含全部数据字段
- **URL 状态同步** — 筛选条件写入 URL，可分享

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
├── App.jsx                    # 主组件（状态管理、布局）
├── WorldMap.jsx               # SVG 世界地图组件
├── constants.js               # 常量和工具函数
└── components/
    ├── DetailDialog.jsx       # 国家详情弹窗
    ├── CompareDialog.jsx      # 国家对比弹窗
    └── AboutPage.jsx          # 关于页
public/
├── countries.json             # 80 国策展数据（手动维护）
├── wb-data.json               # 世界银行指标（脚本生成）
└── world-map.svg              # SVG 世界地图
scripts/
├── fetch-world-bank-data.js   # 世界银行 API 数据拉取
└── check-updates.js           # 数据过期检测
```

## 数据来源

| 数据 | 来源 |
|------|------|
| 环境指标 | [World Bank Open Data](https://data.worldbank.org/) |
| NDC 评级 | [Climate Action Tracker](https://climateactiontracker.org/) |
| EPI 评分 | [Yale EPI](https://epi.yale.edu/) |
| NDC 承诺 | [UNFCCC NDC Registry](https://unfccc.int/NDCREG) |
| 碳定价 | [World Bank Carbon Pricing Dashboard](https://carbonpricingdashboard.worldbank.org/) |
| 公约状态 | UNFCCC / UNEP Ozone Secretariat / CBD Secretariat |

## 许可证

- 代码: MIT
- 地图: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) (simple-world-map by Al MacDonald / Fritz Lekschas)
- 数据: 各数据源各自的开放许可
