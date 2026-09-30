import createDocObj, { getDocumentsInputs } from './common';
import { TYPES } from 'v2/helpers/prequal/documents';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => `mocked-${key}`,
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      alcumus: 'mocked-alcumus-icon',
      chas: 'mocked-chas-icon',
      considerate: 'mocked-considerate-icon',
      constructiOnline: 'mocked-constructiOnline-icon',
      smas: 'mocked-smas-icon',
      isoLogoRegisteredTrademarkOG: 'mocked-iso-icon',
      ohas18001: 'mocked-ohas-icon',
      iconCertificateGray: 'mocked-certificate-icon',
      iconInsuranceDarkgray: 'mocked-insurance-icon',
      fscLogoOG: 'mocked-fsc-icon',
      ioshLogoOG: 'mocked-iosh-icon',
      neboshLogoOG: 'mocked-nebosh-icon',
      UKASManagemntSystemLogoOG: 'mocked-ukas-icon',
      ifcAccOG: 'mocked-ifc-icon',
      asfpLogoOG: 'mocked-asfp-icon',
      firasOG: 'mocked-firas-icon',
      ssipLogoOG: 'mocked-ssip-icon',
    },
  },
}));

// Mock input components
jest.mock('./inputs/Accreditations', () => 'MockedAccreditations');
jest.mock('./inputs/Environmental', () => 'MockedEnvironmental');
jest.mock('./inputs/ExampleDocuments', () => 'MockedExampleDocuments');
jest.mock('./inputs/HealthSafety', () => 'MockedHealthSafety');
jest.mock('./inputs/HealthSafetyEnvironmentalQualifications', () => 'MockedHealthSafetyEnvironmentalQualifications');
jest.mock('./inputs/Insurances', () => 'MockedInsurances');
jest.mock('./inputs/ManagementSystem', () => 'MockedManagementSystem');
jest.mock('./inputs/Quality', () => 'MockedQuality');

describe('common.js utility functions', () => {
  describe('createDocObj', () => {
    const mockSection = 'test-section';

    it('should create document object with minimal data', () => {
      const data = { id: '123' };
      const result = createDocObj(data, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '123',
        label: undefined,
        date: undefined,
        price: undefined,
        description: undefined,
        document: [],
      });
    });

    it('should create document object with full data', () => {
      const data = {
        id: '456',
        label: 'Test Label',
        date: '2024-01-01',
        price: '1000',
        description: 'Test Description',
        document: 'test-doc.pdf',
        original_file: 'original-test-doc.pdf',
      };
      const result = createDocObj(data, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '456',
        label: 'Test Label',
        date: '2024-01-01',
        price: '1000',
        description: 'Test Description',
        document: [
          {
            original_file: 'original-test-doc.pdf',
            document: 'test-doc.pdf',
          },
        ],
      });
    });

    it('should handle null data', () => {
      const result = createDocObj(null, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '',
        label: '',
        date: '',
        price: '',
        description: null,
        document: [],
      });
    });

    it('should handle undefined data', () => {
      const result = createDocObj(undefined, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '',
        label: '',
        date: '',
        price: '',
        description: null,
        document: [],
      });
    });

    it('should process extra documents with id', () => {
      const data = {
        id: '789',
        extra: [
          {
            id: 'extra-1',
            label: 'Extra Doc 1',
            original_file: 'extra-original-1.pdf',
            file: 'extra-1.pdf',
          },
          {
            id: 'extra-2',
            label: 'Extra Doc 2',
            original_file: 'extra-original-2.pdf',
            file: 'extra-2.pdf',
          },
        ],
      };
      const result = createDocObj(data, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '789',
        label: undefined,
        date: undefined,
        price: undefined,
        description: undefined,
        document: [],
        'document-extra-1': [
          {
            id: 'extra-1',
            inputName: 'document-extra-1',
            label: 'Extra Doc 1',
            original_file: 'extra-original-1.pdf',
            document: 'extra-1.pdf',
          },
        ],
        'document-extra-2': [
          {
            id: 'extra-2',
            inputName: 'document-extra-2',
            label: 'Extra Doc 2',
            original_file: 'extra-original-2.pdf',
            document: 'extra-2.pdf',
          },
        ],
      });
    });

    it('should process extra documents with certificate fallback', () => {
      const data = {
        id: '101',
        extra: [
          {
            certificate: 'cert-1',
            label: 'Certificate Doc 1',
            original_file: 'cert-original-1.pdf',
            file: 'cert-1.pdf',
          },
        ],
      };
      const result = createDocObj(data, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '101',
        label: undefined,
        date: undefined,
        price: undefined,
        description: undefined,
        document: [],
        'document-cert-1': [
          {
            id: undefined,
            inputName: 'document-cert-1',
            label: 'Certificate Doc 1',
            original_file: 'cert-original-1.pdf',
            document: 'cert-1.pdf',
          },
        ],
      });
    });

    it('should handle empty extra array', () => {
      const data = {
        id: '202',
        extra: [],
      };
      const result = createDocObj(data, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '202',
        label: undefined,
        date: undefined,
        price: undefined,
        description: undefined,
        document: [],
      });
    });

    it('should preserve falsy values correctly', () => {
      const data = {
        id: '303',
        label: '',
        date: 0,
        price: false,
        description: '',
      };
      const result = createDocObj(data, mockSection);

      expect(result).toEqual({
        section: mockSection,
        id: '303',
        label: '',
        date: 0,
        price: false,
        description: '',
        document: [],
      });
    });
  });

  describe('getDocumentsInputs', () => {
    it('should return null for empty type', () => {
      expect(getDocumentsInputs('')).toBeNull();
      expect(getDocumentsInputs()).toBeNull();
      expect(getDocumentsInputs(null)).toBeNull();
      expect(getDocumentsInputs(undefined)).toBeNull();
    });

    it('should return null for unknown type', () => {
      expect(getDocumentsInputs('UNKNOWN_TYPE')).toBeNull();
      expect(getDocumentsInputs('INVALID')).toBeNull();
    });

    it('should return insurances configuration for INS type', () => {
      const result = getDocumentsInputs(TYPES.INS);

      expect(result).toEqual({
        title: 'mocked-insurances',
        description: 'mocked-insurances-desc',
        Inputs: 'MockedInsurances',
        showValue: true,
        showExpiration: true,
        showRequestedBy: true,
        defaultIcon: 'mocked-insurance-icon',
      });
    });

    it('should return accreditations configuration for ACC type', () => {
      const result = getDocumentsInputs(TYPES.ACC);

      expect(result).toEqual({
        title: 'mocked-accreditations',
        description: 'mocked-accreditation-desc',
        Inputs: 'MockedAccreditations',
        showValue: false,
        showExpiration: true,
        showRequestedBy: true,
        icon: {
          'Safe Contractor': 'mocked-alcumus-icon',
          SafeContractor: 'mocked-alcumus-icon',
          CHAS: 'mocked-chas-icon',
          'Considerate Constructors': 'mocked-considerate-icon',
          Constructionline: 'mocked-constructiOnline-icon',
          SMAS: 'mocked-smas-icon',
          'Acclaim SSiP': 'mocked-ssip-icon',
          FIRAS: 'mocked-firas-icon',
          ASFP: 'mocked-asfp-icon',
          'IFC Certification': 'mocked-ifc-icon',
        },
        defaultIcon: 'mocked-certificate-icon',
      });
    });

    it('should return management system configuration for MAN type', () => {
      const result = getDocumentsInputs(TYPES.MAN);

      expect(result).toEqual({
        title: 'mocked-management-system-procedures',
        description: 'mocked-management-system-procedures-desc',
        Inputs: 'MockedManagementSystem',
        showValue: false,
        showExpiration: true,
        showRequestedBy: true,
        icon: {
          'ISO 14001:2015': 'mocked-iso-icon',
          'ISO 9001:2015': 'mocked-iso-icon',
          'OHSAS 18001': 'mocked-ohas-icon',
          'Data Protection Policy': 'mocked-certificate-icon',
          'Anti Bribery Policy': 'mocked-certificate-icon',
          UKAS: 'mocked-ukas-icon',
        },
        expiration: {
          'Data Protection Policy': false,
          'Anti Bribery Policy': false,
          UKAS: false,
        },
        defaultIcon: 'mocked-insurance-icon',
      });
    });

    it('should return health safety configuration for HS type', () => {
      const result = getDocumentsInputs(TYPES.HS);

      expect(result).toEqual({
        title: 'mocked-health-safety',
        description: 'mocked-health-safety-desc',
        Inputs: 'MockedHealthSafety',
        showValue: false,
        showExpiration: false,
        showRequestedBy: true,
        icon: null,
        money: {
          'Sustainable Source Evidence': false,
          'Environmental policy statement': false,
          'Environmental advice': false,
          'not ISO Accredited': false,
        },
        defaultIcon: 'mocked-insurance-icon',
      });
    });

    it('should return environmental configuration for EN type', () => {
      const result = getDocumentsInputs(TYPES.EN);

      expect(result).toEqual({
        title: 'mocked-environmental',
        description: 'mocked-environmental-desc',
        Inputs: 'MockedEnvironmental',
        showValue: false,
        showExpiration: true,
        showRequestedBy: true,
        icon: {
          'BS EN ISO 14001:2015': 'mocked-iso-icon',
          'Sustainable Source Evidence': 'mocked-fsc-icon',
        },
        expiration: {
          'Sustainable Source Evidence': false,
          'Environmental policy statement': false,
          'Environmental advice': false,
          'not ISO Accredited': false,
        },
        defaultIcon: 'mocked-insurance-icon',
      });
    });

    it('should return quality configuration for QU type', () => {
      const result = getDocumentsInputs(TYPES.QU);

      expect(result).toEqual({
        title: 'mocked-quality',
        description: 'mocked-quality-desc',
        Inputs: 'MockedQuality',
        showValue: false,
        showExpiration: false,
        showRequestedBy: true,
        icon: {
          'IS0 9001': 'mocked-iso-icon',
          'ISO 90001': 'mocked-iso-icon',
          'IS0 90001': 'mocked-iso-icon',
        },
        expiration: {
          'IS0 9001': true,
          'ISO 90001': true,
          'IS0 90001': true,
        },
        defaultIcon: 'mocked-certificate-icon',
      });
    });

    it('should return health safety environmental qualifications for HSEQ type', () => {
      const result = getDocumentsInputs(TYPES.HSEQ);

      expect(result).toEqual({
        title: 'mocked-health-safety-environmental-qualifications',
        description: 'mocked-health-safety-environmental-qualifications-desc',
        Inputs: 'MockedHealthSafetyEnvironmentalQualifications',
        showValue: false,
        showExpiration: true,
        showRequestedBy: true,
        icon: {
          CMIOSH: 'mocked-iosh-icon',
          gradIOSH: 'mocked-iosh-icon',
          NEBOSH: 'mocked-nebosh-icon',
        },
        money: {
          'Other': false,
        },
        expiration: {
          'CV for Health and Safety Manager / Consultant': false,
        },
        defaultIcon: 'mocked-certificate-icon',
      });
    });

    it('should return example documents configuration for ED type', () => {
      const result = getDocumentsInputs(TYPES.ED);

      expect(result).toEqual({
        title: 'mocked-example-documents',
        description: 'mocked-example-documents-desc',
        Inputs: 'MockedExampleDocuments',
        showValue: false,
        showExpiration: false,
        showRequestedBy: true,
        defaultIcon: 'mocked-insurance-icon',
      });
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle createDocObj with mixed valid and invalid data', () => {
      const data = {
        id: null,
        label: undefined,
        date: '',
        price: 0,
        description: false,
        document: '',
        original_file: null,
      };
      const result = createDocObj(data, 'mixed-section');

      expect(result).toEqual({
        section: 'mixed-section',
        id: null,
        label: undefined,
        date: '',
        price: 0,
        description: false,
        document: [],
      });
    });

    it('should handle createDocObj with complex extra documents', () => {
      const data = {
        id: 'complex-test',
        extra: [
          { id: 'doc1', label: 'Doc 1', file: 'file1.pdf', original_file: 'orig1.pdf' },
          { certificate: 'cert1', label: 'Cert 1', file: 'cert1.pdf', original_file: 'origcert1.pdf' },
          { id: null, label: 'Null ID Doc', file: 'null.pdf', original_file: 'orignull.pdf' },
        ],
      };
      const result = createDocObj(data, 'complex-section');

      expect(result).toHaveProperty('document-doc1');
      expect(result).toHaveProperty('document-cert1');
      expect(result).toHaveProperty('document-undefined'); // null id becomes undefined in the key
      expect(Object.keys(result)).toHaveLength(10); // section, id, label, date, price, description, document + 3 extra
    });

    it('should maintain consistency between createDocObj and getDocumentsInputs', () => {
      // Test that createDocObj works with different section types
      const docObj = createDocObj({ id: 'test' }, TYPES.INS);
      const inputConfig = getDocumentsInputs(TYPES.INS);

      expect(docObj.section).toBe(TYPES.INS);
      expect(inputConfig).not.toBeNull();
      expect(inputConfig.Inputs).toBe('MockedInsurances');
    });
  });
});