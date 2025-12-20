// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Game2048
 * @notice Smart contract for 2048 game leaderboard on Base
 * @dev Stores player scores and maintains a sorted leaderboard
 */
contract Game2048 is Ownable, Pausable {
    // Struct to store player score with timestamp
    struct PlayerScore {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    // Mapping: player address => best score
    mapping(address => uint256) public playerScores;

    // Array to store top scores (sorted descending)
    PlayerScore[] public topScores;

    // Maximum number of top scores to store
    uint256 public constant MAX_TOP_SCORES = 100;

    // Total number of unique players
    uint256 public totalPlayers;

    // Total number of score submissions
    uint256 public totalSubmissions;

    // Events
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 timestamp,
        uint256 newRank
    );

    event LeaderboardUpdated(address indexed player, uint256 newRank);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Submit a new score
     * @dev Only updates if new score is higher than current best score
     * @param score The new score to submit
     */
    function submitScore(uint256 score) external whenNotPaused {
        require(score > 0, "Score must be greater than 0");

        uint256 currentBest = playerScores[msg.sender];
        require(score > currentBest, "Score must be higher than current best");

        // If this is a new player, increment total players
        if (currentBest == 0) {
            totalPlayers++;
        }

        // Update player's best score
        playerScores[msg.sender] = score;
        totalSubmissions++;

        // Update top scores array
        uint256 newRank = _updateTopScores(msg.sender, score);

        emit ScoreSubmitted(msg.sender, score, block.timestamp, newRank);
    }

    /**
     * @notice Get user's best score
     * @param player The player's address
     * @return The player's best score
     */
    function getUserBestScore(address player) external view returns (uint256) {
        return playerScores[player];
    }

    /**
     * @notice Get user's rank in leaderboard
     * @param player The player's address
     * @return The player's rank (0 if no score)
     */
    function getUserRank(address player) external view returns (uint256) {
        uint256 userScore = playerScores[player];
        if (userScore == 0) return 0;

        // Count players with higher scores
        uint256 rank = 1;
        for (uint256 i = 0; i < topScores.length; i++) {
            if (topScores[i].score > userScore) {
                rank++;
            } else {
                break; // Array is sorted, so we can break early
            }
        }
        return rank;
    }

    /**
     * @notice Get user's stats (score, rank, total players)
     * @param player The player's address
     * @return score The player's best score
     * @return rank The player's rank
     * @return totalPlayersCount Total number of players
     */
    function getUserStats(address player)
        external
        view
        returns (
            uint256 score,
            uint256 rank,
            uint256 totalPlayersCount
        )
    {
        score = playerScores[player];
        rank = score > 0 ? this.getUserRank(player) : 0;
        totalPlayersCount = totalPlayers;
    }

    /**
     * @notice Get top N scores
     * @param limit Maximum number of scores to return
     * @return Array of PlayerScore structs
     */
    function getTopScores(uint256 limit)
        external
        view
        returns (PlayerScore[] memory)
    {
        uint256 length = topScores.length < limit ? topScores.length : limit;
        PlayerScore[] memory result = new PlayerScore[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = topScores[i];
        }

        return result;
    }

    /**
     * @notice Get total number of players
     * @return Total number of unique players
     */
    function getTotalPlayers() external view returns (uint256) {
        return totalPlayers;
    }

    /**
     * @notice Get total number of score submissions
     * @return Total number of submissions
     */
    function getTotalSubmissions() external view returns (uint256) {
        return totalSubmissions;
    }

    /**
     * @notice Get current top scores count
     * @return Number of top scores stored
     */
    function getTopScoresCount() external view returns (uint256) {
        return topScores.length;
    }

    /**
     * @notice Pause contract (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Internal function to update top scores array
     * @param player The player's address
     * @param score The new score
     * @return newRank The player's new rank
     */
    function _updateTopScores(address player, uint256 score)
        internal
        returns (uint256)
    {
        // Find if player already exists in topScores
        int256 existingIndex = -1;
        for (uint256 i = 0; i < topScores.length; i++) {
            if (topScores[i].player == player) {
                existingIndex = int256(i);
                break;
            }
        }

        // Remove existing entry if found
        if (existingIndex >= 0) {
            _removeFromTopScores(uint256(existingIndex));
        }

        // Insert new score in sorted position
        uint256 insertIndex = topScores.length;
        for (uint256 i = 0; i < topScores.length; i++) {
            if (score > topScores[i].score) {
                insertIndex = i;
                break;
            }
        }

        // Create new PlayerScore
        PlayerScore memory newScore = PlayerScore({
            player: player,
            score: score,
            timestamp: block.timestamp
        });

        // Insert at the correct position
        if (insertIndex < topScores.length) {
            // Shift array to make room
            topScores.push(topScores[topScores.length - 1]);
            for (uint256 i = topScores.length - 1; i > insertIndex; i--) {
                topScores[i] = topScores[i - 1];
            }
            topScores[insertIndex] = newScore;
        } else {
            // Append to end
            topScores.push(newScore);
        }

        // Keep only top MAX_TOP_SCORES
        if (topScores.length > MAX_TOP_SCORES) {
            topScores.pop();
        }

        // Calculate and return rank
        return insertIndex + 1;
    }

    /**
     * @dev Internal function to remove an entry from topScores
     * @param index The index to remove
     */
    function _removeFromTopScores(uint256 index) internal {
        require(index < topScores.length, "Index out of bounds");

        // Shift all elements after index to the left
        for (uint256 i = index; i < topScores.length - 1; i++) {
            topScores[i] = topScores[i + 1];
        }

        // Remove last element
        topScores.pop();
    }
}

