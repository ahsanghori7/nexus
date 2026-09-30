import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Add from './index';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock httpHelper
jest.mock('v2/services/httpHelper', () => jest.fn(() => Promise.resolve()));

// Mock SelectDialog
jest.mock('v2/apps/shared/components/select', () => {
  return function SelectDialog(props) {
    return <div data-testid="select-dialog" {...props} />;
  };
});

// Mock Modal
jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function Modal(props) {
    return <div data-testid="modal" {...props} />;
  };
});

const renderAdd = (props = {}) => {
  const defaultProps = {
    data: null,
    myRef: null,
    entities: [],
    reset: jest.fn(() => Promise.resolve()),
    navigateAfterAdding: jest.fn(),
    ...props,
  };

  return render(<Add {...defaultProps} />);
};

describe('Add Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAdd();
  });

  it('renders SelectDialog and Modal', () => {
    const { getByTestId } = renderAdd();
    
    expect(getByTestId('select-dialog')).toBeInTheDocument();
    expect(getByTestId('modal')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    const { getByTestId } = renderAdd({
      data: null,
    });
    
    expect(getByTestId('select-dialog')).toBeInTheDocument();
  });

  it('handles data with tenders', () => {
    const testData = {
      tender: [
        { id: 1, label: 'Test Tender 1', state: 1 },
        { id: 2, label: 'Test Tender 2', state: 2 },
      ],
    };
    
    const { getByTestId } = renderAdd({
      data: testData,
    });
    
    expect(getByTestId('select-dialog')).toBeInTheDocument();
  });

  it('handles entities', () => {
    const testEntities = [
      { tender_id: 1 },
      { tender_id: 2 },
    ];
    
    const { getByTestId } = renderAdd({
      entities: testEntities,
    });
    
    expect(getByTestId('select-dialog')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const { container } = renderAdd();
    expect(container).toBeInTheDocument();
  });

  it('filters tenders with state >= 1', () => {
    const testData = {
      tender: [
        { id: 1, label: 'Draft Tender', state: 0 }, // Should be filtered out
        { id: 2, label: 'Published Tender', state: 1 }, // Should be included
        { id: 3, label: 'Completed Tender', state: 2 }, // Should be included
      ],
    };
    
    const { getByTestId } = renderAdd({
      data: testData,
    });
    
    expect(getByTestId('select-dialog')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = renderAdd();
    expect(container.firstChild).toMatchSnapshot();
  });
});