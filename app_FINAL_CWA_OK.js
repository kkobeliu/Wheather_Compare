// app.js — FINAL STABLE (CWA City 3‑Day Forecast)
// ✔ Uses MinTemperature / MaxTemperature
// ✔ Supports WeatherDescription / Wx
// ✔ Dates: Tomorrow / Day+2 / Day+3
// ✔ Multi-city comparison, single card per day
//
// Version: FINAL-2025-OK
console.log("LOAD app.js FINAL-2025-OK");

const WORKER_BASE = "https://wheather.bryanliu-cs.workers.dev";

// ---------- date helpers ----------
function dayPlus(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0,0,0,0);
  return d;
}

function ymd(d) {
  return d.toISOString().slice(0,10);
}

function fmt(d) {
  const w = ["日","一","二","三","四","五","六"][d.getDay()];
  return `${d.getMonth()+1}/${d.getDate()}（${w}）`;
}

// ---------- CWA parsing helpers ----------
function getWeatherElements(data) {
  return data?.records?.locations?.[0]?.location?.[0]?.weatherElement || null;
}

function pickElement(elements, names) {
  return elements.find(e => names.includes(e.elementName));
}

function valueForDay(el, date) {
  if (!el?.time) return null;
  const t = el.time.find(x => x.startTime?.slice(0,10) === ymd(date));
  return t?.elementValue?.[0]?.value ?? null;
}

// ---------- main render ----------
async function load() {
  const cities = document.getElementById("cities").value
    .split(/\n|,/)
    .map(s => s.trim())
    .filter(Boolean);

  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  const days = [dayPlus(1), dayPlus(2), dayPlus(3)];

  for (const d of days) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>📅 ${fmt(d)}</h3>`;

    for (const city of cities) {
      let text = "—";
      try {
        const res = await fetch(`${WORKER_BASE}/cwa?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        const elements = getWeatherElements(data);

        if (elements) {
          const minEl = pickElement(elements, ["MinTemperature","MinT"]);
          const maxEl = pickElement(elements, ["MaxTemperature","MaxT"]);
          const wxEl  = pickElement(elements, ["WeatherDescription","Wx"]);

          const min = valueForDay(minEl, d);
          const max = valueForDay(maxEl, d);
          const wx  = valueForDay(wxEl,  d);

          if (min != null && max != null) {
            text = `${Math.round(min)} ~ ${Math.round(max)}°C` + (wx ? ` ｜ ${wx}` : "");
          }
        }
      } catch (e) {
        text = "查詢失敗";
      }

      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${city}</div><div>${text}</div>`;
      card.appendChild(row);
    }

    cards.appendChild(card);
  }
}

document.getElementById("queryBtn")?.addEventListener("click", load);
load();
