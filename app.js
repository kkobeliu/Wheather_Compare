
const DEFAULT_CITIES = ["新竹縣竹北市"];
const PERIODS = {
  morning:[6,7,8,9,10,11],
  afternoon:[12,13,14,15,16,17],
  night:[18,19,20,21,22,23]
};
let currentPeriod = "morning";

document.getElementById("citiesInput").value = DEFAULT_CITIES.join(", ");

document.querySelectorAll(".seg").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".seg").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentPeriod = btn.dataset.period;
    loadWeather();
  };
});

function dayPlus(n){
  const d = new Date();
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}

async function geocode(city){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
  const res = await fetch(url);
  const js = await res.json();
  if(!js.results || !js.results[0]) throw city;
  return js.results[0];
}

async function loadWeather(){
  const cities = document.getElementById("citiesInput").value
    .split(/[,，\n]/).map(s=>s.trim()).filter(Boolean);

  const result = document.getElementById("result");
  result.innerHTML = "";
  document.getElementById("status").textContent = "查詢中…";

  const startDate = dayPlus(2);

  for(const city of cities){
    try{
      const g = await geocode(city);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&hourly=temperature_2m&forecast_days=5&timezone=Asia%2FTaipei`;
      const r = await fetch(url);
      const j = await r.json();

      let temps = [];
      j.hourly.time.forEach((t,i)=>{
        const h = +t.slice(11,13);
        if(t.startsWith(startDate) && PERIODS[currentPeriod].includes(h)){
          temps.push(j.hourly.temperature_2m[i]);
        }
      });

      const avg = temps.length ? Math.round(temps.reduce((a,b)=>a+b,0)/temps.length) : "—";
      result.innerHTML += `<div class="result-city"><b>${city}</b><br>${avg}°C</div>`;
    }catch(e){
      result.innerHTML += `<div class="result-city"><b>${city}</b><br>查無資料</div>`;
    }
  }

  document.getElementById("status").textContent = "完成";
}

document.getElementById("loadBtn").onclick = loadWeather;
loadWeather();
