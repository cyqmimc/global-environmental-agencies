import { Radar } from "react-chartjs-2";
import { TREATY_LABELS, RESPONSIBILITY_LABELS, NDC_RATING_CONFIG } from "../constants";

export default function DetailDialog({ selectedCountry, language, t, globalAvg, onClose, copied, onCopy }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[90vh] h-full sm:h-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center gap-4">
            <img
              src={selectedCountry.flagUrl}
              alt={selectedCountry.countryEn}
              className="w-20 h-14 object-cover rounded-lg shadow-md"
            />
            <div>
              <h3 className="text-2xl font-bold">
                {language === "zh"
                  ? selectedCountry.countryZh
                  : selectedCountry.countryEn}
              </h3>
              <p className="text-green-100 mt-1">
                {language === "zh"
                  ? selectedCountry.agencyZh
                  : selectedCountry.agencyEn}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
              {selectedCountry.region}
            </span>
            <span className="bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
              {t("成立于", "Est.")} {selectedCountry.established}
            </span>
            <span className="bg-orange-50 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">
              EPI {selectedCountry.epiScore}
            </span>
            <span className="bg-cyan-50 text-cyan-700 text-sm font-medium px-3 py-1 rounded-full">
              {t("碳中和", "Net Zero")} {selectedCountry.netZeroTarget}
            </span>
            <a
              href={selectedCountry.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              🔗 {t("官方网站", "Official Website")}
            </a>
          </div>

          <p className="text-gray-600 leading-relaxed mb-4">
            {language === "zh"
              ? selectedCountry.descriptionZh
              : selectedCountry.descriptionEn}
          </p>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">
              {t("特色领域", "Focus Areas")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCountry.responsibilities.map((r) => (
                <span
                  key={r}
                  className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                >
                  {RESPONSIBILITY_LABELS[r]
                    ? RESPONSIBILITY_LABELS[r][language]
                    : r}
                </span>
              ))}
            </div>
          </div>

          {/* Treaty Compliance Dashboard - 5 rows */}
          {(() => {
            const pa = selectedCountry.parisAgreement;
            const mp = selectedCountry.montrealProtocol;
            const cbd = selectedCountry.cbd;
            const cp = selectedCountry.carbonPricing;
            const rp = selectedCountry.reportingStatus;
            const protArea = selectedCountry.wb?.protectedAreas;
            const ratingCfg = pa?.ndcRating ? NDC_RATING_CONFIG[pa.ndcRating] : null;
            const montrealOk = mp?.kigaliAmendment;
            const cbdPct = protArea != null ? Math.min(100, (protArea / 30) * 100) : 0;
            const hasPrice = cp?.priceUSD != null;
            const btrOk = rp?.btrSubmitted;

            return (
              <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {t("履约合规全景", "Compliance Overview")}
                </h4>
                <div className="space-y-2.5">
                  {/* Paris NDC */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{t("NDC 雄心", "NDC Ambition")}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${ratingCfg?.barColor || "bg-gray-300"}`}
                        style={{ width: pa?.ndcRating === "1.5C" ? "100%" : pa?.ndcRating === "2C" ? "80%" : pa?.ndcRating === "almost_sufficient" ? "65%" : pa?.ndcRating === "insufficient" ? "45%" : pa?.ndcRating === "highly_insufficient" ? "25%" : pa?.ndcRating === "critically_insufficient" ? "15%" : "5%" }} />
                    </div>
                    <span className={`text-xs font-medium w-24 text-right ${ratingCfg?.textColor || "text-gray-500"}`}>
                      {ratingCfg ? (language === "zh" ? ratingCfg.zh : ratingCfg.en) : "—"}
                    </span>
                  </div>
                  {/* Carbon Pricing */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{t("碳定价", "Carbon Price")}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${hasPrice ? (cp.priceUSD >= 50 ? "bg-green-500" : cp.priceUSD >= 20 ? "bg-lime-400" : "bg-yellow-400") : "bg-gray-300"}`}
                        style={{ width: hasPrice ? `${Math.min(100, cp.priceUSD / 1.3)}%` : "3%" }} />
                    </div>
                    <span className={`text-xs font-medium w-24 text-right ${hasPrice ? "text-green-700" : "text-gray-400"}`}>
                      {hasPrice ? `$${cp.priceUSD}/t` : t("无", "None")}
                    </span>
                  </div>
                  {/* Reporting */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{t("透明度", "Transparency")}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${btrOk ? "bg-green-500" : "bg-red-400"}`}
                        style={{ width: btrOk ? "100%" : "30%" }} />
                    </div>
                    <span className={`text-xs font-medium w-24 text-right ${btrOk ? "text-green-600" : "text-red-500"}`}>
                      {btrOk ? t("BTR 已提交", "BTR Submitted") : t("BTR 待提交", "BTR Pending")}
                    </span>
                  </div>
                  {/* Montreal */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{t("蒙特利尔", "Montreal")}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${montrealOk ? "bg-green-500" : "bg-yellow-400"}`}
                        style={{ width: montrealOk ? "100%" : "70%" }} />
                    </div>
                    <span className={`text-xs font-medium w-24 text-right ${montrealOk ? "text-green-600" : "text-yellow-600"}`}>
                      {montrealOk ? t("完全合规", "Fully Compliant") : t("基加利待批", "Kigali Pending")}
                    </span>
                  </div>
                  {/* CBD */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">CBD 30×30</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full ${cbdPct >= 100 ? "bg-green-500" : "bg-emerald-400"}`}
                        style={{ width: `${cbdPct}%` }} />
                    </div>
                    <span className={`text-xs font-medium w-24 text-right ${cbdPct >= 100 ? "text-green-600" : "text-gray-600"}`}>
                      {protArea != null ? `${protArea.toFixed(1)}% / 30%` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Paris Agreement NDC */}
          {selectedCountry.parisAgreement && (
            <div className="mb-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <h4 className="text-sm font-semibold text-blue-800">
                  {t("巴黎协定 · NDC", "Paris Agreement · NDC")}
                </h4>
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {t("已批准", "Ratified")}
                </span>
                {(() => {
                  const cfg = NDC_RATING_CONFIG[selectedCountry.parisAgreement.ndcRating];
                  return cfg ? (
                    <span className={`${cfg.color} text-white text-xs px-2 py-0.5 rounded-full`}>
                      {language === "zh" ? cfg.zh : cfg.en}
                    </span>
                  ) : null;
                })()}
              </div>
              {selectedCountry.parisAgreement.ratifiedDate && (
                <p className="text-xs text-blue-500 mb-2">
                  {t("批准日期", "Ratified")} {selectedCountry.parisAgreement.ratifiedDate}
                  {selectedCountry.netZeroTarget && (
                    <span className="ml-3">
                      {t("碳中和目标", "Net Zero")}: <strong>{selectedCountry.netZeroTarget}</strong>
                    </span>
                  )}
                </p>
              )}
              <p className="text-sm text-blue-900 leading-relaxed mb-3">
                {language === "zh"
                  ? selectedCountry.parisAgreement.ndcTargetZh
                  : selectedCountry.parisAgreement.ndcTargetEn}
              </p>
              {/* NDC Timeline */}
              {selectedCountry.parisAgreement.ndcHistory && (
                <div className="border-t border-blue-100 pt-2">
                  <p className="text-xs font-medium text-blue-600 mb-1.5">{t("NDC 提交时间线", "NDC Submission Timeline")}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {selectedCountry.parisAgreement.ndcHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                          {h.year} {h.version}
                        </span>
                        {i < selectedCountry.parisAgreement.ndcHistory.length - 1 && (
                          <span className="text-blue-300">→</span>
                        )}
                      </div>
                    ))}
                    {selectedCountry.parisAgreement.nextNdcDeadline && (
                      <>
                        <span className="text-blue-300">→</span>
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded animate-pulse">
                          {selectedCountry.parisAgreement.nextNdcDeadline} {t("下次更新", "Next Update")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Montreal Protocol */}
          {selectedCountry.montrealProtocol && (
            <div className="mb-4 bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-cyan-800">
                  {t("蒙特利尔议定书 · 臭氧层保护", "Montreal Protocol · Ozone Protection")}
                </h4>
                <span className="bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {t("已批准", "Ratified")}
                </span>
                {selectedCountry.montrealProtocol.kigaliAmendment ? (
                  <span className="bg-cyan-100 text-cyan-700 text-xs px-2 py-0.5 rounded-full">
                    {t("基加利修正案 ✓", "Kigali ✓")}
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                    {t("基加利修正案 ✗", "Kigali ✗")}
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-500 mb-2">
                {t("批准日期", "Ratified")} {selectedCountry.montrealProtocol.ratifiedDate}
              </p>
              <p className="text-sm text-cyan-900 leading-relaxed">
                {language === "zh"
                  ? selectedCountry.montrealProtocol.commitmentZh
                  : selectedCountry.montrealProtocol.commitmentEn}
              </p>
            </div>
          )}

          {/* CBD 30x30 */}
          {selectedCountry.cbd && (
            <div className="mb-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-emerald-800">
                  {t("生物多样性公约 · 30×30 目标", "CBD · 30×30 Target")}
                </h4>
                <span className={`text-white text-xs px-2 py-0.5 rounded-full ${
                  selectedCountry.cbd.status === "ratified" ? "bg-emerald-600" : "bg-amber-500"
                }`}>
                  {selectedCountry.cbd.status === "ratified" ? t("已批准", "Ratified") : t("已签署", "Signed")}
                </span>
              </div>
              {selectedCountry.cbd.ratifiedDate && (
                <p className="text-xs text-emerald-500 mb-2">
                  {t("批准日期", "Ratified")} {selectedCountry.cbd.ratifiedDate}
                </p>
              )}
              {/* 30x30 progress bar */}
              {selectedCountry.wb?.protectedAreas != null && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-emerald-700 mb-1">
                    <span>{t("当前保护区覆盖", "Current Protected Areas")}: {selectedCountry.wb.protectedAreas.toFixed(1)}%</span>
                    <span>{t("目标", "Target")}: 30%</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        selectedCountry.wb.protectedAreas >= 30 ? "bg-emerald-600" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, (selectedCountry.wb.protectedAreas / 30) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-1 text-right">
                    {selectedCountry.wb.protectedAreas >= 30
                      ? t("✓ 已达标", "✓ Target met")
                      : `${t("还需", "Need")} ${(30 - selectedCountry.wb.protectedAreas).toFixed(1)}%`}
                  </p>
                </div>
              )}
              <p className="text-sm text-emerald-900 leading-relaxed">
                {language === "zh"
                  ? selectedCountry.cbd.commitmentZh
                  : selectedCountry.cbd.commitmentEn}
              </p>
            </div>
          )}

          {/* Carbon Pricing + Reporting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Carbon Pricing */}
            {selectedCountry.carbonPricing && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <h4 className="text-xs font-semibold text-amber-800 mb-2">{t("碳定价机制", "Carbon Pricing")}</h4>
                <div className="flex gap-2 mb-2">
                  {selectedCountry.carbonPricing.hasETS && (
                    <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">ETS</span>
                  )}
                  {selectedCountry.carbonPricing.hasCarbonTax && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{t("碳税", "Carbon Tax")}</span>
                  )}
                  {!selectedCountry.carbonPricing.hasETS && !selectedCountry.carbonPricing.hasCarbonTax && (
                    <span className="bg-gray-300 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t("无", "None")}</span>
                  )}
                </div>
                {selectedCountry.carbonPricing.priceUSD != null && (
                  <p className="text-2xl font-bold text-amber-700">${selectedCountry.carbonPricing.priceUSD}<span className="text-xs font-normal">/tCO₂</span></p>
                )}
                {selectedCountry.carbonPricing.coveragePercent > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{t("覆盖", "Coverage")} {selectedCountry.carbonPricing.coveragePercent}% {t("排放", "emissions")}</p>
                )}
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  {language === "zh" ? selectedCountry.carbonPricing.noteZh : selectedCountry.carbonPricing.noteEn}
                </p>
              </div>
            )}
            {/* Reporting Status */}
            {selectedCountry.reportingStatus && (
              <div className={`rounded-xl p-3 border ${selectedCountry.reportingStatus.btrSubmitted ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                <h4 className={`text-xs font-semibold mb-2 ${selectedCountry.reportingStatus.btrSubmitted ? "text-green-800" : "text-red-800"}`}>
                  {t("透明度报告", "Transparency Reporting")}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${selectedCountry.reportingStatus.btrSubmitted ? "bg-green-600" : "bg-red-500"}`}>
                    BTR {selectedCountry.reportingStatus.btrSubmitted ? "✓" : "✗"}
                  </span>
                  {selectedCountry.reportingStatus.btrYear && (
                    <span className="text-xs text-green-600">{selectedCountry.reportingStatus.btrYear}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {t("国家信息通报", "National Communications")}: {selectedCountry.reportingStatus.nationalComm} {t("次", "submitted")}
                </p>
                <p className={`text-xs mt-1 font-medium ${selectedCountry.reportingStatus.btrSubmitted ? "text-green-700" : "text-red-600"}`}>
                  {language === "zh" ? selectedCountry.reportingStatus.statusZh : selectedCountry.reportingStatus.statusEn}
                </p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">
              {t("其他国际公约", "Other International Treaties")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCountry.treaties.map((tr) => (
                <span
                  key={tr}
                  className="bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full"
                >
                  {language === "zh" ? (TREATY_LABELS[tr] || tr) : tr}
                </span>
              ))}
            </div>
          </div>

          {/* Key Laws */}
          {selectedCountry.keyLaws && selectedCountry.keyLaws.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                {t("核心环保法律", "Key Environmental Laws")}
              </h4>
              <div className="space-y-2">
                {selectedCountry.keyLaws.map((law, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">
                      {language === "zh" ? law.nameZh : law.nameEn}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      {law.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCountry.contact?.email && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">
                {t("联系方式", "Contact")}
              </h4>
              <a
                href={`mailto:${selectedCountry.contact.email}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {selectedCountry.contact.email}
              </a>
            </div>
          )}

          <button
            onClick={() => onCopy(selectedCountry)}
            className="mb-6 w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <span className="text-green-600">✓</span>
                {t("已复制到剪贴板", "Copied to clipboard")}
              </>
            ) : (
              <>
                <span>📋</span>
                {t("复制机构信息", "Copy agency info")}
              </>
            )}
          </button>

          {/* 6-metric data cards with data year */}
          {(() => {
            const dy = selectedCountry.wb?.dataYear || {};
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {selectedCountry.wb?.forestArea?.toFixed(1) ?? selectedCountry.data.forestCoverage}%
                  </p>
                  <p className="text-xs text-green-600 mt-1">{t("森林覆盖率", "Forest Area")}</p>
                  <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.forestCoverage}%</p>
                  {dy.forestArea && <p className="text-xs text-gray-300 mt-0.5">{dy.forestArea}</p>}
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {selectedCountry.wb?.renewableEnergy?.toFixed(1) ?? "—"}%
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">{t("可再生能源", "Renewable Energy")}</p>
                  <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.renewableEnergy}%</p>
                  {dy.renewableEnergy && <p className="text-xs text-gray-300 mt-0.5">{dy.renewableEnergy}</p>}
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-teal-700">
                    {selectedCountry.wb?.protectedAreas?.toFixed(1) ?? "—"}%
                  </p>
                  <p className="text-xs text-teal-600 mt-1">{t("自然保护区", "Protected Areas")}</p>
                  <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.protectedAreas}%</p>
                  {dy.protectedAreas && <p className="text-xs text-gray-300 mt-0.5">{dy.protectedAreas}</p>}
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {selectedCountry.wb?.pm25?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">PM2.5 (µg/m³)</p>
                  <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.pm25}</p>
                  {dy.pm25 && <p className="text-xs text-gray-300 mt-0.5">{dy.pm25}</p>}
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedCountry.wb?.co2PerCapita?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-xs text-red-500 mt-1">{t("人均CO₂ (吨)", "CO₂/Capita (t)")}</p>
                  <p className="text-xs text-gray-400">{t("均值", "Avg")} {globalAvg.co2PerCapita}</p>
                  {dy.co2Mt && <p className="text-xs text-gray-300 mt-0.5">{dy.co2Mt}</p>}
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedCountry.epiScore}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">EPI {t("评分", "Score")}</p>
                  <p className="text-xs text-gray-400">{t("满分 100", "Max 100")}</p>
                </div>
              </div>
            );
          })()}

          {/* Radar chart */}
          {selectedCountry.wb && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-3">
                {t("环境综合画像", "Environmental Profile")}
              </h4>
              <Radar
                data={{
                  labels: [
                    t("森林覆盖", "Forest"),
                    t("可再生能源", "Renewable"),
                    t("保护区", "Protected"),
                    t("空气质量", "Air Quality"),
                    t("碳效率", "CO₂ Efficiency"),
                    "EPI",
                  ],
                  datasets: [
                    {
                      label: language === "zh" ? selectedCountry.countryZh : selectedCountry.countryEn,
                      data: [
                        Math.min(selectedCountry.wb.forestArea ?? 0, 100),
                        Math.min(selectedCountry.wb.renewableEnergy ?? 0, 100),
                        Math.min(selectedCountry.wb.protectedAreas ?? 0, 100),
                        Math.max(0, 100 - (selectedCountry.wb.pm25 ?? 100)),
                        Math.max(0, 100 - Math.min((selectedCountry.wb.co2PerCapita ?? 0) * 5, 100)),
                        selectedCountry.epiScore ?? 0,
                      ],
                      backgroundColor: "rgba(34, 197, 94, 0.2)",
                      borderColor: "#22c55e",
                      pointBackgroundColor: "#22c55e",
                      borderWidth: 2,
                    },
                    {
                      label: t("全球均值", "Global Average"),
                      data: [
                        globalAvg.forestCoverage ?? 0,
                        globalAvg.renewableEnergy ?? 0,
                        globalAvg.protectedAreas ?? 0,
                        Math.max(0, 100 - (globalAvg.pm25 ?? 100)),
                        Math.max(0, 100 - Math.min((globalAvg.co2PerCapita ?? 0) * 5, 100)),
                        50,
                      ],
                      backgroundColor: "rgba(156, 163, 175, 0.1)",
                      borderColor: "#9ca3af",
                      pointBackgroundColor: "#9ca3af",
                      borderWidth: 1,
                      borderDash: [4, 4],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: { stepSize: 25, display: false },
                      pointLabels: { font: { size: 11 } },
                      grid: { color: "#e5e7eb" },
                    },
                  },
                  plugins: {
                    legend: { display: true, position: "bottom", labels: { boxWidth: 12, padding: 16 } },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
