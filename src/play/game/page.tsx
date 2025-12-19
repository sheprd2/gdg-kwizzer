"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { firestoreService } from "../../lib/firestore";
import { useGame, useLeaderboard } from "../../hooks/useGame";
import { Quiz, Player } from "../../types/firebase";
import { Button, Card, Spinner } from "../../components/ui";
import { QuestionText, OptionButton, Leaderboard } from "../../components/game";

export default function GamePage() {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const gameId = params.gameId as string;

  const { game, players, loading: gameLoading } = useGame(gameId);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Move all hooks to the top level - always called unconditionally
  const leaderboard = useLeaderboard(gameId);

  useEffect(() => {
    async function loadQuiz() {
      if (!game) return;

      try {
        const quizData = await firestoreService.getQuiz(String(game.quizId));
        setQuiz(quizData);

        const player = players.find((p) => p.id === user?.uid);
        setCurrentPlayer(player || null);
      } catch (error) {
        console.error("Error loading quiz:", error);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [game?.quizId, user?.uid]); // Only fetch quiz when quizId or user changes

  // Reset answer state when question changes to a new question
  useEffect(() => {
    if (game?.phase === "questionLive" && quiz) {
      // Only reset if this is a new question (different from current)
      const currentQuestionIndex = game.currentQuestionIndex;
      if (currentQuestionIndex !== undefined) {
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
      }
    }
  }, [game?.currentQuestionIndex]); // Only depend on question index changing

  // Calculate time left from server-side timer
  const timeLeft = game?.timeLeft || 0;

  async function submitAnswer() {
    if (selectedAnswer === null || !game || !user || answerSubmitted || !quiz)
      return;

    try {
      await firestoreService.submitAnswer(game.id, game.currentQuestionIndex, {
        playerId: user.uid,
        questionIndex: game.currentQuestionIndex,
        selectedOption: selectedAnswer,
        answeredAt: new Date(),
        isCorrect:
          selectedAnswer ===
          quiz.questions[game.currentQuestionIndex].correctAnswer,
      });
      setAnswerSubmitted(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  }

  if (loading || gameLoading) {
    return (
      <div className="game-center-container">
        <Spinner />
      </div>
    );
  }

  if (!game || !quiz) {
    // Auto-redirect to home if game doesn't exist
    useEffect(() => {
      const timer = setTimeout(() => {
        navigate("/");
      }, 2000); // Redirect after 2 seconds
      
      return () => clearTimeout(timer);
    }, [navigate]);

    return (
      <div className="game-center-container">
        <Card variant="default" padding="lg" className="text-center">
          <h2 className="game-error-title">Game not found</h2>
          <p className="game-error-message">Redirecting you to home...</p>
          <button onClick={() => navigate("/")} className="game-error-button">
            Go to Home Now
          </button>
        </Card>
      </div>
    );
  }

  if (!currentPlayer) {
    // Auto-redirect to home if user is not in the game
    useEffect(() => {
      const timer = setTimeout(() => {
        navigate("/");
      }, 2000); // Redirect after 2 seconds
      
      return () => clearTimeout(timer);
    }, [navigate]);

    return (
      <div className="game-center-container">
        <Card variant="default" padding="lg" className="text-center">
          <h2 className="game-error-title">Not in game</h2>
          <p className="game-error-message">You're not part of this game. Redirecting to home...</p>
          <button onClick={() => navigate("/")} className="game-error-button">
            Go to Home Now
          </button>
        </Card>
      </div>
    );
  }

  // Lobby Phase
  if (game.phase === "lobby") {
    return (
      <div className="game-lobby-container">
        <Card variant="default" padding="lg" className="lobby-card">
          <h1 className="lobby-title">Game Lobby</h1>

          {/* Player's name prominently displayed */}
          {currentPlayer && (
            <div className="lobby-welcome">
              <div className="lobby-welcome-name">
                Welcome, {currentPlayer.name}!
              </div>
              <div className="lobby-welcome-message">
                You're in the game and ready to play!
              </div>
            </div>
          )}

          <div className="lobby-info">
            <p className="lobby-code">
              Game Code:{" "}
              <span className="lobby-code-value">{game.joinCode}</span>
            </p>
            <p className="lobby-players">
              Players Joined:{" "}
              <span className="lobby-players-count">{players.length}</span>
            </p>
          </div>

          {/* Waiting message */}
          <div className="lobby-waiting">
            <p className="lobby-waiting-text">
              Waiting for admin to start the game...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Question Phase
  if (game.phase === "questionLive") {
    // Add null checks for quiz and question
    if (
      !quiz ||
      !quiz.questions ||
      game.currentQuestionIndex === undefined ||
      game.currentQuestionIndex >= quiz.questions.length
    ) {
      return (
        <div className="game-center-container">
          <Card variant="default" padding="lg" className="text-center">
            <h2 className="game-loading-text">Loading question...</h2>
          </Card>
        </div>
      );
    }

    const question = quiz.questions[game.currentQuestionIndex];

    return (
      <div className="game-question-container">
        <div className="game-question-wrapper">
          <div className="game-question-header">
            <h1 className="game-question-number">
              Question {game.currentQuestionIndex + 1}
            </h1>
            <div className="game-timer">Time: {timeLeft}s</div>
          </div>

          <QuestionText text={question.text} />

          <div className="game-options-grid">
            {question.options.map((option, index) => (
              <OptionButton
                key={index}
                index={index}
                text={option}
                selected={selectedAnswer === index}
                onClick={() => !answerSubmitted && setSelectedAnswer(index)}
                disabled={answerSubmitted}
              />
            ))}
          </div>

          {selectedAnswer !== null && !answerSubmitted && (
            <div className="game-submit-section">
              <Button onClick={submitAnswer} className="w-full max-w-xs">
                Submit Answer
              </Button>
            </div>
          )}

          {answerSubmitted && (
            <div className="game-submitted-section">
              <p className="game-submitted-text">Answer submitted!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results Phase
  if (game.phase === "results") {
    // Add null checks for quiz and question
    if (
      !quiz ||
      !quiz.questions ||
      game.currentQuestionIndex === undefined ||
      game.currentQuestionIndex >= quiz.questions.length
    ) {
      return (
        <div className="game-center-container">
          <Card variant="default" padding="lg" className="text-center">
            <h2 className="game-loading-text">Loading results...</h2>
          </Card>
        </div>
      );
    }

    const question = quiz.questions[game.currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;
    const didAnswer = selectedAnswer !== null;

    return (
      <div className="game-results-container">
        <div className="game-results-wrapper">
          {/* Result Feedback Banner */}
          <div
            className={`game-result-banner ${
              !didAnswer
                ? "game-result-no-answer"
                : isCorrect
                ? "game-result-correct"
                : "game-result-wrong"
            }`}
          >
            <div
              className={`game-result-status ${
                !didAnswer
                  ? "game-result-status-no-answer"
                  : isCorrect
                  ? "game-result-status-correct"
                  : "game-result-status-wrong"
              }`}
            >
              {!didAnswer ? "Time's Up!" : isCorrect ? "Correct!" : "Wrong"}
            </div>
            <p
              className={`game-result-message ${
                !didAnswer
                  ? "game-result-message-no-answer"
                  : isCorrect
                  ? "game-result-message-correct"
                  : "game-result-message-wrong"
              }`}
            >
              {!didAnswer
                ? "You didn't answer in time"
                : isCorrect
                ? "Great job! You got it right!"
                : "Better luck next time!"}
            </p>
          </div>

          {/* Question Card with Answer */}
          <Card variant="default" padding="lg" className="game-results-card">
            <div className="game-results-question-meta">
              Question {game.currentQuestionIndex + 1} of{" "}
              {quiz.questions.length}
            </div>
            <h2 className="game-results-question-text">{question.text}</h2>

            {/* Correct Answer Display */}
            <div className="game-correct-answer">
              <div className="game-answer-label-correct">Correct Answer</div>
              <div className="game-answer-value-correct">
                {question.options[question.correctAnswer]}
              </div>
            </div>

            {/* Show user's answer if they answered wrong */}
            {didAnswer && !isCorrect && (
              <div className="game-user-answer">
                <div className="game-answer-label-wrong">Your Answer</div>
                <div className="game-answer-value-wrong">
                  {question.options[selectedAnswer]}
                </div>
              </div>
            )}
          </Card>

          {/* Show leaderboard */}
          <Leaderboard entries={leaderboard} currentPlayerId={user?.uid} />

          <div className="game-results-waiting">
            <p className="game-results-waiting-text">
              Waiting for next question...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Phase
  if (game.phase === "ended") {
    // Find current user's rank and score from leaderboard
    const userEntry = leaderboard.find((entry) => entry.playerId === user?.uid);
    const userRank = userEntry?.rank || 0;
    const userScore = userEntry?.score || 0;

    // Handle edge cases for rank display
    const getRankDisplay = (rank: number) => {
      if (rank === 0) return "Not ranked";
      if (rank === 1) return "1st";
      if (rank === 2) return "2nd";
      if (rank === 3) return "3rd";
      return `#${rank}`;
    };

    // Handle edge cases for message
    const getResultMessage = (
      rank: number,
      score: number,
      playerName: string
    ) => {
      if (rank === 0 && score === 0) {
        return `${playerName}, you didn't score any points this round.`;
      }
      if (rank === 0) {
        return `${playerName}, thanks for playing!`;
      }
      if (score === 0) {
        return `${playerName}, you finished ${getRankDisplay(
          rank
        )} with no points. Better luck next time!`;
      }
      return `${playerName}, you finished ${getRankDisplay(
        rank
      )} place with ${score} points!`;
    };

    return (
      <div className="game-over-container">
        <div className="game-over-wrapper">
          <h1 className="game-over-title">Game Over!</h1>

          {/* User's Results Card */}
          <Card variant="default" padding="lg" className="game-over-card">
            <h2 className="game-over-results-title">Your Results</h2>
            <div className="game-over-results-flex">
              <div className="game-over-stat">
                <div className="game-over-stat-value">
                  {userRank > 0 ? `#${userRank}` : "—"}
                </div>
                <div className="game-over-stat-label">Your Rank</div>
              </div>
              <div className="game-over-stat">
                <div className="game-over-stat-value">{userScore}</div>
                <div className="game-over-stat-label">Your Points</div>
              </div>
            </div>
            <div className="game-over-message">
              {getResultMessage(
                userRank,
                userScore,
                currentPlayer?.name || "Player"
              )}
            </div>
          </Card>

          {/* Full Leaderboard - only show if there are entries */}
          {leaderboard.length > 0 && (
            <div className="game-over-leaderboard-section">
              <h2 className="game-over-leaderboard-title">Final Leaderboard</h2>
              <Leaderboard entries={leaderboard} showLiveIndicator={false} />
            </div>
          )}

          {/* Show message if no leaderboard data */}
          {leaderboard.length === 0 && (
            <div className="game-over-no-data">
              <p className="game-over-no-data-text">
                No leaderboard data available
              </p>
            </div>
          )}

          <div className="game-over-action">
            <Button onClick={() => navigate("/")} className="w-full max-w-xs">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-center-container">
      <Card variant="default" padding="lg" className="text-center">
        <h2 className="game-error-title">Unknown game phase</h2>
        <button onClick={() => navigate("/")} className="game-error-button">
          Back to Home
        </button>
      </Card>
    </div>
  );
}
