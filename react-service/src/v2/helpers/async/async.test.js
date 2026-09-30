import { checkValid, messages1 } from './index';
import Relay from 'v2/services/relay';
import i18next from 'v2/helpers/i18n';

// Mock Relay service
jest.mock('v2/services/relay');

// Mock i18next
jest.mock('v2/helpers/i18n');

// Mock lodash debounce to execute immediately for testing
jest.mock('lodash/debounce', () => (fn) => {
  const debouncedFn = (...args) => fn(...args);
  debouncedFn.cancel = jest.fn();
  debouncedFn.flush = jest.fn();
  return debouncedFn;
});

// Mock lodash isEmpty
jest.mock('lodash/isEmpty', () => (value) => {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
});

describe("async helpers", () => {
  let setError;
  let setValue;
  let setOptions;
  let mockRelayInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setError = jest.fn();
    setValue = jest.fn();
    setOptions = jest.fn();
    
    // Mock Relay instance
    mockRelayInstance = {
      getJson: jest.fn()
    };
    Relay.mockImplementation(() => mockRelayInstance);
    
    // Mock i18next
    i18next.t.mockImplementation((key) => {
      const translations = {
        'profile-company-name': 'Company Name',
        'profile-company-email': 'Company Email',
        'email': 'Email'
      };
      return translations[key] || key;
    });
  });

  describe("messages1 export", () => {
    test("should export correct error messages", () => {
      expect(messages1).toEqual({
        company_name: 'The company name already exists',
        company_email: 'The company email already exists',
        email: 'The email already exists',
      });
    });
  });

  describe("checkValid function", () => {
    test("should set required error for empty value", async () => {
      await checkValid("", "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Email required");
      expect(setValue).not.toHaveBeenCalled();
      expect(mockRelayInstance.getJson).not.toHaveBeenCalled();
    });

    test("should set required error for null value", async () => {
      await checkValid(null, "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Email required");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should set required error for undefined value", async () => {
      await checkValid(undefined, "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Email required");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should validate email pattern and reject invalid email", async () => {
      const emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
      
      await checkValid("invalid-email", "email", setError, setValue, null, emailPattern);
      
      expect(setError).toHaveBeenCalledWith("The email is not valid");
      expect(setValue).not.toHaveBeenCalled();
      expect(mockRelayInstance.getJson).not.toHaveBeenCalled();
    });

    test("should validate email pattern and accept valid email", async () => {
      const emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
      mockRelayInstance.getJson.mockResolvedValue({ exists: false });
      
      await checkValid("test@example.com", "email", setError, setValue, null, emailPattern);
      
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
      expect(mockRelayInstance.getJson).toHaveBeenCalledWith();
    });

    test("should handle server validation success for email", async () => {
      mockRelayInstance.getJson.mockResolvedValue({ exists: false });
      
      await checkValid("test@example.com", "email", setError, setValue);
      
      expect(Relay).toHaveBeenCalledWith("company_checks/email_exists/test@example.com", "", "");
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
    });

    test("should handle server validation success for company_email", async () => {
      mockRelayInstance.getJson.mockResolvedValue({ exists: false });
      
      await checkValid("company@example.com", "company_email", setError, setValue);
      
      expect(Relay).toHaveBeenCalledWith("company_checks/email_exists/company@example.com", "", "");
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
    });

    test("should handle email already exists validation error", async () => {
      mockRelayInstance.getJson.mockResolvedValue({ exists: true });
      
      await checkValid("existing@example.com", "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("The email already exists");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should handle company email already exists validation error", async () => {
      mockRelayInstance.getJson.mockResolvedValue({ exists: true });
      
      await checkValid("existing@company.com", "company_email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("The company email already exists");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should handle server validation failure (null response)", async () => {
      mockRelayInstance.getJson.mockResolvedValue(null);
      
      await checkValid("test@example.com", "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Validation with the server failed");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should handle server validation failure (status error)", async () => {
      mockRelayInstance.getJson.mockResolvedValue({ 
        exists: false, 
        status: 500 
      });
      
      await checkValid("test@example.com", "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Validation with the server failed");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should handle server validation failure (statusCode error)", async () => {
      mockRelayInstance.getJson.mockResolvedValue({ 
        exists: false, 
        statusCode: 404 
      });
      
      await checkValid("test@example.com", "email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Validation with the server failed");
      expect(setValue).not.toHaveBeenCalled();
    });

    test("should handle field without resource validation", async () => {
      await checkValid("test-company-name", "company_name", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
      expect(mockRelayInstance.getJson).not.toHaveBeenCalled();
    });

    test("should call setOptions with company search when provided", async () => {
      // First mock for email validation
      mockRelayInstance.getJson.mockResolvedValueOnce({ exists: false });
      // Second mock for company search
      mockRelayInstance.getJson.mockResolvedValueOnce({ 
        found: true, 
        companies: [{ id: 1, name: 'Test Company' }] 
      });
      
      await checkValid("test@example.com", "email", setError, setValue, setOptions);
      
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
      
      // Since debounce is mocked to execute immediately, setOptions should be called
      expect(setOptions).toHaveBeenCalledWith([{ id: 1, name: 'Test Company' }]);
    });

    test("should handle email validation with setOptions for company search", async () => {
      // First mock for email validation
      mockRelayInstance.getJson.mockResolvedValueOnce({ exists: false });
      // Second mock for company search
      mockRelayInstance.getJson.mockResolvedValueOnce({ 
        found: true, 
        companies: [{ id: 1, name: 'Test Company' }] 
      });
      
      await checkValid("test@company.com", "email", setError, setValue, setOptions);
      
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
      // setOptions should be called with company search results
      expect(setOptions).toHaveBeenCalledWith([{ id: 1, name: 'Test Company' }]);
    });

    test("should handle company search with no results found", async () => {
      mockRelayInstance.getJson.mockResolvedValueOnce({ exists: false });
      mockRelayInstance.getJson.mockResolvedValueOnce({ found: false });
      
      await checkValid("test@noresults.com", "email", setError, setValue, setOptions);
      
      expect(setError).toHaveBeenCalledWith(false);
      expect(setValue).toHaveBeenCalled();
      expect(setOptions).not.toHaveBeenCalled();
    });

    test("should handle company_name field type", async () => {
      i18next.t.mockReturnValue('Company Name');
      
      await checkValid("", "company_name", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Company Name required");
    });

    test("should handle company_email field type", async () => {
      i18next.t.mockReturnValue('Company Email');
      
      await checkValid("", "company_email", setError, setValue);
      
      expect(setError).toHaveBeenCalledWith("Company Email required");
    });
  });
});
