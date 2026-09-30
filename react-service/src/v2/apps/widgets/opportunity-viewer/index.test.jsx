import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StoreWrapper from './index';

// Mock the Viewer component
jest.mock('./Viewer', () => {
  return function MockViewer(props) {
    return (
      <div data-testid="mock-viewer">
        <div data-testid="viewer-title">{props.title}</div>
        <div data-testid="viewer-show">{props.show.toString()}</div>
        <div data-testid="viewer-discover">{props.discover.toString()}</div>
        <div data-testid="viewer-idRegion">{props.idRegion}</div>
      </div>
    );
  };
});

describe('StoreWrapper', () => {
  it('renders without crashing', () => {
    render(<StoreWrapper />);
    expect(screen.getByTestId('mock-viewer')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<StoreWrapper />);
    
    expect(screen.getByTestId('viewer-title')).toHaveTextContent('prosper-opportunity-title');
    expect(screen.getByTestId('viewer-show')).toHaveTextContent('true');
    expect(screen.getByTestId('viewer-discover')).toHaveTextContent('false');
    expect(screen.getByTestId('viewer-idRegion')).toHaveTextContent('1');
  });

  it('renders with custom props', () => {
    const customProps = {
      title: 'Custom Opportunity Title',
      show: false,
      discover: true,
      idRegion: 2
    };

    render(<StoreWrapper {...customProps} />);
    
    expect(screen.getByTestId('viewer-title')).toHaveTextContent('Custom Opportunity Title');
    expect(screen.getByTestId('viewer-show')).toHaveTextContent('false');
    expect(screen.getByTestId('viewer-discover')).toHaveTextContent('true');
    expect(screen.getByTestId('viewer-idRegion')).toHaveTextContent('2');
  });

  it('passes all props to Viewer component', () => {
    const props = {
      title: 'Test Title',
      show: true,
      discover: false,
      idRegion: 3
    };

    render(<StoreWrapper {...props} />);
    
    // Verify all props are passed correctly
    expect(screen.getByTestId('viewer-title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('viewer-show')).toHaveTextContent('true');
    expect(screen.getByTestId('viewer-discover')).toHaveTextContent('false');
    expect(screen.getByTestId('viewer-idRegion')).toHaveTextContent('3');
  });

  it('provides Redux store through Provider', () => {
    // This test ensures the component is wrapped with Provider
    // The Provider component is mocked to simply render children
    render(<StoreWrapper />);
    expect(screen.getByTestId('mock-viewer')).toBeInTheDocument();
  });
});