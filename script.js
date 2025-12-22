const apiKey = "fc3317d81ce5bf274956c87e8b74c82d";

/* ELEMENTS */
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const dateEl = document.getElementById("date");
const nearbyCitiesEl = document.getElementById("nearbyCities");

const forecastStrip = document.querySelector(".forecast-strip");
const statsSpans = document.querySelectorAll(".stats-card span");

const tempCanvas = document.getElementById("tempChart");
const rainCanvas = document.getElementById("rainChart");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let tempChart, rainChart;

loadWeather("Jigani");

/* SEARCH */
searchBtn.onclick = () => {
  if (searchInput.value.trim()) {
    loadWeather(searchInput.value.trim());
  }
};

/* MAIN LOADER */
async function loadWeather(city) {
  try {
    const weather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    ).then(r => r.json());

    const forecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    ).then(r => r.json());

    updateCurrent(weather);
    updateForecastStrip(forecast.list);
    updateTempChart(forecast.list);
    updateRainChart(forecast.list);
    fetchNearbyCities(weather.coord.lat, weather.coord.lon);

  } catch {
    alert("City not found");
  }
}

/* CURRENT WEATHER */
function updateCurrent(d) {
  cityNameEl.textContent = `📍 ${d.name}`;
  tempEl.textContent = `${d.main.temp.toFixed(1)}°C`;
  descEl.textContent = d.weather[0].description;
  dateEl.textContent = new Date().toDateString();

  statsSpans[0].textContent = `${d.main.humidity}%`;
  statsSpans[1].textContent = `${d.wind.speed} km/h`;
  statsSpans[2].textContent = `${(d.visibility / 1000).toFixed(1)} km`;
  statsSpans[3].textContent = d.main.pressure;

  sunriseTime.textContent = formatTime(d.sys.sunrise);
  sunsetTime.textContent = formatTime(d.sys.sunset);
}

/* 🌍 NEARBY CITIES */
async function fetchNearbyCities(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=4&units=metric&appid=${apiKey}`
  );
  const data = await res.json();

  nearbyCitiesEl.innerHTML = "";

  data.list.slice(1, 4).forEach(city => {
    nearbyCitiesEl.innerHTML += `
      <div class="nearby-city">
        <span>${city.name}</span>
        <strong>${Math.round(city.main.temp)}°C</strong>
      </div>
    `;
  });
}

/* FORECAST STRIP */
function updateForecastStrip(list) {
  forecastStrip.innerHTML = "";

  const daily = {};

  // Pick 12:00 PM forecast for each day
  list.forEach(item => {
    if (item.dt_txt.includes("12:00:00")) {
      const day = item.dt_txt.split(" ")[0];
      daily[day] = item;
    }
  });

  Object.values(daily).slice(0, 6).forEach(d => {
    const dayName = new Date(d.dt_txt).toLocaleDateString("en-US", {
      weekday: "short"
    });

    forecastStrip.innerHTML += `
      <div class="day">
        <div>${dayName}</div>
        <img 
          src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png"
          alt="icon"
          style="width:32px;height:32px"
        />
        <div>${Math.round(d.main.temp)}°</div>
      </div>
    `;
  });
}


/* WEATHER FORECAST CURVE */
function updateTempChart(list) {
  const labels = [], temps = [];
  const days = {};

  list.forEach(i => {
    const date = i.dt_txt.split(" ")[0];
    if (!days[date]) days[date] = i;
  });

  Object.values(days).slice(0, 7).forEach(d => {
    labels.push(new Date(d.dt_txt).toLocaleDateString("en",{weekday:"short"}));
    temps.push(d.main.temp);
  });

  if (tempChart) tempChart.destroy();

  tempChart = new Chart(tempCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: temps,
        borderColor: "#ff9f43",
        borderWidth: 3,
        tension: 0.45,
        pointRadius: 4,
        fill: false
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#bbb" } },
        y: { display: false }
      }
    }
  });
}

/* 🌧 RAIN PREDICTION (TOP RIGHT) */
function updateRainChart(list) {
  const labels = [], rain = [];

  list.slice(0, 6).forEach(i => {
    labels.push(i.dt_txt.split(" ")[1].slice(0,5));
    rain.push(Math.round((i.pop || 0) * 100));
  });

  if (rainChart) rainChart.destroy();

  rainChart = new Chart(rainCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: rain,
        backgroundColor: "#4fc3f7",
        borderRadius: 6,
        barThickness: 10
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          max: 100,
          ticks: { callback: v => v + "%" }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

/* UTIL */
function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
