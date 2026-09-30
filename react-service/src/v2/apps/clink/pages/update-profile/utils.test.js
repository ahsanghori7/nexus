import {
  validatePassword,
  validateField,
  parseFormFieldName,
  checkPasswordsMatch,
  getAllPasswordValidationsPassed,
  getRequiredFieldKeys,
  getEmailFields,
  isEmailField,
  isRequiredField
} from './utils';

describe('Update Profile Utils', () => {
  describe('validatePassword', () => {
    const passValStrings = {
      lowercase: 'lowercase test',
      uppercase: 'uppercase test',
      number: 'number test',
      specialChar: 'special test',
      minLength: 'length test',
    };

    test('validates password with all criteria met', () => {
      const result = validatePassword('MyPassword123!', passValStrings);
      expect(result).toHaveLength(5);
      expect(result.every(rule => rule.valid)).toBe(true);
    });

    test('validates password missing lowercase', () => {
      const result = validatePassword('MYPASSWORD123!', passValStrings);
      expect(result[0].valid).toBe(false);
      expect(result[0].message).toBe('lowercase test');
    });

    test('validates password missing uppercase', () => {
      const result = validatePassword('mypassword123!', passValStrings);
      expect(result[1].valid).toBe(false);
      expect(result[1].message).toBe('uppercase test');
    });

    test('validates password missing number', () => {
      const result = validatePassword('MyPassword!', passValStrings);
      expect(result[2].valid).toBe(false);
      expect(result[2].message).toBe('number test');
    });

    test('validates password missing special character', () => {
      const result = validatePassword('MyPassword123', passValStrings);
      expect(result[3].valid).toBe(false);
      expect(result[3].message).toBe('special test');
    });

    test('validates password too short', () => {
      const result = validatePassword('MyP1!', passValStrings);
      expect(result[4].valid).toBe(false);
      expect(result[4].message).toBe('length test');
    });

    test('validates empty password', () => {
      const result = validatePassword('', passValStrings);
      expect(result.every(rule => !rule.valid)).toBe(true);
    });

    test('validates password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
      
      specialChars.forEach(char => {
        const result = validatePassword(`MyPassword123${char}`, passValStrings);
        expect(result[3].valid).toBe(true);
      });
    });

    test('uses default strings when none provided', () => {
      const result = validatePassword('test');
      expect(result[0].message).toContain('lowercase');
      expect(result[1].message).toContain('uppercase');
      expect(result[2].message).toContain('number');
      expect(result[3].message).toContain('special');
      expect(result[4].message).toContain('8 characters');
    });
  });

  describe('validateField', () => {
    const mockT = (key) => {
      const translations = {
        'required-field': 'This field is required',
        'invalid-email': 'Please enter a valid email address'
      };
      return translations[key] || key;
    };

    test('validates required field with empty value', () => {
      const result = validateField('user[firstname]', '', mockT);
      expect(result).toBe('This field is required');
    });

    test('validates required field with whitespace only', () => {
      const result = validateField('user[lastname]', '   ', mockT);
      expect(result).toBe('This field is required');
    });

    test('validates required field with valid value', () => {
      const result = validateField('user[firstname]', 'John', mockT);
      expect(result).toBe('');
    });

    test('validates email field with invalid email', () => {
      const result = validateField('user[email]', 'invalid-email', mockT);
      expect(result).toBe('Please enter a valid email address');
    });

    test('validates email field with valid email', () => {
      const result = validateField('user[email]', 'test@example.com', mockT);
      expect(result).toBe('');
    });

    test('validates account email field', () => {
      const result = validateField('account[email]', 'company@example.com', mockT);
      expect(result).toBe('');
    });

    test('validates non-required field', () => {
      const result = validateField('user[job_title]', '', mockT);
      expect(result).toBe('');
    });

    test('validates empty email field (not required if empty)', () => {
      const result = validateField('user[email]', '', mockT);
      expect(result).toBe('This field is required');
    });

    test('validates various email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const result = validateField('user[email]', email, mockT);
        expect(result).toBe('');
      });
    });

    test('validates invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user@domain',
        'user name@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateField('user[email]', email, mockT);
        expect(result).toBe('Please enter a valid email address');
      });
    });
  });

  describe('parseFormFieldName', () => {
    const initialData = {
      user: {
        firstname: 'John',
        lastname: 'Doe'
      },
      account: {
        name: 'Company'
      },
      other: 'value'
    };

    test('parses user field name', () => {
      const result = parseFormFieldName('user[email]', 'test@example.com', initialData);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstname).toBe('John');
    });

    test('parses account field name', () => {
      const result = parseFormFieldName('account[email]', 'company@example.com', initialData);
      expect(result.account.email).toBe('company@example.com');
      expect(result.account.name).toBe('Company');
    });

    test('parses regular field name', () => {
      const result = parseFormFieldName('someField', 'someValue', initialData);
      expect(result.someField).toBe('someValue');
      expect(result.user).toEqual(initialData.user);
      expect(result.account).toEqual(initialData.account);
    });

    test('overwrites existing user field', () => {
      const result = parseFormFieldName('user[firstname]', 'Jane', initialData);
      expect(result.user.firstname).toBe('Jane');
      expect(result.user.lastname).toBe('Doe');
    });

    test('overwrites existing account field', () => {
      const result = parseFormFieldName('account[name]', 'New Company', initialData);
      expect(result.account.name).toBe('New Company');
    });
  });

  describe('checkPasswordsMatch', () => {
    test('returns true for matching non-empty passwords', () => {
      const result = checkPasswordsMatch('password123', 'password123');
      expect(result).toBe(true);
    });

    test('returns false for non-matching passwords', () => {
      const result = checkPasswordsMatch('password123', 'password456');
      expect(result).toBe(false);
    });

    test('returns false for empty passwords', () => {
      const result = checkPasswordsMatch('', '');
      expect(result).toBe(false);
    });

    test('returns false when one password is empty', () => {
      const result1 = checkPasswordsMatch('password123', '');
      const result2 = checkPasswordsMatch('', 'password123');
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('getAllPasswordValidationsPassed', () => {
    test('returns true when all validations pass', () => {
      const rules = [
        { valid: true, message: 'test1' },
        { valid: true, message: 'test2' },
        { valid: true, message: 'test3' }
      ];
      const result = getAllPasswordValidationsPassed(rules);
      expect(result).toBe(true);
    });

    test('returns false when any validation fails', () => {
      const rules = [
        { valid: true, message: 'test1' },
        { valid: false, message: 'test2' },
        { valid: true, message: 'test3' }
      ];
      const result = getAllPasswordValidationsPassed(rules);
      expect(result).toBe(false);
    });

    test('returns true for empty rules array', () => {
      const result = getAllPasswordValidationsPassed([]);
      expect(result).toBe(true);
    });
  });

  describe('getRequiredFieldKeys', () => {
    test('returns correct required field keys', () => {
      const result = getRequiredFieldKeys();
      expect(result).toEqual([
        'user[firstname]',
        'user[lastname]',
        'user[email]',
        'account[name]',
        'account[email]',
      ]);
    });

    test('returns array with correct length', () => {
      const result = getRequiredFieldKeys();
      expect(result).toHaveLength(5);
    });
  });

  describe('getEmailFields', () => {
    test('returns correct email field keys', () => {
      const result = getEmailFields();
      expect(result).toEqual(['user[email]', 'account[email]']);
    });

    test('returns array with correct length', () => {
      const result = getEmailFields();
      expect(result).toHaveLength(2);
    });
  });

  describe('isEmailField', () => {
    test('returns true for user email field', () => {
      const result = isEmailField('user[email]');
      expect(result).toBe(true);
    });

    test('returns true for account email field', () => {
      const result = isEmailField('account[email]');
      expect(result).toBe(true);
    });

    test('returns false for non-email field', () => {
      const result = isEmailField('user[firstname]');
      expect(result).toBe(false);
    });

    test('returns false for undefined field', () => {
      const result = isEmailField();
      expect(result).toBe(false);
    });
  });

  describe('isRequiredField', () => {
    test('returns true for required fields', () => {
      const requiredFields = [
        'user[firstname]',
        'user[lastname]',
        'user[email]',
        'account[name]',
        'account[email]'
      ];

      requiredFields.forEach(field => {
        expect(isRequiredField(field)).toBe(true);
      });
    });

    test('returns false for non-required fields', () => {
      const nonRequiredFields = [
        'user[job_title]',
        'user[contact_number]',
        'account[website]',
        'account[address]',
        'other[field]'
      ];

      nonRequiredFields.forEach(field => {
        expect(isRequiredField(field)).toBe(false);
      });
    });

    test('returns false for undefined field', () => {
      const result = isRequiredField();
      expect(result).toBe(false);
    });
  });
});