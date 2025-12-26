// app.js - FINAL v2025-01-27-REV3
// 如果你看到這行版本號，代表你真的載入了最新版
// 功能：
// - CWA 縣市資料（MinT / MaxT）
// - 明天 / 後天 / 大後天（N+1 / N+2 / N+3）
// - 多城市比較
// - 已綁定 Worker
alert("DEBUG: app.js loaded v-final");
console.log("LOAD app.js FINAL v2025-01-27-REV3");

const WORKER_BASE = "https://wheather.bryanliu-cs.workers.dev";

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

function sameDay(a,b){
  return a.getFullYear()===b.getFullYear()
      && a.getMonth()===b.getMonth()
      && a.getDate()===b.getDate();
}

function getWeatherElements(data){
  if (data?.records?.locations?.[0]?.location?.[0]?.weatherElement) {
    return data.records.locations[0].location[0].weatherElement;
  }
  if (data?.records?.location?.[0]?.weatherElement) {
    return data.records.location[0].weatherElement;
  }
  return null;
}

function tempRangeForDay(weatherElements, targetDate){
  if(!weatherElements) return "—";

  const minT = weatherElements.find(e =>
    e.elementName === "MinT" || e.elementName === "MinTemperature"
  );
  const maxT = weatherElements.find(e =>
    e.elementName === "MaxT" || e.elementName === "MaxTemperature"
  );

  if(!minT || !maxT) return "—";

  const min = minT.time.find(t =>
    sameDay(new Date(t.startTime), targetDate)
  )?.elementValue?.[0]?.value;

  const max = maxT.time.find(t =>
    sameDay(new Date(t.startTime), targetDate)
  )?.elementValue?.[0]?.value;

  if(min == null || max == null) return "—";

  return `${Math.round(Number(min))} ~ ${Math.round(Number(max))}`;
}


async function load(){
  const cities = document.getElementById("cities").value
    .split(/\n|,/)
    .map(s => s.trim())
    .filter(Boolean);

  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  const days = [dayPlus(1), dayPlus(2), dayPlus(3)];

  for(const d of days){
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>📅 ${formatDate(d)}</h3>`;

    for(const city of cities){
      let text = "—";
      try{
        const res = await fetch(`${WORKER_BASE}/cwa?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        const elements = getWeatherElements(data);
        text = tempRangeForDay(elements, d);
      }catch(e){
        text = "查詢失敗";
      }

      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${city}</div><div>🌡 ${text}°C</div>`;
      card.appendChild(row);
    }
    cards.appendChild(card);
  }
}

document.getElementById("queryBtn")?.addEventListener("click", load);

// auto load once
load();
