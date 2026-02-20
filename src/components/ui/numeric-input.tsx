import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value?: number | string;
  onChange?: (value: string, numericValue: number | null) => void;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  formatOnBlur?: boolean;
}

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(({
  value = '',
  onChange,
  allowDecimals = true,
  decimalPlaces = 2,
  min,
  max,
  formatOnBlur = true,
  className,
  onBlur,
  onFocus,
  placeholder = "0",
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Inicializar valor de display
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        setDisplayValue(isFocused ? numValue.toString() : formatDisplayValue(numValue));
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value, isFocused]);

  const formatDisplayValue = (num: number): string => {
    if (!formatOnBlur) return num.toString();
    
    if (allowDecimals) {
      return num.toFixed(decimalPlaces).replace('.', ',');
    }
    return Math.round(num).toString();
  };

  const parseInputValue = (inputValue: string): number | null => {
    if (!inputValue.trim()) return null;
    
    // Reemplazar comas por puntos para el parsing
    const normalizedValue = inputValue.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    
    if (isNaN(parsed)) return null;
    
    // Aplicar límites
    let result = parsed;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Permitir solo números, comas, puntos y signos negativos
    const allowedChars = allowDecimals ? /^-?[\d,\.]*$/ : /^-?[\d]*$/;
    
    if (!allowedChars.test(inputValue)) {
      return;
    }

    // No permitir múltiples separadores decimales
    if (allowDecimals) {
      const separators = (inputValue.match(/[,\.]/g) || []).length;
      if (separators > 1) return;
    }

    setDisplayValue(inputValue);
    
    const numericValue = parseInputValue(inputValue);
    onChange?.(inputValue, numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // Cuando se enfoca, mostrar el valor sin formatear
    if (displayValue && formatOnBlur) {
      const numValue = parseInputValue(displayValue);
      if (numValue !== null) {
        setDisplayValue(numValue.toString());
      }
    }
    
    // Seleccionar todo el texto si es el placeholder o valor inicial
    setTimeout(() => {
      if (e.target.value === '0' || e.target.value === placeholder) {
        e.target.select();
      }
    }, 0);
    
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Formatear el valor al perder el foco
    const numericValue = parseInputValue(displayValue);
    if (numericValue !== null && formatOnBlur) {
      const formattedValue = formatDisplayValue(numericValue);
      setDisplayValue(formattedValue);
      
      // Emitir el cambio con el valor formateado
      onChange?.(formattedValue, numericValue);
    } else if (!displayValue.trim()) {
      setDisplayValue('');
      onChange?.('', null);
    }
    
    onBlur?.(e);
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(className)}
      autoComplete="off"
      {...props}
    />
  );
});

NumericInput.displayName = 'NumericInput';

export { NumericInput };