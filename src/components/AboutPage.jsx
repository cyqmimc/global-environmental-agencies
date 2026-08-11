import useDialogA11y from "../hooks/useDialogA11y";

export default function AboutPage({ language, onClose }) {
  const t = (zh, en) => (language === "zh" ? zh : en);
  const dialogRef = useDialogA11y(true, onClose);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("关于本项目", "About This Project")}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] h-full sm:h-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label={t("关闭", "Close")}
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
                { icon: "📊", zh: "排行榜：状态指数（禀赋）与治理指数（绩效）双榜，权重可调", en: "Rankings: separate State (endowment) and Governance (performance) indices, adjustable weights" },
                { icon: "🏆", zh: "国家成绩单：两项指数各自的 A+ 到 F 等级评分", en: "Country Scorecard: A+ to F grades for each index" },
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
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              {t(
                "早期版本用一个 6 维加权数字给所有国家打分，把森林覆盖、保护区这类自然禀赋和 NDC 评级、碳定价这类治理绩效混在一起相加——结果是森林多的国家（如芬兰、刚果）天然获得高分，新加坡这类国土狭小的国家天然分数垫底，跟这些国家的政策努力程度关系不大。现在排行榜和成绩单改为两个独立指数：",
                "The earlier version blended everything into one 6-dimension weighted number — natural endowment (forest cover, protected areas) added directly to governance performance (NDC ambition, carbon pricing). The result: forest-rich countries (Finland, DR Congo) scored high regardless of policy, and small-territory countries (Singapore) scored low regardless of policy. Rankings and Scorecard now use two independent indices instead:"
              )}
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed mb-3 list-disc pl-5 space-y-1">
              <li>
                <strong>{t("状态指数（禀赋）", "State Index (Endowment)")}</strong> —
                {t(
                  " 森林覆盖、自然保护区、空气质量（PM2.5）、EPI 评分。反映一国的自然条件与既有环境状况，不完全是政策的结果。",
                  " forest cover, protected areas, air quality (PM2.5), EPI score. Reflects natural conditions and existing environmental state, not purely policy outcomes."
                )}
              </li>
              <li>
                <strong>{t("治理指数（绩效）", "Governance Index (Performance)")}</strong> —
                {t(
                  " NDC 雄心评级、碳定价强度（价格×覆盖率）、BTR 报告提交、基加利修正案、NDC 3.0 提交、LDN 目标设定、可再生能源占比、碳强度。这是本项目真正想衡量的——一国在做什么，而非天生条件如何。",
                  " NDC ambition rating, carbon pricing strength (price × coverage), BTR submission, Kigali Amendment, NDC 3.0 submission, LDN target-setting, renewable energy share, carbon intensity. This is what the project actually wants to measure — what a country is doing, not what it was born with."
                )}
              </li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {t(
                "两个指数刻意不合并成一个数字——合并会重新制造被修复的问题。排行榜可在两者间切换排序，成绩单并列展示两个等级。每个维度先归一化到 0-100 再按权重加总；权重可在排行榜「调整权重」面板中自定义，并写入分享链接。",
                "The two indices are deliberately not merged into one number — merging them would recreate the exact problem being fixed. Rankings can sort by either; Scorecard shows both grades side by side. Each dimension is normalized to 0-100 before being combined by weight; weights can be customized in the Rankings \"Adjust Weights\" panel and are saved to the share link."
              )}
            </p>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("状态指数维度", "State Dimension")}</th>
                    <th className="text-center py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("默认权重", "Default Weight")}</th>
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("归一化方式", "Normalization")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dim: { zh: "森林覆盖", en: "Forest Coverage" }, weight: "25%", calc: { zh: "数据集内 winsorized min-max（5–95 分位裁剪后缩放至 0-100）", en: "Dataset-relative winsorized min-max (clip to 5th–95th pct, scale to 0-100)" } },
                    { dim: { zh: "自然保护区", en: "Protected Areas" }, weight: "25%", calc: { zh: "同上", en: "Same as above" } },
                    { dim: { zh: "空气质量（PM2.5）", en: "Air Quality (PM2.5)" }, weight: "25%", calc: { zh: "同上，反向（越低越好）", en: "Same as above, inverted (lower is better)" } },
                    { dim: { zh: "EPI 评分", en: "EPI Score" }, weight: "25%", calc: { zh: "同上", en: "Same as above" } },
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
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("治理指数维度", "Governance Dimension")}</th>
                    <th className="text-center py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("默认权重", "Default Weight")}</th>
                    <th className="text-left py-2 px-3 border-b border-gray-200 font-medium text-gray-600">{t("归一化方式", "Normalization")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dim: { zh: "NDC 雄心评级", en: "NDC Ambition Rating" }, weight: "20%", calc: { zh: "CAT 7 级顺序映射至 0-100（已是有界量表，不再数据集归一化）", en: "CAT's 7-level scale mapped to 0-100 (already bounded, not dataset-normalized)" } },
                    { dim: { zh: "碳定价强度", en: "Carbon Pricing Strength" }, weight: "15%", calc: { zh: "价格(USD/t)×覆盖率；无碳定价机制记为真实的 0（非缺失值），再数据集归一化", en: "price(USD/t) × coverage share; no pricing mechanism = a real 0 (not missing), then dataset-normalized" } },
                    { dim: { zh: "BTR 报告提交 / 基加利修正案 / NDC 3.0 提交 / LDN 目标设定", en: "BTR Submitted / Kigali Amendment / NDC 3.0 Submitted / LDN Target Set" }, weight: t("各 10-15%", "10-15% each"), calc: { zh: "布尔值直接映射 0 或 100（不数据集归一化，避免全员同值时退化为中性 50 分）", en: "Boolean mapped directly to 0 or 100 (not dataset-normalized, to avoid collapsing to a neutral 50 when everyone shares the same value)" } },
                    { dim: { zh: "可再生能源占比", en: "Renewable Energy Share" }, weight: "10%", calc: { zh: "数据集内 winsorized min-max", en: "Dataset-relative winsorized min-max" } },
                    { dim: { zh: "碳强度", en: "Carbon Intensity" }, weight: "10%", calc: { zh: "同上，反向（越低越好）", en: "Same as above, inverted (lower is better)" } },
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

            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-blue-800 mb-1">{t("缺失值政策", "Missing-Value Policy")}</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                {t(
                  "某维度数据缺失时，该维度不计入该国得分，剩余维度的权重按比例重新归一化——缺失不再被当作最差值（0 分），避免用不存在的数据惩罚国家。若一国某指数的有效维度少于 4 个（状态指数共 4 维，因此缺一即不足；治理指数共 8 维），该指数不给出分数，显示「数据不足」，在排行榜中单独分组置底，且不参与成绩单 A–F 评级。",
                  "When a dimension's data is missing for a country, that dimension is excluded and the remaining weights are renormalized proportionally — missing is no longer treated as the worst possible value (0), which would unfairly penalize a country for data that simply doesn't exist. If fewer than 4 valid dimensions remain for an index (State has only 4 total, so any single gap triggers this; Governance has 8), no score is given — the UI shows \"Insufficient data\", the country is grouped separately at the bottom of that index's ranking, and it's excluded from that index's A–F grading."
                )}
              </p>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-amber-800 mb-1">{t("已知局限", "Known Limitations")}</p>
              <ul className="text-xs text-amber-800 leading-relaxed list-disc pl-4 space-y-0.5">
                <li>{t(
                  "可再生能源占比被归入「治理」维度，但它部分反映水电/地热等自然资源禀赋，并非纯粹的政策选择——冰岛、挪威等国受益于此。",
                  "Renewable energy share is bucketed under \"Governance\", but it partly reflects natural resource endowment (hydro/geothermal potential) rather than pure policy choice — countries like Iceland and Norway benefit from this."
                )}</li>
                <li>{t(
                  "EPI 评分本身是 Yale 团队的复合指数，其内部方法论（含权重与覆盖范围）不受本项目控制，被纳入「状态」指数时按整体对待。",
                  "The EPI score is itself a composite index built by the Yale team; its internal methodology (weights, coverage) is outside this project's control and is treated as a single input to the State index."
                )}</li>
                <li>{t(
                  "Winsorized min-max 对样本量较小的子集（如按地区/集团筛选后）更容易受个别极值影响；当前归一化统一基于全部 80 国，不随筛选变化。",
                  "Winsorized min-max is more sensitive to individual extremes on smaller subsets (e.g. after filtering by region/group); normalization is always computed against the full 80-country set, not the currently filtered view."
                )}</li>
                <li>{t(
                  "默认权重为编者主观设定，非统计推导；这正是「调整权重」滑块存在的原因——不同立场的用户可以按自己的判断重新加权。",
                  "Default weights are editorially chosen, not statistically derived — this is exactly why the \"Adjust Weights\" sliders exist, so users with different priorities can re-weight for themselves."
                )}</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">{t("成绩单等级标准", "Scorecard Grading Scale")}</p>
              <p className="text-xs text-gray-500 mb-2">
                {t("基于该指数在全部有效评分国家中的百分位排名，两个指数各自独立计算。", "Based on percentile rank among all countries with a valid score for that index, computed independently per index.")}
              </p>
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium text-amber-800">
                  {t("重点公约与主要职能：非完整清单", "Selected Treaties & Key Focus Areas: not exhaustive lists")}
                </p>
                <p className="leading-relaxed text-amber-800">
                  {t(
                    "每个国家页面展示的「重点公约（节选）」与「主要职能（节选）」是编者手工挑选的代表性条目，并非该国批准的全部国际公约或环保机构承担的全部职能范围。例如某国页面未列出《蒙特利尔议定书》，不代表该国未加入——这些公约（巴黎协定、UNFCCC、蒙特利尔议定书、CITES、巴塞尔公约等）在全球已接近普遍批准。完整、逐国核实的批准状态数据库正在建设中；在此之前，请勿将「未列出」解读为「未加入」或「无相关职能」。",
                    "The \"Selected Treaties\" and \"Key Focus Areas\" shown on each country page are editor-picked representative entries, not the complete set of international treaties a country has ratified or the full scope of its environmental agency's mandate. For example, a country page not listing the Montreal Protocol does not mean that country hasn't joined it — treaties like the Paris Agreement, UNFCCC, Montreal Protocol, CITES, and the Basel Convention are near-universally ratified globally. A complete, country-by-country verified ratification database is under construction; until then, please do not read \"not listed\" as \"not a party\" or \"no such function\"."
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
