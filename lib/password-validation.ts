/**
 * Password strength validation utilities.
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong';
  score: number; // 0-4
}

/**
 * Validate password strength with detailed feedback.
 * Requirements:
 *   - Minimum 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one number
 *   - (Optional bonus) At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
    if (password.length >= 12) score++; // Bonus for longer passwords
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score++;
  }

  // Special character (bonus, not required)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  }

  // Determine strength label
  let strength: 'weak' | 'fair' | 'strong';
  if (score <= 1) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'fair';
  } else {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 4),
  };
}

/**
 * Quick check: returns true if password meets minimum requirements.
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).valid;
}
