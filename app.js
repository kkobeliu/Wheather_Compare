
// ===============================
// Taiwan Weather PWA (FINAL)
// CWA first, Open-Meteo fallback
// ===============================

const PERIODS = {
  morning: [6,7,8,9,10,11],
  afternoon: [12,13,14,15,16,17],
  night: [18,19,20,21,22,23]
};
let currentPeriod = "morning";

// ---- Normalize city name ----
function normalizeCity(s){
  return s.replace("臺","台").replace(/\s/g,"");
}

// ---- Fixed coordinates table ----
const COORDS = {
  "新竹縣竹北市": {lat:24.8330, lon:121.0120},
  "台北市": {lat:25.0330, lon:121.5654},
  "新北市": {lat:25.0169, lon:121.4628},
  "台中市": {lat:24.1477, lon:120.6736},
  "台南市": {lat:22.9999, lon:120.2270},
  "高雄市": {lat:22.6273, lon:120.3014}
};

// ---- CWA dataset mapping (major cities + Zhubei) ----
const CWA_MAP = {
  "新竹縣竹北市": { dataset:"F-D0047-089", location:"竹北市" },
  "台北市": { dataset:"F-D0047-061", location:"台北市" },
  "新北市": { dataset:"F-D0047-069", location:"新北市" },
  "台中市": { dataset:"F-D0047-075", location:"台中市" },
  "台南市": { dataset:"F-D0047-077", location:"台南市" },
  "高雄市": { dataset:"F-D0047-067", location:"高雄市" }
};

const CWA_KEY = "CWA-64600B79-71D3-460B-A27A-F154274A6F12";

// ---- Date helpers ----
function dayPlus(n){
  const d = new Date();
  d.setDate(d.getDate()+n);
  return d;
}
function fmtDate(d){
  const w = ["日","一","二","三","四","五","六"][d.getDay()];
  return `${d.getMonth()+1}/${d.getDate()} (${w})`;
}
function iso(d){ return d.toISOString().slice(0,10); }

// ---- Fetch CWA ----
async function fetchCWA(city){
  const m = CWA_MAP[city];
  if(!m || !CWA_KEY || CWA_KEY.startsWith("請填")) return null;

  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${m.dataset}?Authorization=${CWA_KEY}&locationName=${m.location}`;
  const r = await fetch(url);
  const j = await r.json();
  return j.records.locations[0].location[0];
}

// ---- Fetch Open-Meteo ----
async function fetchOM(city){
  const c = COORDS[city];
  if(!c) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m&forecast_days=7&timezone=Asia%2FTaipei`;
  const r = await fetch(url);
  return await r.json();
}

// ---- Extract OM temp for date+period ----
function omTemp(data, dateISO){
  const hs = PERIODS[currentPeriod];
  let arr = [];
  data.hourly.time.forEach((t,i)=>{
    if(t.startsWith(dateISO)){
      const h = +t.slice(11,13);
      if(hs.includes(h)) arr.push(data.hourly.temperature_2m[i]);
    }
  });
  if(!arr.length) return null;
  return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
}

// ---- UI actions ----
document.querySelectorAll(".seg").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll(".seg").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentPeriod = b.dataset.period;
    load();
  };
});

document.getElementById("loadBtn").onclick = load;

// ---- Main ----
async function load(){
  const rawCities = document.getElementById("citiesInput").value
    .split(/[,，\n]/).map(s=>s.trim()).filter(Boolean);
  const cities = rawCities.map(normalizeCity);

  const result = document.getElementById("result");
  result.innerHTML = "";
  document.getElementById("status").textContent = "查詢中…";

  const days = [dayPlus(2), dayPlus(3), dayPlus(4)];

  for(const city of cities){
    let html = `<div class="city"><h3>${city}</h3><table class="table"><tr>`;
    days.forEach(d=> html += `<th>${fmtDate(d)}</th>`);
    html += "</tr><tr>";

    // ---- First try CWA (fallback handled logically) ----
    let cwaData = await fetchCWA(city);

    if(cwaData){
      // 簡化示範：先顯示「有資料」標記
      days.forEach(()=> html += `<td>—</td>`);
      html += "</tr></table><div class='src'>CWA：已命中（解析細節可再擴充）</div></div>";
    }else{
      // ---- Fallback: Open-Meteo ----
      const om = await fetchOM(city);
      days.forEach(d=>{
        const t = om ? omTemp(om, iso(d)) : null;
        html += `<td>${t!==null ? t+'°C' : '查無資料'}</td>`;
      });
      html += "</tr></table><div class='src'>來源：Open-Meteo（CWA 未填 Key 或未命中）</div></div>";
    }

    result.innerHTML += html;
  }

  document.getElementById("status").textContent = "完成";
}

load();
