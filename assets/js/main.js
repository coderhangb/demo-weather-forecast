const key = CONFIG.WEATHER_KEY;

const form = document.getElementById("form");
const input = document.getElementById("form-input");

const day = document.getElementById("day");
const date = document.getElementById("date");

const thumbLocation = document.getElementById("thumb-location");
const thumbTemp = document.getElementById("thumb-temp");
const thumbDetailWeather = document.getElementById("thumb-detail-weather");

const infoWeather = document.getElementById("info-weather");
const infoHumidity = document.getElementById("info-humidity");
const infoWind = document.getElementById("info-wind");
const infoAir = document.getElementById("info-air");
const infoMaxTemp = document.getElementById("info-max-temp");
const infoMinTemp = document.getElementById("info-min-temp");

let userInput = "";
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

form.addEventListener("submit", async (e) => {
  if (input.value === "") {
    alert("Location can not be empty");
    return;
  }
  e.preventDefault();
  userInput = input.value;
  userInput = userInput.replaceAll(" ", "%20");
  input.value = "";

  const coordData = await getCoord(userInput);
  if (coordData.length === 0) {
    alert("The city doesn't exist");
    return;
  }
  const { name: location, lat, lon } = coordData[0];
  const weatherData = await getWeather(lat, lon);
  const forecastData = await getForecastList(lat, lon);

  render(location, weatherData, forecastData);
});

function render(location, weatherData, forecastData) {
  const formattedDate = getFormattedDate();
  day.innerText = formattedDate.day;
  date.innerText = formattedDate.date;

  thumbLocation.innerText = location;
  thumbTemp.innerText = `${weatherData.main.temp} °C`;
  const detailWeather = Array.from(weatherData.weather[0].description);
  detailWeather[0] = detailWeather[0].toUpperCase();
  thumbDetailWeather.innerText = detailWeather.join("");

  infoWeather.innerText = weatherData.weather[0].main;
  infoHumidity.innerText = `${weatherData.main.humidity} %`;
  infoWind.innerText = `${weatherData.wind.speed} km/h`;
  infoAir.innerText = `${weatherData.main.pressure} mb`;
  infoMaxTemp.innerText = `${weatherData.main.temp_max} °C`;
  infoMinTemp.innerText = `${weatherData.main.temp_min} °C`;

  renderForecast(forecastData);
}

function renderForecast(forecastData) {
  const now = new Date();
  for (let i = 0; i < forecastData.length; i++) {
    const forecastThumb = document.getElementById(`forecast-thumb-${i + 1}`);
    const forecastDay = document.getElementById(`forecast-day-${i + 1}`);
    const forecastTemp = document.getElementById(`forecast-temp-${i + 1}`);

    forecastThumb.src = `https://openweathermap.org/img/wn/${getIconCode(
      forecastData,
      i
    )}.png`;
    forecastDay.innerText = days[(now.getDay() + i + 1) % 7];
    forecastTemp.innerText = `${Math.round(forecastData[i].res.main.temp)} °`;
  }
}

function getFormattedDate() {
  const current = new Date();
  const dayOfMonth = current.getDate();
  let currentDate = `${months[current.getMonth()]} ${dayOfMonth}`;
  if (dayOfMonth >= 11 && dayOfMonth <= 13) {
    currentDate = currentDate.concat("th");
  } else if (dayOfMonth % 10 === 1) {
    currentDate = currentDate.concat("st");
  } else if (dayOfMonth % 10 === 2) {
    currentDate = currentDate.concat("nd");
  } else if (dayOfMonth % 10 === 3) {
    currentDate = currentDate.concat("rd");
  } else {
    currentDate = currentDate.concat("th");
  }
  return {
    day: days[current.getDay()],
    date: currentDate,
  };
}

function normalizeForecast(arr) {
  if (arr.length === 6) {
    return arr.slice(1);
  }
  return arr;
}

function getIconCode(forecastData, index) {
  let iconCode = forecastData[index].res.weather[0].icon;
  iconCode = iconCode.replace("n", "d");
  return iconCode;
}

async function getCoord(location) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${location}&appid=${key}`
    );
    if (res.status === 200) {
      const data = await res.json();
      return data;
    } else {
      alert(`Error: `, res.status);
    }
  } catch (error) {
    console.error(`Error: `, error);
    alert("Error");
  }
}

async function getWeather(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );
    if (res.status === 200) {
      const data = await res.json();
      return data;
    } else {
      alert(`Error: `, res.status);
    }
  } catch (error) {
    console.error(`Error: `, error);
    alert("Error");
  }
}

async function getForecast(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );
    if (res.status === 200) {
      const data = await res.json();
      return data;
    } else {
      alert(`Error: `, res.status);
    }
  } catch (error) {
    console.error(`Error: `, error);
    alert("Error");
  }
}

async function getForecastList(lat, lon) {
  const targetHour = 12;
  const days = {};
  const result = [];
  const data = await getForecast(lat, lon);
  data.list.forEach((res) => {
    const local = new Date((res.dt + data.city.timezone) * 1000);
    const date = local.toISOString().split("T")[0];
    const hour = local.getHours();
    if (
      !days[date] ||
      Math.abs(hour - targetHour) < Math.abs(days[date].hour - targetHour)
    ) {
      days[date] = { res, hour };
    }
  });
  Object.keys(days)
    .sort()
    .forEach((key) => result.push(days[key]));
  return normalizeForecast(result);
}
