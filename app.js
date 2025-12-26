const WORKER_BASE = "https://wheather.bryanliu-cs.workers.dev";

const PERIOD_HOURS = {
  morning: [6,7,8,9,10,11],
  afternoon: [12,13,14,15,16,17],
  night: [18,19,20,21,22,23]
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
  return d;
}

function formatDate(d) {
  const w = ["日","一","二","三","四","五","六"][d.getDay()];
  return `${d.getMonth()+1}/${d.getDate()}（${w}）`;
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

  const days = [dayPlus(2), dayPlus(3), dayPlus(4)];

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

        const loc = data.records.location[0];
        const temp = loc.weatherElement
          .find(e => e.elementName === "T")
          ?.time[0]?.elementValue[0]?.value ?? "—";

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
