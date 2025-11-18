let WORDS = [];
let currentWordSet = "easy";
let adminMode = false;

const startMenu = document.getElementById("start-menu");
const gameContainer = document.getElementById("game-container");
const easyBtn = document.getElementById("easy-btn");
const hardBtn = document.getElementById("hard-btn");
const homeBtn = document.getElementById("home-btn");

const wordsEl = document.getElementById("words");
const input = document.getElementById("input");
const restartBtn = document.getElementById("restart");
const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const correctEl = document.getElementById("correct");
const wrongEl = document.getElementById("wrong");
const accEl = document.getElementById("acc");

const dropdown = document.getElementById("customDropdown");
const selected = dropdown.querySelector(".dropdown-selected");
const options = dropdown.querySelectorAll(".dropdown-option");

const summaryCard = document.getElementById("summary-card");
const closeSummaryBtn = document.getElementById("close-summary");
const wrongWordsList = document.getElementById("wrong-words-list");

let selectedDuration = parseInt(selected.textContent);
let wordList = [];
let currentIndex = 0;
let started = false;
let timeLeft = selectedDuration;
let timerId = null;
let correctCount = 0;
let wrongCount = 0;
let charsTyped = 0;
let wrongWordsTracker = [];

function loadWords(difficulty) {
  const fileName = difficulty === "easy" ? "easy.json" : "hard.json";
  fetch(fileName)
    .then(response => response.json())
    .then(data => {
      WORDS = data.words;
      reset();
    })
    .catch(err => console.error(`Failed to load ${fileName}:`, err));
}

easyBtn.addEventListener("click", () => {
  currentWordSet = "easy";
  loadWords("easy");
  startMenu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  input.focus();
});

hardBtn.addEventListener("click", () => {
  currentWordSet = "hard";
  loadWords("hard");
  startMenu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  input.focus();
});

homeBtn.addEventListener("click", () => {
  clearInterval(timerId);
  gameContainer.classList.add("hidden");
  startMenu.classList.remove("hidden");
  adminMode = false;
  reset();
});

function generateWordList(count = 70) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    list.push(w);
  }
  return list;
}

dropdown.addEventListener("click", () => {
  dropdown.classList.toggle("open");
});

options.forEach(option => {
  option.addEventListener("click", (e) => {
    const value = parseInt(e.target.dataset.value);
    selected.textContent = e.target.textContent;
    selectedDuration = value;
    timeLeft = value;
    timeEl.textContent = timeLeft;
    dropdown.classList.remove("open");
    reset();
  });
});

function renderWords() {
  wordsEl.innerHTML = "";
  wordList.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "word" + (i === currentIndex ? " current" : "");
    span.textContent = w;
    wordsEl.appendChild(span);
  });
}

function startTimer() {
  if (started) return;
  started = true;
  timerId = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    updateStats();
    if (timeLeft <= 0) finish();
  }, 1000);
}

function finish() {
  clearInterval(timerId);
  input.disabled = true;
  const elapsed = (selectedDuration - timeLeft) / 60 || 1 / 60;
  const finalWPM = Math.round(correctCount / elapsed);

  wpmEl.textContent = finalWPM;

  showSummary({
    time: selectedDuration,
    wpm: finalWPM,
    correct: correctCount,
    wrong: wrongCount,
    acc: accEl.textContent
  });
}

function reset() {
  if (WORDS.length === 0) return;
  clearInterval(timerId);
  wordList = generateWordList();
  currentIndex = 0;
  started = false;
  timeLeft = selectedDuration;
  correctCount = 0;
  wrongCount = 0;
  charsTyped = 0;
  wrongWordsTracker = [];
  input.value = "";
  input.disabled = false;
  timeEl.textContent = timeLeft;
  wpmEl.textContent = "0";
  correctEl.textContent = "0";
  wrongEl.textContent = "0";
  accEl.textContent = "100%";
  renderWords();
  input.focus();

  summaryCard.classList.remove("show");
  summaryCard.classList.add("hidden");
  document.body.classList.remove("blur-bg");
}

function updateStats() {
  const elapsed = (selectedDuration - timeLeft) / 60 || 1 / 60;
  wpmEl.textContent = Math.round(correctCount / elapsed) || 0;
  correctEl.textContent = correctCount;
  wrongEl.textContent = wrongCount;
  const acc = charsTyped === 0
    ? 100
    : Math.max(0, Math.round(((charsTyped - wrongCount) / charsTyped) * 100));
  accEl.textContent = acc + "%";
}

input.addEventListener("input", () => {
  const before = input.value;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const lower = before.toLowerCase();
  if (before !== lower) {
    input.value = lower;
    try { input.setSelectionRange(start, end); } catch (e) { /* ignore */ }
  }

  if (typeof ADMIN_CONFIG !== "undefined" && ADMIN_CONFIG && ADMIN_CONFIG.enabled) {
    try {
      const pwd = decryptAdminPassword();
      if (pwd && input.value.includes(pwd)) {
        input.value = "";
        if (typeof activateAdminMode === "function") activateAdminMode();
        return;
      }
    } catch (e) {
    }
  }

  if (!started) startTimer();

  const val = input.value;
  const target = wordList[currentIndex] || "";
  const span = wordsEl.children[currentIndex];

  if (val.endsWith(" ")) {
    const typed = val.trim();
    charsTyped += typed.length;

    if (typed === target) {
      span.classList.remove("current");
      span.classList.add("correct");
      correctCount++;
    } else {
      span.classList.remove("current");
      span.classList.add("wrong");
      wrongCount++;
      wrongWordsTracker.push({
        correct: target,
        typed: typed
      });
    }

    currentIndex++;
    input.value = "";
    updateStats();

    if (currentIndex >= wordList.length) {
      finish();
      return;
    }

    if (wordsEl.children[currentIndex]) {
      wordsEl.children[currentIndex].classList.add("current");
    }

    return;
  }

  if (!target.startsWith(val) && val !== "") span.classList.add("wrong");
  else span.classList.remove("wrong");
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    input.value += " ";
    input.dispatchEvent(new Event("input"));
  }
});

restartBtn.addEventListener("click", reset);

function showSummary(stats) {
  document.getElementById("sum-time").textContent = stats.time;
  document.getElementById("sum-wpm").textContent = stats.wpm;
  document.getElementById("sum-correct").textContent = stats.correct;
  document.getElementById("sum-wrong").textContent = stats.wrong;
  document.getElementById("sum-acc").textContent = stats.acc;

  wrongWordsList.innerHTML = "";
  if (wrongWordsTracker.length === 0) {
    wrongWordsList.innerHTML = '<div class="no-wrong-words">Perfect! No wrong words!</div>';
  } else {
    wrongWordsTracker.forEach(item => {
      const div = document.createElement("div");
      div.className = "wrong-word-item";
      div.innerHTML = `
        <span class="wrong-word-typed">${item.typed}</span>
        <span>→</span>
        <span class="wrong-word-correct">${item.correct}</span>
      `;
      wrongWordsList.appendChild(div);
    });
  }

  summaryCard.classList.remove("hidden");
  document.body.classList.add("blur-bg");
  setTimeout(() => summaryCard.classList.add("show"), 50);
}

closeSummaryBtn.addEventListener("click", () => {
  summaryCard.classList.remove("show");
  document.body.classList.remove("blur-bg");
  setTimeout(() => summaryCard.classList.add("hidden"), 400);
  reset();
});