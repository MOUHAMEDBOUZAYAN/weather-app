/* ==========================================
   PROFESSIONAL WEATHER APP - JAVASCRIPT
   ========================================== */

class WeatherApp {
    constructor() {
        this.apiKey = 'f04afba124f3f40d601ce66c1a693a58';
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.currentCity = null;
        this.isLoading = false;
        
        // DOM Elements
        this.elements = {
            // Loading
            loadingScreen: document.getElementById('loadingScreen'),
            
            // Search
            cityInput: document.getElementById('city_input'),
            searchBtn: document.getElementById('searchBtn'),
            favoriteBtn: document.getElementById('favoriteBtn'),
            locationBtn: document.getElementById('locationBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            
            // Current Weather
            currentWeatherCard: document.querySelector('.current-weather-card'),
            lastUpdated: document.getElementById('lastUpdated'),
            currentLocation: document.getElementById('currentLocation'),
            currentDateTime: document.getElementById('currentDateTime'),
            currentVisibility: document.getElementById('currentVisibility'),
            currentWind: document.getElementById('currentWind'),
            
            // Weather Details
            humidityVal: document.getElementById('humidityVal'),
            humidityProgress: document.getElementById('humidityProgress'),
            pressureVal: document.getElementById('pressureVal'),
            pressureArrow: document.getElementById('pressureArrow'),
            visibilityVal: document.getElementById('visibilityVal'),
            visibilityIndicator: document.getElementById('visibilityIndicator'),
            windSpeedVal: document.getElementById('windSpeedVal'),
            windDirection: document.getElementById('windDirection'),
            feelsVal: document.getElementById('feelsVal'),
            
            // Sun & Moon
            sunriseTime: document.getElementById('sunriseTime'),
            sunsetTime: document.getElementById('sunsetTime'),
            sunPosition: document.getElementById('sunPosition'),
            
            // Air Quality
            aqiBadge: document.getElementById('aqiBadge'),
            aqiValue: document.getElementById('aqiValue'),
            aqiDetails: document.getElementById('aqiDetails'),
            
            // Forecast
            dayForecast: document.getElementById('dayForecast'),
            hourlyForecast: document.getElementById('hourlyForecast'),
            
            // Favorites
            favoritesList: document.getElementById('favoritesList'),
            favoriteCityInput: document.getElementById('favoriteCityInput'),
            addFavoriteBtn: document.getElementById('addFavoriteBtn'),
            toggleFavoritesBtn: document.getElementById('toggleFavoritesBtn'),
            addFavoriteForm: document.getElementById('addFavoriteForm')
        };
        
        this.aqiLevels = [
            { max: 50, label: 'Good', class: 'aqi-good', color: '#4ade80' },
            { max: 100, label: 'Fair', class: 'aqi-fair', color: '#84cc16' },
            { max: 150, label: 'Moderate', class: 'aqi-moderate', color: '#f59e0b' },
            { max: 200, label: 'Poor', class: 'aqi-poor', color: '#f97316' },
            { max: 999, label: 'Very Poor', class: 'aqi-very-poor', color: '#ef4444' }
        ];
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.renderFavorites();
        
        // Hide loading screen after DOM is loaded
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
        }, 1500);
        
        // Try to get user's location on startup
        await this.getUserLocation();
    }
    
    setupEventListeners() {
        // Search functionality
        this.elements.searchBtn?.addEventListener('click', () => this.handleSearch());
        this.elements.cityInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Location and favorites
        this.elements.locationBtn?.addEventListener('click', () => this.getUserLocation());
        this.elements.favoriteBtn?.addEventListener('click', () => this.addCurrentCityToFavorites());
        this.elements.refreshBtn?.addEventListener('click', () => this.refreshCurrentWeather());
        
        // Favorites management
        this.elements.addFavoriteBtn?.addEventListener('click', () => this.addFavoriteFromInput());
        this.elements.toggleFavoritesBtn?.addEventListener('click', () => this.toggleFavoriteForm());
        this.elements.favoriteCityInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFavoriteFromInput();
        });
        
        // Forecast toggle
        this.setupForecastToggle();
        
        // Auto-refresh every 10 minutes
        setInterval(() => {
            if (this.currentCity) {
                this.refreshCurrentWeather();
            }
        }, 600000);
    }
    
    setupForecastToggle() {
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                
                // Update active button
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show/hide forecast content
                if (type === 'daily') {
                    this.elements.dayForecast.classList.remove('hidden');
                    this.elements.hourlyForecast.classList.add('hidden');
                } else {
                    this.elements.dayForecast.classList.add('hidden');
                    this.elements.hourlyForecast.classList.remove('hidden');
                }
            });
        });
    }
    
    async handleSearch() {
        const cityName = this.elements.cityInput?.value.trim();
        if (!cityName) {
            this.showNotification('Please enter a city name', 'warning');
            return;
        }
        
        await this.getCityCoordinates(cityName);
        this.elements.cityInput.value = '';
    }
    
    async getCityCoordinates(cityName) {
        if (this.isLoading) return;
        
        this.setLoading(true);
        
        try {
            const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${this.apiKey}`;
            const response = await fetch(geocodingUrl);
            const data = await response.json();
            
            if (data.length > 0) {
                const { name, lat, lon, country, state } = data[0];
                await this.getWeatherDetails(name, lat, lon, country, state);
            } else {
                this.showNotification('City not found. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            this.showNotification('Failed to fetch coordinates. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    async getUserLocation() {
        if (this.isLoading) return;
        
        this.setLoading(true);
        
        if (!navigator.geolocation) {
            this.showNotification('Geolocation is not supported by this browser', 'error');
            this.setLoading(false);
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const reverseGeoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.apiKey}`;
                    const response = await fetch(reverseGeoUrl);
                    const data = await response.json();
                    
                    if (data.length > 0) {
                        const { name, country, state } = data[0];
                        await this.getWeatherDetails(name, latitude, longitude, country, state);
                        this.showNotification('Location detected successfully', 'success');
                    } else {
                        this.showNotification('Could not determine your location', 'error');
                    }
                } catch (error) {
                    console.error('Error getting location data:', error);
                    this.showNotification('Failed to get location data', 'error');
                } finally {
                    this.setLoading(false);
                }
            },
            (error) => {
                let message = 'Failed to get your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please allow location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += 'Location request timed out.';
                        break;
                    default:
                        message += 'An unknown error occurred.';
                        break;
                }
                this.showNotification(message, 'error');
                this.setLoading(false);
            },
            options
        );
    }
    
    async getWeatherDetails(name, lat, lon, country, state) {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
        
        try {
            // Fetch all data in parallel
            const [weatherResponse, forecastResponse, aqiResponse] = await Promise.all([
                fetch(weatherUrl),
                fetch(forecastUrl),
                fetch(aqiUrl)
            ]);
            
            const [weatherData, forecastData, aqiData] = await Promise.all([
                weatherResponse.json(),
                forecastResponse.json(),
                aqiResponse.json()
            ]);
            
            // Store current city info
            this.currentCity = {
                name,
                lat,
                lon,
                country,
                state,
                fullName: state ? `${name}, ${state}, ${country}` : `${name}, ${country}`
            };
            
            // Update UI with all data
            this.updateCurrentWeather(weatherData);
            this.updateForecast(forecastData);
            this.updateAirQuality(aqiData);
            this.updateLastUpdated();
            
            this.showNotification(`Weather updated for ${name}`, 'success');
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showNotification('Failed to fetch weather data', 'error');
        }
    }
    
    updateCurrentWeather(data) {
        const temp = Math.round(data.main.temp - 273.15);
        const feelsLike = Math.round(data.main.feels_like - 273.15);
        const humidity = data.main.humidity;
        const pressure = data.main.pressure;
        const visibility = (data.visibility / 1000).toFixed(1);
        const windSpeed = data.wind.speed;
        const windDirection = data.wind.deg || 0;
        
        // Update temperature and description
        const tempValue = document.querySelector('.temp-value');
        const weatherDescription = document.querySelector('.weather-description h4');
        const weatherDescriptionSub = document.querySelector('.weather-description p');
        const weatherIcon = document.querySelector('.weather-icon img');
        
        if (tempValue) tempValue.textContent = temp;
        if (weatherDescription) weatherDescription.textContent = data.weather[0].description;
        if (weatherDescriptionSub) weatherDescriptionSub.textContent = `Feels like ${feelsLike}°C`;
        if (weatherIcon) {
            weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
            weatherIcon.alt = data.weather[0].description;
        }
        
        // Update location and time
        if (this.elements.currentLocation) {
            this.elements.currentLocation.textContent = this.currentCity.fullName;
        }
        
        if (this.elements.currentDateTime) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            this.elements.currentDateTime.innerHTML = `
                <i class="fas fa-calendar-alt"></i>
                <span>${now.toLocaleDateString('en-US', options)}</span>
            `;
        }
        
        // Update detail values
        if (this.elements.currentVisibility) this.elements.currentVisibility.textContent = `${visibility} km`;
        if (this.elements.currentWind) this.elements.currentWind.textContent = `${windSpeed} m/s`;
        
        // Update metrics
        if (this.elements.humidityVal) this.elements.humidityVal.textContent = `${humidity}%`;
        if (this.elements.pressureVal) this.elements.pressureVal.textContent = `${pressure} hPa`;
        if (this.elements.visibilityVal) this.elements.visibilityVal.textContent = `${visibility} km`;
        if (this.elements.windSpeedVal) this.elements.windSpeedVal.textContent = `${windSpeed} m/s`;
        if (this.elements.feelsVal) this.elements.feelsVal.textContent = `${feelsLike}°C`;
        
        // Update progress indicators
        this.updateHumidityProgress(humidity);
        this.updatePressureIndicator(pressure);
        this.updateVisibilityIndicator(visibility);
        this.updateWindDirection(windDirection);
        
        // Update sunrise/sunset
        this.updateSunTimes(data.sys.sunrise, data.sys.sunset, data.timezone);
    }
    
    updateHumidityProgress(humidity) {
        if (this.elements.humidityProgress) {
            this.elements.humidityProgress.style.width = `${humidity}%`;
            
            // Add color based on humidity level
            if (humidity < 30) {
                this.elements.humidityProgress.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
            } else if (humidity > 70) {
                this.elements.humidityProgress.style.background = 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
            } else {
                this.elements.humidityProgress.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
            }
        }
    }
    
    updatePressureIndicator(pressure) {
        if (this.elements.pressureArrow) {
            // Standard pressure is around 1013 hPa
            const angle = ((pressure - 980) / 60) * 180 - 90; // Map pressure to angle
            this.elements.pressureArrow.style.transform = `translate(-50%, -100%) rotate(${Math.max(-90, Math.min(90, angle))}deg)`;
        }
    }
    
    updateVisibilityIndicator(visibility) {
        if (this.elements.visibilityIndicator) {
            const maxVisibility = 10; // km
            const percentage = Math.min(100, (visibility / maxVisibility) * 100);
            this.elements.visibilityIndicator.style.setProperty('--visibility-percentage', `${percentage}%`);
            
            // Position the indicator dot
            if (this.elements.visibilityIndicator.querySelector('::after')) {
                this.elements.visibilityIndicator.style.setProperty('--dot-position', `${percentage}%`);
            }
        }
    }
    
    updateWindDirection(direction) {
        if (this.elements.windDirection) {
            this.elements.windDirection.style.transform = `translate(-50%, -100%) rotate(${direction}deg)`;
        }
    }
    
    updateSunTimes(sunrise, sunset, timezoneOffset) {
        const sunriseTime = new Date((sunrise + timezoneOffset) * 1000);
        const sunsetTime = new Date((sunset + timezoneOffset) * 1000);
        
        if (this.elements.sunriseTime) {
            this.elements.sunriseTime.textContent = sunriseTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            });
        }
        
        if (this.elements.sunsetTime) {
            this.elements.sunsetTime.textContent = sunsetTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            });
        }
        
        // Update sun position
        this.updateSunPosition(sunrise, sunset, timezoneOffset);
    }
    
    updateSunPosition(sunrise, sunset, timezoneOffset) {
        if (!this.elements.sunPosition) return;
        
        const now = Date.now() / 1000;
        const currentTime = now + timezoneOffset;
        const sunriseTime = sunrise + timezoneOffset;
        const sunsetTime = sunset + timezoneOffset;
        
        if (currentTime < sunriseTime || currentTime > sunsetTime) {
            // Night time - hide sun
            this.elements.sunPosition.style.opacity = '0.3';
            this.elements.sunPosition.style.left = '0%';
        } else {
            // Day time - calculate position
            const dayLength = sunsetTime - sunriseTime;
            const timeFromSunrise = currentTime - sunriseTime;
            const percentage = (timeFromSunrise / dayLength) * 100;
            
            this.elements.sunPosition.style.opacity = '1';
            this.elements.sunPosition.style.left = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }
    
    updateForecast(data) {
        this.updateDailyForecast(data);
        this.updateHourlyForecast(data);
    }
    
    updateDailyForecast(data) {
        if (!this.elements.dayForecast) return;
        
        // Group forecasts by day
        const dailyForecasts = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!dailyForecasts[dayKey]) {
                dailyForecasts[dayKey] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    items: []
                };
            }
            
            dailyForecasts[dayKey].temps.push(item.main.temp - 273.15);
            dailyForecasts[dayKey].items.push(item);
        });
        
        // Get next 5 days (excluding today)
        const forecastDays = Object.values(dailyForecasts).slice(1, 6);
        
        this.elements.dayForecast.innerHTML = forecastDays.map(day => {
            const maxTemp = Math.round(Math.max(...day.temps));
            const minTemp = Math.round(Math.min(...day.temps));
            const dayName = days[day.date.getDay()];
            const monthDay = `${day.date.getDate()} ${months[day.date.getMonth()]}`;
            
            return `
                <div class="forecast-item">
                    <img src="https://openweathermap.org/img/wn/${day.weather.icon}@2x.png" alt="${day.weather.description}">
                    <div class="day-info">
                        <div class="day-name">${dayName}</div>
                        <div class="day-date">${monthDay}</div>
                    </div>
                    <div class="temperature">${maxTemp}°/${minTemp}°</div>
                    <div class="condition">${day.weather.description}</div>
                </div>
            `;
        }).join('');
    }
    
    updateHourlyForecast(data) {
        if (!this.elements.hourlyForecast) return;
        
        // Show next 24 hours (8 items, 3-hour intervals)
        const hourlyData = data.list.slice(0, 8);
        
        this.elements.hourlyForecast.innerHTML = hourlyData.map(item => {
            const time = new Date(item.dt * 1000);
            const hour = time.getHours();
            const temp = Math.round(item.main.temp - 273.15);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            return `
                <div class="hourly-item">
                    <div class="hour">${displayHour} ${ampm}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
                    <div class="temp">${temp}°C</div>
                </div>
            `;
        }).join('');
    }
    
    updateAirQuality(data) {
        if (!data.list || !data.list[0]) return;
        
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        
        // Update AQI badge and value
        const aqiLevel = this.aqiLevels.find(level => aqi <= level.max / 50) || this.aqiLevels[4];
        
        if (this.elements.aqiBadge) {
            this.elements.aqiBadge.innerHTML = `<span>${aqiLevel.label}</span>`;
            this.elements.aqiBadge.className = `aqi-badge ${aqiLevel.class}`;
            this.elements.aqiBadge.style.backgroundColor = aqiLevel.color;
        }
        
        if (this.elements.aqiValue) {
            this.elements.aqiValue.textContent = aqi;
        }
        
        // Update AQI progress circle
        const aqiProgress = document.querySelector('.aqi-progress circle:last-child');
        if (aqiProgress) {
            const circumference = 2 * Math.PI * 40; // radius = 40
            const progress = (aqi / 5) * circumference;
            aqiProgress.style.strokeDashoffset = circumference - progress;
            aqiProgress.style.stroke = aqiLevel.color;
        }
        
        // Update AQI details
        if (this.elements.aqiDetails) {
            const components_data = [
                { name: 'PM2.5', value: components.pm2_5, unit: 'μg/m³' },
                { name: 'PM10', value: components.pm10, unit: 'μg/m³' },
                { name: 'O3', value: components.o3, unit: 'μg/m³' },
                { name: 'NO2', value: components.no2, unit: 'μg/m³' },
                { name: 'SO2', value: components.so2, unit: 'μg/m³' },
                { name: 'CO', value: (components.co / 1000).toFixed(1), unit: 'mg/m³' }
            ];
            
            this.elements.aqiDetails.innerHTML = components_data.map(comp => `
                <div class="aqi-component">
                    <div class="label">${comp.name}</div>
                    <div class="value">${comp.value}</div>
                </div>
            `).join('');
        }
    }
    
    updateLastUpdated() {
        if (this.elements.lastUpdated) {
            const now = new Date();
            this.elements.lastUpdated.innerHTML = `
                <i class="fas fa-clock"></i>
                <span>Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            `;
        }
    }
    
    // Favorites Management
    addCurrentCityToFavorites() {
        if (!this.currentCity) {
            this.showNotification('Please search for a city first', 'warning');
            return;
        }
        
        const cityName = this.currentCity.fullName;
        
        if (this.favorites.includes(cityName)) {
            this.showNotification(`${cityName} is already in favorites`, 'info');
        } else {
            this.favorites.push(cityName);
            this.updateLocalStorage();
            this.renderFavorites();
            this.showNotification(`${cityName} added to favorites!`, 'success');
        }
    }
    
    addFavoriteFromInput() {
        const cityName = this.elements.favoriteCityInput?.value.trim();
        if (!cityName) {
            this.showNotification('Please enter a city name', 'warning');
            return;
        }
        
        if (this.favorites.includes(cityName)) {
            this.showNotification(`${cityName} is already in favorites`, 'info');
        } else {
            this.favorites.push(cityName);
            this.updateLocalStorage();
            this.renderFavorites();
            this.showNotification(`${cityName} added to favorites!`, 'success');
            this.elements.favoriteCityInput.value = '';
        }
    }
    
    removeFavorite(index) {
        if (index >= 0 && index < this.favorites.length) {
            const cityName = this.favorites[index];
            this.favorites.splice(index, 1);
            this.updateLocalStorage();
            this.renderFavorites();
            this.showNotification(`${cityName} removed from favorites`, 'info');
        }
    }
    
    toggleFavoriteForm() {
        if (this.elements.addFavoriteForm) {
            this.elements.addFavoriteForm.classList.toggle('hidden');
            
            if (!this.elements.addFavoriteForm.classList.contains('hidden')) {
                this.elements.favoriteCityInput?.focus();
            }
        }
    }
    
    renderFavorites() {
        if (!this.elements.favoritesList) return;
        
        if (this.favorites.length === 0) {
            this.elements.favoritesList.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-heart"></i>
                    <h3>No Favorites Yet</h3>
                    <p>Add your favorite locations to quickly check their weather</p>
                </div>
            `;
            return;
        }
        
        this.elements.favoritesList.innerHTML = this.favorites.map((city, index) => `
            <div class="favorite-card" data-city="${city}" data-index="${index}">
                <div class="favorite-header">
                    <div class="favorite-city">${city}</div>
                    <button class="remove-favorite" data-index="${index}" title="Remove from favorites">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="favorite-weather">
                    <div class="favorite-temp">--°C</div>
                    <div class="favorite-condition">Loading...</div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        this.setupFavoriteEventListeners();
        
        // Load weather for each favorite (with delay to avoid rate limiting)
        this.favorites.forEach((city, index) => {
            setTimeout(() => {
                this.loadFavoriteWeather(city, index);
            }, index * 1000);
        });
    }
    
    setupFavoriteEventListeners() {
        // Click to view weather
        document.querySelectorAll('.favorite-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.remove-favorite')) return;
                
                const cityName = card.dataset.city;
                this.getCityCoordinates(cityName);
            });
        });
        
        // Remove favorite buttons
        document.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeFavorite(index);
            });
        });
    }
    
    async loadFavoriteWeather(cityName, index) {
        try {
            const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${this.apiKey}`;
            const geoResponse = await fetch(geocodingUrl);
            const geoData = await geoResponse.json();
            
            if (geoData.length > 0) {
                const { lat, lon } = geoData[0];
                const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
                const weatherResponse = await fetch(weatherUrl);
                const weatherData = await weatherResponse.json();
                
                // Update favorite card
                const favoriteCard = document.querySelector(`.favorite-card[data-index="${index}"]`);
                if (favoriteCard) {
                    const temp = Math.round(weatherData.main.temp - 273.15);
                    const condition = weatherData.weather[0].description;
                    
                    favoriteCard.querySelector('.favorite-temp').textContent = `${temp}°C`;
                    favoriteCard.querySelector('.favorite-condition').textContent = condition;
                }
            }
        } catch (error) {
            console.error(`Error loading weather for ${cityName}:`, error);
            const favoriteCard = document.querySelector(`.favorite-card[data-index="${index}"]`);
            if (favoriteCard) {
                favoriteCard.querySelector('.favorite-condition').textContent = 'Failed to load';
            }
        }
    }
    
    updateLocalStorage() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }
    
    refreshCurrentWeather() {
        if (this.currentCity) {
            this.getWeatherDetails(
                this.currentCity.name,
                this.currentCity.lat,
                this.currentCity.lon,
                this.currentCity.country,
                this.currentCity.state
            );
        }
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        
        // Update UI to show loading state
        if (loading) {
            document.body.style.cursor = 'wait';
            this.elements.searchBtn?.classList.add('loading');
            this.elements.locationBtn?.classList.add('loading');
        } else {
            document.body.style.cursor = 'default';
            this.elements.searchBtn?.classList.remove('loading');
            this.elements.locationBtn?.classList.remove('loading');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
        
        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        });
    }
    
    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        margin: 0;
        padding: 16px 20px;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        font-weight: 500;
        box-shadow: var(--glass-shadow);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 500px;
        transform: translateX(100%);
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0;
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification.hide {
        transform: translateX(100%);
        opacity: 0;
    }
    
    .notification-success {
        border-left: 4px solid var(--success);
    }
    
    .notification-error {
        border-left: 4px solid var(--danger);
    }
    
    .notification-warning {
        border-left: 4px solid var(--warning);
    }
    
    .notification-info {
        border-left: 4px solid var(--info);
    }
    
    .notification i:first-child {
        font-size: 18px;
        flex-shrink: 0;
    }
    
    .notification-success i:first-child {
        color: var(--success);
    }
    
    .notification-error i:first-child {
        color: var(--danger);
    }
    
    .notification-warning i:first-child {
        color: var(--warning);
    }
    
    .notification-info i:first-child {
        color: var(--info);
    }
    
    .notification span {
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: var(--transition-base);
        flex-shrink: 0;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            min-width: auto;
            max-width: none;
        }
    }
`;

// Add notification styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);