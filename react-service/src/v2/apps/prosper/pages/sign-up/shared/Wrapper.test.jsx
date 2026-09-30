import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wrapper from './Wrapper';

// Mock component to test with Wrapper
const MockComponent = ({ styles, testProp }) => (
  <div data-testid="mock-component">
    <div data-testid="styles">{JSON.stringify(styles)}</div>
    <div data-testid="test-prop">{testProp}</div>
  </div>
);

// Mock useWindowDimensions hook to control screen size
jest.mock('clink-components', () => ({
  ...jest.requireActual('clink-components'),
  HOOKS: {
    useWindowDimensions: jest.fn(),
  },
}));

const { HOOKS } = require('clink-components');

describe('Wrapper Component', () => {
  beforeEach(() => {
    // Reset mock before each test
    HOOKS.useWindowDimensions.mockReset();
  });

  it('renders without crashing', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200, height: 800 });
    
    render(<Wrapper Component={MockComponent} testProp="test" />);
    expect(document.querySelector('[data-testid="mock-component"]')).toBeInTheDocument();
  });

  it('passes through props to wrapped component', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200, height: 800 });
    
    const { getByTestId } = render(
      <Wrapper Component={MockComponent} testProp="passed through" />
    );
    
    expect(getByTestId('test-prop')).toHaveTextContent('passed through');
  });

  it('applies desktop styles for large screens', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200, height: 800 });
    
    const { getByTestId } = render(<Wrapper Component={MockComponent} />);
    
    const stylesElement = getByTestId('styles');
    const styles = JSON.parse(stylesElement.textContent);
    
    expect(styles.img).toBe(32);
    expect(styles.titleSize).toBe('36px');
    expect(styles.subtitleSize).toBe('18px');
    expect(styles.noWrap).toBe('nowrap');
  });

  it('applies mobile styles for small screens', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 600, height: 800 });
    
    const { getByTestId } = render(<Wrapper Component={MockComponent} />);
    
    const stylesElement = getByTestId('styles');
    const styles = JSON.parse(stylesElement.textContent);
    
    expect(styles.img).toBe(24);
    expect(styles.titleSize).toBe('24pt');
    expect(styles.subtitleSize).toBe('14pt');
    expect(styles.noWrap).toBe('inherit');
  });

  it('switches from desktop to mobile styles when screen size changes', () => {
    // Start with desktop
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200, height: 800 });
    
    const { getByTestId, rerender } = render(<Wrapper Component={MockComponent} />);
    
    let stylesElement = getByTestId('styles');
    let styles = JSON.parse(stylesElement.textContent);
    expect(styles.img).toBe(32); // Desktop
    
    // Change to mobile
    HOOKS.useWindowDimensions.mockReturnValue({ width: 600, height: 800 });
    rerender(<Wrapper Component={MockComponent} />);
    
    stylesElement = getByTestId('styles');
    styles = JSON.parse(stylesElement.textContent);
    expect(styles.img).toBe(24); // Mobile
  });

  it('switches from mobile to desktop styles when screen size changes', () => {
    // Start with mobile
    HOOKS.useWindowDimensions.mockReturnValue({ width: 600, height: 800 });
    
    const { getByTestId, rerender } = render(<Wrapper Component={MockComponent} />);
    
    let stylesElement = getByTestId('styles');
    let styles = JSON.parse(stylesElement.textContent);
    expect(styles.img).toBe(24); // Mobile
    
    // Change to desktop
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200, height: 800 });
    rerender(<Wrapper Component={MockComponent} />);
    
    stylesElement = getByTestId('styles');
    styles = JSON.parse(stylesElement.textContent);
    expect(styles.img).toBe(32); // Desktop
  });

  it('handles medium screen size correctly', () => {
    // Test with screen size between mobile and desktop thresholds
    HOOKS.useWindowDimensions.mockReturnValue({ width: 950, height: 800 });
    
    const { getByTestId } = render(<Wrapper Component={MockComponent} />);
    
    const stylesElement = getByTestId('styles');
    const styles = JSON.parse(stylesElement.textContent);
    
    // Should use mobile styles for screens less than MD_SCREEN (900px)
    // but our test value is 950, which is > 900, so should use desktop
    expect(styles.img).toBe(32);
  });

  it('takes a snapshot', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200, height: 800 });
    
    const { container } = render(<Wrapper Component={MockComponent} testProp="snapshot" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});