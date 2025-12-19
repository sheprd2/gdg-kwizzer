"use client";

import { LeaderboardEntry } from "../../types/firebase";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  maxEntries?: number;
  showLiveIndicator?: boolean;
}

export function Leaderboard({
  entries,
  currentPlayerId,
  maxEntries = 5,
  showLiveIndicator = true,
}: LeaderboardProps) {
  const displayEntries = entries.slice(0, maxEntries);

  const getMedalRank = (index: number) => {
    switch (index) {
      case 0:
        return "rank-gold"; // Gold
      case 1:
        return "rank-silver"; // Silver
      case 2:
        return "rank-bronze"; // Bronze
      default:
        return "rank-default";
    }
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Leaderboard</h2>
        {showLiveIndicator && (
          <div className="leaderboard-live-indicator">
            <span className="live-dot"></span>
            Live
          </div>
        )}
      </div>

      <div className="leaderboard-entries">
        {displayEntries.length === 0 ? (
          <div className="leaderboard-empty">No scores yet</div>
        ) : (
          displayEntries.map((entry, index) => (
            <div
              key={entry.playerId}
              className={`leaderboard-entry ${
                entry.playerId === currentPlayerId ? "current-player" : ""
              }`}
            >
              <div className="leaderboard-player-info">
                <div className={`leaderboard-rank ${getMedalRank(index)}`}>
                  {index + 1}
                </div>
                <div>
                  <span
                    className={`leaderboard-player-name ${
                      entry.playerId === currentPlayerId ? "current" : ""
                    }`}
                  >
                    {entry.playerName}
                  </span>
                  {entry.playerId === currentPlayerId && (
                    <span className="leaderboard-you-badge">YOU</span>
                  )}
                </div>
              </div>
              <div className="leaderboard-score">{entry.score}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
