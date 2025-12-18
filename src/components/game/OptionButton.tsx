"use client";

import { Check, X } from "lucide-react";

interface OptionButtonProps {
  index: number;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  className?: string;
}

const OPTION_COLORS = [
  "option-red",
  "option-blue",
  "option-yellow",
  "option-green",
];
const OPTION_SHAPES = ["◆", "●", "▲", "■"];

export function OptionButton({
  index,
  text,
  onClick,
  disabled = false,
  selected = false,
  showResult = false,
  isCorrect = false,
  className = "",
}: OptionButtonProps) {
  const color = OPTION_COLORS[index % 4];
  const shape = OPTION_SHAPES[index % 4];

  let stateClass = "";
  if (showResult) {
    if (isCorrect) {
      stateClass = "option-correct";
    } else if (selected) {
      stateClass = "option-wrong";
    } else {
      stateClass = "option-disabled-result";
    }
  } else if (selected) {
    stateClass = "option-selected";
  } else if (disabled) {
    stateClass = "option-disabled";
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`option-button ${color} ${stateClass} ${className}`}
    >
      {/* Shape Icon */}
      <div className="option-shape">{shape}</div>

      {/* Option Text */}
      <span className="option-text">{text}</span>

      {/* Result Indicator Icon */}
      {showResult && (
        <div className="option-result-icon">
          {isCorrect ? (
            <div className="option-check-icon">
              <Check className="w-6 h-6 text-white" />
            </div>
          ) : selected ? (
            <div className="option-x-icon">
              <X className="w-6 h-6 text-black" />
            </div>
          ) : null}
        </div>
      )}
    </button>
  );
}
