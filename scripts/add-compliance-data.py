import json

with open("public/countries.json", "r") as f:
    data = json.load(f)

# Carbon pricing data
# Sources: World Bank Carbon Pricing Dashboard, ICAP ETS Map
# priceUSD: approximate carbon price in USD/tCO2 as of 2024
# coveragePercent: % of national GHG emissions covered
CARBON_PRICING = {
    "us": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "联邦层面无碳定价；加州等州有区域碳交易", "en": "No federal carbon pricing; California and other states have regional ETS"},
    "cn": {"ets": True, "tax": False, "price": 11, "coverage": 40,
           "zh": "2021年启动全国碳排放交易体系，覆盖电力行业", "en": "National ETS launched 2021, covering power sector"},
    "de": {"ets": True, "tax": True, "price": 85, "coverage": 45,
           "zh": "EU ETS覆盖电力和工业；国内燃料排放交易体系碳价45欧元/吨", "en": "EU ETS for power/industry; national fuel emissions trading at €45/t"},
    "jp": {"ets": True, "tax": True, "price": 2, "coverage": 70,
           "zh": "碳税289日元/吨CO₂；2023年启动GX-ETS碳交易", "en": "Carbon tax ¥289/tCO₂; GX-ETS launched 2023"},
    "fr": {"ets": True, "tax": True, "price": 85, "coverage": 35,
           "zh": "EU ETS覆盖电力工业；国内碳税约45欧元/吨覆盖交通建筑", "en": "EU ETS for power/industry; domestic carbon tax ~€45/t for transport/buildings"},
    "in": {"ets": False, "tax": True, "price": 2, "coverage": 10,
           "zh": "煤炭税（GST补偿税）约400卢比/吨；碳信用交易制度筹备中", "en": "Coal cess (GST compensation) ~₹400/t; carbon credit trading scheme under development"},
    "gb": {"ets": True, "tax": True, "price": 50, "coverage": 30,
           "zh": "英国碳排放交易体系(UK ETS)，脱欧后独立运营；碳底价机制", "en": "UK ETS operating independently post-Brexit; carbon price floor mechanism"},
    "br": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳市场法案2024年通过，预计2025年启动", "en": "Carbon market bill passed 2024, expected launch 2025"},
    "au": {"ets": True, "tax": False, "price": 30, "coverage": 28,
           "zh": "减排基金保障机制(Safeguard Mechanism)，覆盖大型排放设施", "en": "Safeguard Mechanism covering large emitting facilities"},
    "za": {"ets": False, "tax": True, "price": 9, "coverage": 80,
           "zh": "2019年实施碳税，约159兰特/吨CO₂当量", "en": "Carbon tax since 2019, ~R159/tCO₂eq"},
    "ca": {"ets": True, "tax": True, "price": 65, "coverage": 80,
           "zh": "联邦碳定价基准：80加元/吨(2024)，逐年递增至170加元(2030)", "en": "Federal carbon price: C$80/t (2024), rising to C$170/t by 2030"},
    "mx": {"ets": True, "tax": True, "price": 4, "coverage": 40,
           "zh": "碳税约55比索/吨CO₂；碳排放交易试点运行中", "en": "Carbon tax ~MXN55/tCO₂; pilot ETS operational"},
    "sa": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "目前无碳定价机制；通过沙特绿色倡议推动减排", "en": "No carbon pricing; pursuing emission reductions through Saudi Green Initiative"},
    "id": {"ets": True, "tax": False, "price": 2, "coverage": 25,
           "zh": "2023年启动碳交易所，覆盖电力行业", "en": "Carbon exchange launched 2023, covering power sector"},
    "it": {"ets": True, "tax": False, "price": 85, "coverage": 40,
           "zh": "参与EU ETS，覆盖电力、工业和航空部门", "en": "Participates in EU ETS covering power, industry and aviation"},
    "es": {"ets": True, "tax": False, "price": 85, "coverage": 40,
           "zh": "参与EU ETS，覆盖电力、工业和航空部门", "en": "Participates in EU ETS covering power, industry and aviation"},
    "ru": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "萨哈林地区碳交易试点；联邦层面无碳定价", "en": "Sakhalin regional ETS pilot; no federal carbon pricing"},
    "sg": {"ets": False, "tax": True, "price": 25, "coverage": 80,
           "zh": "碳税25新元/吨(2024)，2030年前升至50-80新元/吨", "en": "Carbon tax S$25/t (2024), rising to S$50-80/t by 2030"},
    "eg": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "目前无碳定价机制；自愿碳市场发展中", "en": "No carbon pricing; voluntary carbon market under development"},
    "kr": {"ets": True, "tax": False, "price": 8, "coverage": 73,
           "zh": "韩国碳排放交易体系(K-ETS)，亚洲最大碳市场之一", "en": "Korea ETS (K-ETS), one of the largest carbon markets in Asia"},
    "se": {"ets": True, "tax": True, "price": 130, "coverage": 40,
           "zh": "全球最高碳税约1330瑞典克朗/吨CO₂(约$130)；同时参与EU ETS", "en": "World's highest carbon tax ~SEK1330/tCO₂ (~$130); also in EU ETS"},
    "no": {"ets": True, "tax": True, "price": 95, "coverage": 65,
           "zh": "碳税约950挪威克朗/吨CO₂(石油行业更高)；同时参与EU ETS", "en": "Carbon tax ~NOK950/tCO₂ (higher for petroleum); also in EU ETS"},
    "nz": {"ets": True, "tax": False, "price": 35, "coverage": 49,
           "zh": "新西兰碳排放交易体系(NZ ETS)，覆盖林业、能源、工业", "en": "NZ ETS covering forestry, energy, and industrial sectors"},
    "ke": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "目前无碳定价机制；碳市场研究阶段", "en": "No carbon pricing; carbon market under study"},
    "ng": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "目前无碳定价机制；碳市场法案讨论中", "en": "No carbon pricing; carbon market legislation under discussion"},
    "ar": {"ets": False, "tax": True, "price": 5, "coverage": 20,
           "zh": "液体燃料碳税（内部碳税），覆盖部分化石燃料", "en": "Carbon tax on liquid fuels, covering part of fossil fuel consumption"},
    "co": {"ets": False, "tax": True, "price": 5, "coverage": 24,
           "zh": "碳税约25,000比索/吨CO₂(约$5)，覆盖化石燃料", "en": "Carbon tax ~COP25,000/tCO₂ (~$5), covering fossil fuels"},
    "th": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳信用交易所2023年启动；强制碳定价研究中", "en": "Carbon credit exchange launched 2023; mandatory carbon pricing under study"},
    "nl": {"ets": True, "tax": True, "price": 85, "coverage": 50,
           "zh": "EU ETS + 国内最低碳价机制，确保碳价不低于一定水平", "en": "EU ETS + domestic minimum carbon price floor mechanism"},
    "tr": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳排放交易体系筹备中，预计与EU ETS对接", "en": "ETS under preparation, expected to link with EU ETS"},
    "dk": {"ets": True, "tax": True, "price": 100, "coverage": 45,
           "zh": "EU ETS + 国内碳税约750丹麦克朗/吨(约$100)，2030年大幅提高", "en": "EU ETS + domestic carbon tax ~DKK750/t (~$100), rising sharply by 2030"},
    "fi": {"ets": True, "tax": True, "price": 85, "coverage": 50,
           "zh": "EU ETS + 国内碳税覆盖交通和供暖燃料", "en": "EU ETS + domestic carbon tax covering transport and heating fuels"},
    "ch": {"ets": True, "tax": True, "price": 120, "coverage": 35,
           "zh": "瑞士碳排放交易体系与EU ETS链接；碳税120瑞郎/吨覆盖供暖燃料", "en": "Swiss ETS linked to EU ETS; carbon levy CHF120/t on heating fuels"},
    "at": {"ets": True, "tax": True, "price": 85, "coverage": 45,
           "zh": "EU ETS + 2022年启动国内碳排放交易(交通建筑)，起步价30欧元/吨", "en": "EU ETS + national ETS for transport/buildings since 2022, starting at €30/t"},
    "pt": {"ets": True, "tax": False, "price": 85, "coverage": 35,
           "zh": "参与EU ETS，覆盖电力和工业部门", "en": "Participates in EU ETS covering power and industrial sectors"},
    "il": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳交易体系和碳税方案评估中", "en": "ETS and carbon tax options under evaluation"},
    "ae": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳信用抵消框架建立中；Abu Dhabi碳交易所筹备", "en": "Carbon offset framework under development; Abu Dhabi carbon exchange planned"},
    "my": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "自愿碳市场(BCX交易所)2022年启动；强制机制研究中", "en": "Voluntary carbon market (BCX exchange) launched 2022; mandatory mechanism under study"},
    "vn": {"ets": True, "tax": False, "price": None, "coverage": 0,
           "zh": "碳交易试点2025年启动，2028年全面运行", "en": "ETS pilot launching 2025, fully operational by 2028"},
    "ph": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳定价机制研究阶段", "en": "Carbon pricing mechanism under study"},
    "cl": {"ets": False, "tax": True, "price": 5, "coverage": 39,
           "zh": "碳税$5/吨CO₂覆盖大型排放源；绿色税收改革推进中", "en": "Carbon tax $5/tCO₂ on large emitters; green tax reform in progress"},
    "pe": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳定价机制评估阶段", "en": "Carbon pricing under evaluation"},
    "ma": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳市场研究阶段；参与Article 6合作框架", "en": "Carbon market under study; participates in Article 6 cooperation"},
    "gh": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳定价机制评估阶段；参与自愿碳市场", "en": "Carbon pricing under evaluation; participates in voluntary carbon market"},
    "cr": {"ets": False, "tax": True, "price": 10, "coverage": 30,
           "zh": "燃料碳税约3.5%；国家脱碳计划配套碳定价", "en": "Fuel carbon tax ~3.5%; carbon pricing aligned with national decarbonization plan"},
    "pl": {"ets": True, "tax": False, "price": 85, "coverage": 45,
           "zh": "参与EU ETS，覆盖电力和工业部门；煤炭转型基金支持", "en": "Participates in EU ETS; supported by Just Transition Fund for coal phase-out"},
    "fj": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "作为小岛国推动国际碳定价倡议", "en": "As a SIDS, advocates for international carbon pricing initiatives"},
    "et": {"ets": False, "tax": False, "price": None, "coverage": 0,
           "zh": "碳市场机制研究阶段", "en": "Carbon market mechanism under study"},
}

# Reporting status under Paris Agreement
# BTR = Biennial Transparency Report (required by 2024 for all parties)
# NC = National Communications (periodic reporting)
REPORTING = {
    "us": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "cn": {"btr": True, "btrYear": 2024, "nc": 4, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "de": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "jp": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "fr": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "in": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "gb": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "br": {"btr": False, "btrYear": None, "nc": 4, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "au": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "za": {"btr": False, "btrYear": None, "nc": 4, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "ca": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "mx": {"btr": False, "btrYear": None, "nc": 6, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "sa": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "id": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "it": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "es": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "ru": {"btr": False, "btrYear": None, "nc": 8, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "sg": {"btr": True, "btrYear": 2024, "nc": 4, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "eg": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "kr": {"btr": True, "btrYear": 2024, "nc": 4, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "se": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "no": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "nz": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "ke": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "ng": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "ar": {"btr": False, "btrYear": None, "nc": 4, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "co": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "th": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "nl": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "tr": {"btr": False, "btrYear": None, "nc": 7, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "dk": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "fi": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "ch": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "at": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "pt": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "il": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "ae": {"btr": True, "btrYear": 2024, "nc": 4, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "my": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "vn": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "ph": {"btr": False, "btrYear": None, "nc": 2, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "cl": {"btr": True, "btrYear": 2024, "nc": 4, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "pe": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "ma": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "gh": {"btr": False, "btrYear": None, "nc": 3, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "cr": {"btr": True, "btrYear": 2024, "nc": 4, "zh": "已提交BTR1", "en": "BTR1 submitted"},
    "pl": {"btr": True, "btrYear": 2024, "nc": 8, "zh": "已提交BTR1（通过EU联合提交）", "en": "BTR1 submitted (via EU joint submission)"},
    "fj": {"btr": False, "btrYear": None, "nc": 2, "zh": "BTR1待提交", "en": "BTR1 pending"},
    "et": {"btr": False, "btrYear": None, "nc": 2, "zh": "BTR1待提交", "en": "BTR1 pending"},
}

for c in data:
    iso = c.get("isoCode", "")

    cp = CARBON_PRICING.get(iso)
    if cp:
        c["carbonPricing"] = {
            "hasETS": cp["ets"],
            "hasCarbonTax": cp["tax"],
            "priceUSD": cp["price"],
            "coveragePercent": cp["coverage"],
            "noteZh": cp["zh"],
            "noteEn": cp["en"]
        }

    rp = REPORTING.get(iso)
    if rp:
        c["reportingStatus"] = {
            "btrSubmitted": rp["btr"],
            "btrYear": rp["btrYear"],
            "nationalComm": rp["nc"],
            "statusZh": rp["zh"],
            "statusEn": rp["en"]
        }

with open("public/countries.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

has_cp = sum(1 for c in data if "carbonPricing" in c)
has_rp = sum(1 for c in data if "reportingStatus" in c)
has_price = sum(1 for c in data if c.get("carbonPricing", {}).get("priceUSD") is not None)
btr_done = sum(1 for c in data if c.get("reportingStatus", {}).get("btrSubmitted"))
print(f"Done: {has_cp}/48 carbon pricing, {has_rp}/48 reporting status")
print(f"  With active carbon price: {has_price}")
print(f"  BTR submitted: {btr_done}")
