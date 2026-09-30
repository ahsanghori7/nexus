import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TenderDateModal from './TenderDateModal';

jest.mock('v2/helpers/date', () => ({
  getProperDates: jest.fn((start, end) => [Number(start), Number(end)]),
}));

jest.mock('./Form', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-form" />),
}));

jest.mock('./index', () => {
  const MockDependencyForm = jest.fn(function () {
    return {
      initialValues: {},
      formFields: [],
      validationSchema: {},
    };
  });

  return {
    __esModule: true,
    default: MockDependencyForm,
  };
});

describe('TenderDateModal', () => {
  const defaultProps = {
    tid: 1,
    modalHeadText: 'Set dependency',
    onInputClick: jest.fn(),
    init: jest.fn(),
    selectedTenders: [
      {
        id: '1',
        label: 'Current Tender',
        start_on_site: 1,
        tender_return: 1,
      },
      {
        id: '2',
        label: 'Later Tender',
        start_on_site: 2,
        tender_return: 2,
      },
    ],
    date: 0,
    currentDependencies: {},
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Set dependency button when there are no current dependencies', () => {
    render(<TenderDateModal {...defaultProps} />);

    const actionButton = screen.getByRole('button', { name: /Set dependency/i });
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(defaultProps.modalHeadText)).toBeInTheDocument();
  });

  it('renders Edit dependency button when current dependencies exist', () => {
    const currentDependencies = {
      1: [
        {
          tender_child_id: '2',
          tender_dependency_child_key: 0,
          tender_dependency_key: 0,
        },
      ],
    };

    render(
      <TenderDateModal
        {...defaultProps}
        currentDependencies={currentDependencies}
      />
    );

    expect(screen.getByRole('button', { name: /Edit dependency/i })).toBeInTheDocument();
  });

  it('returns null when current tender is not found', () => {
    const { container } = render(
      <TenderDateModal {...defaultProps} tid={999} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
