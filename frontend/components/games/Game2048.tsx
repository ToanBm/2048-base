"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GameState,
  initializeGame,
  makeMove,
  Direction,
} from "@/lib/games/game2048";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";
import { submitScore, getUserBestScore } from "@/lib/leaderboard";
import { useAccount } from "wagmi";
import Leaderboard from "@/components/Leaderboard";

const BOARD_SIZE = 4;

// Get tile color based on value - Orange color scheme
function getTileColor(value: number): string {
  const colors: Record<number, string> = {
    0: "bg-gray-300",
    2: "bg-[#fff7ed]",   // orange-50
    4: "bg-[#ffedd5]",   // orange-100
    8: "bg-[#ffe0b8]",   // orange-150 (custom)
    16: "bg-[#fed7aa]",  // orange-200
    32: "bg-[#fdcf9b]",  // orange-250 (custom)
    64: "bg-[#fdba74]",  // orange-300
    128: "bg-[#fda55d]", // orange-350 (custom)
    256: "bg-[#fb923c]", // orange-400
    512: "bg-[#fa7a29]", // orange-450 (custom)
    1024: "bg-[#f97316]", // orange-500
    2048: "bg-[#ea580c]", // orange-600
  };
  return colors[value] || "bg-gray-800";
}

// Get text color based on value - All black text
function getTextColor(value: number): string {
  return "text-black";
}

export default function Game2048() {
  const { context } = useMiniKit();
  const { address } = useAccount();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Get player address (from wallet)
  const playerAddress = address || null;

  // Initialize game state and load best score from Supabase
  useEffect(() => {
    if (typeof window !== "undefined" && !gameState && playerAddress) {
      // Load best score from Supabase
      getUserBestScore(playerAddress).then((bestScore) => {
        setGameState(initializeGame(bestScore));
      });
    } else if (typeof window !== "undefined" && !gameState && !playerAddress) {
      // Fallback to localStorage if no address
      const savedBestScore = parseInt(
        localStorage.getItem("2048-best-score") || "0",
        10
      );
      setGameState(initializeGame(savedBestScore));
    }
  }, [gameState, playerAddress]);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Save best score to localStorage only (no auto-submit)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      gameState &&
      gameState.bestScore > 0
    ) {
      localStorage.setItem("2048-best-score", gameState.bestScore.toString());
    }
  }, [gameState?.bestScore]);

  // Handle keyboard input
  useEffect(() => {
    if (!gameState) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver) return;

      let direction: Direction | null = null;
      switch (e.key) {
        case "ArrowUp":
          direction = "up";
          break;
        case "ArrowDown":
          direction = "down";
          break;
        case "ArrowLeft":
          direction = "left";
          break;
        case "ArrowRight":
          direction = "right";
          break;
      }

      if (direction) {
        e.preventDefault();
        setGameState((prev) => prev ? makeMove(prev, direction!) : prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !gameState || gameState.gameOver) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const diffX = touchEnd.x - touchStart.x;
    const diffY = touchEnd.y - touchStart.y;

    const minSwipeDistance = 10;
    let direction: Direction | null = null;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > minSwipeDistance) {
        direction = diffX > 0 ? "right" : "left";
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > minSwipeDistance) {
        direction = diffY > 0 ? "down" : "up";
      }
    }

    if (direction) {
      setGameState((prev) => prev ? makeMove(prev, direction!) : prev);
    }

    setTouchStart(null);
  };

  const handleMove = useCallback((direction: Direction) => {
    if (!gameState || gameState.gameOver) return;
    setGameState((prev) => prev ? makeMove(prev, direction) : prev);
  }, [gameState]);

  const handleNewGame = async () => {
    let savedBestScore = 0;
    if (playerAddress) {
      // Load from Supabase
      savedBestScore = await getUserBestScore(playerAddress);
    } else if (typeof window !== "undefined") {
      // Fallback to localStorage
      savedBestScore = parseInt(
        localStorage.getItem("2048-best-score") || "0",
        10
      );
    }
    setGameState(initializeGame(savedBestScore));
  };

  // Submit current score to leaderboard
  const handleSubmitScore = async () => {
    if (!gameState || !playerAddress || gameState.score === 0) return;

    setIsSubmittingScore(true);
    const result = await submitScore(playerAddress, gameState.score);
    setIsSubmittingScore(false);

    if (result.success) {
      alert(`✅ Score ${gameState.score} submitted to leaderboard!`);
      // Refresh best score
      const newBest = await getUserBestScore(playerAddress);
      if (newBest > gameState.bestScore) {
        setGameState((prev) =>
          prev ? { ...prev, bestScore: newBest } : prev
        );
      }
    } else {
      alert(`❌ Failed to submit score: ${result.error}`);
    }
  };

  const handleShare = () => {
    if (!gameState) return;
    
    const shareText = `🎮 2048 Onchain Score: ${gameState.score}${gameState.won ? " 🏆" : ""}\n\nCan you beat my score? Play now! 👇`;
    try {
      // Use Farcaster SDK (available automatically in Farcaster/Base App)
      if (typeof window !== "undefined" && sdk?.actions) {
        sdk.actions.composeCast({
          text: shareText,
          embeds: [window.location.href],
        });
      } else {
        // Fallback: copy to clipboard if not in Farcaster client
        if (typeof window !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(shareText + "\n" + window.location.href);
          alert("Score copied to clipboard! 📋");
        }
      }
    } catch (error) {
      console.error("Failed to share:", error);
      // Fallback: copy to clipboard
      if (typeof window !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(shareText + "\n" + window.location.href);
        alert("Score copied to clipboard! 📋");
      }
    }
  };

  // Show loading if game state not initialized yet
  if (!gameState) {
    return (
      <div className="flex flex-col items-center min-h-screen pt-4 px-4 pb-4 bg-[#eef0f3]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">2048 Onchain</h1>
          <p className="text-lg text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-4 px-4 pb-4 bg-[#eef0f3]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">2048 Onchain</h1>
          <p className="text-base text-gray-600">
            {context?.user?.displayName 
              ? `Welcome, ${context.user.displayName}!`
              : "Join tiles, get to 2048!"}
          </p>
        </div>

        {/* Score Board */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-white rounded-lg pt-2 pb-2 px-3 text-center shadow-md">
            <div className="text-sm text-gray-600 mb-1">Score</div>
            <div className="text-2xl font-bold text-gray-800">{gameState.score}</div>
          </div>
          <div className="flex-1 bg-white rounded-lg pt-2 pb-2 px-3 text-center shadow-md">
            <div className="text-sm text-gray-600 mb-1">Best</div>
            <div className="text-2xl font-bold text-gray-800">{gameState.bestScore}</div>
          </div>
        </div>

        {/* Game Board */}
        <div
          className="bg-gray-400 rounded-lg p-2 mb-6 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-2">
            {gameState.board.map((row, i) =>
              row.map((value, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    aspect-square rounded-md flex items-center justify-center
                    ${getTileColor(value)}
                    ${value === 0 ? "bg-gray-200" : "shadow-md"}
                    transition-all duration-150
                  `}
                >
                  <span
                    className={`
                      text-2xl font-bold ${getTextColor(value)}
                      transition-all duration-150
                      ${value === 0 
                        ? "opacity-0 scale-0" 
                        : "opacity-100 scale-100"
                      }
                    `}
                  >
                    {value !== 0 && value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Game Over / Won Message */}
        {(gameState.gameOver || gameState.won) && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow-lg text-center">
            {gameState.won && !gameState.gameOver && (
              <div className="text-2xl font-bold text-purple-600 mb-2">
                🏆 You Win! 🏆
              </div>
            )}
            {gameState.gameOver && (
              <div className="text-xl font-bold text-red-600 mb-2">
                Game Over!
              </div>
            )}
            <div className="text-gray-600 mb-3">
              Final Score: <span className="font-bold">{gameState.score}</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-col gap-2">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleNewGame}
              className="flex-1 bg-[#66c800] text-black rounded-lg pt-3 pb-3 px-3 font-semibold shadow-md hover:bg-[#5ab300] active:scale-95 transition-all"
            >
              New Game
            </button>
            <button
              onClick={handleShare}
              disabled={gameState.score === 0}
              className="flex-1 bg-[#ffd12f] text-black rounded-lg pt-3 pb-3 px-3 font-semibold shadow-md hover:bg-[#e6bc1a] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ffd12f]"
            >
              Share Score
            </button>
          </div>
          {/* Submit Score and Leaderboard Buttons - Same Row, 50% each */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitScore}
              disabled={!playerAddress || gameState.score === 0 || isSubmittingScore}
              className="flex-1 bg-blue-500 text-white rounded-lg pt-3 pb-3 px-3 font-semibold shadow-md hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingScore
                ? "Submitting..."
                : `Submit Score (${gameState.score})`}
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex-1 bg-purple-500 text-white rounded-lg pt-3 pb-3 px-3 font-semibold shadow-md hover:bg-purple-600 active:scale-95 transition-all"
            >
             Leaderboard
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Swipe to join same numbers and reach 2048!</p>
          <p className="mt-2 text-xs text-gray-500">2048 Onchain — by toanbm</p>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        playerAddress={playerAddress}
      />
    </div>
  );
}

