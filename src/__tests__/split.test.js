import test from "node:test";
import assert from "node:assert/strict";
import { buildCore, buildDetail } from "../../scripts/split-countries.js";

const fixture = [
  {
    isoCode: "xx",
    countryEn: "Example",
    countryZh: "示例",
    agencyEn: "Agency",
    agencyZh: "机构",
    carbonPricing: {
      priceUSD: 42,
      coveragePercent: 35,
      hasETS: true,
      hasCarbonTax: false,
    },
    desertification: {
      affectedParty: true,
      ldnTargetSet: true,
      annex: "II",
      ldnYear: 2030,
      commitmentZh: "承诺",
      commitmentEn: "Commitment",
      sources: { ldn: "https://example.com/ldn" },
    },
  },
];

test("buildCore keeps carbon-pricing coverage used by governance scoring", () => {
  const [core] = buildCore(fixture);
  assert.equal(core.carbonPricing.coveragePercent, 35);
});

test("buildDetail keeps the full UNCCD block used by the detail dialog", () => {
  const detail = buildDetail(fixture);
  assert.equal(detail.xx.desertification.ldnYear, 2030);
  assert.equal(detail.xx.desertification.commitmentEn, "Commitment");
  assert.equal(detail.xx.desertification.sources.ldn, "https://example.com/ldn");
});
