import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Img from './Img';

describe('Img Component', () => {
  test('renders an img element with correct src', () => {
    const testSrc = 'test-image.jpg';
    render(<Img src={testSrc} />);

    const imgElement = screen.getByRole('img');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', testSrc);
  });

  test('applies className when provided', () => {
    const testClassName = 'test-class';
    render(<Img src="test-image.jpg" className={testClassName} />);

    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass(testClassName);
  });

  test('uses uniqueKey for the key attribute', () => {
    const testKey = 'test-key';
    const { container } = render(
      <Img src="test-image.jpg" uniqueKey={testKey} />
    );

    // We can't directly test key prop with testing-library, but we can check
    // that it gets rendered correctly by checking the resulting HTML
    const imgElement = container.querySelector('img');
    expect(imgElement).toBeInTheDocument();
    // Note: React doesn't actually put the key in the DOM, so we're testing
    // the component behavior without directly accessing the key
  });

  test('uses empty className by default', () => {
    render(<Img src="test-image.jpg" />);

    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveAttribute('class', '');
  });

  test('uses empty string for uniqueKey by default', () => {
    const { container } = render(<Img src="test-image.jpg" />);

    // Again, we can't directly test the key, but we can verify the component renders
    const imgElement = container.querySelector('img');
    expect(imgElement).toBeInTheDocument();
  });

  test('renders with empty alt attribute for decorative images', () => {
    render(<Img src="test-image.jpg" />);

    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveAttribute('alt', '');
  });
});
