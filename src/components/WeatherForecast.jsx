import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudDrizzle, CloudFog } from 'lucide-react';

const getWeatherIcon = (code) => {
  if (code === 0) return <Sun className="forecast-icon sun-icon" />;
  if (code === 1 || code === 2 || code === 3) return <Cloud className="forecast-icon cloud-icon" />;
  if (code === 45 || code === 48) return <CloudFog className="forecast-icon cloud-icon" />;
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return <CloudDrizzle className="forecast-icon rain-icon" />;
  if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67 || code === 80 || code === 81 || code === 82) return <CloudRain className="forecast-icon rain-icon" />;
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return <CloudSnow className="forecast-icon snow-icon" />;
  if (code === 95 || code === 96 || code === 99) return <CloudLightning className="forecast-icon storm-icon" />;
  return <Sun className="forecast-icon sun-icon" />; // fallback
};

const getDayName = (dateString) => {
  // Ahora usamos formato de hora (e.g. "14:00")
  return dateString;
};

const WeatherForecast = ({ forecast }) => {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="forecast-container">
      {forecast.map((hour, index) => (
        <div key={index} className="forecast-item">
          <span className="forecast-day">{index === 0 ? 'Ahora' : hour.time}</span>
          <div className="forecast-icon-wrapper">
            {getWeatherIcon(hour.weather_code)}
          </div>
          <div className="forecast-temps">
            <span className="temp-max">{Math.round(hour.temp)}°</span>
          </div>
          <div className="forecast-prob">
            {hour.prob}%
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeatherForecast;
