import { handleChange } from './validation';

// Mock the HELPERS from clink-components
jest.mock('clink-components', () => ({
  HELPERS: {
    PasswordValidation: {
      testPassword: jest.fn()
    }
  }
}));

const { HELPERS } = require('clink-components');

describe('validation', () => {
  let mockSetError;
  let mockSetPasswordErrors;
  let mockSetPassword;
  let mockEvent;

  beforeEach(() => {
    mockSetError = jest.fn();
    mockSetPasswordErrors = jest.fn();
    mockSetPassword = jest.fn();
    HELPERS.PasswordValidation.testPassword.mockReset();
  });

  describe('handleChange', () => {
    it('sets error when field is empty', () => {
      mockEvent = { target: { value: '' } };
      
      handleChange(mockEvent, mockSetError, 'Email');
      
      expect(mockSetError).toHaveBeenCalledWith('Email is required');
    });

    it('sets no error when field has value', () => {
      mockEvent = { target: { value: 'test@example.com' } };
      
      handleChange(mockEvent, mockSetError, 'Email');
      
      expect(mockSetError).toHaveBeenCalledWith(false);
    });

    it('validates password when password handlers are provided', () => {
      mockEvent = { target: { value: 'validPassword123!' } };
      HELPERS.PasswordValidation.testPassword.mockReturnValue([]);
      
      handleChange(
        mockEvent, 
        mockSetError, 
        'Password', 
        mockSetPasswordErrors, 
        mockSetPassword
      );
      
      expect(HELPERS.PasswordValidation.testPassword).toHaveBeenCalledWith('validPassword123!');
      expect(mockSetPasswordErrors).toHaveBeenCalledWith([]);
      expect(mockSetPassword).toHaveBeenCalledWith('validPassword123!');
      expect(mockSetError).toHaveBeenCalledWith(false);
    });

    it('sets password error when validation fails', () => {
      mockEvent = { target: { value: 'weak' } };
      const passwordErrors = ['Password too short', 'Password needs uppercase'];
      HELPERS.PasswordValidation.testPassword.mockReturnValue(passwordErrors);
      
      handleChange(
        mockEvent, 
        mockSetError, 
        'Password', 
        mockSetPasswordErrors, 
        mockSetPassword
      );
      
      expect(HELPERS.PasswordValidation.testPassword).toHaveBeenCalledWith('weak');
      expect(mockSetPasswordErrors).toHaveBeenCalledWith(passwordErrors);
      expect(mockSetPassword).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith('The password is not in the proper format');
    });

    it('does not call password handlers when they are not provided', () => {
      mockEvent = { target: { value: 'somePassword' } };
      
      handleChange(mockEvent, mockSetError, 'Password');
      
      expect(HELPERS.PasswordValidation.testPassword).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith(false);
    });

    it('handles empty array password errors', () => {
      mockEvent = { target: { value: 'validPassword123!' } };
      HELPERS.PasswordValidation.testPassword.mockReturnValue([]);
      
      handleChange(
        mockEvent, 
        mockSetError, 
        'Password', 
        mockSetPasswordErrors, 
        mockSetPassword
      );
      
      expect(mockSetPasswordErrors).toHaveBeenCalledWith([]);
      expect(mockSetPassword).toHaveBeenCalledWith('validPassword123!');
      expect(mockSetError).toHaveBeenCalledWith(false);
    });

    it('handles truthy but non-array password errors', () => {
      mockEvent = { target: { value: 'somePassword' } };
      HELPERS.PasswordValidation.testPassword.mockReturnValue('error string');
      
      handleChange(
        mockEvent, 
        mockSetError, 
        'Password', 
        mockSetPasswordErrors, 
        mockSetPassword
      );
      
      expect(mockSetPasswordErrors).toHaveBeenCalledWith('error string');
      expect(mockSetPassword).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith('The password is not in the proper format');
    });
  });
});