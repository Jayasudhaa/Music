import { useState, useRef, useEffect } from 'react';

const TANPURA_NOTES = [
  { key: 'C', name: 'C (Sa) - 1 Kattai', freq: 261.63 },
  { key: 'D', name: 'D (Sa) - 2 Kattai', freq: 293.66 },
  { key: 'G', name: 'G (Pa) - 5 Kattai', freq: 392.00 },
  { key: 'A', name: 'A (Dha) - 6 Kattai', freq: 440.00 },
  { key: 'B', name: 'B (Ni) - 0.75 Kattai', freq: 493.88 },
];

function TanpuraPlayer({ onTonicChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNote, setSelectedNote] = useState(TANPURA_NOTES[1]); // Default to D
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);

  // Notify parent of tonic changes
  useEffect(() => {
    if (onTonicChange) {
      onTonicChange(selectedNote.freq);
    }
  }, [selectedNote, onTonicChange]);

  const generateTanpuraTone = (frequency) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillators = [];

    // Create harmonics for rich tanpura sound
    const harmonics = [
      { mult: 1, gain: 0.5 },   // Fundamental
      { mult: 2, gain: 0.3 },   // 2nd harmonic
      { mult: 3, gain: 0.2 },   // 3rd harmonic
      { mult: 4, gain: 0.15 },  // 4th harmonic
      { mult: 5, gain: 0.1 },   // 5th harmonic
    ];

    harmonics.forEach(({ mult, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = frequency * mult;
      gainNode.gain.value = gain;
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      oscillators.push(osc);
    });

    return oscillators;
  };

  const startTanpura = () => {
    oscillatorsRef.current = generateTanpuraTone(selectedNote.freq);
    setIsPlaying(true);
  };

  const stopTanpura = () => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopTanpura();
    } else {
      startTanpura();
    }
  };

  const handleNoteChange = (e) => {
    const note = TANPURA_NOTES.find(n => n.key === e.target.value);
    
    // If playing, restart with new note
    if (isPlaying) {
      stopTanpura();
      setTimeout(() => {
        setSelectedNote(note);
        // Will restart due to useEffect or manually restart
        const newOscillators = generateTanpuraTone(note.freq);
        oscillatorsRef.current = newOscillators;
      }, 100);
    } else {
      setSelectedNote(note);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTanpura();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ 
      background: '#fff', 
      padding: '20px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '15px' 
      }}>
        <h3 style={{ margin: 0 }}>🎻 Tanpura Drone</h3>
        <button 
          onClick={togglePlayback}
          style={{ 
            padding: '8px 16px', 
            background: isPlaying ? '#e74c3c' : '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
      </div>

      <select 
        value={selectedNote.key} 
        onChange={handleNoteChange}
        disabled={isPlaying}
        style={{ 
          width: '100%', 
          padding: '10px', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '10px',
          background: isPlaying ? '#f0f0f0' : 'white',
          cursor: isPlaying ? 'not-allowed' : 'pointer'
        }}
      >
        {TANPURA_NOTES.map(note => (
          <option key={note.key} value={note.key}>
            {note.name}
          </option>
        ))}
      </select>

      {isPlaying && (
        <div style={{ 
          padding: '10px', 
          background: '#d4edda', 
          borderRadius: '4px',
          fontSize: '13px',
          color: '#155724'
        }}>
          ✅ Playing: {selectedNote.name}
        </div>
      )}

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: '#fff3cd',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#856404'
      }}>
        💡 <strong>Tip:</strong> Play the tanpura while recording to maintain your shruti!
      </div>
    </div>
  );
}

export default TanpuraPlayer;
