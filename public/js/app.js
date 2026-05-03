let gameSeq = [];
let userSeq = [];
let started = false;
let level = 0;
let mode = "solo";
let currentPlayer = 1;
let playerScores = { 1: 0, 2: 0 };
let highScore = 0; // NEW: track highest score
let btns = ["red", "yellow", "green", "purple"];
let h2 = document.querySelector("h2");
let modeBtn = document.querySelector("#mode-btn");
let difficultyBtn = document.querySelector("#difficulty-btn");
let timerBtn = document.querySelector("#timer-btn");
let soundBtn = document.querySelector("#sound-btn");
let pauseBtn = document.querySelector("#pause-btn");
let startBtn = document.querySelector("#start-btn");
let playerScoreDisplay = document.querySelector("#player-score");
let timerDisplay = document.querySelector("#timer-display");
let highScoreDisplay = document.querySelector("#high-score"); // NEW: high score element
let currentDifficulty = "normal";
let timerModeEnabled = false;
let soundEnabled = true;
let paused = false;
let awaitingInput = false;
let roundTimerId = null;
let roundTimerDeadline = 0;
let roundTimerRemainingMs = 0;
let nextRoundTimeoutId = null;
let nextRoundDeadline = 0;
let nextRoundRemainingMs = 0;
let backgroundMusicId = null;
let audioContext = null;

const difficultyLevels = {
    easy: { label: "Easy", flashMs: 460, inputMs: 5000, nextDelayMs: 1400, musicTempoMs: 1200 },
    normal: { label: "Normal", flashMs: 320, inputMs: 3500, nextDelayMs: 1000, musicTempoMs: 900 },
    hard: { label: "Hard", flashMs: 220, inputMs: 2200, nextDelayMs: 750, musicTempoMs: 700 },
};

const difficultyOrder = ["easy", "normal", "hard"];
const musicNotes = [261.63, 329.63, 392, 523.25];
const buttonFrequencies = {
    red: 220,
    yellow: 277.18,
    green: 329.63,
    purple: 392,
};

function currentDifficultySettings() {
    return difficultyLevels[currentDifficulty];
}

function setPrompt(text) {
    if (h2) {
        h2.textContent = text;
    }
}

function updateModeButton() {
    if (modeBtn) {
        modeBtn.textContent = mode === "solo" ? "Mode: Solo" : "Mode: 2 Player";
    }
}

function updateDifficultyButton() {
    if (difficultyBtn) {
        difficultyBtn.textContent = "Difficulty: " + currentDifficultySettings().label;
    }
}

function updateTimerButton() {
    if (timerBtn) {
        timerBtn.textContent = timerModeEnabled ? "Timer: On" : "Timer: Off";
    }
    if (timerDisplay) {
        timerDisplay.classList.toggle("hidden", !timerModeEnabled);
    }
}

function updateSoundButton() {
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
    }
}

function updatePauseButton() {
    if (pauseBtn) {
        pauseBtn.textContent = paused ? "Resume" : "Pause";
        pauseBtn.disabled = !started || (!awaitingInput && !paused);
    }
}

function updatePlayerScoreDisplay() {
    if (!playerScoreDisplay) {
        return;
    }

    if (mode === "two-player") {
        playerScoreDisplay.textContent = `P1: ${playerScores[1]} | P2: ${playerScores[2]}`;
        playerScoreDisplay.classList.remove("hidden");
    } else {
        playerScoreDisplay.classList.add("hidden");
    }
}

function updateTimerDisplay(ms) {
    if (!timerDisplay) {
        return;
    }

    if (!timerModeEnabled) {
        timerDisplay.textContent = "Time: --";
        return;
    }

    const safeMs = Math.max(0, Math.ceil(ms || 0));
    timerDisplay.textContent = `Time: ${(safeMs / 1000).toFixed(1)}s`;
}

function syncControlState() {
    updateModeButton();
    updateDifficultyButton();
    updateTimerButton();
    updateSoundButton();
    updatePauseButton();
    updatePlayerScoreDisplay();
}

function initializeDefaultControlState() {
    mode = "solo";
    currentDifficulty = "normal";
    timerModeEnabled = false;
    soundEnabled = true;
    paused = false;
    started = false;
    awaitingInput = false;
    clearRoundTimer(false);
    clearNextRoundTimer();
}

function ensureAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return null;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

function playTone(frequency, duration, type, gainValue) {
    if (!soundEnabled) {
        return;
    }

    const context = ensureAudioContext();
    if (!context) {
        return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.0001;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    const now = context.currentTime;
    const peak = gainValue || 0.05;

    gainNode.gain.exponentialRampToValueAtTime(peak, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

    oscillator.start(now);
    oscillator.stop(now + duration / 1000 + 0.05);
}

function playButtonSound(color) {
    playTone(buttonFrequencies[color] || 261.63, 110, "square", 0.045);
}

function playSuccessSound() {
    playTone(523.25, 90, "triangle", 0.04);
    setTimeout(() => playTone(659.25, 90, "triangle", 0.035), 90);
}

function playErrorSound() {
    playTone(146.83, 160, "sawtooth", 0.05);
}

function triggerHaptic(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function startBackgroundMusic() {
    if (!soundEnabled || backgroundMusicId || paused || !started) {
        return;
    }

    let step = 0;
    backgroundMusicId = setInterval(() => {
        if (!started || paused || !soundEnabled) {
            return;
        }

        playTone(musicNotes[step % musicNotes.length], 180, "triangle", 0.018);
        step += 1;
    }, currentDifficultySettings().musicTempoMs);
}

function stopBackgroundMusic() {
    if (backgroundMusicId) {
        clearInterval(backgroundMusicId);
        backgroundMusicId = null;
    }
}

function clearRoundTimer(preserveRemaining) {
    if (roundTimerId) {
        clearInterval(roundTimerId);
        roundTimerId = null;
    }

    if (!preserveRemaining) {
        roundTimerDeadline = 0;
        roundTimerRemainingMs = 0;
    }
}

function clearNextRoundTimer() {
    if (nextRoundTimeoutId) {
        clearTimeout(nextRoundTimeoutId);
        nextRoundTimeoutId = null;
    }

    nextRoundDeadline = 0;
    nextRoundRemainingMs = 0;
}

function startRoundTimer(durationMs) {
    if (!timerModeEnabled || paused || !started || !awaitingInput) {
        return;
    }

    clearRoundTimer(false);
    roundTimerRemainingMs = typeof durationMs === "number" ? durationMs : currentDifficultySettings().inputMs;
    roundTimerDeadline = Date.now() + roundTimerRemainingMs;
    updateTimerDisplay(roundTimerRemainingMs);

    roundTimerId = setInterval(() => {
        if (!started || paused || !awaitingInput) {
            return;
        }

        roundTimerRemainingMs = roundTimerDeadline - Date.now();
        if (roundTimerRemainingMs <= 0) {
            clearRoundTimer(false);
            handleGameOver("ran out of time!");
            return;
        }

        updateTimerDisplay(roundTimerRemainingMs);
    }, 100);
}

function scheduleNextRound() {
    clearNextRoundTimer();
    nextRoundRemainingMs = currentDifficultySettings().nextDelayMs;
    nextRoundDeadline = Date.now() + nextRoundRemainingMs;

    nextRoundTimeoutId = setTimeout(() => {
        nextRoundTimeoutId = null;
        if (!started) {
            return;
        }

        levelUp();
    }, nextRoundRemainingMs);
}

function showStartButton(label) {
    if (!startBtn) {
        return;
    }

    if (label) {
        startBtn.textContent = label;
    }

    startBtn.classList.remove("hidden");
}

function hideStartButton() {
    if (startBtn) {
        startBtn.classList.add("hidden");
    }
}

function resetRoundState() {
    level = 0;
    gameSeq = [];
    userSeq = [];
    awaitingInput = false;
    paused = false;
    clearRoundTimer(false);
    clearNextRoundTimer();
    updatePauseButton();
    updateTimerDisplay(0);
}

function resetMatchState() {
    currentPlayer = 1;
    playerScores = { 1: 0, 2: 0 };
    updatePlayerScoreDisplay();
}

function getRoundPrompt() {
    if (mode === "two-player") {
        return `Player ${currentPlayer} - Level ${level}`;
    }

    return "Level " + level;
}

function updateRoundPrompt() {
    if (!started) {
        return;
    }

    setPrompt(getRoundPrompt());
}

function toggleMode() {
    if (started || paused) {
        return;
    }

    mode = mode === "solo" ? "two-player" : "solo";
    resetMatchState();
    syncControlState();

    if (mode === "solo") {
        setPrompt("Tap Start or press any key to begin");
        showStartButton("Start Game");
    } else {
        setPrompt("Two-player mode: Player 1 tap Start to begin");
        showStartButton("Start Player 1");
    }
}

function toggleDifficulty() {
    if (started || paused) {
        return;
    }

    const currentIndex = difficultyOrder.indexOf(currentDifficulty);
    currentDifficulty = difficultyOrder[(currentIndex + 1) % difficultyOrder.length];
    syncControlState();
}

function toggleTimerMode() {
    if (started || paused) {
        return;
    }

    timerModeEnabled = !timerModeEnabled;
    syncControlState();
    if (!timerModeEnabled) {
        updateTimerDisplay(0);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    syncControlState();

    if (!soundEnabled) {
        stopBackgroundMusic();
    } else if (started && !paused) {
        startBackgroundMusic();
    }
}

function pauseGame() {
    if (!started || paused || !awaitingInput) {
        return;
    }

    paused = true;

    if (timerModeEnabled && roundTimerId) {
        roundTimerRemainingMs = roundTimerDeadline - Date.now();
        clearRoundTimer(true);
    }

    stopBackgroundMusic();
    setPrompt("Paused");
    showStartButton("Resume");
    syncControlState();
}

function resumeGame() {
    if (!paused) {
        return;
    }

    paused = false;
    hideStartButton();
    updateRoundPrompt();
    syncControlState();

    if (soundEnabled && started) {
        startBackgroundMusic();
    }

    if (timerModeEnabled && awaitingInput) {
        startRoundTimer(roundTimerRemainingMs || currentDifficultySettings().inputMs);
    }
}

function togglePause() {
    if (!started && !paused) {
        return;
    }

    if (paused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

function startGame() {
    if (paused) {
        resumeGame();
        return;
    }

    if (started) {
        return;
    }

    started = true;
    paused = false;
    clearRoundTimer(false);
    clearNextRoundTimer();
    hideStartButton();
    updatePauseButton();
    setPrompt(getRoundPrompt());

    if (soundEnabled) {
        startBackgroundMusic();
    }

    levelUp();
}

function handleGameOver(reason) {
    const score = Math.max(0, level - 1);

    clearRoundTimer(false);
    clearNextRoundTimer();
    stopBackgroundMusic();
    playErrorSound();
    triggerHaptic([80, 40, 80]);

    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = "High Score: " + highScore;
        celebrateNewHighScore();
        if (typeof saveHighScore === 'function') {
            saveHighScore(highScore);
        }
    }

    if (mode === "two-player") {
        playerScores[currentPlayer] = Math.max(playerScores[currentPlayer], score);
        updatePlayerScoreDisplay();

        const finishedPlayer = currentPlayer;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        h2.innerHTML = `Player ${finishedPlayer} ${reason} <b>Score: ${score}</b><br>Player ${currentPlayer}, tap Start to play.`;
        showStartButton(`Start Player ${currentPlayer}`);
    } else {
        h2.innerHTML = `Game Over! <b>Score: ${score}</b><br>Tap Start or press any key to restart.`;
        showStartButton("Play Again");
    }

    started = false;
    paused = false;
    awaitingInput = false;
    resetRoundState();
    updatePauseButton();
    syncControlState();
}

function btnFlash(btn) {
    if (btn) {
        btn.classList.add("flash");
        setTimeout(() => btn.classList.remove("flash"), currentDifficultySettings().flashMs);
    }
}

function userFlash(btn) {
    if (btn) {
        btn.classList.add("flash");
        setTimeout(() => btn.classList.remove("flash"), 180);
    }
}

function celebrateNewHighScore() {
    // Trigger strong celebratory haptics
    triggerHaptic([50, 30, 50, 30, 100]);
    
    // Play ascending celebratory tone sequence
    const celebrationTones = [523.25, 659.25, 783.99]; // C5, E5, G5
    celebrationTones.forEach((freq, index) => {
        setTimeout(() => {
            playTone(freq, 150, "sine", 0.08);
        }, index * 160);
    });
    
    // Animate high score display
    if (highScoreDisplay) {
        highScoreDisplay.classList.add("high-score-pop");
        setTimeout(() => {
            highScoreDisplay.classList.remove("high-score-pop");
        }, 1000);
    }
    
    // Generate confetti particles
    createConfetti();
}

function createConfetti() {
    const container = document.getElementById("confetti-container");
    if (!container) return;
    
    const particleCount = 25;
    const colors = ["#c77dff", "#7209b7", "#b5179e", "#f72585", "#4361ee", "#3a86ff"];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "confetti-particle";
        
        const size = Math.random() * 8 + 4; // 4-12px
        const color = colors[Math.floor(Math.random() * colors.length)];
        const startX = Math.random() * window.innerWidth;
        const startY = -10;
        const endX = startX + (Math.random() - 0.5) * 200;
        const duration = Math.random() * 1000 + 2000; // 2-3 seconds
        const delay = Math.random() * 100; // stagger start
        
        particle.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            pointer-events: none;
            box-shadow: 0 0 ${size}px ${color};
            left: ${startX}px;
            top: ${startY}px;
            animation: confettiFall ${duration}ms linear ${delay}ms forwards;
        `;
        
        // Store end position as custom property for animation
        particle.style.setProperty("--end-x", `${endX}px`);
        
        container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, duration + delay + 100);
    }
}

function levelUp() {
    clearRoundTimer(false);
    clearNextRoundTimer();
    userSeq = [];
    level += 1;
    awaitingInput = false;

    updateRoundPrompt();

    const randomNum = Math.floor(Math.random() * btns.length);
    const randomColor = btns[randomNum];
    const randomChosenBtn = document.querySelector(`.${randomColor}`);

    gameSeq.push(randomColor);
    btnFlash(randomChosenBtn);
    playButtonSound(randomColor);
    triggerHaptic(12);

    setTimeout(() => {
        if (!started || paused) {
            return;
        }

        awaitingInput = true;
        updatePauseButton();

        if (timerModeEnabled) {
            startRoundTimer(currentDifficultySettings().inputMs);
        } else if (timerDisplay) {
            timerDisplay.classList.add("hidden");
            updateTimerDisplay(0);
        }
    }, currentDifficultySettings().flashMs + 40);
}

function handleLevelComplete() {
    awaitingInput = false;
    clearRoundTimer(false);
    playSuccessSound();
    triggerHaptic([15, 25, 15]);
    updatePauseButton();
    scheduleNextRound();
}

function checkAns(idx) {
    if (!started || paused || !awaitingInput) {
        return;
    }

    if (userSeq[idx] === gameSeq[idx]) {
        if (userSeq.length === gameSeq.length) {
            handleLevelComplete();
        }
        return;
    }

    handleGameOver("missed!");
}

function btnPress() {
    if (!started || paused || !awaitingInput) {
        return;
    }

    const btn = this;
    userFlash(btn);

    const userColor = btn.getAttribute("id");
    userSeq.push(userColor);

    playButtonSound(userColor);
    triggerHaptic(8);
    checkAns(userSeq.length - 1);
}

let allBtns = document.querySelectorAll(".btn");
allBtns.forEach((btn) => btn.addEventListener("click", btnPress));

function handleKeyboardStart(event) {
    const key = (event.key || "").toLowerCase();

    if (key === "p") {
        if (started || paused) {
            togglePause();
        }
        return;
    }

    if (paused && (key === "enter" || key === " ")) {
        resumeGame();
        return;
    }

    if (!started) {
        startGame();
    }
}

document.addEventListener("keydown", handleKeyboardStart);

if (modeBtn) {
    modeBtn.addEventListener("click", toggleMode);
}

if (difficultyBtn) {
    difficultyBtn.addEventListener("click", toggleDifficulty);
}

if (timerBtn) {
    timerBtn.addEventListener("click", toggleTimerMode);
}

if (soundBtn) {
    soundBtn.addEventListener("click", toggleSound);
}

if (pauseBtn) {
    pauseBtn.addEventListener("click", togglePause);
}

if (startBtn) {
    startBtn.addEventListener("click", startGame);
}

initializeDefaultControlState();
syncControlState();
showStartButton("Start Game");
setPrompt("Tap Start or press any key to begin");

// Wrap each character of the H1 in a span so we can animate per-character
(function wrapHeadingChars() {
    const h1 = document.querySelector('h1');
    if (!h1) return;
    const text = h1.textContent || '';
    h1.innerHTML = '';
    Array.from(text).forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'heading-char';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        h1.appendChild(span);
    });
})();