import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import PreqDocsAndRefs from './PreqDocsAndRefs';

// Mock child components
jest.mock('v2/apps/clink/pages/supply-chain-profile/tabs', () => {
  return function Tabs({ tabs, nested, accordion }) {
    return (
      <div data-testid="tabs" data-nested={nested} data-accordion={accordion}>
        {tabs.map((tab) => (
          <div key={tab.id} data-testid={`tab-${tab.id}`}>
            <div data-testid={`tab-title-${tab.id}`}>{tab.title}</div>
            <div data-testid={`tab-content-${tab.id}`}>
              <tab.Content />
            </div>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/PreqContent', () => {
  return function PreqContent({ children, sx, ...props }) {
    return (
      <div data-testid="preq-content" {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/insurance/Content', () => {
  return function InsuranceContent({ country, aid, data }) {
    return (
      <div data-testid="insurance-content" data-aid={aid} data-country={country}>
        {data.label} - {data.id}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/ReferenceContent', () => {
  return function ReferenceContent({ type, contextType, aid, data, showExpiredInfo }) {
    return (
      <div data-testid="reference-content" data-aid={aid} data-type={type} data-context-type={contextType} data-show-expired={showExpiredInfo}>
        {data.label} - {data.id}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/accreditation/Content', () => {
  return function AccreditationContent({ accordion, aid, data }) {
    return (
      <div data-testid="accreditation-content" data-aid={aid} data-accordion={accordion}>
        {data.label} - {data.id}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/management-system/Content', () => {
  return function ManagerSystemContent({ accordion, aid, data }) {
    return (
      <div data-testid="management-system-content" data-aid={aid} data-accordion={accordion}>
        {data.label} - {data.id}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/DownloadFiles', () => {
  return function DownloadFiles({ aid, label, type }) {
    return (
      <div data-testid="download-files" data-aid={aid} data-type={type}>
        {label}
      </div>
    );
  };
});

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'insurances': 'Insurances',
        'preq-references': 'References',
        'accreditations': 'Accreditations',
        'management-system': 'Management System',
        'download-insurances-files': 'Download Insurance Files',
        'download-accreditations-files': 'Download Accreditation Files',
        'download-files': 'Download Files',
        'user-has-no-approved-1': 'User has no approved ',
        'user-has-no-approved-2': ' documents',
      };
      return translations[key] || key;
    },
  }),
}));

const mockStore = configureMockStore([thunk]);

describe('PreqDocsAndRefs', () => {
  const defaultProps = {
    aid: 'test-aid-123',
    nested: false,
    accordion: false,
    contextType: 'test-context',
  };

  const createMockState = (overrides = {}) => ({
    prequalificationV2: {
      insurances: [
        { id: 1, label: 'Insurance 1', date: '2023-01-01' },
        { id: 2, label: 'Insurance 2', date: null },
      ],
      references: [
        { id: 1, label: 'Reference 1', status: 'approved' },
        { id: 2, label: 'Reference 2', status: 'pending' },
        { id: 3, label: 'Reference 3', status: 'approved' },
      ],
      accreditation: [
        { id: 1, label: 'Accreditation 1', date: '2023-01-01' },
        { id: 2, label: 'Accreditation 2', date: null },
      ],
      'custom-certificate': [
        { id: 3, label: 'Custom Certificate 1', date: null },
      ],
      'management-system': [
        { id: 1, label: 'Management System 1', date: '2023-01-01' },
      ],
      ...overrides,
    },
    clinkAccount: {
      country: 'US',
    },
  });

  const renderComponent = (props = {}, stateOverrides = {}) => {
    const store = mockStore(createMockState(stateOverrides));
    return render(
      <Provider store={store}>
        <PreqDocsAndRefs {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
  });

  it('renders tabs component with correct props', () => {
    const { getByTestId } = renderComponent({ nested: true, accordion: true });
    
    const tabs = getByTestId('tabs');
    expect(tabs).toBeInTheDocument();
    expect(tabs).toHaveAttribute('data-nested', 'true');
    expect(tabs).toHaveAttribute('data-accordion', 'true');
  });

  it('renders all four tabs', () => {
    const { getByTestId } = renderComponent();
    
    expect(getByTestId('tab-1')).toBeInTheDocument(); // Insurances
    expect(getByTestId('tab-2')).toBeInTheDocument(); // References
    expect(getByTestId('tab-3')).toBeInTheDocument(); // Accreditations
    expect(getByTestId('tab-4')).toBeInTheDocument(); // Management System
  });

  it('renders insurance content correctly', () => {
    const { getAllByTestId } = renderComponent();
    
    const insuranceContents = getAllByTestId('insurance-content');
    expect(insuranceContents).toHaveLength(2);
    
    expect(insuranceContents[0]).toHaveAttribute('data-aid', 'test-aid-123');
    expect(insuranceContents[0]).toHaveAttribute('data-country', 'US');
    expect(insuranceContents[0]).toHaveTextContent('Insurance 1 - 1');
  });

  it('renders download files for insurances when there are files with dates', () => {
    const { getAllByTestId } = renderComponent();
    
    const downloadFiles = getAllByTestId('download-files');
    const insuranceDownload = downloadFiles.find(element => 
      element.getAttribute('data-type') === 'insurances'
    );
    
    expect(insuranceDownload).toBeInTheDocument();
    expect(insuranceDownload).toHaveAttribute('data-type', 'insurances');
    expect(insuranceDownload).toHaveTextContent('Download Insurance Files');
  });

  it('renders only approved references', () => {
    const { getAllByTestId } = renderComponent();
    
    const referenceContents = getAllByTestId('reference-content');
    expect(referenceContents).toHaveLength(2); // Only approved ones
    
    expect(referenceContents[0]).toHaveTextContent('Reference 1 - 1');
    expect(referenceContents[1]).toHaveTextContent('Reference 3 - 3');
  });

  it('renders empty message when no approved references', () => {
    const { container } = renderComponent({}, {
      references: [
        { id: 1, label: 'Reference 1', status: 'pending' },
      ],
    });
    
    expect(container.textContent).toContain('User has no approved References documents');
  });

  it('renders accreditation and custom certificate content', () => {
    const { getAllByTestId } = renderComponent();
    
    const accreditationContents = getAllByTestId('accreditation-content');
    expect(accreditationContents).toHaveLength(3); // 2 accreditations + 1 custom certificate
    
    expect(accreditationContents[0]).toHaveTextContent('Accreditation 1 - 1');
    expect(accreditationContents[2]).toHaveTextContent('Custom Certificate 1 - 3');
  });

  it('renders management system content', () => {
    const { getAllByTestId } = renderComponent();
    
    const managementSystemContents = getAllByTestId('management-system-content');
    expect(managementSystemContents).toHaveLength(1);
    
    expect(managementSystemContents[0]).toHaveTextContent('Management System 1 - 1');
  });

  it('handles empty data gracefully', () => {
    const { getByTestId } = renderComponent({}, {
      insurances: null,
      references: null,
      accreditation: null,
      'custom-certificate': null,
      'management-system': null,
    });
    
    expect(getByTestId('tabs')).toBeInTheDocument();
  });

  it('passes contextType to reference content', () => {
    const { getAllByTestId } = renderComponent({ contextType: 'custom-context' });
    
    const referenceContents = getAllByTestId('reference-content');
    expect(referenceContents[0]).toHaveAttribute('data-context-type', 'custom-context');
  });

  it('handles accordion and nested props correctly', () => {
    const { getAllByTestId } = renderComponent({ accordion: true, nested: true });
    
    const accreditationContents = getAllByTestId('accreditation-content');
    expect(accreditationContents[0]).toHaveAttribute('data-accordion', 'true');
    
    const managementSystemContents = getAllByTestId('management-system-content');
    expect(managementSystemContents[0]).toHaveAttribute('data-accordion', 'true');
  });
});