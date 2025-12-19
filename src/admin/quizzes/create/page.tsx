"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { firestoreService } from "../../../lib/firestore";
import { Button, Card, Input } from "../../../components/ui";

const OPTION_COLORS = [
  "option-red",
  "option-blue",
  "option-yellow",
  "option-green",
];
const OPTION_LABELS = ["A", "B", "C", "D"];

interface QuestionData {
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export default function CreateQuizPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>([
    { text: "", options: ["", "", "", ""], correctAnswer: 0, timeLimit: 30 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], correctAnswer: 0, timeLimit: 30 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (
    qIndex: number,
    field: keyof QuestionData,
    value: any
  ) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a quiz title");
      return;
    }
    if (questions.some((q) => !q.text.trim())) {
      setError("Please complete all questions");
      return;
    }
    if (questions.some((q) => q.options.some((opt) => !opt.trim()))) {
      setError("Please complete all options");
      return;
    }
    if (!user) {
      setError("You must be logged in");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const quizId = await firestoreService.createQuiz({
        title: title.trim(),
        description: description.trim(),
        questions: questions.map((q, i) => ({
          id: `q${i}`,
          text: q.text.trim(),
          options: q.options.map((opt) => opt.trim()),
          correctAnswer: q.correctAnswer,
          timeLimit: q.timeLimit,
        })),
        createdBy: user.uid,
      });
      navigate(`/admin/quizzes/${quizId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-quiz-container">
      <div className="w-full">
        <h1 className="create-quiz-title">Create Quiz</h1>

        <form onSubmit={handleSubmit} className="create-quiz-form">
          <div className="create-quiz-inputs">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz Title"
              className="create-input-field"
              required
            />
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="create-input-field"
            />
          </div>

          {questions.map((question, qIndex) => (
            <Card
              key={qIndex}
              className="shadow-sm mt-6"
              variant="default"
              padding="md"
            >
              <div className="create-question-header">
                <span className="create-question-label">
                  Question {qIndex + 1}
                </span>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="create-question-content">
                <Input
                  type="text"
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, "text", e.target.value)
                  }
                  placeholder="Enter question..."
                  className="create-question-input"
                  required
                />

                <div className="create-options-list">
                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      onClick={() =>
                        updateQuestion(qIndex, "correctAnswer", oIndex)
                      }
                      className={`create-option-item ${
                        question.correctAnswer === oIndex
                          ? "create-option-selected"
                          : ""
                      }`}
                    >
                      <div
                        className={`create-option-label ${OPTION_COLORS[oIndex]}`}
                      >
                        <span className="create-option-text">
                          {OPTION_LABELS[oIndex]}
                        </span>
                      </div>
                      <Input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, e.target.value)
                        }
                        placeholder={`Option ${OPTION_LABELS[oIndex]}`}
                        className="create-option-input"
                        required
                      />
                      {question.correctAnswer === oIndex && (
                        <span className="create-correct-badge">Correct</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="create-time-control">
                  <span className="create-time-label">Time:</span>
                  <Input
                    type="number"
                    value={question.timeLimit}
                    onChange={(e) =>
                      updateQuestion(
                        qIndex,
                        "timeLimit",
                        parseInt(e.target.value) || 30
                      )
                    }
                    min="5"
                    max="120"
                    className="create-time-input"
                  />
                  <span className="create-time-label">sec</span>
                </div>
              </div>
            </Card>
          ))}

          <div className="create-add-button-container">
            <Button
              type="button"
              onClick={addQuestion}
              className="create-add-button"
              variant="ghost"
            >
              + Add Question
            </Button>
          </div>

          {error && <p className="create-error">{error}</p>}

          <div className="create-button-group">
            <Link to="/admin/quizzes" className="create-cancel-button">
              <Button type="button" className="create-cancel-button-inner">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="create-submit-button"
              variant="primary"
            >
              {loading ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
