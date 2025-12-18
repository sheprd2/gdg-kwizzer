"use client";

interface QuestionTextProps {
  text: string;
  timeLimit?: number;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionText({
  text,
  timeLimit,
  questionNumber,
  totalQuestions,
}: QuestionTextProps) {
  return (
    <div className="question-container">
      <div className="question-header">
        {questionNumber !== undefined && totalQuestions !== undefined && (
          <span className="question-badge">
            {questionNumber} / {totalQuestions}
          </span>
        )}

        {timeLimit !== undefined && (
          <div className="question-timer">
            <div className="timer-dot"></div>
            <span className="timer-text">{timeLimit}s</span>
          </div>
        )}
      </div>

      <div className="question-box">
        <h2 className="question-title">{text}</h2>
      </div>
    </div>
  );
}
