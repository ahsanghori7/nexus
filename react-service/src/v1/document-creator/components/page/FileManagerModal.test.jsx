import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileManagerModal from './FileManagerModal';

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: { t: jest.fn((key) => key) },
}));

jest.mock('v1/file-manager/components/page', () => ({
  __esModule: true,
  default: () => <div data-testid="file-manager-mock" />,
}));

jest.mock('v1/file-manager/components/page/archived-modal', () => ({
  __esModule: true,
  default: () => <div data-testid="archived-modal-mock" />,
}));

describe('FileManagerModal', () => {
  const projectData = {
    tender: [{ id: 1, label: 'Tender A' }],
  };

  it('renders null when no matching tender is found', () => {
    const { container } = render(
      <FileManagerModal projectData={projectData} defaultTender={999} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('opens the file manager via the default HeaderButton', () => {
    render(
      <FileManagerModal
        projectData={projectData}
        defaultTender={1}
        testIdSuffix="header"
      />,
    );

    const openButton = screen.getByTestId('open-file-manager-btn-header');
    expect(openButton).toBeInTheDocument();

    fireEvent.click(openButton);

    expect(screen.getByTestId('file-manager-modal-header')).toBeVisible();
    expect(screen.getByTestId('file-manager-mock')).toBeInTheDocument();
  });

  it('opens the file manager via the inline FormButton warning link', () => {
    render(
      <FileManagerModal
        projectData={projectData}
        defaultTender={1}
        formConfig
        testIdSuffix="asset"
      />,
    );

    const openButton = screen.getByTestId('file-manager-open-btn-asset');
    expect(openButton).toBeInTheDocument();

    fireEvent.click(openButton);

    expect(screen.getByTestId('file-manager-modal-asset')).toBeVisible();
    expect(screen.getByTestId('file-manager-mock')).toBeInTheDocument();
  });

  it('opens the file manager via the "Open Appendix" button, which overrides formConfig', () => {
    render(
      <FileManagerModal
        projectData={projectData}
        defaultTender={1}
        formConfig
        buttonDesign
        testIdSuffix="appendix"
      />,
    );

    expect(
      screen.queryByTestId('file-manager-open-btn-appendix'),
    ).not.toBeInTheDocument();

    const openButton = screen.getByTestId('open-appendix-btn-appendix');
    expect(openButton).toBeInTheDocument();
    expect(openButton).toHaveTextContent('Open Appendix');

    fireEvent.click(openButton);

    expect(screen.getByTestId('file-manager-modal-appendix')).toBeVisible();
    expect(screen.getByTestId('file-manager-mock')).toBeInTheDocument();
  });

  it('opens the archived-project modal instead of the file manager when the project is archived', () => {
    render(
      <FileManagerModal
        projectData={{ ...projectData, archived: true }}
        defaultTender={1}
        testIdSuffix="header"
      />,
    );

    const openButton = screen.getByTestId('open-file-manager-btn-header');
    fireEvent.click(openButton);

    expect(screen.getByTestId('archived-modal-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('file-manager-mock')).not.toBeInTheDocument();
  });
});
