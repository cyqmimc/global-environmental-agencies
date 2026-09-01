import { ImageResponse } from "@vercel/og";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const NDC_LABELS = {
	"1.5C": {
		text: "1.5°C",
		color: "#16a34a"
	},
	"2C": {
		text: "2°C",
		color: "#65a30d"
	},
	almost_sufficient: {
		text: "Almost Sufficient",
		color: "#eab308"
	},
	insufficient: {
		text: "Insufficient",
		color: "#f97316"
	},
	highly_insufficient: {
		text: "Highly Insufficient",
		color: "#dc2626"
	},
	critically_insufficient: {
		text: "Critical",
		color: "#991b1b"
	},
	not_assessed: {
		text: "N/A",
		color: "#9ca3af"
	}
};
export async function GET(req) {
	const getHeader = (name) => req.headers?.get?.(name) ?? req.headers?.[name];
	const host = getHeader("x-forwarded-host") ?? getHeader("host") ?? "global-env-tracker.vercel.app";
	const protocol = getHeader("x-forwarded-proto") ?? "https";
	const requestUrl = new URL(req.url, `${protocol}://${host}`);
	const { searchParams } = requestUrl;
	const iso = searchParams.get("country")?.toLowerCase();
	if (!iso) {
		return new ImageResponse(defaultImage(), {
			width: 1200,
			height: 630
		});
	}
	// Fetch country data
	const baseUrl = requestUrl.origin;
	let data;
	try {
		const res = await fetch(`${baseUrl}/og-data.json`);
		const all = await res.json();
		data = all[iso];
	} catch {
		return new ImageResponse(defaultImage(), {
			width: 1200,
			height: 630
		});
	}
	if (!data) {
		return new ImageResponse(defaultImage(), {
			width: 1200,
			height: 630
		});
	}
	const ndc = NDC_LABELS[data.ndc] || NDC_LABELS.not_assessed;
	return new ImageResponse(/* @__PURE__ */ _jsxs("div", {
		style: {
			width: "100%",
			height: "100%",
			display: "flex",
			flexDirection: "column",
			backgroundColor: "#f0fdf4",
			fontFamily: "sans-serif"
		},
		children: [
			/* @__PURE__ */ _jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					padding: "40px 60px",
					background: "linear-gradient(135deg, #15803d, #059669)",
					color: "white",
					gap: "24px"
				},
				children: [
					/* @__PURE__ */ _jsx("img", {
						src: `https://flagcdn.com/${iso}.svg`,
						width: 100,
						height: 67,
						style: {
							borderRadius: 8,
							objectFit: "cover",
							border: "2px solid rgba(255,255,255,0.3)"
						}
					}),
					/* @__PURE__ */ _jsxs("div", {
						style: {
							display: "flex",
							flexDirection: "column"
						},
						children: [/* @__PURE__ */ _jsx("div", {
							style: {
								fontSize: 48,
								fontWeight: 800,
								lineHeight: 1.1
							},
							children: data.en
						}), /* @__PURE__ */ _jsx("div", {
							style: {
								fontSize: 20,
								opacity: .85,
								marginTop: 4
							},
							children: data.agency
						})]
					}),
					/* @__PURE__ */ _jsxs("div", {
						style: {
							marginLeft: "auto",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							backgroundColor: "rgba(255,255,255,0.15)",
							borderRadius: 16,
							padding: "12px 24px"
						},
						children: [/* @__PURE__ */ _jsx("div", {
							style: {
								fontSize: 48,
								fontWeight: 800
							},
							children: data.epi
						}), /* @__PURE__ */ _jsx("div", {
							style: {
								fontSize: 14,
								opacity: .9
							},
							children: "EPI Score"
						})]
					})
				]
			}),
			/* @__PURE__ */ _jsx("div", {
				style: {
					display: "flex",
					padding: "32px 60px",
					gap: "20px",
					flex: 1
				},
				children: /* @__PURE__ */ _jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "16px",
						flex: 1
					},
					children: [/* @__PURE__ */ _jsxs("div", {
						style: {
							display: "flex",
							gap: "16px"
						},
						children: [
							/* @__PURE__ */ _jsx(MetricCard, {
								label: "CO₂/Capita",
								value: data.co2 != null ? `${data.co2.toFixed(1)}t` : "—",
								color: "#dc2626"
							}),
							/* @__PURE__ */ _jsx(MetricCard, {
								label: "PM2.5",
								value: data.pm25 != null ? `${data.pm25.toFixed(0)}µg` : "—",
								color: "#d97706"
							}),
							/* @__PURE__ */ _jsx(MetricCard, {
								label: "Renewable",
								value: data.renew != null ? `${data.renew.toFixed(0)}%` : "—",
								color: "#059669"
							})
						]
					}), /* @__PURE__ */ _jsxs("div", {
						style: {
							display: "flex",
							gap: "16px"
						},
						children: [
							/* @__PURE__ */ _jsx(MetricCard, {
								label: "Forest",
								value: data.forest != null ? `${data.forest.toFixed(0)}%` : "—",
								color: "#16a34a"
							}),
							/* @__PURE__ */ _jsx(MetricCard, {
								label: "Carbon Price",
								value: data.carbon != null ? `$${data.carbon}` : "None",
								color: "#7c3aed"
							}),
							/* @__PURE__ */ _jsxs("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									backgroundColor: "white",
									borderRadius: 12,
									padding: "12px 16px",
									flex: 1,
									border: `2px solid ${ndc.color}`
								},
								children: [/* @__PURE__ */ _jsx("div", {
									style: {
										fontSize: 18,
										fontWeight: 700,
										color: ndc.color
									},
									children: ndc.text
								}), /* @__PURE__ */ _jsx("div", {
									style: {
										fontSize: 12,
										color: "#6b7280",
										marginTop: 2
									},
									children: "NDC Rating"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ _jsxs("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					padding: "16px 60px",
					backgroundColor: "#f8fafc",
					borderTop: "1px solid #e5e7eb",
					fontSize: 14,
					color: "#9ca3af"
				},
				children: [/* @__PURE__ */ _jsx("div", { children: "🌍 Global Environmental Governance Tracker" }), /* @__PURE__ */ _jsx("div", { children: data.region })]
			})
		]
	}), {
		width: 1200,
		height: 630
	});
}
export const HEAD = GET;
function MetricCard({ label, value, color }) {
	return /* @__PURE__ */ _jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: "white",
			borderRadius: 12,
			padding: "12px 16px",
			flex: 1,
			borderLeft: `4px solid ${color}`
		},
		children: [/* @__PURE__ */ _jsx("div", {
			style: {
				fontSize: 28,
				fontWeight: 700,
				color
			},
			children: value
		}), /* @__PURE__ */ _jsx("div", {
			style: {
				fontSize: 12,
				color: "#6b7280",
				marginTop: 2
			},
			children: label
		})]
	});
}
function defaultImage() {
	return /* @__PURE__ */ _jsxs("div", {
		style: {
			width: "100%",
			height: "100%",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			background: "linear-gradient(135deg, #15803d, #059669)",
			color: "white",
			fontFamily: "sans-serif"
		},
		children: [
			/* @__PURE__ */ _jsx("div", {
				style: {
					fontSize: 72,
					marginBottom: 16
				},
				children: "🌍"
			}),
			/* @__PURE__ */ _jsx("div", {
				style: {
					fontSize: 48,
					fontWeight: 800
				},
				children: "Global Environmental"
			}),
			/* @__PURE__ */ _jsx("div", {
				style: {
					fontSize: 48,
					fontWeight: 800
				},
				children: "Governance Tracker"
			}),
			/* @__PURE__ */ _jsx("div", {
				style: {
					fontSize: 24,
					opacity: .8,
					marginTop: 16
				},
				children: "80 Countries · Environmental Data · Treaty Compliance"
			})
		]
	});
}
