import React from 'react';
import { render } from '@testing-library/react';
import Money from './Money';

// Test with exact relative import from original test
describe('Money Component Relative Import Test', () => {
  it('should import Money component with relative path', () => {
    expect(typeof Money).toBe('function');
  });
});