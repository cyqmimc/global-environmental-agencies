const GOAL_COLORS = {
  waterStress: "#26bde2",
  materialConsumptionGdp: "#bf8b2e",
  marineKbaProtected: "#0a97d9",
  degradedLand: "#56c02b",
};

const NATURE_LABELS = {
  C: { zh: "国家数据", en: "Country data" },
  CA: { zh: "国家调整数据", en: "Country-adjusted" },
  E: { zh: "估算数据", en: "Estimated" },
  G: { zh: "全球监测数据", en: "Global monitoring" },
  M: { zh: "模型数据", en: "Modelled" },
};

function formatValue(key, observation) {
  if (observation?.status !== "available") return null;
  if (key === "materialConsumptionGdp") return observation.value.toFixed(2);
  return observation.value.toFixed(1);
}

export default function SdgSnapshot({ snapshot, meta, language, t }) {
  const indicators = meta?.indicators || {};
  const rows = ["waterStress", "materialConsumptionGdp", "marineKbaProtected", "degradedLand"];

  return (
    <section className="mb-5 rounded-xl border border-sky-100 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t("SDG 环境快照", "SDG Environmental Snapshot")}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t(
              "联合国官方全球 SDG 指标数据库 · 各系列最新共同年份",
              "Official UN Global SDG Indicators Database · latest common year per series",
            )}
          </p>
        </div>
        <a
          href={meta?.sourceUrl || "https://unstats.un.org/sdgs/dataportal/database"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-700 dark:text-sky-300 hover:underline"
        >
          {t("查看官方数据 →", "Official data →")}
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((key) => {
          const definition = indicators[key] || {};
          const observation = snapshot[key] || { status: "missing" };
          const value = formatValue(key, observation);
          const nature = NATURE_LABELS[observation.nature];
          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-3"
              style={{ borderTop: `3px solid ${GOAL_COLORS[key]}` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: GOAL_COLORS[key] }}
                >
                  SDG {definition.indicator || "—"}
                </span>
                {observation.year && (
                  <span className="text-xs text-gray-400">{observation.year}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 min-h-8">
                {language === "zh" ? definition.labelZh : definition.labelEn}
              </p>
              {observation.status === "available" ? (
                <>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {value}{" "}
                    <span className="text-xs font-normal text-gray-500">{observation.unit}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {nature
                      ? language === "zh"
                        ? nature.zh
                        : nature.en
                      : t("官方记录", "Official record")}
                    {definition.direction === "lower"
                      ? ` · ${t("越低越好", "lower is better")}`
                      : ` · ${t("越高越好", "higher is better")}`}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-gray-400 mt-3">
                  {observation.status === "not_applicable"
                    ? t("不适用（内陆国家）", "Not applicable (landlocked)")
                    : t("该年份无可比数据", "No comparable data for this year")}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        {t(
          "SDG 指标暂不计入状态指数或治理指数；缺失与不适用均不按 0 分处理。不同系列的数据年份可能不同。",
          "SDG indicators are not included in the State or Governance indices; missing and not-applicable values are never scored as zero. Series years may differ.",
        )}
      </p>
    </section>
  );
}
