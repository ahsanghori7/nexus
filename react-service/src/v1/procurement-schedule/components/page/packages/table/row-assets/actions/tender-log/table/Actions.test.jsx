import React from 'react';
import { render } from '@testing-library/react';
import Actions from './Actions';

describe('Actions component', () => {
  test('should return null if meta is not a valid object', () => {
    const { container } = render(<Actions sid="123" meta={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('should return null if content.id is not present', () => {
    const meta = { document: { bulk: { 123: {} } } }; // Missing id
    const { container } = render(<Actions sid="123" meta={meta} />);
    expect(container.firstChild).toBeNull();
  });

  test('should render component if validMeta and content.id exist', () => {
    const meta = { document: { bulk: { 123: { id: '456' } } } };
    const { getByText } = render(<Actions sid="123" meta={meta} />);
    expect(getByText('View Attachments')).toBeInTheDocument();
  });
});
