# 数据维护指南 / Data Maintenance Guide

运行 `npm run check-updates` 查看哪些数据需要更新。

## 自动化数据

| 数据 | 命令 | 更新频率 | 说明 |
|------|------|---------|------|
| 世界银行环境指标 | `npm run fetch-data` | 每季度 | 森林面积、CO₂、可再生能源、PM2.5、保护区、人口、GDP |

## 手动维护数据

### 高频更新（每年1次）

| 字段 | 数据源 | URL |
|------|--------|-----|
| `carbonPricing` | World Bank Carbon Pricing Dashboard | https://carbonpricingdashboard.worldbank.org/ |
| `reportingStatus` | UNFCCC Reporting Status | https://unfccc.int/BR |
| `parisAgreement.ndcHistory` | UNFCCC NDC Registry | https://unfccc.int/NDCREG |
| `parisAgreement.ndcRating` | Climate Action Tracker | https://climateactiontracker.org/countries/ |

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

1. 在 `countries.json` 中添加完整条目（参考现有国家的字段结构）
2. 确保 `isoCode` 与 `flagUrl` 中的国家代码一致
3. 运行 `npm run fetch-data` 自动拉取该国 WB 数据
4. 运行 `npm run check-updates` 验证无缺失字段
5. 运行 `npm run build` 确认构建通过

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
| 世界银行指标 | 2026-04-03 | CO₂升级AR5→2024; PM2.5补充IQAir 2024数据 |
| 碳定价数据 | 2026-04-02 | 手动录入 |
| NDC 评级 | 2026-04-02 | 手动录入 |
| NDC 3.0 (2035目标) | 2026-04-03 | 27国+16EU成员国更新 (CAT 2035 Tracker) |
| NDC 截止日 | 2026-04-03 | 批量更新 2025→2030 |
| BTR 报告状态 | 2026-04-03 | 63国已提交 (UNFCCC BTR Registry) |
| 巴黎协定 NDC | 2026-04-01 | 手动录入 |
| 蒙特利尔议定书 | 2026-04-01 | 手动录入 |
| CBD 30×30 | 2026-04-01 | 手动录入 |
| 机构信息 | 2026-04-01 | 手动录入 |
| EPI 评分 | 2026-04-01 | 手动录入 (2024 EPI) |
