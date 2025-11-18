import React, { useState, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CommentInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = 'Add a comment...',
  autoFocus = false
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSubmit(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative rounded-lg p-3 lg:p-4 overflow-hidden border border-yellow-500/20 w-full">
      {/* Burgundy gradient background - matching hero section */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
      </div>
      <div className="relative z-10">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-2 lg:mb-3 w-full"
          disabled={disabled}
          // Only set autoFocus if explicitly requested
          autoFocus={autoFocus}
        />
        <div className="flex justify-end">
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
