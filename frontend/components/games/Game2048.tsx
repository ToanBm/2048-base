"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GameState,
  initializeGame,
  makeMove,
  Direction,
} from "@/lib/games/game2048";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";
import { submitScore, getUserBestScore, validateScore } from "@/lib/leaderboard";
import { game2048Contract } from "@/lib/game2048";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { useName, Name, Identity, Avatar } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";
import Leaderboard from "@/components/Leaderboard";
import OnboardingModal from "@/components/OnboardingModal";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { useTheme } from "@/hooks/use-theme";

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
  const { address, chainId } = useAccount();
  const { theme, toggleTheme } = useTheme();
  const { writeContract, isPending: isWriting, error: writeError } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { isLoading: isConfirming, isSuccess, isError: isTransactionError } = useWaitForTransactionReceipt({
    hash: txHash,
    pollingInterval: 1000, // Check every 1 second
  });
  const publicClient = usePublicClient();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<"game" | "share" | "submit" | "leaderboard">("game");
  const [transactionStatus, setTransactionStatus] = useState<{ type: "info" | "success" | "error"; message: string; hash?: string } | null>(null);

  // Ref to store score being submitted (to avoid dependency on gameState)
  const submittedScoreRef = useRef<number>(0);

  // Get player address (from wallet)
  const playerAddress = address || null;

  // Get domain name (Basename) from address
  const { data: domainName, isLoading: isLoadingDomain } = useName({
    address: address as `0x${string}` | undefined,
    // chain: base, // Let OnchainKitProvider handle the chain
  } as any);

  // Debug log for domain name and API key
  useEffect(() => {
    if (address) {
      console.log("Debug Info:", {
        address,
        domainName,
        isLoadingDomain,
        hasApiKey: !!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
        chain: base.id
      });
    }
  }, [address, domainName, isLoadingDomain]);

  // Detect client type
  const isBaseApp = context?.client?.clientFid === 309857;
  const isFarcaster = context?.client?.clientFid === 1;

  // Check if onboarding has been shown before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenOnboarding = localStorage.getItem("2048-onboarding-seen");
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("2048-onboarding-seen", "true");
    }
  };

  // Initialize game state and load best score from contract
  useEffect(() => {
    if (typeof window !== "undefined" && !gameState) {
      // Always initialize game immediately, then try to load best score
      const savedBestScore = parseInt(
        localStorage.getItem("2048-best-score") || "0",
        10
      );
      setGameState(initializeGame(savedBestScore));

      // If we have player address, try to load from contract (async, non-blocking)
      if (playerAddress) {
        getUserBestScore(playerAddress)
          .then((bestScore) => {
            if (bestScore > savedBestScore) {
              setGameState(initializeGame(bestScore));
            }
          })
          .catch((error) => {
            console.error("Error loading best score from contract:", error);
            // Already initialized with localStorage, so just log error
          });
      }
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
  }, [gameState]);

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
      // Load from contract
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

  // Submit current score to contract
  const handleSubmitScore = async () => {
    if (!gameState || !playerAddress || gameState.score === 0) {
      alert("Please connect wallet and play the game first!");
      return;
    }

    if (!address) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsSubmittingScore(true);
    // Store score in ref to avoid dependency on gameState in useEffect
    submittedScoreRef.current = gameState.score;
    const currentScore = gameState.score;

    try {
      // Validate score first
      const validation = await validateScore(address, currentScore);
      if (!validation.valid) {
        setTransactionStatus({ type: "error", message: validation.error || "Invalid score" });
        setIsSubmittingScore(false);
        return;
      }

      console.log("Submitting score to contract:", { address: game2048Contract.address, score: currentScore });

      writeContract({
        ...game2048Contract,
        functionName: "submitScore",
        args: [BigInt(currentScore)],
      }, {
        onSuccess: (hash) => {
          console.log("Transaction sent:", hash);
          setTxHash(hash);
          setTransactionStatus({
            type: "info",
            message: "Transaction submitted. Waiting for confirmation..."
          });
        },
        onError: (error) => {
          console.error("Transaction error:", error);
          setIsSubmittingScore(false);
          setTransactionStatus({ type: "error", message: error.message || "Transaction failed" });
        }
      });
    } catch (error: any) {
      console.error("Error submitting score:", error);
      setIsSubmittingScore(false);
      setTransactionStatus({ type: "error", message: error.message || "Failed to submit score" });
    }
  };

  // Monitor transaction status
  useEffect(() => {
    if (txHash && isSubmittingScore) {
      // Show pending status immediately if not already shown
      if (transactionStatus?.type !== "info") {
        setTransactionStatus({
          type: "info",
          message: "Transaction submitted. Waiting for confirmation..."
        });
      }
    }
  }, [txHash, isSubmittingScore]);

  // Manual polling for transaction receipt (Backup for useWaitForTransactionReceipt)
  useEffect(() => {
    if (!txHash || !isSubmittingScore || !publicClient) return;

    const checkReceipt = async () => {
      try {
        console.log("Manual receipt check:", txHash);
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

        if (receipt && receipt.status === 'success') {
          console.log("Manual check success!", receipt);
          setIsSubmittingScore(false);
          setTransactionStatus({
            type: "success",
            message: `✅ Score ${submittedScoreRef.current} submitted successfully!`,
            hash: txHash
          });

          // Refresh best score
          if (playerAddress) {
            getUserBestScore(playerAddress).then((newBest) => {
              setGameState((prev) =>
                prev ? { ...prev, bestScore: Math.max(prev.bestScore, newBest) } : prev
              );
            });
          }
        } else if (receipt && receipt.status === 'reverted') {
          setIsSubmittingScore(false);
          setTransactionStatus({ type: "error", message: "❌ Transaction failed (reverted)." });
        }
      } catch (e) {
        console.warn("Manual check failed (expected if pending):", e);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkReceipt, 2000);
    return () => clearInterval(interval);
  }, [txHash, isSubmittingScore, publicClient, playerAddress]);

  // Handle writeContract error (before transaction is sent)
  useEffect(() => {
    if (writeError && isSubmittingScore) {
      setTransactionStatus({
        type: "error",
        message: `❌ Error: ${writeError.message || "Failed to send transaction. Please try again."}`
      });
      setIsSubmittingScore(false);
      const timer = setTimeout(() => setTransactionStatus(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [writeError, isSubmittingScore]);

  // Handle transaction error (after transaction is sent)
  useEffect(() => {
    if (isTransactionError) {
      setTransactionStatus({ type: "error", message: "❌ Transaction failed. Please try again." });
      const timer = setTimeout(() => setTransactionStatus(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [isTransactionError]);

  // Safety timer: Reset submitting state after 45 seconds if still submitting
  // This handles cases where RPC is slow or transaction is stuck
  useEffect(() => {
    if (isSubmittingScore) {
      const safetyTimer = setTimeout(() => {
        console.warn("Safety timer: Resetting isSubmittingScore after 45s");
        setIsSubmittingScore(false);
        setTransactionStatus({
          type: "error",
          message: "⏱️ Transaction is taking too long. Please check on blockchain explorer."
        });
        setTimeout(() => setTransactionStatus(null), 10000);
      }, 45000); // 45 seconds
      return () => clearTimeout(safetyTimer);
    }
  }, [isSubmittingScore]);

  const handleShare = () => {
    if (!gameState) return;

    const shareText = `🎮 2048 Onchain Score: ${gameState.score}${gameState.won ? " 🏆" : ""}\n\nCan you beat my score? Play now! 👇`;
    try {
      // Use SDK compose action (available automatically in mini app clients)
      if (typeof window !== "undefined" && sdk?.actions) {
        sdk.actions.composeCast({
          text: shareText,
          embeds: [window.location.href],
        });
      } else {
        // Fallback: copy to clipboard if not in mini app client
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
      <div className="flex flex-col items-center min-h-screen pt-4 px-4 pb-4 bg-[#eef0f3] dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">2048 Onchain</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Calculate submitting state - SIMPLIFIED LOGIC
  // Only use isSubmittingScore to control button state
  // isSuccess/isTransactionError will reset isSubmittingScore in useEffect above
  const isSubmitting = isSubmittingScore || isConfirming || isWriting;

  return (
    <div className="flex flex-col items-center min-h-screen pt-4 px-4 pb-20 bg-[#eef0f3] dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <Header />

        {/* Score Board */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg pt-2 pb-2 px-3 text-center shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{gameState.score}</div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg pt-2 pb-2 px-3 text-center shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{gameState.bestScore}</div>
          </div>
        </div>

        {/* Transaction Status - Fixed position to appear on top */}
        {transactionStatus && (
          <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 mb-4 p-4 rounded-lg shadow-lg text-center ${transactionStatus.type === "success"
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : transactionStatus.type === "error"
              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            }`}>
            <div className={`text-sm font-medium ${transactionStatus.type === "success"
              ? "text-green-700 dark:text-green-300"
              : transactionStatus.type === "error"
                ? "text-red-700 dark:text-red-300"
                : "text-blue-700 dark:text-blue-300"
              }`}>
              {transactionStatus.message}
            </div>
            {transactionStatus.type === "success" && transactionStatus.hash && (
              <a
                href={`https://basescan.org/tx/${transactionStatus.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline block"
              >
                View on BaseScan →
              </a>
            )}
          </div>
        )}

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
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
            {gameState.won && !gameState.gameOver && (
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                🏆 You Win! 🏆
              </div>
            )}
            {gameState.gameOver && (
              <div className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Game Over!
              </div>
            )}
            <div className="text-gray-600 dark:text-gray-400 mb-3">
              Final Score: <span className="font-bold">{gameState.score}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Swipe to join same numbers and reach 2048!</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">2048 Onchain — by toanbm</p>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => {
          setShowLeaderboard(false);
          setActiveTab("game");
        }}
        playerAddress={playerAddress}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />
      {/* Debug Section - Remove in production */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono break-all">
        <p className="font-bold mb-2">Debug Info:</p>
        <p>State: {isSubmittingScore ? 'Submitting' : 'Idle'}</p>
        <p>Hash: {txHash || 'None'}</p>
        <p>Status: {transactionStatus?.message || 'None'}</p>
        <p>PublicClient: {publicClient ? 'Ready' : 'Not Ready'}</p>
        <button
          onClick={async () => {
            if (!txHash || !publicClient) {
              alert("No hash or client");
              return;
            }
            try {
              console.log("Force checking receipt for:", txHash);
              const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
              console.log("Force check result:", receipt);
              alert(`Receipt found! Status: ${receipt.status}`);
              if (receipt.status === 'success') {
                setIsSubmittingScore(false);
                setTransactionStatus({
                  type: "success",
                  message: "✅ Manually confirmed success!",
                  hash: txHash
                });
              }
            } catch (e: any) {
              console.error("Force check error:", e);
              alert(`Error checking: ${e.message}`);
            }
          }}
          className="mt-2 px-2 py-1 bg-red-500 text-white rounded"
        >
          Force Check Receipt
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLeaderboardClick={() => setShowLeaderboard(true)}
        onNewGameClick={handleNewGame}
        onShareClick={handleShare}
        onSubmitClick={handleSubmitScore}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
