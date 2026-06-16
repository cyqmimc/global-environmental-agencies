import { RESPONSIBILITY_LABELS, shareCountryLink } from "../constants";
import Sparkline from "./charts/Sparkline";

/**
 * One country card in the grid view.
 * @param {Object} props
 * @param {import("../types").Country} props.country
 * @param {string} props.language
 * @param {(zh:string,en:string)=>string} props.t
 * @param {() => void} props.onOpen
 * @param {(e:React.MouseEvent)=>void} props.onToggleCompare
 * @param {boolean} props.isInCompare
 * @param {boolean} props.isFav
 * @param {()=>void} props.onToggleFav
 * @param {(dataYear?:number)=>string} [props.yearLabel]
 */
export default function CountryCard({
  country,
  language,
  t,
  onOpen,
  onToggleCompare,
  isInCompare,
  isFav,
  onToggleFav,
  yearLabel,
}) {
  const co2History = country.wb?.history?.co2Mt;
  const renewYear = country.wb?.dataYear?.renewableEnergy;
  const pm25Year = country.wb?.dataYear?.pm25;

  const handleShare = (e) => {
    e.stopPropagation();
    shareCountryLink(country.isoCode, language);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFav();
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 flex flex-col items-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative ${
        isInCompare
          ? "border-green-500 ring-2 ring-green-200 dark:ring-green-900"
          : "border-gray-100 dark:border-gray-800"
      }`}
      onClick={onOpen}
    >
      <div className="absolute top-3 left-3 flex gap-1.5">
        <button
          onClick={handleFav}
          className={`w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors cursor-pointer ${
            isFav ? "text-amber-500" : "text-gray-300 hover:text-amber-400"
          }`}
          title={isFav ? t("取消关注", "Unfavorite") : t("加入关注", "Favorite")}
          aria-label={isFav ? t("取消关注", "Unfavorite") : t("加入关注", "Favorite")}
        >
          {isFav ? "★" : "☆"}
        </button>
        <button
          onClick={handleShare}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-blue-500 text-sm transition-colors cursor-pointer"
          title={t("复制分享链接", "Copy share link")}
          aria-label={t("复制分享链接", "Copy share link")}
        >
          🔗
        </button>
      </div>
      <button
        onClick={onToggleCompare}
        className={`absolute top-3 right-3 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs transition-colors cursor-pointer ${
          isInCompare
            ? "bg-green-600 border-green-600 text-white"
            : "border-gray-300 dark:border-gray-600 hover:border-green-400 text-transparent hover:text-green-400"
        }`}
        title={t("加入对比", "Add to compare")}
        aria-label={t("加入对比", "Add to compare")}
      >
        ✓
      </button>

      <img
        src={country.flagUrl}
        alt={country.countryEn}
        loading="lazy"
        className="w-16 h-11 object-cover rounded shadow-sm mb-3 mt-2"
      />
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 text-center">
        {language === "zh" ? country.countryZh : country.countryEn}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 line-clamp-2">
        {language === "zh" ? country.agencyZh : country.agencyEn}
      </p>
      <span className="mt-2 inline-block bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium px-2.5 py-1 rounded-full">
        {country.region}
      </span>
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {country.responsibilities.map((r) => (
          <span
            key={r}
            className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full"
          >
            {RESPONSIBILITY_LABELS[r] ? RESPONSIBILITY_LABELS[r][language] : r}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500 justify-center items-center">
        <span className="text-amber-600 font-medium">EPI {country.epiScore}</span>
        <span title={yearLabel?.(renewYear)}>
          ⚡ {country.wb?.renewableEnergy?.toFixed(0) ?? "—"}%
        </span>
        <span
          title={yearLabel?.(pm25Year)}
          className={country.wb?.pm25 > 25 ? "text-red-500" : country.wb?.pm25 > 10 ? "text-amber-500" : "text-green-600"}
        >
          PM {country.wb?.pm25?.toFixed(0) ?? "—"}
        </span>
      </div>
      {co2History && co2History.length >= 2 && (() => {
        // Pick first/last non-null endpoints so missing tail data doesn't
        // flip the color silently (null > number is always false in JS).
        const valid = co2History.filter((d) => d && d.value != null);
        if (valid.length < 2) return null;
        const rising = valid[valid.length - 1].value > valid[0].value;
        return (
          <div className="mt-2 flex items-center gap-1.5" title={t("CO₂ 排放趋势 (2015–)", "CO₂ emissions trend (2015–)")}>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">CO₂</span>
            <Sparkline
              data={co2History}
              color={rising ? "#dc2626" : "#16a34a"}
              fill={rising ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)"}
            />
          </div>
        );
      })()}
      <a
        href={country.website}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-3 w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {t("访问官网", "Visit Website")}
      </a>
    </div>
  );
}
