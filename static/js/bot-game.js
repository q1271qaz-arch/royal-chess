const levelSelect = document.getElementById("levelSelect");
const colorSelect = document.getElementById("colorSelect");
const newGameButton = document.getElementById("newGameButton");

const gameStatus = document.getElementById("gameStatus");
const moveHistory = document.getElementById("moveHistory");
const gameNumber = document.getElementById("gameNumber");
const playerColorElement = document.getElementById("playerColor");
const currentLevelElement =
    document.getElementById("currentLevel");

let board = null;
let chessGame = null;

let gameId = null;
let playerColor = "white";
let requestInProgress = false;
let gameFinished = false;


/*
Получает часть FEN, которую использует chessboard.js.
*/
function getBoardFen(fen) {
    if (!fen || fen === "start") {
        return "start";
    }

    return fen.split(" ")[0];
}


/*
Возвращает HTML-элемент клетки.
*/
function getSquareElement(square) {
    return document.querySelector(
        `#chessBoard [data-square="${square}"]`
    );
}


/*
Удаляет подсветку возможных ходов.
*/
function clearMoveHighlights() {
    const squares = document.querySelectorAll(
        "#chessBoard [data-square]"
    );

    squares.forEach((square) => {
        square.classList.remove(
            "possible-move",
            "possible-capture"
        );
    });
}


/*
Удаляет подсветку последнего хода.
*/
function clearLastMoveHighlight() {
    const squares = document.querySelectorAll(
        "#chessBoard [data-square]"
    );

    squares.forEach((square) => {
        square.classList.remove("last-move");
    });
}


/*
Подсвечивает последний ход.
*/
function highlightLastMove(moves) {
    clearLastMoveHighlight();

    if (!moves || !moves.trim()) {
        return;
    }

    const moveList = moves.trim().split(/\s+/);
    const lastMove = moveList[moveList.length - 1];

    if (!lastMove || lastMove.length < 4) {
        return;
    }

    const fromSquare = lastMove.slice(0, 2);
    const toSquare = lastMove.slice(2, 4);

    const fromElement = getSquareElement(fromSquare);
    const toElement = getSquareElement(toSquare);

    if (fromElement) {
        fromElement.classList.add("last-move");
    }

    if (toElement) {
        toElement.classList.add("last-move");
    }
}


/*
Показывает допустимые ходы при наведении.
*/
function handleMouseoverSquare(square) {
    if (
        !gameId ||
        requestInProgress ||
        gameFinished ||
        !chessGame
    ) {
        return;
    }

    const piece = chessGame.get(square);

    if (!piece) {
        return;
    }

    const pieceColor =
        piece.color === "w"
            ? "white"
            : "black";

    const currentTurn =
        chessGame.turn() === "w"
            ? "white"
            : "black";

    if (
        pieceColor !== playerColor ||
        currentTurn !== playerColor
    ) {
        return;
    }

    const legalMoves = chessGame.moves({
        square: square,
        verbose: true
    });

    if (!legalMoves.length) {
        return;
    }

    const sourceElement = getSquareElement(square);

    if (sourceElement) {
        sourceElement.classList.add("possible-move");
    }

    legalMoves.forEach((move) => {
        const targetElement =
            getSquareElement(move.to);

        if (!targetElement) {
            return;
        }

        if (move.captured) {
            targetElement.classList.add(
                "possible-capture"
            );
        } else {
            targetElement.classList.add(
                "possible-move"
            );
        }
    });
}


/*
Создаёт интерактивную доску.
*/
function initializeBoard() {
    const config = {
        draggable: true,
        position: "start",
        orientation: "white",
        showNotation: true,

        pieceTheme:
            "https://cdn.jsdelivr.net/gh/oakmac/chessboardjs@master/website/img/chesspieces/wikipedia/{piece}.png",

        onDragStart: handleDragStart,
        onDrop: handleDrop,
        onSnapEnd: handleSnapEnd,
        onMouseoverSquare: handleMouseoverSquare,
        onMouseoutSquare: clearMoveHighlights
    };

    board = Chessboard("chessBoard", config);
    chessGame = new Chess();
}


/*
Проверяет возможность начать перемещение фигуры.
*/
function handleDragStart(source, piece) {
    clearMoveHighlights();

    if (!gameId) {
        gameStatus.textContent =
            "Сначала нажмите «Начать новую игру».";

        return false;
    }

    if (requestInProgress || gameFinished) {
        return false;
    }

    const pieceColor = piece.charAt(0);

    if (
        playerColor === "white" &&
        pieceColor !== "w"
    ) {
        return false;
    }

    if (
        playerColor === "black" &&
        pieceColor !== "b"
    ) {
        return false;
    }

    const currentTurn =
        chessGame.turn() === "w"
            ? "white"
            : "black";

    if (currentTurn !== playerColor) {
        gameStatus.textContent =
            "Сейчас ход бота.";

        return false;
    }

    return true;
}


/*
Обрабатывает перемещение фигуры.
*/
function handleDrop(source, target) {
    clearMoveHighlights();

    if (
        !gameId ||
        requestInProgress ||
        gameFinished
    ) {
        return "snapback";
    }

    /*
    При превращении пешки пока автоматически
    выбирается ферзь.
    */
    const move = chessGame.move({
        from: source,
        to: target,
        promotion: "q"
    });

    if (move === null) {
        gameStatus.textContent =
            "Этот ход выполнить нельзя.";

        return "snapback";
    }

    const moveUci =
        `${move.from}${move.to}${move.promotion || ""}`;

    sendMove(moveUci);

    return undefined;
}


/*
Синхронизирует доску после окончания анимации.
*/
function handleSnapEnd() {
    if (!board || !chessGame) {
        return;
    }

    board.position(
        getBoardFen(chessGame.fen()),
        false
    );
}


/*
Создаёт новую партию.
*/
async function startNewGame() {
    if (requestInProgress) {
        return;
    }

    requestInProgress = true;
    gameFinished = false;
    newGameButton.disabled = true;

    playerColor = colorSelect.value;

    clearMoveHighlights();
    clearLastMoveHighlight();

    gameStatus.textContent =
        "Создание новой партии...";

    try {
        const response = await fetch(
            "/game/bot/new",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    level: Number(levelSelect.value),
                    color: playerColor
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Не удалось создать партию."
            );
        }

        gameId = data.game_id;

        loadPosition(data.fen);
        renderMoveHistory(data.moves);

        board.orientation(playerColor);

        board.position(
            getBoardFen(data.fen),
            false
        );

        setTimeout(() => {
            highlightLastMove(data.moves);
        }, 200);

        gameNumber.textContent =
            `№${gameId}`;

        playerColorElement.textContent =
            playerColor === "white"
                ? "Белые"
                : "Чёрные";

        currentLevelElement.textContent =
            levelSelect.options[
                levelSelect.selectedIndex
            ].text;

        gameStatus.textContent =
            getPositionStatus();

    } catch (error) {
        console.error(
            "Ошибка создания партии:",
            error
        );

        gameStatus.textContent =
            error.message ||
            "Не удалось создать партию.";

    } finally {
        requestInProgress = false;
        newGameButton.disabled = false;
    }
}


/*
Отправляет ход пользователя на сервер.
*/
async function sendMove(moveUci) {
    if (
        !gameId ||
        requestInProgress ||
        gameFinished
    ) {
        return;
    }

    requestInProgress = true;
    gameStatus.textContent =
        "Бот думает...";

    try {
        const response = await fetch(
            `/game/${gameId}/move`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    move: moveUci
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Не удалось выполнить ход."
            );
        }

        loadPosition(data.fen);

        board.position(
            getBoardFen(data.fen),
            true
        );

        renderMoveHistory(data.moves);

        setTimeout(() => {
            highlightLastMove(data.moves);
        }, 350);

        if (data.status === "finished") {
            gameFinished = true;
            showGameResult(data.result);
        } else {
            gameStatus.textContent =
                getPositionStatus();
        }

    } catch (error) {
        console.error(
            "Ошибка выполнения хода:",
            error
        );

        await restoreGamePosition();

        gameStatus.textContent =
            error.message ||
            "Ошибка выполнения хода.";

    } finally {
        requestInProgress = false;
    }
}


/*
Загружает FEN в chess.js.
*/
function loadPosition(fen) {
    chessGame = new Chess();

    if (!fen || fen === "start") {
        chessGame.reset();
        return;
    }

    const loaded = chessGame.load(fen);

    if (!loaded) {
        console.error(
            "Не удалось загрузить FEN:",
            fen
        );

        chessGame.reset();
    }
}


/*
Восстанавливает позицию из базы.
*/
async function restoreGamePosition() {
    if (!gameId) {
        return;
    }

    try {
        const response = await fetch(
            `/game/${gameId}`
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            return;
        }

        loadPosition(data.fen);

        board.position(
            getBoardFen(data.fen),
            false
        );

        renderMoveHistory(data.moves);

        setTimeout(() => {
            highlightLastMove(data.moves);
        }, 200);

    } catch (error) {
        console.error(
            "Ошибка восстановления позиции:",
            error
        );
    }
}


/*
Возвращает текст состояния игры.
*/
function getPositionStatus() {
    if (!chessGame) {
        return "Выберите настройки и начните игру";
    }

    if (chessGame.in_checkmate()) {
        return "Мат";
    }

    if (chessGame.in_draw()) {
        return "Ничья";
    }

    if (chessGame.in_stalemate()) {
        return "Пат";
    }

    if (chessGame.in_check()) {
        return "Шах! Ваш ход";
    }

    const currentTurn =
        chessGame.turn() === "w"
            ? "white"
            : "black";

    if (currentTurn === playerColor) {
        return "Ваш ход";
    }

    return "Ход бота";
}


/*
Отображает результат партии.
*/
function showGameResult(result) {
    const resultNames = {
        white: "Победили белые",
        black: "Победили чёрные",
        draw: "Партия завершилась вничью"
    };

    gameStatus.textContent =
        resultNames[result] ||
        "Партия завершена";
}


/*
Выводит историю ходов.
*/
function renderMoveHistory(moves) {
    if (!moves || !moves.trim()) {
        moveHistory.textContent =
            "Ходов пока нет.";

        return;
    }

    const moveList =
        moves.trim().split(/\s+/);

    moveHistory.innerHTML = "";

    for (
        let index = 0;
        index < moveList.length;
        index += 2
    ) {
        const row =
            document.createElement("div");

        row.className = "history-row";

        const number =
            document.createElement("span");

        number.className =
            "history-number";

        number.textContent =
            `${Math.floor(index / 2) + 1}.`;

        const whiteMove =
            document.createElement("span");

        whiteMove.textContent =
            moveList[index] || "—";

        const blackMove =
            document.createElement("span");

        blackMove.textContent =
            moveList[index + 1] || "—";

        row.appendChild(number);
        row.appendChild(whiteMove);
        row.appendChild(blackMove);

        moveHistory.appendChild(row);
    }

    moveHistory.scrollTop =
        moveHistory.scrollHeight;
}


/*
Запуск новой игры.
*/
newGameButton.addEventListener(
    "click",
    startNewGame
);


/*
Адаптация доски под размер окна.
*/
window.addEventListener(
    "resize",
    () => {
        if (board) {
            board.resize();
        }
    }
);


/*
Инициализация после загрузки страницы.
*/
document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (typeof jQuery === "undefined") {
            gameStatus.textContent =
                "Не загрузилась библиотека jQuery.";

            console.error(
                "jQuery не загружена."
            );

            return;
        }

        if (typeof Chess === "undefined") {
            gameStatus.textContent =
                "Не загрузилась библиотека chess.js.";

            console.error(
                "chess.js не загружена."
            );

            return;
        }

        if (typeof Chessboard === "undefined") {
            gameStatus.textContent =
                "Не загрузилась библиотека chessboard.js.";

            console.error(
                "chessboard.js не загружена."
            );

            return;
        }

        initializeBoard();
    }
);