import { useState, useCallback, useEffect, useRef } from 'react';
import { Coordinate, DotColor, DotItem, GridState } from '../types';
import { GAME_CONFIG } from '../constants';
import { playPopSound, playSquareSound, playClearSound, playGameOverSound } from '../utils/sound';

const COLORS = [
  DotColor.Red,
  DotColor.Blue,
  DotColor.Green,
  DotColor.Yellow,
  DotColor.Purple,
];

const generateDot = (): DotItem => ({
  id: Math.random().toString(36).substring(2, 9),
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

const initializeGrid = (rows: number, cols: number): GridState => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => generateDot())
  );
};

export const useGameLogic = () => {
  const [config, setConfig] = useState({
    rows: GAME_CONFIG.rows,
    cols: GAME_CONFIG.cols,
    moves: GAME_CONFIG.moves
  });

  const [grid, setGrid] = useState<GridState>(() => initializeGrid(config.rows, config.cols));
  const [path, setPath] = useState<Coordinate[]>([]);
  const [isSquare, setIsSquare] = useState(false);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(config.moves);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // High Score Logic
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('dotConnectHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('dotConnectHighScore', score.toString());
    }
  }, [score, highScore]);

  // Track dragged color to prevent crossing into other colors
  const activeColor = useRef<DotColor | null>(null);

  const getDot = useCallback((r: number, c: number) => {
    if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return null;
    return grid[r][c];
  }, [grid, config]);

  const handleDotDown = (row: number, col: number) => {
    if (isGameOver || movesLeft <= 0) return;
    
    const dot = getDot(row, col);
    if (!dot) return;

    setIsDragging(true);
    setPath([{ row, col }]);
    activeColor.current = dot.color;
    playPopSound(0);
  };

  const handleDotEnter = (row: number, col: number) => {
    if (!isDragging || !activeColor.current || isGameOver) return;

    const dot = getDot(row, col);
    if (!dot || dot.color !== activeColor.current) return;

    // Check if adjacent to last dot
    const lastPos = path[path.length - 1];
    const isAdjacent = 
      (Math.abs(row - lastPos.row) === 1 && col === lastPos.col) ||
      (Math.abs(col - lastPos.col) === 1 && row === lastPos.row);

    if (!isAdjacent) return;

    // Check if backtracking (user moves back to previous dot)
    if (path.length > 1) {
      const prevPos = path[path.length - 2];
      if (prevPos.row === row && prevPos.col === col) {
        // Remove last dot
        setPath((prev) => prev.slice(0, -1));
        // If we were a square, re-evaluate if we are STILL a square
        // For simplicity, if we backtrack, we just assume not a square unless re-closed.
        setIsSquare(false);
        playPopSound(path.length - 2);
        return;
      }
    }

    // Check if already in path (cycle detection)
    const existingIndex = path.findIndex(p => p.row === row && p.col === col);
    
    if (existingIndex !== -1) {
      // Only treat returning to the starting dot (index 0) as a square loop
      if (existingIndex === 0 && path.length >= 3) {
        setIsSquare(true);
        setPath((prev) => [...prev, { row, col }]); // close loop visually
        playSquareSound();
      }
      return;
    }

    // New dot
    setPath((prev) => [...prev, { row, col }]);
    playPopSound(path.length);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    activeColor.current = null;

    if (path.length < 2) {
      setPath([]);
      setIsSquare(false);
      return;
    }

    // Valid move
    processMove();
  };

  const processMove = () => {
    const currentScoreToAdd = isSquare ? path.length * 2 + 10 : path.length;
    setScore((s) => s + currentScoreToAdd);
    setMovesLeft((m) => m - 1);
    
    // Play clear sound
    playClearSound(isSquare);

    let dotsToRemove: Coordinate[] = [];
    
    if (isSquare) {
      // Remove ALL dots of this color
      const colorToRemove = getDot(path[0].row, path[0].col)?.color;
      if (colorToRemove) {
        grid.forEach((row, rIdx) => {
          row.forEach((dot, cIdx) => {
            if (dot?.color === colorToRemove) {
              dotsToRemove.push({ row: rIdx, col: cIdx });
            }
          });
        });
      }
    } else {
      dotsToRemove = [...path];
    }

    // Apply removal
    const newGrid = grid.map(row => [...row]);
    dotsToRemove.forEach(({ row, col }) => {
      newGrid[row][col] = null;
    });

    // Gravity and Refill
    // Process each column
    for (let c = 0; c < config.cols; c++) {
      const columnDots: DotItem[] = [];
      // Collect remaining dots
      for (let r = 0; r < config.rows; r++) {
        if (newGrid[r][c]) {
          columnDots.push(newGrid[r][c]!);
        }
      }
      
      // Fill top with new dots
      const missingCount = config.rows - columnDots.length;
      const newDots = Array.from({ length: missingCount }, () => generateDot());
      
      // Combine: new dots on top, existing on bottom
      const mergedCol = [...newDots, ...columnDots];
      
      // Write back to grid
      for (let r = 0; r < config.rows; r++) {
        newGrid[r][c] = mergedCol[r];
      }
    }

    setGrid(newGrid);
    setPath([]);
    setIsSquare(false);
  };

  // Check game over
  useEffect(() => {
    if (movesLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      playGameOverSound();
    }
  }, [movesLeft, isGameOver]);

  // Reset game with optional new size
  const resetGame = (newSize?: number) => {
    const r = newSize || config.rows;
    const c = newSize || config.cols;
    
    setConfig(prev => ({ ...prev, rows: r, cols: c }));
    setGrid(initializeGrid(r, c));
    setScore(0);
    setMovesLeft(GAME_CONFIG.moves); // Reset to max moves (100)
    setIsGameOver(false);
    setPath([]);
    setIsSquare(false);
  };

  return {
    grid,
    path,
    isSquare,
    score,
    highScore,
    movesLeft,
    isGameOver,
    config,
    handleDotDown,
    handleDotEnter,
    handlePointerUp,
    resetGame
  };
};
