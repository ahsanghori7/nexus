import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateActionsButtons from 'apps/clink/pages/tender-templates/actionButtons';

// Mocks
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('react-redux', () => ({ useDispatch: () => jest.fn() }));
jest.mock('hooks/context', () => ({ useContext: () => ({ actions: { deleteTenderTemplate: jest.fn() } }) }));
jest.mock('v2/helpers/url', () => ({ getUrl: () => '/mock-url' }));
jest.mock('v2/constants/colors', () => ({ clinkGreen: '#00ff00' }));
jest.mock('@mui/material/Button', () => {
  const ReactActual = jest.requireActual('react');
  return ReactActual.forwardRef((props, ref) => <button ref={ref} {...props} />);
});
jest.mock('@mui/material/Box', () => (props) => <div {...props} />);
jest.mock('@mui/material/Typography', () => (props) => <span {...props} />);
jest.mock('@mui/material/Dialog', () => (props) => props.open ? <div data-testid="dialog">{props.children}</div> : null);
jest.mock('@mui/material/DialogActions', () => (props) => <div {...props} />);
jest.mock('@mui/material/DialogContent', () => (props) => <div {...props} />);
jest.mock('@mui/material/DialogTitle', () => (props) => <div {...props} />);
jest.mock('@mui/material/DialogContentText', () => (props) => <div {...props} />);
jest.mock('@mui/material/Tooltip', () => (props) => <div {...props} />);
jest.mock('@mui/material/IconButton', () => {
  const ReactActual = jest.requireActual('react');
  return ReactActual.forwardRef((props, ref) => <button ref={ref} {...props} />);
});
jest.mock('@mui/material/Snackbar', () => (props) => props.open ? <div data-testid="snackbar">{props.children}</div> : null);
jest.mock('@mui/material/Alert', () => (props) => <div {...props} />);
jest.mock('v1/global/public/images/svg/bin-icon.svg', () => () => <svg data-testid="delete-icon" />);
jest.mock('v1/global/public/images/svg/icon-view.svg', () => () => <svg data-testid="view-icon" />);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const defaultProps = {
  tid: '1',
  id: '2',
  pid: '3',
  item: { status: 1, name: 'Test Template' },
  loadTemplates: jest.fn(),
};

describe('TemplateActionsButtons', () => {
  it('renders without crashing', () => {
    render(<TemplateActionsButtons {...defaultProps} />);
    expect(screen.getByTestId('view-icon')).toBeInTheDocument();
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('opens delete dialog on delete button click', () => {
    render(<TemplateActionsButtons {...defaultProps} />);
    fireEvent.click(screen.getByTestId('delete-icon').closest('button'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('shows snackbar when status is 3 and view clicked', () => {
    render(<TemplateActionsButtons {...defaultProps} item={{ status: 3, name: 'Test Template' }} />);
    fireEvent.click(screen.getByTestId('view-icon').closest('button'));
    expect(screen.getByTestId('snackbar')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<TemplateActionsButtons {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
