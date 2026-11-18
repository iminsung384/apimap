module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "지원하지 않는 요청이에요." });
  }

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 2 || query.length > 200) {
    return res.status(400).json({ error: "검색어는 2자 이상 200자 이하로 입력해 주세요." });
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const site = `${protocol}://${host}`;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("accept-language", "ko");

    const response = await fetch(url, {
      headers: {
        "User-Agent": `apimap-distance/1.0 (Vercel; ${site})`,
        "Referer": `${site}/`
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      console.error("Nominatim request failed:", response.status);
      return res.status(502).json({ error: "장소 검색 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." });
    }

    const results = await response.json();
    return res.status(200).json(results.map((place) => ({
      lat: place.lat,
      lon: place.lon,
      name: place.name || "",
      display_name: place.display_name
    })));
  } catch (error) {
    console.error("Nominatim request error:", error);
    return res.status(502).json({ error: "장소 검색 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요." });
  }
};
