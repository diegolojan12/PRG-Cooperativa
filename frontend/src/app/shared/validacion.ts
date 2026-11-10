import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const celularPattern = /^09\d{8}$/;
export const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (value: string) => value.length >= 8 },
  { label: 'Una mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Un número', test: (value: string) => /\d/.test(value) },
];
export const toggle = (value: boolean) => !value;

/** Nombre y apellido: al menos 5 caracteres y 2 palabras. */
export const nombreCompleto: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  return value.length >= 5 && value.split(/\s+/).length >= 2 ? null : { nombreCompleto: true };
};

/** RNF-12: rechaza etiquetas HTML o código en campos de texto libre. */
export const sinCodigo: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  /<\s*\/?\s*[a-z!]/i.test(String(control.value ?? '')) ? { codigo: true } : null;

export const MENSAJE_SIN_CODIGO = 'No uses los símbolos < > ni código. Escribe solo texto.';
