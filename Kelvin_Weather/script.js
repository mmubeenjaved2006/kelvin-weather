
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");

const locationName = document.getElementById("locationName");
const statusMessage = document.getElementById("statusMessage");

const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weatherIcon");
const weatherDescription =
  document.getElementById("weatherDescription");

const feelsLike = document.getElementById("feelsLike");
const highTemp = document.getElementById("highTemp");
const lowTemp = document.getElementById("lowTemp");
const updatedTime = document.getElementById("updatedTime");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const precipitation =
  document.getElementById("precipitation");
const uvIndex = document.getElementById("uvIndex");

const forecastContainer =
  document.getElementById("forecastContainer");

const unitButtons = document.querySelectorAll(".unit");

// DEFAULT SETTINGS

const DEFAULT_CITY = "Lahore";
let selectedUnit = "C";

let weatherData = null;
let currentLocation = null;
let requestId = 0;

// WEATHER CODES

function getWeatherInfo(code, isDay = true) {
  const codes = {
    0: ["Clear sky", isDay ? "☀️" : "🌙"],
    1: ["Mainly clear", isDay ? "🌤️" : "🌙"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Moderate drizzle", "🌧️"],
    55: ["Dense drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"],
    57: ["Dense freezing drizzle", "🌧️"],
    61: ["Slight rain", "🌧️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Slight snow", "🌨️"],
    73: ["Moderate snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "❄️"],
    80: ["Slight rain showers", "🌦️"],
    81: ["Moderate rain showers", "🌧️"],
    82: ["Violent rain showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Heavy thunderstorm with hail", "⛈️"]
  };

  const info = codes[code] || ["Unknown", "☁️"];

  return {
    description: info[0],
    icon: info[1]
  };
}

// TEMPERATURE CONVERSION

function convertTemperature(celsius) {
  if (
    celsius === null ||
    celsius === undefined ||
    !Number.isFinite(Number(celsius))
  ) {
    return "--";
  }

  let value;
  let symbol;

  switch (selectedUnit) {
    case "K":
      value = Number(celsius) + 273.15;
      symbol = "K";
      break;

    case "F":
      value = Number(celsius) * 9 / 5 + 32;
      symbol = "°F";
      break;

    default:
      value = Number(celsius);
      symbol = "°C";
  }

  return value.toFixed(1) + symbol;
}

// API HELPER

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Weather service is unavailable. Please try again."
    );
  }

  return response.json();
}

// SEARCH CITY

async function searchCity(city) {
  const params = new URLSearchParams({
    name: city,
    count: "10",
    language: "en",
    format: "json"
  });

  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    params.toString();

  const data = await fetchJSON(url);

  if (!data.results || data.results.length === 0) {
    throw new Error(
      "City not found. Please enter a valid city name."
    );
  }

  // Select Lahore, Pakistan by default
  if (city.toLowerCase() === "lahore") {
    return (
      data.results.find(
        item => item.country_code === "PK"
      ) || data.results[0]
    );
  }

  return data.results[0];
}

// FETCH WEATHER

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "uv_index_max"
    ].join(","),

    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
    forecast_days: "7"
  });

  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    params.toString();

  const data = await fetchJSON(url);

  if (!data.current || !data.daily) {
    throw new Error("Incomplete weather data received.");
  }

  return data;
}

// FORMAT TIME

function formatUpdatedTime(time) {
  if (!time || !time.includes("T")) {
    return "UPDATED --:--";
  }

  const clock = time.split("T")[1];
  const [hourText, minuteText] = clock.split(":");

  let hours = Number(hourText);
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return (
    "UPDATED " +
    String(hours).padStart(2, "0") +
    ":" +
    minuteText +
    " " +
    period
  );
}

// CREATE FORECAST DAY

function createForecastDay(index, daily) {
  const date = new Date(daily.time[index] + "T12:00:00");

  const dayName = index === 0
    ? "TODAY"
    : date.toLocaleDateString("en-US", {
        weekday: "short"
      }).toUpperCase();

  const info = getWeatherInfo(
    daily.weather_code[index]
  );

  const day = document.createElement("div");
  day.className = "forecast-day";

  const name = document.createElement("span");
  name.className = "day-name";
  name.textContent = dayName;

  const icon = document.createElement("span");
  icon.className = "day-icon";
  icon.textContent = info.icon;
  icon.title = info.description;

  const high = document.createElement("strong");
  high.className = "day-high";
  high.textContent = convertTemperature(
    daily.temperature_2m_max[index]
  );

  const low = document.createElement("span");
  low.className = "day-low";
  low.textContent = convertTemperature(
    daily.temperature_2m_min[index]
  );

  day.append(name, icon, high, low);

  return day;
}

// RENDER WEATHER

function renderWeather() {
  if (!weatherData || !currentLocation) return;

  const current = weatherData.current;
  const daily = weatherData.daily;

  const locationParts = [
    currentLocation.name,
    currentLocation.admin1,
    currentLocation.country
  ].filter(Boolean);

  locationName.textContent = [
    ...new Set(locationParts)
  ].join(", ");

  temperature.textContent = convertTemperature(
    current.temperature_2m
  );

  const info = getWeatherInfo(
    current.weather_code,
    current.is_day === 1
  );

  weatherIcon.textContent = info.icon;
  weatherDescription.textContent = info.description;

  feelsLike.textContent = convertTemperature(
    current.apparent_temperature
  );

  highTemp.textContent = convertTemperature(
    daily.temperature_2m_max[0]
  );

  lowTemp.textContent = convertTemperature(
    daily.temperature_2m_min[0]
  );

  humidity.textContent =
    current.relative_humidity_2m == null
      ? "--"
      : current.relative_humidity_2m + "%";

  windSpeed.textContent =
    current.wind_speed_10m == null
      ? "--"
      : current.wind_speed_10m + " km/h";

  precipitation.textContent =
    current.precipitation == null
      ? "--"
      : current.precipitation + " mm";

  const uv = daily.uv_index_max[0];

  uvIndex.textContent =
    uv == null ? "--" : Number(uv).toFixed(1);

  updatedTime.textContent = formatUpdatedTime(
    current.time
  );

  forecastContainer.replaceChildren();

  for (let i = 0; i < daily.time.length; i++) {
    const day = createForecastDay(i, daily);
    forecastContainer.appendChild(day);
  }
}

// LOAD WEATHER

async function loadWeather(city) {
  const thisRequest = ++requestId;

  statusMessage.textContent = "Loading weather...";
  searchButton.disabled = true;
  searchButton.textContent = "Loading...";

  try {
    const location = await searchCity(city);

    const data = await fetchWeather(
      location.latitude,
      location.longitude
    );

    if (thisRequest !== requestId) return;

    currentLocation = location;
    weatherData = data;

    renderWeather();

    statusMessage.textContent = "";

  } catch (error) {
    if (thisRequest !== requestId) return;

    statusMessage.textContent = error.message;
    console.error("Weather error:", error);

  } finally {
    if (thisRequest === requestId) {
      searchButton.disabled = false;
      searchButton.textContent = "Search ↗";
    }
  }
}

// SEARCH FORM

searchForm.addEventListener("submit", event => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) return;

  loadWeather(city);
});

// UNIT SWITCHER

unitButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedUnit = button.dataset.unit;

    unitButtons.forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.unit === selectedUnit
      );
    });

    renderWeather();
  });
});

// INITIALIZE

document.getElementById("footerYear").textContent =
  new Date().getFullYear();

loadWeather(DEFAULT_CITY);
