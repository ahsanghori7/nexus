import React from 'react';
import { render, screen } from '@testing-library/react';
import FormConfig from './index';

jest.mock('v1/global', () => ({}));
jest.mock('v1/document-creator/public/styles/index.scss', () => ({}));
jest.mock('v1/global/components/clink-form/inputs/FieldRenderer', () => {
  const MockFieldRenderer = ({ field }) =>
    field.type === 'hidden' ? (
      <input data-testid={`hidden-${field.name}`} name={field.name} type="hidden" />
    ) : (
      <div data-testid={`field-${field.name}`}>{field.name}</div>
    );
  return MockFieldRenderer;
});

jest.mock('./VirtualizedInputs', () => {
  const mockReactLocal = jest.requireActual('react');

  return mockReactLocal.forwardRef(({ formFields, portalId }, ref) => (
    <div data-portal-id={portalId || ''} data-testid="virtualized-inputs" ref={ref}>
      {formFields.map((field) => field.name).join(',')}
    </div>
  ));
});

describe('FormConfig', () => {
  it('should keep hidden fields mounted outside the virtualized list', () => {
    const formRef = React.createRef();

    const { container } = render(
      <FormConfig
        applyObserverActions={jest.fn()}
        docType="tender"
        fileManagerButton={jest.fn()}
        formErrors={{}}
        formRef={formRef}
        formValues={{ hidden_field: 'hidden value', visible_field: 'visible value' }}
        loadingConfig={false}
        loadingConfigService={false}
        numberDocuments={[]}
        service={{
          formFields: [
            { key: 'hidden_field', name: 'hidden_field', type: 'hidden' },
            { key: 'visible_field', name: 'visible_field', type: 'text' },
          ],
          saveData: jest.fn(),
          signatureFields: {},
        }}
        showForm
        signature="docusign"
        updateTemplateServiceFirst={() => Promise.resolve()}
        updateTemplateServiceSecond={jest.fn()}
      />,
    );

    expect(
      container.querySelector('input[name="hidden_field"][type="hidden"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-inputs')).toHaveTextContent(
      'visible_field',
    );
    expect(screen.getByTestId('virtualized-inputs')).not.toHaveTextContent(
      'hidden_field',
    );
    expect(screen.getByTestId('virtualized-inputs')).toHaveAttribute(
      'data-portal-id',
      'date-picker-portal',
    );
  });
});
