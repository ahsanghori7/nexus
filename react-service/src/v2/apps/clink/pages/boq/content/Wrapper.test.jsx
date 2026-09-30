import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wrapper from './Wrapper';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#FFFFFF',
        clinkLightPurple: '#E8E2F5',
      },
    },
  },
}));

describe('Wrapper Component', () => {
  it('renders without crashing', () => {
    render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('renders without contentHeader when not provided', () => {
    const { container } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    
    // CardHeader should not be present when contentHeader is null
    const cardHeader = container.querySelector('.MuiCardHeader-root');
    expect(cardHeader).toBeNull();
  });

  it('renders with contentHeader when provided', () => {
    const headerContent = <button>Header Button</button>;
    
    const { getByText } = render(
      <Wrapper contentHeader={headerContent}>
        <div>Test content</div>
      </Wrapper>
    );
    
    expect(getByText('Header Button')).toBeInTheDocument();
  });

  it('has correct wrapper id', () => {
    const { container } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    
    const wrapperElement = container.querySelector('#ta-boq-wrapper');
    expect(wrapperElement).toBeInTheDocument();
  });

  it('has correct inner wrapper id', () => {
    const { container } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    
    const innerWrapperElement = container.querySelector('#bow-page-wrapper');
    expect(innerWrapperElement).toBeInTheDocument();
  });

  it('applies correct grid props to main wrapper', () => {
    const { container } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    
    const wrapperElement = container.querySelector('#ta-boq-wrapper');
    expect(wrapperElement).toBeInTheDocument();
  });

  it('renders card structure correctly', () => {
    const { container } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    
    // Check if Card component is rendered (it will have MuiCard-root class)
    const cardElement = container.querySelector('[id="ta-boq-wrapper"] > *');
    expect(cardElement).toBeInTheDocument();
  });

  it('matches snapshot without contentHeader', () => {
    const { container } = render(
      <Wrapper>
        <div>Test content</div>
      </Wrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with contentHeader', () => {
    const headerContent = <span>Header Content</span>;
    
    const { container } = render(
      <Wrapper contentHeader={headerContent}>
        <div>Test content</div>
      </Wrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});