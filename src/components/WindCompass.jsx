import React from 'react';
import { Navigation } from 'lucide-react';

const WindCompass = ({ speed, direction, gusts }) => {
  return (
    <div className="wind-compass-container">
      <div className="compass-outer-ring">
        <div className="compass-marks">
          <span className="mark n">N</span>
          <span className="mark e">E</span>
          <span className="mark s">S</span>
          <span className="mark w">W</span>
        </div>
        
        <div 
          className="compass-arrow-container"
          style={{ transform: `rotate(${direction + 180}deg)` }}
        >
          <div className="compass-arrow">
            <Navigation className="arrow-icon" fill="currentColor" />
          </div>
        </div>

        <div className="compass-inner-circle">
          <div className="wind-data">
            <div className="wind-speed">
              <span className="speed-value">{speed}</span>
              <span className="speed-unit">kt</span>
            </div>
            {gusts !== undefined && gusts !== null && (
              <div className="wind-gusts">
                <span className="gust-label">Rachas</span>
                <span className="gust-value">{gusts} kt</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="direction-label">
        {direction}°
      </div>
    </div>
  );
};

export default WindCompass;
