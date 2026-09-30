import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import IfsLinkedProjectInfo from './IfsLinkedProjectInfo';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

describe('IfsLinkedProjectInfo', () => {
  const linkedProject = {
    id: 7,
    external_id: 'IFS-PRJ-0042',
    project_code: 'MCL-0042',
    project_name: 'Riverside Depot Refurbishment',
    business_unit_code: '10',
    business_unit_name: 'London',
  };

  it('renders linked IFS metadata and only disables IFS project name', () => {
    render(<IfsLinkedProjectInfo linkedProject={linkedProject} loading={false} />);

    expect(screen.getByText('ifs-linked-project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('IFS-PRJ-0042')).not.toBeDisabled();
    expect(screen.getByDisplayValue('MCL-0042')).not.toBeDisabled();
    expect(screen.getByDisplayValue('Riverside Depot Refurbishment')).toBeDisabled();
    expect(screen.getByDisplayValue('10 - London')).not.toBeDisabled();
  });

  it('renders nothing while loading', () => {
    const { container } = render(
      <IfsLinkedProjectInfo linkedProject={linkedProject} loading />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no linked project exists', () => {
    const { container } = render(
      <IfsLinkedProjectInfo linkedProject={null} loading={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
