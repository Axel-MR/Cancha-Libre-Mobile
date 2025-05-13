import { useState } from 'react';
import { Alert } from 'react-native';

interface ValidationRules {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  match?: string;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean;
  errorMessage?: string;
}

export default function useFormValidation() {
  const validateField = (value: string, rules: ValidationRules, matchValue?: string): string | null => {
    if (rules.required && !value) {
      return rules.errorMessage || 'Este campo es requerido';
    }
    
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return rules.errorMessage || 'Ingresa un correo electrónico válido';
    }
    
    if (rules.minLength && value.length < rules.minLength) {
      return rules.errorMessage || `Debe tener al menos ${rules.minLength} caracteres`;
    }
    
    if (rules.match && value !== matchValue) {
      return rules.errorMessage || 'Los valores no coinciden';
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.errorMessage || 'Formato inválido';
    }
    
    if (rules.customValidator && !rules.customValidator(value)) {
      return rules.errorMessage || 'Valor inválido';
    }
    
    return null;
  };

  const validateForm = (
    formData: Record<string, string>, 
    validationRules: Record<string, ValidationRules>,
    matchFields?: Record<string, string>
  ): boolean => {
    let isValid = true;
    let errorMessages: string[] = [];
    
    for (const field in validationRules) {
      if (validationRules.hasOwnProperty(field)) {
        const matchValue = matchFields && matchFields[field] ? formData[matchFields[field]] : undefined;
        const error = validateField(formData[field], validationRules[field], matchValue);
        
        if (error) {
          isValid = false;
          errorMessages.push(error);
        }
      }
    }
    
    if (!isValid) {
      Alert.alert('Error', errorMessages.join('\n'));
    }
    
    return isValid;
  };

  return { validateForm };
}