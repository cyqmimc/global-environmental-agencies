import json

with open("public/countries.json", "r") as f:
    data = json.load(f)

MONTREAL = {
    "us": {"date": "1988-04-21", "kigali": False, "zh": "已完全淘汰CFCs、哈龙等受控物质；基加利修正案尚未批准", "en": "Fully phased out CFCs, halons and other ODS; Kigali Amendment not yet ratified"},
    "cn": {"date": "1991-06-14", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；2021年批准基加利修正案，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified 2021, 80% HFC reduction by 2045"},
    "de": {"date": "1988-12-16", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "jp": {"date": "1988-09-30", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "fr": {"date": "1988-11-28", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "in": {"date": "1992-06-19", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；2023年批准基加利修正案，2047年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified 2023, 85% HFC reduction by 2047"},
    "gb": {"date": "1988-05-20", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "br": {"date": "1990-03-19", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "au": {"date": "1989-05-19", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "za": {"date": "1990-01-15", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "ca": {"date": "1988-06-30", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "mx": {"date": "1988-03-31", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "sa": {"date": "1993-03-01", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2047年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2047"},
    "id": {"date": "1992-06-26", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "it": {"date": "1988-12-16", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "es": {"date": "1988-12-16", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "ru": {"date": "1988-11-10", "kigali": False, "zh": "已完全淘汰CFCs等受控物质；基加利修正案尚未批准", "en": "Fully phased out CFCs and other ODS; Kigali Amendment not yet ratified"},
    "sg": {"date": "1989-01-05", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "eg": {"date": "1988-08-09", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "kr": {"date": "1992-02-27", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "se": {"date": "1988-06-29", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "no": {"date": "1988-06-24", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "nz": {"date": "1988-06-21", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "ke": {"date": "1988-11-09", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "ng": {"date": "1988-10-31", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "ar": {"date": "1990-09-18", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "co": {"date": "1994-07-06", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "th": {"date": "1989-07-07", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "nl": {"date": "1988-12-16", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "tr": {"date": "1991-09-20", "kigali": False, "zh": "已完全淘汰CFCs等受控物质；基加利修正案尚未批准", "en": "Fully phased out CFCs and other ODS; Kigali Amendment not yet ratified"},
    "dk": {"date": "1988-12-16", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "fi": {"date": "1988-12-16", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "ch": {"date": "1988-12-28", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "at": {"date": "1989-05-03", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "pt": {"date": "1988-10-17", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "il": {"date": "1992-06-30", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "ae": {"date": "1989-12-22", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2047年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2047"},
    "my": {"date": "1989-08-29", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "vn": {"date": "1994-01-26", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "ph": {"date": "1991-07-17", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "cl": {"date": "1990-03-26", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "pe": {"date": "1993-03-31", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "ma": {"date": "1995-01-28", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "gh": {"date": "1989-07-24", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "cr": {"date": "1991-07-30", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 80%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 80% HFC reduction by 2045"},
    "pl": {"date": "1990-07-13", "kigali": True, "zh": "已完全淘汰所有受控物质；基加利修正案已批准，2036年前削减HFCs 85%", "en": "Fully phased out all ODS; Kigali Amendment ratified, 85% HFC reduction by 2036"},
    "fj": {"date": "1989-10-23", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
    "et": {"date": "1994-10-11", "kigali": True, "zh": "已完全淘汰CFCs等受控物质；基加利修正案已批准，2045年前削减HFCs 85%", "en": "Fully phased out CFCs; Kigali Amendment ratified, 85% HFC reduction by 2045"},
}

CBD = {
    "us": {"date": "", "party": False, "zh": "美国已签署但未批准CBD；支持30x30目标，通过'美丽美国'倡议推动国内保护", "en": "US signed but not ratified CBD; supports 30x30 through 'America the Beautiful' initiative"},
    "cn": {"date": "1993-01-05", "party": True, "zh": "作为COP15主席国推动通过昆明-蒙特利尔框架；承诺2030年保护30%陆地和海洋", "en": "Presided over COP15 adopting Kunming-Montreal Framework; committed to 30x30 target"},
    "de": {"date": "1993-12-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；已将30%陆地纳入保护体系", "en": "Committed to 30x30 target; already designated 30%+ of land as protected areas"},
    "jp": {"date": "1993-05-28", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动30x30高雄心联盟", "en": "Committed to 30x30 target; promotes High Ambition Coalition for 30x30"},
    "fr": {"date": "1994-07-01", "party": True, "zh": "承诺2030年保护30%陆地和海洋；已保护约33%国土面积", "en": "Committed to 30x30; approximately 33% of national territory already protected"},
    "in": {"date": "1994-02-18", "party": True, "zh": "承诺2030年保护30%陆地和海洋；拥有全球最丰富的生物多样性之一", "en": "Committed to 30x30 target; one of the most biodiverse nations"},
    "gb": {"date": "1994-06-03", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动全球海洋保护联盟", "en": "Committed to 30x30; champions Global Ocean Alliance for marine protection"},
    "br": {"date": "1994-02-28", "party": True, "zh": "承诺2030年保护30%陆地和海洋；管理全球最大的生物多样性资源", "en": "Committed to 30x30; stewards the largest biodiversity resources globally"},
    "au": {"date": "1993-06-18", "party": True, "zh": "承诺2030年保护30%陆地和海洋；重点保护大堡礁等世界遗产", "en": "Committed to 30x30; focusing on Great Barrier Reef and World Heritage protection"},
    "za": {"date": "1995-11-02", "party": True, "zh": "承诺2030年保护30%陆地和海洋；是全球生物多样性热点地区", "en": "Committed to 30x30; one of the global biodiversity hotspots"},
    "ca": {"date": "1992-12-04", "party": True, "zh": "承诺2030年保护30%陆地和海洋；目前已保护约13%陆地和14%海洋", "en": "Committed to 30x30; currently around 13% land and 14% marine protected"},
    "mx": {"date": "1993-03-11", "party": True, "zh": "承诺2030年保护30%陆地和海洋；全球生物多样性第五大国", "en": "Committed to 30x30; fifth most biodiverse country globally"},
    "sa": {"date": "2001-10-03", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动红海珊瑚礁保护", "en": "Committed to 30x30; advancing Red Sea coral reef conservation"},
    "id": {"date": "1994-08-23", "party": True, "zh": "承诺2030年保护30%陆地和海洋；拥有全球最丰富的海洋生物多样性", "en": "Committed to 30x30; richest marine biodiversity globally"},
    "it": {"date": "1994-04-15", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动地中海海洋保护", "en": "Committed to 30x30; advancing Mediterranean marine conservation"},
    "es": {"date": "1993-12-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；欧洲生物多样性最丰富的国家之一", "en": "Committed to 30x30; one of Europe's most biodiverse nations"},
    "ru": {"date": "1995-04-05", "party": True, "zh": "承诺2030年保护30%陆地和海洋；管理全球最大面积的自然保护区", "en": "Committed to 30x30; manages largest network of nature reserves globally"},
    "sg": {"date": "1995-12-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动城市生物多样性保护", "en": "Committed to 30x30; promotes urban biodiversity conservation"},
    "eg": {"date": "1994-06-02", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护尼罗河流域和红海生态系统", "en": "Committed to 30x30; protecting Nile basin and Red Sea ecosystems"},
    "kr": {"date": "1994-10-03", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动DMZ生态走廊保护", "en": "Committed to 30x30; promoting DMZ ecological corridor conservation"},
    "se": {"date": "1993-12-16", "party": True, "zh": "承诺2030年保护30%陆地和海洋；北欧生态保护先驱", "en": "Committed to 30x30; Nordic pioneer in ecological conservation"},
    "no": {"date": "1993-07-09", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动北极生态保护", "en": "Committed to 30x30; advancing Arctic ecosystem conservation"},
    "nz": {"date": "1993-09-16", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护独特的本土物种", "en": "Committed to 30x30; protecting unique endemic species"},
    "ke": {"date": "1994-07-26", "party": True, "zh": "承诺2030年保护30%陆地和海洋；联合国环境规划署总部所在地", "en": "Committed to 30x30; hosts UNEP headquarters"},
    "ng": {"date": "1994-08-29", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护西非热带雨林", "en": "Committed to 30x30; protecting West African tropical forests"},
    "ar": {"date": "1994-11-22", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护巴塔哥尼亚和南极周边生态", "en": "Committed to 30x30; protecting Patagonian and sub-Antarctic ecosystems"},
    "co": {"date": "1994-11-28", "party": True, "zh": "承诺2030年保护30%陆地和海洋；全球生物多样性第二大国", "en": "Committed to 30x30; second most biodiverse country globally"},
    "th": {"date": "2004-01-29", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护热带雨林和海洋生态", "en": "Committed to 30x30; protecting tropical rainforests and marine ecosystems"},
    "nl": {"date": "1994-07-12", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动北海海洋保护", "en": "Committed to 30x30; advancing North Sea marine conservation"},
    "tr": {"date": "1997-02-14", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护横跨欧亚的独特生态系统", "en": "Committed to 30x30; protecting unique transcontinental ecosystems"},
    "dk": {"date": "1993-12-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动格陵兰和北极生态保护", "en": "Committed to 30x30; advancing Greenland and Arctic conservation"},
    "fi": {"date": "1994-07-27", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护北方针叶林生态", "en": "Committed to 30x30; protecting boreal forest ecosystems"},
    "ch": {"date": "1995-11-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护阿尔卑斯高山生态", "en": "Committed to 30x30; protecting Alpine mountain ecosystems"},
    "at": {"date": "1994-08-18", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护阿尔卑斯和多瑙河流域生态", "en": "Committed to 30x30; protecting Alpine and Danube basin ecosystems"},
    "pt": {"date": "1993-12-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动亚速尔群岛海洋保护", "en": "Committed to 30x30; advancing Azores marine conservation"},
    "il": {"date": "1995-08-07", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护地中海和内盖夫沙漠生态", "en": "Committed to 30x30; protecting Mediterranean coast and Negev desert ecosystems"},
    "ae": {"date": "2000-02-10", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动海湾地区海洋保护", "en": "Committed to 30x30; advancing Gulf region marine conservation"},
    "my": {"date": "1994-06-24", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护婆罗洲热带雨林", "en": "Committed to 30x30; protecting Borneo tropical rainforest"},
    "vn": {"date": "1994-11-16", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护湄公河三角洲生态", "en": "Committed to 30x30; protecting Mekong Delta ecosystems"},
    "ph": {"date": "1993-10-08", "party": True, "zh": "承诺2030年保护30%陆地和海洋；全球海洋生物多样性热点", "en": "Committed to 30x30; global marine biodiversity hotspot"},
    "cl": {"date": "1994-09-09", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护安第斯和太平洋沿岸生态", "en": "Committed to 30x30; protecting Andean and Pacific coast ecosystems"},
    "pe": {"date": "1993-06-07", "party": True, "zh": "承诺2030年保护30%陆地和海洋；亚马逊流域生物多样性热点", "en": "Committed to 30x30; Amazon basin biodiversity hotspot"},
    "ma": {"date": "1995-08-21", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护阿特拉斯山脉和撒哈拉边缘生态", "en": "Committed to 30x30; protecting Atlas Mountains and Sahara fringe ecosystems"},
    "gh": {"date": "1994-08-29", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护几内亚湾沿岸生态", "en": "Committed to 30x30; protecting Gulf of Guinea coastal ecosystems"},
    "cr": {"date": "1994-08-26", "party": True, "zh": "承诺2030年保护30%陆地和海洋；全球单位面积生物多样性最高的国家之一", "en": "Committed to 30x30; among the highest biodiversity per unit area globally"},
    "pl": {"date": "1996-01-18", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护比亚沃韦扎原始森林", "en": "Committed to 30x30; protecting Bialowieza primeval forest"},
    "fj": {"date": "1993-02-25", "party": True, "zh": "承诺2030年保护30%陆地和海洋；推动太平洋岛国海洋保护", "en": "Committed to 30x30; advancing Pacific island marine conservation"},
    "et": {"date": "1994-04-05", "party": True, "zh": "承诺2030年保护30%陆地和海洋；保护东非大裂谷生态系统", "en": "Committed to 30x30; protecting East African Rift Valley ecosystems"},
}

for c in data:
    iso = c.get("isoCode", "")
    mp = MONTREAL.get(iso)
    if mp:
        c["montrealProtocol"] = {
            "status": "ratified",
            "ratifiedDate": mp["date"],
            "kigaliAmendment": mp["kigali"],
            "commitmentZh": mp["zh"],
            "commitmentEn": mp["en"]
        }

    cb = CBD.get(iso)
    if cb:
        c["cbd"] = {
            "status": "ratified" if cb["party"] else "signed",
            "ratifiedDate": cb["date"],
            "target30x30": 30,
            "commitmentZh": cb["zh"],
            "commitmentEn": cb["en"]
        }

with open("public/countries.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

has_mp = sum(1 for c in data if "montrealProtocol" in c)
has_cbd = sum(1 for c in data if "cbd" in c)
print(f"Done: {has_mp}/48 Montreal Protocol, {has_cbd}/48 CBD")
