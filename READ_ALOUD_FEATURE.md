# Read Aloud Feature Documentation

## Overview

The **Read Aloud** feature enables text-to-speech functionality for game rules and health questions. This accessibility feature helps users who prefer auditory learning or have difficulty reading, making the game more inclusive.

---

## Features

### 🎙️ What Gets Read Aloud

1. **Game Rules** - Each carousel slide is automatically read when displayed
   - Rule title
   - Rule description
   - Emoji icon description (implicit)

2. **Health Questions** - All true/false questions are read aloud when displayed
   - Complete question text
   - Automatic playback when modal opens

### 🎛️ User Controls

- **Read Aloud Button**: Icon button in navbar (speaker with sound wave icon)
- **Enable/Disable**: Click button to toggle feature on/off
- **Visual Feedback**: Button animates with pulse effect when actively speaking
- **Persistent**: User preference saved to localStorage

---

## Technical Implementation

### Web Speech API Integration

The feature uses the native **Web Speech API** (`SpeechSynthesis` interface) which is:
- Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- Free - no external API costs
- Offline - works without internet
- Customizable - rate, pitch, and volume adjustments

### Code Structure

#### Speech Manager Object
```javascript
const speechManager = {
  utterance: null,              // Current speech utterance
  isSupported: 'speechSynthesis' in window,  // Browser capability check
  isSpeaking: false,            // Current state
  
  speak(text) { ... }           // Main speak function
  stop() { ... }                // Stop current speech
}
```

#### Key Features
- **Browser Detection**: Checks if browser supports Web Speech API
- **Error Handling**: Graceful fallback if speech unavailable
- **State Management**: Tracks if speech is active
- **Visual Feedback**: Updates button appearance during speech
- **Rate Control**: Speech set to 90% normal speed for clarity
- **Volume Control**: Full volume for hearing impaired users

### Integration Points

#### 1. Rules Carousel
```javascript
// Called when user navigates carousel slides
updateCarouselSlide(slideIndex) {
  // ... existing code ...
  const ruleText = `${currentRule.title}. ${currentRule.description}`;
  speechManager.speak(ruleText);
}
```

#### 2. Health Questions
```javascript
// Called when question modal opens
showQuestionModal(questionText) {
  elements.questionText.textContent = questionText;
  // ... show modal ...
  speechManager.speak(questionText);
}
```

#### 3. Toggle Control
```javascript
// Called when user clicks read aloud button
toggleReadAloud() {
  appState.readAloudEnabled = !appState.readAloudEnabled;
  localStorage.setItem('readAloudEnabled', appState.readAloudEnabled);
  if (!appState.readAloudEnabled) {
    speechManager.stop();  // Stop if disabling
  }
}
```

### Settings & Preferences

**Voice Settings:**
- Rate: 0.9 (slower than normal for clarity)
- Pitch: 1.0 (normal)
- Volume: 1.0 (maximum)
- Language: Auto-detected from browser/OS

**User Preference Storage:**
```javascript
localStorage.getItem('readAloudEnabled')  // 'true' or 'false'
localStorage.setItem('readAloudEnabled', value)
```

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 25+ | ✅ Full support |
| Firefox | 49+ | ✅ Full support |
| Safari | 14.1+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |
| Opera | 27+ | ✅ Full support |
| Mobile Safari (iOS) | 14+ | ✅ Full support |
| Chrome Mobile | 29+ | ✅ Full support |
| Samsung Internet | 4+ | ✅ Full support |

---

## Accessibility Benefits

### 1. Visual Impairment
- Users with low vision can listen instead of read
- Font size no longer a limiting factor

### 2. Learning Differences
- Dyslexic users benefit from auditory input
- Multi-modal learning (read + hear) improves retention
- ADHD users may focus better with audio accompaniment

### 3. Language Learners
- Hear correct pronunciation
- Match written text with spoken words
- Improve listening comprehension

### 4. Non-Native Readers
- Understand complex medical terminology by hearing pronunciation
- Learn while playing game

### 5. Elderly Users
- Helps those with age-related vision decline
- Familiar interaction pattern (like audiobooks)

---

## User Experience

### Visual Indicators

1. **Navbar Button State**
   - Default: Gray icon
   - Hover: Blue icon with light background
   - Active (Speaking): Blue background with white icon
   - Animation: Pulse effect while speaking

2. **Button Appearance**
   ```css
   .icon-btn.btn-active {
     background-color: var(--primary-color);
     color: white;
     animation: pulse 1.5s ease-in-out infinite;
   }
   ```

### Audio Flow

**During Rules Carousel:**
1. User opens game
2. First rule carousel slide appears
3. Rule title + description automatically read aloud
4. User can click Next/Skip while listening
5. New slide's content read when displayed

**During Questions:**
1. Health question modal appears
2. Question automatically read aloud
3. User answers while/after listening
4. Next question read when shown

---

## Limitations & Considerations

### Browser Limitations
1. **Voice Quality**: System voices vary by OS and browser
   - Windows: Microsoft voices (good quality)
   - macOS: Siri voices (excellent quality)
   - Linux: Espeak (basic quality)
   - Mobile: System voices

2. **No Voice Selection UI**: Currently uses system default
   - Feature can be enhanced to let users choose voice

3. **No Speed/Pitch UI**: Currently fixed at 90% speed
   - Feature can be enhanced with controls

### Network Considerations
- Works offline (uses local speech synthesis)
- No API calls required
- No latency issues

### Privacy
- No data sent to external services
- All processing local to device
- No tracking or analytics

---

## Customization Options

### Adjustable Parameters

In `js/game.js`, modify the `speak()` function:

```javascript
speak(text) {
  // ... existing code ...
  this.utterance.rate = 0.9;      // Change: 0.5-2.0
  this.utterance.pitch = 1;       // Change: 0.5-2.0
  this.utterance.volume = 1;      // Change: 0.1-1.0
}
```

### Future Enhancements

1. **Voice Selection Dropdown**
   - Let users choose preferred voice
   - Save preference to localStorage

2. **Speed Controls**
   - Slider for speech rate (0.5x to 2.0x)
   - Save user preference

3. **Language Support**
   - Multi-language questions
   - Separate read aloud for each language

4. **Highlight While Speaking**
   - Highlight text as it's being read
   - Helps users follow along visually

5. **Speech Pause/Resume**
   - Let users pause and resume
   - Useful for thinking about answers

---

## Testing Checklist

- ✅ Read aloud button appears in navbar
- ✅ Clicking button toggles feature on/off
- ✅ Button animates while speaking (pulse effect)
- ✅ Rules carousel content read aloud on load
- ✅ Carousel navigation triggers new read aloud
- ✅ Health questions read aloud on display
- ✅ User preference saved to localStorage
- ✅ Disabling stops current speech
- ✅ Works in light and dark themes
- ✅ Works on mobile browsers
- ✅ Works in all modern browsers
- ✅ Graceful fallback if API unavailable
- ✅ Error handling for speech failures

---

## Code Quality Notes

### Error Handling
```javascript
utterance.onerror = () => {
  this.isSpeaking = false;
  elements.readAloudBtn?.classList.remove('btn-active');
};
```

### Safe Navigation
- Optional chaining (`?.`) used for DOM access
- Checks for API support before use
- Graceful degradation if Web Speech API unavailable

### Performance
- No additional DOM elements
- No JavaScript library dependencies
- Uses browser's native speech synthesis
- Minimal memory footprint

### Accessibility
- Proper ARIA labels on button
- Button visible and interactive
- Works with keyboard navigation
- Works with screen readers

---

## User Guide

### How to Enable Read Aloud

1. Look for the speaker icon in the top right navbar
2. Click the speaker icon to enable
3. Icon will show it's active when speaking

### Using During Gameplay

- **During Rules**: Listen while reading, or just listen
- **During Questions**: Listen to question, then click True/False
- **During Game**: Focus on game play, read aloud is for instructions only

### Disabling

- Click speaker icon again to disable
- Your preference is saved automatically

---

## Examples

### Example 1: First Time User
```
1. Opens game
2. Rules carousel appears with first rule
3. Speech: "How to Play. Roll the dice to move your piece..."
4. User can read along or listen
5. Clicks Next
6. Speech: "Rolling the Dice. You must roll a 6 to enter..."
```

### Example 2: During Question
```
1. User lands on snake/ladder
2. Question modal appears
3. Speech: "Prostate cancer can often be asymptomatic in its early stages"
4. User thinks about answer
5. User clicks True or False
6. Next question read aloud
```

---

## FAQ

**Q: Does read aloud work offline?**  
A: Yes! It uses your device's built-in speech synthesis. No internet required.

**Q: Can I change the voice?**  
A: Currently no UI for this, but it uses your system's default voice. Future versions can add voice selection.

**Q: Is there a way to control speed?**  
A: Currently fixed at 90% speed for clarity. Future versions can add speed controls.

**Q: Does it work on mobile?**  
A: Yes! All modern mobile browsers support Web Speech API (iOS Safari 14+, Chrome Mobile, etc.)

**Q: Can I pause/resume speech?**  
A: Not currently, but this can be added in future versions.

**Q: Does it track what I'm listening to?**  
A: No! All processing happens on your device. No data is sent anywhere.

**Q: What languages does it support?**  
A: Whatever your device supports. Usually English on English devices, but your browser may support others.

---

## Support & Troubleshooting

### Not Working?
1. Check browser compatibility (Chrome 25+, Firefox 49+, Safari 14.1+)
2. Check that read aloud is enabled (button should show active state when clicked)
3. Check system volume (should not be muted)
4. Try in different browser if available

### Quality Issues?
1. Adjust system voice in OS settings
2. Try different speech rate (modify code: `utterance.rate = 0.8` to 1.0)
3. Check internet connection (offline should use system voices)

### Mobile Issues?
1. Grant browser permission to use speech (may be asked on first use)
2. Check device volume/mute switch
3. Try closing other apps to free up resources

---

## Version Information

- **Feature Added**: June 2026
- **API Used**: Web Speech API (W3C Standard)
- **Browser Support**: All modern browsers
- **Storage**: LocalStorage for preferences
- **Dependencies**: None (vanilla implementation)

