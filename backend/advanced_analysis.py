import librosa
import numpy as np
from raga_data import ALL_SWARAS
from config import DEFAULT_TONIC

def normalize_cents(cents: float) -> float:
    """Normalize cents to 0-1200 range"""
    return cents % 1200

def analyze_pitch_detailed(audio_path: str, tonic: float = DEFAULT_TONIC):
    """
    Analyze pitch with tonic (Sa) as the target reference
    User selects their shruti, that becomes Sa, and we measure deviation from it
    """
    # Load and extract pitch
    y, sr = librosa.load(audio_path, sr=16000, duration=None)  # None = full audio
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y, 
        fmin=librosa.note_to_hz('C2'), 
        fmax=librosa.note_to_hz('C7'),
        frame_length=1024,  # Smaller frame = faster (was 2048)
        hop_length=256,     # Larger hop = fewer frames to process
        fill_na=None        # Don't interpolate missing values
    )
    
    # Filter valid pitches
    valid_mask = voiced_flag & (voiced_probs > 0.6)  # Higher threshold = fewer points
    valid_pitches = f0[valid_mask]
    
    if len(valid_pitches) == 0:
        return None
    
    # Convert ALL pitch values to cents (for graphing)
    cents_array = 1200 * np.log2(valid_pitches / tonic)
    
    # Create time points for x-axis
    max_points = 300
    if len(cents_array) > max_points:
        indices = np.linspace(0, len(cents_array) - 1, max_points, dtype=int)
        cents_array = cents_array[indices]
        valid_mask_indices = np.where(valid_mask)[0][indices]
    else:
        valid_mask_indices = np.where(valid_mask)[0]
    
    hop_length = 256
    time_points = librosa.frames_to_time(valid_mask_indices, sr=sr, hop_length=hop_length)
    
    # Calculate average pitch
    avg_cents = np.median(cents_array)
    norm_cents = normalize_cents(avg_cents)
    
    # Identify the closest Swara
    closest_swara = min(ALL_SWARAS.keys(), 
                        key=lambda s: min(abs(norm_cents - ALL_SWARAS[s]), 
                                        1200 - abs(norm_cents - ALL_SWARAS[s])))
    target_cents = 0  # Sa is always 0 cents from tonic
    target_swara = "Sa"
    
    # Calculate deviation
    deviation = ((norm_cents - target_cents + 600) % 1200) - 600
    stability = np.std(cents_array)
    
    # Normalize cents_array to be relative to target (for better visualization)
    normalized_pitch_contour = []
    for cent_val in cents_array:
        normalized_val = (cent_val % 1200)  # Keep in 0-1200 range for swara mapping
        # Handle wrap-around (e.g., if target is 1088 and pitch is 50)
        normalized_pitch_contour.append(normalized_val)
    
    # Create target line (flat line at 0 deviation)
    target_line = [0] * len(time_points)
    
    # Color code deviations (for frontend visualization)
    deviation_colors = []
    for cent_val in cents_array:
        norm_val = (cent_val % 1200)
        dist_from_sa = min(abs(norm_val), abs(norm_val - 1200))
        
        if dist_from_sa < 10:
            deviation_colors.append("green")
        elif dist_from_sa < 25:
            deviation_colors.append("yellow")
        else:
            deviation_colors.append("red")
    
    return {
        "swara": target_swara,  # Always Sa - this is what they're trying to sing
        "actual_swara": closest_swara,  # What they actually sang
        "deviation": round(deviation, 1),
        "overall_stability": round(stability, 1),
        "gauge_value": round(deviation, 1),
        "score": int(max(0, 100 - abs(deviation))),
        
        # NEW: Data for live pitch graph
        "pitch_contour": normalized_pitch_contour,  # Y-axis values (cents deviation)
        "time_points": time_points.tolist(),  # X-axis values (seconds)
        "target_line": target_line,  # Flat line at 0
        "target_cents": target_cents,  # The ideal pitch in cents
        "deviation_colors": deviation_colors  # Color coding for visualization
    }
