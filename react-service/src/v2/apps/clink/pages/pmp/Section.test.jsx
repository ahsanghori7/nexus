import React from 'react';
import { render, screen } from '@testing-library/react';
import Section from './Section';

// Mock the imported components
jest.mock('./general-info', () => () => (
  <div data-testid="project-form">Project Form</div>
));
jest.mock('v2/apps/clink/pages/team-manager', () => () => (
  <div data-testid="team-manager">Team Manager</div>
));
jest.mock('./project-details', () => () => (
  <div data-testid="project-details">Project Form</div>
));
jest.mock('v1/edit-project/components/package-collator', () => () => (
  <div data-testid="package-collator">Package Collator</div>
));
jest.mock('v1/edit-project/components/tender-builder', () => () => (
  <div data-testid="tender-builder">Tender Builder</div>
));

describe('Section component', () => {
  it('renders ProjectForm when activeStep is 0', () => {
    render(<Section activeStep={0} />);
    expect(screen.getByTestId('project-form')).toBeInTheDocument();
  });

  it('renders TeamManager when activeStep is 1', () => {
    render(<Section activeStep={1} />);
    expect(screen.getByTestId('team-manager')).toBeInTheDocument();
  });

  it('renders ProjectDetails when activeStep is 2', () => {
    render(<Section activeStep={2} />);
    expect(screen.getByTestId('project-details')).toBeInTheDocument();
  });

  it('renders PackageCollator when activeStep is 3', () => {
    render(<Section activeStep={3} />);
    expect(screen.getByTestId('package-collator')).toBeInTheDocument();
  });

  it('renders TenderBuilder when activeStep is 4', () => {
    render(<Section activeStep={4} />);
    expect(screen.getByTestId('tender-builder')).toBeInTheDocument();
  });

  it('renders "Not found" when activeStep is not recognized', () => {
    render(<Section activeStep={99} />);
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });
});
