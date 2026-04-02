export default function AboutPage({ language, onClose }) {
  const t = (zh, en) => (language === "zh" ? zh : en);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] h-full sm:h-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          <h3 className="text-2xl font-bold">
            🌍 {t("关于本项目", "About This Project")}
          </h3>
          <p className="text-green-100 mt-1 text-sm">
            {t("全球环境治理观察", "Global Environmental Governance Tracker")}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Description */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("项目简介", "Project Description")}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              {t(
                "全球环境治理观察是一个开源数据平台，系统性追踪 80 个国家的环保机构、环境政策、国际公约履约情况及关键环境指标。整合来自世界银行、联合国、Yale 大学等权威数据源，为研究者、政策制定者、国际合作从业者和公众提供一站式全球环境治理信息。",
                "Global Environmental Governance Tracker is an open-source data platform that systematically tracks environmental agencies, policies, treaty compliance, and key environmental indicators for 80 countries. By integrating authoritative data from the World Bank, United Nations, Yale University and more, it provides a one-stop resource for researchers, policymakers, international cooperation professionals, and the public."
              )}
            </p>
          </section>

          {/* Key Features */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("核心功能", "Key Features")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {[
                { icon: "🗺️", zh: "80 国交互式世界地图（4 种指标着色）", en: "Interactive world map for 80 countries (4 metric views)" },
                { icon: "📊", zh: "排行榜：6 维加权综合评分排名", en: "Rankings: 6-dimension weighted composite scoring" },
                { icon: "🏆", zh: "国家成绩单：A+ 到 F 等级评分", en: "Country Scorecard: A+ to F grade ratings" },
                { icon: "📋", zh: "五行合规仪表盘：一眼全览履约状况", en: "5-row compliance dashboard at a glance" },
                { icon: "🌡️", zh: "巴黎协定 NDC 评级 + 提交时间线", en: "Paris Agreement NDC ratings + submission timeline" },
                { icon: "💰", zh: "碳定价机制追踪（ETS/碳税/碳价）", en: "Carbon pricing mechanism tracking (ETS/tax/price)" },
                { icon: "📄", zh: "透明度报告（BTR）提交状态", en: "Transparency report (BTR) submission status" },
                { icon: "🛡️", zh: "蒙特利尔议定书 + 基加利修正案状态", en: "Montreal Protocol + Kigali Amendment status" },
                { icon: "🌿", zh: "CBD 30×30 目标进度条", en: "CBD 30×30 target progress bar" },
                { icon: "🔄", zh: "国家对比（2-3 国并排）+ CSV 导出", en: "Country comparison (2-3 side-by-side) + CSV export" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-base shrink-0">{f.icon}</span>
                  <span className="text-gray-700">{language === "zh" ? f.zh : f.en}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              {t("数据来源", "Data Sources")}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">
                      {t("数据源", "Source")}
                    </th>
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">
                      {t("提供数据", "Data Provided")}
                    </th>
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">
                      {t("更新频率", "Update Frequency")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { source: "World Bank Open Data", zh: "森林覆盖率、可再生能源、PM2.5、CO₂排放、保护区面积、人口、GDP", en: "Forest coverage, renewable energy, PM2.5, CO₂ emissions, protected areas, population, GDP", freq: { zh: "年度（API自动拉取）", en: "Annual (auto-fetched via API)" } },
                    { source: "Climate Action Tracker", zh: "NDC 雄心评级（7 级）", en: "NDC ambition ratings (7 levels)", freq: { zh: "半年度", en: "Semi-annual" } },
                    { source: "UNFCCC", zh: "巴黎协定批准状态、NDC提交记录与时间线、BTR报告提交状态", en: "Paris Agreement ratification, NDC submissions & timeline, BTR reporting status", freq: { zh: "实时", en: "Real-time" } },
                    { source: "Yale EPI", zh: "环境绩效指数（EPI）评分（0-100）", en: "Environmental Performance Index (EPI) scores (0-100)", freq: { zh: "两年一次", en: "Biennial" } },
                    { source: "CBD Secretariat", zh: "生物多样性公约批准状态、30×30目标承诺", en: "CBD ratification, 30×30 target commitments", freq: { zh: "年度", en: "Annual" } },
                    { source: "UNEP Ozone Secretariat", zh: "蒙特利尔议定书及基加利修正案批准状态", en: "Montreal Protocol & Kigali Amendment ratification status", freq: { zh: "年度", en: "Annual" } },
                    { source: "World Bank Carbon Pricing Dashboard", zh: "碳排放交易体系(ETS)、碳税、碳价、排放覆盖率", en: "Emissions Trading Systems (ETS), carbon tax, carbon price, emission coverage", freq: { zh: "年度", en: "Annual" } },
                    { source: t("各国政府官网", "Gov. Websites"), zh: "环保机构信息、核心环保法律、联系方式", en: "Agency info, key environmental laws, contact details", freq: { zh: "不定期", en: "As needed" } },
                    { source: "Climate Change Laws of the World", zh: "各国核心环保法律数据库", en: "National environmental legislation database", freq: { zh: "持续更新", en: "Continuous" } },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-700 whitespace-nowrap">{row.source}</td>
                      <td className="py-2 px-3 text-gray-600">{language === "zh" ? row.zh : row.en}</td>
                      <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{language === "zh" ? row.freq.zh : row.freq.en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scoring Methodology */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("综合评分方法论", "Composite Scoring Methodology")}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {t(
                "排行榜和国家成绩单使用 6 维加权综合评分（0-100 分）。每个维度归一化到 0-100 后按权重加总。成绩单等级基于 80 国数据集的百分位排名。",
                "The Rankings and Scorecard use a 6-dimension weighted composite score (0-100). Each dimension is normalized to 0-100 and combined by weight. Scorecard grades are based on percentile ranking within the 80-country dataset."
              )}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("维度", "Dimension")}</th>
                    <th className="text-center py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("权重", "Weight")}</th>
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("计算方式", "Calculation")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dim: { zh: "EPI 评分", en: "EPI Score" }, weight: "25%", calc: { zh: "直接使用 Yale EPI 评分（0-100）", en: "Direct Yale EPI score (0-100)" } },
                    { dim: { zh: "可再生能源", en: "Renewable Energy" }, weight: "20%", calc: { zh: "占总能源消费比例，上限 100%", en: "Share of total energy consumption, capped at 100%" } },
                    { dim: { zh: "森林覆盖", en: "Forest Coverage" }, weight: "15%", calc: { zh: "占国土面积比例，上限 100%", en: "Share of land area, capped at 100%" } },
                    { dim: { zh: "自然保护区", en: "Protected Areas" }, weight: "15%", calc: { zh: "占国土面积比例，上限 100%", en: "Share of land area, capped at 100%" } },
                    { dim: { zh: "空气质量", en: "Air Quality" }, weight: "15%", calc: { zh: "100 - PM2.5（反向，越低越好）", en: "100 - PM2.5 (inverted, lower is better)" } },
                    { dim: { zh: "碳效率", en: "CO₂ Efficiency" }, weight: "10%", calc: { zh: "100 - 人均CO₂×5（反向，越低越好）", en: "100 - per capita CO₂×5 (inverted, lower is better)" } },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-700">{language === "zh" ? row.dim.zh : row.dim.en}</td>
                      <td className="py-2 px-3 text-center font-bold text-green-700">{row.weight}</td>
                      <td className="py-2 px-3 text-gray-600">{language === "zh" ? row.calc.zh : row.calc.en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800 mb-1">{t("成绩单等级标准", "Scorecard Grading Scale")}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { grade: "A+", range: t("前 5%", "Top 5%"), color: "bg-green-700" },
                  { grade: "A", range: t("前 15%", "Top 15%"), color: "bg-green-600" },
                  { grade: "B+", range: t("前 30%", "Top 30%"), color: "bg-lime-600" },
                  { grade: "B", range: t("前 50%", "Top 50%"), color: "bg-yellow-500" },
                  { grade: "C", range: t("前 70%", "Top 70%"), color: "bg-orange-500" },
                  { grade: "D", range: t("前 85%", "Top 85%"), color: "bg-red-500" },
                  { grade: "F", range: t("后 15%", "Bottom 15%"), color: "bg-red-700" },
                ].map((g) => (
                  <span key={g.grade} className="flex items-center gap-1">
                    <span className={`${g.color} text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs`}>{g.grade}</span>
                    <span className="text-gray-500">{g.range}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Other Methodology */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("其他方法说明", "Other Methodology Notes")}
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">{t("NDC 雄心评级", "NDC Ambition Ratings")}</p>
                <p className="leading-relaxed">
                  {t(
                    "来源于 Climate Action Tracker 的独立评估，衡量各国气候承诺是否与《巴黎协定》温控目标一致。7 个等级：1.5°C 兼容 > 2°C 兼容 > 接近充分 > 不足 > 严重不足 > 极度不足 > 未评估。",
                    "Sourced from Climate Action Tracker's independent assessments. 7 levels: 1.5°C Compatible > 2°C Compatible > Almost Sufficient > Insufficient > Highly Insufficient > Critically Insufficient > Not Assessed."
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">{t("CBD 30×30 目标", "CBD 30×30 Target")}</p>
                <p className="leading-relaxed">
                  {t(
                    "《昆明-蒙特利尔全球生物多样性框架》(2022) 核心目标：2030 年前保护至少 30% 陆地和海洋。进度条使用世界银行陆地保护区面积数据自动计算。",
                    "Core target of the Kunming-Montreal Global Biodiversity Framework (2022): protect at least 30% of land and ocean by 2030. Progress bar auto-calculated using World Bank terrestrial protected area data."
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">{t("碳定价", "Carbon Pricing")}</p>
                <p className="leading-relaxed">
                  {t(
                    "涵盖碳排放交易体系 (ETS) 和碳税两种机制。碳价以美元/吨CO₂表示，覆盖率为碳定价机制覆盖的排放占全国总排放的百分比。数据来源：世界银行碳定价仪表盘。",
                    "Covers Emissions Trading Systems (ETS) and carbon tax mechanisms. Carbon price in USD/tCO₂, coverage as share of national emissions. Source: World Bank Carbon Pricing Dashboard."
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">{t("透明度报告 (BTR)", "Transparency Reports (BTR)")}</p>
                <p className="leading-relaxed">
                  {t(
                    "双年透明度报告 (BTR) 是《巴黎协定》强化透明度框架下的核心义务。首份 BTR (BTR1) 截止日为 2024 年底。状态分为：已提交 / 待提交。",
                    "Biennial Transparency Reports (BTR) are a core obligation under the Paris Agreement Enhanced Transparency Framework. The first BTR (BTR1) was due by end of 2024. Status: Submitted / Pending."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Report Error */}
          <section className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              {t("反馈与贡献", "Feedback & Contributions")}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {t(
                "如果您发现数据错误或过时信息，或有功能建议，欢迎通过以下方式联系：",
                "If you find data errors, outdated information, or have feature suggestions:"
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/cyqmimc/global-environmental-agencies/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {t("报告数据错误", "Report Data Error")}
              </a>
              <a
                href="https://github.com/cyqmimc/global-environmental-agencies"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {t("贡献代码", "Contribute on GitHub")}
              </a>
            </div>
          </section>

          {/* License */}
          <section>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              {t("许可协议", "License")}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium text-gray-700">{t("代码", "Code")}:</span> MIT License</p>
              <p><span className="font-medium text-gray-700">{t("地图", "Map")}:</span> CC BY-SA 3.0 (simple-world-map by Al MacDonald / Fritz Lekschas)</p>
              <p><span className="font-medium text-gray-700">{t("数据", "Data")}:</span> {t("各数据源遵循其各自的开放许可（World Bank: CC BY 4.0, Yale EPI: CC BY-NC-SA 4.0 等）", "Each source follows its own open license (World Bank: CC BY 4.0, Yale EPI: CC BY-NC-SA 4.0, etc.)")}</p>
            </div>
          </section>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {t("关闭", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
