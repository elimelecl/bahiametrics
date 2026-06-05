import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">{label}</p>
        <p className="tooltip-value">{`${payload[0].value} m`}</p>
      </div>
    );
  }
  return null;
};

const TideChart = ({ data }) => {
  const currentValue = data && data.length > 0 ? data[0].level : 0;

  return (
    <div className="tide-wrapper">
      <div className="tide-current-value">
        <span className="tide-number">{currentValue}</span>
        <span className="tide-unit">m</span>
      </div>
      <div className="tide-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} 
            dx={-10}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
          <Area 
            type="monotone" 
            dataKey="level" 
            stroke="#ffffff" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTide)" 
            animationDuration={1500}
            activeDot={{ r: 6, fill: '#ffffff', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TideChart;
