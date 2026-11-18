const places = {
  origin: null,
  destination: null
};

let geocodeQueue = Promise.resolve();
let lastGeocodeRequestAt = 0;
const formMessage = document.querySelector("#form-message");
const measureButton = document.querySelector("#measure-button");
const distanceCard = document.querySelector("#distance-card");

function showMessage(message) {
  formMessage.textContent = message;
}

function clearResult() {
  distanceCard.hidden = true;
}

function waitForGeocodeSlot() {
  const slot = geocodeQueue.then(async () => {
    const delay = Math.max(0, 1100 - (Date.now() - lastGeocodeRequestAt));
    if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
    lastGeocodeRequestAt = Date.now();
  });
  geocodeQueue = slot.catch(() => {});
  return slot;
}

async function searchPlaces(key) {
  const input = document.querySelector(`#${key}-input`);
  const results = document.querySelector(`#${key}-results`);
  const selected = document.querySelector(`#${key}-selected`);
  const button = document.querySelector(`[data-search="${key}"]`);
  const query = input.value.trim();

  if (query.length < 2) {
    showMessage("장소 이름을 두 글자 이상 입력해 주세요.");
    input.focus();
    return;
  }

  button.disabled = true;
  results.replaceChildren();
  selected.textContent = "";
  places[key] = null;
  clearResult();
  showMessage("장소를 검색하고 있어요.");

  try {
    await waitForGeocodeSlot();
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "장소를 검색하지 못했어요.");
    if (input.value.trim() !== query) return;

    if (!data.length) {
      showMessage("검색 결과가 없어요. 다른 이름으로 검색해 주세요.");
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const place of data) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "place-option";
      option.textContent = place.name || place.display_name;
      const details = document.createElement("small");
      details.textContent = place.display_name;
      option.append(details);
      option.addEventListener("click", () => {
        places[key] = place;
        input.value = place.name || place.display_name;
        results.replaceChildren();
        selected.textContent = `선택됨 · ${place.display_name}`;
        showMessage("");
        clearResult();
      });
      fragment.append(option);
    }
    results.append(fragment);
    showMessage("정확한 위치를 선택해 주세요.");
  } catch (error) {
    showMessage(error.message || "장소 검색 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
  } finally {
    button.disabled = false;
  }
}

for (const key of ["origin", "destination"]) {
  document.querySelector(`[data-search="${key}"]`).addEventListener("click", () => searchPlaces(key));
  document.querySelector(`#${key}-input`).addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchPlaces(key);
  });
  document.querySelector(`#${key}-input`).addEventListener("input", () => {
    places[key] = null;
    document.querySelector(`#${key}-results`).replaceChildren();
    document.querySelector(`#${key}-selected`).textContent = "";
    clearResult();
    showMessage("");
  });
}

measureButton.addEventListener("click", async () => {
  if (!places.origin || !places.destination) {
    showMessage("출발지와 도착지를 검색한 뒤 결과에서 선택해 주세요.");
    return;
  }

  measureButton.disabled = true;
  showMessage("경로 거리를 계산하고 있어요.");
  clearResult();
  try {
    const params = new URLSearchParams({
      fromLat: places.origin.lat,
      fromLon: places.origin.lon,
      toLat: places.destination.lat,
      toLon: places.destination.lon
    });
    const response = await fetch(`/api/route?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "경로를 찾지 못했어요.");

    document.querySelector("#distance-value").textContent = new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 1
    }).format(data.distanceKm);
    const route = `${places.origin.lat},${places.origin.lon};${places.destination.lat},${places.destination.lon}`;
    const mapUrl = new URL("https://www.openstreetmap.org/directions");
    mapUrl.searchParams.set("engine", "fossgis_osrm_car");
    mapUrl.searchParams.set("route", route);
    const mapLink = document.querySelector("#map-link");
    mapLink.href = mapUrl.toString();
    distanceCard.hidden = false;
    showMessage("");
  } catch (error) {
    showMessage(error.message || "경로 계산 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
  } finally {
    measureButton.disabled = false;
  }
});
