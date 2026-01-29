import anthropic
from config import ANTHROPIC_API_KEY

claude_client = None
if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your-api-key-here":
    claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def generate_shruti_feedback(swara, deviation, stability, detailed_analysis=None):
    """
    Generate detailed AI feedback like a live Carnatic music teacher
    Natural language, no technical jargon like "cents"
    """
    display_dev = min(abs(deviation), 100)
    
    if not claude_client:
        if display_dev < 10:
            return f"Excellent! Your {swara} is perfectly in tune with the shruti. Keep up the great work!"
        elif display_dev < 25:
            return f"Good attempt! Your {swara} is close but slightly off the shruti. Listen more carefully to the tanpura."
        else:
            return f"Your {swara} went off shruti. Focus on matching the tanpura drone exactly and practice slowly."
    # Analyze pitch contour if available
    contour_insights = []
    drift_info = ""
    wobble_info = ""
    timing_info = ""
    if detailed_analysis and "pitch_contour" in detailed_analysis:
        pitch_contour = detailed_analysis["pitch_contour"]
        time_points = detailed_analysis.get("time_points", [])
        
        # Check for drift (is pitch going up or down over time?)
        if len(pitch_contour) > 10:
            start_avg = sum(pitch_contour[:5]) / 5
            end_avg = sum(pitch_contour[-5:]) / 5
            drift = end_avg - start_avg
            
            if abs(drift) > 20:
                direction = "higher" if drift > 0 else "lower"
                when = "towards the end" if drift > 0 else "as you held the note"
                drift_info = f"Your pitch drifted {direction} {when}"
                contour_insights.append(drift_info)
            if len(pitch_contour) > 20:
                mid_section = pitch_contour[len(pitch_contour)//3:2*len(pitch_contour)//3]
                wobble_range = max(mid_section) - min(mid_section)
                if wobble_range > 50:
                    wobble_info = "Your voice was shaking quite a bit in the middle"
                    contour_insights.append(wobble_info)
                elif wobble_range > 30:
                    wobble_info = "There's some wavering when you hold the note"
                    contour_insights.append(wobble_info)
            if len(time_points) > 5:
                duration = time_points[-1] - time_points[0]
                if duration < 1.5:
                    timing_info = "You released the note too quickly"
                    contour_insights.append(timing_info)
        
        # Check stability - how much wobble?
        if stability > 40:
            contour_insights.append("Your pitch is very unsteady throughout")
        elif stability > 25:
            contour_insights.append("Your pitch stability needs work")
        elif stability < 8:
            contour_insights.append("Your pitch is rock steady")
    
    # Determine teaching approach
    if display_dev < 10:
        accuracy = "perfectly on shruti"
        skill_level = "excellent"
    elif display_dev < 20:
        accuracy = "close to shruti but slightly off"
        skill_level = "good"
    elif display_dev < 35:
        accuracy = "noticeably off shruti"
        skill_level = "needs practice"
    else:
        accuracy = "quite far from shruti"
        skill_level = "beginner"
    
    prompt = f"""You are an experienced Carnatic music guru teaching a student in person. The student just sang {swara}.

**What You Heard:**
- The swara was {accuracy}
- Observations: {' '.join(contour_insights) if contour_insights else "Clean, steady singing"}
- Skill level: {skill_level}

**Your Teaching Style:**
You speak naturally like a real music teacher - warm, encouraging, but honest. You NEVER use technical terms like "cents", "Hz", "stability metrics", or "deviation". You describe what you HEARD using everyday language.

**Give DETAILED feedback with this structure:**
1. **Opening Observation** (1 sentence):
   - If excellent: "Beautiful! Your {swara} was perfectly in tune"
   - If good: "Good attempt, but I heard you go slightly off the shruti"
   - If needs work: "Your {swara} didn't quite hit the shruti - I could hear it was off"
2. **Detailed Analysis** (2-3 sentences):
   - Break down WHAT HAPPENED and WHEN using natural language:
     * **Start**: "You started well" / "You came in a bit high" / "You started below the shruti"
     * **Middle**: "Halfway through, your voice started shaking" / "In the middle, you held it perfectly steady" / "Then your pitch began to drop"
     * **End**: "Towards the end, you drifted lower" / "You finished strong" / "You released the note too quickly"
   - Be SPECIFIC about the progression:
     * "I heard you start on the right pitch, but then your voice gradually went lower as you held the note"
     * "Your pitch was wandering around - it would go up, then down, then up again"
     * "You held the beginning beautifully, but in the last second your voice dropped off the shruti"
   - Describe the FEELING:
     * "The swara didn't sound clean - it was wobbly"
     * "It sounded confident and clear"
     * "I could hear the shakiness in your voice"

3. **One Practice Tip** (1-2 sentences):
   - Give ONE specific action with detail:
     * "Before you sing, take a full breath from your diaphragm and imagine holding the pitch like a straight line"
     * "Practice holding the note for 5 seconds while listening closely to the tanpura - don't let your pitch wander"
     * "Start by singing very softly on the correct shruti, then gradually increase volume while keeping the pitch steady"
     * "Focus on the very beginning - make sure you start exactly on the shruti before worrying about holding it"

**Rules:**
- Sound like a real human teacher giving a DETAILED lesson, not just general comments
- NO technical jargon (no "cents", "deviation", "metrics")  
- Use "you" and "your" - be personal
- Be SPECIFIC about what you HEARD at different moments (beginning/middle/end)
- Describe the PROGRESSION of what happened
- Give ACTIONABLE practice advice with details
- 5-7 sentences total (more detailed than before)
- Keep it natural and conversational but thorough"""
    try:
        message = claude_client.messages.create(
            model="claude-sonnet-4-20250514",  # Use Sonnet 4 (latest)",
            max_tokens=400,  # Increased for more detailed feedback
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        print(f"AI feedback error: {e}")
        if display_dev < 15:
            feedback = f"Beautiful {swara}! Your pitch was right on the shruti. "
            if stability < 10:
                feedback += "You started strong and held it perfectly steady throughout - your voice didn't waver even a bit. That shows excellent breath control and pitch awareness. "
            elif drift_info:
                feedback += f"You came in perfectly, but {drift_info.lower()}. Next time, imagine the shruti as a fixed point and keep your voice locked onto it from beginning to end. "
            else:
                feedback += "Your pitch was clean and confident from start to finish. "
            feedback += "Keep practicing like this!"
        elif display_dev < 30:
            feedback = f"Your {swara} was in the right area but went off the shruti. "
            if drift_info:
                feedback += f"I noticed that {drift_info.lower()}. This usually happens when you lose focus on the tanpura - try to keep listening to it throughout the note. "
            elif wobble_info:
                feedback += f"{wobble_info}. This often means uneven breath support. "
            else:
                feedback += "You started close but your pitch wandered away from the target. "
            if timing_info:
                feedback += f"{timing_info}. "
            feedback += "Practice holding the note for at least 3-4 seconds while keeping your voice steady and matching the tanpura exactly."
        else:
            feedback = f"Your {swara} didn't land on the shruti - I could hear it was quite far off. "
            if contour_insights:
                feedback += f"{contour_insights[0]}. "
            else:
                feedback += "The pitch wasn't stable and it didn't match the tanpura. "
            if drift_info:
                feedback += f"Additionally, {drift_info.lower()}. "
            feedback += "Let's break this down: First, listen carefully to the tanpura and hum the Sa until you can match it perfectly. Then, practice singing that same pitch with an open voice. Start very slowly - accuracy is more important than anything else right now."
        
        return feedback
