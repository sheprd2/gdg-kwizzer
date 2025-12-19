"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { firestoreService } from "../../lib/firestore";
import { Button, Card, Spinner } from "../../components/ui";
import type { Quiz } from "../../types/firebase";

export default function QuizzesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const userQuizzes = await firestoreService.getQuizzesByCreator(
          user!.uid
        );
        setQuizzes(userQuizzes);
      } catch (error) {
        console.error("Error loading quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [navigate, user]);

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await firestoreService.deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz");
    }
  };

  if (loading) {
    return (
      <div className="quizzes-loading-container">
        <Spinner size="lg" />
        <p className="quizzes-loading-text">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="quizzes-container">
      <div className="w-full">
        {/* Header */}
        <div className="quizzes-header">
          <div>
            <h1 className="quizzes-title">My Quizzes</h1>
            <p className="quizzes-subtitle">Manage and host your quiz games</p>
          </div>
          <div className="quizzes-button-group">
            <Link to="/">
              <Button size="sm">← Back</Button>
            </Link>
            <Link to="/admin/quizzes/create">
              <Button size="sm">+ Create Quiz</Button>
            </Link>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <Card variant="bordered" padding="lg" className="quizzes-empty-card">
            <div className="quizzes-empty-content">
              <h2 className="quizzes-empty-title">No quizzes yet</h2>
              <p className="quizzes-empty-text">
                Create your first quiz to get started with hosting games.
              </p>
              <Link to="/admin/quizzes/create">
                <Button>Create Your First Quiz</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} variant="default" padding="lg">
                <div className="quiz-card-content">
                  <div className="quiz-card-info">
                    <h3 className="quiz-card-title">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="quiz-card-description">
                        {quiz.description}
                      </p>
                    )}
                    <div className="quiz-card-meta">
                      <span>{quiz.questions.length} questions</span>
                      <span>
                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="quiz-card-actions">
                    <Link to={`/admin/quizzes/${quiz.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Link to={`/admin/host?quiz=${quiz.id}`}>
                      <Button size="sm">Host</Button>
                    </Link>
                    <Button
                      size="sm"
                      className="quiz-card-delete-button"
                      onClick={() => {
                        if (
                          confirm("Are you sure you want to delete this quiz?")
                        ) {
                          firestoreService
                            .deleteQuiz(quiz.id)
                            .then(() => {
                              setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
                            })
                            .catch((err: Error) => {
                              alert("Failed to delete quiz: " + err.message);
                            });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
