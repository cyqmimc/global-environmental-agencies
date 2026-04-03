import { NextResponse } from "next/server";

const BOT_UA =
  /facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|googlebot|bingbot|yandex/i;

// Minimal country name lookup (embedded to avoid fetch in middleware)
const COUNTRIES = {"us":"United States","cn":"China","de":"Germany","jp":"Japan","fr":"France","in":"India","gb":"United Kingdom","br":"Brazil","au":"Australia","za":"South Africa","ca":"Canada","mx":"Mexico","sa":"Saudi Arabia","id":"Indonesia","it":"Italy","es":"Spain","ru":"Russia","sg":"Singapore","eg":"Egypt","kr":"South Korea","se":"Sweden","no":"Norway","nz":"New Zealand","ke":"Kenya","ng":"Nigeria","ar":"Argentina","co":"Colombia","th":"Thailand","nl":"Netherlands","tr":"Turkey","dk":"Denmark","fi":"Finland","ch":"Switzerland","at":"Austria","pt":"Portugal","il":"Israel","ae":"UAE","my":"Malaysia","vn":"Vietnam","ph":"Philippines","cl":"Chile","pe":"Peru","ma":"Morocco","gh":"Ghana","cr":"Costa Rica","pl":"Poland","fj":"Fiji","et":"Ethiopia","pk":"Pakistan","bd":"Bangladesh","iq":"Iraq","ir":"Iran","kz":"Kazakhstan","ua":"Ukraine","gr":"Greece","ie":"Ireland","ro":"Romania","cz":"Czech Republic","be":"Belgium","hu":"Hungary","tz":"Tanzania","dz":"Algeria","sn":"Senegal","cd":"DR Congo","ec":"Ecuador","uy":"Uruguay","jm":"Jamaica","pg":"Papua New Guinea","lk":"Sri Lanka","np":"Nepal","mm":"Myanmar","kh":"Cambodia","mn":"Mongolia","uz":"Uzbekistan","ao":"Angola","mz":"Mozambique","ve":"Venezuela","bo":"Bolivia","cu":"Cuba","do":"Dominican Republic"};

export default function middleware(req) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country")?.toLowerCase();

  // Only intercept for bots requesting the root with ?country= param
  if (!country || !COUNTRIES[country]) return NextResponse.next();

  const ua = req.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return NextResponse.next();

  // For bots: return modified HTML with dynamic OG tags
  const name = COUNTRIES[country];
  const ogImage = `${url.origin}/api/og?country=${country}`;
  const title = `${name} - Environmental Governance Tracker`;
  const desc = `Environmental data, treaty compliance, and agency info for ${name}. EPI score, NDC rating, carbon pricing, and more.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url.href}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta http-equiv="refresh" content="0;url=${url.href}" />
</head>
<body><p>Loading ${name}...</p></body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: "/",
};
