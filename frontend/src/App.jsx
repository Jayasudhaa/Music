import { useState, useEffect, useRef } from 'react';
import TanpuraPlayer from './components/TanpuraPlayer';
import SwarmeterPianoRoll from './components/SwarmeterPianoRoll';
import LivePitchAnalyzer from './components/LivePitchAnalyzer';

const API_URL = 'http://localhost:8000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [selectedShruti, setSelectedShruti] = useState(293.66); // Your choice
  const [tanpuraTonic, setTanpuraTonic] = useState(293.66); // Tanpura's choice
  const [livePitchData, setLivePitchData] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchHistory();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isSignup ? '/signup' : '/login';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        const error = await res.json();
        alert(error.detail);
      }
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleShrutiChange = (e) => {
    const newShruti = parseFloat(e.target.value);
    setSelectedShruti(newShruti);
    console.log('Manual shruti selection:', newShruti);
  };

  const syncShrutiToTanpura = () => {
    setSelectedShruti(tanpuraTonic);
    console.log('Synced shruti to tanpura:', tanpuraTonic);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setRecordedUrl(audioUrl);
        setAudioFile(new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { alert('Microphone access denied: ' + err.message); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setAudioFile(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!audioFile) { 
      alert('⚠️ Please record or upload audio first!'); 
      return; 
    }
    if (!selectedShruti) { 
      alert('⚠️ SHRUTI NOT SELECTED!'); 
      return; 
    }

    console.log('Analyzing with shruti:', selectedShruti);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('tonic', selectedShruti);

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Analysis result:', data);
        setResult(data);
        fetchHistory();
      } else {
        const error = await res.json();
        alert(error.detail);
      }
    } catch (err) { 
      alert('Error: ' + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setHistory([]);
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', color: '#d35400' }}>🎵 Shruti Analyzer</h1>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <form onSubmit={handleAuth}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '4px' }} />
              {isSignup && <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '4px' }} />}
              <button type="submit" style={{ width: '100%', padding: '14px', marginTop: '10px', background: '#d35400', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold' }}>{isSignup ? 'Sign Up' : 'Login'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={() => setIsSignup(!isSignup)} style={{ background: 'none', border: 'none', color: '#d35400', cursor: 'pointer', textDecoration: 'underline' }}>
                {isSignup ? 'Already have an account? Login' : 'Need an account? Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', maxWidth: '1400px', margin: '20px auto', padding: '20px', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#d35400' }}>🎵 Shruti Analyzer</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Your AI Carnatic Music Teacher</p>
          </div>
          <div>
            <span style={{ marginRight: '15px' }}>Welcome, {user?.name || user?.email}</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>Analyze Your Singing</h2>

          {/* LIVE PITCH ANALYZER */}
          <LivePitchAnalyzer selectedShruti={selectedShruti} onLiveUpdate={setLivePitchData} />

        {livePitchData && (
            <div style={{ marginBottom: '15px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #27ae60', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#555' }}>🎤 Live Pitch</div>
              <div style={{ fontSize: '44px', fontWeight: 'bold', color: '#27ae60', lineHeight: 1.1 }}>
                {livePitchData.current_swara || livePitchData.swara || '—'}

    </div>

              <div style={{ fontSize: '13px', color: '#777' }}>
                {livePitchData.frequency ? `${livePitchData.frequency.toFixed(1)} Hz` : ''} {livePitchData.deviation != null ? ` • ${livePitchData.deviation.toFixed(1)} cents` : ''}
    </div>
  </div>
)}

          {/* SHRUTI SELECTOR - NOW INDEPENDENT */}
          <div style={{ marginBottom: '15px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '2px solid #f39c12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#856404' }}>
                🎼 Select Your Shruti (Sa Reference)
              </h3>
              <button
                onClick={syncShrutiToTanpura}
                style={{
                  padding: '6px 12px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                🔄 Match Tanpura
              </button>
            </div>
            
            <select 
              value={selectedShruti} 
              onChange={handleShrutiChange}
              style={{ 
                width: '100%', 
                padding: '14px', 
                border: '2px solid #f39c12', 
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="261.63">🎵 C - Sa (1 Kattai) - 261.63 Hz</option>
              <option value="277.18">🎵 C# - Sa (1.5 Kattai) - 277.18 Hz</option>
              <option value="293.66">🎵 D - Sa (2 Kattai) - 293.66 Hz</option>
              <option value="311.13">🎵 D# - Sa (2.5 Kattai) - 311.13 Hz</option>
              <option value="329.63">🎵 E - Sa (3 Kattai) - 329.63 Hz</option>
              <option value="349.23">🎵 F - Sa (4 Kattai) - 349.23 Hz</option>
              <option value="369.99">🎵 F# - Sa (4.5 Kattai) - 369.99 Hz</option>
              <option value="392.00">🎵 G - Sa (5 Kattai) - 392.00 Hz</option>
              <option value="415.30">🎵 G# - Sa (5.5 Kattai) - 415.30 Hz</option>
              <option value="440.00">🎵 A - Sa (6 Kattai) - 440.00 Hz</option>
              <option value="466.16">🎵 A# - Sa (6.5 Kattai) - 466.16 Hz</option>
              <option value="493.88">🎵 B - Sa (0.75 Kattai) - 493.88 Hz</option>
            </select>

            <div style={{ 
              marginTop: '12px', 
              padding: '12px', 
              background: 'white', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>Your Shruti:</strong> {selectedShruti} Hz
              {selectedShruti !== tanpuraTonic && (
                <div style={{ marginTop: '4px', color: '#e67e22', fontSize: '12px' }}>
                  ⚠️ Different from Tanpura ({tanpuraTonic} Hz)
                </div>
              )}
            </div>
          </div>

          {/* RECORDING SECTION */}
          <div style={{ marginBottom: '15px', padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>🎤 Record Audio</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {!isRecording && !recordedBlob && <button onClick={startRecording} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>⏺ Start Recording</button>}
              {isRecording && <button onClick={stopRecording} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>⏹ Stop Recording</button>}
              {recordedBlob && <button onClick={clearRecording} style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑 Clear</button>}
            </div>
            {recordedUrl && <audio controls src={recordedUrl} style={{ width: '100%' }} />}
            {!recordedBlob && !isRecording && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>Or upload file:</p>
                  <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} />
                </div>
            )}
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={loading || !audioFile || !selectedShruti} 
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: loading ? '#95a5a6' : '#27ae60', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {loading ? '⏳ Analyzing...' : '🎯 Analyze'}
          </button>

          {result && (
            <div style={{ marginTop: '20px' }}>
              {/* AUDIO PLAYBACK */}
              {(recordedUrl || audioFile) && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '20px', 
                  background: '#e8f5e9', 
                  borderRadius: '8px',
                  border: '2px solid #27ae60'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#27ae60' }}>
                    🎧 Play Your Recording
                  </h3>
                  <audio 
                    controls 
                    src={recordedUrl || (audioFile ? URL.createObjectURL(audioFile) : '')} 
                    style={{ width: '100%' }}
                  >
                    Your browser does not support audio playback.
                  </audio>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', marginBottom: 0 }}>
                    💡 Listen to your recording while viewing the graph below to see exactly where each swara occurs
                  </p>
                </div>
              )}

              <div style={{ padding: '30px', background: '#f8f9fa', borderRadius: '12px', textAlign: 'center', border: '3px solid #3498db' }}>
                <div style={{ fontSize: '18px', marginBottom: '10px', color: '#7f8c8d' }}>
                  Target: <strong style={{ color: '#2c3e50' }}>Sa</strong> ({selectedShruti} Hz)
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  You sang: <span style={{ color: '#e74c3c' }}>{result.actual_swara || result.swara}</span>
                </div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>{result.score}/100</div>
                <div style={{ fontSize: '18px' }}>Deviation from Sa: {result.deviation} cents</div>
                <div style={{ fontSize: '16px', marginTop: '5px', color: '#7f8c8d' }}>
                  Stability: {result.overall_stability} cents
                </div>
              </div>

              <SwarmeterPianoRoll data={(livePitchData && livePitchData.pitch_contour) ? livePitchData : result} tonicHz={selectedShruti} />

              <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderRadius: '8px', border: '2px solid #3498db' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>👨‍🏫 Your Teacher's Feedback</h4>
                <p style={{ lineHeight: '1.8' }}>{result.feedback}</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>📜 History</h2>
          {history.length === 0 ? <p>No sessions yet</p> : history.slice(0, 5).map((item) => (
            <div key={item.id} style={{ padding: '10px', marginBottom: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <strong>{item.swara || item.detected_raga}</strong>: {item.feedback}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '320px' }}>
        {/* Tanpura now uses separate state */}
        <TanpuraPlayer onTonicChange={(freq) => setTanpuraTonic(freq)} />
      </div>
    </div>
  );
}

export default App;
