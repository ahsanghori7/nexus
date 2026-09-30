// Test that imports the actual Form component from the project
import React from 'react';
import { render } from '@testing-library/react';
import Form from './v2/apps/prosper/pages/projects/enquiries_v2/enquiry-modal/send-quote/form';

describe('Actual Form Component Test', () => {
  it('should import the actual Form component', () => {
    // Test with minimal props
    const mockProps = {
      setData: jest.fn(),
      onSubmit: jest.fn(),
      initDataQuote: {},
      documentsToSend: []
    };

    const { container } = render(<Form {...mockProps} />);
    expect(container).toBeInTheDocument();
  });
});
