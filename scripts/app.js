"use strict";

/* Variables */
const scoreArea = document.querySelector(".header__score");
const currentScoreText = document.querySelector(".current-score");
const highScoreText = document.querySelector(".high-score");
const headerThemeButton = document.querySelector(".header__theme");
const lightThemeIcon = document.querySelector(".theme--light-icon");
const darkThemeIcon = document.querySelector(".theme--dark-icon");

const playMenu = document.querySelector(".main__play-menu");
const playButton = document.querySelector(".play-button");

const countdownArea = document.querySelector(".main__loading-timer");
const countdownTimerText = document.querySelector(".timer-countdown");

const gameArea = document.querySelector(".main__section-game");
let isGameActive = false;

const playAgainMenu = document.querySelector(".main__play-again");
const playAgainButton = document.querySelector(".play-again");

const endScoreContainer = document.querySelector(".end-score");
const endCurrentScore = document.querySelector(".end-current-score");
const endHighScore = document.querySelector(".end-high-score");

let highScore,
    currentScore = 0;

const [squaresPerRow, squaresPerColumn] = [12, 12];

let currentDirection;
let snakeHeadClass, snakeHead, snakeFoodClass, snakeFood;
let tailRowPos, tailColPos;
let snakeBody = [];
let filledSquares = [];
let emptySquares = [];
let movementInterval;
const movementTime = 200;

// Touch Inputs
let startingX, startingY, movingX, movingY;

/* Functions */
const setTheme = function (theme) {
    if (theme === "dark") {
        document.body.classList.remove("light-mode");

        lightThemeIcon.classList.remove("hidden");
        darkThemeIcon.classList.add("hidden");
    } else {
        document.body.classList.add("light-mode");

        lightThemeIcon.classList.add("hidden");
        darkThemeIcon.classList.remove("hidden");
    }
};

const drawGameGrid = function () {
    gameArea.style.opacity = 1;
    currentScore = 0;
    currentScoreText.innerHTML = currentScore;
    scoreArea.classList.remove("end-game");
    scoreArea.classList.remove("hidden");

    // Margin between each square (horizontal and vertical)
    const marginOffset = 0.4;
    const [screenHeight, screenWidth] = [gameArea.offsetHeight, gameArea.offsetWidth];

    let [squareHeight, squareWidth] = [];

    // Calculate square height based on the screen size.
    if (screenHeight > screenWidth) {
        squareHeight = squareWidth = Math.floor(
            screenWidth / Math.floor(squaresPerRow + squaresPerRow * marginOffset)
        );
    } else {
        squareHeight = squareWidth = Math.floor(
            screenHeight / Math.floor(squaresPerRow + squaresPerRow * marginOffset)
        );
    }

    // Form the HTML code required by the play area.
    let gameSquareHTML = "";

    for (let col = 0; col < squaresPerColumn; col++) {
        const rowClass = `row-${col}`;
        gameSquareHTML += `<article class="game__square-row ${rowClass}">`;

        for (let row = 0; row < squaresPerRow; row++) {
            const colClass = `col-${row}`;
            const squareClass = `square-${rowClass}-${colClass}`;
            gameSquareHTML += `<div class="game__square ${squareClass}"></div>`;
        }
        gameSquareHTML += `</article>`;
    }

    // Create the play grid and assign corresponding classes.
    gameArea.innerHTML = gameSquareHTML;

    Array.from(document.querySelectorAll(".game__square")).forEach((square) => {
        square.style.height = `${squareHeight}px`;
        square.style.width = `${squareWidth}px`;
    });
};

const updateGameStatus = function () {
    filledSquares = [];
    emptySquares = [];

    // Keeps record of all empty and occupied slots.
    document.querySelectorAll(".game__square").forEach((square) => {
        if (square.matches(".snake-body, .snake-head, .food-active")) {
            filledSquares.push(square.classList[1]);
        } else {
            emptySquares.push(square.classList[1]);
        }
    });
};

const updateGameScore = function () {
    // Duh!
    currentScoreText.innerHTML = currentScore;
    if (currentScore > highScore) {
        highScore = currentScore;
        window.localStorage.setItem("highScore", highScore);
        highScoreText.innerHTML = highScore;
    }
};

const endGame = function (status) {
    // Hide play area, display the play again screen and reset the game status.
    document.querySelectorAll(`.game__square`).forEach((square) => {
        square.classList.add("game-over");
    });

    isGameActive = false;

    // 1s delay before displaying the score and play again screen.
    setTimeout(() => {
        gameArea.style.opacity = 0;

        snakeBody = [];

        playAgainMenu.classList.remove("hidden");
        endScoreContainer.classList.remove("hidden");
        endCurrentScore.innerHTML = currentScore;
        endHighScore.innerHTML = highScore;
        scoreArea.classList.add("hidden");
    }, 1000);
};

const consumeFood = function (direction, tailRowPos, tailColPos) {
    // Add new body element to the snake.
    let nextBlockPos;

    // Various conditions to determine the position of the new body.
    /* prettier-ignore */
    if (direction === "up") {
        nextBlockPos = `.square-row-${tailRowPos + 1}-col-${tailColPos}`;

        if (tailRowPos >= 11 || tailColPos <= 0)
            nextBlockPos = `.square-row-${tailRowPos}-col-${tailColPos + 1}`;
        else if (tailRowPos >= 11 || tailColPos >= 11)
            nextBlockPos = `.square-row-${tailRowPos}-col-${tailColPos - 1}`;
    } 
    else if (direction === "right") {
        nextBlockPos = `.square-row-${tailRowPos}-col-${tailColPos - 1}`;

        if (tailRowPos >= 11 || tailColPos <= 0)
            nextBlockPos = `.square-row-${tailRowPos - 1}-col-${tailColPos}`;
        else if (tailRowPos <= 0 || tailColPos <= 0)
            nextBlockPos = `.square-row-${tailRowPos + 1}-col-${tailColPos}`;
    } 
    else if (direction === "down") {
        nextBlockPos = `.square-row-${tailRowPos - 1}-col-${tailColPos}`;

        if (tailRowPos <= 0 || tailColPos <= 0)
            nextBlockPos = `.square-row-${tailRowPos}-col-${tailColPos + 1}`;
        else if (tailRowPos <= 0 || tailColPos >= 11)
            nextBlockPos = `.square-row-${tailRowPos}-col-${tailColPos - 1}`;
    } 
    else if (direction === "left") {
        nextBlockPos = `.square-row-${tailRowPos}-col-${tailColPos + 1}`;

        if (tailRowPos >= 11 || tailColPos >= 11)
            nextBlockPos = `.square-row-${tailRowPos - 1}-col-${tailColPos}`;
        else if (tailRowPos <= 0 || tailColPos >= 11)
            nextBlockPos = `.square-row-${tailRowPos + 1}-col-${tailColPos}`;
        
    }

    // Add new body and push the new block to the snake body array.
    document.querySelector(nextBlockPos).classList.add("snake-body");
    snakeBody.push(nextBlockPos);

    // Remove food and create new food element in a random empty slot.
    snakeFood.classList.remove("food-active");

    const randomEmptySlot = Math.floor(Math.random() * emptySquares.length);
    const newFoodClass = emptySquares[randomEmptySlot];

    snakeFoodClass = newFoodClass;

    snakeFood = document.querySelector(`.${snakeFoodClass}`);
    snakeFood.classList.add("food-active");

    // Update score.
    currentScore++;
    updateGameScore();
};

const moveSnake = function (direction) {
    currentDirection = direction;

    // Stop previous movement everytime (if any) a new key press is detected.
    clearInterval(movementInterval);

    let headRowPos = Number.parseInt(snakeHeadClass.split("-")[2]);
    let headColPos = Number.parseInt(snakeHeadClass.split("-")[4]);

    movementInterval = setInterval(function () {
        // Remove the current snake head and update the position based on user input.
        document
            .querySelector(`.square-row-${headRowPos}-col-${headColPos}`)
            .classList.remove("snake-head");

        if (direction === "up") headRowPos--;
        else if (direction === "right") headColPos++;
        else if (direction === "down") headRowPos++;
        else if (direction === "left") headColPos--;

        // If snake goes beyond game area, end the game.
        if (headRowPos < 0 || headColPos < 0 || headRowPos >= 12 || headColPos >= 12) {
            clearInterval(movementInterval);
            endGame("lost");
            return;
        }

        // Update new position of snake head.
        document
            .querySelector(`.square-row-${headRowPos}-col-${headColPos}`)
            .classList.add("snake-head");

        snakeHeadClass = document.querySelector(".snake-head").classList[1];
        snakeHead = document.querySelector(`.${snakeHeadClass}`);

        // If snake head runs into its own body, end the game.
        if (snakeBody.includes(`.${snakeHeadClass}`)) {
            clearInterval(movementInterval);
            endGame("lost");
            return;
        }

        // Update the position of the rest of the snake.
        let lastIndex = snakeBody.length - 1;
        let currIndex = lastIndex;

        snakeBody.forEach((_, index) => {
            if (index > 0) {
                document.querySelector(snakeBody[index]).classList.remove("snake-body");
            }
        });

        // Switch the position of the snake body one by one.
        snakeBody.forEach((_, index) => {
            if (index > 0) {
                snakeBody[currIndex] = snakeBody[currIndex - 1];
                currIndex--;

                if (index === lastIndex) {
                    let tailElement = document.querySelector(snakeBody[index])
                        .classList[1];
                    tailRowPos = Number.parseInt(tailElement.split("-")[2]);
                    tailColPos = Number.parseInt(tailElement.split("-")[4]);
                }
            }
        });

        snakeBody.forEach((_, index) => {
            if (index > 0) {
                document.querySelector(snakeBody[index]).classList.add("snake-body");
            }
        });

        if (snakeBody.length === 1) {
            tailRowPos = headRowPos;
            tailColPos = headColPos;
        }

        snakeBody[0] = `.${snakeHeadClass}`;

        // Add snake body.
        if (snakeFoodClass === snakeHeadClass) {
            consumeFood(direction, tailRowPos, tailColPos);
        }

        updateGameStatus();
    }, movementTime);
};

const startTimer = function () {
    let timerValue = 3;

    playMenu.classList.add("hidden");
    playAgainMenu.classList.add("hidden");
    countdownArea.classList.remove("hidden");
    drawGameGrid();

    let timerInterval = setInterval(function () {
        countdownTimerText.innerHTML = timerValue--;

        if (timerValue < 0) {
            clearInterval(timerInterval);
            countdownArea.classList.add("hidden");
            startGame();
            countdownTimerText.innerHTML = 3;
        }
    }, 700);
};

const startGame = function () {
    isGameActive = true;
    snakeBody = [];

    // Initial position of the snake.
    document.querySelector(".square-row-11-col-0").classList.add("snake-head");

    snakeBody.push(".square-row-11-col-0");

    // Compute random initial position of food.
    const computeRandomPosition = function () {
        const randheadRowPosition = Math.floor(Math.random() * 11);
        const randheadColPosition = Math.floor(Math.random() * 11);

        randheadRowPosition === 11 &&
            randheadColPosition === 0 &&
            computeRandomPosition();
        return `square-row-${randheadRowPosition}-col-${randheadColPosition}`;
    };

    document.querySelector(`.${computeRandomPosition()}`).classList.add("food-active");

    // Store initial position of snake and food.
    snakeHeadClass = document.querySelector(".snake-head").classList[1];
    snakeHead = document.querySelector(`.${snakeHeadClass}`);

    snakeFoodClass = document.querySelector(".food-active").classList[1];
    snakeFood = document.querySelector(`.${snakeFoodClass}`);

    updateGameStatus();

    // First move to right by deafult.
    moveSnake("right");
};

// Move the snake based on user input.
const readUserInput = function (e, touchInput) {
    const pressedKey = `${e.key}`.toLowerCase();

    if (pressedKey === " ") {
        if (!isGameActive) {
            startTimer();
        }
    }

    // Do not record any keystrokes other than the space key, if the user is at the menu screen.
    if (!isGameActive) return;

    // Move the snake, but not in the opposite direction.
    if (pressedKey === "w" || pressedKey == "arrowup" || touchInput === "up") {
        currentDirection != "down" && moveSnake("up");
    } else if (
        pressedKey === "d" ||
        pressedKey == "arrowright" ||
        touchInput === "right"
    ) {
        currentDirection != "left" && moveSnake("right");
    } else if (pressedKey === "s" || pressedKey == "arrowdown" || touchInput === "down") {
        currentDirection != "up" && moveSnake("down");
    } else if (pressedKey === "a" || pressedKey == "arrowleft" || touchInput === "left") {
        currentDirection != "right" && moveSnake("left");
    } else {
        return;
    }
};

const initialize = function () {
    // Check for locally stored theme preference, else default to dark theme.
    let theme = window.localStorage.getItem("snakeGameTheme") || "dark";
    setTheme(theme);
    window.localStorage.setItem("snakeGameTheme", theme);

    highScore = Number.parseInt(window.localStorage.getItem("highScore")) || 0;

    highScoreText.innerHTML = highScore;
    currentScoreText.innerHTML = currentScore;
};

initialize();

/* Event Listeners */
headerThemeButton.addEventListener("click", function () {
    let theme = window.localStorage.getItem("snakeGameTheme");
    if (theme === "dark") {
        setTheme("light");
        theme = "light";
        window.localStorage.setItem("snakeGameTheme", theme);
    } else if (theme === "light") {
        setTheme("dark");
        theme = "dark";
        window.localStorage.setItem("snakeGameTheme", theme);
    }
});

// Start the game
playButton.addEventListener("click", function () {
    startTimer();
});

// Swipe input for touch devices.
document.body.addEventListener("keydown", function (e) {
    readUserInput(e);
});

document.body.addEventListener("touchstart", function (e) {
    startingX = e.targetTouches[0].clientX;
    startingY = e.targetTouches[0].clientY;
});

document.body.addEventListener("touchmove", function (e) {
    movingX = e.targetTouches[0].clientX;
    movingY = e.targetTouches[0].clientY;
});

document.body.addEventListener("touchend", function (e) {
    // 100 -> swipe threshold value.
    if (startingY - 100 > movingY) readUserInput(e, "up");
    else if (startingY + 100 < movingY) readUserInput(e, "down");

    if (startingX + 100 < movingX) readUserInput(e, "right");
    else if (startingX - 100 > movingX) readUserInput(e, "left");
});

// Retry game.
playAgainButton.addEventListener("click", function () {
    startTimer();
});
