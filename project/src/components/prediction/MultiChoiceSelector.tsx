import React from 'react';
import Button from '../ui/Button';

interface MultiChoiceSelectorProps {
  choices: Array<{
    id: string;
    label: string;
    price: number;
    percentage: number;
  }>;
  selectedChoice: string | null;
  onSelectChoice: (choiceId: string) => void;
  disabledChoices?: string[];
  isAgentPrediction?: boolean;
}

const MultiChoiceSelector: React.FC<MultiChoiceSelectorProps> = ({
  choices,
  selectedChoice,
  onSelectChoice,
  disabledChoices = [],
  isAgentPrediction = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-300">Select a price range:</span>
        {selectedChoice && (
          <span className="text-xs text-green-400">
            Selected: {choices.find(c => c.id === selectedChoice)?.label || selectedChoice}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {choices && choices.length > 0 ? (
          choices.map((choice) => {
            // Ensure choice has all required properties
            const safeChoice = {
              id: choice.id || 'unknown',
              label: choice.label || choice.id || 'Unknown',
              percentage: typeof choice.percentage === 'number' ? choice.percentage : 0
            };

            return (
              <Button
                key={safeChoice.id}
                variant={selectedChoice === safeChoice.id ? "default" : "outline"}
                onClick={() => onSelectChoice(safeChoice.id)}
                className="flex items-center justify-between w-full"
                disabled={disabledChoices.includes(safeChoice.id)}
              >
                <span>
                  {safeChoice.label}
                  {isAgentPrediction && disabledChoices.includes(safeChoice.id) && disabledChoices.length === choices.length && ' ✓'}
                </span>
                <span className="text-sm opacity-80">{safeChoice.percentage.toFixed(1)}%</span>
              </Button>
            );
          })
        ) : (
          <div className="text-center py-4 text-slate-400">
            No choices available for this prediction
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 mt-1">
        Select the price range you believe will be correct when the prediction ends
      </div>
    </div>
  );
};

export default MultiChoiceSelector;
