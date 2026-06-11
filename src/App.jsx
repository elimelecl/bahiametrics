import React, { useState, useEffect, useCallback } from 'react';
import DashboardCard from './components/DashboardCard';
import WindCompass from './components/WindCompass';
import TideChart from './components/TideChart';
import WeatherForecast from './components/WeatherForecast';
import { Waves, Wind, Thermometer, Droplets, Clock, CalendarDays, Eye, Gauge, SunMedium, Anchor } from 'lucide-react';
import './index.css';

/**
 https://api.openweathermap.org/data/2.5/weather?lat=10.287433&lon=-75.539158&appid=44e1a3ec6775eaf99482bd91feaf2f47&units=metric
 **/

const LAT = 10.287433;
const LON = -75.539158;

const StatusBadge = ({ loading, onZero }) => {
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    if (loading) {
      setCountdown(300);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (countdown === 0 && !loading) {
      onZero();
      setCountdown(300);
    }
  }, [countdown, loading, onZero]);

  return (
    <div className="status-badge">
      <Clock size={16} />
      <span>{loading ? "Cargando..." : `Actualización en: ${countdown}s`}</span>
    </div>
  );
};

function App() {
  const [tideData, setTideData] = useState([]);
  const [windData, setWindData] = useState({ speed: 0, gusts: 0, direction: 0 });
  const [weatherData, setWeatherData] = useState({ temperature: 0, humidity: 0 });
  const [extraData, setExtraData] = useState({ pressure: 0, visibility: 0, uvIndex: 0, feelsLike: 0 });
  const [forecastData, setForecastData] = useState([]);
  const [tideUpdateDate, setTideUpdateDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('Cargando...');

  const fetchRealData = useCallback(async () => {
    try {
      const OWM_KEY = '44e1a3ec6775eaf99482bd91feaf2f47';
      let usingOWM = false;

      // Intentar obtener datos de OpenWeatherMap primero
      try {
        const owmRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}&units=metric`);
        const owmJson = await owmRes.json();

        if (owmRes.ok && owmJson.cod === 200) {
          usingOWM = true;
          setDataSource('OpenWeatherMap');
          // Conversión de m/s a nudos (kt)
          const mpsToKt = (mps) => Number((mps * 1.94384).toFixed(1));

          let finalGusts = owmJson.wind.gust ? mpsToKt(owmJson.wind.gust) : null;

          // Siempre extraemos UV Index de Open-Meteo, y usamos gusts si faltan en OWM
          let uvIndexVal = 0;
          try {
            const omRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=wind_gusts_10m,uv_index&wind_speed_unit=kn`);
            const omJson = await omRes.json();
            if (omJson.current) {
              uvIndexVal = omJson.current.uv_index || 0;
              if (finalGusts === null && omJson.current.wind_gusts_10m) {
                finalGusts = omJson.current.wind_gusts_10m;
              } else if (finalGusts === null) {
                finalGusts = 0;
              }
            }
          } catch (e) {
            if (finalGusts === null) finalGusts = 0;
          }

          const speedKt = mpsToKt(owmJson.wind.speed);
          setWindData({
            speed: speedKt,
            gusts: Math.max(finalGusts, speedKt),
            direction: owmJson.wind.deg
          });
          setWeatherData({
            temperature: Math.round(owmJson.main.temp * 10) / 10,
            humidity: owmJson.main.humidity
          });
          setExtraData(prev => ({
            ...prev,
            pressure: owmJson.main.pressure || 0,
            visibility: owmJson.visibility ? (owmJson.visibility / 1000).toFixed(1) : 0,
            uvIndex: uvIndexVal,
            feelsLike: Math.round(owmJson.main.feels_like * 10) / 10
          }));

          // Fetch OWM Forecast (cada 3 horas)
          const owmForecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}&units=metric`);
          const owmForecastJson = await owmForecastRes.json();

          if (owmForecastRes.ok && owmForecastJson.list) {
            const getWmoCode = (owmId) => {
              if (owmId >= 200 && owmId < 300) return 95; // storm
              if (owmId >= 300 && owmId < 400) return 51; // drizzle
              if (owmId >= 500 && owmId < 600) return 61; // rain
              if (owmId >= 600 && owmId < 700) return 71; // snow
              if (owmId >= 700 && owmId < 800) return 45; // fog
              if (owmId === 800) return 0; // clear
              if (owmId > 800) return 2; // clouds
              return 0;
            };

            const forecast = owmForecastJson.list.slice(0, 4).map(item => {
              const date = new Date(item.dt * 1000);
              return {
                time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                weather_code: getWmoCode(item.weather[0].id),
                temp: item.main.temp,
                prob: Math.round(item.pop * 100)
              };
            });
            setForecastData(forecast);
          }
        } else {
          console.warn("OpenWeatherMap falló (quizás la clave no está activa aún). Cod:", owmJson.cod);
        }
      } catch (e) {
        console.warn("Error contactando OpenWeatherMap:", e);
      }

      // FALLBACK a Open-Meteo si OWM falló (útil mientras la API Key se activa)
      if (!usingOWM) {
        setDataSource('Open-Meteo');
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,uv_index&hourly=temperature_2m,precipitation_probability,weather_code,visibility&wind_speed_unit=kn&timezone=auto`
        );
        const weatherJson = await weatherRes.json();

        if (weatherJson.current) {
          const omSpeed = weatherJson.current.wind_speed_10m;
          const omGusts = weatherJson.current.wind_gusts_10m;
          setWindData({
            speed: omSpeed,
            gusts: Math.max(omGusts, omSpeed),
            direction: weatherJson.current.wind_direction_10m
          });
          setWeatherData({
            temperature: weatherJson.current.temperature_2m,
            humidity: weatherJson.current.relative_humidity_2m
          });
          setExtraData(prev => ({
            ...prev,
            pressure: weatherJson.current.surface_pressure,
            uvIndex: weatherJson.current.uv_index,
            visibility: weatherJson.hourly?.visibility ? (weatherJson.hourly.visibility[0] / 1000).toFixed(1) : 0,
            feelsLike: weatherJson.current.temperature_2m
          }));
        }

        if (weatherJson.hourly) {
          const hourly = weatherJson.hourly;
          const now = new Date();
          let startIndex = 0;
          for (let i = 0; i < hourly.time.length; i++) {
            if (new Date(hourly.time[i]) >= now) {
              startIndex = i > 0 ? i - 1 : 0;
              break;
            }
          }
          const forecast = [];
          for (let i = startIndex; i < Math.min(startIndex + 12, hourly.time.length); i++) {
            const date = new Date(hourly.time[i]);
            forecast.push({
              time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              weather_code: hourly.weather_code[i],
              temp: hourly.temperature_2m[i],
              prob: hourly.precipitation_probability[i]
            });
          }
          setForecastData(forecast);
        }
      }

      // Fetch Astronomical Tide Data (Stormglass con Caché para evitar límite de 10 peticiones)
      const STORMGLASS_KEY = 'ef602380-5c76-11f1-b37b-0242ac120004-ef6023e4-5c76-11f1-b37b-0242ac120004';
      const CACHE_KEY = 'tideCache';
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

      try {
        let tideJson = null;
        let updateTimestamp = Date.now();
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
            tideJson = parsedCache.data;
            updateTimestamp = parsedCache.timestamp;
          }
        }

        if (!tideJson) {
          const tideRes = await fetch(
            `https://api.stormglass.io/v2/tide/sea-level/point?lat=${LAT}&lng=${LON}&datum=MLLW`,
            { headers: { 'Authorization': STORMGLASS_KEY } }
          );
          tideJson = await tideRes.json();
          if (tideJson.data) {
            updateTimestamp = Date.now();
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: updateTimestamp,
              data: tideJson
            }));
          }
        }

        if (tideJson && tideJson.data) {
          setTideUpdateDate(new Date(updateTimestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }));

          const now = new Date();
          const formattedData = [];

          let startIndex = 0;
          for (let i = 0; i < tideJson.data.length; i++) {
            if (new Date(tideJson.data[i].time) >= now) {
              startIndex = i > 0 ? i - 1 : 0;
              break;
            }
          }

          const endOfTomorrow = new Date();
          endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
          endOfTomorrow.setHours(23, 59, 59, 999);

          for (let i = startIndex; i < tideJson.data.length; i++) {
            const item = tideJson.data[i];
            const date = new Date(item.time);

            if (date > endOfTomorrow) {
              break;
            }

            // Mantener metros (m)
            const levelInM = item.sg !== undefined ? Number(item.sg.toFixed(2)) : 0;

            const dayStr = date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' });
            const formattedDay = dayStr.charAt(0).toUpperCase() + dayStr.slice(1).replace(',', '');
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            formattedData.push({
              time: `${formattedDay}|${timeStr}`,
              tooltipTime: `${formattedDay} - ${timeStr}`,
              level: levelInM
            });
          }

          setTideData(formattedData);
        }
      } catch (err) {
        console.error("Error fetching tide data:", err);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial
    fetchRealData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Aplicación visible nuevamente, actualizando datos...");
        fetchRealData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchRealData]);

  return (
    <div className="app-container">
      <div className="background-glow"></div>

      <header className="app-header">
        <div>
          <h1 className="main-title">Bahía Metrics</h1>
          <p className="subtitle">Condiciones en tiempo real (Cartagena) • Fuente: <strong>{dataSource}</strong></p>
        </div>
        <StatusBadge loading={loading} onZero={fetchRealData} />
      </header>

      <main className="dashboard-grid">
        <DashboardCard title="Viento" icon={Wind} legend="Velocidad y dirección" className="card-wind">
          <WindCompass
            speed={windData.speed}
            direction={windData.direction}
            gusts={windData.gusts}
          />
        </DashboardCard>

        <DashboardCard
          title="Marea Astronómica"
          icon={Waves}
          legend="Nivel del mar (MLLW)"
          className="card-tide"
          rightText={tideUpdateDate ? `Actualizado: ${tideUpdateDate}` : null}
        >
          <TideChart data={tideData} />
        </DashboardCard>

        <DashboardCard title="Temperatura" icon={Thermometer} legend="Al aire libre" className="card-small">
          <div className="metric-simple">
            <span className="metric-value">{weatherData.temperature}</span>
            <span className="metric-unit">°C</span>
          </div>
        </DashboardCard>

        <DashboardCard title="Humedad" icon={Droplets} legend="Relativa actual" className="card-small">
          <div className="metric-simple">
            <span className="metric-value">{weatherData.humidity}</span>
            <span className="metric-unit">%</span>
          </div>
        </DashboardCard>

        <DashboardCard title="Sensación Térm." icon={Thermometer} legend="Percibida en piel" className="card-small">
          <div className="metric-simple">
            <span className="metric-value">{extraData.feelsLike}</span>
            <span className="metric-unit">°C</span>
          </div>
        </DashboardCard>

        <DashboardCard title="Presión" icon={Gauge} legend="A nivel del mar" className="card-small">
          <div className="metric-simple">
            <span className="metric-value">{extraData.pressure}</span>
            <span className="metric-unit">hPa</span>
          </div>
        </DashboardCard>

        <DashboardCard title="Índice UV" icon={SunMedium} legend="Radiación solar" className="card-small">
          <div className="metric-simple">
            <span className="metric-value">{extraData.uvIndex}</span>
            <span className="metric-unit"></span>
          </div>
        </DashboardCard>

        <DashboardCard title="Visibilidad" icon={Eye} legend="Distancia clara" className="card-small">
          <div className="metric-simple">
            <span className="metric-value">{extraData.visibility}</span>
            <span className="metric-unit">km</span>
          </div>
        </DashboardCard>

        <DashboardCard title="Pronóstico (12 horas)" icon={CalendarDays} legend="Condiciones esperadas" className="card-forecast">
          <WeatherForecast forecast={forecastData} />
        </DashboardCard>
      </main>
    </div>
  );
}

export default App;
