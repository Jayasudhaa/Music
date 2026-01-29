function PhaseBreakdown({ phases }) {
  if (!phases) return null;

  const getPhaseQuality = (stability) => {
    if (stability < 8) return { label: 'Excellent', color: '#27ae60' };
    if (stability < 15) return { label: 'Good', color: '#f39c12' };
    if (stability < 25) return { label: 'Fair', color: '#e67e22' };
    return { label: 'Needs Work', color: '#e74c3c' };
  };

  const phaseData = [
    { name: 'Attack', icon: '⚡', data: phases.attack, desc: 'How cleanly you started' },
    { name: 'Sustain', icon: '━', data: phases.sustain, desc: 'How steady you held' },
    { name: 'Release', icon: '⌇', data: phases.release, desc: 'How cleanly you ended' }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#2c3e50' }}>
        🔬 Phase-by-Phase Analysis
      </h4>
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        {phaseData.map((phase, idx) => {
          const quality = getPhaseQuality(phase.data.stability);
          return (
            <div 
              key={idx}
              style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              <div style={{ fontSize: '32px' }}>{phase.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <strong style={{ fontSize: '14px' }}>{phase.name}</strong>
                  <span style={{ 
                    padding: '3px 10px', 
                    background: quality.color, 
                    color: 'white', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {quality.label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{phase.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${phase.data.duration_pct}%`, 
                        background: quality.color,
                        transition: 'width 0.3s'
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#666', minWidth: '80px' }}>
                    {phase.data.stability.toFixed(1)}¢ wobble
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PhaseBreakdown;