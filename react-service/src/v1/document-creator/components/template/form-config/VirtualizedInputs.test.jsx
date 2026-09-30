import React from 'react';
import { act, render, screen } from '@testing-library/react';
import VirtualizedInputs from './VirtualizedInputs';

const mockScrollToItem = jest.fn();
const mockResetAfterIndex = jest.fn();

jest.mock('react-window', () => {
  const mockReactLocal = jest.requireActual('react');

  return {
    VariableSizeList: mockReactLocal.forwardRef(
      (
        {
          children,
          itemCount,
          itemData,
          itemKey = (index) => index,
        },
        ref,
      ) => {
        mockReactLocal.useImperativeHandle(ref, () => ({
          resetAfterIndex: mockResetAfterIndex,
          scrollToItem: mockScrollToItem,
        }));

        return (
          <div data-testid="virtualized-list">
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={itemKey(index)}>
                {children({
                  data: itemData,
                  index,
                  style: {},
                })}
              </div>
            ))}
          </div>
        );
      },
    ),
  };
});

jest.mock('v1/global/components/clink-form/inputs/FieldRenderer', () => {
  const MockFieldRenderer = ({ field, portalId = null }) => (
    <input
      data-portal-id={portalId || ''}
      data-testid={field.name}
      name={field.name}
    />
  );
  return MockFieldRenderer;
});

describe('VirtualizedInputs', () => {
  beforeEach(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}

      disconnect() {}
    };

    window.requestAnimationFrame = (callback) => {
      callback();
      return 0;
    };
    window.cancelAnimationFrame = jest.fn();

    mockScrollToItem.mockClear();
    mockResetAfterIndex.mockClear();
  });

  it('should scroll to a named field through the imperative API', () => {
    const ref = React.createRef();

    render(
      <VirtualizedInputs
        ref={ref}
        errors={{}}
        formFields={[
          { key: 'first', name: 'first', type: 'text' },
          { key: 'second', name: 'second', type: 'text' },
        ]}
        formViewerRef={React.createRef()}
        setFieldValue={jest.fn()}
        validationFieldSchema={{}}
        values={{ first: '', second: '' }}
      />,
    );

    act(() => {
      ref.current.scrollToField('second', 'start');
    });

    expect(mockScrollToItem).toHaveBeenCalledWith(1, 'start');
  });

  it('should focus a field after scrolling it into view', () => {
    const ref = React.createRef();

    render(
      <VirtualizedInputs
        ref={ref}
        errors={{}}
        formFields={[
          { key: 'first', name: 'first', type: 'text' },
          { key: 'second', name: 'second', type: 'text' },
        ]}
        formViewerRef={React.createRef()}
        setFieldValue={jest.fn()}
        validationFieldSchema={{}}
        values={{ first: '', second: '' }}
      />,
    );

    act(() => {
      ref.current.focusField('second', 'start');
    });

    expect(mockScrollToItem).toHaveBeenLastCalledWith(1, 'start');
    expect(screen.getByTestId('second')).toHaveFocus();
  });

  it('should forward portalId to rendered fields', () => {
    render(
      <VirtualizedInputs
        errors={{}}
        formFields={[{ key: 'date', name: 'date', calendar: true, type: 'text' }]}
        formViewerRef={React.createRef()}
        portalId="date-picker-portal"
        setFieldValue={jest.fn()}
        validationFieldSchema={{}}
        values={{ date: '' }}
      />,
    );

    expect(screen.getByTestId('date')).toHaveAttribute(
      'data-portal-id',
      'date-picker-portal',
    );
  });

  it('should apply field.testId as data-testid on the virtual row wrapper', () => {
    render(
      <VirtualizedInputs
        errors={{}}
        formFields={[
          {
            key: 'order_value',
            name: 'OrderValue',
            type: 'text',
            testId: 'document-creator-field-order-value',
          },
        ]}
        formViewerRef={React.createRef()}
        setFieldValue={jest.fn()}
        validationFieldSchema={{}}
        values={{ OrderValue: '' }}
      />,
    );

    expect(
      document.querySelector('[data-testid="document-creator-field-order-value"]'),
    ).toBeInTheDocument();
  });
});
