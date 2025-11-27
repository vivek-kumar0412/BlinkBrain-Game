let gameSeq = [];
let userSeq = [];
let started = false;
let level = 0;
let highScore = 0; // NEW: track highest score
let btns = ["red", "yellow", "green", "purple"];
let h2 = document.querySelector("h2");
let highScoreDisplay = document.querySelector("#high-score"); // NEW: high score element

// Start game on keypress
document.addEventListener("keypress", function () {
    if (!started) {
        started = true;
        levelUp();
    }
});

function btnFlash(btn) {
    if (btn) {
        btn.classList.add("flash");
        setTimeout(() => btn.classList.remove("flash"), 250);
    }
}

function userFlash(btn) {
    if (btn) {
        btn.classList.add("flash");
        setTimeout(() => btn.classList.remove("flash"), 250);
    }
}

function levelUp() {
    userSeq = [];
    level++;
    h2.textContent = "Level " + level;

    let randomNum = Math.floor(Math.random() * 4); // 0–3
    let randomColor = btns[randomNum];
    let randomChosenBtn = document.querySelector(`.${randomColor}`);

    gameSeq.push(randomColor);
    btnFlash(randomChosenBtn);
}

function checkAns(idx) {
    if (userSeq[idx] === gameSeq[idx]) {
        if (userSeq.length === gameSeq.length) {
            setTimeout(levelUp, 1000);
        }
    } else {
        // Update high score if current score is greater
        if (level > highScore) {
            highScore = level;
            highScoreDisplay.textContent = "High Score: " + highScore;
            // Save to server
            if (typeof saveHighScore === 'function') {
                saveHighScore(highScore);
            }
        }

        h2.innerHTML = `Game Over! <b>Score: ${level}</b><br>Press any key to restart.`;
        reset();
    }
}

function btnPress() {
    let btn = this;
    userFlash(btn);

    let userColor = btn.getAttribute("id");
    userSeq.push(userColor);

    checkAns(userSeq.length - 1);
}

let allBtns = document.querySelectorAll(".btn");
allBtns.forEach(btn => btn.addEventListener("click", btnPress));

function reset() {
    started = false;
    level = 0;
    gameSeq = [];
    userSeq = [];
}

// Wrap each character of the H1 in a span so we can animate per-character
(function wrapHeadingChars(){
    const h1 = document.querySelector('h1');
    if (!h1) return;
    const text = h1.textContent || '';
    h1.innerHTML = '';
    // Create spans for each character
    Array.from(text).forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'heading-char';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        h1.appendChild(span);
    });
})();