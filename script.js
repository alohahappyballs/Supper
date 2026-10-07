let rows = 9;
let cols = 9;
let tntcount = 10;
let board = [];
let gameOver = false;
let boomCell = null;
let gameWin = false;
let seconds = 0;
let timerId = null;
let flags = 0;
// создание доски
function generateBoard(rows, cols) {
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        isTnt: false,
        isRevealed: false,
        neighborTnt: 0,
        isFlagged: false
      });
    }
    board.push(row);
  }
}
// тасовка координат для мин
function shuffle(arr) {
  for (let i = arr.length - 1; i >= 1; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}
// раставление мин
function placeTnt(board, tntcount) {
  let coords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      coords.push([r, c]);
    }
  }

  shuffle(coords);

  for (let i = 0; i < tntcount; i++) {
    let r = coords[i][0];
    let c = coords[i][1];
    board[r][c].isTnt = true;
  }
}
// проверка соседних клеток
function checkNeighbors(board) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isTnt) continue;

      let count = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          let nr = r + dr;
          let nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (board[nr][nc].isTnt) count++;
        }
      }
      board[r][c].neighborTnt = count;
    }
  }
}

// рендер доски на сайте
function render(board) {
  let boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cellEl = document.createElement("div");
      cellEl.classList.add("cell");
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;

      if (board[r][c].isRevealed) {
        cellEl.classList.add("cell--open");
        if (board[r][c].neighborTnt > 0) {
          cellEl.classList.add("cell--n" + board[r][c].neighborTnt);
          cellEl.textContent = board[r][c].neighborTnt;
        }
      }

      if (board[r][c].isFlagged) {
        cellEl.classList.add("cell--flagged");
        cellEl.textContent = "🚩";
      }

      if (gameOver && board[r][c].isTnt) {
        cellEl.classList.add("cell--tnt");
        if (boomCell && boomCell.r === r && boomCell.c === c) {
          cellEl.classList.add("cell--tnt-boom");
        }
      }

      boardEl.appendChild(cellEl);
    }
  }
  //смена рожи при победе
  if (gameWin) {
    document.getElementById("restartBtn").textContent = "😎";
  } else {
    document.getElementById("restartBtn").textContent = "🙂";
  }

  // счетчик мин
  flags = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isFlagged) flags++;
    }
  }
  document.getElementById("mineCounter").textContent =
    String(tntcount - flags).padStart(3, "0");
}
// функция флудфил (функция открытия пустых полей)
function floodfill(r, c) {
  if (board[r][c].isRevealed) return;
  if (board[r][c].isTnt) return;

  board[r][c].isRevealed = true;

  if (board[r][c].neighborTnt === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        let nr = r + dr;
        let nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        floodfill(nr, nc);
      }
    }
  }
}
// проверка победы
function checkWin() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isTnt && !board[r][c].isRevealed) {
        return false;
      }
    }
  }
  return true;
}
// таймер
function startTimer() {
  seconds = 0;
  document.getElementById("timer").textContent = "000";
  timerId = setInterval(function() {
    seconds++;
    document.getElementById("timer").textContent = String(seconds).padStart(3, "0");
  }, 1000);
}
// стоп этого же таймера и его обнуление
function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}
// рестарт
function restart() {
  board = [];
  gameOver = false;
  gameWin = false;
  boomCell = null;
  seconds = 0;

  stopTimer();
  generateBoard(rows, cols);
  placeTnt(board, tntcount);
  checkNeighbors(board);

  startTimer();
  render(board);
}
// обработчик кликов (левая кнопка мыши)
let boardEl = document.getElementById("board");

boardEl.addEventListener("click", function(event) {
  if (gameOver) return;

  let r = Number(event.target.dataset.row);
  let c = Number(event.target.dataset.col);

  if (board[r][c].isRevealed) return;
  if (board[r][c].isFlagged) return;

  if (board[r][c].isTnt) {
    gameOver = true;
    boomCell = { r: r, c: c };
    stopTimer();
  } else {
    floodfill(r, c);
    if (checkWin()) {
      gameWin = true;
      gameOver = true;
      stopTimer();
    }
  }

  render(board);
});
// обработчик кликов (правая кнопка мыши)
boardEl.addEventListener("contextmenu", function(event) {
  event.preventDefault();

  if (gameOver) return;

  let r = Number(event.target.dataset.row);
  let c = Number(event.target.dataset.col);

  if (board[r][c].isRevealed) return;

  board[r][c].isFlagged = !board[r][c].isFlagged;
  render(board);
});
// первчный запуск при первом заходе на сайт

generateBoard(rows, cols);
placeTnt(board, tntcount);
checkNeighbors(board);
render(board);
startTimer();

document.getElementById("restartBtn").addEventListener("click", restart);