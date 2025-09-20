"use client";
import React, { forwardRef, useImperativeHandle } from "react";
import { Input ,Label} from "@/components";
import { cn } from "@/lib/utils";

export interface OTPInputRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  allowPaste?: boolean;
}

const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  label = "Enter verification code",
  placeholder = "Or enter {length}-digit code here",
  className,
  inputClassName,
  autoFocus = false,
  allowPaste = true,
}, ref) => {
  const inputRefs = Array(length).fill(0).map(() => React.useRef<HTMLInputElement>(null));
  
  useImperativeHandle(ref, () => ({
    focus: () => {
      const firstEmptyIndex = value.length;
      const targetIndex = Math.min(firstEmptyIndex, length - 1);
      inputRefs[targetIndex]?.current?.focus();
    },
    clear: () => {
      onChange("");
      inputRefs[0]?.current?.focus();
    },
    getValue: () => value,
    setValue: (newValue: string) => {
      const cleanValue = newValue.replace(/\D/g, '').slice(0, length);
      onChange(cleanValue);
    }
  }));

  const handleInputChange = (index: number, inputValue: string) => {
    const numericValue = inputValue.replace(/\D/g, '');
    
    if (numericValue.length <= 1) {
      const newValue = value.split('');
      newValue[index] = numericValue;
      const updatedValue = newValue.join('').slice(0, length);
      
      onChange(updatedValue);

      // Auto-focus next input
      if (numericValue && index < length - 1) {
        inputRefs[index + 1]?.current?.focus();
      }
      
      // Call onComplete when all digits are filled
      if (updatedValue.length === length && onComplete) {
        onComplete(updatedValue);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = value.split('');
      
      if (value[index]) {
        // Clear current digit
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs[index - 1]?.current?.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs[index - 1]?.current?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs[index + 1]?.current?.focus();
    }
    
    // Handle delete key
    if (e.key === 'Delete') {
      e.preventDefault();
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));
    }
    
    // Handle home/end keys
    if (e.key === 'Home') {
      e.preventDefault();
      inputRefs[0]?.current?.focus();
    }
    
    if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = Math.min(value.length, length - 1);
      inputRefs[lastIndex]?.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!allowPaste) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numericData = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (numericData) {
      onChange(numericData);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(numericData.length, length - 1);
      inputRefs[nextIndex]?.current?.focus();
      
      // Call onComplete if pasted data fills all inputs
      if (numericData.length === length && onComplete) {
        onComplete(numericData);
      }
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focusing
    inputRefs[index]?.current?.select();
  };

  const handleSingleInputChange = (inputValue: string) => {
    const numericValue = inputValue.replace(/\D/g, '').slice(0, length);
    onChange(numericValue);
    
    if (numericValue.length === length && onComplete) {
      onComplete(numericValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-center block font-medium">
          {label}
        </Label>
      )}
      
      {/* Individual OTP inputs */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={inputRefs[index]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={cn(
              "w-12 h-12 text-center text-lg font-bold border-2 transition-all",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
              disabled ? "opacity-50 cursor-not-allowed" : "",
              inputClassName
            )}
            value={value[index] || ''}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>

      {/* Single input fallback */}
      <div className="mt-4">
        <Input
          type="text"
          inputMode="numeric"
          placeholder={placeholder.replace('{length}', length.toString())}
          value={value}
          onChange={(e) => handleSingleInputChange(e.target.value)}
          className={cn(
            "text-center text-lg tracking-widest transition-all",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
            disabled ? "opacity-50 cursor-not-allowed" : "",
            inputClassName
          )}
          maxLength={length}
          disabled={disabled}
          onPaste={handlePaste}
          aria-label={`${length}-digit verification code`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center mt-2" role="alert">
          {error}
        </p>
      )}
      
      {/* Helper text */}
      {!error && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Enter the {length}-digit code or paste it in either input field
        </p>
      )}
    </div>
  );
});

OTPInput.displayName = "OTPInput";

export default OTPInput;