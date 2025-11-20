"use client";

interface BottomNavProps {
  activeTab: "game" | "share" | "submit" | "leaderboard";
  onTabChange: (tab: "game" | "share" | "submit" | "leaderboard") => void;
  onLeaderboardClick: () => void;
  onNewGameClick?: () => void;
  onShareClick?: () => void;
  onSubmitClick?: () => void;
  isSubmitting?: boolean;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onLeaderboardClick,
  onNewGameClick,
  onShareClick,
  onSubmitClick,
  isSubmitting = false,
}: BottomNavProps) {
  const handleGameClick = () => {
    onTabChange("game");
    if (onNewGameClick) {
      onNewGameClick();
    }
  };

  const handleShareClick = () => {
    onTabChange("share");
    if (onShareClick) {
      onShareClick();
    }
  };

  const handleSubmitClick = () => {
    onTabChange("submit");
    if (onSubmitClick) {
      onSubmitClick();
    }
  };

  const handleLeaderboardClick = () => {
    onTabChange("leaderboard");
    onLeaderboardClick();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around px-1 py-2">
        {/* New Game Tab */}
        <button
          onClick={handleGameClick}
          className="flex flex-col items-center justify-center gap-1 px-1 py-3 min-h-[44px] transition-colors flex-1"
          aria-label="New Game"
        >
          <svg
            className={`w-6 h-6 ${
              activeTab === "game" ? "text-[#66c800] dark:text-[#66c800]" : "text-gray-400 dark:text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span
            className={`text-xs font-medium ${
              activeTab === "game" ? "text-[#66c800] dark:text-[#66c800]" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            New Game
          </span>
        </button>

        {/* Share Tab */}
        <button
          onClick={handleShareClick}
          className="flex flex-col items-center justify-center gap-1 px-1 py-3 min-h-[44px] transition-colors flex-1"
          aria-label="Share Score"
        >
          <svg
            className={`w-6 h-6 ${
              activeTab === "share" ? "text-[#ffd12f] dark:text-[#ffd12f]" : "text-gray-400 dark:text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span
            className={`text-xs font-medium ${
              activeTab === "share" ? "text-[#ffd12f] dark:text-[#ffd12f]" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Share
          </span>
        </button>

        {/* Submit Score Tab */}
        <button
          onClick={handleSubmitClick}
          disabled={isSubmitting}
          className="flex flex-col items-center justify-center gap-1 px-1 py-3 min-h-[44px] transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Submit Score"
        >
          {isSubmitting ? (
            <svg
              className="w-6 h-6 text-blue-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className={`w-6 h-6 ${
                activeTab === "submit" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span
            className={`text-xs font-medium ${
              activeTab === "submit" ? "text-blue-500 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </span>
        </button>

        {/* Leaderboard Tab */}
        <button
          onClick={handleLeaderboardClick}
          className="flex flex-col items-center justify-center gap-1 px-1 py-3 min-h-[44px] transition-colors flex-1"
          aria-label="Leaderboard"
        >
          <svg
            className={`w-6 h-6 ${
              activeTab === "leaderboard" ? "text-purple-500 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <span
            className={`text-xs font-medium ${
              activeTab === "leaderboard"
                ? "text-purple-500 dark:text-purple-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Leaderboard
          </span>
        </button>
      </div>
    </nav>
  );
}

