"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { firestoreService } from "../../lib/firestore";
import { Quiz, Game } from "../../types/firebase";
import { useGame } from "../../hooks/useGame";
import { Button, Card } from "../../components/ui";
import { GameTimer } from "../../lib/gameTimer";

function HostPageContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quiz") || searchParams.get("quizId");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
  const [error, setError] = useState("");

  // Get real-time game data if we have a gameId
  const { game: liveGame } = useGame(gameId || "");
  const game = liveGame;

  useEffect(() => {
    async function loadQuiz() {
      if (!quizId || !user) {
        setLoading(false);
        return;
      }

      try {
        const quizData = await firestoreService.getQuiz(quizId);
        if (!quizData || quizData.createdBy !== user.uid) {
          setError("Quiz not found or access denied");
          return;
        }
        setQuiz(quizData);
      } catch (err) {
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId, user, navigate]);

  async function createGame() {
    if (!quiz || !user) return;

    setCreatingGame(true);
    setError("");

    try {
      const code = generateJoinCode();
      const gameData: Omit<Game, "id" | "startedAt" | "endedAt"> = {
        joinCode: code,
        quizId: quiz.id,
        hostId: user.uid,
        phase: "lobby",
        currentQuestionIndex: 0,
        settings: {
          questionTimeLimit: 30,
          showLeaderboard: true,
          autoProgress: false,
        },
      };

      const gameId = await firestoreService.createGame(gameData);
      setGameId(gameId);
    } catch (err: any) {
      setError(err.message || "Failed to create game");
    } finally {
      setCreatingGame(false);
    }
  }

  function generateJoinCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (loading) {
    return (
      <div className="host-center-container">
        <div className="host-loading-text">Loading...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="host-center-container">
        <Card variant="default" padding="lg" className="host-error-card">
          <h2 className="host-error-title">{error || "Quiz not found"}</h2>
          <Link to="/admin/quizzes">
            <Button variant="outline">Back to Quizzes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (game) {
    return <GameHost game={game} quiz={quiz} />;
  }

  return (
    <div className="host-setup-container">
      <div className="host-setup-wrapper">
        {/* Header */}
        <div className="host-setup-header">
          <div>
            <h1 className="host-setup-title">Host Game</h1>
            <p className="host-setup-subtitle">Set up and launch your quiz</p>
          </div>
          <Link to="/admin/quizzes">
            <Button size="sm">← Back</Button>
          </Link>
        </div>

        {/* Quiz Info Card */}
        <Card variant="default" padding="lg" className="host-setup-card">
          <div className="host-quiz-info">
            <div>
              <h2 className="host-quiz-title">{quiz.title}</h2>
              {quiz.description && (
                <p className="host-quiz-description">{quiz.description}</p>
              )}
              <div className="host-quiz-badges">
                <span className="host-quiz-badge">
                  {quiz.questions.length} questions
                </span>
                <span className="host-quiz-badge">
                  By {user?.displayName || user?.email}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Game Settings Card */}
        <Card variant="default" padding="lg" className="host-setup-card">
          <h3 className="host-settings-title">Game Settings</h3>

          <div className="host-settings-list">
            <div className="host-setting-item">
              <div>
                <span className="host-setting-label">Question Time Limit</span>
                <p className="host-setting-desc">Time per question</p>
              </div>
              <span className="host-setting-value">30s</span>
            </div>
            <div className="host-setting-item">
              <div>
                <span className="host-setting-label">Show Leaderboard</span>
                <p className="host-setting-desc">
                  Display rankings after each question
                </p>
              </div>
              <span className="host-setting-value">Yes</span>
            </div>
            <div className="host-setting-item host-setting-last">
              <div>
                <span className="host-setting-label">Auto Progress</span>
                <p className="host-setting-desc">
                  Automatically move to next question
                </p>
              </div>
              <span className="host-setting-value">No</span>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && <div className="host-error-message">{error}</div>}

        {/* Create Game Button */}
        <button
          onClick={createGame}
          disabled={creatingGame}
          className="host-create-button"
        >
          {creatingGame ? "Creating Game..." : "Create Game"}
        </button>
      </div>
    </div>
  );
}

import { QuestionText } from "../../components/game/QuestionText";
import { OptionButton } from "../../components/game/OptionButton";
import { Leaderboard } from "../../components/game/Leaderboard";
import { useLeaderboard } from "../../hooks/useGame";

function GameHost({ game, quiz }: { game: Game; quiz: Quiz }) {
  const { game: liveGame, players } = useGame(game.id);
  const leaderboardData = useLeaderboard(game.id);
  const [startingGame, setStartingGame] = useState(false);
  const [newPlayerId, setNewPlayerId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Use live game data if available, otherwise fall back to static game data
  const currentGame = liveGame || game;

  // Create leaderboard from players if no leaderboard data exists yet
  const leaderboard =
    leaderboardData.length > 0
      ? leaderboardData
      : players
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((p, i) => ({
            playerId: p.id,
            playerName: p.name,
            score: p.score || 0,
            rank: i + 1,
          }));

  useEffect(() => {
    // Track when new players join for animation
    if (players.length > 0) {
      const latestPlayer = players[players.length - 1];
      setNewPlayerId(latestPlayer.id);

      // Clear animation after 1 second
      const timer = setTimeout(() => setNewPlayerId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [players]);

  // Calculate time left from server-side timer
  const timeLeft = currentGame.timeLeft || 0;

  // Show answer when timer runs out, reset when new question starts
  useEffect(() => {
    if (currentGame.phase === "questionLive" && timeLeft === 0) {
      setShowAnswer(true);
    } else if (currentGame.phase === "results") {
      setShowAnswer(false);
    } else if (currentGame.phase === "questionLive" && timeLeft > 0) {
      // Reset when a new question starts (timeLeft > 0 means fresh question)
      setShowAnswer(false);
    }
  }, [currentGame.phase, timeLeft]);

  async function startGame() {
    if (startingGame) return;
    setStartingGame(true);
    try {
      console.log("[GameHost] Starting game:", game.id);

      // Get the time limit for the first question
      const firstQuestion = quiz.questions[0];
      const timeLimit = firstQuestion?.timeLimit || 30;

      // Start server-side timer
      await GameTimer.startQuestionTimer(game.id, timeLimit);

      console.log(
        "[GameHost] Game started successfully with server-side timer"
      );
    } catch (error) {
      console.error("[GameHost] Failed to start game:", error);
    } finally {
      setStartingGame(false);
    }
  }

  async function handleShowResults() {
    if (processing) return;
    setProcessing(true);
    try {
      console.log("[GameHost] Manually transitioning to results phase");
      
      // Clear the timer since we're ending early
      GameTimer.clearTimer(game.id);
      
      // Calculate scores for the current question (important when ending early)
      await GameTimer.calculateAndUpdateScores(game.id, currentGame.currentQuestionIndex || 0);
      
      // Update the game phase to results
      await firestoreService.updateGame(game.id, { 
        phase: "results",
        timeLeft: 0
      });
      
      console.log("[GameHost] Successfully transitioned to results phase with scores calculated");
    } catch (error) {
      console.error("[GameHost] Error showing results:", error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleNextQuestion() {
    if (processing) return;
    setProcessing(true);
    try {
      // Reset showAnswer state when moving to next question
      setShowAnswer(false);
      
      const nextIndex = currentGame.currentQuestionIndex + 1;
      if (nextIndex >= quiz.questions.length) {
        // Game ended
        await firestoreService.updateGame(game.id, { phase: "ended" });
      } else {
        // Next question - start server-side timer
        const nextQuestion = quiz.questions[nextIndex];
        const timeLimit = nextQuestion?.timeLimit || 30;

        await firestoreService.updateGame(game.id, {
          phase: "questionLive",
          currentQuestionIndex: nextIndex,
        });

        // Start server-side timer for next question
        await GameTimer.startQuestionTimer(game.id, timeLimit);
      }
    } catch (error) {
      console.error("[GameHost] Error moving to next question:", error);
    } finally {
      setProcessing(false);
    }
  }

  // --- Display Logic for Different Phases ---

  if (currentGame.phase === "questionLive" || currentGame.phase === "results") {
    const currentQuestion = quiz.questions[currentGame.currentQuestionIndex];
    const showResults = currentGame.phase === "results";

    return (
      <div className="host-question-page">
        {/* Header */}
        <div className="host-question-header">
          <div className="host-question-title-wrapper">
            <h1 className="host-question-title">
              {showResults ? "Results" : "Question"}{" "}
              {currentGame.currentQuestionIndex + 1}
              <span className="host-question-count">
                / {quiz.questions.length}
              </span>
            </h1>
          </div>
          <div className="host-question-info">
            {!showResults && (
              <div
                className={`host-timer ${
                  timeLeft <= 5 ? "host-timer-urgent" : ""
                }`}
              >
                {timeLeft}s
              </div>
            )}
            <div className="host-game-code">Code: {game.joinCode}</div>
          </div>
        </div>

        <div className="host-question-layout">
          {/* Main Content - Question & Options */}
          <div className="host-question-main">
            {/* Question Display */}
            <QuestionText text={currentQuestion.text} />

            {/* Show Correct Answer when time ends */}
            {showAnswer && (
              <div className="host-correct-answer-box">
                <p className="host-correct-answer-label">Correct Answer:</p>
                <p className="host-correct-answer-text">
                  {currentQuestion.options[currentQuestion.correctAnswer]}
                </p>
              </div>
            )}

            {/* Options Grid */}
            <div className="host-options-grid">
              {currentQuestion.options.map((option, index) => (
                <OptionButton
                  key={index}
                  index={index}
                  text={option}
                  disabled={true}
                  showResult={showResults || showAnswer}
                  isCorrect={index === currentQuestion.correctAnswer}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="host-controls-bar">
              <div className="host-players-connected">
                <span className="host-players-count">{players.length}</span>{" "}
                players connected
              </div>

              <div className="host-controls-buttons">
                {!showResults ? (
                  <button
                    onClick={handleShowResults}
                    disabled={processing}
                    className="host-control-button"
                  >
                    {processing
                      ? "Processing..."
                      : "Show Results"}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={processing}
                    className="host-control-button"
                  >
                    {processing
                      ? "Loading..."
                      : currentGame.currentQuestionIndex + 1 >=
                        quiz.questions.length
                      ? "End Game"
                      : "Next Question →"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Leaderboard */}
          <div className="host-sidebar-leaderboard">
            <Leaderboard
              entries={leaderboard}
              maxEntries={100}
              showLiveIndicator={true}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentGame.phase === "ended") {
    return (
      <div className="host-center-container">
        <div className="host-ended-wrapper">
          <div className="host-ended-header">
            <h1 className="host-ended-title">Game Ended!</h1>
            <p className="host-ended-subtitle">Thanks for hosting!</p>
          </div>

          {/* Show final leaderboard with gold/silver/bronze */}
          <div className="host-ended-leaderboard">
            <Leaderboard
              entries={leaderboard}
              maxEntries={100}
              showLiveIndicator={false}
            />
          </div>

          <Link to="/admin/quizzes">
            <Button variant="outline" className="host-back-button">
              Back to Quizzes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Lobby View (Default) ---
  return (
    <div className="host-lobby-page">
      <div className="host-lobby-wrapper">
        <Card variant="default" padding="lg">
          <div className="host-lobby-header">
            <h1 className="host-lobby-title">Game Lobby</h1>

            <div className="host-lobby-code">{game.joinCode}</div>
            <p className="host-lobby-subtitle">
              Players should enter this code to join
            </p>
          </div>

          <div className="host-lobby-divider">
            <div className="host-players-header">
              <h3 className="host-players-title">Players ({players.length})</h3>
              {players.length > 0 && (
                <span className="host-live-badge">● LIVE</span>
              )}
            </div>

            {players.length === 0 ? (
              <div className="host-empty-players">
                <div className="host-empty-players-title">
                  No players yet...
                </div>
                <div className="host-empty-players-subtitle">
                  Waiting for players to join
                </div>
              </div>
            ) : (
              <div className="host-players-grid">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`host-player-item ${
                      newPlayerId === player.id ? "host-player-new" : ""
                    }`}
                  >
                    <div className="host-player-number">{index + 1}</div>

                    <div className="host-player-info">
                      <div className="host-player-name">{player.name}</div>
                      {newPlayerId === player.id && (
                        <div className="host-player-joined">Joined!</div>
                      )}
                    </div>

                    <div className="host-player-indicator"></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="host-lobby-controls">
            <Button
              onClick={startGame}
              className="host-start-button"
              variant="outline"
              disabled={players.length === 0 || startingGame}
            >
              {startingGame ? "Starting Game..." : "Start Game"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="host-center-container">
          <div className="host-loading-spinner"></div>
        </div>
      }
    >
      <HostPageContent />
    </Suspense>
  );
}
