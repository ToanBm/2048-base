"use client";

import { useState, useEffect } from "react";
import {
  getTopAllTime,
  getTopWeekly,
  getTopDaily,
} from "@/lib/leaderboard";
import { LeaderboardEntry } from "@/lib/leaderboard";

type LeaderboardType = "all-time" | "weekly" | "daily";

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: string | null;
}

export default function Leaderboard({
  isOpen,
  onClose,
  playerAddress,
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("all-time");
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const fetchScores = async () => {
      try {
        let data: LeaderboardEntry[] = [];
        switch (activeTab) {
          case "all-time":
            data = await getTopAllTime(100);
            break;
          case "weekly":
            data = await getTopWeekly(10);
            break;
          case "daily":
            data = await getTopDaily(10);
            break;
        }
        setScores(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setScores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const shortenAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("all-time")}
            className={`flex-1 py-3 px-4 min-h-[44px] font-semibold transition-colors ${
              activeTab === "all-time"
                ? "bg-blue-500 dark:bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex-1 py-3 px-4 min-h-[44px] font-semibold transition-colors ${
              activeTab === "weekly"
                ? "bg-blue-500 dark:bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-3 px-4 min-h-[44px] font-semibold transition-colors ${
              activeTab === "daily"
                ? "bg-blue-500 dark:bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Daily
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400 text-center">
                <p className="text-lg mb-2">No scores yet</p>
                <p className="text-sm">Be the first to submit a score!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((entry, index) => {
                const normalizedEntryAddress = entry.player_address.toLowerCase().trim();
                const normalizedPlayerAddress = playerAddress?.toLowerCase().trim() || "";
                const isCurrentUser = normalizedPlayerAddress && normalizedEntryAddress === normalizedPlayerAddress;
                
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrentUser
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400"
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-900"
                            : index === 1
                            ? "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                            : index === 2
                            ? "bg-orange-300 dark:bg-orange-500 text-orange-900 dark:text-orange-900"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          {shortenAddress(entry.player_address)}
                          {isCurrentUser && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {formatScore(entry.score)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

