import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockStyledTooltip = jest.fn(({ children, arrowPosition, className }) => (
  <div data-testid="tooltip" data-arrow={arrowPosition} className={className}>
    {children}
  </div>
));

jest.mock('../styled', () => ({
  __esModule: true,
  StyledTooltip: (props) => mockStyledTooltip(props),
}));

jest.mock('clink-components', () => {
  const React = require('react');

  const Card = ({ children, ...props }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  );

  const CardBody = ({ children }) => (
    <div data-testid="card-body">{children}</div>
  );

  const CardImage = ({ alt, src, ...props }) => (
    <img data-testid="card-image" alt={alt} src={src} {...props} />
  );

  const CardLink = ({ children, disabled, href }) => (
    <a data-testid="card-link" data-disabled={disabled ? 'true' : 'false'} href={href}>
      {children}
    </a>
  );

  const CardTitle = ({ children }) => (
    <h3 data-testid="card-title">{children}</h3>
  );

  const CardInfoLine = ({ children }) => (
    <div data-testid="card-info-line">{children}</div>
  );

  const Badge = React.forwardRef(({ text, color }, ref) => (
    <div data-testid="badge" data-color={color} ref={ref}>
      {text}
    </div>
  ));

  return {
    __esModule: true,
    Card,
    CardBody,
    CardImage,
    CardLink,
    CardTitle,
    CardInfoLine,
    Badge,
  };
});

import RegisteredCardV1 from './v1';

describe('RegisteredCardV1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders card details with image, registration info, tags, and link', () => {
    // Arrange
    const item = {
      id: 'prj-1',
      name: 'Project Alpha',
      registeredDate: '2023-08-01T00:00:00Z',
      tenderTags: [
        {
          label: 'Roofing',
          created_at: '2023-07-25T00:00:00Z',
          start_on_site: '2023-09-10T00:00:00Z',
          tender_return: '2023-08-20T00:00:00Z',
        },
      ],
      viewProject: '/projects/alpha',
      restricted: false,
    };

    // Act
    render(<RegisteredCardV1 item={item} image="cover.png" />);

    // Assert
    expect(screen.getByTestId('card-image')).toHaveAttribute('src', 'cover.png');
    expect(screen.getByTestId('card-title')).toHaveTextContent('Project Alpha');
    expect(screen.getByText(/registered/)).toBeInTheDocument();
    expect(screen.getByTestId('card-link')).toHaveAttribute(
      'href',
      '/projects/alpha?unlocked_projects',
    );
    expect(screen.getAllByTestId('badge')).toHaveLength(1);
    expect(mockStyledTooltip).toHaveBeenCalled();
    const tooltipProps = mockStyledTooltip.mock.calls[0][0];
    expect(tooltipProps.arrowPosition).toBeDefined();
    expect(screen.getByText((value) => value.includes('label-tender-return-date'))).toBeInTheDocument();
    expect(screen.getByText((value) => value.includes('label-start-on-site-date'))).toBeInTheDocument();
  });

  test('does not render when item is null', () => {
    // Arrange & Act
    const { container } = render(<RegisteredCardV1 item={null} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  test('marks link as disabled when project is restricted and omits badges when no tags', () => {
    // Arrange
    const item = {
      id: 'prj-2',
      name: 'Project Beta',
      registeredDate: null,
      tenderTags: [],
      viewProject: '/projects/beta',
      restricted: true,
    };

    // Act
    render(<RegisteredCardV1 item={item} />);

    // Assert
    expect(screen.getByTestId('card-link')).toHaveAttribute('data-disabled', 'true');
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });
});

