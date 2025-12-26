// app.js - 修正版（明天 / 後天 / 大後天，依 startTime 對齊）
// 已綁定指定 Worker

const WORKER_BASE = "https://wheather.bryanliu-cs.workers.dev";

const PERIOD_HOURS = {
  morning: [6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16, 17],
  night: [18, 19, 20, 21, 22, 23]
};

let currentPeriod = "morning";

document.querySelectorAll(".controls button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".controls button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPeriod = btn.dataset.period;
    load();
  };
});

function dayPlus(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0,0,0,0);
  return d;
}

function formatDate(d) {
  const w = ["日","一","二","三","四","五","六"][d.getDay()];
  return `${d.getMonth()+1}/${d.getDate()}（${w}）`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function avgTempForDay(weatherElements, targetDate, period) {
  const t = weatherElements.find(e => e.elementName === "T");
  if (!t) return "—";

  const hours = PERIOD_HOURS[period];

  const temps = t.time
    .filter(x => {
      const d = new Date(x.startTime);
      return sameDay(d, targetDate) && hours.includes(d.getHours());
    })
    .map(x => Number(x.elementValue[0].value))
    .filter(v => !isNaN(v));

  if (temps.length === 0) return "—";

  return Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
}

async function load() {
  const cities = document
    .getElementById("cities")
    .value
    .split(/\n|,/)
    .map(s => s.trim())
    .filter(Boolean);

  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  // 明天 / 後天 / 大後天
  const days = [dayPlus(1), dayPlus(2), dayPlus(3)];

  for (const d of days) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>📅 ${formatDate(d)}｜${periodLabel()}</h3>`;

    for (const city of cities) {
      try {
        const res = await fetch(
          `${WORKER_BASE}/cwa?city=${encodeURIComponent(city)}`
        );
        const data = await res.json();

        let weatherElements = null;

        if (data.records.locations) {
          weatherElements =
            data.records.locations[0].location[0].weatherElement;
        } else if (data.records.location) {
          weatherElements =
            data.records.location[0].weatherElement;
        }

        const temp = weatherElements
          ? avgTempForDay(weatherElements, d, currentPeriod)
          : "—";

        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `<div>${city}</div><div>🌡 ${temp}°C</div>`;
        card.appendChild(row);

      } catch (e) {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `<div>${city}</div><div>查詢失敗</div>`;
        card.appendChild(row);
      }
    }

    cards.appendChild(card);
  }
}

function periodLabel() {
  return currentPeriod === "morning" ? "早上" :
         currentPeriod === "afternoon" ? "下午" : "晚上";
}

load();
