// Game 2048 Logic
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GameState {
  board: number[][];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
}

const BOARD_SIZE = 4;

// Initialize empty board
export function createEmptyBoard(): number[][] {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
}

// Add random tile (2 or 4)
function addRandomTile(board: number[][]): number[][] {
  const emptyCells: [number, number][] = [];
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        emptyCells.push([i, j]);
      }
    }
  }
  
  if (emptyCells.length === 0) return board;
  
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
  
  return newBoard;
}

// Initialize game with 2 random tiles
export function initializeGame(bestScore: number = 0): GameState {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  
  return {
    board,
    score: 0,
    bestScore,
    gameOver: false,
    won: false,
  };
}

// Move tiles left (base move)
function moveLeft(row: number[]): { row: number[]; score: number } {
  // Remove zeros
  let filtered = row.filter(val => val !== 0);
  let score = 0;
  
  // Merge adjacent equal tiles
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered[i + 1] = 0;
    }
  }
  
  // Remove zeros again
  filtered = filtered.filter(val => val !== 0);
  
  // Pad with zeros
  while (filtered.length < BOARD_SIZE) {
    filtered.push(0);
  }
  
  return { row: filtered, score };
}

// Rotate board clockwise
function rotateBoard(board: number[][], times: number): number[][] {
  let rotated = board.map(row => [...row]);
  
  for (let t = 0; t < times; t++) {
    const newBoard = createEmptyBoard();
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        newBoard[j][BOARD_SIZE - 1 - i] = rotated[i][j];
      }
    }
    rotated = newBoard;
  }
  
  return rotated;
}

// Move board in a direction
export function moveBoard(
  board: number[][],
  direction: Direction
): { board: number[][]; score: number; moved: boolean } {
  let rotated = board;
  let rotations = 0;
  
  // Rotate to make all moves equivalent to left move
  switch (direction) {
    case 'right':
      rotations = 2;
      break;
    case 'up':
      rotations = 3;
      break;
    case 'down':
      rotations = 1;
      break;
    case 'left':
      rotations = 0;
      break;
  }
  
  rotated = rotateBoard(board, rotations);
  
  // Move left
  const newBoard: number[][] = [];
  let totalScore = 0;
  let moved = false;
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    const { row, score } = moveLeft(rotated[i]);
    newBoard.push(row);
    totalScore += score;
    
    // Check if row changed
    if (JSON.stringify(rotated[i]) !== JSON.stringify(row)) {
      moved = true;
    }
  }
  
  // Rotate back
  const finalBoard = rotateBoard(newBoard, (4 - rotations) % 4);
  
  return { board: finalBoard, score: totalScore, moved };
}

// Check if game is over
export function checkGameOver(board: number[][]): boolean {
  // Check for empty cells
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  
  // Check for possible merges
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const current = board[i][j];
      
      // Check right
      if (j < BOARD_SIZE - 1 && board[i][j + 1] === current) return false;
      // Check down
      if (i < BOARD_SIZE - 1 && board[i + 1][j] === current) return false;
    }
  }
  
  return true;
}

// Check if won (reached 2048)
export function checkWon(board: number[][]): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 2048) return true;
    }
  }
  return false;
}

// Main game move function
export function makeMove(
  state: GameState,
  direction: Direction
): GameState {
  const { board, score, bestScore } = state;
  
  const { board: newBoard, score: moveScore, moved } = moveBoard(board, direction);
  
  if (!moved) {
    return state; // No move possible
  }
  
  // Add random tile
  const boardWithNewTile = addRandomTile(newBoard);
  
  const newScore = score + moveScore;
  const newBestScore = Math.max(bestScore, newScore);
  const gameOver = checkGameOver(boardWithNewTile);
  const won = checkWon(boardWithNewTile) || state.won;
  
  return {
    board: boardWithNewTile,
    score: newScore,
    bestScore: newBestScore,
    gameOver,
    won,
  };
}

