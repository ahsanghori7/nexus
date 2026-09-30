import React from 'react';
import { render } from '@testing-library/react';
import RegisteredCard from './index';

// Mock the child components
jest.mock('./v1', () => {
  return function MockV1({ item, image, cardTheme }) {
    return (
      <div data-testid="v1-component">
        V1 Component - item: {item?.name}, image: {image}, cardTheme: {cardTheme}
      </div>
    );
  };
});

jest.mock('./v2', () => {
  return function MockV2({ item, image, cardTheme }) {
    return (
      <div data-testid="v2-component">
        V2 Component - item: {item?.name}, image: {image}, cardTheme: {cardTheme}
      </div>
    );
  };
});

describe('RegisteredCard', () => {
  const mockItem = {
    id: 1,
    name: 'Test Item',
  };

  const mockImage = 'test-image.jpg';

  it('renders without crashing', () => {
    render(<RegisteredCard item={mockItem} />);
  });

  it('renders V1 component by default', () => {
    const { getByTestId } = render(<RegisteredCard item={mockItem} />);
    expect(getByTestId('v1-component')).toBeInTheDocument();
  });

  it('renders V1 component when version is explicitly set to v1', () => {
    const { getByTestId } = render(
      <RegisteredCard item={mockItem} version="v1" />
    );
    expect(getByTestId('v1-component')).toBeInTheDocument();
  });

  it('renders V2 component when version is set to v2', () => {
    const { getByTestId } = render(
      <RegisteredCard item={mockItem} version="v2" />
    );
    expect(getByTestId('v2-component')).toBeInTheDocument();
  });

  it('passes all props correctly to V1 component', () => {
    const { getByTestId } = render(
      <RegisteredCard
        item={mockItem}
        image={mockImage}
        cardTheme="custom-theme"
        version="v1"
      />
    );
    const component = getByTestId('v1-component');
    expect(component).toHaveTextContent('Test Item');
    expect(component).toHaveTextContent('test-image.jpg');
    expect(component).toHaveTextContent('custom-theme');
  });

  it('passes all props correctly to V2 component', () => {
    const { getByTestId } = render(
      <RegisteredCard
        item={mockItem}
        image={mockImage}
        cardTheme="custom-theme"
        version="v2"
      />
    );
    const component = getByTestId('v2-component');
    expect(component).toHaveTextContent('Test Item');
    expect(component).toHaveTextContent('test-image.jpg');
    expect(component).toHaveTextContent('custom-theme');
  });

  it('uses default cardTheme when not provided', () => {
    const { getByTestId } = render(<RegisteredCard item={mockItem} />);
    const component = getByTestId('v1-component');
    expect(component).toHaveTextContent('prosper-big-card');
  });

  it('handles missing item prop gracefully', () => {
    const { getByTestId } = render(<RegisteredCard />);
    const component = getByTestId('v1-component');
    expect(component).toHaveTextContent('item: ,');
  });

  it('handles missing image prop gracefully', () => {
    const { getByTestId } = render(<RegisteredCard item={mockItem} />);
    const component = getByTestId('v1-component');
    expect(component).toHaveTextContent('image: ,');
  });
});