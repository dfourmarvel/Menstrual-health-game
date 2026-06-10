/**
 * PROSTATE CANCER AWARENESS GAME - REDESIGNED
 * Improved with modern UI/UX patterns from Health Quest reference
 * 
 * Improvements:
 * - Theme toggle (light/dark mode)
 * - Audio control system (music & sound effects toggles)
 * - Rules carousel with progress indicators
 * - "Don't show again" option for rules
 * - Better state management
 * - Improved interaction patterns
 * - Responsive design support
 */

/* ============================================================================
   CONSTANTS & CONFIGURATION
   ============================================================================ */

const BOARD_SIZE = 10;
const CELL_SIZE = 10;
const DICE_ROLL_FRAMES = 20;
const DICE_FRAME_DELAY = 50;
const ENTRY_CORRECT_SIX_CHANCE = 0.65;
const IMAGE_PATH = "assets/images";
const AUDIO_PATH = "assets/audio";

/* Snakes: Landing position -> slide down to */
const snakes = {
  11: 10, 48: 28, 41: 23, 64: 44, 68: 31,
  88: 72, 91: 71, 94: 87, 98: 83,
};

/* Ladders: Landing position -> climb up to */
const ladders = {
  1: 20, 2: 19, 4: 16, 13: 35, 18: 75,
  21: 39, 38: 61, 36: 54, 50: 69, 70: 90,
  67: 73, 75: 96, 76: 84, 80: 82, 63: 77,
  85: 100, 58: 100,
};

/* Health awareness questions organized by difficulty/importance */
const questions = [
  { question: "The prostate is a small gland in men that produces seminal fluid.", answer: true },
  { question: "Prostate cancer is most commonly diagnosed in Black men over 55 and White men over 65.", answer: true },
  { question: "Prostate cancer can often be asymptomatic in its early stages.", answer: true },
  { question: "PSA stands for Prostate-Specific Antigen, a protein produced by the prostate.", answer: true },
  { question: "A PSA test measures prostate-specific antigen levels to help detect cancer.", answer: true },
  { question: "A digital rectal exam (DRE) involves a doctor examining the prostate through the rectum.", answer: true },
  { question: "Difficulty urinating can be a symptom of prostate cancer.", answer: true },
  { question: "Having a family history of prostate cancer does not affect your risk.", answer: false },
  { question: "Surgery to remove the prostate is a common treatment option.", answer: true },
  { question: "Active surveillance involves closely monitoring prostate cancer without immediate treatment.", answer: true },
  { question: "A diet high in red meat and dairy may increase the risk of prostate cancer.", answer: true },
  { question: "The Gleason score grades prostate cancer based on its microscopic appearance.", answer: true },
  { question: "Hormone therapy for prostate cancer blocks the production of hormones that fuel growth.", answer: true },
  { question: "The most common type of prostate cancer is adenocarcinoma.", answer: true },
  { question: "African American men have a lower risk of prostate cancer compared to other races.", answer: false },
  { question: "Men with a positive family history of prostate cancer are at higher risk.", answer: true },
  { question: "Men with a positive family history of breast cancer may have a higher risk of prostate cancer.", answer: true },
  { question: "Prostate cancer screenings are recommended for men over 50.", answer: true },
  { question: "MRI can help detect and stage prostate cancer.", answer: true },
  { question: "A prostate biopsy involves taking small samples of prostate tissue to check for cancer.", answer: true },
  { question: "Healthy lifestyle changes can improve quality of life for prostate cancer patients.", answer: true },
  { question: "Cryotherapy uses cold-freeze therapy to destroy cancerous tissue in the prostate.", answer: true },
  { question: "Some men with prostate cancer may have normal PSA levels.", answer: true },
  { question: "Some men without prostate cancer may have high PSA levels.", answer: true },
  { question: "Watchful waiting involves monitoring prostate cancer symptoms without active treatment.", answer: true },
  { question: "Prostate cancer and its treatments can affect sexual function.", answer: true },
  { question: "Obesity is linked to a higher risk of aggressive prostate cancer.", answer: false },
  { question: "Genetic mutations like BRCA1/2 can increase prostate cancer risk.", answer: true },
  { question: "Prostate cancer is more common in North America than other regions.", answer: true },
  { question: "Regular exercise may help reduce prostate cancer risk.", answer: true },
];

/* Game rules for carousel display */
const gameRules = [
  {
    title: "How to Play",
    description: "Roll the dice to move your piece across the board. Answer health questions to climb ladders and avoid snakes. The first player to reach the final tile wins!",
    icon: "🎮"
  },
  {
    title: "Rolling the Dice",
    description: "You must roll a 6 to enter the board. After that, each roll moves your piece forward. Rolling a 6 gives you an extra turn!",
    icon: "🎲"
  },
  {
    title: "Snakes & Ladders",
    description: "Landing on a snake sends you down. Landing on a ladder moves you up. Answer health questions to decide your fate!",
    icon: "🐍"
  },
  {
    title: "Health Questions",
    description: "Answer true or false questions about prostate cancer awareness. Get it right and you climb the ladder or avoid the snake!",
    icon: "❓"
  },
  {
    title: "Winning the Game",
    description: "Be the first player to reach square 100 to win. You must land exactly on 100 or bounce back if you overshoot.",
    icon: "🏆"
  },
  {
    title: "Health Tips",
    description: "Regular screenings and healthy lifestyle choices are important. Learn about prostate cancer risks and prevention.",
    icon: "💪"
  },
  {
    title: "Let's Begin!",
    description: "Configure your player names and click Start Game to begin. Have fun while learning about prostate health!",
    icon: "✨"
  }
];

/* ============================================================================
   GAME STATE MANAGEMENT
   ============================================================================ */

let gameState = createInitialGameState();

function createInitialGameState(playerNames = ["Player 1", "Player 2"]) {
  return {
    currentPlayer: 0,
    players: [
      { name: playerNames[0], position: 0, element: null, hasStarted: false },
      { name: playerNames[1], position: 0, element: null, hasStarted: false },
    ],
    isGameOver: false,
    isQuestionActive: false,
    isRolling: false,
  };
}

/* APP STATE (UI preferences) */
let appState = {
  theme: localStorage.getItem('theme') || 'light',
  musicEnabled: localStorage.getItem('musicEnabled') !== 'false',
  soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
  showRulesOnStart: localStorage.getItem('showRulesOnStart') !== 'false',
  readAloudEnabled: localStorage.getItem('readAloudEnabled') !== 'false',
};

/* Text-to-Speech Manager */
const speechManager = {
  utterance: null,
  isSupported: 'speechSynthesis' in window,
  isSpeaking: false,
  
  /* Get the best available voice from system */
  getBestVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    
    /* Priority: Try to find a natural-sounding English voice */
    const preferredNames = ['Google US English', 'Microsoft Zira', 'Daniel', 'Samantha', 'Victoria', 'Karen'];
    
    for (let preferred of preferredNames) {
      const match = voices.find(v => v.name.includes(preferred));
      if (match) return match;
    }
    
    /* Fallback: Use first English voice */
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    return englishVoice || voices[0];
  },
  
  speak(text) {
    if (!this.isSupported || !appState.readAloudEnabled) return;
    
    /* Cancel any ongoing speech */
    this.stop();
    
    this.utterance = new SpeechSynthesisUtterance(text);
    
    /* Natural voice settings */
    this.utterance.rate = 0.9;      /* Clear but natural speed */
    this.utterance.pitch = 0.95;    /* Slightly warm and natural */
    this.utterance.volume = 1;      /* Full volume */
    
    /* Use the best available system voice */
    const voice = this.getBestVoice();
    if (voice) {
      this.utterance.voice = voice;
    }
    
    this.utterance.onstart = () => {
      this.isSpeaking = true;
      elements.readAloudBtn?.classList.add('btn-active');
    };
    
    this.utterance.onend = () => {
      this.isSpeaking = false;
      elements.readAloudBtn?.classList.remove('btn-active');
    };
    
    this.utterance.onerror = () => {
      this.isSpeaking = false;
      elements.readAloudBtn?.classList.remove('btn-active');
    };
    
    window.speechSynthesis.speak(this.utterance);
  },
  
  stop() {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      elements.readAloudBtn?.classList.remove('btn-active');
    }
  }
};

/* ============================================================================
   DOM ELEMENTS CACHE
   ============================================================================ */

const elements = {};

function cacheElements() {
  Object.assign(elements, {
    /* Navbar */
    backBtn: document.getElementById('back-btn'),
    rulesBtn: document.getElementById('rules-btn'),
    themeBtn: document.getElementById('theme-btn'),
    musicBtn: document.getElementById('music-btn'),
    soundBtn: document.getElementById('sound-btn'),
    readAloudBtn: document.getElementById('read-aloud-btn'),

    /* Game board & controls */
    boardImg: document.getElementById('board-img'),
    player1: document.getElementById('player1'),
    player2: document.getElementById('player2'),
    diceImg: document.getElementById('dice-img'),
    diceValueDisplay: document.getElementById('dice-value-display'),
    currentPlayerName: document.getElementById('current-player-name'),
    player1NameDisplay: document.getElementById('player1-name-display'),
    player2NameDisplay: document.getElementById('player2-name-display'),

    /* Buttons */
    rollDiceBtn: document.getElementById('roll-dice'),
    restartBtn: document.getElementById('restart'),

    /* Modals */
    setupModal: document.getElementById('setup-modal'),
    questionModal: document.getElementById('question-modal'),
    winnerModal: document.getElementById('winner-modal'),

    /* Setup modal - Rules carousel */
    rulesCarousel: document.getElementById('rules-carousel'),
    carouselSlides: document.getElementById('carousel-slides'),
    carouselIndicators: document.getElementById('carousel-indicators'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),
    skipRules: document.getElementById('skip-rules'),
    dontShowAgain: document.getElementById('dont-show-again'),

    /* Setup modal - Player setup */
    playerSetup: document.getElementById('player-setup'),
    player1NameInput: document.getElementById('player1-name'),
    player2NameInput: document.getElementById('player2-name'),
    startGameBtn: document.getElementById('start-game'),

    /* Question modal */
    questionTitle: document.getElementById('question-title'),
    questionText: document.getElementById('question-text'),
    trueBtn: document.getElementById('true-btn'),
    falseBtn: document.getElementById('false-btn'),

    /* Winner modal */
    winnerText: document.getElementById('winner-text'),
    winnerAvatar: document.getElementById('winner-avatar'),
    playAgainBtn: document.getElementById('play-again-btn'),

    /* Audio */
    backgroundMusic: document.getElementById('background-music'),
    questionSound: document.getElementById('question-sound'),
    snakeSound: document.getElementById('snake-sound'),
    ladderSound: document.getElementById('ladder-sound'),
    diceSound: document.getElementById('dice-sound'),
    winSound: document.getElementById('win-sound'),
  });
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function playSound(audio) {
  if (!appState.soundEnabled || !audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => { /* Browser may block audio */ });
}

function playMusic(audio) {
  if (!appState.musicEnabled || !audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => { /* Browser may block audio */ });
}

function stopMusic(audio) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/* ============================================================================
   THEME MANAGEMENT
   ============================================================================ */

function initializeTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  updateThemeButton();
}

function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', appState.theme);
  localStorage.setItem('theme', appState.theme);
  updateThemeButton();
}

function updateThemeButton() {
  elements.themeBtn.setAttribute('aria-label', 
    `Switch to ${appState.theme === 'light' ? 'dark' : 'light'} theme`
  );
}

/* ============================================================================
   AUDIO CONTROL MANAGEMENT
   ============================================================================ */

function toggleMusic() {
  appState.musicEnabled = !appState.musicEnabled;
  localStorage.setItem('musicEnabled', appState.musicEnabled);
  
  if (appState.musicEnabled && !gameState.isGameOver) {
    playMusic(elements.backgroundMusic);
  } else {
    stopMusic(elements.backgroundMusic);
  }
  
  updateAudioButtons();
}

function toggleSound() {
  appState.soundEnabled = !appState.soundEnabled;
  localStorage.setItem('soundEnabled', appState.soundEnabled);
  updateAudioButtons();
}

function updateAudioButtons() {
  elements.musicBtn.setAttribute('aria-label',
    `${appState.musicEnabled ? 'Mute' : 'Play'} music`
  );
  elements.soundBtn.setAttribute('aria-label',
    `${appState.soundEnabled ? 'Mute' : 'Play'} sound effects`
  );
  elements.readAloudBtn?.setAttribute('aria-label',
    `${appState.readAloudEnabled ? 'Disable' : 'Enable'} read aloud`
  );
}

function toggleReadAloud() {
  appState.readAloudEnabled = !appState.readAloudEnabled;
  localStorage.setItem('readAloudEnabled', appState.readAloudEnabled);
  updateAudioButtons();
  
  /* Stop current speech if disabling */
  if (!appState.readAloudEnabled) {
    speechManager.stop();
  }
}

/* ============================================================================
   RULES CAROUSEL SYSTEM
   ============================================================================ */

let currentRuleSlide = 0;

function initializeCarousel() {
  renderCarouselSlides();
  renderCarouselIndicators();
  updateCarouselSlide(0);
}

function renderCarouselSlides() {
  elements.carouselSlides.innerHTML = gameRules.map((rule, idx) => `
    <div class="carousel-slide" data-slide="${idx}" ${idx === 0 ? '' : 'hidden'}>
      <div class="slide-icon">${rule.icon}</div>
      <h3 class="slide-title">${rule.title}</h3>
      <p class="slide-description">${rule.description}</p>
    </div>
  `).join('');
}

function renderCarouselIndicators() {
  elements.carouselIndicators.innerHTML = gameRules.map((_, idx) => `
    <button 
      class="indicator ${idx === 0 ? 'active' : ''}" 
      data-slide="${idx}"
      aria-label="Go to rule ${idx + 1}"
    ></button>
  `).join('');
  
  document.querySelectorAll('.indicator').forEach(indicator => {
    indicator.addEventListener('click', () => {
      updateCarouselSlide(parseInt(indicator.dataset.slide));
    });
  });
}

function updateCarouselSlide(slideIndex) {
  currentRuleSlide = Math.max(0, Math.min(slideIndex, gameRules.length - 1));
  
  /* Hide all slides, show current */
  document.querySelectorAll('.carousel-slide').forEach((slide, idx) => {
    slide.hidden = idx !== currentRuleSlide;
  });
  
  /* Update indicators */
  document.querySelectorAll('.indicator').forEach((indicator, idx) => {
    indicator.classList.toggle('active', idx === currentRuleSlide);
  });
  
  /* Update navigation buttons */
  elements.carouselPrev.disabled = currentRuleSlide === 0;
  elements.carouselNext.disabled = currentRuleSlide === gameRules.length - 1;
  
  /* Read aloud the current rule */
  const currentRule = gameRules[currentRuleSlide];
  const ruleText = `${currentRule.title}. ${currentRule.description}`;
  speechManager.speak(ruleText);
  
  /* If last slide, change next button to continue */
  if (currentRuleSlide === gameRules.length - 1) {
    elements.carouselNext.innerHTML = `
      <span>Continue</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;
  } else {
    elements.carouselNext.innerHTML = `
      <span>Next</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;
  }
}

function moveToCarouselEnd() {
  /* Move to player setup */
  currentRuleSlide = gameRules.length;
  elements.rulesCarousel.hidden = true;
  elements.playerSetup.hidden = false;
}

/* ============================================================================
   MODAL MANAGEMENT
   ============================================================================ */

function showSetupModal() {
  elements.setupModal.classList.add('modal-active');
  /* Reset carousel */
  currentRuleSlide = 0;
  updateCarouselSlide(0);
  elements.rulesCarousel.hidden = false;
  elements.playerSetup.hidden = true;
}

function hideSetupModal() {
  elements.setupModal.classList.remove('modal-active');
}

function showQuestionModal(questionText) {
  elements.questionText.textContent = questionText;
  elements.questionModal.hidden = false;
  elements.questionModal.classList.add('modal-active');
  playSound(elements.questionSound);
  
  /* Read aloud the question */
  speechManager.speak(questionText);
}

function hideQuestionModal() {
  elements.questionModal.hidden = true;
  elements.questionModal.classList.remove('modal-active');
}

function showWinnerModal(playerName, playerElement) {
  elements.winnerText.textContent = `${playerName} wins the game!`;
  elements.winnerAvatar.src = playerElement.src;
  elements.winnerAvatar.alt = `${playerName}'s avatar`;
  elements.winnerModal.hidden = false;
  elements.winnerModal.classList.add('modal-active');
  playSound(elements.winSound);
}

function hideWinnerModal() {
  elements.winnerModal.hidden = true;
  elements.winnerModal.classList.remove('modal-active');
}

/* ============================================================================
   GAME MECHANICS
   ============================================================================ */

function getPositionCoordinates(position) {
  if (position === 0) {
    return { x: 0, y: -10 };
  }

  const zeroBasedPosition = position - 1;
  const row = Math.floor(zeroBasedPosition / BOARD_SIZE);
  let col = zeroBasedPosition % BOARD_SIZE;

  /* Serpentine board: alternate row direction */
  if (row % 2 === 1) {
    col = BOARD_SIZE - 1 - col;
  }

  return {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
  };
}

function updatePlayerPosition(playerIndex, position) {
  const coordinates = getPositionCoordinates(position);
  const player = gameState.players[playerIndex];

  player.element.style.left = `${coordinates.x}%`;
  player.element.style.bottom = `${coordinates.y}%`;
}

async function rollDice(options = {}) {
  return new Promise((resolve) => {
    playSound(elements.diceSound);
    let rolls = 0;
    let randomFace = 1;

    const rollInterval = setInterval(() => {
      randomFace = Math.floor(Math.random() * 6) + 1;
      elements.diceImg.src = `${IMAGE_PATH}/dice${randomFace}.png`;
      elements.diceImg.alt = `Dice showing ${randomFace}`;
      elements.diceValueDisplay.textContent = randomFace;
      rolls += 1;

      if (rolls >= DICE_ROLL_FRAMES) {
        clearInterval(rollInterval);
        if (options.preferredFace && Math.random() < options.preferredFaceChance) {
          randomFace = options.preferredFace;
          elements.diceImg.src = `${IMAGE_PATH}/dice${randomFace}.png`;
          elements.diceImg.alt = `Dice showing ${randomFace}`;
          elements.diceValueDisplay.textContent = randomFace;
        }
        resolve(randomFace);
      }
    }, DICE_FRAME_DELAY);
  });
}

function getBoardJump(position) {
  if (snakes[position]) {
    return { type: "snake", newPosition: snakes[position] };
  }
  if (ladders[position]) {
    return { type: "ladder", newPosition: ladders[position] };
  }
  return null;
}

function showQuestion(callback) {
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  showQuestionModal(randomQuestion.question);
  gameState.isQuestionActive = true;

  function handleAnswer(answer) {
    hideQuestionModal();
    gameState.isQuestionActive = false;
    elements.trueBtn.removeEventListener('click', onTrue);
    elements.falseBtn.removeEventListener('click', onFalse);
    callback(answer === randomQuestion.answer);
  }

  function onTrue() {
    handleAnswer(true);
  }

  function onFalse() {
    handleAnswer(false);
  }

  elements.trueBtn.addEventListener('click', onTrue);
  elements.falseBtn.addEventListener('click', onFalse);
}

function askEntryQuestion() {
  return new Promise((resolve) => {
    showQuestion(resolve);
  });
}

async function handleTurn() {
  if (gameState.isGameOver || gameState.isQuestionActive || gameState.isRolling) {
    return;
  }

  gameState.isRolling = true;
  elements.rollDiceBtn.disabled = true;

  const currentPlayer = gameState.players[gameState.currentPlayer];

  /* Opening roll: must roll 6 to start */
  if (!currentPlayer.hasStarted) {
    const earnedEntryBoost = await askEntryQuestion();
    const diceValue = await rollDice(
      earnedEntryBoost
        ? { preferredFace: 6, preferredFaceChance: ENTRY_CORRECT_SIX_CHANCE }
        : {}
    );

    if (diceValue === 6) {
      currentPlayer.hasStarted = true;
      currentPlayer.position = 1;
      updatePlayerPosition(gameState.currentPlayer, 1);
    } else {
      advanceTurn();
    }
    gameState.isRolling = false;
    if (!gameState.isGameOver) {
      elements.rollDiceBtn.disabled = false;
    }
    return;
  }

  const diceValue = await rollDice();

  /* Normal move */
  let newPosition = currentPlayer.position + diceValue;
  
  /* Bounce back if overshoot (player bounces back from 100) */
  if (newPosition > 100) {
    newPosition = 100 - (newPosition - 100);
  }

  await movePlayer(newPosition);

  /* Check if won */
  if (newPosition === 100) {
    finalizeTurn(newPosition);
    gameState.isRolling = false;
    return;
  }

  /* Check for snake/ladder */
  const boardJump = getBoardJump(newPosition);
  if (!boardJump) {
    finalizeTurn(newPosition);
    gameState.isRolling = false;
    elements.rollDiceBtn.disabled = false;
    return;
  }

  /* Show preview of destination */
  updatePlayerPosition(gameState.currentPlayer, boardJump.newPosition);

  /* Ask health question */
  showQuestion((correct) => {
    if (correct && boardJump.type === "ladder") {
      newPosition = boardJump.newPosition;
      playSound(elements.ladderSound);
    }

    if (!correct && boardJump.type === "snake") {
      newPosition = boardJump.newPosition;
      playSound(elements.snakeSound);
    }

    finalizeTurn(newPosition);
    gameState.isRolling = false;
    if (!gameState.isGameOver) {
      elements.rollDiceBtn.disabled = false;
    }
  });
}

async function movePlayer(position) {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  currentPlayer.position = position;
  updatePlayerPosition(gameState.currentPlayer, position);
  await wait(500);
}

function finalizeTurn(newPosition) {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  currentPlayer.position = newPosition;
  updatePlayerPosition(gameState.currentPlayer, newPosition);

  if (newPosition === 100) {
    gameState.isGameOver = true;
    elements.rollDiceBtn.hidden = true;
    elements.restartBtn.hidden = false;
    showWinnerModal(currentPlayer.name, currentPlayer.element);
    return;
  }

  advanceTurn();
}

function advanceTurn() {
  gameState.currentPlayer = 1 - gameState.currentPlayer;
  elements.currentPlayerName.textContent = gameState.players[gameState.currentPlayer].name;
}

/* ============================================================================
   GAME SETUP & INITIALIZATION
   ============================================================================ */

function startGame() {
  const player1Name = elements.player1NameInput.value.trim() || "Player 1";
  const player2Name = elements.player2NameInput.value.trim() || "Player 2";

  /* Check if user wants to hide rules on future starts */
  if (elements.dontShowAgain.checked) {
    localStorage.setItem('showRulesOnStart', 'false');
  }

  gameState.players[0].name = player1Name;
  gameState.players[1].name = player2Name;

  elements.currentPlayerName.textContent = player1Name;
  elements.player1NameDisplay.textContent = player1Name;
  elements.player2NameDisplay.textContent = player2Name;

  hideSetupModal();
  
  elements.rollDiceBtn.disabled = false;

  gameState.players.forEach((player, index) => {
    player.position = 0;
    player.hasStarted = false;
    updatePlayerPosition(index, 0);
  });

  gameState.currentPlayer = 0;
  gameState.isGameOver = false;
  gameState.isQuestionActive = false;
  gameState.isRolling = false;

  playMusic(elements.backgroundMusic);
}

function resetGame() {
  hideWinnerModal();
  const playerNames = gameState.players.map(p => p.name);
  gameState = createInitialGameState(playerNames);
  gameState.players[0].element = elements.player1;
  gameState.players[1].element = elements.player2;

  elements.diceImg.src = `${IMAGE_PATH}/dice1.png`;
  elements.diceImg.alt = "Dice showing 1";
  elements.diceValueDisplay.textContent = "1";
  elements.currentPlayerName.textContent = gameState.players[0].name;
  elements.rollDiceBtn.hidden = false;
  elements.rollDiceBtn.disabled = false;
  elements.restartBtn.hidden = true;

  gameState.players.forEach((player, index) => {
    updatePlayerPosition(index, 0);
  });

  playMusic(elements.backgroundMusic);
}

function showRulesModal() {
  showSetupModal();
}

/* ============================================================================
   EVENT LISTENERS & INITIALIZATION
   ============================================================================ */

document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
  cacheElements();
  
  /* Initialize audio source paths (if using local files) */
  if (elements.backgroundMusic) {
    const backgroundSource = document.createElement('source');
    backgroundSource.src = `${AUDIO_PATH}/background-music.mp3`;
    backgroundSource.type = 'audio/mpeg';
    elements.backgroundMusic.appendChild(backgroundSource);
  }

  /* Cache player elements */
  gameState.players[0].element = elements.player1;
  gameState.players[1].element = elements.player2;

  /* Initialize positions */
  gameState.players.forEach((player, index) => {
    updatePlayerPosition(index, player.position);
  });

  /* Theme & Audio initialization */
  initializeTheme();
  updateAudioButtons();

  /* Carousel setup */
  initializeCarousel();

  /* Event Listeners - Navigation */
  elements.backBtn.addEventListener('click', () => {
    window.history.back();
  });

  elements.rulesBtn.addEventListener('click', showRulesModal);
  elements.themeBtn.addEventListener('click', toggleTheme);
  elements.musicBtn.addEventListener('click', toggleMusic);
  elements.soundBtn.addEventListener('click', toggleSound);
  elements.readAloudBtn?.addEventListener('click', toggleReadAloud);

  /* Event Listeners - Game Controls */
  elements.rollDiceBtn.addEventListener('click', handleTurn);
  elements.restartBtn.addEventListener('click', resetGame);

  /* Event Listeners - Rules Carousel */
  elements.carouselPrev.addEventListener('click', () => {
    updateCarouselSlide(currentRuleSlide - 1);
  });

  elements.carouselNext.addEventListener('click', () => {
    if (currentRuleSlide === gameRules.length - 1) {
      moveToCarouselEnd();
    } else {
      updateCarouselSlide(currentRuleSlide + 1);
    }
  });

  elements.skipRules.addEventListener('click', () => {
    moveToCarouselEnd();
  });

  /* Event Listeners - Game Setup */
  elements.startGameBtn.addEventListener('click', startGame);

  /* Event Listeners - Dice buttons */
  elements.trueBtn.addEventListener('click', () => {});
  elements.falseBtn.addEventListener('click', () => {});

  /* Play again button */
  elements.playAgainBtn.addEventListener('click', resetGame);

  /* Show setup modal on start (unless user disabled it) */
  if (appState.showRulesOnStart) {
    showSetupModal();
  } else {
    /* Still show player setup */
    showSetupModal();
    moveToCarouselEnd();
  }

  elements.rollDiceBtn.disabled = true;
}

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideQuestionModal();
  }
});
