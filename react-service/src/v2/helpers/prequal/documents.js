import { OTHER } from 'v2/helpers/prequal/organization';

const TYPES = {
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

const SECTIONS = {
  INF: 'company_information',
  ORG: 'organisation',
  TUR: 'turnover',
  REF: 'references',
  ...TYPES,
};

const CUSTOM_CERTIFICATE = 'custom-certificate';
const NOT_ISO_ACCREDITED = 'not ISO Accredited';
const ISO_90001 = 'IS0 90001'; // TODO: to be vigilant about the change between IS0 and ISO
const BS_EN_ISO_14001_2015 = 'BS EN ISO 14001:2015';
const OTHER_CERTIFICATE_DOC = 'Other';
const SUSTAINABLE_SOURCE_EVIDENCE = 'Sustainable Source Evidence';
const ENVIROMENTAL_POLICY_STATEMENT = 'Environmental policy statement';
const ENVIROMENTAL_ADVICE = 'Environmental advice';
const DATA_PROTECTION_POLICY = 'Data Protection Policy';
const ANTI_BRIBERY_POLICY = 'Anti Bribery Policy';
const UKAS = 'UKAS';
const CV = 'CV for Health and Safety Manager / Consultant';

const SCHEDULE_INDEMNITY = 'Schedule Professional Indemnity';
const SCHEDULE_LIABILITY = 'Schedule Public Liability';
const STATEMENT_FACT = 'Statement of Fact';
const POLICY_WORDING = 'Policy wording';
const DEFAULT_INSURANCES = [
  {
    id: 1,
    label: 'Employers Liability',
    value: 'Employers Liability',
    request: false,
  },
  {
    id: 2,
    label: 'Public Liability',
    value: 'Public Liability',
    request: false,
  },
  {
    id: 3,
    label: 'Products Liability',
    value: 'Products Liability',
    request: false,
  },
  {
    id: 4,
    label: 'Professional Indemnity',
    value: 'Professional Indemnity',
    request: false,
  },
  {
    id: 5,
    label: SCHEDULE_LIABILITY,
    value: SCHEDULE_LIABILITY,
    request: false,
  },
  {
    id: 6,
    label: SCHEDULE_INDEMNITY,
    value: SCHEDULE_INDEMNITY,
    request: false,
  },
];

const DEFAULT_ACCREDITATIONS = [
  { id: 1, label: 'Constructionline', value: 'Constructionline' },
  { id: 2, label: 'Safe Contractor', value: 'Safe Contractor' },
  { id: 3, label: 'CHAS', value: 'CHAS' },
  { id: 4, label: 'SMAS', value: 'SMAS' },
  {
    id: 5,
    label: 'Considerate Constructors',
    value: 'Considerate Constructors',
  },
  OTHER,
  {
    id: 7,
    label: 'Acclaim SSiP',
    value: 'Acclaim SSiP',
  },
  { id: 8, label: 'FIRAS', value: 'FIRAS' },
  { id: 9, label: 'ASFP', value: 'ASFP' },
  {
    id: 10,
    label: 'IFC Certification',
    value: 'IFC Certification',
  },
];

const DEFAULT_MANAGEMENT_SYSTEM = [
  { id: 1, label: 'ISO 9001:2015', value: 'ISO 9001:2015' },
  { id: 2, label: 'ISO 14001:2015', value: 'ISO 14001:2015' },
  { id: 3, label: 'OHSAS 18001', value: 'OHSAS 18001' },
  {
    id: 4,
    label: DATA_PROTECTION_POLICY,
    value: DATA_PROTECTION_POLICY,
  },
  {
    id: 5,
    label: ANTI_BRIBERY_POLICY,
    value: ANTI_BRIBERY_POLICY,
  },
  { id: 6, label: UKAS, value: UKAS },
];

const DEFAULT_EXAMPLE_DOCUMENTS = [
  {
    id: 1,
    label: 'Quality assessment evidence',
    value: 'Quality assessment evidence',
  },
  { id: 2, label: 'Sample Method Statement', value: 'Sample Method Statement' },
  {
    id: 3,
    label: 'Sample Risk Assessment (for a specific task)',
    value: 'Sample Risk Assessment (for a specific task)',
  },
  { id: 4, label: 'Accident Reporting Form', value: 'Accident Reporting Form' },
];

const DEFAULT_HEALTH_SAFETY = [
  { id: 1, label: 'Health & safety policy', value: 'Health & safety policy' },
  {
    id: 2,
    label: 'Health & safety policy statement',
    value: 'Health & safety policy statement',
  },
  { id: 3, label: 'Health & safety manual', value: 'Health & safety manual' },
];

const DEFAULT_HEALTH_SAFETY_ENVIRONMENTAL_QUALIFICATIONS = [
  {
    id: 1,
    label: CV,
    value: CV,
  },
  { id: 2, label: 'CMIOSH', value: 'CMIOSH' },
  { id: 3, label: 'gradIOSH', value: 'gradIOSH' },
  { id: 4, label: 'NEBOSH', value: 'NEBOSH' },
  { id: 5, label: 'Other', value: 'Other' },
];

// TODO: when release is done, check if these objects need to be removed or not
const DEFAULT_ENVIRONMENTAL = [
  {
    id: 1,
    label: ENVIROMENTAL_POLICY_STATEMENT,
    value: ENVIROMENTAL_POLICY_STATEMENT,
  },
  {
    id: 2,
    label: ENVIROMENTAL_ADVICE,
    value: ENVIROMENTAL_ADVICE,
  },
  {
    id: 3,
    label: SUSTAINABLE_SOURCE_EVIDENCE,
    value: SUSTAINABLE_SOURCE_EVIDENCE,
  },
  { id: 4, label: BS_EN_ISO_14001_2015, value: BS_EN_ISO_14001_2015 },
  { id: 5, label: NOT_ISO_ACCREDITED, value: NOT_ISO_ACCREDITED },
];

const DEFAULT_QUALITY = [
  {
    id: 1,
    label: 'Quality policy statement',
    value: 'Quality policy statement',
  },
  {
    id: 2,
    label: 'Modern Slavery policy statement',
    value: 'Modern Slavery policy statement',
  },
  {
    id: 3,
    label: ISO_90001,
    value: ISO_90001,
  },
  { id: 4, label: NOT_ISO_ACCREDITED, value: NOT_ISO_ACCREDITED },
];
export {
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
};
