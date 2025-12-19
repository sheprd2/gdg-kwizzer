"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { firestoreService } from "../../../lib/firestore";
import { Quiz, Question } from "../../../types/firebase";
import { Button, Card, Spinner, EditableText } from "../../../components/ui";

export default function QuizDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get quizId from URL params
  const quizId = params.quizId as string;

  useEffect(() => {

    async function loadQuiz() {
      if (!quizId) {
        setError("Quiz ID not found");
        setLoading(false);
        return;
      }

      try {
        const quizData = await firestoreService.getQuiz(quizId);
        setQuiz(quizData);
      } catch (err: any) {
        setError(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId, navigate]);

  const handleUpdateQuiz = async (field: keyof Quiz, value: any) => {
    if (!quiz) return;
    try {
      await firestoreService.updateQuiz(quiz.id, { [field]: value });
      setQuiz({ ...quiz, [field]: value });
    } catch (err) {
      console.error("Failed to update quiz:", err);
      alert("Failed to update quiz. Please try again.");
    }
  };

  const handleUpdateQuestion = async (
    questionIndex: number,
    updates: Partial<Question>
  ) => {
    if (!quiz) return;

    const updatedQuestions = [...quiz.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
    };

    try {
      await firestoreService.updateQuiz(quiz.id, {
        questions: updatedQuestions,
      });
      setQuiz({ ...quiz, questions: updatedQuestions });
    } catch (err) {
      console.error("Failed to update question:", err);
      alert("Failed to update question. Please try again.");
    }
  };

  const handleUpdateOption = async (
    questionIndex: number,
    optionIndex: number,
    newValue: string
  ) => {
    if (!quiz) return;

    const updatedQuestions = [...quiz.questions];
    const updatedOptions = [...updatedQuestions[questionIndex].options];
    updatedOptions[optionIndex] = newValue;

    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedOptions,
    };

    try {
      await firestoreService.updateQuiz(quiz.id, {
        questions: updatedQuestions,
      });
      setQuiz({ ...quiz, questions: updatedQuestions });
    } catch (err) {
      console.error("Failed to update option:", err);
      alert("Failed to update option. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="quiz-detail-loading">
        <Spinner size="lg" />
        <p className="quiz-detail-loading-text">Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-detail-loading">
        <Card variant="default" padding="lg" className="quiz-detail-error-card">
          <h2 className="quiz-detail-error-title">Error</h2>
          <p className="quiz-detail-error-text">{error || "Quiz not found"}</p>
          <Link to="/admin/quizzes">
            <Button>Back to Quizzes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="quiz-detail-container">
      <div className="w-full">
        {/* Header */}
        <div className="quiz-detail-header">
          <div className="quiz-detail-title-section">
            <EditableText
              value={quiz.title}
              onSave={(val) => handleUpdateQuiz("title", val)}
              className="quiz-detail-title-wrapper"
              textClassName="quiz-detail-title"
              label="Quiz Title"
            />
            <EditableText
              value={quiz.description || ""}
              onSave={(val) => handleUpdateQuiz("description", val)}
              className="quiz-detail-description"
              multiline
              label="Description"
              placeholder="Add a description..."
            />
          </div>
          <div className="quiz-detail-button-group">
            <Link to="/admin/quizzes">
              <Button size="sm">← Back</Button>
            </Link>
            <Link to={`/admin/host?quiz=${quiz.id}`}>
              <Button size="sm">Host Quiz</Button>
            </Link>
            <Button
              size="sm"
              className="quiz-detail-delete-button"
              onClick={() => {
                if (confirm("Are you sure you want to delete this quiz?")) {
                  firestoreService
                    .deleteQuiz(quiz.id)
                    .then(() => {
                      navigate("/admin/quizzes");
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

        {/* Questions */}
        <div className="quiz-detail-questions-grid">
          {/* Questions Preview */}
          <Card variant="default" padding="lg">
            <h2 className="quiz-detail-questions-title">
              Questions ({quiz.questions.length})
            </h2>
            <div className="quiz-detail-questions-list">
              {quiz.questions.map((question, qIndex) => (
                <div
                  key={question.id || qIndex}
                  className="quiz-detail-question-item"
                >
                  <div className="quiz-detail-question-content">
                    <h3 className="quiz-detail-question-number">
                      Question {qIndex + 1}
                    </h3>
                    <EditableText
                      value={question.text}
                      onSave={(val) =>
                        handleUpdateQuestion(qIndex, { text: val })
                      }
                      textClassName="quiz-detail-question-text"
                      multiline
                    />
                  </div>

                  <div className="quiz-detail-options-list">
                    {question.options.map((option, oIndex) => {
                      const OPTION_COLORS = [
                        "option-red",
                        "option-green",
                        "option-blue",
                        "option-yellow",
                      ];
                      const OPTION_LABELS = ["Red", "Green", "Blue", "Yellow"];
                      const color = OPTION_COLORS[oIndex] || OPTION_COLORS[0];
                      const label = OPTION_LABELS[oIndex] || OPTION_LABELS[0];
                      const isCorrect = oIndex === question.correctAnswer;

                      return (
                        <div key={oIndex} className="quiz-detail-option-item">
                          <div
                            className={`quiz-detail-option-checkbox ${
                              isCorrect ? "quiz-detail-option-correct" : ""
                            }`}
                            onClick={() =>
                              handleUpdateQuestion(qIndex, {
                                correctAnswer: oIndex,
                              })
                            }
                            title={`Click to set ${label} as correct answer`}
                          >
                            {isCorrect && (
                              <svg
                                className="quiz-detail-checkmark"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div
                            className={`quiz-detail-option-color ${color}`}
                          />
                          <div className="quiz-detail-option-input-wrapper">
                            <EditableText
                              value={option}
                              onSave={(val) =>
                                handleUpdateOption(qIndex, oIndex, val)
                              }
                              label={label}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="quiz-detail-time-control">
                    <span>Time Limit:</span>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={question.timeLimit || 30}
                      onChange={(e) => {
                        const limit = parseInt(e.target.value);
                        if (!isNaN(limit) && limit > 0) {
                          handleUpdateQuestion(qIndex, { timeLimit: limit });
                        }
                      }}
                      className="quiz-detail-time-input"
                    />
                    <span>seconds</span>
                  </div>
                  {/* Divider */}
                  {qIndex < quiz.questions.length - 1 && (
                    <div className="quiz-detail-divider" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
