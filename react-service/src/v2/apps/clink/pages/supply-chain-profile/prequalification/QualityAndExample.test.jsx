import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import QualityAndExample from './QualityAndExample';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock nested components
jest.mock('v2/apps/clink/pages/supply-chain-profile/tabs', () => {
  return function MockTabs({ tabs }) {
    return (
      <div data-testid="mock-tabs">
        {tabs?.map((tab, index) => (
          <div key={tab.id || index} data-testid="tab">
            <div data-testid="tab-title">{tab.title}</div>
            <div data-testid="tab-content">
              {tab.Content && <tab.Content />}
            </div>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/PreqContent', () => {
  return function MockPreqContent({ children, ...props }) {
    return <div data-testid="preq-content" {...props}>{children}</div>;
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/content/ReferenceContent', () => {
  return function MockReferenceContent({ type, aid, data }) {
    return (
      <div data-testid="reference-content">
        Reference: {data?.label} (Type: {type}, AID: {aid})
      </div>
    );
  };
});

jest.mock('v2/apps/clink/pages/supply-chain-profile/prequalification/DownloadFiles', () => {
  return function MockDownloadFiles({ aid, label, type }) {
    return (
      <div data-testid="download-files">
        Download: {label} (Type: {type}, AID: {aid})
      </div>
    );
  };
});

const mockStore = configureStore([thunk]);

describe('QualityAndExample', () => {
  const defaultProps = {
    aid: 'test-aid',
    nested: false,
    accordion: false,
    contextType: 'test-context'
  };

  const createStore = (prequalificationV2 = {}) => {
    return mockStore({
      prequalificationV2: {
        'example-documents': [],
        quality: [],
        ...prequalificationV2
      }
    });
  };

  it('renders without crashing', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <QualityAndExample {...defaultProps} />
      </Provider>
    );
  });

  it('renders with quality documents', () => {
    const quality = [
      { id: 1, label: 'Quality Doc 1', s3_key: 'key1', document: true },
      { id: 2, label: 'Quality Doc 2', s3_key: 'key2', document: true }
    ];
    
    const store = createStore({ quality });
    const { getByText } = render(
      <Provider store={store}>
        <QualityAndExample {...defaultProps} />
      </Provider>
    );

    expect(getByText('Reference: Quality Doc 1 (Type: quality, AID: test-aid)')).toBeInTheDocument();
    expect(getByText('Reference: Quality Doc 2 (Type: quality, AID: test-aid)')).toBeInTheDocument();
  });

  it('renders with example documents', () => {
    const exampleDocuments = [
      { id: 3, label: 'Example Doc 1', s3_key: 'key3', document: true },
      { id: 4, label: 'Example Doc 2', s3_key: 'key4', document: true }
    ];
    
    const store = createStore({ 'example-documents': exampleDocuments });
    const { getByText } = render(
      <Provider store={store}>
        <QualityAndExample {...defaultProps} />
      </Provider>
    );

    expect(getByText('Reference: Example Doc 1 (Type: example-documents, AID: test-aid)')).toBeInTheDocument();
    expect(getByText('Reference: Example Doc 2 (Type: example-documents, AID: test-aid)')).toBeInTheDocument();
  });

  it('renders empty state when no documents', () => {
    const store = createStore();
    const { getByText } = render(
      <Provider store={store}>
        <QualityAndExample {...defaultProps} />
      </Provider>
    );

    expect(getByText('user-has-no-approved-1preq-qualitiesuser-has-no-approved-2.')).toBeInTheDocument();
    expect(getByText('user-has-no-approved-1preq-example-documentsuser-has-no-approved-2.')).toBeInTheDocument();
  });

  it('shows download button when documents have files', () => {
    const quality = [
      { id: 1, label: 'Quality Doc 1', document: true }
    ];
    const exampleDocuments = [
      { id: 2, label: 'Example Doc 1', document: true }
    ];
    
    const store = createStore({ quality, 'example-documents': exampleDocuments });
    const { getAllByText } = render(
      <Provider store={store}>
        <QualityAndExample {...defaultProps} />
      </Provider>
    );

    const downloadElements = getAllByText(/Download: download-files \(Type: (quality|example-documents), AID: test-aid\)/);
    expect(downloadElements).toHaveLength(2); // One for quality, one for examples
  });

  it('handles nested and accordion props', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <QualityAndExample 
          {...defaultProps} 
          nested={true} 
          accordion={true} 
        />
      </Provider>
    );
    
    // Component should render without issues with these props
    expect(document.querySelector('[data-testid="mock-tabs"]')).toBeInTheDocument();
  });
});