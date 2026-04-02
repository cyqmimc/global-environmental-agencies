export default function AboutPage({ language, onClose }) {
  const t = (zh, en) => (language === "zh" ? zh : en);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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
            {t("关于本项目", "About This Project")}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Description */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("项目简介", "Project Description")}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              全球环境治理观察是一个开源数据平台，旨在系统性地追踪各国环保机构、环境政策、国际公约履约情况及关键环境指标。通过整合来自世界银行、联合国、Yale大学等权威数据源，为研究者、政策制定者和公众提供一站式的全球环境治理信息。
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Global Environmental Governance Tracker is an open-source data platform that systematically tracks national environmental agencies, policies, treaty compliance, and key environmental indicators worldwide. By integrating authoritative data from the World Bank, United Nations, Yale University, and more, it provides a one-stop resource for researchers, policymakers, and the public.
            </p>
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
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">World Bank Open Data</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("森林覆盖率、可再生能源、PM2.5、CO₂排放、保护区面积、人口、GDP", "Forest coverage, renewable energy, PM2.5, CO₂ emissions, protected areas, population, GDP")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("年度更新", "Annual")}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">Climate Action Tracker</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("NDC 评级、气候政策评估", "NDC ratings, climate policy assessments")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("半年度更新", "Semi-annual")}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">UNFCCC</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("巴黎协定批准状态、NDC提交记录、BTR报告状态", "Paris Agreement ratification, NDC submissions, BTR reporting status")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("实时", "Real-time")}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">Yale EPI</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("环境绩效指数（EPI）评分", "Environmental Performance Index (EPI) scores")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("两年一次", "Biennial")}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">CBD Secretariat</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("生物多样性公约批准状态、30×30目标进度", "CBD ratification, 30×30 target progress")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("年度更新", "Annual")}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">UNEP Ozone Secretariat</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("蒙特利尔议定书及基加利修正案状态", "Montreal Protocol & Kigali Amendment status")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("年度更新", "Annual")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-gray-700">{t("各国政府官网", "National Government Websites")}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {t("环保机构信息、核心法律、碳定价机制", "Agency info, key laws, carbon pricing mechanisms")}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{t("不定期", "As available")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Methodology */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("方法说明", "Methodology Notes")}
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">
                  {t("NDC 评级", "NDC Ratings")}
                </p>
                <p className="leading-relaxed">
                  {t(
                    "NDC（国家自主贡献）评级来源于 Climate Action Tracker 的独立评估，衡量各国气候承诺是否与《巴黎协定》温控目标一致。评级从\"1.5°C 兼容\"（最高）到\"极度不足\"（最低），反映各国减排承诺的雄心水平。",
                    "NDC (Nationally Determined Contribution) ratings are sourced from Climate Action Tracker's independent assessments, measuring whether national climate pledges align with Paris Agreement temperature goals. Ratings range from \"1.5°C Compatible\" (highest) to \"Critically Insufficient\" (lowest), reflecting the ambition level of emission reduction commitments."
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {t("30×30 目标", "30×30 Target")}
                </p>
                <p className="leading-relaxed">
                  {t(
                    "30×30 是《昆明-蒙特利尔全球生物多样性框架》的核心目标之一，要求各国在2030年前将至少30%的陆地和海洋面积纳入有效保护。本平台使用世界银行的保护区面积数据来追踪各国的进展。",
                    "30×30 is a core target of the Kunming-Montreal Global Biodiversity Framework, requiring countries to protect at least 30% of their land and marine areas by 2030. This platform uses World Bank protected area data to track progress toward this goal."
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {t("EPI 评分", "EPI Scores")}
                </p>
                <p className="leading-relaxed">
                  {t(
                    "环境绩效指数 (EPI) 由耶鲁大学和哥伦比亚大学联合发布，综合评估各国在环境健康和生态系统活力方面的表现，满分100分。",
                    "The Environmental Performance Index (EPI) is published jointly by Yale and Columbia Universities, comprehensively evaluating national performance on environmental health and ecosystem vitality, with a maximum score of 100."
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {t("碳定价", "Carbon Pricing")}
                </p>
                <p className="leading-relaxed">
                  {t(
                    "碳定价数据涵盖碳排放交易体系 (ETS) 和碳税两种机制，价格以美元/吨CO₂表示。覆盖率表示碳定价机制覆盖的排放占全国总排放的百分比。",
                    "Carbon pricing data covers both Emissions Trading Systems (ETS) and carbon tax mechanisms, with prices in USD/tCO₂. Coverage percentage indicates the share of national emissions covered by carbon pricing."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Report Error */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("报告数据错误", "Report Data Errors")}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {t(
                "如果您发现数据错误或过时信息，欢迎通过 GitHub Issues 报告：",
                "If you find data errors or outdated information, please report via GitHub Issues:"
              )}
            </p>
            <a
              href="https://github.com/cyqmimc/global-environmental-agencies/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {t("前往 GitHub Issues 报告问题", "Report an Issue on GitHub")}
            </a>
          </section>

          {/* License */}
          <section>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {t("许可协议", "License")}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium text-gray-700">{t("数据", "Data")}:</span>{" "}
                {t(
                  "各数据源遵循其各自的开放数据许可协议（World Bank: CC BY 4.0, Yale EPI: CC BY-NC-SA 4.0 等）",
                  "Each data source follows its own open data license (World Bank: CC BY 4.0, Yale EPI: CC BY-NC-SA 4.0, etc.)"
                )}
              </p>
              <p>
                <span className="font-medium text-gray-700">{t("地图", "Map")}:</span> CC BY-SA 3.0
              </p>
              <p>
                <span className="font-medium text-gray-700">{t("代码", "Code")}:</span> MIT License
              </p>
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
