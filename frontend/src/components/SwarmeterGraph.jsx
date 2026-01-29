import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, ComposedChart, Scatter } from 'recharts';

// Carnatic swara mapping (using lowercase/uppercase for komal/tivra)
const SWARA_MAPPING = {
  0: "S",      // Sa
  90: "r",     // Komal Ri
  204: "R",    // Shuddha Ri  
  294: "g",    // Komal Ga
  386: "G",    // Shuddha Ga
  498: "m",    // Shuddha Ma
  590: "M",    // Tivra Ma
  702: "P",    // Pa
  792: "d",    // Komal Dha
  906: "D",    // Shuddha Dha
  996: "n",    // Komal Ni
  1088: "N"    // Shuddha Ni
};

const SWARA_POSITIONS = Object.keys(SWARA_MAPPING).map(Number);

// Convert cents to frequency given a tonic
function centsToFrequency(cents, tonic) {
  return tonic * Math.pow(2, cents / 1200);
  }

// Find closest swara for a given cents value
    
    
function findClosestSwara(cents) {
    let closestSwara = 0;
    let minDistance = 1200;
    SWARA_POSITIONS.forEach(pos => {
      const dist = Math.min(
      Math.abs(cents - pos),
      Math.abs(cents - pos + 1200),
      Math.abs(cents - pos - 1200)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestSwara = pos;
      }
    });
  return { swara: SWARA_MAPPING[closestSwara], position: closestSwara, distance: minDistance };
}
function SwarmeterStyleGraph({ data, tonicHz = 293.66 }) {
  if (!data || !data.pitch_contour || !data.time_points) {
    return null;
  }
  // Transform data with swara mapping
  const chartData = data.time_points.map((time, index) => {
    const pitch = data.pitch_contour[index];
    
    // Find closest swara
    const swaraInfo = findClosestSwara(pitch);
    // Color based on deviation from nearest swara
    let color;
    if (swaraInfo.distance < 10) color = '#27ae60'; // Green
    else if (swaraInfo.distance < 25) color = '#f39c12'; // Orange
    else color = '#e74c3c'; // Red
    
    // Calculate actual frequency
    const frequency = centsToFrequency(pitch, tonicHz);
    return {
      time: parseFloat(time.toFixed(2)),
      pitch: pitch,
      swara: swaraInfo.swara,
      swaraPosition: swaraInfo.position,
      accuracy: swaraInfo.distance,
      color: color,
      frequency: frequency.toFixed(2)
    };
  });

  // Custom dot with swara label
  const CustomDot = (props) => {
    const { cx, cy, payload, index } = props;
    if (!payload) return null;
    
    // Show swara label on every 5th point to avoid clutter
    const showLabel = index % 5 === 0;
    return (
      <g>
      <circle 
        cx={cx} 
        cy={cy} 
        r={3} 
        fill={payload.color}
        stroke={payload.color}
        strokeWidth={1}
      />
        {showLabel && (
          <text 
            x={cx} 
            y={cy - 8} 
            textAnchor="middle" 
            fill={payload.color}
            fontSize="11px"
            fontWeight="bold"
          >
            {payload.swara}
          </text>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: `3px solid ${data.color}`,
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
            Time: {data.time}s
          </div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            <strong>Swara:</strong> <span style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: data.color 
            }}>{data.swara}</span>
          </div>
          <div style={{ fontSize: '13px', marginBottom: '4px', color: '#7f8c8d' }}>
            <strong>Frequency:</strong> {data.frequency} Hz
          </div>
          <div style={{ fontSize: '13px', marginBottom: '4px', color: '#7f8c8d' }}>
            <strong>Pitch:</strong> {data.pitch.toFixed(1)} cents
          </div>
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>Accuracy:</strong> {data.accuracy.toFixed(1)} cents off
          </div>
          <div style={{ fontSize: '14px', color: data.color, fontWeight: 'bold', marginTop: '4px' }}>
            {data.accuracy < 10 ? '✅ Excellent!' : 
             data.accuracy < 25 ? '👍 Good' : 
             '⚠️ Needs work'}
          </div>
        </div>
      );
    }
    return null;
  };
  // Calculate swara distribution
  const swaraCount = {};
  chartData.forEach(point => {
    swaraCount[point.swara] = (swaraCount[point.swara] || 0) + 1;
  });

  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      background: 'white',
      borderRadius: '8px',
      border: '2px solid #3498db'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0 }}>🎵 Swara Analysis (Frequency Mapped)</h3>
        <div style={{ 
          fontSize: '12px',
          background: '#ecf0f1',
          padding: '8px 12px',
          borderRadius: '4px'
        }}>
          Tonic (Sa): <strong>{tonicHz} Hz</strong>
        </div>
      </div>
      
      {/* Color Legend */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '15px',
        fontSize: '13px',
        padding: '10px',
        background: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: '#27ae60', borderRadius: '50%' }}></div>
          <span>Spot-on (&lt;10¢)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: '#f39c12', borderRadius: '50%' }}></div>
          <span>Close (10-25¢)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: '#e74c3c', borderRadius: '50%' }}></div>
          <span>Off (&gt;25¢)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={chartData} margin={{ top: 25, right: 60, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
          
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
            stroke="#7f8c8d"
            style={{ fontSize: '12px' }}
          />
          
          <YAxis 
            label={{ value: 'Pitch (cents from Sa)', angle: -90, position: 'insideLeft' }}
            domain={[0, 1200]}
            ticks={SWARA_POSITIONS}
            stroke="#7f8c8d"
            tickFormatter={(value) => SWARA_MAPPING[value] || ''}
            style={{ fontSize: '14px', fontWeight: 'bold' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Draw all swara reference lines */}
          {SWARA_POSITIONS.map((position) => (
            <ReferenceLine 
              key={position}
              y={position} 
              stroke="#95a5a6" 
              strokeDasharray="2 2"
              strokeOpacity={0.4}
              label={{ 
                value: SWARA_MAPPING[position], 
                position: 'right', 
                fill: '#2c3e50',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            />
          ))}
          
          {/* Highlight Sa (target) */}
          <ReferenceLine 
            y={0} 
            stroke="#2c3e50" 
            strokeWidth={3}
            label={{ 
              value: 'Sa (Target)', 
              position: 'right', 
              fill: '#e74c3c',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          />
          
          {/* Pitch line with labeled dots */}
          <Line 
            type="monotone" 
            dataKey="pitch" 
            stroke="#3498db" 
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6 }}
            name="Your Pitch"
          />
        </ComposedChart>
      </ResponsiveContainer>
      {/* Swara Distribution */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>🎼 Swaras You Sang:</h4>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px'
        }}>
          {Object.entries(swaraCount)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .map(([swara, count]) => {
              const percentage = ((count / chartData.length) * 100).toFixed(0);
              return (
                <div 
                  key={swara}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '2px solid #3498db',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>{swara}</span>
                  <span style={{ marginLeft: '8px', color: '#7f8c8d' }}>
                    {count} times ({percentage}%)
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Statistics Panel */}
      <div style={{
        marginTop: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{ 
          padding: '15px', 
          background: '#e8f5e9', 
          borderRadius: '4px',
          border: '1px solid #27ae60'
        }}>
          <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>ACCURATE NOTES</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {chartData.filter(d => d.accuracy < 10).length}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {((chartData.filter(d => d.accuracy < 10).length / chartData.length) * 100).toFixed(0)}% of total
          </div>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          borderRadius: '4px',
          border: '1px solid #f39c12'
        }}>
          <div style={{ fontSize: '12px', color: '#f39c12', fontWeight: 'bold' }}>CLOSE NOTES</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {chartData.filter(d => d.accuracy >= 10 && d.accuracy < 25).length}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {((chartData.filter(d => d.accuracy >= 10 && d.accuracy < 25).length / chartData.length) * 100).toFixed(0)}% of total
          </div>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#f8d7da', 
          borderRadius: '4px',
          border: '1px solid #e74c3c'
        }}>
          <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>NEEDS WORK</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {chartData.filter(d => d.accuracy >= 25).length}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {((chartData.filter(d => d.accuracy >= 25).length / chartData.length) * 100).toFixed(0)}% of total
          </div>
        </div>
      </div>

      {/* Reading Guide */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '13px',
        border: '1px solid #2196f3'
      }}>
        <strong>📖 Sound → Frequency → Swara Conversion:</strong>
        <div style={{ marginTop: '10px', display: 'grid', gap: '6px' }}>
          <div>• <strong>Your audio</strong> → Extracted pitch frequencies (Hz)</div>
          <div>• <strong>Frequencies</strong> → Converted to cents (1200 cents = 1 octave)</div>
          <div>• <strong>Cents</strong> → Mapped to nearest Carnatic swara (S, r, R, g, G...)</div>
          <div>• <strong>Labels on graph</strong> → Show which swara at each moment</div>
          <div>• <strong>Colors</strong> → Show accuracy (green=perfect, red=off)</div>
        </div>
      </div>
    </div>
  );
}

export default SwarmeterStyleGraph;
