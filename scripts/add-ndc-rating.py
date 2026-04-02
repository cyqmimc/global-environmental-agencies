import json

with open("public/countries.json", "r") as f:
    data = json.load(f)

# NDC ambition ratings based on Climate Action Tracker and independent assessments
# Ratings: "1.5C" (1.5°C compatible), "2C" (2°C compatible),
#          "insufficient" (不足), "highly_insufficient" (严重不足),
#          "critically_insufficient" (极度不足), "almost_sufficient" (接近充分),
#          "not_assessed" (未评估)
#
# NDC history: major submission milestones
# nextNdcDeadline: 2025 is the universal deadline for updated NDCs under Paris Agreement

NDC_DATA = {
    "us": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "NDC 2.0", "year": 2021}], "next": 2025},
    "cn": {"rating": "highly_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "de": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "jp": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "fr": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "in": {"rating": "2C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "gb": {"rating": "almost_sufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "NDC", "year": 2020}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "br": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "au": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "za": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "ca": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "mx": {"rating": "highly_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "sa": {"rating": "critically_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "id": {"rating": "highly_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}, {"version": "Enhanced NDC", "year": 2022}], "next": 2025},
    "it": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "es": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "ru": {"rating": "critically_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "sg": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "eg": {"rating": "2C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "kr": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "se": {"rating": "almost_sufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "no": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}, {"version": "Enhanced NDC", "year": 2022}], "next": 2025},
    "nz": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "ke": {"rating": "1.5C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "ng": {"rating": "2C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "ar": {"rating": "highly_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "co": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "th": {"rating": "critically_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "nl": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "tr": {"rating": "critically_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "NDC", "year": 2023}], "next": 2025},
    "dk": {"rating": "almost_sufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "fi": {"rating": "almost_sufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "ch": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "at": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "pt": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "il": {"rating": "not_assessed", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "ae": {"rating": "highly_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}, {"version": "NDC 3.0", "year": 2023}], "next": 2025},
    "my": {"rating": "highly_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "vn": {"rating": "critically_insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2022}], "next": 2025},
    "ph": {"rating": "2C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "cl": {"rating": "almost_sufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "pe": {"rating": "insufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "ma": {"rating": "almost_sufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "gh": {"rating": "2C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "cr": {"rating": "1.5C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2020}], "next": 2025},
    "pl": {"rating": "insufficient", "history": [{"version": "EU NDC", "year": 2015}, {"version": "EU Updated NDC", "year": 2020}], "next": 2025},
    "fj": {"rating": "almost_sufficient", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
    "et": {"rating": "1.5C", "history": [{"version": "INDC", "year": 2015}, {"version": "Updated NDC", "year": 2021}], "next": 2025},
}

for c in data:
    iso = c.get("isoCode", "")
    nd = NDC_DATA.get(iso)
    if nd:
        c["parisAgreement"]["ndcRating"] = nd["rating"]
        c["parisAgreement"]["ndcHistory"] = nd["history"]
        c["parisAgreement"]["nextNdcDeadline"] = nd["next"]

with open("public/countries.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Stats
from collections import Counter
ratings = Counter(NDC_DATA[k]["rating"] for k in NDC_DATA)
print(f"Done: {len(NDC_DATA)}/48 countries updated")
print("Rating distribution:")
for r, n in ratings.most_common():
    print(f"  {r}: {n}")
