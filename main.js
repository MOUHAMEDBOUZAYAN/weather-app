let cityInput = document.getElementById('city_input'),
    searchBtn = document.getElementById('searchBtn'),
    favoriteBtn = document.getElementById('favoriteBtn'), // Button to add to favorites
    locationBtn = document.getElementById('locationBtn'),
    api_key = 'f04afba124f3f40d601ce66c1a693a58',
    currentWeatherCard = document.querySelector('.weather-left .card'),
    fiveDaysForecastCard = document.querySelector('.day-forecast'),
    aqiCard = document.querySelectorAll('.highlights .card')[0],
    sunriseCard = document.querySelectorAll('.highlights .card')[1],
    humidityVal = document.getElementById('humidityVal'),
    pressureVal = document.getElementById('pressureVal'),
    visibilityVal = document.getElementById('visibilityVal'),
    windSpeedVal = document.getElementById('windSpeedVal'),
    feelsVal = document.getElementById('feelsVal'),
    hourlyForecastCard = document.querySelector('.hourly-forecast'),
    favoritesList = document.getElementById('favoritesList'),
    favoriteCityInput = document.getElementById('favoriteCityInput'),
    addFavoriteBtn = document.getElementById('addFavoriteBtn'),
    aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

let favorites = JSON.parse(localStorage.getItem('favorites')) || []; // Load favorites from localStorage

function renderFavorites() {
    favoritesList.innerHTML = ''; // Clear the current list
    favorites.forEach((city, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');
        favoriteItem.innerHTML = `
            <span class="favorite-city" data-city="${city}">${city}</span>
            <button class="remove-favorite" data-index="${index}">Remove</button>
        `;
        favoritesList.appendChild(favoriteItem);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            favorites.splice(index, 1); // Remove from the array
            renderFavorites(); // Re-render the favorites list
            updateLocalStorage(); // Update localStorage
        });
    });

    // Add event listeners to favorite cities
    document.querySelectorAll('.favorite-city').forEach(cityElement => {
        cityElement.addEventListener('click', () => {
            const cityName = cityElement.getAttribute('data-city');
            getCityCoordinates(cityName); // Fetch weather for the clicked city
        });
    });
}

function updateLocalStorage() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function getWeatherDetails(name, lat, lon, country, state) {
    let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`,
        WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`,
        AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`,
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fetch air quality index
    fetch(AIR_POLLUTION_API_URL)
        .then(res => res.json())
        .then(data => {
            let { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = data.list[0].components;
            aqiCard.innerHTML = `
                <div class="card-head">
                    <p>Air Quality Index</p>
                    <p class="air-index aqi-${data.list[0].main.aqi}">${aqiList[data.list[0].main.aqi - 1]}</p>
                </div>
                <div class="air-indices">
                    <div class="item"><p>PM2.5</p><h2>${pm2_5}</h2></div>
                    <div class="item"><p>PM10</p><h2>${pm10}</h2></div>
                    <div class="item"><p>SO2</p><h2>${so2}</h2></div>
                    <div class="item"><p>CO</p><h2>${co}</h2></div>
                    <div class="item"><p>NO</p><h2>${no}</h2></div>
                    <div class="item"><p>NO2</p><h2>${no2}</h2></div>
                    <div class="item"><p>NH3</p><h2>${nh3}</h2></div>
                    <div class="item"><p>O3</p><h2>${o3}</h2></div>
                </div>`;
        })
        .catch(() => {
            alert('Failed to fetch Air Quality Index');
        });

    // Fetch current weather
    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            let date = new Date();
            currentWeatherCard.innerHTML = `
                <div class="current-weather">
                    <div class="details">
                        <p>Now</p>
                        <h2>${(data.main.temp - 273.15).toFixed(2)}&deg;C</h2>
                        <p>${data.weather[0].description}</p>
                    </div>
                    <div class="weather-icon">
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="">
                    </div>
                </div>
                <hr>
                <div class="card-footer">
                    <p><i class="fa-light fa-calendar"></i>${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}</p>
                    <p><i class="fa-light fa-location-dot"></i>${name}, ${country}</p>
                </div>`;

            let sunrise = data.sys.sunrise * 1000; // Convert to milliseconds
            let sunset = data.sys.sunset * 1000; // Convert to milliseconds
            let timezoneOffset = data.timezone; // Timezone offset in seconds

            let sunriseTime = moment(sunrise).utcOffset(timezoneOffset / 3600).format('hh:mm A');
            let sunsetTime = moment(sunset).utcOffset(timezoneOffset / 3600).format('hh:mm A');

            sunriseCard.innerHTML = `
                <div class="card-head"><p>Sunrise & Sunset</p></div>
                <div class="sunrise-sunset">
                    <div class="item"><i class="fa-light fa-sunrise fa-4x"></i><p>Sunrise</p><h2>${sunriseTime}</h2></div>
                    <div class="item"><i class="fa-light fa-sunset fa-4x"></i><p>Sunset</p><h2>${sunsetTime}</h2></div>
                </div>`;

            humidityVal.innerHTML = `${data.main.humidity}%`;
            pressureVal.innerHTML = `${data.main.pressure} hPa`;
            visibilityVal.innerHTML = `${data.visibility / 1000} km`;
            windSpeedVal.innerHTML = `${data.wind.speed} m/s`;
            feelsVal.innerHTML = `${(data.main.feels_like - 273.15).toFixed(2)}&deg;C`;
        })
        .catch(() => {
            alert('Failed to fetch current weather');
        });

    // Fetch 5-day forecast
    fetch(FORECAST_API_URL)
        .then(res => res.json())
        .then(data => {
            hourlyForecastCard.innerHTML = '';
            for (let i = 0; i <= 7; i++) {
                let forecastDate = new Date(data.list[i].dt_txt);
                let hr = forecastDate.getHours();
                let a = hr < 12 ? 'AM' : 'PM';
                hr = hr % 12 || 12;
                hourlyForecastCard.innerHTML += `
                    <div class="card">
                        <p>${hr} ${a}</p>
                        <img src="https://openweathermap.org/img/wn/${data.list[i].weather[0].icon}.png" alt="">
                        <p>${(data.list[i].main.temp - 273.15).toFixed(2)}&deg;C</p>
                    </div>`;
            }

            let uniqueForecastDays = [];
            let fiveDaysForecast = data.list.filter(forecast => {
                let forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    uniqueForecastDays.push(forecastDate);
                    return true;
                }
                return false;
            });
            fiveDaysForecastCard.innerHTML = '';
            for (let i = 1; i < fiveDaysForecast.length; i++) {
                let date = new Date(fiveDaysForecast[i].dt_txt);
                fiveDaysForecastCard.innerHTML += `
                    <div class="forecast-item">
                        <img src="https://openweathermap.org/img/wn/${fiveDaysForecast[i].weather[0].icon}.png" alt="">
                        <span>${(fiveDaysForecast[i].main.temp - 273.15).toFixed(2)}&deg;C</span>
                        <p>${date.getDate()} ${months[date.getMonth()]}</p>
                        <p>${days[date.getDay()]}</p>
                    </div>`;
            }
        })
        .catch(() => {
            alert('Failed to fetch forecast data');
        });
}

function getCityCoordinates(cityName) {
    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;
    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                let { name, lat, lon, country, state } = data[0];
                getWeatherDetails(name, lat, lon, country, state);
            } else {
                alert('City not found');
            }
        })
        .catch(() => {
            alert(`Failed to fetch coordinates for ${cityName}`);
        });
}

function getUserCoordinates() {
    navigator.geolocation.getCurrentPosition(
        position => {
            let { latitude, longitude } = position.coords;
            let REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;
            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    let { name, country, state } = data[0];
                    getWeatherDetails(name, latitude, longitude, country, state);
                })
                .catch(() => {
                    alert('Failed to fetch user coordinates');
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert('Geolocation permission denied. Please reset location permission to grant access again.');
            }
        }
    );
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const cityName = cityInput.value.trim();
    if (cityName) {
        getCityCoordinates(cityName);
    }
});

favoriteBtn.addEventListener('click', () => {
    const cityName = cityInput.value.trim();
    if (cityName && !favorites.includes(cityName)) {
        favorites.push(cityName); // Add city to favorites
        updateLocalStorage(); // Save to localStorage
        renderFavorites(); // Update the favorites list
        alert(`${cityName} added to favorites!`);
    } else if (favorites.includes(cityName)) {
        alert(`${cityName} is already in favorites.`);
    } else {
        alert('Please enter a city name to add to favorites.');
    }
});

locationBtn.addEventListener('click', getUserCoordinates);
cityInput.addEventListener('keyup', e => e.key === 'Enter' && getCityCoordinates(cityInput.value));

// Favorites Functionality
addFavoriteBtn.addEventListener('click', () => {
    const favoriteCityName = favoriteCityInput.value.trim();
    if (favoriteCityName && !favorites.includes(favoriteCityName)) {
        favorites.push(favoriteCityName); // Add city to favorites
        favoriteCityInput.value = ''; // Clear input field
        renderFavorites(); // Update the favorites list
        updateLocalStorage(); // Save to localStorage
        alert(`${favoriteCityName} added to favorites!`);
    } else if (favorites.includes(favoriteCityName)) {
        alert(`${favoriteCityName} is already in favorites.`);
    } else {
        alert('Please enter a city name to add to favorites.');
    }
});

// Initial render of favorites
renderFavorites();