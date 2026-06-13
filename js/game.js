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
const IMAGE_PATH = "assets/images";
const AUDIO_PATH = "assets/audio";
const QUESTION_SOURCE_PATH = "questions.md";

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

/* Questions array - will be populated dynamically from questions.md */
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
 * Parses questions.md at runtime to build the question bank
 */

/**
 * Parse the questions.md file and extract questions with answers
 * Categorizes them by difficulty based on section headings
 */
async function loadQuestionsFromMarkdown() {
  try {
    const response = await fetch(QUESTION_SOURCE_PATH);
    if (!response.ok) {
      console.warn('Could not load questions.md, using fallback questions');
      loadFallbackQuestions();
      return;
    }

    const markdown = await response.text();
    const parsedQuestions = parseQuestionsMarkdown(markdown);
    
    if (parsedQuestions.length === 0) {
      console.warn('No questions parsed from questions.md, using fallback questions');
      loadFallbackQuestions();
      return;
    }

    questions = parsedQuestions;
    console.log(`Loaded ${questions.length} questions from questions.md`);
    categorizeQuestionsByDifficulty();
  } catch (error) {
    console.warn('Error loading questions.md:', error);
    loadFallbackQuestions();
  }
}

/**
 * Parse markdown text to extract questions and answers
 * Recognizes both True/False and Q&A format questions
 * @param {string} markdown - The markdown content from questions.md
 * @returns {Array} Array of question objects with {question, answer, type, section, difficulty}
 */
function parseQuestionsMarkdown(markdown) {
  const parsedQuestions = [];
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let currentSection = 'Introduction';
  let currentDifficulty = 'easy';
  let i = 0;

  while (i < lines.length) {
    const line = normalizeMarkdownLine(lines[i]);
    const heading = getSectionHeading(line);

    if (heading) {
      currentSection = heading;
      currentDifficulty = inferDifficultyFromSection(currentSection, parsedQuestions.length);
      i++;
      continue;
    }

    const bulletQuestion = parseBulletQuestion(line, lines, i, currentSection, currentDifficulty, parsedQuestions.length);
    if (bulletQuestion) {
      parsedQuestions.push(bulletQuestion.question);
      i = bulletQuestion.nextIndex;
      continue;
    }

    const blockQuestion = parseQuestionBlock(lines, i, currentSection, currentDifficulty, parsedQuestions.length);
    if (blockQuestion) {
      parsedQuestions.push(blockQuestion.question);
      i = blockQuestion.nextIndex;
      continue;
    }

    const inlineQuestions = parseInlineQuestionPairs(line, currentSection, currentDifficulty, parsedQuestions.length);
    if (inlineQuestions.length > 0) {
      parsedQuestions.push(...inlineQuestions);
      i++;
      continue;
    }

    i++;
  }

  applyOrderBasedDifficulty(parsedQuestions);
  return parsedQuestions;
}

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
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getSectionHeading(line) {
  if (!line) return null;

  const hashHeading = line.match(/^#{1,6}\s+(.+)$/);
  if (hashHeading) {
    return cleanMarkdownText(hashHeading[1]);
  }

  const boldHeading = line.match(/^\*\*([^*]+)\*\*$/);
  if (!boldHeading) return null;

  const heading = cleanMarkdownText(boldHeading[1]);
  if (/^(answer|correct answer|explanation|question\s*\d*|questions?\s*\d*|q\d+\.|\d+\\?[.)]\s*)/i.test(heading)) {
    return null;
  }
  if (heading.length > 95 || heading.endsWith('?') || /^true or false:/i.test(heading)) {
    return null;
  }

  return heading;
}

function inferDifficultyFromSection(section, questionCount) {
  const sectionText = section.toLowerCase();

  if (/basic|understanding|questions?\s*1\s*[-–]\s*50/.test(sectionText)) {
    return 'easy';
  }
  if (/intermediate|questions?\s*51\s*[-–]\s*100|period poverty|wash/.test(sectionText)) {
    return 'medium';
  }
  if (/advanced|family|specialist|evidence|management|secondary|chronic|neuromodulation|mcq|sba|questions?\s*10\d|questions?\s*15\d|questions?\s*20\d|questions?\s*25\d/.test(sectionText)) {
    return 'hard';
  }

  if (questionCount < 120) return 'easy';
  if (questionCount < 260) return 'medium';
  return 'hard';
}

function parseBulletQuestion(line, allLines, lineIndex, section, difficulty, questionIndex) {
  const questionMatch = line.match(/^[-*]\s+\*\*(.+?)\*\*\s*$/);
  if (!questionMatch || /^answer:/i.test(questionMatch[1])) return null;

  const answerInfo = findAnswerAfterLine(allLines, lineIndex + 1);
  if (!answerInfo) return null;

  return {
    question: buildQuestionRecord(questionMatch[1], answerInfo.answer, {
      section,
      difficulty,
      sourceLine: lineIndex + 1,
      order: questionIndex + 1,
    }),
    nextIndex: answerInfo.nextIndex,
  };
}

function parseQuestionBlock(allLines, lineIndex, section, difficulty, questionIndex) {
  const currentLine = normalizeMarkdownLine(allLines[lineIndex]);
  const questionNumberMatch = currentLine.match(/^\*\*Question\s+(\d+)\*\*\s*$/i);
  const namedQuestionMatch = currentLine.match(/^\*\*Question:\*\*\s*(.+)$/i);
  const shortQuestionMatch = currentLine.match(/^\*\*Q(\d+)\.\*\*\s*(.+)$/i);
  const numberedBoldMatch = currentLine.match(/^\*\*(\d+)\\?[.)]\s*(.+?)\*\*\s*$/);
  if (!questionNumberMatch && !namedQuestionMatch && !shortQuestionMatch && !numberedBoldMatch) return null;

  const inlineQuestionText = namedQuestionMatch?.[1] || shortQuestionMatch?.[2] || numberedBoldMatch?.[2] || '';
  const questionLines = inlineQuestionText ? [inlineQuestionText] : [];
  let cursor = lineIndex + 1;

  while (cursor < allLines.length) {
    const line = normalizeMarkdownLine(allLines[cursor]);
    if (!line) {
      cursor++;
      continue;
    }
    if (isAnswerLine(line)) break;
    if (isQuestionStart(line) || getSectionHeading(line)) return null;
    questionLines.push(line);
    cursor++;
  }

  const answerInfo = findAnswerAfterLine(allLines, cursor);
  if (!answerInfo || questionLines.length === 0) return null;

  return {
    question: buildQuestionRecord(questionLines.join(' '), answerInfo.answer, {
      section,
      difficulty,
      sourceLine: lineIndex + 1,
      order: questionIndex + 1,
      questionNumber: Number(questionNumberMatch?.[1] || shortQuestionMatch?.[1] || numberedBoldMatch?.[1]) || null,
    }),
    nextIndex: answerInfo.nextIndex,
  };
}

function parseInlineQuestionPairs(line, section, difficulty, questionIndex) {
  const inlinePattern = /(?:^|\s)(?:\d+[.)]\s*)?\*\*(.+?)\*\*\s*(?:\*\*Answer:\*\*|Answer:)\s*([^*]+?)(?=\s+\d+[.)]\s*\*\*|$)/gi;
  const parsed = [];
  let match;

  while ((match = inlinePattern.exec(line)) !== null) {
    parsed.push(buildQuestionRecord(match[1], match[2], {
      section,
      difficulty,
      sourceLine: null,
      order: questionIndex + parsed.length + 1,
    }));
  }

  return parsed;
}

function findAnswerAfterLine(allLines, startIndex) {
  for (let cursor = startIndex; cursor < allLines.length; cursor++) {
    const line = normalizeMarkdownLine(allLines[cursor]);
    if (!line) continue;
    if (isQuestionStart(line) || getSectionHeading(line)) return null;
    if (!isAnswerLine(line)) continue;

    const answer = extractAnswer(line, allLines, cursor);
    if (!answer.value) return null;
    return {
      answer: answer.value,
      nextIndex: answer.nextIndex,
    };
  }

  return null;
}

function extractAnswer(answerLine, allLines, lineIndex) {
  let answer = answerLine
    .replace(/^\*\*(Correct\s+Answer|Answer):\*\*:?\s*/i, '')
    .replace(/^\*\*(Correct\s+Answer|Answer):?\*\*\s*/i, '')
    .replace(/^(Correct\s+Answer|Answer):\s*/i, '')
    .trim();

  let cursor = lineIndex + 1;

  while (!answer && cursor < allLines.length) {
    const line = normalizeMarkdownLine(allLines[cursor]);
    if (!line) {
      cursor++;
      continue;
    }
    if (isQuestionStart(line) || isExplanationLine(line) || getSectionHeading(line)) break;
    answer = line;
    cursor++;
    break;
  }

  while (cursor < allLines.length) {
    const line = normalizeMarkdownLine(allLines[cursor]);
    if (!line) {
      cursor++;
      continue;
    }
    if (isQuestionStart(line) || isAnswerLine(line) || isExplanationLine(line) || getSectionHeading(line)) break;
    answer = `${answer} ${line}`;
    cursor++;
  }

  return {
    value: cleanMarkdownText(answer),
    nextIndex: cursor,
  };
}

function isQuestionStart(line) {
  return /^[-*]\s+\*\*.+\*\*/.test(line) ||
    /^\*\*Question\s+\d+\*\*/i.test(line) ||
    /^\*\*Question:\*\*/i.test(line) ||
    /^\*\*Q\d+\.\*\*/i.test(line) ||
    /^\*\*\d+\\?[.)]\s+.+\*\*/.test(line);
}

function isAnswerLine(line) {
  return /^\*\*(Correct\s+Answer|Answer):?\*\*/i.test(line) ||
    /^(Correct\s+Answer|Answer):/i.test(line);
}

function isExplanationLine(line) {
  return /^\*\*Explanation:?\*\*/i.test(line) || /^Explanation:?/i.test(line);
}

function buildQuestionRecord(questionText, answerText, metadata) {
  const cleanedQuestion = cleanMarkdownText(questionText).replace(/^Question:\s*/i, '');
  const cleanedAnswer = cleanMarkdownText(answerText);
  const normalizedAnswer = cleanedAnswer.toLowerCase();
  const isTrueFalse = /^true\b/i.test(cleanedQuestion) || /^(true|false)\b/i.test(normalizedAnswer);

  return {
    id: `q-${metadata.order}`,
    question: cleanedQuestion,
    answer: isTrueFalse ? normalizedAnswer.startsWith('true') : cleanedAnswer,
    answerText: cleanedAnswer,
    type: isTrueFalse ? 'true-false' : 'qa',
    section: metadata.section,
    difficulty: metadata.difficulty,
    sourceLine: metadata.sourceLine,
    questionNumber: metadata.questionNumber || null,
  };
}

function applyOrderBasedDifficulty(parsedQuestions) {
  const total = parsedQuestions.length;
  if (total === 0) return;

  parsedQuestions.forEach((question, index) => {
    if (question.difficulty) return;

    const progress = index / total;
    if (progress < 0.34) {
      question.difficulty = 'easy';
    } else if (progress < 0.67) {
      question.difficulty = 'medium';
    } else {
      question.difficulty = 'hard';
    }
  });
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
    { question: "True or False: Menstruation is a sign of good health in women.", answer: true, type: 'true-false', difficulty: 'easy' },
    { question: "What is the average length of a menstrual cycle?", answer: "28 days (though it can range from 21 to 35 days)", type: 'qa', difficulty: 'easy' },
    { question: "True or False: A menstrual cycle of 28 days is standard for all women.", answer: false, type: 'true-false', difficulty: 'easy' },
    { question: "What is ovulation, and when does it occur in a menstrual cycle?", answer: "Ovulation is the release of an egg from the ovary, usually around the 14th day of a 28-day cycle", type: 'qa', difficulty: 'easy' },
    { question: "True or False: Using unclean cloths during menstruation can lead to infections.", answer: true, type: 'true-false', difficulty: 'medium' },
    { question: "What are the most common menstrual hygiene products?", answer: "Sanitary pads, tampons, menstrual cups, and reusable cloth pads", type: 'qa', difficulty: 'medium' },
    { question: "True or False: Leaving a tampon in for too long can increase the risk of toxic shock syndrome (TSS).", answer: true, type: 'true-false', difficulty: 'medium' },
    { question: "What is endometriosis, and how can it impact menstruation?", answer: "Endometriosis is tissue similar to uterine lining growing outside the uterus, leading to painful periods and heavy bleeding", type: 'qa', difficulty: 'hard' },
    { question: "True or False: PCOS can lead to menstrual irregularities and infertility.", answer: true, type: 'true-false', difficulty: 'hard' },
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

function createInitialGameState(playerNames = ["Player 1", "Player 2"]) {
  const defaultAvatars = ["assets/images/player11.png", "assets/images/player22.png"];

  return {
    currentPlayer: 0,
    players: [
      { name: playerNames[0], position: 0, element: null, avatar: defaultAvatars[0], hasStarted: false, score: 0, achievements: [], isAI: false },
      { name: playerNames[1], position: 0, element: null, avatar: defaultAvatars[1], hasStarted: false, score: 0, achievements: [], isAI: false },
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
    diceCube: document.getElementById('dice-cube'),
    diceValueDisplay: document.getElementById('dice-value-display'),
    currentPlayerName: document.getElementById('current-player-name'),
    player1NameDisplay: document.getElementById('player1-name-display'),
    player2NameDisplay: document.getElementById('player2-name-display'),
    player1CardAvatar: document.getElementById('player1-card-avatar'),
    player2CardAvatar: document.getElementById('player2-card-avatar'),

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
      player1AvatarSelection: document.getElementById('player1-avatar-selection'),
      player2AvatarSelection: document.getElementById('player2-avatar-selection'),
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
  syncAvatarPicker(0, getSelectedAvatar(elements.player1AvatarSelection, "assets/images/player11.png"));
  syncAvatarPicker(1, getSelectedAvatar(elements.player2AvatarSelection, "assets/images/player22.png"));
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
  if (player.element) player.element.src = avatar;

  const cardAvatar = playerIndex === 0 ? elements.player1CardAvatar : elements.player2CardAvatar;
  if (cardAvatar) cardAvatar.src = avatar;
}

function syncAvatarPicker(playerIndex, avatar) {
  const container = playerIndex === 0 ? elements.player1AvatarSelection : elements.player2AvatarSelection;
  const tokenElement = playerIndex === 0 ? elements.player1 : elements.player2;
  const cardElement = playerIndex === 0 ? elements.player1CardAvatar : elements.player2CardAvatar;
  setSelectedAvatar(container, avatar, tokenElement, cardElement);
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function persistCurrentGame(state) {
  if (!window.indexedDB) {
    localStorage.setItem('menstrualGame_current', JSON.stringify(state));
    return;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  // Remove old current record
  const curIdx = store.index('current');
  const curCursor = await curIdx.openCursor(IDBKeyRange.only(true));
  if (curCursor) curCursor.delete();
  await store.put({ timestamp: Date.now(), isCurrent: true, state });
  await tx.complete;
}

async function loadCurrentGame() {
  if (!window.indexedDB) {
    const raw = localStorage.getItem('menstrualGame_current');
    return raw ? JSON.parse(raw) : null;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const idx = tx.objectStore(STORE_NAME).index('current');
  const cursor = await idx.openCursor(IDBKeyRange.only(true));
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
  // Delete any existing current record (if still present)
  const curIdx = store.index('current');
  const curCursor = await curIdx.openCursor(IDBKeyRange.only(true));
  if (curCursor) curCursor.delete();
  await store.put({ timestamp: Date.now(), isCurrent: false, state });
  await tx.complete;
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
  const idx = tx.objectStore(STORE_NAME).index('byDate');
  const result = [];
  let cursor = await idx.openCursor(null, 'prev'); // newest first
  while (cursor && result.length < limit) {
    if (!cursor.value.isCurrent) {
      result.push(cursor.value);
    }
    cursor = await cursor.continue();
  }
  return result;
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

function setDiceFace(face) {
  if (!elements.diceCube) return;

  elements.diceCube.classList.remove(
    'dice-face-1',
    'dice-face-2',
    'dice-face-3',
    'dice-face-4',
    'dice-face-5',
    'dice-face-6'
  );
  elements.diceCube.classList.add(`dice-face-${face}`);
  elements.diceCube.setAttribute('aria-label', `Dice showing ${face}`);
  elements.diceValueDisplay.textContent = face;
}

function setDiceRolling(isRolling) {
  elements.diceCube?.classList.toggle('is-rolling', isRolling);
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
  /* Show player setup as well so name inputs are always reachable */
  elements.playerSetup.hidden = false;
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
  elements.winnerAvatar.src = playerElement?.src || "";
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
  if (player.element) {
    player.element.style.left = `${coordinates.x}%`;
    player.element.style.bottom = `${coordinates.y}%`;
  }
}

async function rollDice(options = {}) {
  return new Promise((resolve) => {
    playSound(elements.diceSound);
    setDiceRolling(true);
    let rolls = 0;
    let randomFace = 1;

    const rollInterval = setInterval(() => {
      randomFace = Math.floor(Math.random() * 6) + 1;
      setDiceFace(randomFace);
      rolls += 1;

      if (rolls >= DICE_ROLL_FRAMES) {
        clearInterval(rollInterval);
        if (options.preferredFace && Math.random() < options.preferredFaceChance) {
          randomFace = options.preferredFace;
          setDiceFace(randomFace);
        }
        setDiceRolling(false);
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

// ---------------------------------------------------------------------------
// QUESTION HANDLING – session‑unique question pool
// ---------------------------------------------------------------------------

// Initialize a shuffled pool of questions for the current game session.
function initializeQuestionPool() {
  // Use only true/false (auto‑gradable) questions for gameplay.
  const pool = questions.filter(q => q.type === 'true-false');
  // Shuffle using Fisher‑Yates.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  gameState.questionPool = pool; // array of question objects
  gameState.usedQuestions = [];
}

// Retrieve the next question from the session pool, rebuilding if exhausted.
function getNextQuestion() {
  if (!gameState.questionPool || gameState.questionPool.length === 0) {
    // Pool exhausted – rebuild while avoiding immediate repeats.
    const recent = gameState.usedQuestions.slice(-5); // keep last 5 used
    const all = questions.filter(q => q.type === 'true-false');
    const newPool = all.filter(q => !recent.includes(q));
    // Shuffle new pool
    for (let i = newPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPool[i], newPool[j]] = [newPool[j], newPool[i]];
    }
    gameState.questionPool = newPool;
    gameState.usedQuestions = [];
  }
  const next = gameState.questionPool.shift();
  gameState.usedQuestions.push(next);
  return next;
}

function showQuestion(callback) {
  // If the current player is AI, answer automatically without UI
  const currentPlayer = gameState.players[gameState.currentPlayer];
  if (currentPlayer.isAI) {
    const autoAnswer = Math.random() < 0.5;
    setTimeout(() => callback(autoAnswer), 300);
    return;
  }

  // Ensure the question bank is ready.
  if (questions.length === 0) {
    loadFallbackQuestions();
  }

  // Get a unique question for this turn.
  const nextQuestion = getNextQuestion();

  showQuestionModal(nextQuestion.question);
  gameState.isQuestionActive = true;

  function handleAnswer(answer) {
    hideQuestionModal();
    gameState.isQuestionActive = false;
    elements.trueBtn.removeEventListener('click', onTrue);
    elements.falseBtn.removeEventListener('click', onFalse);
    callback(answer === nextQuestion.answer);
  }

  function onTrue() { handleAnswer(true); }
  function onFalse() { handleAnswer(false); }

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

  await questionBankReady;
  if (questions.length === 0) {
    loadFallbackQuestions();
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
    // Archive completed game and clear current save
    archiveFinishedGame({
      players: gameState.players.map(p => ({
        name: p.name,
        position: p.position,
        avatar: p.avatar,
        score: p.score,
        achievements: p.achievements,
      })),
      currentPlayer: gameState.currentPlayer,
      timestamp: Date.now(),
    });
    // Remove current session data
    if (window.indexedDB) {
      openDB().then(db => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const idx = tx.objectStore(STORE_NAME).index('current');
        idx.openCursor(IDBKeyRange.only(true)).then(cursor => {
          if (cursor) cursor.delete();
        });
      });
    } else {
      localStorage.removeItem('menstrualGame_current');
    }
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
      achievements: p.achievements,
    })),
    currentPlayer: gameState.currentPlayer,
    questionPool: gameState.questionPool?.map(q => q.id) || [],
  });
}

function advanceTurn() {
  gameState.currentPlayer = 1 - gameState.currentPlayer;
  elements.currentPlayerName.textContent = gameState.players[gameState.currentPlayer].name;
}

/* ============================================================================
   GAME SETUP & INITIALIZATION
   ============================================================================ */

function startGame() {
  const playerNames = [
    elements.player1NameInput?.value.trim() || "Player 1",
    elements.player2NameInput?.value.trim() || "Player 2",
  ];

  /* Check if user wants to hide rules on future starts */
  if (elements.dontShowAgain.checked) {
    localStorage.setItem('showRulesOnStart', 'false');
  }

  gameState = createInitialGameState(playerNames);
  gameState.players[0].element = elements.player1;
  gameState.players[1].element = elements.player2;

  gameState.players[0].name = playerNames[0];
  gameState.players[1].name = playerNames[1];
  applyPlayerAvatar(0, getSelectedAvatar(elements.player1AvatarSelection, "assets/images/player11.png"));
  applyPlayerAvatar(1, getSelectedAvatar(elements.player2AvatarSelection, "assets/images/player22.png"));

  // Update UI displays for the two visible players
  elements.currentPlayerName.textContent = gameState.players[0].name;
  elements.player1NameDisplay.textContent = gameState.players[0].name;
  elements.player2NameDisplay.textContent = gameState.players[1].name;

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
  const playerAvatars = gameState.players.map(p => p.avatar);
  gameState = createInitialGameState(playerNames);
  gameState.players[0].element = elements.player1;
  gameState.players[1].element = elements.player2;
  applyPlayerAvatar(0, playerAvatars[0] || "assets/images/player11.png");
  applyPlayerAvatar(1, playerAvatars[1] || "assets/images/player22.png");
  syncAvatarPicker(0, gameState.players[0].avatar);
  syncAvatarPicker(1, gameState.players[1].avatar);

  setDiceRolling(false);
  setDiceFace(1);
  elements.currentPlayerName.textContent = gameState.players[0].name;
  elements.player1NameDisplay.textContent = gameState.players[0].name;
  elements.player2NameDisplay.textContent = gameState.players[1].name;
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
  
  /* Load questions and then set up the session‑unique pool.
     After the pool is ready we also attempt to restore a previously saved game. */
  questionBankReady = loadQuestionsFromMarkdown()
    .then(() => {
      initializeQuestionPool();
      return loadCurrentGame();
    })
    .then(saved => {
      if (saved) {
        // --- Restore players ---
        gameState.players.forEach((p, i) => {
          const sp = saved.players?.[i];
          if (sp) {
            p.name = sp.name;
            p.position = sp.position;
            p.avatar = sp.avatar || p.avatar;
            p.score = sp.score;
            p.achievements = sp.achievements || [];
            // visual element for the first two players
            if (i === 0) p.element = elements.player1;
            if (i === 1) p.element = elements.player2;
          }
        });
        gameState.currentPlayer = saved.currentPlayer ?? 0;
        // Restore the shuffled question pool (IDs only) to keep uniqueness
        if (saved.questionPool?.length) {
          const allTrue = questions.filter(q => q.type === 'true-false');
          gameState.questionPool = saved.questionPool
            .map(id => allTrue.find(q => q.id === id))
            .filter(Boolean);
        }
        // Update UI to reflect restored state
        elements.currentPlayerName.textContent = gameState.players[gameState.currentPlayer].name;
        elements.player1NameDisplay.textContent = gameState.players[0].name;
        elements.player2NameDisplay.textContent = gameState.players[1].name;
        applyPlayerAvatar(0, gameState.players[0].avatar);
        applyPlayerAvatar(1, gameState.players[1].avatar);
        syncAvatarPicker(0, gameState.players[0].avatar);
        syncAvatarPicker(1, gameState.players[1].avatar);
        gameState.players.forEach((player, idx) => updatePlayerPosition(idx, player.position));
        elements.rollDiceBtn.disabled = false;
      } else {
        // No saved game – start fresh
        showSetupModal();
        if (!appState.showRulesOnStart) {
          moveToCarouselEnd();
        }
    // Roll dice button enabled after game start handled in startGame()
}

    })
    .catch(err => {
      console.warn('Failed to load game state', err);
    });
  
  // Cache player elements for visual tokens
  gameState.players[0].element = elements.player1;
  gameState.players[1].element = elements.player2;
  
  // Theme & Audio initialization
  initializeTheme();
  updateAudioButtons();
  
  // Carousel setup
  initializeCarousel();
  
  // Event Listeners - Navigation
  elements.backBtn.addEventListener('click', () => {
    window.history.back();
  });
  
  elements.rulesBtn.addEventListener('click', showRulesModal);
  elements.themeBtn.addEventListener('click', toggleTheme);
  elements.musicBtn.addEventListener('click', toggleMusic);
  elements.soundBtn.addEventListener('click', toggleSound);
  elements.readAloudBtn?.addEventListener('click', toggleReadAloud);
  
  // Event Listeners - Game Controls
  elements.rollDiceBtn.addEventListener('click', handleTurn);
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
  
  // Event Listeners - Dice buttons (placeholders)
  elements.trueBtn.addEventListener('click', () => {});
  elements.falseBtn.addEventListener('click', () => {});
  
  // Play again button
  elements.playAgainBtn.addEventListener('click', resetGame);
  
  // Show setup modal on start (unless user disabled it) – now handled by loadCurrentGame

  
  elements.rollDiceBtn.disabled = true;
}


/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideQuestionModal();
  }
});
