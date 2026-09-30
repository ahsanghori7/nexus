import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import useFeatureFlag from './useFeatureFlag';

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Mock the featureFlags utility
jest.mock('v2/utils/featureFlags', () => ({
  isFeatureEnabled: jest.fn((account, flagName, allowedRoleIDs) => {
    // Mock implementation for testing
    const features = account?.features || [];
    const flagEnabled = features.some(flag => flag.name === flagName);
    
    if (!allowedRoleIDs || !allowedRoleIDs.length) return flagEnabled;
    
    const currentUserTypeId = Number(account?.user?.type_id);
    const rolePermitted = allowedRoleIDs.includes(currentUserTypeId);
    
    return flagEnabled && rolePermitted;
  }),
}));

// Test component that uses the hook
const TestComponent = ({ flagName, allowedRoleIDs = [] }) => {
  const { checkFeature } = useFeatureFlag();
  const isEnabled = checkFeature(flagName, allowedRoleIDs);
  
  return (
    <div data-testid="test-component">
      <span data-testid="feature-status">{isEnabled ? 'enabled' : 'disabled'}</span>
      <span data-testid="flag-name">{flagName}</span>
    </div>
  );
};

describe('useFeatureFlag', () => {
  const mockAccount = {
    user: {
      type_id: 1,
    },
    features: [
      { name: 'feature-a', enabled: true },
      { name: 'feature-b', enabled: true },
      { name: 'ACL_HELP_SUPPORT', enabled: true },
    ],
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default mock implementation
    useSelector.mockImplementation((selector) => selector({ clinkAccount: mockAccount }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<TestComponent flagName="feature-a" />);
      }).not.toThrow();
    });

    it('should return an object with checkFeature function', () => {
      const { checkFeature } = useFeatureFlag();
      expect(typeof checkFeature).toBe('function');
    });

    it('should call useSelector with correct selector', () => {
      render(<TestComponent flagName="feature-a" />);
      
      expect(useSelector).toHaveBeenCalled();
      // Verify that the selector function accesses clinkAccount
      const selectorFn = useSelector.mock.calls[0][0];
      const result = selectorFn({ clinkAccount: mockAccount });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('Feature flag checking (no role restriction)', () => {
    it('should return true when feature flag exists', () => {
      render(<TestComponent flagName="feature-a" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should return false when feature flag does not exist', () => {
      render(<TestComponent flagName="non-existent-feature" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should check ACL_HELP_SUPPORT feature', () => {
      render(<TestComponent flagName="ACL_HELP_SUPPORT" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should handle empty features array', () => {
      useSelector.mockImplementation((selector) => 
        selector({ clinkAccount: { user: { type_id: 1 }, features: [] } })
      );
      
      render(<TestComponent flagName="feature-a" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });
  });

  describe('Feature flag with role-based ACL', () => {
    it('should return true when feature exists AND user has allowed role', () => {
      render(<TestComponent flagName="feature-a" allowedRoleIDs={[1, 2, 3]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should return false when feature exists BUT user does NOT have allowed role', () => {
      render(<TestComponent flagName="feature-a" allowedRoleIDs={[2, 3, 4]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should return false when feature does NOT exist even if user has allowed role', () => {
      render(<TestComponent flagName="non-existent-feature" allowedRoleIDs={[1, 2, 3]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should handle ACL_HELP_SUPPORT with admin and superAdmin roles', () => {
      render(<TestComponent flagName="ACL_HELP_SUPPORT" allowedRoleIDs={[1, 2]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should deny access when user role is not in allowed list', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 5 }, // regular user
            features: [{ name: 'ACL_HELP_SUPPORT', enabled: true }] 
          } 
        })
      );
      
      render(<TestComponent flagName="ACL_HELP_SUPPORT" allowedRoleIDs={[1, 2]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });
  });

  describe('Edge cases and null safety', () => {
    it('should handle null account from Redux', () => {
      useSelector.mockImplementation((selector) => selector({ clinkAccount: null }));
      
      render(<TestComponent flagName="feature-a" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should handle undefined account from Redux', () => {
      useSelector.mockImplementation((selector) => selector({ clinkAccount: undefined }));
      
      render(<TestComponent flagName="feature-a" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should handle empty account object', () => {
      useSelector.mockImplementation((selector) => selector({ clinkAccount: {} }));
      
      render(<TestComponent flagName="feature-a" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should handle account without user property', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            features: [{ name: 'feature-a', enabled: true }] 
          } 
        })
      );
      
      render(<TestComponent flagName="feature-a" allowedRoleIDs={[1, 2]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should handle account without features property', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 1 } 
          } 
        })
      );
      
      render(<TestComponent flagName="feature-a" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });

    it('should handle empty allowedRoleIDs array', () => {
      render(<TestComponent flagName="feature-a" allowedRoleIDs={[]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should handle undefined allowedRoleIDs', () => {
      render(<TestComponent flagName="feature-a" allowedRoleIDs={undefined} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });
  });

  describe('Real-world usage scenarios', () => {
    it('should work for admin panel access check', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 1 }, // admin
            features: [{ name: 'admin-panel', enabled: true }] 
          } 
        })
      );
      
      const ADMIN_ROLE = 1;
      const SUPER_ADMIN_ROLE = 2;
      
      render(<TestComponent flagName="admin-panel" allowedRoleIDs={[ADMIN_ROLE, SUPER_ADMIN_ROLE]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should work for help support sidebar visibility', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 2 }, // superAdmin
            features: [{ name: 'ACL_HELP_SUPPORT', enabled: true }] 
          } 
        })
      );
      
      render(<TestComponent flagName="ACL_HELP_SUPPORT" allowedRoleIDs={[1, 2]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should work for beta feature access without role restriction', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 5 },
            features: [{ name: 'beta-feature', enabled: true }] 
          } 
        })
      );
      
      render(<TestComponent flagName="beta-feature" />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should deny access when feature is disabled in backend', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 1 },
            features: [] // Feature not in list = disabled
          } 
        })
      );
      
      render(<TestComponent flagName="disabled-feature" allowedRoleIDs={[1, 2]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('disabled');
    });
  });

  describe('Multiple components using the hook', () => {
    it('should work correctly with multiple components checking different features', () => {
      const MultipleTestComponent = () => {
        const { checkFeature } = useFeatureFlag();
        const featureAEnabled = checkFeature('feature-a');
        const featureBEnabled = checkFeature('feature-b');
        const featureCEnabled = checkFeature('non-existent');
        
        return (
          <div>
            <span data-testid="feature-a-status">{featureAEnabled ? 'enabled' : 'disabled'}</span>
            <span data-testid="feature-b-status">{featureBEnabled ? 'enabled' : 'disabled'}</span>
            <span data-testid="feature-c-status">{featureCEnabled ? 'enabled' : 'disabled'}</span>
          </div>
        );
      };
      
      render(<MultipleTestComponent />);
      
      expect(screen.getByTestId('feature-a-status').textContent).toBe('enabled');
      expect(screen.getByTestId('feature-b-status').textContent).toBe('enabled');
      expect(screen.getByTestId('feature-c-status').textContent).toBe('disabled');
    });

    it('should maintain consistency across multiple components', () => {
      const { rerender } = render(<TestComponent flagName="feature-a" />);
      
      expect(screen.getByTestId('feature-status').textContent).toBe('enabled');
      
      // Re-render with different flag
      rerender(<TestComponent flagName="feature-b" />);
      
      expect(screen.getByTestId('feature-status').textContent).toBe('enabled');
    });
  });

  describe('Type coercion and data types', () => {
    it('should handle string type_id correctly', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: '1' }, // String type_id
            features: [{ name: 'feature-a', enabled: true }] 
          } 
        })
      );
      
      render(<TestComponent flagName="feature-a" allowedRoleIDs={[1, 2, 3]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });

    it('should handle numeric type_id correctly', () => {
      useSelector.mockImplementation((selector) => 
        selector({ 
          clinkAccount: { 
            user: { type_id: 1 }, // Numeric type_id
            features: [{ name: 'feature-a', enabled: true }] 
          } 
        })
      );
      
      render(<TestComponent flagName="feature-a" allowedRoleIDs={[1, 2, 3]} />);
      
      const status = screen.getByTestId('feature-status');
      expect(status.textContent).toBe('enabled');
    });
  });
});

