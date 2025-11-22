import React, { useEffect } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { Dot } from './components/Dot';
import { ConnectorOverlay } from './components/ConnectorOverlay';
import { ScoreBoard } from './components/ScoreBoard';
import { GameOverModal } from './components/GameOverModal';
import { playClickSound } from './utils/sound';

const App: React.FC = () => {
  const {
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
  } = useGameLogic();

  // Global pointer up handler
  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [handlePointerUp]);

  const activeColor = path.length > 0 ? grid[path[0].row][path[0].col]?.color : null;

  const changeSize = (size: number) => {
    if (config.rows === size) return;
    playClickSound();
    resetGame(size);
  };

  // Size selector button helper
  const SizeBtn = ({ size }: { size: number }) => (
    <button
      onClick={() => changeSize(size)}
      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
        config.rows === size 
        ? 'bg-slate-800 text-white shadow-md scale-105' 
        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {size}x{size}
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-60px)] w-full bg-slate-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-[520px] flex flex-col items-center text-center gap-6">
        {/* Header */}
        <header className="relative z-10 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800 drop-shadow-sm">
            Two<span className="text-red-500">Dots</span>
          </h1>
          <div className="flex gap-2 justify-center flex-wrap">
              <SizeBtn size={6} />
              <SizeBtn size={8} />
              <SizeBtn size={10} />
          </div>
        </header>

        {/* Score Board */}
        <div className="relative z-10 w-full flex justify-center">
            <ScoreBoard score={score} highScore={highScore} moves={movesLeft} onReset={() => resetGame()} />
        </div>

        {/* Game Board Container */}
        <div className="relative z-10 touch-none select-none w-full flex justify-center">
                {/* SVG Overlay for Lines */}
          <div 
              className="bg-white p-3 sm:p-4 rounded-3xl shadow-xl border border-slate-200 relative w-full max-w-[460px]"
              style={{ touchAction: 'none' }}
          >
              {/* Dynamic Grid */}
              <div 
                  className="grid relative mx-auto"
                  style={{ 
                      width: 'clamp(260px, 80vw, 420px)', 
                      height: 'clamp(260px, 80vw, 420px)',
                      gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`
                  }}
                  onPointerLeave={handlePointerUp}
              >
                  {/* SVG Overlay for Lines */}
                  <ConnectorOverlay 
                    path={path} 
                    color={activeColor || null} 
                    isSquare={isSquare} 
                    rows={config.rows}
                    cols={config.cols}
                  />

                  {/* Dots */}
                  {grid.map((row, rIdx) => (
                      row.map((dot, cIdx) => {
                          if (!dot) return <div key={`${rIdx}-${cIdx}`} className="w-full h-full" />;

                          const inPath = path.some(p => p.row === rIdx && p.col === cIdx);
                          const isSquareHighlight = isSquare && activeColor === dot.color;

                          return (
                              <Dot
                                  key={dot.id}
                                  dot={dot}
                                  row={rIdx}
                                  col={cIdx}
                                  isSelected={inPath || isSquareHighlight}
                                  isSquare={isSquare}
                                  onDown={handleDotDown}
                                  onEnter={handleDotEnter}
                              />
                          );
                      })
                  ))}
              </div>
          </div>
        </div>
        
        {/* Game Over Modal */}
        <GameOverModal score={score} isOpen={isGameOver} onRestart={() => resetGame()} />
      </div>
    </div>
  );
};

export default App;