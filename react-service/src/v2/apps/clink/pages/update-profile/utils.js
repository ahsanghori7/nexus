// Utility functions for update profile validation

export const validatePassword = (password, passValStrings = {}) => {
  const defaultStrings = {
    lowercase: 'Password must contain at least one lowercase letter',
    uppercase: 'Password must contain at least one uppercase letter',
    number: 'Password must contain at least one number',
    specialChar: 'Password must contain at least one special character',
    minLength: 'Password must be at least 8 characters long',
  };

  const strings = { ...defaultStrings, ...passValStrings };

  const updatedRules = [
    { valid: /[a-z]/.test(password), message: strings.lowercase },
    { valid: /[A-Z]/.test(password), message: strings.uppercase },
    { valid: /\d/.test(password), message: strings.number },
    { valid: /[!@#$%^&*(),.?":{}|<>]/.test(password), message: strings.specialChar },
    { valid: password.length >= 8, message: strings.minLength },
  ];

  return updatedRules;
};

export const validateField = (name, value, t = (key) => key) => {
  const requiredFieldKeys = [
    'user[firstname]',
    'user[lastname]',
    'user[email]',
    'account[name]',
    'account[email]',
  ];

  if (requiredFieldKeys.includes(name) && !value.trim()) {
    return t('required-field');
  }

  const emailFields = ['user[email]', 'account[email]'];
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (emailFields.includes(name) && value.trim() && !emailRegex.test(value)) {
    return t('invalid-email');
  }

  return '';
};

export const parseFormFieldName = (name, value, prevData) => {
  if (name.startsWith('user[')) {
    const key = name.slice(5, -1);
    return {
      ...prevData,
      user: {
        ...prevData.user,
        [key]: value,
      },
    };
  }

  if (name.startsWith('account[')) {
    const key = name.slice(8, -1);
    return {
      ...prevData,
      account: {
        ...prevData.account,
        [key]: value,
      },
    };
  }

  return {
    ...prevData,
    [name]: value,
  };
};

export const checkPasswordsMatch = (password, confirmPassword) => {
  return password === confirmPassword && password.length > 0;
};

export const getAllPasswordValidationsPassed = (passwordRules) => {
  return passwordRules.every(rule => rule.valid);
};

export const getRequiredFieldKeys = () => {
  return [
    'user[firstname]',
    'user[lastname]',
    'user[email]',
    'account[name]',
    'account[email]',
  ];
};

export const getEmailFields = () => {
  return ['user[email]', 'account[email]'];
};

export const isEmailField = (fieldName) => {
  return getEmailFields().includes(fieldName);
};

export const isRequiredField = (fieldName) => {
  return getRequiredFieldKeys().includes(fieldName);
};
