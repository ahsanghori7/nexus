const helpers = require('./helpers');

let configJson = {};
const confFileName = './config.json';
try {
  configJson = require(confFileName);
} catch (e) {
  const title = '[ERROR]: found problem with config.json file';
  helpers.printError(title, e);
  return;
}

module.exports = {
  testEnvironment: '<rootDir>/jest.environment.js',
  testEnvironmentOptions: {
    // Configure jsdom to skip canvas resources
    resources: 'usable',
    // Disable canvas to avoid native module issues
    pretendToBeVisual: false,
  },
  extensionsToTreatAsEsm: ['.jsx', '.tsx'],
  moduleDirectories: ['helpers', 'node_modules'],
  modulePathIgnorePatterns: ['<rootDir>/tests/', '<rootDir>/tests-examples/'],
  transformIgnorePatterns: [
    'node_modules/(?!(quill|react-quill|clink-components|@mui|@hookform|react-pdf|pdfjs-dist)/)',
  ],
  moduleNameMapper: {
    // V2 path mappings should come first to avoid conflicts
    '^apps/admin/router$': '<rootDir>/__mocks__/mockAdminRouter.js',
    '^v2/services/relay$': '<rootDir>/__mocks__/mockRelay.js',
    '^v2/apps/admin/pages/prosper/Accounts/company/Theme.styled$':
      '<rootDir>/__mocks__/mockProsperThemeStyled.js',
    '^v2/hooks/context$': '<rootDir>/__mocks__/hooks/context.js',
    '^v2/apps/admin/pages/clink/Contractors$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/clink/Contractors.js',
    '^v2/apps/admin/pages/clink/Projects$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/clink/Projects.js',
    '^v2/apps/admin/pages/clink/Accounts$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/clink/Accounts.js',
    '^v2/apps/admin/pages/prosper/Accounts$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/prosper/Accounts.js',
    '^v2/apps/admin/pages/clink/Accounts/tabs$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/clink/Accounts/tabs.js',
    '^v2/apps/admin/pages/prosper/Accounts/tabs$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/prosper/Accounts/tabs.js',
    '^v2/apps/admin/pages/clink/Features/tabs$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/clink/Features/tabs.js',
    '^v2/apps/admin/pages/clink/Features/Actions$':
      '<rootDir>/__mocks__/v2/apps/admin/pages/clink/Features/Actions.jsx',
    '^v2/helpers/status/enquiries$':
      '<rootDir>/__mocks__/v2/helpers/status/enquiries.js',
    '^v2/helpers/url$': '<rootDir>/__mocks__/v2/helpers/url.js',
    '^v2/helpers/php-globals$': '<rootDir>/__mocks__/v2/helpers/php-globals.js',
    '^v2/helpers/user/subscription$':
      '<rootDir>/__mocks__/v2/helpers/user/subscription.js',
    '^v2/assets/icons$': '<rootDir>/__mocks__/v2/assets/icons.js',
    '^v2/apps/clink/pages/login/mui.styled$':
      '<rootDir>/__mocks__/v2/apps/clink/pages/login/mui.styled.jsx',
    '^v2/apps/clink/layout/navbar/HeaderIcon$':
      '<rootDir>/__mocks__/v2/apps/clink/layout/navbar/HeaderIcon.jsx',
    '^v2/apps/clink/pages/pmp/general-info/mocks/general-info-setup$':
      '<rootDir>/__mocks__/v2/apps/clink/pages/pmp/general-info/general-info-setup.js',
    '^v2/apps/clink/pages/pmp/add-project/mocks/add-project-setup$':
      '<rootDir>/__mocks__/v2/apps/clink/pages/pmp/add-project/add-project-setup.js',
    '^v2/apps/shared/components/Alert$':
      '<rootDir>/__mocks__/mockFlashMessage.js',
    '^v2/apps/widgets/opportunity-viewer$':
      '<rootDir>/__mocks__/v2/apps/widgets/opportunity-viewer.jsx',
    '^v2/apps/clink/pages/pmp/project-details/mocks/project-details-setup$':
      '<rootDir>/__mocks__/mockProjectDetailsSetup.js',
    '^v2/apps/shared/components/prequalification/v2/form/SwitchBox$':
      '<rootDir>/__mocks__/v2/apps/shared/components/prequalification/v2/form/SwitchBox.jsx',
    '^v2/apps/shared/components/cards/prosper/DashboardCard$':
      '<rootDir>/__mocks__/mockProsperDashboardCard.js',
    '^v2/apps/shared/components/cards/big/registered-card$':
      '<rootDir>/__mocks__/mockRegisteredCard.js',
    '^v2/apps/prosper/pages/projects/filters/Filter$':
      '<rootDir>/__mocks__/mockFilter.js',
    '^v2/apps/shared/components/Loading$': '<rootDir>/__mocks__/mockLoading.js',
    '^v2/apps/prosper/shared/load_more$': '<rootDir>/__mocks__/mockLoadMore.js',
    '^v2/apps/prosper/pages/projects/filters$':
      '<rootDir>/__mocks__/mockFilters.js',
    '^v2/apps/prosper/pages/projects/Container.styled$':
      '<rootDir>/__mocks__/mockContainer.js',
    '^v2/apps/prosper/pages/projects/Opportunities.styled$':
      '<rootDir>/__mocks__/mockOpportunities.js',
    '^v2/apps/prosper/pages/projects/FilterHeader$':
      '<rootDir>/__mocks__/mockFilterHeader.js',
    '^v2/apps/prosper/pages/projects/OpportunitiesHeader$':
      '<rootDir>/__mocks__/v2/apps/prosper/pages/projects/OpportunitiesHeader.js',
    '^v2/apps/shared/components/cards/big/OpportunityCard$':
      '<rootDir>/__mocks__/mockOpportunityCard.js',
    '^v2/apps/admin/ActionsDropdown$':
      '<rootDir>/__mocks__/mockActionsDropdownComponent.js',
    '^v2/apps/shared/components/confirm-modal$':
      '<rootDir>/__mocks__/mockConfirmModal.js',
    // Prosper resources page specific mocks
    '^v2/constants/wistia$': '<rootDir>/__mocks__/mockWistiaConstants.js',
    '^hooks/useScript$': '<rootDir>/__mocks__/mockUseScript.js',
    '^v2/helpers/user/subscription$':
      '<rootDir>/__mocks__/mockSubscriptionHelper.js',
    '^v2/apps/shared/styled/LandingPage.styled$':
      '<rootDir>/__mocks__/mockProsperLandingPageStyled.js',
    '^v2/apps/shared/styled/Page.styled$':
      '<rootDir>/__mocks__/mockProsperPageStyled.js',
    '^v2/apps/prosper/shared/TokenModal$':
      '<rootDir>/__mocks__/mockProsperSharedComponents.js',
    '^v2/apps/prosper/shared/carousel$':
      '<rootDir>/__mocks__/mockProsperSharedComponents.js',
    '^v2/apps/prosper/shared/carousel/ArrowButton$':
      '<rootDir>/__mocks__/mockProsperSharedComponents.js',
    '^v2/apps/prosper/shared/ButtonWrapper$':
      '<rootDir>/__mocks__/mockProsperSharedComponents.js',
    // Prequalification v2 component mocks
    '^v2/apps/shared/components/tabs$':
      '<rootDir>/__mocks__/mockPrequalificationV2Components.js',
    '^v2/apps/shared/components/prequalification/v2/documents_v2$':
      '<rootDir>/__mocks__/mockPrequalificationV2Components.js',
    '^v2/apps/shared/components/prequalification/v2/references$':
      '<rootDir>/__mocks__/mockPrequalificationV2Components.js',
    '^v2/apps/shared/components/prequalification/v2/finance$':
      '<rootDir>/__mocks__/mockPrequalificationV2Components.js',
    '^v2/apps/shared/components/prequalification/v2/organization$':
      '<rootDir>/__mocks__/mockPrequalificationV2Components.js',
    '^v2/apps/shared/components/company-v2/Mui.styled$':
      '<rootDir>/__mocks__/mockPrequalificationV2Components.js',
    // Helper mocks
    '^v2/helpers/currency$': '<rootDir>/__mocks__/mockCurrencyHelpers.js',
    '^v2/helpers/date$': '<rootDir>/__mocks__/mockDateHelpers.js',
    '^v2/apps/prosper/pages/projects/enquiries_v2/components/CitationModal$':
      '<rootDir>/__mocks__/v2/apps/prosper/pages/projects/enquiries_v2/components/CitationModal.jsx',
    '^v2(.*)$': '<rootDir>/src/v2$1',
    // Store and app mappings
    '^store(.*)$': '<rootDir>/src/v2/store$1',
    '^apps(.*)$': '<rootDir>/src/v2/apps$1',
    '^assets(.*)$': '<rootDir>/src/v2/assets$1',
    '^helpers(.*)$': '<rootDir>/src/v2/helpers$1',
    '^constants(.*)$': '<rootDir>/src/v2/constants$1',
    '^hooks(.*)$': '<rootDir>/src/v2/hooks$1',
    '^services(.*)$': '<rootDir>/src/v2/services$1',
    '^v1(.*)$': '<rootDir>/src/v1$1',
    '^project-dashboard/mockSetup$':
      '<rootDir>/__mocks__/v2/apps/clink/pages/project-dashboard/mockSetup.js',
    '^component-lib(.*)$': '<rootDir>/src/component-lib$1',
    // Updated clink-components mapping to support exact and wildcard imports
    '^clink-components$': '<rootDir>/__mocks__/clink-components.jsx',
    '^clink-components/(.*)$': '<rootDir>/src/clink-components/$1',
    // Add mock for construction-link react components
    '^@construction-link/react-components$':
      '<rootDir>/__mocks__/@construction-link/react-components.js',
    // Updated regex patterns for MUI component mocking
    '^@mui/material$': '<rootDir>/__mocks__/@mui/material/index.jsx',
    // Specific mock for Modal due to resolver issues with $1
    '^@mui/material/Modal$': '<rootDir>/__mocks__/@mui/material/Modal.jsx',
    // Specific mock for AppBar
    '^@mui/material/AppBar$': '<rootDir>/__mocks__/@mui/material/AppBar.jsx',
    // Specific mock for Toolbar
    '^@mui/material/Toolbar$': '<rootDir>/__mocks__/@mui/material/Toolbar.jsx',
    '^@mui/material/(.*)$': '<rootDir>/__mocks__/@mui/material/$1',
    '^@mui/icons-material$': '<rootDir>/__mocks__/@mui/icons-material/index.js',
    '^@mui/icons-material/(.*)$': '<rootDir>/__mocks__/@mui/icons-material/$1',
    // Mock for MUI x-date-pickers
    '^@mui/x-date-pickers$': '<rootDir>/__mocks__/@mui/x-date-pickers.js',
    '^@mui/x-date-pickers/(.*)$': '<rootDir>/__mocks__/@mui/x-date-pickers/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '^quill$': '<rootDir>/__mocks__/quill.js',
    '^react-quill$': '<rootDir>/__mocks__/react-quill.js',
    '^react-pdf$': '<rootDir>/__mocks__/react-pdf.js',
    '^canvas$': '<rootDir>/__mocks__/canvas.js',
  },
  setupFiles: [],
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.jsx'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.styled.{js,jsx}',
    '!src/**/index.styled.{js,jsx}',
    '!src/**/styled.{js,jsx}',
    '!src/**/style.{js,jsx}',
    '!src/**/styles.{js,jsx}',
    '!src/**/*.style.{js,jsx}',
    '!src/**/*.styles.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.styled.{js,jsx}',
    '!src/**/index.styled.{js,jsx}',
    '!src/**/styled.{js,jsx}',
    '!src/**/style.{js,jsx}',
    '!src/**/styles.{js,jsx}',
    '!src/**/*.style.{js,jsx}',
    '!src/**/*.styles.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/v1/**/*.{js,jsx}', // Add this line to exclude v1
    'src/v1/supply-chain-v2/components/page/header/form-subcontractor/autocomplete-shared.jsx',
    'src/v1/supply-chain-v2/components/page/header/form-subcontractor/useSearchableMultiSelect.js',
    'src/v1/supply-chain-v2/components/page/header/form-subcontractor/SearchableMultiSelectField.jsx',
    'src/v1/supply-chain-v2/services/index.js',
    'src/v1/global/services/plan-my-project/add-dependency/TenderDateModal.jsx',
    'src/v1/quotes-tender/components/page/package/analyse/buildQuoteAnalysisSummaryModalNavTitle.js',
    'src/v1/quotes-tender/components/page/package/analyse/buildLevelingReadyContent.js',
    'src/v1/quotes-tender/components/page/package/analyse/downloadAnalysisExport.js',
    'src/v1/document-creator/components/page/FileManagerModal.jsx',
    'src/v1/document-creator/components/template/docusign/Title.jsx',
    'src/v1/document-creator/components/template/index.jsx',
    'src/v1/document-creator/components/page/header/index.jsx',
    'src/v1/document-creator/components/page/header/RejectedOrdersPanel.jsx',
    'src/v1/procurement-schedule/components/page/packages/ShortlistedSubcontractorsTable.jsx',
    // Barrel/entry files with no testable logic
    '!src/v2/hooks/context/config/clink/forecastTable/index.js',
    '!src/v2/hooks/context/config/clink/instructionsVariationsTable/index.js',
    '!src/v2/hooks/context/config/clink/table/index.js',
    '!src/v2/apps/widgets/index.jsx',
    // App entry points
    '!src/v2/apps/clink/index.jsx',
    '!src/v2/apps/prosper/index.jsx',
    // Slice index files with no functions (only re-export actions)
    '!src/v2/store/reducers/clink/instructions/index.js',
    '!src/v2/store/reducers/clink/instructions/documents/index.js',
    '!src/v2/store/reducers/clink/analyse-quote/index.js',
    '!src/v2/store/reducers/clink/orders/index.js',
    '!src/v2/store/reducers/clink/quotes-tender/index.js',
    '!src/v2/store/reducers/common/opportunities/index.js',
    '!src/v2/apps/prosper/pages/projects/enquiries_v2/components/CitationModal.jsx',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
    // Large, mostly-untested legacy component re-included in collectCoverageFrom
    // purely so its (small amount of) new-code coverage shows up for SonarQube.
    // Excluded from the 70% global gate here so it doesn't drag that average
    // down; matching files are checked against their own (trivial) threshold
    // instead of being folded into "global".
    'src/v1/document-creator/components/template/index.jsx': {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
  globals: {
    ...configJson,
    ENV: 'testing',
    BASE_URLS: {
      ...configJson.BASE_URLS,
      ADMIN_LOGIN: '/admin/login',
      SIGN_UP: '/sign-up',
      DASHBOARD: '/dashboard',
      LOGIN: '/login',
      PROSPER_DASHBOARD: '/prosper/dashboard',
      SITE_PROSPER: 'https://prosper.example.com',
      S3_URL: 'https://s3.example.com',
    },
  },
  resolver: '<rootDir>/resolver.js',
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      },
    ],
  },
};
