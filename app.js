
// CWA first, Open-Meteo second (fixed coordinates table)

const PERIOD_HOURS = {
  morning:[6,7,8,9,10,11],
  afternoon:[12,13,14,15,16,17],
  night:[18,19,20,21,22,23]
};
let currentPeriod = "morning";

// 固定座標表（鄉鎮 + 主要城市）
const COORDS = {
  "新竹縣竹北市": {lat:24.8330, lon:121.0120},
  "台北市": {lat:25.0330, lon:121.5654},
  "新北市板橋區": {lat:25.0110, lon:121.4637},
  "台中市": {lat:24.1477, lon:120.6736},
  "台南市": {lat:22.9999, lon:120.2270},
  "高雄市": {lat:22.6273, lon:120.3014},
  "桃園市": {lat:24.9937, lon:121.3010},
  "新竹市": {lat:24.8138, lon:120.9675}
};

document.querySelectorAll(".seg").forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll(".seg").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentPeriod=b.dataset.period;
    load();
  };
});

function dayPlus(n){
  const d=new Date(); d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}

// 中央氣象局（鄉鎮）- 示範使用竹北市（實務可擴充 dataset map）
async function fetchCWA(city){
  const API_KEY = "CWA-64600B79-71D3-460B-A27A-F154274A6F12";
  if(!city.includes("竹北")) return null; // 示範僅竹北市
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-089?Authorization=${API_KEY}&locationName=竹北市`;
  const r = await fetch(url);
  const j = await r.json();
  return j;
}

// Open-Meteo using fixed coords
async function fetchOpenMeteo(city){
  const c = COORDS[city];
  if(!c) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m&forecast_days=5&timezone=Asia%2FTaipei`;
  const r = await fetch(url);
  return await r.json();
}

async function load(){
  const cities = document.getElementById("citiesInput").value
    .split(/[,，\n]/).map(s=>s.trim()).filter(Boolean);

  const result = document.getElementById("result");
  result.innerHTML="";
  document.getElementById("status").textContent="查詢中…";

  const targetDate = dayPlus(2);

  for(const city of cities){
    let html = `<div class="city"><b>${city}</b>`;

    // CWA (first source)
    try{
      const cwa = await fetchCWA(city);
      if(cwa){
        html += `<div class="src">中央氣象局：可用</div>`;
      }else{
        html += `<div class="src">中央氣象局：尚未支援</div>`;
      }
    }catch{ html += `<div class="src">中央氣象局：錯誤</div>`; }

    // Open-Meteo (second source)
    try{
      const om = await fetchOpenMeteo(city);
      if(om){
        let temps=[];
        om.hourly.time.forEach((t,i)=>{
          const h=+t.slice(11,13);
          if(t.startsWith(targetDate)&&PERIOD_HOURS[currentPeriod].includes(h))
            temps.push(om.hourly.temperature_2m[i]);
        });
        const avg = temps.length?Math.round(temps.reduce((a,b)=>a+b,0)/temps.length):"—";
        html += `<div class="src">Open-Meteo：${avg}°C</div>`;
      }else{
        html += `<div class="src">Open-Meteo：無座標</div>`;
      }
    }catch{
      html += `<div class="src">Open-Meteo：錯誤</div>`;
    }

    html += `</div>`;
    result.innerHTML += html;
  }

  document.getElementById("status").textContent="完成";
}

document.getElementById("loadBtn").onclick=load;
load();
