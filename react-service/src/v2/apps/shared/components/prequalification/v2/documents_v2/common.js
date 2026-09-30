import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import {
  TYPES,
  BS_EN_ISO_14001_2015,
  SUSTAINABLE_SOURCE_EVIDENCE,
  ENVIROMENTAL_POLICY_STATEMENT,
  ENVIROMENTAL_ADVICE,
  NOT_ISO_ACCREDITED,
  DATA_PROTECTION_POLICY,
  ANTI_BRIBERY_POLICY,
  UKAS,
  OTHER_CERTIFICATE_DOC,
  CV,
} from 'v2/helpers/prequal/documents';
import Accreditations from './inputs/Accreditations';
import Environmental from './inputs/Environmental';
import ExampleDocuments from './inputs/ExampleDocuments';
import HealthSafety from './inputs/HealthSafety';
import HealthSafetyEnvironmentalQualifications from './inputs/HealthSafetyEnvironmentalQualifications';
import Insurances from './inputs/Insurances';
import ManagementSystem from './inputs/ManagementSystem';
import Quality from './inputs/Quality';

const {
  alcumus,
  chas,
  considerate,
  constructiOnline,
  smas,
  isoLogoRegisteredTrademarkOG,
  ohas18001,
  iconCertificateGray,
  iconInsuranceDarkgray,
  // new icons
  // Enviromental
  fscLogoOG,
  // Health, Safety & Environmental Qualifications
  ioshLogoOG,
  neboshLogoOG,
  // Management System Procedures
  UKASManagemntSystemLogoOG,
  // Acreditations
  ifcAccOG,
  asfpLogoOG,
  firasOG,
  ssipLogoOG,
} = CONSTANTS.s3;

const createDocObj = (data, section) => {
  const extraDocuments = {};
  if (data?.extra && data?.extra?.length) {
    const { extra } = data;
    extra.forEach((i) => {
      const inputName = `document-${i.id || i.certificate}`;
      extraDocuments[inputName] = [
        {
          id: i.id,
          inputName,
          label: i.label,
          original_file: i.original_file,
          document: i.file,
        },
      ];
    });
  }
  return {
    section,
    id: data ? data.id : '',
    label: data ? data.label : '',
    date: data ? data.date : '',
    price: data ? data.price : '',
    description: data ? data.description : null,
    document:
      data && data.document
        ? [
            {
              original_file: data.original_file,
              document: data.document,
            },
          ]
        : [],
    ...extraDocuments,
  };
};

const getDocumentsInputs = (type = '') => {
  if (type) {
    switch (type) {
      case TYPES.INS:
        return {
          title: i18next.t('insurances'),
          description: i18next.t('insurances-desc'),
          Inputs: Insurances,
          showValue: true,
          showExpiration: true,
          showRequestedBy: true,
          defaultIcon: iconInsuranceDarkgray,
        };
      case TYPES.ACC:
        return {
          title: i18next.t('accreditations'),
          description: i18next.t('accreditation-desc'),
          Inputs: Accreditations,
          showValue: false,
          showExpiration: true,
          showRequestedBy: true,
          icon: {
            'Safe Contractor': alcumus,
            SafeContractor: alcumus,
            CHAS: chas,
            'Considerate Constructors': considerate,
            Constructionline: constructiOnline,
            SMAS: smas,
            'Acclaim SSiP': ssipLogoOG,
            FIRAS: firasOG,
            ASFP: asfpLogoOG,
            'IFC Certification': ifcAccOG,
          },
          defaultIcon: iconCertificateGray,
        };
      case TYPES.MAN:
        return {
          title: i18next.t('management-system-procedures'),
          description: i18next.t('management-system-procedures-desc'),
          Inputs: ManagementSystem,
          showValue: false,
          showExpiration: true,
          showRequestedBy: true,
          icon: {
            'ISO 14001:2015': isoLogoRegisteredTrademarkOG,
            'ISO 9001:2015': isoLogoRegisteredTrademarkOG,
            'OHSAS 18001': ohas18001,
            [DATA_PROTECTION_POLICY]: iconCertificateGray,
            [ANTI_BRIBERY_POLICY]: iconCertificateGray,
            [UKAS]: UKASManagemntSystemLogoOG,
          },
          expiration: {
            [DATA_PROTECTION_POLICY]: false,
            [ANTI_BRIBERY_POLICY]: false,
            [UKAS]: false,
          },
          defaultIcon: iconInsuranceDarkgray,
        };
      case TYPES.HS:
        return {
          title: i18next.t('health-safety'),
          description: i18next.t('health-safety-desc'),
          Inputs: HealthSafety,
          showValue: false,
          showExpiration: false,
          showRequestedBy: true,
          icon: null,
          money: {
            [SUSTAINABLE_SOURCE_EVIDENCE]: false,
            [ENVIROMENTAL_POLICY_STATEMENT]: false,
            [ENVIROMENTAL_ADVICE]: false,
            [NOT_ISO_ACCREDITED]: false,
          },
          defaultIcon: iconInsuranceDarkgray,
        };
      case TYPES.HSEQ:
        return {
          title: i18next.t('health-safety-environmental-qualifications'),
          description: i18next.t(
            'health-safety-environmental-qualifications-desc',
          ),
          Inputs: HealthSafetyEnvironmentalQualifications,
          showValue: false,
          showExpiration: true,
          showRequestedBy: true,
          icon: {
            CMIOSH: ioshLogoOG,
            gradIOSH: ioshLogoOG,
            NEBOSH: neboshLogoOG,
          },
          money: {
            [OTHER_CERTIFICATE_DOC]: false,
          },
          expiration: {
            [CV]: false,
          },
          defaultIcon: iconCertificateGray,
        };
      case TYPES.EN:
        return {
          title: i18next.t('environmental'),
          description: i18next.t('environmental-desc'),
          Inputs: Environmental,
          showValue: false,
          showExpiration: true,
          showRequestedBy: true,
          icon: {
            [BS_EN_ISO_14001_2015]: isoLogoRegisteredTrademarkOG,
            [SUSTAINABLE_SOURCE_EVIDENCE]: fscLogoOG,
          },
          expiration: {
            [SUSTAINABLE_SOURCE_EVIDENCE]: false,
            [ENVIROMENTAL_POLICY_STATEMENT]: false,
            [ENVIROMENTAL_ADVICE]: false,
            [NOT_ISO_ACCREDITED]: false,
          },
          defaultIcon: iconInsuranceDarkgray,
        };
      case TYPES.QU:
        return {
          title: i18next.t('quality'),
          description: i18next.t('quality-desc'),
          Inputs: Quality,
          showValue: false,
          showExpiration: false,
          showRequestedBy: true,
          icon: {
            'IS0 9001': isoLogoRegisteredTrademarkOG,
            'ISO 90001': isoLogoRegisteredTrademarkOG,
            'IS0 90001': isoLogoRegisteredTrademarkOG,
          },
          expiration: {
            'IS0 9001': true,
            'ISO 90001': true,
            'IS0 90001': true,
          },
          defaultIcon: iconCertificateGray,
        };
      case TYPES.ED:
        return {
          title: i18next.t('example-documents'),
          description: i18next.t('example-documents-desc'),
          Inputs: ExampleDocuments,
          showValue: false,
          showExpiration: false,
          showRequestedBy: true,
          defaultIcon: iconInsuranceDarkgray,
        };
      default:
        return null;
    }
  }

  return null;
};

export { getDocumentsInputs };
export default createDocObj;
