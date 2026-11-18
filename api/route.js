module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "지원하지 않는 요청이에요." });
  }

  const coordinates = ["fromLat", "fromLon", "toLat", "toLon"].map((key) => Number(req.query[key]));
  if (coordinates.some((value) => !Number.isFinite(value) || Math.abs(value) > 180)) {
    return res.status(400).json({ error: "출발지와 도착지의 위치 정보가 올바르지 않아요." });
  }
  const [fromLat, fromLon, toLat, toLon] = coordinates;
  if (Math.abs(fromLat) > 90 || Math.abs(toLat) > 90) {
    return res.status(400).json({ error: "위도 정보가 올바르지 않아요." });
  }

  try {
    const url = new URL(
      `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}`
    );
    url.searchParams.set("overview", "false");
    url.searchParams.set("alternatives", "false");

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.error("OSRM request failed:", response.status);
      return res.status(502).json({ error: "경로 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." });
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || !data.routes.length) {
      return res.status(404).json({ error: "두 장소 사이의 자동차 경로를 찾지 못했어요." });
    }
    return res.status(200).json({ distanceKm: data.routes[0].distance / 1000 });
  } catch (error) {
    console.error("OSRM request error:", error);
    return res.status(502).json({ error: "경로 계산 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요." });
  }
};
