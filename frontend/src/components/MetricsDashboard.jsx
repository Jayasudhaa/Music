function MetricsDashboard({ data }) {
  if (!data) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    if (score >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const metrics = [
    {
      label: 'Overall Accuracy',
      value: `${data.accuracy_percentage}%`,
      color: getScoreColor(data.accuracy_percentage),
      icon: '🎯'
    },
    {
      label: 'Attack Quality',
      value: `${data.attack_quality}/100`,
      color: getScoreColor(data.attack_quality),
      icon: '⚡'
    },
    {
      label: 'Sustain Stability',
      value: `${data.stability.toFixed(1)}¢`,
      color: data.stability < 10 ? '#27ae60' : data.stability < 20 ? '#f39c12' : '#e74c3c',
      icon: '📏'
    },
    {
      label: 'Release Quality',
      value: `${data.release_quality}/100`,
      color: getScoreColor(data.release_quality),
      icon: '🎵'
    }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#2c3e50' }}>
        📈 Performance Metrics
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
        {metrics.map((metric, idx) => (
          <div 
            key={idx}
            style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '8px', 
              border: `2px solid ${metric.color}`,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>{metric.icon}</div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>{metric.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: metric.color }}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Additional warnings */}
      <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.is_drifting && (
          <div style={{ padding: '10px', background: '#fff3cd', borderLeft: '4px solid #f39c12', borderRadius: '4px', fontSize: '13px' }}>
            <strong>⚠️ Pitch Drift Detected:</strong> Your pitch is sliding {data.drift_rate > 0 ? 'upward' : 'downward'} over time ({Math.abs(data.drift_rate).toFixed(2)}¢/sec)
          </div>
        )}
        
        {data.has_vibrato && (
          <div style={{ padding: '10px', background: '#e8f8f5', borderLeft: '4px solid #16a085', borderRadius: '4px', fontSize: '13px' }}>
            <strong>🎵 Vibrato Detected:</strong> {data.vibrato_extent.toFixed(1)}¢ oscillation
          </div>
        )}

        {data.problem_zones && data.problem_zones.length > 0 && (
          <div style={{ padding: '10px', background: '#fadbd8', borderLeft: '4px solid #e74c3c', borderRadius: '4px', fontSize: '13px' }}>
            <strong>🔴 Problem Zones:</strong> {data.problem_zones.length} moment(s) where pitch went significantly off-target
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsDashboard;