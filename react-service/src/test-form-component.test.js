// Test that imports the Form component directly
import React from 'react';
import { render } from '@testing-library/react';
import { Form } from 'clink-components';

describe('Form Component Import Test', () => {
  it('should import and render Form component', () => {
    const mockProps = {
      render: ({ formState, register, handleSubmit }) => (
        <div data-testid="form-content">
          <button type="submit">Submit</button>
        </div>
      )
    };

    const { getByTestId } = render(<Form {...mockProps} />);
    expect(getByTestId('form-content')).toBeInTheDocument();
  });
});