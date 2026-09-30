import { isFeatureEnabled } from './featureFlags';

describe('isFeatureEnabled', () => {
  const mockAccount = {
    user: {
      type_id: 1,
    },
    features: [
      { name: 'feature-a', enabled: true },
      { name: 'feature-b', enabled: true },
      { name: 'feature-c', enabled: false },
    ],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature flag only (no role restriction)', () => {
    it('should return true when feature flag exists and no roles specified', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a');
      expect(result).toBe(true);
    });

    it('should return true when feature flag exists and empty roles array provided', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-b', []);
      expect(result).toBe(true);
    });

    it('should return false when feature flag does not exist', () => {
      const result = isFeatureEnabled(mockAccount, 'non-existent-feature');
      expect(result).toBe(false);
    });

    it('should return false when features array is empty', () => {
      const emptyAccount = { user: { type_id: 1 }, features: [] };
      const result = isFeatureEnabled(emptyAccount, 'feature-a');
      expect(result).toBe(false);
    });

    it('should return false when features array is undefined', () => {
      const noFeaturesAccount = { user: { type_id: 1 } };
      const result = isFeatureEnabled(noFeaturesAccount, 'feature-a');
      expect(result).toBe(false);
    });
  });

  describe('Feature flag with role-based ACL', () => {
    it('should return true when feature exists AND user role is in allowed list', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a', [1, 2, 3]);
      expect(result).toBe(true);
    });

    it('should return false when feature exists BUT user role is NOT in allowed list', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a', [2, 3, 4]);
      expect(result).toBe(false);
    });

    it('should return false when feature does NOT exist even if user role is allowed', () => {
      const result = isFeatureEnabled(mockAccount, 'non-existent-feature', [1, 2, 3]);
      expect(result).toBe(false);
    });

    it('should return false when both feature does NOT exist AND user role is NOT allowed', () => {
      const result = isFeatureEnabled(mockAccount, 'non-existent-feature', [2, 3, 4]);
      expect(result).toBe(false);
    });

    it('should handle string type_id by converting to number', () => {
      const stringTypeAccount = {
        user: { type_id: '1' },
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(stringTypeAccount, 'feature-a', [1, 2, 3]);
      expect(result).toBe(true);
    });

    it('should handle single role ID in allowed list', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a', [1]);
      expect(result).toBe(true);
    });

    it('should handle large role ID arrays', () => {
      const largeRoleList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = isFeatureEnabled(mockAccount, 'feature-a', largeRoleList);
      expect(result).toBe(true);
    });
  });

  describe('Edge cases and null safety', () => {
    it('should handle null account gracefully', () => {
      const result = isFeatureEnabled(null, 'feature-a');
      expect(result).toBe(false);
    });

    it('should handle undefined account gracefully', () => {
      const result = isFeatureEnabled(undefined, 'feature-a');
      expect(result).toBe(false);
    });

    it('should handle account without user property', () => {
      const accountWithoutUser = {
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(accountWithoutUser, 'feature-a', [1, 2]);
      expect(result).toBe(false);
    });

    it('should handle null user property', () => {
      const accountWithNullUser = {
        user: null,
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(accountWithNullUser, 'feature-a', [1, 2]);
      expect(result).toBe(false);
    });

    it('should handle undefined type_id', () => {
      const accountWithUndefinedTypeId = {
        user: { type_id: undefined },
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(accountWithUndefinedTypeId, 'feature-a', [1, 2]);
      expect(result).toBe(false);
    });

    it('should handle NaN type_id', () => {
      const accountWithNaNTypeId = {
        user: { type_id: NaN },
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(accountWithNaNTypeId, 'feature-a', [1, 2]);
      expect(result).toBe(false);
    });

    it('should handle null features array', () => {
      const accountWithNullFeatures = {
        user: { type_id: 1 },
        features: null,
      };
      const result = isFeatureEnabled(accountWithNullFeatures, 'feature-a');
      expect(result).toBe(false);
    });

    it('should handle empty flag name', () => {
      const result = isFeatureEnabled(mockAccount, '');
      expect(result).toBe(false);
    });

    it('should handle null flag name', () => {
      const result = isFeatureEnabled(mockAccount, null);
      expect(result).toBe(false);
    });

    it('should handle undefined flag name', () => {
      const result = isFeatureEnabled(mockAccount, undefined);
      expect(result).toBe(false);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle admin panel access (feature + role check)', () => {
      const adminAccount = {
        user: { type_id: 1 }, // admin role
        features: [{ name: 'admin-panel', enabled: true }],
      };
      const ADMIN_ROLE_ID = 1;
      const SUPER_ADMIN_ROLE_ID = 2;

      const result = isFeatureEnabled(
        adminAccount,
        'admin-panel',
        [ADMIN_ROLE_ID, SUPER_ADMIN_ROLE_ID]
      );
      expect(result).toBe(true);
    });

    it('should deny regular user access to admin panel', () => {
      const regularUserAccount = {
        user: { type_id: 5 }, // regular user role
        features: [{ name: 'admin-panel', enabled: true }],
      };
      const ADMIN_ROLE_ID = 1;
      const SUPER_ADMIN_ROLE_ID = 2;

      const result = isFeatureEnabled(
        regularUserAccount,
        'admin-panel',
        [ADMIN_ROLE_ID, SUPER_ADMIN_ROLE_ID]
      );
      expect(result).toBe(false);
    });

    it('should handle ACL_HELP_SUPPORT feature check', () => {
      const account = {
        user: { type_id: 1 },
        features: [{ name: 'ACL_HELP_SUPPORT', enabled: true }],
      };
      const result = isFeatureEnabled(account, 'ACL_HELP_SUPPORT', [1, 2]);
      expect(result).toBe(true);
    });

    it('should handle beta feature access without role restriction', () => {
      const account = {
        user: { type_id: 3 },
        features: [{ name: 'beta-feature', enabled: true }],
      };
      const result = isFeatureEnabled(account, 'beta-feature');
      expect(result).toBe(true);
    });

    it('should return false when feature is disabled in backend', () => {
      const account = {
        user: { type_id: 1 },
        features: [], // Feature not in list = disabled
      };
      const result = isFeatureEnabled(account, 'disabled-feature', [1, 2, 3]);
      expect(result).toBe(false);
    });
  });

  describe('Feature flag name matching', () => {
    it('should match feature flag by exact name', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a');
      expect(result).toBe(true);
    });

    it('should be case sensitive', () => {
      const result = isFeatureEnabled(mockAccount, 'Feature-A');
      expect(result).toBe(false);
    });

    it('should not match partial feature names', () => {
      const result = isFeatureEnabled(mockAccount, 'feature');
      expect(result).toBe(false);
    });

    it('should handle feature names with special characters', () => {
      const specialAccount = {
        user: { type_id: 1 },
        features: [{ name: 'feature_with_underscore', enabled: true }],
      };
      const result = isFeatureEnabled(specialAccount, 'feature_with_underscore');
      expect(result).toBe(true);
    });

    it('should handle feature names with numbers', () => {
      const specialAccount = {
        user: { type_id: 1 },
        features: [{ name: 'feature-123', enabled: true }],
      };
      const result = isFeatureEnabled(specialAccount, 'feature-123');
      expect(result).toBe(true);
    });
  });

  describe('Multiple role IDs', () => {
    it('should return true if user role matches first ID in array', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a', [1, 2, 3, 4, 5]);
      expect(result).toBe(true);
    });

    it('should return true if user role matches middle ID in array', () => {
      const middleRoleAccount = {
        user: { type_id: 3 },
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(middleRoleAccount, 'feature-a', [1, 2, 3, 4, 5]);
      expect(result).toBe(true);
    });

    it('should return true if user role matches last ID in array', () => {
      const lastRoleAccount = {
        user: { type_id: 5 },
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(lastRoleAccount, 'feature-a', [1, 2, 3, 4, 5]);
      expect(result).toBe(true);
    });

    it('should return false if user role does not match any ID in array', () => {
      const noMatchAccount = {
        user: { type_id: 10 },
        features: [{ name: 'feature-a', enabled: true }],
      };
      const result = isFeatureEnabled(noMatchAccount, 'feature-a', [1, 2, 3, 4, 5]);
      expect(result).toBe(false);
    });
  });

  describe('allowedRoleIDs validation', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    it('should throw TypeError when allowedRoleIDs contains string numbers', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', ['1', '2', '3']);
      }).toThrow(TypeError);
      
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', ['1', '2', '3']);
      }).toThrow('allowedRoleIDs must be an array of numbers, not strings');
      
      expect(console.error).toHaveBeenCalledWith(
        'isFeatureEnabled: allowedRoleIDs must be an array of numbers, received:',
        ['1', '2', '3']
      );
    });

    it('should throw TypeError when allowedRoleIDs contains mixed types (numbers and strings)', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, '2', 3]);
      }).toThrow(TypeError);
      
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, '2', 3]);
      }).toThrow('allowedRoleIDs must be an array of numbers, not strings');
      
      expect(console.error).toHaveBeenCalledWith(
        'isFeatureEnabled: allowedRoleIDs must be an array of numbers, received:',
        [1, '2', 3]
      );
    });

    it('should throw TypeError when allowedRoleIDs contains a single string', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', ['1']);
      }).toThrow(TypeError);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw TypeError when allowedRoleIDs contains boolean values', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, true, 3]);
      }).toThrow(TypeError);
      
      expect(console.error).toHaveBeenCalledWith(
        'isFeatureEnabled: allowedRoleIDs must be an array of numbers, received:',
        [1, true, 3]
      );
    });

    it('should throw TypeError when allowedRoleIDs contains null', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, null, 3]);
      }).toThrow(TypeError);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw TypeError when allowedRoleIDs contains undefined', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, undefined, 3]);
      }).toThrow(TypeError);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw TypeError when allowedRoleIDs contains objects', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, { id: 2 }, 3]);
      }).toThrow(TypeError);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should NOT throw error when allowedRoleIDs is empty array', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', []);
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should NOT throw error when allowedRoleIDs contains only valid numbers', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1, 2, 3]);
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should NOT throw error when allowedRoleIDs is not provided (defaults to empty array)', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a');
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should work correctly with valid number array and return true', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a', [1, 2, 3]);
      expect(result).toBe(true);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should work correctly with valid number array and return false when role not matched', () => {
      const result = isFeatureEnabled(mockAccount, 'feature-a', [2, 3, 4]);
      expect(result).toBe(false);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should validate before checking feature flag (throw even if feature does not exist)', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'non-existent-feature', ['1', '2']);
      }).toThrow(TypeError);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle negative numbers correctly', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [-1, -2, -3]);
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle zero correctly', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [0, 1, 2]);
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle large numbers correctly', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [999999, 1000000]);
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle floating point numbers correctly', () => {
      expect(() => {
        isFeatureEnabled(mockAccount, 'feature-a', [1.5, 2.7, 3.9]);
      }).not.toThrow();
      
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});

