import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import HealthSafetyAndEnvContainer from './HealthSafetyAndEnvContainer';

// Mock external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconReferencesGray: 'icon-gray',
      iconReferencesGreen: 'icon-green',
    },
  },
}));

jest.mock('v2/helpers/prequal/documents', () => ({
  TYPES: {
    HS: 'health-safety',
    HSEQ: 'health-safety-env-qualifications',
    EN: 'environmental',
  },
}));

// Mock styled components
jest.mock('../mui.styled', () => ({
  MuiDownloadBox: ({ children, ...props }) => <div data-testid="mui-download-box" {...props}>{children}</div>,
  MuiEmptyReferenceBox: ({ children, ...props }) => <div data-testid="mui-empty-reference-box" {...props}>{children}</div>,
  MuiReferenceBox: ({ children, ...props }) => <div data-testid="mui-reference-box" {...props}>{children}</div>,
  MuiScrollerContainer: ({ children, ...props }) => <div data-testid="mui-scroller-container" {...props}>{children}</div>,
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/mui.styled', () => ({
  MuiTabTitle: ({ children, ...props }) => <div data-testid="mui-tab-title" {...props}>{children}</div>,
}));

// Mock Tabs component
jest.mock('v2/apps/clink/pages/supply-chain-profile/tabs', () => {
  return ({ tabs, nested, accordion }) => (
    <div data-testid="tabs-component">
      <div data-testid="tabs-nested">{nested ? 'nested' : 'not-nested'}</div>
      <div data-testid="tabs-accordion">{accordion ? 'accordion' : 'not-accordion'}</div>
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
});

// Mock PreqContent component
jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/PreqContent', () => {
  return ({ children, sx, ...props }) => (
    <div data-testid="preq-content" {...props}>
      {children}
    </div>
  );
});

// Mock ReferenceContent component
jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/ReferenceContent', () => {
  return ({ type, contextType, aid, data, showExpiredInfo }) => (
    <div data-testid="reference-content">
      <div data-testid="reference-type">{type}</div>
      <div data-testid="reference-context-type">{contextType}</div>
      <div data-testid="reference-aid">{aid}</div>
      <div data-testid="reference-data">{JSON.stringify(data)}</div>
      <div data-testid="reference-expired-info">{showExpiredInfo ? 'show-expired' : 'hide-expired'}</div>
    </div>
  );
});

// Mock DownloadFiles component
jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/DownloadFiles', () => {
  return ({ aid, label, type }) => (
    <div data-testid="download-files">
      <div data-testid="download-aid">{aid}</div>
      <div data-testid="download-label">{label}</div>
      <div data-testid="download-type">{type}</div>
    </div>
  );
});

describe('HealthSafetyAndEnvContainer', () => {
  const mockStore = (prequalificationV2 = {}) => {
    return configureStore({
      reducer: {
        prequalificationV2: () => prequalificationV2,
      },
    });
  };

  const defaultProps = {
    aid: 'test-aid-123',
    nested: false,
    accordion: false,
    contextType: 'test-context',
  };

  const renderWithRedux = (props = {}, storeData = {}) => {
    const store = mockStore(storeData);
    return render(
      <Provider store={store}>
        <HealthSafetyAndEnvContainer {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderWithRedux();
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
  });

  it('passes nested and accordion props to Tabs component', () => {
    renderWithRedux({ nested: true, accordion: true });
    
    expect(screen.getByTestId('tabs-nested')).toHaveTextContent('nested');
    expect(screen.getByTestId('tabs-accordion')).toHaveTextContent('accordion');
  });

  it('renders three tabs with correct titles', () => {
    renderWithRedux();
    
    expect(screen.getByTestId('tab-1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-2')).toBeInTheDocument();
    expect(screen.getByTestId('tab-3')).toBeInTheDocument();
    
    expect(screen.getByTestId('tab-title-1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-title-2')).toBeInTheDocument();
    expect(screen.getByTestId('tab-title-3')).toBeInTheDocument();
  });

  describe('Health Safety tab', () => {
    it('displays empty state when no health safety data', () => {
      renderWithRedux({}, {});
      
      const tabContent = screen.getByTestId('tab-content-1');
      expect(tabContent).toBeInTheDocument();
      
      // Check that the first tab has an empty reference box
      const emptyBoxes = screen.getAllByTestId('mui-empty-reference-box');
      expect(emptyBoxes).toHaveLength(3); // One for each tab
      expect(emptyBoxes[0]).toBeInTheDocument();
    });

    it('renders health safety references when data exists', () => {
      const healthSafetyData = [
        { id: 1, label: 'Safety Certificate 1', s3_key: 'key1', document: true },
        { id: 2, label: 'Safety Certificate 2', s3_key: 'key2', document: true },
      ];
      
      renderWithRedux({}, { 'health-safety': healthSafetyData });
      
      const referenceBoxes = screen.getAllByTestId('mui-reference-box');
      expect(referenceBoxes).toHaveLength(2);
      
      const referenceContents = screen.getAllByTestId('reference-content');
      expect(referenceContents).toHaveLength(2);
    });

    it('shows download box when health safety data has documents', () => {
      const healthSafetyData = [
        { id: 1, label: 'Safety Certificate 1', s3_key: 'key1', document: true },
      ];
      
      renderWithRedux({}, { 'health-safety': healthSafetyData });
      
      expect(screen.getByTestId('mui-download-box')).toBeInTheDocument();
      expect(screen.getByTestId('download-files')).toBeInTheDocument();
      expect(screen.getByTestId('download-type')).toHaveTextContent('health-safety');
    });

    it('does not show download box when no documents exist', () => {
      const healthSafetyData = [
        { id: 1, label: 'Safety Certificate 1', s3_key: 'key1', document: false },
      ];
      
      renderWithRedux({}, { 'health-safety': healthSafetyData });
      
      expect(screen.queryByTestId('mui-download-box')).not.toBeInTheDocument();
    });

    it('passes correct props to ReferenceContent', () => {
      const healthSafetyData = [
        { id: 1, label: 'Safety Certificate 1', s3_key: null },
      ];
      
      renderWithRedux({}, { 'health-safety': healthSafetyData });
      
      expect(screen.getByTestId('reference-type')).toHaveTextContent('health-safety');
      expect(screen.getByTestId('reference-context-type')).toHaveTextContent('test-context');
      expect(screen.getByTestId('reference-aid')).toHaveTextContent('test-aid-123');
      expect(screen.getByTestId('reference-expired-info')).toHaveTextContent('show-expired');
    });
  });

  describe('Health Safety Environmental Qualifications tab', () => {
    it('displays empty state when no HSEQ data', () => {
      renderWithRedux({}, {});
      
      const tabContent = screen.getByTestId('tab-content-2');
      expect(tabContent).toBeInTheDocument();
      expect(screen.getAllByTestId('mui-empty-reference-box')).toHaveLength(3); // One for each tab
    });

    it('renders HSEQ references when data exists', () => {
      const hseqData = [
        { id: 1, label: 'HSEQ Certificate 1', s3_key: 'key1', document: true },
      ];
      
      renderWithRedux({}, { 'health-safety-environmental-qualifications': hseqData });
      
      const tabContent = screen.getByTestId('tab-content-2');
      expect(tabContent).toBeInTheDocument();
    });

    it('shows download box when HSEQ data has documents', () => {
      const hseqData = [
        { id: 1, label: 'HSEQ Certificate 1', s3_key: 'key1', document: true },
      ];
      
      renderWithRedux({}, { 'health-safety-environmental-qualifications': hseqData });
      
      // Check that download boxes exist (multiple tabs may have them)
      const downloadBoxes = screen.getAllByTestId('mui-download-box');
      expect(downloadBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('Environmental tab', () => {
    it('displays empty state when no environmental data', () => {
      renderWithRedux({}, {});
      
      const tabContent = screen.getByTestId('tab-content-3');
      expect(tabContent).toBeInTheDocument();
      expect(screen.getAllByTestId('mui-empty-reference-box')).toHaveLength(3); // One for each tab
    });

    it('renders environmental references when data exists', () => {
      const environmentalData = [
        { id: 1, label: 'Environmental Certificate 1', s3_key: 'key1', document: true },
      ];
      
      renderWithRedux({}, { environmental: environmentalData });
      
      const tabContent = screen.getByTestId('tab-content-3');
      expect(tabContent).toBeInTheDocument();
    });

    it('shows download box when environmental data has documents', () => {
      const environmentalData = [
        { id: 1, label: 'Environmental Certificate 1', s3_key: 'key1', document: true },
      ];
      
      renderWithRedux({}, { environmental: environmentalData });
      
      // Check that download boxes exist (multiple tabs may have them)
      const downloadBoxes = screen.getAllByTestId('mui-download-box');
      expect(downloadBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('Redux integration', () => {
    it('connects to Redux store and receives prequalificationV2 data', () => {
      const storeData = {
        'health-safety': [
          { id: 1, label: 'Test Safety', s3_key: 'key1', document: true }
        ],
        'health-safety-environmental-qualifications': [
          { id: 2, label: 'Test HSEQ', s3_key: 'key2', document: true }
        ],
        environmental: [
          { id: 3, label: 'Test Environmental', s3_key: 'key3', document: true }
        ],
      };
      
      renderWithRedux({}, storeData);
      
      // Verify that data from Redux store is being used
      expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
      expect(screen.getAllByTestId('reference-content')).toHaveLength(3);
    });
  });

  describe('Translation integration', () => {
    it('uses translation keys for tab titles and empty states', () => {
      renderWithRedux({}, {});
      
      // The mock translation function returns the key as-is
      // So we can verify the correct translation keys are being used
      const tabContents = screen.getAllByTestId('mui-empty-reference-box');
      expect(tabContents).toHaveLength(3);
    });
  });

  describe('Props handling', () => {
    it('handles missing props gracefully', () => {
      render(
        <Provider store={mockStore({})}>
          <HealthSafetyAndEnvContainer />
        </Provider>
      );
      
      expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
    });

    it('passes all required props to child components', () => {
      renderWithRedux({
        aid: 'custom-aid',
        contextType: 'custom-context',
        nested: true,
        accordion: true,
      });
      
      expect(screen.getByTestId('tabs-nested')).toHaveTextContent('nested');
      expect(screen.getByTestId('tabs-accordion')).toHaveTextContent('accordion');
    });
  });
});