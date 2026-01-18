import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
	Cloud,
	CloudRain,
	Sun,
	Wind,
	Droplets,
	Eye,
	Gauge,
	CloudSnow,
	MapPin,
	CloudDrizzle,
	Calendar,
	Star,
	Sunrise,
	Sunset,
	Share2,
	Thermometer,
	Shirt,
	Activity,
	Clock,
	BarChart3,
	Settings,
	RefreshCw,
	X,
	Zap,
	Moon,
	CloudFog,
	Waves,
	Navigation,
	Globe,
	TrendingUp,
	AlertTriangle,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

// API Service Layer
const WeatherService = {
	API_KEY: "0cf1f0055bde44d7490dd3b3d942f7c8",
	BASE_URL: "https://api.openweathermap.org/data/2.5",
	cache: new Map(),
	CACHE_DURATION: 10 * 60 * 1000, // 10 dakika

	async fetchWithCache(url, cacheKey) {
		const cached = WeatherService.cache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < WeatherService.CACHE_DURATION) {
			return cached.data;
		}

		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const data = await response.json();
		WeatherService.cache.set(cacheKey, { data, timestamp: Date.now() });
		return data;
	},

	async getCurrentWeather(city) {
		const url = `${WeatherService.BASE_URL}/weather?q=${city}&appid=${WeatherService.API_KEY}&units=metric&lang=tr`;
		return WeatherService.fetchWithCache(url, `weather_${city}`);
	},

	async getForecast(city) {
		const url = `${WeatherService.BASE_URL}/forecast?q=${city}&appid=${WeatherService.API_KEY}&units=metric&lang=tr`;
		return WeatherService.fetchWithCache(url, `forecast_${city}`);
	},

	async getAirQuality(lat, lon) {
		const url = `${WeatherService.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${WeatherService.API_KEY}`;
		return WeatherService.fetchWithCache(url, `aqi_${lat}_${lon}`);
	},

	async getWeatherByCoords(lat, lon) {
		const url = `${WeatherService.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WeatherService.API_KEY}&units=metric&lang=tr`;
		return WeatherService.fetchWithCache(url, `weather_${lat}_${lon}`);
	},

	async getForecastByCoords(lat, lon) {
		const url = `${WeatherService.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WeatherService.API_KEY}&units=metric&lang=tr`;
		return WeatherService.fetchWithCache(url, `forecast_${lat}_${lon}`);
	},
};

// Storage Service using window.storage API
const StorageService = {
	async get(key) {
		try {
			const result = await window.storage.get(key);
			return result ? JSON.parse(result.value) : null;
		} catch {
			return null;
		}
	},

	async set(key, value) {
		try {
			await window.storage.set(key, JSON.stringify(value));
			return true;
		} catch {
			return false;
		}
	},

	async delete(key) {
		try {
			await window.storage.delete(key);
			return true;
		} catch {
			return false;
		}
	},

	async list(prefix) {
		try {
			const result = await window.storage.list(prefix);
			return result?.keys || [];
		} catch {
			return [];
		}
	},
};

// Skeleton Loading Component
const SkeletonLoader = () => (
	<div className="animate-pulse space-y-6">
		<div className="grid md:grid-cols-3 gap-6">
			<div className="md:col-span-2 bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
				<div className="h-8 bg-white/10 rounded w-2/3 mb-6"></div>
				<div className="h-32 bg-white/10 rounded-full w-32 mx-auto mb-6"></div>
				<div className="h-20 bg-white/10 rounded w-1/2 mx-auto mb-4"></div>
				<div className="grid grid-cols-2 gap-3">
					<div className="h-20 bg-white/10 rounded-xl"></div>
					<div className="h-20 bg-white/10 rounded-xl"></div>
				</div>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-1 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
						<div className="h-16 bg-white/10 rounded"></div>
					</div>
				))}
			</div>
		</div>
	</div>
);

// Weather Comparison Component
const WeatherComparison = ({ city1Data, city2Data, onClose, getWeatherIcon }) => {
	if (!city1Data || !city2Data) return null;

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
			<div className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-8 max-w-4xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-white text-2xl font-bold">Şehir Karşılaştırma</h2>
					<button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition-all">
						<X className="w-6 h-6 text-white" />
					</button>
				</div>

				<div className="grid md:grid-cols-2 gap-6">
					{[city1Data, city2Data].map((data, idx) => (
						<div key={idx} className="bg-white/5 rounded-2xl p-6 border border-white/10">
							<h3 className="text-white text-xl font-bold mb-4">{data.name}</h3>
							<div className="flex justify-center mb-4">{getWeatherIcon(data.condition, "w-16 h-16")}</div>
							<p className="text-5xl font-bold text-white text-center mb-2">{data.temp}°C</p>
							<p className="text-white/70 text-center mb-4">{data.description}</p>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between text-white/70">
									<span>💧 Nem:</span>
									<span className="text-white font-semibold">{data.humidity}%</span>
								</div>
								<div className="flex justify-between text-white/70">
									<span>💨 Rüzgar:</span>
									<span className="text-white font-semibold">{data.windSpeed} km/h</span>
								</div>
								<div className="flex justify-between text-white/70">
									<span>👁️ Görüş:</span>
									<span className="text-white font-semibold">{data.visibility} km</span>
								</div>
								<div className="flex justify-between text-white/70">
									<span>🌡️ Hissedilen:</span>
									<span className="text-white font-semibold">{data.feelsLike}°C</span>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
					<h4 className="text-white font-bold mb-3">Farklar</h4>
					<div className="space-y-2 text-white/70 text-sm">
						<p>
							🌡️ Sıcaklık Farkı: <span className="text-white font-semibold">{Math.abs(city1Data.temp - city2Data.temp).toFixed(1)}°C</span>
						</p>
						<p>
							💧 Nem Farkı: <span className="text-white font-semibold">{Math.abs(city1Data.humidity - city2Data.humidity)}%</span>
						</p>
						<p>
							💨 Rüzgar Farkı: <span className="text-white font-semibold">{Math.abs(city1Data.windSpeed - city2Data.windSpeed)} km/h</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

// Helper function for weather icons
const getWeatherIcon = (condition, size = "w-20 h-20") => {
	const icons = {
		Clear: <Sun className={`${size} text-yellow-400`} />,
		Clouds: <Cloud className={`${size} text-gray-300`} />,
		Rain: <CloudRain className={`${size} text-blue-400`} />,
		Drizzle: <CloudDrizzle className={`${size} text-blue-300`} />,
		Snow: <CloudSnow className={`${size} text-blue-200`} />,
		Thunderstorm: <Zap className={`${size} text-purple-400`} />,
		Mist: <CloudFog className={`${size} text-gray-400`} />,
		Smoke: <Cloud className={`${size} text-gray-500`} />,
		Haze: <CloudFog className={`${size} text-gray-400`} />,
		Dust: <Cloud className={`${size} text-yellow-600`} />,
		Fog: <CloudFog className={`${size} text-gray-400`} />,
	};
	return icons[condition] || <Cloud className={`${size} text-gray-300`} />;
};

export default function WeatherApp() {
	const [city, setCity] = useState("");
	const [weather, setWeather] = useState(null);
	const [forecast, setForecast] = useState([]);
	const [hourlyForecast, setHourlyForecast] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [favorites, setFavorites] = useState([]);
	const [recentSearches, setRecentSearches] = useState([]);
	const [showSettings, setShowSettings] = useState(false);
	const [airQuality, setAirQuality] = useState(null);
	const [unit, setUnit] = useState("metric");
	const [language, setLanguage] = useState("tr");
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [theme, setTheme] = useState("dark");
	const [uvIndex, setUvIndex] = useState(null);
	const [pollenLevel, setPollenLevel] = useState(null);
	const [compareMode, setCompareMode] = useState(false);
	const [compareCity1, setCompareCity1] = useState(null);
	const [compareCity2, setCompareCity2] = useState(null);
	const [searchInput, setSearchInput] = useState("");
	const [retryCount, setRetryCount] = useState(0);
	const [offlineMode, setOfflineMode] = useState(false);

	// Load saved data on mount
	useEffect(() => {
		const loadData = async () => {
			const savedFavorites = (await StorageService.get("weatherFavorites")) || [];
			const savedSearches = (await StorageService.get("weatherRecentSearches")) || [];
			const savedUnit = (await StorageService.get("weatherUnit")) || "metric";
			const savedLanguage = (await StorageService.get("weatherLanguage")) || "tr";
			const savedAutoRefresh = (await StorageService.get("weatherAutoRefresh")) || false;
			const savedNotifications = (await StorageService.get("weatherNotifications")) || false;
			const savedTheme = (await StorageService.get("weatherTheme")) || "dark";

			setFavorites(savedFavorites);
			setRecentSearches(savedSearches);
			setUnit(savedUnit);
			setLanguage(savedLanguage);
			setAutoRefresh(savedAutoRefresh);
			setShowNotifications(savedNotifications);
			setTheme(savedTheme);
		};
		loadData();
	}, []);

	// Auto-refresh functionality
	useEffect(() => {
		if (!autoRefresh || !weather) return;

		const interval = setInterval(
			() => {
				if (weather.city) {
					searchWeather(weather.city, true);
				}
			},
			10 * 60 * 1000,
		); // 10 minutes

		return () => clearInterval(interval);
	}, [autoRefresh, weather]);

	// Debounced search
	useEffect(() => {
		if (!searchInput) return;

		const timer = setTimeout(() => {
			if (searchInput.length >= 2) {
				searchWeather(searchInput);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [searchInput]);

	// Notification handler
	const sendNotification = useCallback(
		(title, body) => {
			if (!showNotifications || !("Notification" in window)) return;

			if (Notification.permission === "granted") {
				new Notification(title, { body, icon: "☁️" });
			}
		},
		[showNotifications],
	);

	const processWeatherData = useCallback((data) => {
		const countryNames = {
			TR: "Türkiye",
			US: "Amerika",
			GB: "İngiltere",
			FR: "Fransa",
			DE: "Almanya",
			IT: "İtalya",
			ES: "İspanya",
			NL: "Hollanda",
			BE: "Belçika",
			CH: "İsviçre",
			AT: "Avusturya",
			GR: "Yunanistan",
			RU: "Rusya",
			CN: "Çin",
			JP: "Japonya",
			KR: "Güney Kore",
			IN: "Hindistan",
			AU: "Avustralya",
			CA: "Kanada",
			BR: "Brezilya",
			MX: "Meksika",
			AR: "Arjantin",
			EG: "Mısır",
			SA: "Suudi Arabistan",
			AE: "BAE",
			SE: "İsveç",
			NO: "Norveç",
			DK: "Danimarka",
			FI: "Finlandiya",
			PL: "Polonya",
		};

		const cityName = data.name;
		const countryCode = data.sys.country;
		const countryName = countryNames[countryCode] || countryCode;

		return {
			name: `${cityName}, ${countryName}`,
			city: cityName,
			countryCode: countryCode,
			temp: Math.round(data.main.temp),
			condition: data.weather[0].main,
			description: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
			humidity: data.main.humidity,
			windSpeed: Math.round(data.wind.speed * 3.6),
			visibility: Math.round(data.visibility / 1000),
			pressure: data.main.pressure,
			feelsLike: Math.round(data.main.feels_like),
			sunrise: data.sys.sunrise,
			sunset: data.sys.sunset,
			coord: data.coord,
		};
	}, []);

	const processForecastData = useCallback((data) => {
		const dailyForecasts = {};
		data.list.forEach((item) => {
			const date = item.dt_txt.split(" ")[0];
			const time = item.dt_txt.split(" ")[1];
			if (!dailyForecasts[date] || time === "12:00:00") {
				dailyForecasts[date] = {
					date: date,
					temp: Math.round(item.main.temp),
					tempMin: Math.round(item.main.temp_min),
					tempMax: Math.round(item.main.temp_max),
					condition: item.weather[0].main,
					description: item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1),
					humidity: item.main.humidity,
					windSpeed: Math.round(item.wind.speed * 3.6),
				};
			}
		});
		return Object.values(dailyForecasts).slice(0, 5);
	}, []);

	const processHourlyData = useCallback((data) => {
		return data.list.slice(0, 8).map((item) => ({
			time: new Date(item.dt * 1000).getHours() + ":00",
			temp: Math.round(item.main.temp),
			condition: item.weather[0].main,
			description: item.weather[0].description,
			humidity: item.main.humidity,
		}));
	}, []);

	const searchWeather = async (searchCity = null, silent = false) => {
		const trimmedCity = (searchCity || city).trim();

		if (!trimmedCity) {
			setError("⚠️ Lütfen bir şehir veya bölge adı girin");
			return;
		}

		if (trimmedCity.length < 2) {
			setError("⚠️ Şehir adı en az 2 karakter olmalıdır");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const weatherData = await WeatherService.getCurrentWeather(trimmedCity);
			const processedWeather = processWeatherData(weatherData);
			setWeather(processedWeather);

			if (!silent) {
				await addToRecentSearches(trimmedCity);
				sendNotification("Hava Durumu Güncellendi", `${processedWeather.name}: ${processedWeather.temp}°C, ${processedWeather.description}`);
			}

			// Fetch forecast
			const forecastData = await WeatherService.getForecast(trimmedCity);
			setForecast(processForecastData(forecastData));
			setHourlyForecast(processHourlyData(forecastData));

			// Fetch air quality
			const aqiData = await WeatherService.getAirQuality(weatherData.coord.lat, weatherData.coord.lon);
			setAirQuality(aqiData.list[0].main.aqi);

			// Simulated UV index (OpenWeather free tier doesn't provide this)
			setUvIndex(Math.floor(Math.random() * 11));

			// Simulated pollen level
			const pollenLevels = ["Düşük", "Orta", "Yüksek", "Çok Yüksek"];
			setPollenLevel(pollenLevels[Math.floor(Math.random() * pollenLevels.length)]);

			setRetryCount(0);
			setOfflineMode(false);
		} catch (err) {
			if (retryCount < 3) {
				setRetryCount(retryCount + 1);
				setTimeout(() => searchWeather(trimmedCity, silent), 2000);
			} else {
				setError(`❌ "${trimmedCity}" adında bir şehir bulunamadı veya bağlantı hatası oluştu.`);
				setWeather(null);
				setOfflineMode(true);
				sendNotification("Hata", "Hava durumu bilgisi alınamadı");
			}
		} finally {
			setLoading(false);
		}
	};

	const getLocationWeather = () => {
		if (!navigator.geolocation) {
			setError("❌ Tarayıcınız konum özelliğini desteklemiyor");
			return;
		}

		setLoading(true);
		setError("");

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;

				try {
					const weatherData = await WeatherService.getWeatherByCoords(latitude, longitude);
					setWeather(processWeatherData(weatherData));

					const forecastData = await WeatherService.getForecastByCoords(latitude, longitude);
					setForecast(processForecastData(forecastData));
					setHourlyForecast(processHourlyData(forecastData));

					const aqiData = await WeatherService.getAirQuality(latitude, longitude);
					setAirQuality(aqiData.list[0].main.aqi);

					setUvIndex(Math.floor(Math.random() * 11));
					setPollenLevel(["Düşük", "Orta", "Yüksek", "Çok Yüksek"][Math.floor(Math.random() * 4)]);
				} catch (err) {
					setError("❌ Konum bilgisi alınamadı.");
				} finally {
					setLoading(false);
				}
			},
			() => {
				setLoading(false);
				setError("❌ Konum izni verilmedi.");
			},
		);
	};

	const addToFavorites = async () => {
		if (!weather) return;

		const newFav = {
			name: weather.name,
			city: weather.city,
			countryCode: weather.countryCode,
			temp: weather.temp,
			condition: weather.condition,
		};

		const exists = favorites.some((f) => f.city === weather.city);
		if (!exists) {
			const updated = [...favorites, newFav];
			setFavorites(updated);
			await StorageService.set("weatherFavorites", updated);
			sendNotification("Favorilere Eklendi", `${weather.city} favorilerinize eklendi`);
		}
	};

	const removeFavorite = async (city) => {
		const updated = favorites.filter((f) => f.city !== city);
		setFavorites(updated);
		await StorageService.set("weatherFavorites", updated);
	};

	const addToRecentSearches = async (searchTerm) => {
		const updated = [searchTerm, ...recentSearches.filter((s) => s !== searchTerm)].slice(0, 5);
		setRecentSearches(updated);
		await StorageService.set("weatherRecentSearches", updated);
	};

	const isFavorite = () => {
		if (!weather) return false;
		return favorites.some((f) => f.city === weather.city);
	};

	const toggleFavorite = () => {
		if (!weather) return;
		if (isFavorite()) {
			removeFavorite(weather.city);
		} else {
			addToFavorites();
		}
	};

	const updateUnit = async (newUnit) => {
		setUnit(newUnit);
		await StorageService.set("weatherUnit", newUnit);
	};

	const updateLanguage = async (newLang) => {
		setLanguage(newLang);
		await StorageService.set("weatherLanguage", newLang);
	};

	const toggleAutoRefresh = async () => {
		const newValue = !autoRefresh;
		setAutoRefresh(newValue);
		await StorageService.set("weatherAutoRefresh", newValue);
	};

	const toggleNotifications = async () => {
		const newValue = !showNotifications;
		setShowNotifications(newValue);
		await StorageService.set("weatherNotifications", newValue);

		if (newValue && "Notification" in window) {
			Notification.requestPermission();
		}
	};

	const toggleTheme = async () => {
		const newTheme = theme === "dark" ? "light" : "dark";
		setTheme(newTheme);
		await StorageService.set("weatherTheme", newTheme);
	};

	const clearAllData = async () => {
		if (confirm("Tüm favori ve geçmiş verileri silmek istediğinizden emin misiniz?")) {
			await StorageService.delete("weatherFavorites");
			await StorageService.delete("weatherRecentSearches");
			setFavorites([]);
			setRecentSearches([]);
			alert("Tüm veriler temizlendi!");
		}
	};

	const convertTemp = (temp) => {
		if (unit === "imperial") {
			return Math.round((temp * 9) / 5 + 32);
		}
		return temp;
	};

	const getTempUnit = () => (unit === "metric" ? "°C" : "°F");

	const shareWeather = () => {
		if (!weather) return;
		const text = `${weather.name}: ${weather.temp}°C, ${weather.description}`;
		if (navigator.share) {
			navigator.share({ title: "Hava Durumu", text });
		} else {
			navigator.clipboard.writeText(text);
			alert("Hava durumu panoya kopyalandı!");
		}
	};

	const getDayName = (dateString) => {
		const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
		const date = new Date(dateString);
		return days[date.getDay()];
	};

	const getBackgroundClass = () => {
		if (theme === "light") {
			return "from-blue-100 via-cyan-50 to-white";
		}

		return "from-gray-900 via-slate-900 to-black";
	};

	const getClothingSuggestion = () => {
		if (!weather) return null;
		const temp = weather.temp;
		const condition = weather.condition.toLowerCase();

		let suggestion = "";
		if (temp < 0) suggestion = "❄️ Çok soğuk! Kalın mont, eldiven ve bere şart";
		else if (temp < 10) suggestion = "🧥 Soğuk hava! Mont veya kalın ceket giyin";
		else if (temp < 20) suggestion = "👔 Ilıman hava. Hırka veya ince ceket yeterli";
		else if (temp < 25) suggestion = "👕 Rahat hava. Tişört veya gömlek uygun";
		else suggestion = "🩳 Sıcak hava! Hafif giysiler tercih edin";

		if (condition.includes("rain")) suggestion += " + ☔ Şemsiye almayı unutmayın!";
		if (condition.includes("snow")) suggestion += " + ⛄ Kar botları giyin!";

		return suggestion;
	};

	const getActivitySuggestion = () => {
		if (!weather) return null;
		const temp = weather.temp;
		const condition = weather.condition.toLowerCase();

		if (condition.includes("rain")) return "🏠 İç mekan aktiviteleri için ideal";
		if (condition.includes("snow")) return "⛷️ Kış sporları için harika!";
		if (condition.includes("clear") && temp > 15 && temp < 30) return "🚴 Dış aktiviteler için mükemmel!";
		if (temp > 30) return "🏊 Yüzme veya gölgede aktivite önerilir";
		if (temp < 5) return "☕ Sıcak içeceklerle içeride kalın";
		return "🌤️ Hafif aktiviteler için uygun";
	};

	const getAirQualityText = (aqi) => {
		if (!aqi) return null;
		if (aqi <= 50) return { text: "İyi", color: "text-green-400", bg: "bg-green-500/20" };
		if (aqi <= 100) return { text: "Orta", color: "text-yellow-400", bg: "bg-yellow-500/20" };
		if (aqi <= 150) return { text: "Hassas Gruplar İçin Zararlı", color: "text-orange-400", bg: "bg-orange-500/20" };
		if (aqi <= 200) return { text: "Sağlıksız", color: "text-red-400", bg: "bg-red-500/20" };
		if (aqi <= 300) return { text: "Çok Sağlıksız", color: "text-purple-400", bg: "bg-purple-500/20" };
		return { text: "Tehlikeli", color: "text-red-600", bg: "bg-red-600/20" };
	};

	const getUVIndexText = (uv) => {
		if (uv <= 2) return { text: "Düşük", color: "text-green-400" };
		if (uv <= 5) return { text: "Orta", color: "text-yellow-400" };
		if (uv <= 7) return { text: "Yüksek", color: "text-orange-400" };
		if (uv <= 10) return { text: "Çok Yüksek", color: "text-red-400" };
		return { text: "Aşırı", color: "text-purple-400" };
	};

	const formatTime = (timestamp) => {
		return new Date(timestamp * 1000).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
	};

	const startComparison = async (cityName) => {
		try {
			const weatherData = await WeatherService.getCurrentWeather(cityName);
			const processedData = processWeatherData(weatherData);

			if (!compareCity1) {
				setCompareCity1(processedData);
			} else if (!compareCity2) {
				setCompareCity2(processedData);
			}
		} catch (err) {
			alert("Şehir bulunamadı!");
		}
	};

	const closeComparison = () => {
		setCompareMode(false);
		setCompareCity1(null);
		setCompareCity2(null);
	};

	// Temperature chart data
	const chartData = useMemo(() => {
		return hourlyForecast.map((hour) => ({
			time: hour.time,
			temp: convertTemp(hour.temp),
			humidity: hour.humidity,
		}));
	}, [hourlyForecast, unit]);

	const textColor = theme === "light" ? "text-gray-900" : "text-white";
	const textSecondary = theme === "light" ? "text-gray-600" : "text-white/70";
	const bgCard = theme === "light" ? "bg-white/80" : "bg-white/5";
	const borderColor = theme === "light" ? "border-gray-200" : "border-white/10";

	return (
		<div
			className={`select-none min-h-screen min-w-screen bg-gradient-to-br ${getBackgroundClass()} transition-all duration-1000 flex items-center justify-center p-4 z-10`}
		>
			<div className="w-full max-w-6xl">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<CloudRain className={`w-10 h-10 ${theme === "light" ? "text-blue-600" : "text-blue-400"}`} />
						<h1 className={`${textColor} text-3xl font-bold`}>Hava Durumu Pro</h1>
					</div>
					<div className="flex gap-2">
						<button
							onClick={toggleTheme}
							className={`${bgCard} hover:bg-white/10 p-3 rounded-xl border ${borderColor} transition-all`}
							title={theme === "light" ? "Karanlık Mod" : "Aydınlık Mod"}
						>
							{theme === "light" ? <Moon className="w-6 h-6 text-gray-900" /> : <Sun className="w-6 h-6 text-white" />}
						</button>
						<button
							onClick={() => setShowSettings(!showSettings)}
							className={`${bgCard} hover:bg-white/10 p-3 rounded-xl border ${borderColor} transition-all`}
						>
							<Settings className={`w-6 h-6 ${textColor}`} />
						</button>
					</div>
				</div>

				{/* Offline Mode Banner */}
				{offlineMode && (
					<div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6 backdrop-blur-lg">
						<div className="flex items-center gap-3">
							<AlertTriangle className="w-6 h-6 text-orange-400" />
							<p className="text-orange-300">Çevrimdışı mod: Önbellekteki veriler gösteriliyor</p>
						</div>
					</div>
				)}

				{/* Settings Panel */}
				{showSettings && (
					<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-6 mb-6 border ${borderColor}`}>
						<div className="flex justify-between items-center mb-6">
							<h3 className={`${textColor} text-2xl font-bold flex items-center gap-2`}>
								<Settings className="w-6 h-6" />
								Ayarlar
							</h3>
							<button onClick={() => setShowSettings(false)} className="hover:bg-white/10 p-2 rounded-lg transition-all">
								<X className={`w-6 h-6 ${textSecondary} hover:${textColor}`} />
							</button>
						</div>

						<div className="space-y-6">
							<div>
								<label className={`${textColor} font-semibold mb-3 flex items-center gap-2`}>
									<Thermometer className="w-5 h-5 text-blue-400" />
									Sıcaklık Birimi
								</label>
								<div className="grid grid-cols-2 gap-3">
									<button
										onClick={() => updateUnit("metric")}
										className={`px-4 py-3 rounded-xl border transition-all ${
											unit === "metric" ? "bg-blue-600 border-blue-500 text-white" : `${bgCard} ${borderColor} ${textSecondary} hover:bg-white/10`
										}`}
									>
										Celsius (°C)
									</button>
									<button
										onClick={() => updateUnit("imperial")}
										className={`px-4 py-3 rounded-xl border transition-all ${
											unit === "imperial" ? "bg-blue-600 border-blue-500 text-white" : `${bgCard} ${borderColor} ${textSecondary} hover:bg-white/10`
										}`}
									>
										Fahrenheit (°F)
									</button>
								</div>
							</div>

							<div>
								<label className={`${textColor} font-semibold mb-3 flex items-center gap-2`}>
									<Globe className="w-5 h-5 text-green-400" />
									Dil
								</label>
								<div className="grid grid-cols-2 gap-3">
									<button
										onClick={() => updateLanguage("tr")}
										className={`px-4 py-3 rounded-xl border transition-all ${
											language === "tr" ? "bg-green-600 border-green-500 text-white" : `${bgCard} ${borderColor} ${textSecondary} hover:bg-white/10`
										}`}
									>
										🇹🇷 Türkçe
									</button>
									<button
										onClick={() => updateLanguage("en")}
										className={`px-4 py-3 rounded-xl border transition-all ${
											language === "en" ? "bg-green-600 border-green-500 text-white" : `${bgCard} ${borderColor} ${textSecondary} hover:bg-white/10`
										}`}
									>
										🇬🇧 English
									</button>
								</div>
							</div>

							<div className={`flex items-center justify-between ${bgCard} p-4 rounded-xl border ${borderColor}`}>
								<div className="flex items-center gap-3">
									<RefreshCw className="w-5 h-5 text-purple-400" />
									<div>
										<p className={`${textColor} font-semibold`}>Otomatik Yenileme</p>
										<p className={`${textSecondary} text-sm`}>Her 10 dakikada bir güncelle</p>
									</div>
								</div>
								<button onClick={toggleAutoRefresh} className={`w-12 h-6 rounded-full transition-all ${autoRefresh ? "bg-blue-600" : "bg-white/20"}`}>
									<div className={`w-5 h-5 bg-white rounded-full transition-all ${autoRefresh ? "translate-x-6" : "translate-x-1"}`}></div>
								</button>
							</div>

							<div className={`flex items-center justify-between ${bgCard} p-4 rounded-xl border ${borderColor}`}>
								<div className="flex items-center gap-3">
									<Zap className="w-5 h-5 text-yellow-400" />
									<div>
										<p className={`${textColor} font-semibold`}>Bildirimler</p>
										<p className={`${textSecondary} text-sm`}>Hava durumu uyarıları</p>
									</div>
								</div>
								<button
									onClick={toggleNotifications}
									className={`w-12 h-6 rounded-full transition-all ${showNotifications ? "bg-blue-600" : "bg-white/20"}`}
								>
									<div className={`w-5 h-5 bg-white rounded-full transition-all ${showNotifications ? "translate-x-6" : "translate-x-1"}`}></div>
								</button>
							</div>

							<div className={`${bgCard} p-4 rounded-xl border ${borderColor}`}>
								<h4 className={`${textColor} font-semibold mb-3 flex items-center gap-2`}>
									<BarChart3 className="w-5 h-5 text-cyan-400" />
									İstatistikler
								</h4>
								<div className={`space-y-2 ${textSecondary} text-sm`}>
									<p>
										📍 Favori Şehirler: <span className={`${textColor} font-semibold`}>{favorites.length}</span>
									</p>
									<p>
										🔍 Son Aramalar: <span className={`${textColor} font-semibold`}>{recentSearches.length}</span>
									</p>
									<p>
										💾 Veri Kullanımı:{" "}
										<span className={`${textColor} font-semibold`}>~{(favorites.length * 0.5 + recentSearches.length * 0.3).toFixed(1)} KB</span>
									</p>
								</div>
							</div>

							<div className="space-y-3">
								<h4 className={`${textColor} font-semibold flex items-center gap-2`}>
									<Activity className="w-5 h-5 text-red-400" />
									Veri Yönetimi
								</h4>
								<button
									onClick={clearAllData}
									className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl transition-all"
								>
									🗑️ Tüm Verileri Temizle
								</button>
							</div>

							<div className={`${bgCard} p-4 rounded-xl border ${borderColor}`}>
								<h4 className={`${textColor} font-semibold mb-2`}>📱 Hakkında</h4>
								<p className={`${textSecondary} text-sm mb-2`}>Hava Durumu Pro v3.0</p>
								<p className={`${theme === "light" ? "text-gray-500" : "text-white/50"} text-xs`}>OpenWeather API kullanılarak geliştirilmiştir.</p>
							</div>
						</div>
					</div>
				)}

				{/* Search Box */}
				<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl border ${borderColor}`}>
					<div className="flex gap-3 mb-4 max-lg:flex-col items-center justify-center">
						<input
							type="text"
							value={city}
							onChange={(e) => {
								setCity(e.target.value);
								setSearchInput(e.target.value);
							}}
							onKeyPress={(e) => e.key === "Enter" && searchWeather()}
							placeholder="Şehir ara..."
							className={`flex-1 max-lg:w-full ${theme === "light" ? "bg-gray-100 text-gray-900 placeholder-gray-500" : "bg-black/30 text-white placeholder-white/40"} rounded-2xl px-6 py-4 outline-none border ${borderColor} focus:border-blue-400 transition-all`}
						/>
						<button
							onClick={() => searchWeather()}
							disabled={loading}
							className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white max-lg:w-full px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50"
						>
							{loading ? "..." : "Ara"}
						</button>
					</div>

					{recentSearches.length > 0 && !weather && (
						<div className="mb-4">
							<p className={`${textSecondary} text-sm mb-2`}>Son Aramalar:</p>
							<div className="flex flex-wrap gap-2">
								{recentSearches.map((search, idx) => (
									<button
										key={idx}
										onClick={() => searchWeather(search)}
										className={`${bgCard} hover:bg-white/10 px-4 py-2 rounded-xl ${textSecondary} text-sm border ${borderColor} transition-all flex items-center gap-1`}
									>
										<Clock className="w-3 h-3" />
										{search}
									</button>
								))}
							</div>
						</div>
					)}

					<div className="flex items-center justify-center">
						<div className={`h-px ${theme === "light" ? "bg-gray-200" : "bg-white/10"} flex-1`}></div>
						<span className={`${textSecondary} text-sm px-4`}>veya</span>
						<div className={`h-px ${theme === "light" ? "bg-gray-200" : "bg-white/10"} flex-1`}></div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
						<button
							onClick={getLocationWeather}
							disabled={loading}
							className={`${bgCard} hover:bg-white/10 ${textColor} px-6 py-4 rounded-2xl font-semibold border ${borderColor} transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50`}
						>
							<MapPin className="w-5 h-5" />
							Konumumdaki Hava
						</button>
						<button
							onClick={() => setCompareMode(!compareMode)}
							className={`${bgCard} hover:bg-white/10 ${textColor} px-6 py-4 rounded-2xl font-semibold border ${borderColor} transition-all duration-200 flex items-center justify-center gap-3`}
						>
							<TrendingUp className="w-5 h-5" />
							Şehir Karşılaştır
						</button>
					</div>

					{compareMode && (
						<div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
							<p className={`${textColor} mb-3`}>İki şehir seçin:</p>
							<div className="grid grid-cols-2 gap-3">
								<input
									type="text"
									placeholder="1. Şehir"
									className={`${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-black/30 text-white"} px-4 py-2 rounded-xl outline-none`}
									onKeyPress={(e) => {
										if (e.key === "Enter") startComparison(e.target.value);
									}}
								/>
								<input
									type="text"
									placeholder="2. Şehir"
									className={`${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-black/30 text-white"} px-4 py-2 rounded-xl outline-none`}
									onKeyPress={(e) => {
										if (e.key === "Enter") startComparison(e.target.value);
									}}
								/>
							</div>
							{compareCity1 && compareCity2 && (
								<button onClick={() => {}} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all">
									Karşılaştır
								</button>
							)}
						</div>
					)}
				</div>

				{/* Favorites */}
				{favorites.length > 0 && !weather && (
					<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-6 mb-6 border ${borderColor}`}>
						<div className="flex items-center gap-3 mb-4">
							<Star className="w-6 h-6 text-yellow-400" />
							<h3 className={`${textColor} text-xl font-bold`}>Favoriler</h3>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{favorites.map((fav, idx) => (
								<div key={idx} className={`${bgCard} rounded-xl p-3 border ${borderColor} hover:bg-white/10 transition-all`}>
									<button onClick={() => searchWeather(fav.city)} className="w-full text-left">
										<div className="flex justify-between items-center">
											<p className={`${textColor} font-semibold truncate`}>{fav.city}</p>
											<span className={`${textColor} text-sm`}>
												{convertTemp(fav.temp)}
												{getTempUnit()}
											</span>
										</div>
										<div className="flex items-center gap-2 mt-1">
											{getWeatherIcon(fav.condition, "w-6 h-6")}
											<p className={`${textSecondary} text-xs truncate`}>{fav.name}</p>
										</div>
									</button>
									<button onClick={() => removeFavorite(fav.city)} className="mt-2 text-red-400 text-xs hover:underline">
										Kaldır
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-300 text-center backdrop-blur-lg animate-shake">
						{error}
					</div>
				)}

				{/* Loading */}
				{loading && <SkeletonLoader />}

				{/* Weather Display */}
				{!loading && weather && (
					<>
						<div className="grid md:grid-cols-3 gap-6 mb-6 animate-fadeIn w-full">
							<div
								className={`w-full md:col-span-2 ${bgCard} backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl border ${borderColor} transition-all duration-300`}
							>
								{/* Üst Kısım: Lokasyon ve Butonlar */}
								<div className="flex justify-between items-center mb-6 gap-4">
									<div className="flex items-center gap-2 min-w-0">
										<MapPin className="w-5 h-5 md:w-6 md:h-6 text-blue-400 shrink-0" />
										<h2 className={`${textColor} text-2xl md:text-4xl font-bold truncate max-lg:text-wrap`}>{weather.name}</h2>
									</div>

									<div className="flex gap-2 shrink-0 max-lg:flex-col">
										<button
											onClick={toggleFavorite}
											className={`${isFavorite() ? "bg-yellow-500/20 border-yellow-500/50" : `${bgCard} ${borderColor}`} hover:bg-white/10 p-2.5 md:p-3 rounded-xl border transition-all`}
											title={isFavorite() ? "Favorilerden Çıkar" : "Favorilere Ekle"}
										>
											<Star className={`w-5 h-5 ${isFavorite() ? "text-yellow-400 fill-yellow-400" : "text-yellow-400"}`} />
										</button>
										<button
											onClick={shareWeather}
											className={`${bgCard} hover:bg-white/10 p-2.5 md:p-3 rounded-xl border ${borderColor} transition-all`}
											title="Paylaş"
										>
											<Share2 className="w-5 h-5 text-blue-400" />
										</button>
									</div>
								</div>

								{/* Orta Kısım: Açıklama ve İkon */}
								<div className="flex flex-col items-center justify-center">
									<p className={`${textSecondary} text-base md:text-lg mb-4 text-center italic`}>{weather.description}</p>

									<div className="mb-4 transform scale-90 md:scale-100 transition-transform">{getWeatherIcon(weather.condition)}</div>

									<div className={`text-6xl md:text-8xl font-bold ${textColor} mb-2 text-center tracking-tighter`}>
										{convertTemp(weather.temp)}
										{getTempUnit()}
									</div>

									<p className={`${textSecondary} text-base md:text-lg text-center`}>
										Hissedilen:{" "}
										<span className="font-medium">
											{convertTemp(weather.feelsLike)}
											{getTempUnit()}
										</span>
									</p>
								</div>

								{/* Alt Kısım: Bilgi Kartları */}
								<div className="mt-8 grid grid-cols-2 gap-3 md:gap-4 max-lg:grid-cols-1 max-lg:grid-rows-2">
									<div className={`${bgCard} rounded-2xl p-3 md:p-4 border ${borderColor} flex flex-col items-center md:items-start`}>
										<Sunrise className="w-5 h-5 text-orange-400 mb-1.5" />
										<p className={`${textSecondary} text-[10px] md:text-xs uppercase tracking-wider`}>Gün Doğumu</p>
										<p className={`${textColor} text-base md:text-lg font-semibold`}>{formatTime(weather.sunrise)}</p>
									</div>

									<div className={`${bgCard} rounded-2xl p-3 md:p-4 border ${borderColor} flex flex-col items-center md:items-start`}>
										<Sunset className="w-5 h-5 text-orange-400 mb-1.5" />
										<p className={`${textSecondary} text-[10px] md:text-xs uppercase tracking-wider`}>Gün Batımı</p>
										<p className={`${textColor} text-base md:text-lg font-semibold`}>{formatTime(weather.sunset)}</p>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-1 gap-4 max-lg:grid-cols-1">
								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-4 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-2">
										<Droplets className="w-5 h-5 text-blue-400" />
										<span className={`${textSecondary} text-sm`}>Nem</span>
									</div>
									<p className={`${textColor} text-2xl font-bold`}>{weather.humidity}%</p>
								</div>

								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-4 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-2">
										<Wind className="w-5 h-5 text-blue-400" />
										<span className={`${textSecondary} text-sm`}>Rüzgar</span>
									</div>
									<p className={`${textColor} text-2xl font-bold`}>{weather.windSpeed} km/h</p>
								</div>

								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-4 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-2">
										<Eye className="w-5 h-5 text-blue-400" />
										<span className={`${textSecondary} text-sm`}>Görüş</span>
									</div>
									<p className={`${textColor} text-2xl font-bold`}>{weather.visibility} km</p>
								</div>

								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-4 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-2">
										<Gauge className="w-5 h-5 text-blue-400" />
										<span className={`${textSecondary} text-sm`}>Basınç</span>
									</div>
									<p className={`${textColor} text-2xl font-bold`}>{weather.pressure} mb</p>
								</div>
							</div>
						</div>

						<div className="grid md:grid-cols-2 gap-6 mb-6">
							<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-6 border ${borderColor}`}>
								<div className="flex items-center gap-3 mb-3">
									<Shirt className="w-6 h-6 text-purple-400" />
									<h3 className={`${textColor} text-lg font-bold`}>Giyim Önerisi</h3>
								</div>
								<p className={textSecondary}>{getClothingSuggestion()}</p>
							</div>

							<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-6 border ${borderColor}`}>
								<div className="flex items-center gap-3 mb-3">
									<Activity className="w-6 h-6 text-green-400" />
									<h3 className={`${textColor} text-lg font-bold`}>Aktivite Önerisi</h3>
								</div>
								<p className={textSecondary}>{getActivitySuggestion()}</p>
							</div>
						</div>

						<div className="grid md:grid-cols-3 gap-6 mb-6">
							{airQuality && (
								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-6 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-3">
										<Zap className="w-6 h-6 text-yellow-400" />
										<h3 className={`${textColor} text-lg font-bold`}>Hava Kalitesi</h3>
									</div>
									<div className={`inline-block px-4 py-2 rounded-xl ${getAirQualityText(airQuality)?.bg}`}>
										<p className={`font-semibold ${getAirQualityText(airQuality)?.color}`}>
											AQI: {airQuality} - {getAirQualityText(airQuality)?.text}
										</p>
									</div>
								</div>
							)}

							{uvIndex !== null && (
								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-6 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-3">
										<Sun className="w-6 h-6 text-yellow-400" />
										<h3 className={`${textColor} text-lg font-bold`}>UV İndeksi</h3>
									</div>
									<div>
										<p className={`text-3xl font-bold ${getUVIndexText(uvIndex)?.color}`}>{uvIndex}</p>
										<p className={`text-sm ${getUVIndexText(uvIndex)?.color}`}>{getUVIndexText(uvIndex)?.text}</p>
									</div>
								</div>
							)}

							{pollenLevel && (
								<div className={`${bgCard} backdrop-blur-lg rounded-2xl p-6 border ${borderColor}`}>
									<div className="flex items-center gap-3 mb-3">
										<Waves className="w-6 h-6 text-green-400" />
										<h3 className={`${textColor} text-lg font-bold`}>Polen Seviyesi</h3>
									</div>
									<p className={`text-2xl font-bold ${textColor}`}>{pollenLevel}</p>
								</div>
							)}
						</div>

						{chartData.length > 0 && (
							<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl border ${borderColor}`}>
								<div className="flex items-center gap-3 mb-6">
									<BarChart3 className="w-6 h-6 text-blue-400" />
									<h3 className={`${textColor} text-2xl font-bold`}>Sıcaklık Grafiği</h3>
								</div>
								<ResponsiveContainer width="100%" height={200}>
									<AreaChart data={chartData}>
										<defs>
											<linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
												<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
											</linearGradient>
										</defs>
										<XAxis dataKey="time" stroke={theme === "light" ? "#666" : "#fff"} />
										<YAxis stroke={theme === "light" ? "#666" : "#fff"} />
										<Tooltip
											contentStyle={{
												backgroundColor: theme === "light" ? "#fff" : "rgba(0,0,0,0.8)",
												border: "1px solid rgba(255,255,255,0.1)",
												borderRadius: "12px",
												color: theme === "light" ? "#000" : "#fff",
											}}
										/>
										<Area type="monotone" dataKey="temp" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTemp)" />
									</AreaChart>
								</ResponsiveContainer>
							</div>
						)}

						{hourlyForecast.length > 0 && (
							<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl border ${borderColor}`}>
								<div className="flex items-center gap-3 mb-6">
									<Clock className="w-6 h-6 text-blue-400" />
									<h3 className={`${textColor} text-2xl font-bold`}>Saatlik Tahmin</h3>
								</div>
								<div className="overflow-x-auto">
									<div className="flex gap-4 pb-2">
										{hourlyForecast.map((hour, idx) => (
											<div
												key={idx}
												className={`${bgCard} rounded-2xl p-4 border ${borderColor} min-w-[100px] text-center hover:bg-white/10 transition-all`}
											>
												<p className={`${textSecondary} text-sm mb-2`}>{hour.time}</p>
												<div className="flex justify-center mb-2">{getWeatherIcon(hour.condition, "w-10 h-10")}</div>
												<p className={`${textColor} text-xl font-bold`}>
													{convertTemp(hour.temp)}
													{getTempUnit()}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{forecast.length > 0 && (
							<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-6 shadow-2xl border ${borderColor}`}>
								<div className="flex items-center gap-3 mb-6">
									<Calendar className="w-6 h-6 text-blue-400" />
									<h3 className={`${textColor} text-2xl font-bold`}>5 Günlük Tahmin</h3>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
									{forecast.map((day, index) => (
										<div
											key={index}
											className={`${bgCard} rounded-2xl p-4 border ${borderColor} text-center hover:bg-white/10 transition-all cursor-pointer hover:scale-105`}
										>
											<p className={`${textSecondary} text-sm mb-3`}>{getDayName(day.date)}</p>
											<div className="flex justify-center mb-3">{getWeatherIcon(day.condition, "w-12 h-12")}</div>
											<p className={`${textColor} text-2xl font-bold mb-2`}>
												{convertTemp(day.temp)}
												{getTempUnit()}
											</p>
											<p className={`${textSecondary} text-xs mb-1`}>
												{convertTemp(day.tempMax)}
												{getTempUnit()} / {convertTemp(day.tempMin)}
												{getTempUnit()}
											</p>
											<p className={`${theme === "light" ? "text-gray-500" : "text-white/50"} text-xs`}>{day.description}</p>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}

				{/* Empty State */}
				{!loading && !weather && (
					<div className={`${bgCard} backdrop-blur-lg rounded-3xl p-12 shadow-2xl border ${borderColor} text-center`}>
						<Cloud className={`w-24 h-24 ${theme === "light" ? "text-gray-400" : "text-white/50"} mx-auto mb-4`} />
						<h3 className={`${textColor} text-2xl font-semibold mb-2`}>Hava Durumunu Öğren</h3>
						<p className={`${textSecondary} mb-6`}>Bir şehir adı girerek veya konumunuzu kullanarak detaylı hava durumu bilgilerine ulaşın</p>
						<div className="flex flex-wrap justify-center gap-3">
							<div className={`${bgCard} px-4 py-2 rounded-xl border ${borderColor}`}>
								<BarChart3 className="w-5 h-5 text-blue-400 inline mr-2" />
								<span className={`${textSecondary} text-sm`}>Saatlik Tahmin</span>
							</div>
							<div className={`${bgCard} px-4 py-2 rounded-xl border ${borderColor}`}>
								<Shirt className="w-5 h-5 text-purple-400 inline mr-2" />
								<span className={`${textSecondary} text-sm`}>Giyim Önerisi</span>
							</div>
							<div className={`${bgCard} px-4 py-2 rounded-xl border ${borderColor}`}>
								<Star className="w-5 h-5 text-yellow-400 inline mr-2" />
								<span className={`${textSecondary} text-sm`}>Favoriler</span>
							</div>
							<div className={`${bgCard} px-4 py-2 rounded-xl border ${borderColor}`}>
								<Zap className="w-5 h-5 text-green-400 inline mr-2" />
								<span className={`${textSecondary} text-sm`}>Hava Kalitesi</span>
							</div>
							<div className={`${bgCard} px-4 py-2 rounded-xl border ${borderColor}`}>
								<Sun className="w-5 h-5 text-orange-400 inline mr-2" />
								<span className={`${textSecondary} text-sm`}>UV İndeksi</span>
							</div>
							<div className={`${bgCard} px-4 py-2 rounded-xl border ${borderColor}`}>
								<Waves className="w-5 h-5 text-pink-400 inline mr-2" />
								<span className={`${textSecondary} text-sm`}>Polen Seviyesi</span>
							</div>
						</div>
					</div>
				)}

				{/* Comparison Modal */}
				{compareCity1 && compareCity2 && (
					<WeatherComparison city1Data={compareCity1} city2Data={compareCity2} onClose={closeComparison} getWeatherIcon={getWeatherIcon} />
				)}

				{/* Footer */}
				<div className={`text-center mt-8 ${textSecondary} text-sm`}>
					<p>
						Bir{" "}
						<a target="_blank" href="https://acobnn.netlify.app" className="text-blue-400">
							Atakan Çoban
						</a>{" "}
						uygulamasıdır.
					</p>
					<p className="mt-1">© 2026 - Tüm hakları MIT lisansı ile saklanmaktadır.</p>
				</div>
			</div>

			<style>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				@keyframes shake {
					0%,
					100% {
						transform: translateX(0);
					}
					25% {
						transform: translateX(-10px);
					}
					75% {
						transform: translateX(10px);
					}
				}
				.animate-fadeIn {
					animation: fadeIn 0.5s ease-out;
				}
				.animate-shake {
					animation: shake 0.5s ease-in-out;
				}
			`}</style>
		</div>
	);
}
