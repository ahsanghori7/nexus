import userTypes, { superAdmin, admin, manager, assistant, witness, approver } from 'v2/helpers/roles';

describe('roles.js', () => {
  describe('individual role exports', () => {
    test('should export superAdmin with correct properties', () => {
      expect(superAdmin).toEqual({
        id: 8,
        value: 'super_admin',
        label: 'Super Admin',
        level: 1,
      });
    });

    test('should export admin with correct properties', () => {
      expect(admin).toEqual({
        id: 2,
        value: 'team_admin',
        label: 'Admin',
        level: 3,
      });
    });

    test('should export manager with correct properties', () => {
      expect(manager).toEqual({
        id: 3,
        value: 'team_manager',
        label: 'Manager',
        level: 4,
      });
    });

    test('should export assistant with correct properties', () => {
      expect(assistant).toEqual({
        id: 4,
        value: 'team_assistant',
        label: 'Team Member',
        level: 5,
      });
    });

    test('should export approver with correct properties', () => {
      expect(approver).toEqual({
        id: 9,
        value: 'approver',
        label: 'Approver',
        level: 6,
      });
    });

    test('should export witness with correct properties', () => {
      expect(witness).toEqual({
        id: 6,
        value: 'witness',
        label: 'Witness',
        level: 7,
      });
    });
  });

  describe('userTypes array', () => {
    test('should export userTypes as default export', () => {
      expect(Array.isArray(userTypes)).toBe(true);
    });

    test('should contain all role objects', () => {
      const requiredRoles = [superAdmin, admin, manager, assistant, approver, witness];
      expect(userTypes.length).toBeGreaterThanOrEqual(requiredRoles.length);
      expect(userTypes).toEqual(expect.arrayContaining(requiredRoles));
    });

    test('should maintain correct order in array', () => {
      const expectedOrder = [superAdmin, admin, manager, assistant, approver, witness];
      const orderedCoreRoles = userTypes.filter((role) =>
        expectedOrder.some((expected) => expected.value === role.value)
      );
      expect(orderedCoreRoles).toEqual(expectedOrder);
    });
  });

  describe('role structure validation', () => {
    test('each role should have required properties', () => {
      const allRoles = [superAdmin, admin, manager, assistant, approver, witness];
      
      allRoles.forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('value');
        expect(role).toHaveProperty('label');
        expect(role).toHaveProperty('level');
        
        expect(typeof role.id).toBe('number');
        expect(typeof role.value).toBe('string');
        expect(typeof role.label).toBe('string');
        expect(typeof role.level).toBe('number');
      });
    });

    test('role ids should be unique', () => {
      const ids = userTypes
        .filter(role => typeof role.id === 'number')
        .map(role => role.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });

    test('role values should be unique', () => {
      const values = userTypes.map(role => role.value);
      const uniqueValues = [...new Set(values)];
      expect(uniqueValues).toHaveLength(values.length);
    });

    test('role levels should be unique', () => {
      const levels = userTypes
        .filter(role => typeof role.level === 'number')
        .map(role => role.level);
      const uniqueLevels = [...new Set(levels)];
      expect(uniqueLevels).toHaveLength(levels.length);
    });

    test('role labels should be unique', () => {
      const labels = userTypes.map(role => role.label);
      const uniqueLabels = [...new Set(labels)];
      expect(uniqueLabels).toHaveLength(labels.length);
    });
  });

  describe('role hierarchy', () => {
    test('superAdmin should have the lowest level (highest priority)', () => {
      const allLevels = userTypes
        .filter(role => typeof role.level === 'number')
        .map(role => role.level);
      const minLevel = Math.min(...allLevels);
      expect(superAdmin.level).toBe(minLevel);
    });

    test('witness should have the highest level (lowest priority)', () => {
      const allLevels = userTypes
        .filter(role => typeof role.level === 'number')
        .map(role => role.level);
      const maxLevel = Math.max(...allLevels);
      expect(witness.level).toBe(maxLevel);
    });

    test('levels should be in ascending order', () => {
      const levels = userTypes
        .filter(role => typeof role.level === 'number')
        .map(role => role.level);
      const sortedLevels = [...levels].sort((a, b) => a - b);
      expect(levels).toEqual(sortedLevels);
    });
  });

  describe('role utility functions', () => {
    test('should find role by id', () => {
      const findById = (id) => userTypes.find(role => role.id === id);
      
      expect(findById(8)).toBe(superAdmin);
      expect(findById(2)).toBe(admin);
      expect(findById(999)).toBeUndefined();
    });

    test('should find role by value', () => {
      const findByValue = (value) => userTypes.find(role => role.value === value);
      
      expect(findByValue('super_admin')).toBe(superAdmin);
      expect(findByValue('team_admin')).toBe(admin);
      expect(findByValue('nonexistent')).toBeUndefined();
    });

    test('should filter roles by minimum level', () => {
      const getByMinLevel = (minLevel) =>
        userTypes.filter(role => typeof role.level === 'number' && role.level >= minLevel);
      
      expect(getByMinLevel(5)).toHaveLength(3); // assistant, approver, witness
      expect(getByMinLevel(1)).toHaveLength(6); // all core roles
      expect(getByMinLevel(8)).toHaveLength(0); // no roles
    });
  });
});
