export const validateInput = (value, name) => {
  let errors = [];

  // Check for empty value first
  if (!value || value.trim() === '') {
    errors.push('This field is required');
    return errors;
  }

  if (name === 'email') {
    // Email regex pattern
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    // Test the email pattern
    if (!emailPattern.test(value)) {
      errors.push('Please enter a valid email address');
    }
  }

  if (name === 'password' || name === 'confirmPassword') {
    if (value.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
  }

  return errors;
};
