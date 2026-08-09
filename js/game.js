/**
 * MENSTRUAL HEALTH AWARENESS GAME
 * Educational board game for menstrual health literacy
 * 
 * Features:
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

/* Scoring */
const POINTS_PER_CORRECT = 10;   /* points awarded for each correct answer */
const STREAK_BONUS = 5;          /* extra points every time the streak hits a multiple of… */
const STREAK_THRESHOLD = 3;      /* …this many correct answers in a row */

/* Difficulty-scaled AI answer accuracy (probability the AI answers correctly). */
const AI_ACCURACY = { easy: 0.8, medium: 0.6, hard: 0.45, all: 0.6 };

const IMAGE_PATH = "assets/images";
const AUDIO_PATH = "assets/audio";
const QUESTION_SOURCE_PATH = "Menstrual_Health%20questions.md";

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

/* Questions array - will be populated dynamically from the question bank */
let questions = [];
let questionBankReady = Promise.resolve();
let questionBankMetadata = {
  total: 0,
  byType: {},
  byDifficulty: {},
  bySection: {},
};

/* Difficulty categories for questions */
const difficultyLevels = {
  easy: [],
  medium: [],
  hard: [],
};

/* 
 * QUESTION PARSER & LOADER
 * Parses the question bank at runtime to build the question bank
 */

/**
 * Parse the the question bank file and extract questions with answers
 * Categorizes them by difficulty based on section headings
 */
async function loadQuestionsFromMarkdown() {
  try {
    const response = await fetch(QUESTION_SOURCE_PATH);
    if (!response.ok) {
      console.warn('Could not load the question bank, using fallback questions');
      loadFallbackQuestions();
      return;
    }

    const markdown = await response.text();
    const parsedQuestions = parseQuestionsMarkdown(markdown);
    
    if (parsedQuestions.length === 0) {
      console.warn('No questions parsed from the question bank, using fallback questions');
      loadFallbackQuestions();
      return;
    }

    questions = parsedQuestions;
    console.log(`Loaded ${questions.length} questions from the question bank`);
    categorizeQuestionsByDifficulty();
  } catch (error) {
    console.warn('Error loading the question bank:', error);
    loadFallbackQuestions();
  }
}

/**
 * Parse markdown text to extract questions and answers
 * Recognizes both True/False and Q&A format questions
 * @param {string} markdown - The markdown content from the question bank
 * @returns {Array} Array of question objects with {question, answer, type, section, difficulty}
 */
function parseQuestionsMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const questions = [];
  const seen = new Set();
  let section = 'Section 1';
  let difficulty = 'easy';
  let block = [];

  const flushBlock = () => {
    if (block.length) {
      buildRecordsFromBlock(block, section, difficulty).forEach(record => {
        const key = `${record.type}::${record.question.toLowerCase().replace(/\s+/g, ' ').trim()}`;
        if (record.question && !seen.has(key)) {
          seen.add(key);
          record.id = `q-${questions.length + 1}`;
          questions.push(record);
        }
      });
    }
    block = [];
  };

  for (const rawLine of lines) {
    const line = normalizeMarkdownLine(rawLine);
    const sectionMatch = line.match(/^##\s+(SECTION[^#].*)$/i);
    if (sectionMatch) {
      flushBlock();
      section = cleanMarkdownText(sectionMatch[1]);
      difficulty = sectionDifficulty(section);
      continue;
    }
    if (/^-{3,}$/.test(line)) {
      flushBlock();
      continue;
    }
    block.push(line);
  }
  flushBlock();

  return questions;
}

/* Map a section title to a difficulty bucket used by the question pool. */
function sectionDifficulty(sectionTitle) {
  const title = sectionTitle.toLowerCase();
  if (/section\s*4|clinical|sba/.test(title)) return 'hard';
  if (/section\s*3|wash|period poverty/.test(title)) return 'medium';
  return 'easy';
}

/*
 * Turn a single markdown block (delimited by --- rules) into question records.
 * A block may yield a True/False record, a multiple-choice record, or both.
 */
function buildRecordsFromBlock(blockLines, section, difficulty) {
  const lines = blockLines.map(line => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const statement = getBlockStatement(lines);
  const records = [];

  const trueFalse = extractTrueFalseRecord(lines, statement, section, difficulty);
  if (trueFalse) records.push(trueFalse);

  /* Section 2 MCQs are auto-generated with truncated/generic options, so they
     are skipped for quality; its True/False statements are still included. */
  if (!/section\s*2/i.test(section)) {
    const mcq = extractMcqRecord(lines, statement, section, difficulty);
    if (mcq) records.push(mcq);
  }

  return records;
}

/* Extract the statement/prompt text from a block's heading line. */
function getBlockStatement(lines) {
  const heading = lines[0] || '';
  let match;
  if ((match = heading.match(/^###\s+TF-\d+\.?\s*(.+)$/i))) return match[1].trim();
  if ((match = heading.match(/^###\s+Q\d+\.?\s*(.+)$/i))) return match[1].trim();
  if ((match = heading.match(/^\*\*\d+\.\s*(.+?)\*\*\s*$/))) return cleanMarkdownText(match[1]);
  return '';
}

/* Interpret an answer line as a boolean, using ✅/❌ markers or true/false words. */
function answerToBool(text) {
  if (/✅/.test(text) || /\btrue\b/i.test(text)) return true;
  if (/❌/.test(text) || /\bfalse\b/i.test(text)) return false;
  return null;
}

function extractTrueFalseRecord(lines, statement, section, difficulty) {
  let boolAnswer = null;
  let tfStatement = statement;

  const inlineIndex = lines.findIndex(line => /^\*\*True\/False Answer:\*\*/i.test(line));
  const promptIndex = lines.findIndex(line => /^\*\*True or False:\*\*/i.test(line));

  if (inlineIndex !== -1) {
    /* Sections 2 & 3: the statement is the heading; the answer is inline. */
    boolAnswer = answerToBool(lines[inlineIndex]);
  } else if (promptIndex !== -1) {
    /* Section 1: the statement follows the prompt; answer is the next Answer line. */
    tfStatement = lines[promptIndex].replace(/^\*\*True or False:\*\*/i, '').trim();
    const answerIndex = lines.findIndex((line, i) => i > promptIndex && /^\*\*Answer:\*\*/i.test(line));
    if (answerIndex !== -1) boolAnswer = answerToBool(lines[answerIndex]);
  } else {
    return null;
  }

  tfStatement = (tfStatement || '').replace(/^True or False:\s*/i, '').trim();
  if (boolAnswer === null || !tfStatement) return null;

  return {
    id: '',
    question: tfStatement,
    options: [],
    answer: boolAnswer,
    answerText: boolAnswer ? 'True' : 'False',
    explanation: getBlockExplanation(lines, 'first'),
    type: 'true-false',
    section,
    difficulty,
  };
}

function extractMcqRecord(lines, statement, section, difficulty) {
  /* Options appear as "- A) text" (S1/S3) or "- **A.** text" (S4); ✅ marks the answer. */
  const optionPattern = /^-\s*(?:\*\*)?([A-E])[.)](?:\*\*)?\s*(.+?)\s*$/;
  const options = [];
  const seenLabels = new Set();
  let firstOptionIndex = -1;

  lines.forEach((line, index) => {
    const match = line.match(optionPattern);
    if (!match) return;
    if (firstOptionIndex === -1) firstOptionIndex = index;
    const label = match[1].toUpperCase();
    if (seenLabels.has(label)) return; /* dedupe repeated correct-answer lines (S4) */
    seenLabels.add(label);
    const rawText = match[2];
    options.push({
      label,
      text: cleanMarkdownText(rawText.replace(/[✅❌]/g, '')).trim(),
      correct: /✅/.test(rawText),
    });
  });

  if (options.length < 2) return null;

  let answer = options.find(option => option.correct)?.label || null;
  if (!answer) {
    const answerLine = lines.slice(firstOptionIndex).find(line => /^\*\*?Answer:/i.test(line));
    const letterMatch = answerLine && answerLine.match(/\b([A-E])\b/i);
    if (letterMatch) answer = letterMatch[1].toUpperCase();
  }
  if (!answer) return null;

  let prompt = '';
  const mcqIndex = lines.findIndex(line => /^\*\*MCQ/i.test(line));
  if (mcqIndex !== -1) {
    prompt = lines[mcqIndex]
      .replace(/^\*\*MCQ[-:]?\s*(?:Q?\d+)?\.?\s*/i, '')
      .replace(/\*\*/g, '')
      .replace(/^[:.]\s*/, '')
      .trim();
  }
  if (!prompt) {
    /* Section 4: the prompt is the bold scenario line before the options. */
    for (let i = 0; i < firstOptionIndex; i++) {
      const line = lines[i];
      if (/^\*\*.+\*\*$/.test(line) && !/^\*\*(Answer|Explanation|MCQ|True)/i.test(line)) {
        // Strip the bold markers first so cleanMarkdownText can't mistake a
        // leading "**" for a bullet and leave a stray asterisk behind.
        prompt = cleanMarkdownText(line.replace(/\*\*/g, ''));
        break;
      }
    }
  }
  if (!prompt) prompt = statement;
  if (!prompt) return null;

  /* Skip auto-generated template MCQs ("Which statement about X is correct?" /
     "Which of the following is correct regarding X?"): their options are generic
     filler and their answers are unreliable. The trailing "is correct?" keeps
     this from catching real questions like "…is scientifically accurate?". */
  if (/^which statement about .+ is correct\?\s*$/i.test(prompt) || /^which of the following is correct regarding/i.test(prompt)) {
    return null;
  }

  return {
    id: '',
    question: prompt,
    options: options.map(option => ({ label: option.label, text: option.text })),
    answer,
    answerText: answer,
    explanation: getBlockExplanation(lines, 'last'),
    type: 'mcq',
    section,
    difficulty,
  };
}

/* Pull an explanation from a block; blocks may hold one for the TF and one for the MCQ. */
function getBlockExplanation(lines, which) {
  const explanations = lines
    .filter(line => /^\*\*Explanation:\*\*/i.test(line))
    .map(line => cleanMarkdownText(line.replace(/^\*\*Explanation:\*\*/i, '')))
    .filter(text => text && !/^(true|false)$/i.test(text));
  if (!explanations.length) return '';
  return which === 'last' ? explanations[explanations.length - 1] : explanations[0];
}

/* ---- shared markdown helpers ---- */
function normalizeMarkdownLine(line) {
  return line
    .replace(/<[^>]+>/g, '')
    .replace(/\\---/g, '---')
    .trim();
}

function cleanMarkdownText(text) {
  return text
    .replace(/^\s*[-*]\s*/, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/[_`]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Categorize loaded questions into difficulty buckets
 */
function categorizeQuestionsByDifficulty() {
  difficultyLevels.easy = questions.filter(q => q.difficulty === 'easy');
  difficultyLevels.medium = questions.filter(q => q.difficulty === 'medium');
  difficultyLevels.hard = questions.filter(q => q.difficulty === 'hard');
  questionBankMetadata = questions.reduce((metadata, question) => {
    metadata.total += 1;
    metadata.byType[question.type] = (metadata.byType[question.type] || 0) + 1;
    metadata.byDifficulty[question.difficulty] = (metadata.byDifficulty[question.difficulty] || 0) + 1;
    metadata.bySection[question.section] = (metadata.bySection[question.section] || 0) + 1;
    return metadata;
  }, {
    total: 0,
    byType: {},
    byDifficulty: {},
    bySection: {},
  });

  console.log('Question bank loaded', questionBankMetadata);
}

/**
 * Load fallback menstrual health questions if parsing fails
 */
function loadFallbackQuestions() {
  questions = [
    { question: "Menstruation is the monthly shedding of the uterine lining.", answer: true, type: 'true-false', difficulty: 'easy' },
    { question: "What is the average length of a menstrual cycle?", options: [{label: 'A', text: '21 days'}, {label: 'B', text: '28 days'}, {label: 'C', text: '35 days'}, {label: 'D', text: '40 days'}], answer: "B", type: 'mcq', difficulty: 'easy' },
    { question: "True or False: A menstrual cycle of 28 days is standard for all women.", answer: false, type: 'true-false', difficulty: 'easy' },
    { question: "Which hormone is primarily responsible for preparing the uterine lining for pregnancy?", options: [{label: 'A', text: 'Insulin'}, {label: 'B', text: 'Estrogen'}, {label: 'C', text: 'Testosterone'}, {label: 'D', text: 'Melatonin'}], answer: "B", type: 'mcq', difficulty: 'easy' },
    { question: "True or False: Using unclean cloths during menstruation can lead to infections.", answer: true, type: 'true-false', difficulty: 'medium' },
    { question: "What are the most common menstrual hygiene products?", options: [{label: 'A', text: 'Sanitary pads, tampons, and menstrual cups'}, {label: 'B', text: 'Paper towels and tissues'}, {label: 'C', text: 'Cotton balls'}, {label: 'D', text: 'Sponges'}], answer: "A", type: 'mcq', difficulty: 'medium' },
    { question: "True or False: Leaving a tampon in for too long can increase the risk of toxic shock syndrome (TSS).", answer: true, type: 'true-false', difficulty: 'medium' },
    { question: "Which of the following can help alleviate menstrual cramps?", options: [{label: 'A', text: 'Eating very salty foods'}, {label: 'B', text: 'Drinking icy cold water'}, {label: 'C', text: 'Applying heat to the abdomen'}, {label: 'D', text: 'Avoiding all physical movement'}], answer: "C", type: 'mcq', difficulty: 'hard' },
    { question: "True or False: PCOS can lead to menstrual irregularities and infertility.", answer: true, type: 'true-false', difficulty: 'hard' },
    { question: "What is endometriosis?", options: [{label: 'A', text: 'A normal part of the menstrual cycle'}, {label: 'B', text: 'Tissue similar to the uterine lining growing outside the uterus'}, {label: 'C', text: 'A type of menstrual product'}, {label: 'D', text: 'A hormonal medication'}], answer: "B", type: 'mcq', difficulty: 'hard' },
  ];
  
  difficultyLevels.easy = questions.filter(q => q.difficulty === 'easy');
  difficultyLevels.medium = questions.filter(q => q.difficulty === 'medium');
  difficultyLevels.hard = questions.filter(q => q.difficulty === 'hard');

  console.log('Using fallback questions');
}

/* Game rules for carousel display */
const gameRules = [
  {
    title: "How to Play",
    description: "Roll the dice to move your piece across the board. Answer menstrual health questions to climb ladders and avoid snakes. The first player to reach the final tile wins!",
    icon: "🎮"
  },
  {
    title: "Rolling the Dice",
    description: "You must roll a 6 to enter the board. After that, each roll moves your piece forward. Rolling a 6 gives you an extra turn!",
    icon: "🎲"
  },
  {
    title: "Snakes & Ladders",
    description: "Landing on a snake sends you down. Landing on a ladder moves you up. Answer menstrual health questions to decide your fate!",
    icon: "🐍"
  },
  {
    title: "Health Questions",
    description: "Answer true or false questions about menstrual health awareness. Get it right and you climb the ladder or avoid the snake!",
    icon: "❓"
  },
  {
    title: "Winning the Game",
    description: "Be the first player to reach square 100 to win. You must land exactly on 100 or bounce back if you overshoot.",
    icon: "🏆"
  },
  {
    title: "Health Tips",
    description: "Healthy hygiene, supportive conversations, timely care, and accurate cycle knowledge all help people manage menstruation safely and with dignity.",
    icon: "💪"
  },
  {
    title: "Let's Begin!",
    description: "Configure your player names and click Start Game to begin. Have fun while learning about menstrual health!",
    icon: "✨"
  }
];

/* ============================================================================
   GAME STATE MANAGEMENT
   ============================================================================ */

let gameState = createInitialGameState();

function createInitialGameState(playerConfigs = []) {
  const defaultAvatars = [
    "assets/images/player11.png",
    "assets/images/player22.png",
    "assets/images/player11.png",
    "assets/images/player22.png",
  ];
  const players = [];
  const count = Math.min(playerConfigs.length || 2, 4);
  for (let i = 0; i < count; i++) {
    const cfg = playerConfigs[i] || {};
    const name = typeof cfg === 'string' ? cfg : cfg.name || `Player ${i + 1}`;
    const avatar = typeof cfg === 'string' ? defaultAvatars[i] : cfg.avatar || defaultAvatars[i] || defaultAvatars[0];
    const isAI = typeof cfg === 'string' ? false : cfg.isAI || false;
    players.push({
      name,
      position: 0,
      element: null,
      avatar,
      hasStarted: false,
      score: 0,
      streak: 0,
      achievements: [],
      isAI,
    });
  }
  // Ensure at least two players for legacy UI
  while (players.length < 2) {
    const i = players.length;
    const name = `Player ${i + 1}`;
    const avatar = defaultAvatars[i] || defaultAvatars[0];
    players.push({
      name,
      position: 0,
      element: null,
      avatar,
      hasStarted: false,
      score: 0,
      streak: 0,
      achievements: [],
      isAI: false,
    });
  }
  return {
    currentPlayer: 0,
    players,
    isGameOver: false,
    isQuestionActive: false,
    isRolling: false,
    questionPool: [],
    usedQuestions: [],
    difficulty: 'all',   /* pool filter: all | easy | medium | hard */
    timerSeconds: 0,     /* per-question countdown; 0 = off */
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
  voices: [],
  
  /* Get the best available voice from system */
  getBestVoice() {
    /* Use cached voices if available (voices may load asynchronously) */
    let voices = this.voices.length ? this.voices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    /* Priority: Try to find a natural-sounding English voice */
    const preferredNames = ['Google US English', 'Microsoft Zira', 'Daniel', 'Samantha', 'Victoria', 'Karen'];
    for (let preferred of preferredNames) {
      const match = voices.find(v => v.name.includes(preferred));
      if (match) return match;
    }

    /* Fallback: Use first English voice */
    const englishVoice = voices.find(v => v.lang && v.lang.startsWith && v.lang.startsWith('en'));
    return englishVoice || voices[0];
  },

  /* Initialize voice list and listen for changes */
  init() {
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = window.speechSynthesis.getVoices() || [];
      };
    } catch (e) {
      this.voices = [];
    }
  },
  
  speak(text) {
    if (!this.isSupported || !appState.readAloudEnabled) return;
    
    /* Cancel any ongoing speech */
    this.stop();
    
    // Minimal timeout to let the cancellation register before starting new speech
    setTimeout(() => {
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
    }, 50);
  },
  
  stop() {
    window.speechSynthesis.cancel();
    this.isSpeaking = false;
    elements.readAloudBtn?.classList.remove('btn-active');
  }
};

/* ============================================================================
   DOM ELEMENTS CACHE
   ============================================================================ */

const elements = {};
let aiTurnTimer = null;
let questionTimerId = null;   /* interval id for the per-question countdown */

/* ---------------------------------------------------------------
   Per-question countdown timer. Off when timerSeconds is 0.
   onExpire is called once if the player runs out of time.
   --------------------------------------------------------------- */
function clearQuestionTimer() {
  if (questionTimerId !== null) {
    clearInterval(questionTimerId);
    questionTimerId = null;
  }
  if (elements.questionTimer) elements.questionTimer.hidden = true;
}

function startQuestionTimer(onExpire) {
  clearQuestionTimer();
  const total = gameState.timerSeconds || 0;
  const chip = elements.questionTimer;
  if (!total || !chip) return;

  let remaining = total;
  const render = () => {
    chip.hidden = false;
    chip.textContent = `⏱ ${remaining}s`;
    chip.classList.toggle('question-timer-urgent', remaining <= 5);
  };
  render();

  questionTimerId = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearQuestionTimer();
      onExpire();
      return;
    }
    render();
  }, 1000);
}

function cacheElements() {
  Object.assign(elements, {
    // Navbar
    backBtn: document.getElementById('back-btn'),
    rulesBtn: document.getElementById('rules-btn'),
    historyBtn: document.getElementById('history-btn'),
    themeBtn: document.getElementById('theme-btn'),
    musicBtn: document.getElementById('music-btn'),
    soundBtn: document.getElementById('sound-btn'),
    readAloudBtn: document.getElementById('read-aloud-btn'),

    // Game board & controls
    boardImg: document.getElementById('board-img'),
    player1: document.getElementById('player1'),
    player2: document.getElementById('player2'),
    player3: document.getElementById('player3'),
    player4: document.getElementById('player4'),
    diceValueDisplay: document.getElementById('dice-value-display'),
    currentPlayerName: document.getElementById('current-player-name'),
    // name displays for up to 4 players
    player1NameDisplay: document.getElementById('player1-name-display'),
    player2NameDisplay: document.getElementById('player2-name-display'),
    player3NameDisplay: document.getElementById('player3-name-display'),
    player4NameDisplay: document.getElementById('player4-name-display'),
    player1Card: document.querySelector('.player-card-1'),
    player2Card: document.querySelector('.player-card-2'),
    player3Card: document.querySelector('.player-card-3'),
    player4Card: document.querySelector('.player-card-4'),
    player1CardAvatar: document.getElementById('player1-card-avatar'),
    player2CardAvatar: document.getElementById('player2-card-avatar'),
    player3CardAvatar: document.getElementById('player3-card-avatar'),
    player4CardAvatar: document.getElementById('player4-card-avatar'),

    // Buttons
    rollDiceBtn: document.getElementById('roll-dice'),
    restartBtn: document.getElementById('restart'),

    // Modals
    setupModal: document.getElementById('setup-modal'),
    questionModal: document.getElementById('question-modal'),
    winnerModal: document.getElementById('winner-modal'),

    // Setup modal - Rules carousel
    rulesCarousel: document.getElementById('rules-carousel'),
    carouselSlides: document.getElementById('carousel-slides'),
    carouselIndicators: document.getElementById('carousel-indicators'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),
    skipRules: document.getElementById('skip-rules'),
    dontShowAgain: document.getElementById('dont-show-again'),

    // Setup modal - Player setup
    playerSetup: document.getElementById('player-setup'),
    player1NameInput: document.getElementById('player1-name'),
    player2NameInput: document.getElementById('player2-name'),
    player3NameInput: document.getElementById('player3-name'),
    player4NameInput: document.getElementById('player4-name'),
    playerCountSelect: document.getElementById('player-count'),
    difficultySelect: document.getElementById('difficulty-select'),
    timerSelect: document.getElementById('timer-select'),
    player3InputGroup: document.getElementById('player3-input-group'),
    player4InputGroup: document.getElementById('player4-input-group'),
    player1AvatarSelection: document.getElementById('player1-avatar-selection'),
    player2AvatarSelection: document.getElementById('player2-avatar-selection'),
    player3AvatarSelection: document.getElementById('player3-avatar-selection'),
    player4AvatarSelection: document.getElementById('player4-avatar-selection'),
    aiToggles: document.querySelectorAll('.ai-toggle'),
    startGameBtn: document.getElementById('start-game'),

    // Question modal
    questionTitle: document.getElementById('question-title'),
    questionTimer: document.getElementById('question-timer'),
    questionText: document.getElementById('question-text'),
    mcqOptions: document.getElementById('mcq-options'),
    trueBtn: document.getElementById('true-btn'),
    falseBtn: document.getElementById('false-btn'),
    questionFeedback: document.getElementById('question-feedback'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    continueBtn: document.getElementById('continue-btn'),

    // Winner modal
    winnerText: document.getElementById('winner-text'),
    winnerAvatar: document.getElementById('winner-avatar'),
    winnerScores: document.getElementById('winner-scores'),
    playAgainBtn: document.getElementById('play-again-btn'),

    // Resume-game modal
    resumeModal: document.getElementById('resume-modal'),
    resumeSummary: document.getElementById('resume-summary'),
    resumeContinueBtn: document.getElementById('resume-continue-btn'),
    resumeNewBtn: document.getElementById('resume-new-btn'),

    // History modal
    historyModal: document.getElementById('history-modal'),
    historyList: document.getElementById('history-list'),
    historyCloseBtn: document.getElementById('history-close-btn'),

    // Audio
    backgroundMusic: document.getElementById('background-music'),
    questionSound: document.getElementById('question-sound'),
    snakeSound: document.getElementById('snake-sound'),
    ladderSound: document.getElementById('ladder-sound'),
    diceSound: document.getElementById('dice-sound'),
    winSound: document.getElementById('win-sound'),
  });
}

function setupAvatarSelection() {
  const mapBtnHandlers = (container, tokenElement, cardElement) => {
    if (!container) return;
    container.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const avatar = btn.dataset.avatar;
        setSelectedAvatar(container, avatar, tokenElement, cardElement);
      });
    });
  };

  mapBtnHandlers(elements.player1AvatarSelection, elements.player1, elements.player1CardAvatar);
  mapBtnHandlers(elements.player2AvatarSelection, elements.player2, elements.player2CardAvatar);
  mapBtnHandlers(elements.player3AvatarSelection, elements.player3, elements.player3CardAvatar);
  mapBtnHandlers(elements.player4AvatarSelection, elements.player4, elements.player4CardAvatar);
  syncAvatarPicker(0, getSelectedAvatar(elements.player1AvatarSelection, "assets/images/player11.png"));
  syncAvatarPicker(1, getSelectedAvatar(elements.player2AvatarSelection, "assets/images/player22.png"));
  syncAvatarPicker(2, getSelectedAvatar(elements.player3AvatarSelection, "assets/images/player11.png"));
  syncAvatarPicker(3, getSelectedAvatar(elements.player4AvatarSelection, "assets/images/player22.png"));
}

function setSelectedAvatar(container, avatar, tokenElement, cardElement) {
  if (!container || !avatar) return;

  container.querySelectorAll('.avatar-option').forEach(btn => {
    const isSelected = btn.dataset.avatar === avatar;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-pressed', String(isSelected));
  });

  if (tokenElement) tokenElement.src = avatar;
  if (cardElement) cardElement.src = avatar;
}

function getSelectedAvatar(container, fallback) {
  return container?.querySelector('.avatar-option.selected')?.dataset.avatar || fallback;
}

function applyPlayerAvatar(playerIndex, avatar) {
  const player = gameState.players[playerIndex];
  if (!player || !avatar) return;

  player.avatar = avatar;
  const token = [elements.player1, elements.player2, elements.player3, elements.player4][playerIndex];
  if (player.element) player.element.src = avatar;
  if (token) token.src = avatar;

  const cardAvatar = [
    elements.player1CardAvatar,
    elements.player2CardAvatar,
    elements.player3CardAvatar,
    elements.player4CardAvatar,
  ][playerIndex];
  if (cardAvatar) cardAvatar.src = avatar;
}

function syncAvatarPicker(playerIndex, avatar) {
  const container = [
    elements.player1AvatarSelection,
    elements.player2AvatarSelection,
    elements.player3AvatarSelection,
    elements.player4AvatarSelection,
  ][playerIndex];
  const tokenElement = [elements.player1, elements.player2, elements.player3, elements.player4][playerIndex];
  const cardElement = [
    elements.player1CardAvatar,
    elements.player2CardAvatar,
    elements.player3CardAvatar,
    elements.player4CardAvatar,
  ][playerIndex];
  setSelectedAvatar(container, avatar, tokenElement, cardElement);
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Escape a string so it is safe to inject into innerHTML. Player names are the
   only user-supplied text that reaches HTML templates (scoreboard, history). */
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

/* ---------------------------------------------------------------
   Scoring: +10 per correct answer, +5 bonus every 3-in-a-row streak.
   --------------------------------------------------------------- */
function recordAnswer(isCorrect) {
  const player = gameState.players[gameState.currentPlayer];
  if (!player) return;

  if (isCorrect) {
    player.streak = (player.streak || 0) + 1;
    let gained = POINTS_PER_CORRECT;
    if (player.streak % STREAK_THRESHOLD === 0) gained += STREAK_BONUS;
    player.score = (player.score || 0) + gained;
  } else {
    player.streak = 0;
  }

  updateScoreboardUi();
}

/* Refresh the per-player score and streak badges on the player cards. */
function updateScoreboardUi() {
  for (let i = 0; i < 4; i++) {
    const player = gameState.players[i];
    const scoreEl = document.getElementById(`player${i + 1}-score-display`);
    const badgeEl = document.getElementById(`player${i + 1}-streak-badge`);
    if (scoreEl && player) scoreEl.textContent = `${player.score || 0} pts`;
    if (badgeEl && player) {
      const streaking = (player.streak || 0) >= STREAK_THRESHOLD;
      badgeEl.hidden = !streaking;
      const countEl = badgeEl.querySelector('.streak-count');
      if (countEl) countEl.textContent = String(player.streak || 0);
    }
  }
}

function getPlayerToken(index) {
  return [elements.player1, elements.player2, elements.player3, elements.player4][index] || null;
}

function getPlayerNameDisplay(index) {
  return [
    elements.player1NameDisplay,
    elements.player2NameDisplay,
    elements.player3NameDisplay,
    elements.player4NameDisplay,
  ][index] || null;
}

function getPlayerCard(index) {
  return [
    elements.player1Card,
    elements.player2Card,
    elements.player3Card,
    elements.player4Card,
  ][index] || null;
}

function updatePlayerSetupVisibility() {
  const count = Number(elements.playerCountSelect?.value || 2);
  if (elements.player3InputGroup) elements.player3InputGroup.hidden = count < 3;
  if (elements.player4InputGroup) elements.player4InputGroup.hidden = count < 4;
}

function getAiSetting(playerNumber) {
  return Boolean(document.querySelector(`.ai-toggle[data-player="${playerNumber}"]`)?.checked);
}

function updatePlayersUi() {
  const activeCount = gameState.players.length;
  for (let i = 0; i < 4; i++) {
    const player = gameState.players[i];
    const isActive = i < activeCount;
    const token = getPlayerToken(i);
    const card = getPlayerCard(i);
    const nameDisplay = getPlayerNameDisplay(i);

    if (token) {
      token.hidden = !isActive;
      if (isActive) {
        token.alt = `${player.name} token`;
        token.src = player.avatar;
        player.element = token;
        updatePlayerPosition(i, player.position);
      }
    }

    if (card) card.hidden = !isActive;
    if (nameDisplay && isActive) {
      nameDisplay.textContent = player.isAI ? `${player.name} (AI)` : player.name;
    }
    if (isActive) applyPlayerAvatar(i, player.avatar);
  }

  elements.currentPlayerName.textContent = gameState.players[gameState.currentPlayer]?.name || "Player 1";
  updateScoreboardUi();
}

function showRulesStep() {
  elements.setupModal.classList.add('modal-active');
  elements.rulesCarousel.hidden = false;
  elements.playerSetup.hidden = true;
  elements.startGameBtn.hidden = true;
  currentRuleSlide = 0;
  updateCarouselSlide(0);
}

function showPlayerSetupStep() {
  elements.setupModal.classList.add('modal-active');
  elements.rulesCarousel.hidden = true;
  elements.playerSetup.hidden = false;
  elements.startGameBtn.hidden = false;
  updatePlayerSetupVisibility();
}

/* ---------------------------------------------------------------
   IndexedDB persistence helpers (fallback to localStorage)
   --------------------------------------------------------------- */
const DB_NAME = 'MenstrualGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'games';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('byDate', 'timestamp');
        store.createIndex('current', 'isCurrent');
      }
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function deleteCurrentRecord(store) {
  const curIdx = store.index('current');
  const curCursor = await idbRequest(curIdx.openCursor(IDBKeyRange.only(1)));
  if (curCursor) {
    curCursor.delete();
  }
}

async function clearCurrentGame() {
  if (!window.indexedDB) {
    localStorage.removeItem('menstrualGame_current');
    return;
  }

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await deleteCurrentRecord(store);
  await transactionDone(tx);
}

async function persistCurrentGame(state) {
  if (!window.indexedDB) {
    localStorage.setItem('menstrualGame_current', JSON.stringify(state));
    return;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await deleteCurrentRecord(store);
  store.put({ timestamp: Date.now(), isCurrent: 1, state });
  await transactionDone(tx);
}

async function loadCurrentGame() {
  if (!window.indexedDB) {
    const raw = localStorage.getItem('menstrualGame_current');
    return raw ? JSON.parse(raw) : null;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const idx = tx.objectStore(STORE_NAME).index('current');
  const cursor = await idbRequest(idx.openCursor(IDBKeyRange.only(1)));
  return cursor ? cursor.value.state : null;
}

async function archiveFinishedGame(state) {
  if (!window.indexedDB) {
    // store under a different key for history – simple array in localStorage
    const hist = JSON.parse(localStorage.getItem('menstrualGame_history') || '[]');
    hist.unshift({ timestamp: Date.now(), state });
    localStorage.setItem('menstrualGame_history', JSON.stringify(hist.slice(0, 50)));
    // also clear current record
    localStorage.removeItem('menstrualGame_current');
    return;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await deleteCurrentRecord(store);
  store.put({ timestamp: Date.now(), isCurrent: 0, state });
  await transactionDone(tx);
}

async function fetchGameHistory(limit = 10) {
  if (!window.indexedDB) {
    const raw = localStorage.getItem('menstrualGame_history');
    if (!raw) return [];
    const all = JSON.parse(raw);
    return all.slice(0, limit);
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const allGames = await idbRequest(store.getAll());
  return allGames
    .filter(game => !game.isCurrent)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
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

/* Three.js 3D Dice Simulation Setup */
let dice3D = {
  scene: null,
  camera: null,
  renderer: null,
  diceMesh: null,
  isRolling: false,
  targetRotation: { x: 0, y: 0, z: 0 },
  currentRotation: { x: 0, y: 0, z: 0 },
  animationFrameId: null,
  rollStartTime: 0,
  rollDuration: 1400,
  startRotation: { x: 0, y: 0, z: 0 },
  tumbleSpeeds: { x: 0, y: 0, z: 0 },
};

function init3DDice() {
  const container = document.getElementById('dice-canvas-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  const width = container.clientWidth || 120;
  const height = container.clientHeight || 120;

  // Scene
  dice3D.scene = new THREE.Scene();

  // Camera
  dice3D.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  dice3D.camera.position.set(0, 0, 4.5);

  // Renderer
  dice3D.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  dice3D.renderer.setSize(width, height);
  dice3D.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  dice3D.renderer.shadowMap.enabled = true;
  container.appendChild(dice3D.renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  dice3D.scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  dirLight.castShadow = true;
  dice3D.scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.4);
  dirLight2.position.set(-5, -5, 2);
  dice3D.scene.add(dirLight2);

  // Create Dice Materials
  const materials = [];
  for (let face = 1; face <= 6; face++) {
    materials.push(new THREE.MeshStandardMaterial({
      map: createDiceFaceTexture(face),
      roughness: 0.15,
      metalness: 0.05
    }));
  }

  // BoxGeometry
  const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
  dice3D.diceMesh = new THREE.Mesh(geometry, materials);
  dice3D.diceMesh.castShadow = true;
  dice3D.scene.add(dice3D.diceMesh);

  // Default rotation facing 1
  setDice3DFaceAngle(1);

  // Resize listener
  const resizeObserver = new ResizeObserver(() => {
    if (!container || !dice3D.renderer || !dice3D.camera) return;
    const w = container.clientWidth || 120;
    const h = container.clientHeight || 120;
    dice3D.camera.aspect = w / h;
    dice3D.camera.updateProjectionMatrix();
    dice3D.renderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  // Start static render loop
  renderStatic();
}

function renderStatic() {
  if (!dice3D.isRolling && dice3D.renderer && dice3D.scene && dice3D.camera) {
    dice3D.renderer.render(dice3D.scene, dice3D.camera);
  }
}

// Draw the canvas texture for rounded corners and pips
function createDiceFaceTexture(faceValue) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background/Face Fill with Rounded Borders
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle border shading
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 16;
  ctx.strokeRect(0, 0, 256, 256);

  // Ambient shading on edges
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 180);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(226, 232, 240, 0.6)');
  ctx.fillStyle = gradient;
  ctx.fillRect(8, 8, 240, 240);

  // Draw Pips
  ctx.fillStyle = '#1e293b';
  const pipRadius = 22;

  const positions = {
    tl: [65, 65],
    tr: [191, 65],
    ml: [65, 128],
    mc: [128, 128],
    mr: [191, 128],
    bl: [65, 191],
    br: [191, 191]
  };

  const pipsForFace = {
    1: ['mc'],
    2: ['tl', 'br'],
    3: ['tl', 'mc', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'mc', 'bl', 'br'],
    6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
  };

  const activePips = pipsForFace[faceValue] || [];
  activePips.forEach(posKey => {
    const [x, y] = positions[posKey];
    ctx.beginPath();
    ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight on pips
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(x - 5, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b'; // restore
  });

  return new THREE.CanvasTexture(canvas);
}

// Map rolled integers to exact Euler rotations
function getEulerForFace(face) {
  // Three.js order: right, left, top, bottom, front, back
  // Front: 1, Back: 2, Right: 3, Left: 4, Top: 5, Bottom: 6
  // We match standard texture mapping
  switch (face) {
    case 1: return { x: 0, y: 0, z: 0 };
    case 2: return { x: 0, y: Math.PI, z: 0 };
    case 3: return { x: 0, y: -Math.PI / 2, z: 0 };
    case 4: return { x: 0, y: Math.PI / 2, z: 0 };
    case 5: return { x: -Math.PI / 2, y: 0, z: 0 };
    case 6: return { x: Math.PI / 2, y: 0, z: 0 };
    default: return { x: 0, y: 0, z: 0 };
  }
}

function setDice3DFaceAngle(face) {
  if (!dice3D.diceMesh) return;
  const rot = getEulerForFace(face);
  dice3D.diceMesh.rotation.set(rot.x, rot.y, rot.z);
  dice3D.currentRotation = { ...rot };
}

function animateRoll(timestamp) {
  if (!dice3D.rollStartTime) {
    dice3D.rollStartTime = timestamp;
  }

  const elapsed = timestamp - dice3D.rollStartTime;
  const progress = Math.min(elapsed / dice3D.rollDuration, 1);

  // Easing: Cubic Out for deceleration
  const t = progress;
  const easeOut = 1 - Math.pow(1 - t, 3);

  // Update rotation with tumbling effect
  if (progress < 1) {
    // Add realistic tumble rotation which decays over time
    const decay = 1 - easeOut;
    dice3D.diceMesh.rotation.x = dice3D.startRotation.x + (dice3D.targetRotation.x - dice3D.startRotation.x) * easeOut + Math.sin(t * Math.PI * 3.5) * 2.5 * decay;
    dice3D.diceMesh.rotation.y = dice3D.startRotation.y + (dice3D.targetRotation.y - dice3D.startRotation.y) * easeOut + Math.cos(t * Math.PI * 3.5) * 2.5 * decay;
    dice3D.diceMesh.rotation.z = dice3D.startRotation.z + (dice3D.targetRotation.z - dice3D.startRotation.z) * easeOut + Math.sin(t * Math.PI * 2) * 1.5 * decay;

    // Simulate jumping/tumble path by modifying Z position slightly
    dice3D.diceMesh.position.z = Math.sin(t * Math.PI) * 0.8 * decay;

    dice3D.renderer.render(dice3D.scene, dice3D.camera);
    dice3D.animationFrameId = requestAnimationFrame(animateRoll);
  } else {
    // Settle rotation exactly on target
    dice3D.diceMesh.rotation.set(dice3D.targetRotation.x, dice3D.targetRotation.y, dice3D.targetRotation.z);
    dice3D.diceMesh.position.set(0, 0, 0);
    dice3D.currentRotation = { ...dice3D.targetRotation };
    dice3D.renderer.render(dice3D.scene, dice3D.camera);
    dice3D.isRolling = false;
    cancelAnimationFrame(dice3D.animationFrameId);
  }
}

function setDiceFace(face) {
  setDice3DFaceAngle(face);
  renderStatic();

  const numSpan = elements.diceValueDisplay?.querySelector('.rolled-number');
  if (numSpan) {
    numSpan.textContent = face;
  } else if (elements.diceValueDisplay) {
    elements.diceValueDisplay.textContent = face;
  }
}

function setDiceRolling(isRolling) {
  // Handled internally in 3D loop
}

async function rollDice(options = {}) {
  return new Promise((resolve) => {
    playSound(elements.diceSound);

    // Add rolling state to value display
    elements.diceValueDisplay?.classList.add('value-rolling');

    // Determine target face
    let randomFace = Math.floor(Math.random() * 6) + 1;
    if (options.preferredFace && Math.random() < options.preferredFaceChance) {
      randomFace = options.preferredFace;
    }

    if (!dice3D.diceMesh) {
      // Fallback if Three.js failed to load
      setTimeout(() => {
        setDiceFace(randomFace);
        elements.diceValueDisplay?.classList.remove('value-rolling');
        resolve(randomFace);
      }, 1200);
      return;
    }

    // Cancel active animations
    if (dice3D.animationFrameId) {
      cancelAnimationFrame(dice3D.animationFrameId);
    }

    // Capture starting rotation
    dice3D.startRotation = {
      x: dice3D.diceMesh.rotation.x,
      y: dice3D.diceMesh.rotation.y,
      z: dice3D.diceMesh.rotation.z
    };

    // Calculate target rotation with multiples of 2PI for spinning
    const targetEuler = getEulerForFace(randomFace);
    const spinsX = (Math.floor(Math.random() * 3) + 2) * Math.PI * 2;
    const spinsY = (Math.floor(Math.random() * 3) + 2) * Math.PI * 2;

    dice3D.targetRotation = {
      x: targetEuler.x + spinsX,
      y: targetEuler.y + spinsY,
      z: targetEuler.z
    };

    dice3D.rollStartTime = 0;
    dice3D.isRolling = true;

    // Start animation loop
    requestAnimationFrame(animateRoll);

    // Sync aria labels and preview rolled number
    const numSpan = elements.diceValueDisplay?.querySelector('.rolled-number');
    if (numSpan) {
      numSpan.textContent = randomFace;
    }

    setTimeout(() => {
      elements.diceValueDisplay?.classList.remove('value-rolling');
      resolve(randomFace);
    }, dice3D.rollDuration);
  });
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
let pendingSavedGame = null;   /* saved game awaiting a Resume / New Game choice */

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
  elements.carouselNext.disabled = false;
  
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
  showPlayerSetupStep();
}

/* ============================================================================
   MODAL MANAGEMENT
   ============================================================================ */

/* ---------------------------------------------------------------
   Modal focus management: while a modal is open, keep Tab focus
   inside it, and return focus to the triggering element on close.
   --------------------------------------------------------------- */
const focusTrapState = new WeakMap();

function getFocusableElements(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(container.querySelectorAll(selector))
    .filter(el => !el.hidden && el.offsetParent !== null);
}

function activateFocusTrap(modal) {
  if (focusTrapState.has(modal)) return;

  const previouslyFocused = document.activeElement;
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !modal.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !modal.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  modal.addEventListener('keydown', handler);
  focusTrapState.set(modal, { handler, previouslyFocused });

  const focusable = getFocusableElements(modal);
  (focusable[0] || modal).focus();
}

function deactivateFocusTrap(modal) {
  const state = focusTrapState.get(modal);
  if (!state) return;
  modal.removeEventListener('keydown', state.handler);
  focusTrapState.delete(modal);
  if (typeof state.previouslyFocused?.focus === 'function') {
    state.previouslyFocused.focus();
  }
}

function showSetupModal(forceRules = false) {
  if (forceRules || appState.showRulesOnStart) {
    showRulesStep();
  } else {
    showPlayerSetupStep();
  }
  activateFocusTrap(elements.setupModal);
}

function hideSetupModal() {
  elements.setupModal.classList.remove('modal-active');
  deactivateFocusTrap(elements.setupModal);
  speechManager.stop();
}

function showQuestionModal(questionText) {
  elements.questionText.textContent = questionText;
  elements.questionModal.hidden = false;
  elements.questionModal.classList.add('modal-active');
  playSound(elements.questionSound);
  activateFocusTrap(elements.questionModal);

  /* Read aloud the question */
  speechManager.speak(questionText);
}

function hideQuestionModal() {
  clearQuestionTimer();
  elements.questionModal.hidden = true;
  elements.questionModal.classList.remove('modal-active');
  deactivateFocusTrap(elements.questionModal);
}

function showWinnerModal(playerName, playerElement) {
  elements.winnerText.textContent = `${playerName} wins the game!`;
  elements.winnerAvatar.src = playerElement?.src || "";
  elements.winnerAvatar.alt = `${playerName}'s avatar`;
  renderFinalScoreboard();
  elements.winnerModal.hidden = false;
  elements.winnerModal.classList.add('modal-active');
  playSound(elements.winSound);
  activateFocusTrap(elements.winnerModal);
}

/* Fill the winner modal with a final scoreboard sorted by score (desc). */
function renderFinalScoreboard() {
  if (!elements.winnerScores) return;
  const ranked = gameState.players
    .map((p, index) => ({ p, index }))
    .sort((a, b) => (b.p.score || 0) - (a.p.score || 0));

  elements.winnerScores.innerHTML = `
    <h3 class="scoreboard-title">Final Scores</h3>
    <ol class="scoreboard-list">
      ${ranked.map(({ p }) => `
        <li class="scoreboard-row">
          <img class="scoreboard-avatar" src="${escapeHtml(p.avatar || '')}" alt="">
          <span class="scoreboard-name">${escapeHtml(p.name)}${p.isAI ? ' (AI)' : ''}</span>
          <span class="scoreboard-score">${p.score || 0} pts</span>
        </li>
      `).join('')}
    </ol>
  `;
}

function hideWinnerModal() {
  elements.winnerModal.hidden = true;
  elements.winnerModal.classList.remove('modal-active');
  deactivateFocusTrap(elements.winnerModal);
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
    y: (row * 8.8) + 4.4,
  };
}

function updatePlayerPosition(playerIndex, position) {
  const coordinates = getPositionCoordinates(position);
  const player = gameState.players[playerIndex];
  if (player.element) {
    player.element.style.left = `${coordinates.x}%`;
    player.element.style.bottom = `${coordinates.y}%`;
  }
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

// ---------------------------------------------------------------------------
// QUESTION HANDLING – session‑unique question pool
// ---------------------------------------------------------------------------

// Build the list of pool-eligible questions for the selected difficulty, never
// returning an empty list when the bank has usable questions.
function getEligibleQuestions() {
  const isPlayable = q => q && (q.type === 'true-false' || q.type === 'mcq');
  const selected = gameState.difficulty || 'all';
  const playable = questions.filter(isPlayable);
  if (selected === 'all') return playable;
  const filtered = playable.filter(q => q.difficulty === selected);
  // Fall back to every playable question if the difficulty filter empties the pool.
  return filtered.length ? filtered : playable;
}

function shuffleInPlace(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Initialize a shuffled pool of questions for the current game session.
function initializeQuestionPool() {
  gameState.questionPool = shuffleInPlace(getEligibleQuestions().slice());
  gameState.usedQuestions = [];
}

// Retrieve the next question from the session pool, rebuilding if exhausted.
function getNextQuestion() {
  if (!gameState.questionPool || gameState.questionPool.length === 0) {
    const recent = gameState.usedQuestions.slice(-5);
    const eligible = getEligibleQuestions();
    // Avoid repeating the most recent questions unless that would empty the pool.
    let newPool = eligible.filter(q => !recent.includes(q));
    if (newPool.length === 0) newPool = eligible.slice();
    gameState.questionPool = shuffleInPlace(newPool);
    gameState.usedQuestions = [];
  }
  const next = gameState.questionPool.shift();
  if (next) gameState.usedQuestions.push(next);
  return next || null;
}

function getExplanationForQuestion(q) {
  if (!q) return "";
  if (q.explanation) return q.explanation;

  const idx = questions.indexOf(q);
  // Try to find a nearby Q&A question that can serve as an explanation
  // Look at idx - 1 first, then idx + 1, then search within +/- 3 range
  for (let offset of [-1, 1, -2, 2, -3, 3]) {
    const neighborIdx = idx + offset;
    if (neighborIdx >= 0 && neighborIdx < questions.length) {
      const neighbor = questions[neighborIdx];
      if (neighbor && neighbor.type === 'qa') {
        // Check if they share some keywords to be sure they are related
        const qWords = q.question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const nWords = neighbor.question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const common = qWords.filter(w => nWords.includes(w));
        if (common.length >= 1) {
          return neighbor.answerText;
        }
      }
    }
  }
  // Fallback: if no close match, just describe the correct statement
  if (q.answer === true) {
    return `${q.question.replace(/^True or False:\s*/i, '')} is correct.`;
  } else {
    return `The statement "${q.question.replace(/^True or False:\s*/i, '')}" is actually false.`;
  }
}

function showQuestion(callback) {
  // If the current player is AI, answer automatically without UI. The odds of a
  // correct answer scale with the selected difficulty of the question pool.
  const currentPlayer = gameState.players[gameState.currentPlayer];
  if (currentPlayer.isAI) {
    const accuracy = AI_ACCURACY[gameState.difficulty] ?? AI_ACCURACY.all;
    const autoAnswer = Math.random() < accuracy;
    setTimeout(() => {
      recordAnswer(autoAnswer);
      callback(autoAnswer);
    }, 300);
    return;
  }

  // Ensure the question bank is ready.
  if (questions.length === 0) {
    loadFallbackQuestions();
  }

  // Get a unique question for this turn.
  let nextQuestion = getNextQuestion();

  // Safety net: if the pool could not supply a question, rebuild from fallbacks
  // rather than crashing on an undefined question.
  if (!nextQuestion) {
    loadFallbackQuestions();
    initializeQuestionPool();
    nextQuestion = getNextQuestion();
  }
  if (!nextQuestion) {
    console.warn('No question available to display; skipping question.');
    callback(false);
    return;
  }

  // Reset the UI to initial question state
  elements.questionFeedback.classList.add('hidden');
  elements.continueBtn.classList.add('hidden');
  elements.mcqOptions.innerHTML = '';
  
  if (nextQuestion.type === 'mcq') {
    elements.trueBtn.classList.add('hidden');
    elements.falseBtn.classList.add('hidden');
    elements.mcqOptions.classList.remove('hidden');
    
    nextQuestion.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-mcq-option';
      btn.textContent = `${opt.label}) ${opt.text}`;
      btn.dataset.answer = opt.label;
      elements.mcqOptions.appendChild(btn);
      
      btn.addEventListener('click', () => handleSelect(opt.label, btn));
    });
  } else {
    elements.mcqOptions.classList.add('hidden');
    elements.trueBtn.classList.remove('hidden');
    elements.falseBtn.classList.remove('hidden');
    elements.trueBtn.addEventListener('click', onTrue);
    elements.falseBtn.addEventListener('click', onFalse);
  }

  showQuestionModal(nextQuestion.question);
  gameState.isQuestionActive = true;

  /* Start the countdown (if enabled). Running out of time counts as a wrong
     answer: resolve with a guaranteed-incorrect option. */
  startQuestionTimer(() => {
    const wrongAnswer = nextQuestion.type === 'mcq'
      ? (nextQuestion.options.find(opt => opt.label !== nextQuestion.answer)?.label ?? null)
      : !nextQuestion.answer;
    handleSelect(wrongAnswer, null, true);
  });

  function handleSelect(answer, clickedBtn = null, timedOut = false) {
    clearQuestionTimer();
    if (nextQuestion.type === 'mcq') {
      const buttons = elements.mcqOptions.querySelectorAll('button');
      buttons.forEach(b => {
        b.disabled = true;
        if (b.dataset.answer === nextQuestion.answer) {
          b.classList.add('correct');
        } else if (b === clickedBtn) {
          b.classList.add('incorrect');
        }
      });
    } else {
      elements.trueBtn.removeEventListener('click', onTrue);
      elements.falseBtn.removeEventListener('click', onFalse);
      
      // Hide True/False buttons
      elements.trueBtn.classList.add('hidden');
      elements.falseBtn.classList.add('hidden');
    }
    
    const isCorrect = (answer === nextQuestion.answer);
    const explanation = getExplanationForQuestion(nextQuestion);
    
    // Set feedback content
    if (isCorrect) {
      elements.questionFeedback.classList.remove('feedback-incorrect');
      elements.questionFeedback.classList.add('feedback-correct');
      elements.feedbackIcon.textContent = "🎉";
      elements.feedbackMessage.textContent = "Correct – well done!";
    } else {
      elements.questionFeedback.classList.remove('feedback-correct');
      elements.questionFeedback.classList.add('feedback-incorrect');
      elements.feedbackIcon.textContent = timedOut ? "⏱" : "❌";
      elements.feedbackMessage.textContent = timedOut
        ? "Time's up – that counts as incorrect."
        : "Incorrect – better luck next time.";
    }

    elements.feedbackExplanation.textContent = explanation;
    elements.questionFeedback.classList.remove('hidden');
    elements.continueBtn.classList.remove('hidden');

    // Speak feedback and explanation
    const incorrectSpoken = timedOut ? "Time's up. That counts as incorrect. " : "Incorrect – better luck next time. ";
    const feedbackText = (isCorrect ? "Correct – well done! " : incorrectSpoken) + explanation;
    speechManager.speak(feedbackText);

    // Update score and streak once the answer is locked in.
    recordAnswer(isCorrect);

    function onContinue() {
      elements.continueBtn.removeEventListener('click', onContinue);
      speechManager.stop();
      hideQuestionModal();
      gameState.isQuestionActive = false;
      callback(isCorrect);
    }
    
    elements.continueBtn.addEventListener('click', onContinue);
  }

  function onTrue() { handleSelect(true); }
  function onFalse() { handleSelect(false); }
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

  try {
    await questionBankReady;
    if (questions.length === 0) {
      loadFallbackQuestions();
    }

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
      completeTurnInteraction();
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
      completeTurnInteraction();
      return;
    }

    /* Check for snake/ladder */
    const boardJump = getBoardJump(newPosition);
    if (!boardJump) {
      finalizeTurn(newPosition);
      completeTurnInteraction();
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
      completeTurnInteraction();
    });
  } catch (error) {
    console.error('Unable to complete turn', error);
    completeTurnInteraction();
  }
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
    // Archive completed game and clear current save
    archiveFinishedGame({
      players: gameState.players.map(p => ({
        name: p.name,
        position: p.position,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak,
        achievements: p.achievements,
        isAI: p.isAI,
      })),
      currentPlayer: gameState.currentPlayer,
      winner: currentPlayer.name,
      difficulty: gameState.difficulty,
      timestamp: Date.now(),
    });
    clearCurrentGame().catch(error => {
      console.warn('Unable to clear current game', error);
    });
    return;
  }

  advanceTurn();
  // Persist ongoing game state after each turn
  persistCurrentGame({
      players: gameState.players.map(p => ({
      name: p.name,
      position: p.position,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      achievements: p.achievements,
      isAI: p.isAI,
    })),
    currentPlayer: gameState.currentPlayer,
    difficulty: gameState.difficulty,
    timerSeconds: gameState.timerSeconds,
    questionPool: gameState.questionPool?.map(q => q.id) || [],
  });
}

function advanceTurn() {
  gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
  elements.currentPlayerName.textContent = gameState.players[gameState.currentPlayer].name;
  setRollButtonForCurrentPlayer();
  scheduleAiTurnIfNeeded();
}

function scheduleAiTurnIfNeeded() {
  clearTimeout(aiTurnTimer);
  const currentPlayer = gameState.players[gameState.currentPlayer];
  if (!currentPlayer?.isAI || gameState.isGameOver || gameState.isQuestionActive || gameState.isRolling) {
    return;
  }

  elements.rollDiceBtn.disabled = true;
  aiTurnTimer = setTimeout(() => {
    handleTurn();
  }, 800);
}

function setRollButtonForCurrentPlayer() {
  if (gameState.isGameOver || gameState.isQuestionActive || gameState.isRolling) {
    elements.rollDiceBtn.disabled = true;
    return;
  }

  elements.rollDiceBtn.disabled = Boolean(gameState.players[gameState.currentPlayer]?.isAI);
}

function enableRollWhenQuestionsReady() {
  elements.rollDiceBtn.disabled = true;
  questionBankReady.finally(() => {
    setRollButtonForCurrentPlayer();
    scheduleAiTurnIfNeeded();
  });
}

function completeTurnInteraction() {
  gameState.isRolling = false;
  setDiceRolling(false);

  if (!gameState.isGameOver) {
    setRollButtonForCurrentPlayer();
    scheduleAiTurnIfNeeded();
  }
}

/* ============================================================================
   GAME SETUP & INITIALIZATION
   ============================================================================ */

function startGame() {
  clearTimeout(aiTurnTimer);
  const playerCount = Number(elements.playerCountSelect?.value || 2);
  const nameInputs = [
    elements.player1NameInput,
    elements.player2NameInput,
    elements.player3NameInput,
    elements.player4NameInput,
  ];
  const avatarSelections = [
    elements.player1AvatarSelection,
    elements.player2AvatarSelection,
    elements.player3AvatarSelection,
    elements.player4AvatarSelection,
  ];
  const defaultAvatars = [
    "assets/images/player11.png",
    "assets/images/player22.png",
    "assets/images/player11.png",
    "assets/images/player22.png",
  ];
  const playerConfigs = Array.from({ length: playerCount }, (_, index) => ({
    name: nameInputs[index]?.value.trim() || `Player ${index + 1}`,
    avatar: getSelectedAvatar(avatarSelections[index], defaultAvatars[index]),
    isAI: getAiSetting(index + 1),
  }));

  /* Check if user wants to hide rules on future starts */
  if (elements.dontShowAgain.checked) {
    localStorage.setItem('showRulesOnStart', 'false');
    appState.showRulesOnStart = false;
  }

  gameState = createInitialGameState(playerConfigs);
  gameState.difficulty = elements.difficultySelect?.value || 'all';
  gameState.timerSeconds = Number(elements.timerSelect?.value || 0);
  gameState.players.forEach((player, index) => {
    player.element = getPlayerToken(index);
    player.position = 0;
    player.hasStarted = false;
  });
  updatePlayersUi();
  initializeQuestionPool();

  hideSetupModal();

  gameState.currentPlayer = 0;
  gameState.isGameOver = false;
  gameState.isQuestionActive = false;
  gameState.isRolling = false;

  elements.restartBtn.hidden = false;
  playMusic(elements.backgroundMusic);
  enableRollWhenQuestionsReady();
}

function resetGame() {
  clearTimeout(aiTurnTimer);
  hideWinnerModal();
  const playerConfigs = gameState.players.map(p => ({
    name: p.name,
    avatar: p.avatar,
    isAI: p.isAI,
  }));
  gameState = createInitialGameState(playerConfigs);
  gameState.players.forEach((player, index) => {
    player.element = getPlayerToken(index);
    syncAvatarPicker(index, player.avatar);
  });

  setDiceRolling(false);
  setDiceFace(1);
  updatePlayersUi();
  elements.rollDiceBtn.hidden = false;
  // A restart keeps the game in progress, so the Restart button stays visible.
  elements.restartBtn.hidden = false;

  gameState.players.forEach((player, index) => {
    updatePlayerPosition(index, 0);
  });

  playMusic(elements.backgroundMusic);
  enableRollWhenQuestionsReady();
}

function showRulesModal() {
  showSetupModal(true);
}

/* ============================================================================
   RESUME-GAME PROMPT
   ============================================================================ */

function promptResume(saved) {
  hideSetupModal();
  if (elements.resumeSummary) {
    const names = (saved.players || []).map(p => p.name).join(', ');
    elements.resumeSummary.textContent = names ? `Players: ${names}` : '';
  }
  if (!elements.resumeModal) return;
  elements.resumeModal.hidden = false;
  elements.resumeModal.classList.add('modal-active');
  activateFocusTrap(elements.resumeModal);
}

function hideResumeModal() {
  if (!elements.resumeModal) return;
  elements.resumeModal.classList.remove('modal-active');
  elements.resumeModal.hidden = true;
  deactivateFocusTrap(elements.resumeModal);
}

/* Apply a previously saved game to the live state and continue play. */
function applySavedGame(saved) {
  gameState = createInitialGameState(saved.players || []);
  gameState.difficulty = saved.difficulty || 'all';
  gameState.timerSeconds = saved.timerSeconds || 0;
  gameState.players.forEach((p, i) => {
    const sp = saved.players?.[i] || {};
    p.position = sp.position || 0;
    p.score = sp.score || 0;
    p.streak = sp.streak || 0;
    p.achievements = sp.achievements || [];
    p.hasStarted = p.position > 0;
    p.element = getPlayerToken(i);
  });
  gameState.currentPlayer = saved.currentPlayer ?? 0;

  // Restore the shuffled question pool (IDs only) to keep uniqueness.
  if (saved.questionPool?.length) {
    const byId = new Map(questions.map(q => [q.id, q]));
    gameState.questionPool = saved.questionPool.map(id => byId.get(id)).filter(Boolean);
  } else {
    initializeQuestionPool();
  }

  gameState.players.forEach((player, idx) => syncAvatarPicker(idx, player.avatar));
  updatePlayersUi();
  elements.rollDiceBtn.hidden = false;
  elements.restartBtn.hidden = false;   // A restored game is in progress.
  playMusic(elements.backgroundMusic);
  setRollButtonForCurrentPlayer();
  scheduleAiTurnIfNeeded();
}

function resumeSavedGame() {
  if (!pendingSavedGame) return;
  const saved = pendingSavedGame;
  pendingSavedGame = null;
  hideResumeModal();
  applySavedGame(saved);
}

function startNewFromResume() {
  pendingSavedGame = null;
  hideResumeModal();
  clearCurrentGame().catch(error => console.warn('Unable to clear current game', error));
  showSetupModal();
}

/* ============================================================================
   GAME HISTORY
   ============================================================================ */

/* Determine the winner of an archived game: whoever reached 100, else top score. */
function historyWinner(state) {
  const players = state.players || [];
  if (state.winner) return state.winner;
  const reached = players.find(p => (p.position || 0) >= 100);
  if (reached) return reached.name;
  const top = players.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  return top?.name || '—';
}

function formatHistoryDate(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

async function renderHistoryList() {
  const list = elements.historyList;
  if (!list) return;
  list.innerHTML = '<li class="history-empty">Loading…</li>';

  let games = [];
  try {
    games = await fetchGameHistory(20);
  } catch (error) {
    console.warn('Unable to load game history', error);
  }

  if (!games.length) {
    list.innerHTML = '<li class="history-empty">No finished games yet. Win a game to see it here!</li>';
    return;
  }

  list.innerHTML = games.map(entry => {
    const state = entry.state || {};
    const players = state.players || [];
    const winner = historyWinner(state);
    const scores = players.slice()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map(p => `${escapeHtml(p.name)}: ${p.score || 0}`)
      .join(' • ');
    return `
      <li class="history-row">
        <div class="history-main">
          <span class="history-winner">🏆 ${escapeHtml(winner)}</span>
          <span class="history-date">${escapeHtml(formatHistoryDate(entry.timestamp))}</span>
        </div>
        <div class="history-scores">${scores}</div>
      </li>
    `;
  }).join('');
}

function openHistoryModal() {
  if (!elements.historyModal) return;
  elements.historyModal.hidden = false;
  elements.historyModal.classList.add('modal-active');
  activateFocusTrap(elements.historyModal);
  renderHistoryList();
}

function hideHistoryModal() {
  if (!elements.historyModal) return;
  elements.historyModal.classList.remove('modal-active');
  elements.historyModal.hidden = true;
  deactivateFocusTrap(elements.historyModal);
}

/* ============================================================================
   EVENT LISTENERS & INITIALIZATION
   ============================================================================ */

document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
  cacheElements();
  setupAvatarSelection();
  // Initialize speech synthesis voices early so read-aloud works when requested
  speechManager.init();
  
  /* Initialize audio source paths (if using local files) */
  if (elements.backgroundMusic) {
    const backgroundSource = document.createElement('source');
    backgroundSource.src = `${AUDIO_PATH}/background-music.mp3`;
    backgroundSource.type = 'audio/mpeg';
    elements.backgroundMusic.appendChild(backgroundSource);
  }

  // Theme, audio, and carousel setup must be ready before the startup modal opens.
  initializeTheme();
  updateAudioButtons();
  initializeCarousel();
  showSetupModal();
  
  /* Load questions and then set up the session‑unique pool.
     After the pool is ready we also attempt to restore a previously saved game. */
  questionBankReady = loadQuestionsFromMarkdown()
    .then(() => {
      initializeQuestionPool();
      return loadCurrentGame();
    })
    .then(saved => {
      // A saved game in progress: ask the player whether to resume it rather
      // than silently restoring. Otherwise leave the setup modal open.
      if (saved && (saved.players || []).some(p => (p.position || 0) > 0)) {
        pendingSavedGame = saved;
        promptResume(saved);
      }
      // Roll dice button enabled after game start handled in startGame()
    })
    .catch(err => {
      console.warn('Failed to load game state', err);
      showSetupModal();
    });
  
  // Cache player elements for visual tokens
  gameState.players[0].element = elements.player1;
  gameState.players[1].element = elements.player2;
  
  // Event Listeners - Navigation
  // history.back() is a no-op when index.html is opened directly (no prior
  // entry), so hide the Back button unless there is somewhere to go back to.
  if (window.history.length <= 1) {
    elements.backBtn.hidden = true;
  } else {
    elements.backBtn.addEventListener('click', () => {
      window.history.back();
    });
  }
  
  elements.rulesBtn.addEventListener('click', showRulesModal);
  elements.historyBtn?.addEventListener('click', openHistoryModal);
  elements.historyCloseBtn?.addEventListener('click', hideHistoryModal);
  elements.historyModal?.querySelector('.modal-overlay')?.addEventListener('click', hideHistoryModal);
  elements.resumeContinueBtn?.addEventListener('click', resumeSavedGame);
  elements.resumeNewBtn?.addEventListener('click', startNewFromResume);
  elements.themeBtn.addEventListener('click', toggleTheme);
  elements.musicBtn.addEventListener('click', toggleMusic);
  elements.soundBtn.addEventListener('click', toggleSound);
  elements.readAloudBtn?.addEventListener('click', toggleReadAloud);
  
  // Initialize 3D Dice canvas
  init3DDice();

  // Event Listeners - Game Controls
  elements.rollDiceBtn.addEventListener('click', handleTurn);
  
  // Make 3D Dice container clickable to roll
  const diceContainer = document.getElementById('dice-canvas-container');
  if (diceContainer) {
    diceContainer.style.cursor = 'pointer';
    diceContainer.addEventListener('click', () => {
      if (!elements.rollDiceBtn.disabled && !elements.rollDiceBtn.hidden) {
        handleTurn();
      }
    });
  }
  elements.restartBtn.addEventListener('click', resetGame);
  
  // Event Listeners - Rules Carousel
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
  
  // Event Listeners - Game Setup
  elements.startGameBtn.addEventListener('click', (e) => { e.preventDefault(); startGame(); });
  elements.playerCountSelect.addEventListener('change', updatePlayerSetupVisibility);
  
  // Play again button
  elements.playAgainBtn.addEventListener('click', resetGame);

  // Register the service worker for offline support (http/https only).
  registerServiceWorker();

  // Show setup modal on start (unless user disabled it) – now handled by loadCurrentGame

}

/* Register the offline service worker when the environment supports it. */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(error => {
      console.warn('Service worker registration failed', error);
    });
  });
}


/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // While a question is active, Escape must be a no-op: hiding the modal
    // here would leave the turn unresolved (isQuestionActive stuck true, the
    // answer callback never fires) and let players skip questions. The modal
    // is only ever open during a question, so there is nothing else to close.
    if (gameState.isQuestionActive) {
      return;
    }
    // The history modal is purely informational, so Escape may close it.
    if (elements.historyModal?.classList.contains('modal-active')) {
      hideHistoryModal();
    }
  }
});
