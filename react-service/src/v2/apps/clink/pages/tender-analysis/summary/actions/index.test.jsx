import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Actions from './index';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/apps/clink/pages/orders/subcontractors/modal', () => {
  return function MockModal({ open, setOpen, children }) {
    return open ? (
      <div data-testid="mock-modal">
        <button onClick={() => setOpen(false)} data-testid="close-modal">
          Close
        </button>
        {children}
      </div>
    ) : null;
  };
});

jest.mock('./Form', () => {
  return function MockForm({ quoteInfo, orderTemplates, setOpen }) {
    return (
      <div data-testid="mock-form">
        <div data-testid="form-quote-info">{JSON.stringify(quoteInfo)}</div>
        <div data-testid="form-order-templates">{JSON.stringify(orderTemplates)}</div>
        <button onClick={() => setOpen(false)} data-testid="form-close">
          Close Form
        </button>
      </div>
    );
  };
});

jest.mock('./Menu', () => {
  return function MockMenu({ quoteInfo, pid, entity }) {
    return (
      <div data-testid="mock-menu">
        <div data-testid="menu-quote-info">{JSON.stringify(quoteInfo)}</div>
        <div data-testid="menu-pid">{pid}</div>
        <div data-testid="menu-entity">{JSON.stringify(entity)}</div>
      </div>
    );
  };
});

describe('Actions', () => {
  const mockQuoteInfo = {
    id: 1,
    order_created: false,
    subcontractor: { name: 'Test Contractor' },
  };

  const mockOrderTemplates = [
    { id: 1, name: 'Template 1' },
    { id: 2, name: 'Template 2' },
  ];

  const mockEntity = { id: 123, name: 'Test Entity' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton when no order templates', () => {
    render(<Actions quoteInfo={mockQuoteInfo} orderTemplates={[]} />);
    
    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows skeleton when order templates is null', () => {
    render(<Actions quoteInfo={mockQuoteInfo} orderTemplates={null} />);
    
    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();
  });

  it('shows skeleton when order templates is undefined', () => {
    render(<Actions quoteInfo={mockQuoteInfo} />);
    
    expect(screen.getByTestId('mui-skeleton')).toBeInTheDocument();
  });

  it('renders issue order button when order not created and not awarded', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    const issueOrderButton = screen.getByRole('button', { name: 'issue-order' });
    expect(issueOrderButton).toBeInTheDocument();
    expect(issueOrderButton).toHaveAttribute('type', 'button');
  });

  it('does not render issue order button when order already created', () => {
    const quoteWithOrder = { ...mockQuoteInfo, order_created: true };
    
    render(
      <Actions
        quoteInfo={quoteWithOrder}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    expect(screen.queryByRole('button', { name: 'issue-order' })).not.toBeInTheDocument();
  });

  it('does not render issue order button when awarded is true', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={true}
        entity={mockEntity}
      />
    );

    expect(screen.queryByRole('button', { name: 'issue-order' })).not.toBeInTheDocument();
  });

  it('always renders Menu component', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    expect(screen.getByTestId('mock-menu')).toBeInTheDocument();
    expect(screen.getByTestId('menu-quote-info')).toHaveTextContent(JSON.stringify(mockQuoteInfo));
    expect(screen.getByTestId('menu-pid')).toHaveTextContent('123');
    expect(screen.getByTestId('menu-entity')).toHaveTextContent(JSON.stringify(mockEntity));
  });

  it('opens modal when issue order button is clicked', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    const issueOrderButton = screen.getByRole('button', { name: 'issue-order' });
    fireEvent.click(issueOrderButton);

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mock-form')).toBeInTheDocument();
  });

  it('passes correct props to Form in modal', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    const issueOrderButton = screen.getByRole('button', { name: 'issue-order' });
    fireEvent.click(issueOrderButton);

    expect(screen.getByTestId('form-quote-info')).toHaveTextContent(JSON.stringify(mockQuoteInfo));
    expect(screen.getByTestId('form-order-templates')).toHaveTextContent(JSON.stringify(mockOrderTemplates));
  });

  it('modal is not visible initially', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    // Open modal
    const issueOrderButton = screen.getByRole('button', { name: 'issue-order' });
    fireEvent.click(issueOrderButton);
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('handles default props correctly', () => {
    render(<Actions orderTemplates={mockOrderTemplates} />);
    
    // Should render with default empty object props
    expect(screen.getByTestId('mock-menu')).toBeInTheDocument();
    expect(screen.getByTestId('menu-quote-info')).toHaveTextContent('{}');
    expect(screen.getByTestId('menu-pid')).toHaveTextContent('0');
    expect(screen.getByTestId('menu-entity')).toHaveTextContent('{}');
  });

  it('handles both order_created and awarded being true', () => {
    const quoteWithOrder = { ...mockQuoteInfo, order_created: true };
    
    render(
      <Actions
        quoteInfo={quoteWithOrder}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={true}
        entity={mockEntity}
      />
    );

    expect(screen.queryByRole('button', { name: 'issue-order' })).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-menu')).toBeInTheDocument();
  });

  it('opens modal with correct state structure', () => {
    render(
      <Actions
        quoteInfo={mockQuoteInfo}
        orderTemplates={mockOrderTemplates}
        pid={123}
        awarded={false}
        entity={mockEntity}
      />
    );

    const issueOrderButton = screen.getByRole('button', { name: 'issue-order' });
    fireEvent.click(issueOrderButton);

    // Modal should be open (tested by presence of modal component)
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    
    // The openModal function sets specific state that would be used by real Modal
    // We can test this indirectly by verifying the modal opens
  });
});