import {
  DIRECTOR,
  TENDERING,
  CONSTRUCTION,
  COMMERCIAL,
  ENVIRONMENT,
  WITNESS,
  OTHER,
  ROLE_CHECKER,
} from 'v2/helpers/prequal/organization';

describe('prequal/organization.js', () => {
  describe('role constants', () => {
    test('should export DIRECTOR constant with correct structure', () => {
      expect(DIRECTOR).toEqual({
        id: 1,
        value: 'CEO/Managing Director',
        label: 'CEO/Managing Director',
      });
    });

    test('should export TENDERING constant with correct structure', () => {
      expect(TENDERING).toEqual({
        id: 2,
        value: 'Responsible for Tendering',
        label: 'Responsible for Tendering',
      });
    });

    test('should export CONSTRUCTION constant with correct structure', () => {
      expect(CONSTRUCTION).toEqual({
        id: 3,
        value: 'Responsible for Construction',
        label: 'Responsible for Construction',
      });
    });

    test('should export COMMERCIAL constant with correct structure', () => {
      expect(COMMERCIAL).toEqual({
        id: 4,
        value: 'Responsible for Commercial',
        label: 'Responsible for Commercial',
      });
    });

    test('should export ENVIRONMENT constant with correct structure', () => {
      expect(ENVIRONMENT).toEqual({
        id: 5,
        value: 'Responsible for H & S, Environment',
        label: 'Responsible for H & S, Environment',
      });
    });

    test('should export WITNESS constant with correct structure', () => {
      expect(WITNESS).toEqual({
        id: 6,
        value: 'Witness',
        label: 'Witness',
      });
    });

    test('should export OTHER constant with correct structure', () => {
      expect(OTHER).toEqual({
        id: 7,
        value: 'Other',
        label: 'Other',
      });
    });
  });

  describe('role structure validation', () => {
    test('all role constants should have required properties', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS, OTHER];
      
      roles.forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('value');
        expect(role).toHaveProperty('label');
        expect(typeof role.id).toBe('number');
        expect(typeof role.value).toBe('string');
        expect(typeof role.label).toBe('string');
      });
    });

    test('all role IDs should be unique', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS, OTHER];
      const ids = roles.map(role => role.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(uniqueIds).toHaveLength(ids.length);
    });

    test('all role values should be unique', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS, OTHER];
      const values = roles.map(role => role.value);
      const uniqueValues = [...new Set(values)];
      
      expect(uniqueValues).toHaveLength(values.length);
    });

    test('value and label should match for all roles', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS, OTHER];
      
      roles.forEach(role => {
        expect(role.value).toBe(role.label);
      });
    });
  });

  describe('ROLE_CHECKER object', () => {
    test('should export ROLE_CHECKER with correct mapping', () => {
      const expectedRoleChecker = {
        'CEO/Managing Director': 'CEO/Managing Director',
        'Responsible for Tendering': 'Responsible for Tendering',
        'Responsible for Construction': 'Responsible for Construction',
        'Responsible for Commercial': 'Responsible for Commercial',
        'Responsible for H & S, Environment': 'Responsible for H & S, Environment',
        'Witness': 'Witness',
      };
      
      expect(ROLE_CHECKER).toEqual(expectedRoleChecker);
    });

    test('ROLE_CHECKER should include all role values except OTHER', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS];
      
      roles.forEach(role => {
        expect(ROLE_CHECKER).toHaveProperty(role.value);
        expect(ROLE_CHECKER[role.value]).toBe(role.value);
      });
    });

    test('ROLE_CHECKER should not include OTHER role', () => {
      expect(ROLE_CHECKER).not.toHaveProperty(OTHER.value);
    });

    test('ROLE_CHECKER should be usable for validation', () => {
      // Test that it can be used to check if a role value is valid
      expect(ROLE_CHECKER[DIRECTOR.value]).toBeTruthy();
      expect(ROLE_CHECKER[TENDERING.value]).toBeTruthy();
      expect(ROLE_CHECKER['Invalid Role']).toBeUndefined();
    });

    test('all ROLE_CHECKER keys should map to themselves', () => {
      Object.entries(ROLE_CHECKER).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });
  });

  describe('role categorization', () => {
    test('should identify executive roles', () => {
      const executiveRoles = [DIRECTOR];
      
      executiveRoles.forEach(role => {
        expect(role.value).toMatch(/CEO|Managing|Director/i);
      });
    });

    test('should identify responsibility-based roles', () => {
      const responsibilityRoles = [TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT];
      
      responsibilityRoles.forEach(role => {
        expect(role.value).toMatch(/Responsible for/i);
      });
    });

    test('should identify special roles', () => {
      expect(WITNESS.value).toBe('Witness');
      expect(OTHER.value).toBe('Other');
    });
  });

  describe('business logic utilities', () => {
    test('should support role selection in forms', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS, OTHER];
      
      // Simulate form options
      const formOptions = roles.map(role => ({
        value: role.value,
        label: role.label,
      }));
      
      expect(formOptions).toHaveLength(7);
      formOptions.forEach(option => {
        expect(option.value).toBe(option.label);
      });
    });

    test('should support role validation workflow', () => {
      const testRole = 'CEO/Managing Director';
      
      // Test validation using ROLE_CHECKER
      const isValidRole = Object.prototype.hasOwnProperty.call(ROLE_CHECKER, testRole);
      expect(isValidRole).toBe(true);
      
      // Test invalid role
      const invalidRole = 'Some Invalid Role';
      const isInvalidRole = Object.prototype.hasOwnProperty.call(ROLE_CHECKER, invalidRole);
      expect(isInvalidRole).toBe(false);
    });

    test('roles should be ordered by ID for consistent display', () => {
      const roles = [DIRECTOR, TENDERING, CONSTRUCTION, COMMERCIAL, ENVIRONMENT, WITNESS, OTHER];
      const sortedRoles = [...roles].sort((a, b) => a.id - b.id);
      
      expect(roles).toEqual(sortedRoles);
    });
  });
});
