import { OTHER } from 'v2/helpers/prequal/organization';
import {
  SECTIONS,
  TYPES,
  CUSTOM_CERTIFICATE,
  NOT_ISO_ACCREDITED,
  ISO_90001,
  BS_EN_ISO_14001_2015,
  OTHER_CERTIFICATE_DOC,
  SUSTAINABLE_SOURCE_EVIDENCE,
  ENVIROMENTAL_POLICY_STATEMENT,
  ENVIROMENTAL_ADVICE,
  DEFAULT_INSURANCES,
  DEFAULT_ACCREDITATIONS,
  DEFAULT_MANAGEMENT_SYSTEM,
  DEFAULT_EXAMPLE_DOCUMENTS,
  DEFAULT_HEALTH_SAFETY,
  DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS,
  DEFAULT_ENVIRONMENTAL,
  DEFAULT_QUALITY,
  DATA_PROTECTION_POLICY,
  ANTI_BRIBERY_POLICY,
  UKAS,
  CV,
  SCHEDULE_LIABILITY,
  SCHEDULE_INDEMNITY,
  STATEMENT_FACT,
  POLICY_WORDING,
} from 'v2/helpers/prequal/documents';

describe('prequal/documents.js', () => {
  describe('TYPES constants', () => {
    test('should export TYPES with correct values', () => {
      const expectedTypes = {
        INS: 'insurances',
        ACC: 'accreditation',
        MAN: 'management-system',
        CER: 'custom-certificate',
        HS: 'health-safety',
        HSEQ: 'health-safety-environmental-qualifications',
        EN: 'environmental',
        QU: 'quality',
        ED: 'example-documents',
      };
      
      expect(TYPES).toEqual(expectedTypes);
    });

    test('all TYPES values should be strings', () => {
      Object.values(TYPES).forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    test('all TYPES keys should be uppercase abbreviations', () => {
      Object.keys(TYPES).forEach(key => {
        expect(key).toMatch(/^[A-Z]+$/);
      });
    });
  });

  describe('SECTIONS constants', () => {
    test('should export SECTIONS with correct values', () => {
      expect(SECTIONS).toHaveProperty('INF', 'company_information');
      expect(SECTIONS).toHaveProperty('ORG', 'organisation');
      expect(SECTIONS).toHaveProperty('TUR', 'turnover');
      expect(SECTIONS).toHaveProperty('REF', 'references');
    });

    test('SECTIONS should include all TYPES', () => {
      Object.entries(TYPES).forEach(([key, value]) => {
        expect(SECTIONS).toHaveProperty(key, value);
      });
    });

    test('SECTIONS should have unique section values', () => {
      const values = Object.values(SECTIONS);
      const uniqueValues = [...new Set(values)];
      expect(uniqueValues).toHaveLength(values.length);
    });
  });

  describe('certificate constants', () => {
    test('should export certificate-related constants', () => {
      expect(CUSTOM_CERTIFICATE).toBe('custom-certificate');
      expect(NOT_ISO_ACCREDITED).toBe('not ISO Accredited');
      expect(ISO_90001).toBe('IS0 90001'); // Note: typo in original (IS0 instead of ISO)
      expect(BS_EN_ISO_14001_2015).toBe('BS EN ISO 14001:2015');
      expect(OTHER_CERTIFICATE_DOC).toBe('Other');
    });

    test('ISO constants should be correctly formatted', () => {
      expect(ISO_90001).toMatch(/^IS0 \d+$/); // Note: original has typo IS0
      expect(BS_EN_ISO_14001_2015).toMatch(/^BS EN ISO \d+:\d+$/);
    });
  });

  describe('environmental constants', () => {
    test('should export environmental-related constants', () => {
      expect(SUSTAINABLE_SOURCE_EVIDENCE).toBe('Sustainable Source Evidence');
      expect(ENVIROMENTAL_POLICY_STATEMENT).toBe('Environmental policy statement');
      expect(ENVIROMENTAL_ADVICE).toBe('Environmental advice');
    });

    test('environmental constants should be descriptive strings', () => {
      const envConstants = [
        SUSTAINABLE_SOURCE_EVIDENCE,
        ENVIROMENTAL_POLICY_STATEMENT,
        ENVIROMENTAL_ADVICE,
      ];
      
      envConstants.forEach(constant => {
        expect(typeof constant).toBe('string');
        expect(constant.length).toBeGreaterThan(10);
      });
    });
  });

  describe('policy constants', () => {
    test('should export policy-related constants', () => {
      expect(DATA_PROTECTION_POLICY).toBe('Data Protection Policy');
      expect(ANTI_BRIBERY_POLICY).toBe('Anti Bribery Policy');
    });

    test('policy constants should end with "Policy"', () => {
      const policyConstants = [DATA_PROTECTION_POLICY, ANTI_BRIBERY_POLICY];
      
      policyConstants.forEach(policy => {
        expect(policy).toMatch(/Policy$/);
      });
    });
  });

  describe('certification and qualification constants', () => {
    test('should export certification constants', () => {
      expect(UKAS).toBe('UKAS');
      expect(CV).toBe('CV for Health and Safety Manager / Consultant');
    });

    test('CV constant should be descriptive', () => {
      expect(CV).toMatch(/^CV for/);
      expect(CV).toMatch(/Health and Safety/);
    });
  });

  describe('insurance schedule constants', () => {
    test('should export insurance schedule constants', () => {
      expect(SCHEDULE_LIABILITY).toBe('Schedule Public Liability');
      expect(SCHEDULE_INDEMNITY).toBe('Schedule Professional Indemnity');
      expect(STATEMENT_FACT).toBe('Statement of Fact');
      expect(POLICY_WORDING).toBe('Policy wording');
    });

    test('schedule constants should start with "Schedule"', () => {
      const scheduleConstants = [SCHEDULE_LIABILITY, SCHEDULE_INDEMNITY];
      
      scheduleConstants.forEach(schedule => {
        expect(schedule).toMatch(/^Schedule/);
      });
    });
  });

  describe('DEFAULT_INSURANCES array', () => {
    test('should export DEFAULT_INSURANCES as array', () => {
      expect(Array.isArray(DEFAULT_INSURANCES)).toBe(true);
      expect(DEFAULT_INSURANCES).toHaveLength(6);
    });

    test('all DEFAULT_INSURANCES items should have required structure', () => {
      DEFAULT_INSURANCES.forEach(insurance => {
        expect(insurance).toHaveProperty('id');
        expect(insurance).toHaveProperty('label');
        expect(insurance).toHaveProperty('value');
        expect(insurance).toHaveProperty('request');
        expect(typeof insurance.id).toBe('number');
        expect(typeof insurance.label).toBe('string');
        expect(typeof insurance.value).toBe('string');
        expect(typeof insurance.request).toBe('boolean');
        expect(insurance.label).toBe(insurance.value);
      });
    });

    test('DEFAULT_INSURANCES should include specific insurance types', () => {
      const labels = DEFAULT_INSURANCES.map(ins => ins.label);
      
      expect(labels).toContain('Employers Liability');
      expect(labels).toContain('Public Liability');
      expect(labels).toContain('Products Liability');
      expect(labels).toContain('Professional Indemnity');
      expect(labels).toContain(SCHEDULE_LIABILITY);
      expect(labels).toContain(SCHEDULE_INDEMNITY);
    });

    test('all DEFAULT_INSURANCES should have request set to false', () => {
      DEFAULT_INSURANCES.forEach(insurance => {
        expect(insurance.request).toBe(false);
      });
    });

    test('DEFAULT_INSURANCES IDs should be unique and sequential', () => {
      const ids = DEFAULT_INSURANCES.map(ins => ins.id);
      const sortedIds = [...ids].sort((a, b) => a - b);
      
      expect(ids).toEqual(sortedIds);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('DEFAULT_ACCREDITATIONS array', () => {
    test('should export DEFAULT_ACCREDITATIONS as array', () => {
      expect(Array.isArray(DEFAULT_ACCREDITATIONS)).toBe(true);
      expect(DEFAULT_ACCREDITATIONS).toHaveLength(10);
    });

    test('most DEFAULT_ACCREDITATIONS items should have id/label/value structure', () => {
      DEFAULT_ACCREDITATIONS.forEach(accreditation => {
        if (accreditation !== OTHER) {
          expect(accreditation).toHaveProperty('id');
          expect(accreditation).toHaveProperty('label');
          expect(accreditation).toHaveProperty('value');
          expect(typeof accreditation.id).toBe('number');
          expect(typeof accreditation.label).toBe('string');
          expect(typeof accreditation.value).toBe('string');
          expect(accreditation.label).toBe(accreditation.value);
        }
      });
    });

    test('DEFAULT_ACCREDITATIONS should include OTHER from organization', () => {
      expect(DEFAULT_ACCREDITATIONS).toContain(OTHER);
    });

    test('DEFAULT_ACCREDITATIONS should include specific accreditation types', () => {
      const labels = DEFAULT_ACCREDITATIONS
        .filter(acc => acc !== OTHER)
        .map(acc => acc.label);
      
      expect(labels).toContain('Constructionline');
      expect(labels).toContain('Safe Contractor');
      expect(labels).toContain('CHAS');
      expect(labels).toContain('SMAS');
    });
  });

  describe('DEFAULT_MANAGEMENT_SYSTEM array', () => {
    test('should export DEFAULT_MANAGEMENT_SYSTEM as array', () => {
      expect(Array.isArray(DEFAULT_MANAGEMENT_SYSTEM)).toBe(true);
      expect(DEFAULT_MANAGEMENT_SYSTEM).toHaveLength(6);
    });

    test('all DEFAULT_MANAGEMENT_SYSTEM items should have correct structure', () => {
      DEFAULT_MANAGEMENT_SYSTEM.forEach(system => {
        expect(system).toHaveProperty('id');
        expect(system).toHaveProperty('label');
        expect(system).toHaveProperty('value');
        expect(typeof system.id).toBe('number');
        expect(typeof system.label).toBe('string');
        expect(typeof system.value).toBe('string');
        expect(system.label).toBe(system.value);
      });
    });

    test('DEFAULT_MANAGEMENT_SYSTEM should include ISO standards', () => {
      const labels = DEFAULT_MANAGEMENT_SYSTEM.map(sys => sys.label);
      
      expect(labels).toContain('ISO 9001:2015');
      expect(labels).toContain('ISO 14001:2015');
      expect(labels).toContain('OHSAS 18001');
    });

    test('DEFAULT_MANAGEMENT_SYSTEM should include policy constants', () => {
      const labels = DEFAULT_MANAGEMENT_SYSTEM.map(sys => sys.label);
      
      expect(labels).toContain(DATA_PROTECTION_POLICY);
      expect(labels).toContain(ANTI_BRIBERY_POLICY);
      expect(labels).toContain(UKAS);
    });
  });

  describe('DEFAULT_EXAMPLE_DOCUMENTS array', () => {
    test('should export DEFAULT_EXAMPLE_DOCUMENTS as array', () => {
      expect(Array.isArray(DEFAULT_EXAMPLE_DOCUMENTS)).toBe(true);
      expect(DEFAULT_EXAMPLE_DOCUMENTS).toHaveLength(4);
    });

    test('all DEFAULT_EXAMPLE_DOCUMENTS items should have correct structure', () => {
      DEFAULT_EXAMPLE_DOCUMENTS.forEach(doc => {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('label');
        expect(doc).toHaveProperty('value');
        expect(typeof doc.id).toBe('number');
        expect(typeof doc.label).toBe('string');
        expect(typeof doc.value).toBe('string');
        expect(doc.label).toBe(doc.value);
      });
    });

    test('DEFAULT_EXAMPLE_DOCUMENTS should include quality and safety documents', () => {
      const labels = DEFAULT_EXAMPLE_DOCUMENTS.map(doc => doc.label);
      
      expect(labels).toContain('Quality assessment evidence');
      expect(labels).toContain('Sample Method Statement');
      expect(labels).toContain('Sample Risk Assessment (for a specific task)');
      expect(labels).toContain('Accident Reporting Form');
    });
  });

  describe('DEFAULT_HEALTH_SAFETY array', () => {
    test('should export DEFAULT_HEALTH_SAFETY as array', () => {
      expect(Array.isArray(DEFAULT_HEALTH_SAFETY)).toBe(true);
      expect(DEFAULT_HEALTH_SAFETY).toHaveLength(3);
    });

    test('all DEFAULT_HEALTH_SAFETY items should relate to health and safety', () => {
      DEFAULT_HEALTH_SAFETY.forEach(item => {
        expect(item.label).toMatch(/health.*safety/i);
        expect(item.value).toMatch(/health.*safety/i);
      });
    });
  });

  describe('DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS array', () => {
    test('should export DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS as array', () => {
      expect(Array.isArray(DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS)).toBe(true);
      expect(DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS).toHaveLength(5);
    });

    test('should include CV constant', () => {
      const labels = DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS.map(qual => qual.label);
      expect(labels).toContain(CV);
    });

    test('should include professional qualifications', () => {
      const labels = DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS.map(qual => qual.label);
      
      expect(labels).toContain('CMIOSH');
      expect(labels).toContain('gradIOSH');
      expect(labels).toContain('NEBOSH');
      expect(labels).toContain('Other');
    });
  });

  describe('DEFAULT_ENVIRONMENTAL array', () => {
    test('should export DEFAULT_ENVIRONMENTAL as array', () => {
      expect(Array.isArray(DEFAULT_ENVIRONMENTAL)).toBe(true);
      expect(DEFAULT_ENVIRONMENTAL).toHaveLength(5);
    });

    test('should include environmental constants', () => {
      const labels = DEFAULT_ENVIRONMENTAL.map(env => env.label);
      
      expect(labels).toContain(ENVIROMENTAL_POLICY_STATEMENT);
      expect(labels).toContain(ENVIROMENTAL_ADVICE);
      expect(labels).toContain(SUSTAINABLE_SOURCE_EVIDENCE);
      expect(labels).toContain(BS_EN_ISO_14001_2015);
      expect(labels).toContain(NOT_ISO_ACCREDITED);
    });
  });

  describe('DEFAULT_QUALITY array', () => {
    test('should export DEFAULT_QUALITY as array', () => {
      expect(Array.isArray(DEFAULT_QUALITY)).toBe(true);
      expect(DEFAULT_QUALITY).toHaveLength(4);
    });

    test('should include quality-related documents', () => {
      const labels = DEFAULT_QUALITY.map(qual => qual.label);
      
      expect(labels).toContain('Quality policy statement');
      expect(labels).toContain('Modern Slavery policy statement');
      expect(labels).toContain(ISO_90001);
      expect(labels).toContain(NOT_ISO_ACCREDITED);
    });

    test('should include policy statements', () => {
      const policyStatements = DEFAULT_QUALITY
        .filter(qual => qual.label.includes('policy statement'));
      
      expect(policyStatements).toHaveLength(2);
    });
  });

  describe('cross-references and dependencies', () => {
    test('should properly import OTHER from organization module', () => {
      expect(OTHER).toHaveProperty('id', 7);
      expect(OTHER).toHaveProperty('value', 'Other');
      expect(OTHER).toHaveProperty('label', 'Other');
    });

    test('certificate constants should be used in environmental arrays', () => {
      const envLabels = DEFAULT_ENVIRONMENTAL.map(env => env.label);
      const qualityLabels = DEFAULT_QUALITY.map(qual => qual.label);
      
      expect(envLabels).toContain(BS_EN_ISO_14001_2015);
      expect(envLabels).toContain(NOT_ISO_ACCREDITED);
      expect(qualityLabels).toContain(ISO_90001);
      expect(qualityLabels).toContain(NOT_ISO_ACCREDITED);
    });

    test('policy constants should be used in management system', () => {
      const mgmtLabels = DEFAULT_MANAGEMENT_SYSTEM.map(sys => sys.label);
      
      expect(mgmtLabels).toContain(DATA_PROTECTION_POLICY);
      expect(mgmtLabels).toContain(ANTI_BRIBERY_POLICY);
    });

    test('schedule constants should be used in insurances', () => {
      const insLabels = DEFAULT_INSURANCES.map(ins => ins.label);
      
      expect(insLabels).toContain(SCHEDULE_LIABILITY);
      expect(insLabels).toContain(SCHEDULE_INDEMNITY);
    });
  });

  describe('data integrity', () => {
    test('all default arrays should have sequential IDs starting from 1', () => {
      const arrays = [
        DEFAULT_INSURANCES,
        DEFAULT_MANAGEMENT_SYSTEM,
        DEFAULT_EXAMPLE_DOCUMENTS,
        DEFAULT_HEALTH_SAFETY,
        DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS,
        DEFAULT_ENVIRONMENTAL,
        DEFAULT_QUALITY,
      ];
      
      arrays.forEach(array => {
        const items = array.filter(item => item !== OTHER);
        const ids = items.map(item => item.id);
        const sortedIds = [...ids].sort((a, b) => a - b);
        
        expect(ids).toEqual(sortedIds);
        expect(ids[0]).toBe(1);
      });
    });

    test('all arrays should contain objects with consistent structure', () => {
      const arrays = [
        DEFAULT_INSURANCES,
        DEFAULT_MANAGEMENT_SYSTEM,
        DEFAULT_EXAMPLE_DOCUMENTS,
        DEFAULT_HEALTH_SAFETY,
        DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS,
        DEFAULT_ENVIRONMENTAL,
        DEFAULT_QUALITY,
      ];
      
      arrays.forEach(array => {
        array.forEach(item => {
          if (item !== OTHER) {
            expect(typeof item.id).toBe('number');
            expect(typeof item.label).toBe('string');
            expect(typeof item.value).toBe('string');
            expect(item.label).toBe(item.value);
          }
        });
      });
    });
  });
});