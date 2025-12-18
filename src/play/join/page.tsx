"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { firestoreService } from "../../lib/firestore";
import { Game } from "../../types/firebase";

export default function JoinGamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);

  async function handleFindGame(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const foundGame = await firestoreService.getGameByJoinCode(
        joinCode.toUpperCase()
      );
      if (!foundGame) {
        setError("Game not found. Check the code.");
        return;
      }

      if (foundGame.phase === "ended") {
        setError("This game has already ended.");
        return;
      }

      setGame(foundGame);
    } catch (err: any) {
      setError(err.message || "Failed to find game");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGame(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!game || !user) return;

      const playerData = {
        id: user.uid,
        name:
          playerName.trim() ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "Player",
        score: 0,
        joinedAt: new Date(),
      };

      await firestoreService.addPlayerToGame(game.id, playerData);
      navigate(`/play/game/${game.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join game");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="join-page-container">
        <h1 className="join-page-title">Join Game</h1>
        <p className="join-page-signin-message">Please sign in first</p>
        <Link to="/auth/signin">
          <button className="join-page-signin-button">Sign In</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="join-page-container">
      <h1 className="join-page-title">Join Game</h1>

      {!game ? (
        <form onSubmit={handleFindGame} className="join-form">
          <input
            type="text"
            value={joinCode}
            onChange={(e) =>
              setJoinCode(
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
              )
            }
            placeholder="Enter Game PIN"
            maxLength={6}
            className="join-pin-input"
            required
          />

          {error && <p className="join-error-message">{error}</p>}

          <button
            type="submit"
            disabled={loading || joinCode.length < 4}
            className="join-find-button"
          >
            {loading ? "Finding..." : "Find Game"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoinGame} className="join-form">
          <div className="join-game-pin-display">
            <p className="join-game-pin-label">Game PIN</p>
            <p className="join-game-pin-value">{game.joinCode}</p>
          </div>

          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your Nickname"
            maxLength={15}
            className="join-nickname-input"
            required
          />

          {error && <p className="join-error-message">{error}</p>}

          <div className="join-button-group">
            <button
              type="button"
              onClick={() => {
                setGame(null);
                setJoinCode("");
                setError("");
              }}
              className="join-back-button"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="join-join-button"
            >
              {loading ? "Joining..." : "Join!"}
            </button>
          </div>
        </form>
      )}

      <Link to="/" className="join-back-home-link">
        ← Back to Home
      </Link>
    </div>
  );
}
