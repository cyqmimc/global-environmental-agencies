export const SDG_INDICATORS = [
  {
    key: "waterStress",
    series: "ER_H2O_STRESS",
    indicator: "6.4.2",
    goal: 6,
    unit: "%",
    direction: "lower",
    labelZh: "水资源压力",
    labelEn: "Water stress",
    dimensions: { Activity: "TOTAL", "Reporting Type": "G" },
  },
  {
    key: "materialConsumptionGdp",
    series: "EN_MAT_DOMCMPG",
    indicator: "12.2.2",
    goal: 12,
    unit: "kg/2020 USD",
    direction: "lower",
    labelZh: "单位 GDP 国内物质消费",
    labelEn: "Material consumption / GDP",
    dimensions: { "Type of product": "ALP", "Reporting Type": "G" },
  },
  {
    key: "marineKbaProtected",
    series: "ER_MRN_MPA",
    indicator: "14.5.1",
    goal: 14,
    unit: "%",
    direction: "higher",
    labelZh: "海洋关键生物多样性区保护覆盖",
    labelEn: "Marine KBA protection",
    dimensions: { "Reporting Type": "G" },
  },
  {
    key: "degradedLand",
    series: "AG_LND_DGRD",
    indicator: "15.3.1",
    goal: 15,
    unit: "%",
    direction: "lower",
    labelZh: "土地退化面积占比",
    labelEn: "Degraded land",
    dimensions: { "Reporting Type": "G" },
  },
  {
    key: "safeDrinkingWater",
    series: "SH_H2O_SAFE",
    indicator: "6.1.1",
    goal: 6,
    unit: "%",
    direction: "higher",
    labelZh: "安全管理饮用水服务人口占比",
    labelEn: "Safely managed drinking water",
    dimensions: { Location: "ALLAREA", "Reporting Type": "G" },
  },
  {
    key: "cleanCooking",
    series: "EG_EGY_CLEAN",
    indicator: "7.1.2",
    goal: 7,
    unit: "%",
    direction: "higher",
    labelZh: "清洁烹饪燃料和技术使用人口占比",
    labelEn: "Clean cooking fuels and technology",
    dimensions: { Location: "ALLAREA", "Reporting Type": "G" },
  },
  {
    key: "redListIndex",
    series: "ER_RSK_LST",
    indicator: "15.5.1",
    goal: 15,
    unit: "0–1",
    direction: "higher",
    labelZh: "物种红色名录指数",
    labelEn: "Red List Index",
    dimensions: { "Reporting Type": "G" },
  },
];

export function sdgValue(observation) {
  return observation?.status === "available" && Number.isFinite(observation.value)
    ? observation.value : null;
}

export function formatSdgValue(key, observation) {
  const value = sdgValue(observation);
  return value === null ? "—" : value.toFixed(key === "redListIndex" ? 3 : key === "materialConsumptionGdp" ? 2 : 1);
}

export function sortSdgCountries(countries, key, descending = true) {
  return [...countries].sort((a, b) => {
    const av = sdgValue(a.sdg?.[key]);
    const bv = sdgValue(b.sdg?.[key]);
    if (av === null) return bv === null ? 0 : 1;
    if (bv === null) return -1;
    return descending ? bv - av : av - bv;
  });
}
