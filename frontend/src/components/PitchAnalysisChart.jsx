import { useEffect, useRef } from 'react';

function PitchAnalysisChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !data.pitch_contour || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Setup
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const pitchData = data.pitch_contour;
    const targetCents = data.target_cents;
    const colors = data.deviation_colors;

    // Calculate range
    const minPitch = Math.min(...pitchData, targetCents) - 20;
    const maxPitch = Math.max(...pitchData, targetCents) + 20;
    const pitchRange = maxPitch - minPitch;

    // Helper function to convert pitch to Y coordinate
    const pitchToY = (pitch) => {
      return height - padding - ((pitch - minPitch) / pitchRange) * chartHeight;
    };

    // Helper function to convert index to X coordinate
    const indexToX = (index) => {
      return padding + (index / (pitchData.length - 1)) * chartWidth;
    };

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw target line (green dashed)
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const targetY = pitchToY(targetCents);
    ctx.beginPath();
    ctx.moveTo(padding, targetY);
    ctx.lineTo(width - padding, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw target label
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Target: ${data.swara}`, width - padding + 5, targetY + 4);

    // Draw tolerance zone (±20 cents)
    ctx.fillStyle = 'rgba(39, 174, 96, 0.1)';
    const topToleranceY = pitchToY(targetCents + 20);
    const bottomToleranceY = pitchToY(targetCents - 20);
    ctx.fillRect(padding, topToleranceY, chartWidth, bottomToleranceY - topToleranceY);

    // Draw pitch contour with color coding
    for (let i = 0; i < pitchData.length - 1; i++) {
      const x1 = indexToX(i);
      const y1 = pitchToY(pitchData[i]);
      const x2 = indexToX(i + 1);
      const y2 = pitchToY(pitchData[i + 1]);

      // Set color based on deviation
      const colorMap = {
        'green': '#27ae60',
        'yellow': '#f1c40f',
        'orange': '#e67e22',
        'red': '#e74c3c'
      };
      ctx.strokeStyle = colorMap[colors[i]] || '#3498db';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Mark problem zones with red vertical bands
    if (data.problem_zones) {
      ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
      data.problem_zones.forEach(zone => {
        const startX = padding + (zone.start_time / data.time_points[data.time_points.length - 1]) * chartWidth;
        const endX = padding + (zone.end_time / data.time_points[data.time_points.length - 1]) * chartWidth;
        ctx.fillRect(startX, padding, endX - startX, chartHeight);
      });
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // X-axis label
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time →', width / 2, height - 10);

    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pitch (cents from Sa) →', 0, 0);
    ctx.restore();

  }, [data]);

  if (!data || !data.pitch_contour) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#2c3e50' }}>
        📊 Pitch Analysis Chart
      </h4>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={300}
        style={{ 
          width: '100%', 
          maxWidth: '800px',
          border: '1px solid #ddd', 
          borderRadius: '8px',
          background: 'white'
        }}
      />
      <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '3px', background: '#27ae60' }}></div>
          <span>Excellent (&lt;10¢)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '3px', background: '#f1c40f' }}></div>
          <span>Good (10-20¢)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '3px', background: '#e67e22' }}></div>
          <span>Fair (20-30¢)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '3px', background: '#e74c3c' }}></div>
          <span>Needs Work (&gt;30¢)</span>
        </div>
      </div>
    </div>
  );
}

export default PitchAnalysisChart;