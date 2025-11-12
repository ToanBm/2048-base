"use client";

import { useState, useEffect } from "react";
import {
  getTopAllTime,
  getTopWeekly,
  getTopDaily,
} from "@/lib/leaderboard";
import { LeaderboardEntry } from "@/lib/supabase";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("all-time")}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === "all-time"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === "weekly"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === "daily"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Daily
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 text-center">
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
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-400 text-yellow-900"
                            : index === 1
                            ? "bg-gray-300 text-gray-700"
                            : index === 2
                            ? "bg-orange-300 text-orange-900"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {shortenAddress(entry.player_address)}
                          {isCurrentUser && (
                            <span className="ml-2 text-blue-600 text-xs">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-800">
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

