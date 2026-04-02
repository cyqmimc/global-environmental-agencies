import json

with open("public/countries.json", "r") as f:
    data = json.load(f)

# ND-GAIN Vulnerability Index (0-1, higher = more vulnerable)
# Source: Notre Dame Global Adaptation Initiative (ND-GAIN), 2022 data
# https://gain.nd.edu/our-work/country-index/
#
# Cumulative CO2 emissions (Gt CO2, 1850-2022)
# Source: Global Carbon Project / Our World in Data
# https://ourworldindata.org/co2-emissions

CLIMATE_EQUITY = {
    # iso: (vulnerability, cumulative_co2_gt)
    "us": (0.36, 422.0),
    "cn": (0.42, 284.0),
    "de": (0.34, 92.0),
    "jp": (0.37, 65.0),
    "fr": (0.33, 37.0),
    "in": (0.52, 55.0),
    "gb": (0.31, 78.0),
    "br": (0.43, 15.0),
    "au": (0.34, 18.0),
    "za": (0.47, 17.0),
    "ca": (0.33, 33.0),
    "mx": (0.44, 18.0),
    "sa": (0.41, 15.0),
    "id": (0.48, 14.0),
    "it": (0.34, 24.0),
    "es": (0.36, 16.0),
    "ru": (0.39, 115.0),
    "sg": (0.30, 1.2),
    "eg": (0.48, 5.5),
    "kr": (0.36, 19.0),
    "se": (0.29, 5.0),
    "no": (0.28, 2.8),
    "nz": (0.32, 1.5),
    "ke": (0.55, 0.4),
    "ng": (0.56, 3.0),
    "ar": (0.40, 9.5),
    "co": (0.47, 3.5),
    "th": (0.46, 10.0),
    "nl": (0.30, 11.0),
    "tr": (0.42, 15.0),
    "dk": (0.28, 3.5),
    "fi": (0.28, 2.5),
    "ch": (0.28, 2.5),
    "at": (0.30, 4.5),
    "pt": (0.35, 3.0),
    "il": (0.37, 2.5),
    "ae": (0.36, 5.0),
    "my": (0.42, 6.5),
    "vn": (0.50, 4.5),
    "ph": (0.55, 3.0),
    "cl": (0.39, 4.0),
    "pe": (0.48, 2.5),
    "ma": (0.44, 2.0),
    "gh": (0.53, 0.6),
    "cr": (0.40, 0.3),
    "pl": (0.35, 25.0),
    "fj": (0.52, 0.03),
    "et": (0.60, 0.4),
    # Round 2 countries
    "pk": (0.55, 5.5),
    "bd": (0.58, 1.5),
    "iq": (0.52, 10.0),
    "ir": (0.45, 20.0),
    "kz": (0.40, 12.0),
    "ua": (0.43, 30.0),
    "gr": (0.36, 5.0),
    "ie": (0.29, 3.5),
    "ro": (0.39, 8.0),
    "cz": (0.33, 13.0),
    "be": (0.30, 8.5),
    "hu": (0.36, 5.5),
    "tz": (0.56, 0.3),
    "dz": (0.46, 6.0),
    "sn": (0.55, 0.3),
    "cd": (0.62, 0.2),
    "ec": (0.46, 1.5),
    "uy": (0.36, 0.5),
    "jm": (0.47, 0.4),
    "pg": (0.57, 0.2),
    # Round 3 countries
    "lk": (0.48, 1.0),
    "np": (0.53, 0.3),
    "mm": (0.55, 1.0),
    "kh": (0.54, 0.2),
    "mn": (0.44, 0.6),
    "uz": (0.44, 5.0),
    "ao": (0.55, 1.0),
    "mz": (0.58, 0.3),
    "ve": (0.48, 8.0),
    "bo": (0.49, 1.0),
    "cu": (0.42, 2.5),
    "do": (0.45, 1.0),
}

updated = 0
for c in data:
    iso = c.get("isoCode", "")
    eq = CLIMATE_EQUITY.get(iso)
    if eq:
        c["climateEquity"] = {
            "vulnerabilityIndex": eq[0],
            "cumulativeCO2Gt": eq[1]
        }
        updated += 1

with open("public/countries.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Updated {updated}/80 countries with climate equity data")

# Stats
vulns = [v[0] for v in CLIMATE_EQUITY.values()]
co2s = [v[1] for v in CLIMATE_EQUITY.values()]
print(f"Vulnerability range: {min(vulns)} - {max(vulns)}")
print(f"Cumulative CO2 range: {min(co2s)} - {max(co2s)} Gt")
