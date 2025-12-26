// app.js - 最終穩定版（CWA 縣市資料：MinT / MaxT）
// 功能：
// - 比較多個城市
// - 明天 / 後天 / 大後天（N+1 / N+2 / N+3）
// - 顯示每日最低 ~ 最高溫（一定有數字，只要 CWA 有資料）
// - 已綁定 Worker

const WORKER_BASE = "https://wheather.bryanliu-cs.workers.dev";

// ===== 工具函式 =====
function dayPlus(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
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

// 取 CWA 縣市資料的 MinT / MaxT
function tempRangeForDay(weatherElements, targetDate) {
  if (!weatherElements) return "—";

  const minT = weatherElements.find(e => e.elementName === "MinT");
  const maxT = weatherElements.find(e => e.elementName === "MaxT");
  if (!minT || !maxT) return "—";

  const min = minT.time.find(x =>
    sameDay(new Date(x.startTime), targetDate)
  )?.elementValue?.[0]?.value;

  const max = maxT.time.find(x =>
    sameDay(new Date(x.startTime), targetDate)
  )?.elementValue?.[0]?.value;

  if (min == null || max == null) return "—";

  return `${Math.round(Number(min))} ~ ${Math.round(Number(max))}`;
}

// ===== 主載入 =====
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
    card.innerHTML = `<h3>📅 ${formatDate(d)}</h3>`;

    for (const city of cities) {
      try {
        const res = await fetch(
          `${WORKER_BASE}/cwa?city=${encodeURIComponent(city)}`
        );
        const data = await res.json();

        let weatherElements = null;

        // 縣市 dataset（F-D0047-xxx）
        if (data?.records?.locations?.[0]?.location?.[0]?.weatherElement) {
          weatherElements =
            data.records.locations[0].location[0].weatherElement;
        }
        // 相容：舊鄉鎮 dataset
        else if (data?.records?.location?.[0]?.weatherElement) {
          weatherElements =
            data.records.location[0].weatherElement;
        }

        const temp = tempRangeForDay(weatherElements, d);

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

// ===== 綁定查詢按鈕（若存在） =====
const btn = document.getElementById("queryBtn");
if (btn) btn.addEventListener("click", load);

// 首次自動載入
load();
