import React, { useState } from 'react';
import Button from '../ui/Button';

interface PriceRangeSelectorProps {
  ranges: string[];
  onRangesSelected: (selectedRanges: string[]) => void;
}

const PriceRangeSelector: React.FC<PriceRangeSelectorProps> = ({ ranges, onRangesSelected }) => {
  const [selectedRanges, setSelectedRanges] = useState<string[]>([]);
  const [selectedStakeRange, setSelectedStakeRange] = useState<string | null>(null);

  const toggleRange = (range: string) => {
    if (selectedRanges.includes(range)) {
      setSelectedRanges(selectedRanges.filter(r => r !== range));
      if (selectedStakeRange === range) {
        setSelectedStakeRange(null);
      }
    } else {
      setSelectedRanges([...selectedRanges, range]);
    }
  };

  const handleStakeRangeSelect = (range: string) => {
    setSelectedStakeRange(range);
  };

  const handleSubmit = () => {
    if (selectedRanges.length > 0 && selectedStakeRange) {
      onRangesSelected(selectedRanges);
    }
  };

  // Split ranges into below and above current price
  const belowRanges = ranges.slice(0, 3);
  const aboveRanges = ranges.slice(3, 6);

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 my-4">
      <h3 className="text-lg font-medium text-white mb-3">Select Price Ranges</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Below current price:</h4>
          <div className="grid grid-cols-1 gap-2">
            {belowRanges.map((range, index) => (
              <div key={index} className="flex items-center">
                <Button
                  variant={selectedRanges.includes(range) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRange(range)}
                  className="flex-grow text-left justify-start"
                >
                  {index + 1}. {range}
                </Button>
                {selectedRanges.includes(range) && (
                  <Button
                    variant={selectedStakeRange === range ? "success" : "outline"}
                    size="sm"
                    onClick={() => handleStakeRangeSelect(range)}
                    className="ml-2 px-2"
                  >
                    Stake
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Above current price:</h4>
          <div className="grid grid-cols-1 gap-2">
            {aboveRanges.map((range, index) => (
              <div key={index} className="flex items-center">
                <Button
                  variant={selectedRanges.includes(range) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRange(range)}
                  className="flex-grow text-left justify-start"
                >
                  {index + 4}. {range}
                </Button>
                {selectedRanges.includes(range) && (
                  <Button
                    variant={selectedStakeRange === range ? "success" : "outline"}
                    size="sm"
                    onClick={() => handleStakeRangeSelect(range)}
                    className="ml-2 px-2"
                  >
                    Stake
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between">
        <div className="text-sm text-slate-400">
          {selectedRanges.length === 0 ? (
            "Select at least one price range"
          ) : selectedStakeRange === null ? (
            "Select which range to stake on"
          ) : (
            `You'll stake on: ${selectedStakeRange}`
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={selectedRanges.length === 0 || !selectedStakeRange}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};

export default PriceRangeSelector;
