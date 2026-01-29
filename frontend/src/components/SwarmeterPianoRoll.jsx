import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// 3 octaves of notes (Western + Carnatic mapping)
const THREE_OCTAVES = [
  // Lower octave (Mandra Sthayi) - negative cents
  { cents: -1200, western: "C2", carnatic: "Ṡ", color: "#e3f2fd" },
  { cents: -1110, western: "C#2", carnatic: "ṙ", color: "#ffffff" },
  { cents: -996, western: "D2", carnatic: "Ṙ", color: "#e3f2fd" },
  { cents: -906, western: "D#2", carnatic: "ġ", color: "#ffffff" },
  { cents: -792, western: "E2", carnatic: "Ġ", color: "#e3f2fd" },
  { cents: -702, western: "F2", carnatic: "ṁ", color: "#ffffff" },
  { cents: -590, western: "F#2", carnatic: "Ṁ", color: "#e3f2fd" },
  { cents: -498, western: "G2", carnatic: "Ṗ", color: "#ffffff" },
  { cents: -408, western: "G#2", carnatic: "ḋ", color: "#e3f2fd" },
  { cents: -294, western: "A2", carnatic: "Ḋ", color: "#ffffff" },
  { cents: -204, western: "A#2", carnatic: "ṅ", color: "#e3f2fd" },
  { cents: -90, western: "B2", carnatic: "Ṅ", color: "#ffffff" },
  
  // Middle octave (Madhya Sthayi) - 0 to 1200 cents
  { cents: 0, western: "C3", carnatic: "S", color: "#fff3cd", isSa: true },
  { cents: 90, western: "C#3", carnatic: "r", color: "#ffffff" },
  { cents: 204, western: "D3", carnatic: "R", color: "#e3f2fd" },
  { cents: 294, western: "D#3", carnatic: "g", color: "#ffffff" },
  { cents: 386, western: "E3", carnatic: "G", color: "#e3f2fd" },
  { cents: 498, western: "F3", carnatic: "m", color: "#ffffff" },
  { cents: 590, western: "F#3", carnatic: "M", color: "#e3f2fd" },
  { cents: 702, western: "G3", carnatic: "P", color: "#fff3cd" },
  { cents: 792, western: "G#3", carnatic: "d", color: "#ffffff" },
  { cents: 906, western: "A3", carnatic: "D", color: "#e3f2fd" },
  { cents: 996, western: "A#3", carnatic: "n", color: "#ffffff" },
  { cents: 1088, western: "B3", carnatic: "N", color: "#e3f2fd" },
  
  // Upper octave (Tara Sthayi) - 1200 to 2400 cents
  { cents: 1200, western: "C4", carnatic: "S'", color: "#fff3cd", isSa: true },
  { cents: 1290, western: "C#4", carnatic: "r'", color: "#ffffff" },
  { cents: 1404, western: "D4", carnatic: "R'", color: "#e3f2fd" },
  { cents: 1494, western: "D#4", carnatic: "g'", color: "#ffffff" },
  { cents: 1586, western: "E4", carnatic: "G'", color: "#e3f2fd" },
  { cents: 1698, western: "F4", carnatic: "m'", color: "#ffffff" },
  { cents: 1790, western: "F#4", carnatic: "M'", color: "#e3f2fd" },
  { cents: 1902, western: "G4", carnatic: "P'", color: "#fff3cd" },
  { cents: 1992, western: "G#4", carnatic: "d'", color: "#ffffff" },
  { cents: 2106, western: "A4", carnatic: "D'", color: "#e3f2fd" },
  { cents: 2196, western: "A#4", carnatic: "n'", color: "#ffffff" },
  { cents: 2288, western: "B4", carnatic: "N'", color: "#e3f2fd" },
];

// Convert frequency to cents relative to tonic
function frequencyToCents(frequency, tonic) {
  return 1200 * Math.log2(frequency / tonic);
}

// Find closest note
function findClosestNote(cents) {
  let closest = THREE_OCTAVES[0];
  let minDist = Math.abs(cents - closest.cents);
  
  THREE_OCTAVES.forEach(note => {
    const dist = Math.abs(cents - note.cents);
    if (dist < minDist) {
      minDist = dist;
      closest = note;
    }
  });
  
  return { ...closest, deviation: minDist };
}

function SwarmeterPianoRoll({ data, tonicHz = 293.66 }) {
  if (!data || !data.pitch_contour || !data.time_points) {
    return null;
  }

  // Transform data - convert cents (0-1200) to full range (-1200 to 2400)
  const chartData = data.time_points.map((time, index) => {
    const cents = data.pitch_contour[index];
    
    // Normalize to -1200 to 2400 range (3 octaves centered on middle Sa)
    let normalizedCents = cents;
    while (normalizedCents > 1200) normalizedCents -= 1200;
    while (normalizedCents < 0) normalizedCents += 1200;
    
    // Convert to actual frequency for display
    const frequency = tonicHz * Math.pow(2, normalizedCents / 1200);
    
    // Find closest note
    const noteInfo = findClosestNote(normalizedCents);
    
    // Color based on accuracy
    let color;
    if (noteInfo.deviation < 10) color = '#27ae60';
    else if (noteInfo.deviation < 25) color = '#f39c12';
    else color = '#e74c3c';
    
    return {
      time: parseFloat(time.toFixed(2)),
      cents: normalizedCents,
      frequency: frequency.toFixed(2),
      note: noteInfo.carnatic,
      noteWestern: noteInfo.western,
      deviation: noteInfo.deviation,
      color: color
    };
  });

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={payload.color}
        stroke={payload.color}
        strokeWidth={2}
      />
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div style={{
          background: 'white',
          padding: '15px',
          border: `3px solid ${data.color}`,
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minWidth: '220px'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', color: data.color }}>{data.note}</span>
          </div>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>
            <strong>Time:</strong> {data.time}s
          </div>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>
            <strong>Frequency:</strong> {data.frequency} Hz
          </div>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>
            <strong>Western:</strong> {data.noteWestern}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>
            <strong>Accuracy:</strong> {data.deviation.toFixed(1)} cents off
          </div>
          <div style={{ fontSize: '15px', color: data.color, fontWeight: 'bold', marginTop: '8px', textAlign: 'center' }}>
            {data.deviation < 10 ? '✅ Perfect!' : 
             data.deviation < 25 ? '👍 Good' : 
             '⚠️ Practice more'}
          </div>
        </div>
      );
    }
    return null;
  };

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
        <h3 style={{ margin: 0 }}>🎹 3-Octave Pitch Graph (Swarmeter Style)</h3>
        <div style={{ 
          fontSize: '12px',
          background: '#fff3cd',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '2px solid #f39c12'
        }}>
          <strong>Your Sa (Shruti):</strong> {tonicHz} Hz
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: '#27ae60', borderRadius: '50%' }}></div>
            <span>Perfect (&lt;10¢)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: '#f39c12', borderRadius: '50%' }}></div>
            <span>Good (10-25¢)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: '#e74c3c', borderRadius: '50%' }}></div>
            <span>Off (&gt;25¢)</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
          Lower: Ṡ Ṙ Ġ ṁ Ṗ Ḋ Ṅ | Middle: <strong>S R G m P D N</strong> | Upper: S' R' G' m' P' D' N'
        </div>
      </div>

      <ResponsiveContainer width="100%" height={600}>
        <LineChart data={chartData} margin={{ top: 10, right: 40, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
          
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
            stroke="#7f8c8d"
            style={{ fontSize: '13px' }}
          />
          
          <YAxis 
            label={{ value: 'Pitch (3 Octaves)', angle: -90, position: 'insideLeft' }}
            domain={[-1200, 2400]}
            ticks={THREE_OCTAVES.filter((_, i) => i % 2 === 0).map(n => n.cents)}
            tickFormatter={(value) => {
              const note = THREE_OCTAVES.find(n => n.cents === value);
              return note ? note.carnatic : '';
            }}
            stroke="#7f8c8d"
            style={{ fontSize: '13px', fontWeight: 'bold' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Draw reference lines for each swara */}
          {THREE_OCTAVES.map((note, index) => (
            <ReferenceLine 
              key={index}
              y={note.cents}
              stroke={note.isSa ? "#e74c3c" : "#bdc3c7"}
              strokeWidth={note.isSa ? 2 : 1}
              strokeDasharray={note.isSa ? "5 5" : "2 2"}
              strokeOpacity={note.isSa ? 0.8 : 0.3}
            />
          ))}
          
          {/* Your pitch line */}
          <Line 
            type="monotone" 
            dataKey="cents" 
            stroke="#2196f3" 
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 7 }}
            name="Your Pitch"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Octave Guide */}
      <div style={{
        marginTop: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px'
      }}>
        <div style={{ 
          padding: '15px', 
          background: '#e3f2fd', 
          borderRadius: '8px',
          border: '2px solid #2196f3'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1976d2' }}>
            Mandra Sthayi (Lower)
          </h4>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Ṡ Ṙ Ġ ṁ Ṗ Ḋ Ṅ
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Dots under letters = lower octave
          </div>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          borderRadius: '8px',
          border: '2px solid #f39c12'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>
            Madhya Sthayi (Middle)
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            S R G m P D N
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Your reference Sa is here
          </div>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#f3e5f5', 
          borderRadius: '8px',
          border: '2px solid #9c27b0'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7b1fa2' }}>
            Tara Sthayi (Upper)
          </h4>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            S' R' G' m' P' D' N'
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
            Apostrophe ' = upper octave
          </div>
        </div>
      </div>

      {/* Reading Guide */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>📖 How to Read This Graph:</strong>
        <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
          <div>🎹 <strong>Y-axis:</strong> Shows all swaras across 3 octaves (lower, middle, upper)</div>
          <div>⏱️ <strong>X-axis:</strong> Time in your recording</div>
          <div>🔵 <strong>Blue line:</strong> Your actual sung pitch over time</div>
          <div>🎯 <strong>Red dashed lines:</strong> Sa positions (your shruti reference)</div>
          <div>📏 <strong>Gray lines:</strong> All other swara positions</div>
          <div>🎨 <strong>Colored dots:</strong> Green (perfect), Orange (good), Red (needs work)</div>
        </div>
      </div>
    </div>
  );
}

export default SwarmeterPianoRoll;
