import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InsuranceRequirements from 'v2/apps/clink/pages/pmp/project-details/InsuranceRequirements';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

const sampleConstants = {
  project: {
    insurances: {
      optionA: 'Option A',
      optionB: 'Option B',
    },
  },
};

const createHookMocks = () => {
  const setProductInsurance = jest.fn();
  const setWorkInsurance = jest.fn();
  const setIndemnityInsurance = jest.fn();
  const setProductResponsible = jest.fn();
  const setWorkResponsible = jest.fn();
  const setIndemnityResponsible = jest.fn();

  return {
    useUpdateProject: {
      useProductInsurance: ['optionA', setProductInsurance],
      useWorkInsurance: ['optionB', setWorkInsurance],
      useProfessionalIndemnityInsurance: ['optionA', setIndemnityInsurance],
      useProductInsuranceResponsible: ['contractor', setProductResponsible],
      useWorkInsuranceResponsible: ['employer', setWorkResponsible],
      useProfessionalIndemnityResponsible: [
        'contractor',
        setIndemnityResponsible,
      ],
      useErrorsInsurance: [[]],
    },
    setters: {
      setProductInsurance,
      setWorkInsurance,
      setIndemnityInsurance,
      setProductResponsible,
      setWorkResponsible,
      setIndemnityResponsible,
    },
  };
};

describe('InsuranceRequirements', () => {
  it('renders insurance sections and menu options', () => {
    const { useUpdateProject } = createHookMocks();

    render(
      <InsuranceRequirements
        useUpdateProject={useUpdateProject}
        constants={sampleConstants}
      />,
    );

    expect(screen.getByText('insurance-requirements')).toBeInTheDocument();
    expect(screen.getAllByTestId('mui-menu-item')).toHaveLength(6);

    const radioGroups = screen.getAllByTestId('radio-group');
    expect(radioGroups).toHaveLength(3);
    expect(radioGroups[0]).toHaveAttribute('value', 'contractor');
    expect(radioGroups[1]).toHaveAttribute('value', 'employer');
    expect(radioGroups[2]).toHaveAttribute('value', 'contractor');
  });

  it('propagates select and radio changes to provided setters', () => {
    const { useUpdateProject, setters } = createHookMocks();

    render(
      <InsuranceRequirements
        useUpdateProject={useUpdateProject}
        constants={sampleConstants}
      />,
    );

    fireEvent.change(screen.getByLabelText(/public-product-liability/i), {
      target: { value: 'optionB' },
    });
    fireEvent.change(screen.getByLabelText(/contract-works-insurance/i), {
      target: { value: 'optionA' },
    });
    fireEvent.change(
      screen.getByLabelText(/professional-indemnity-insurance/i),
      { target: { value: 'optionB' } },
    );

    const radioGroups = screen.getAllByTestId('radio-group');
    const productEmployer = radioGroups[0].querySelector(
      'input[value="employer"]',
    );
    const workContractor = radioGroups[1].querySelector(
      'input[value="contractor"]',
    );
    const indemnityEmployer = radioGroups[2].querySelector(
      'input[value="employer"]',
    );

    expect(productEmployer).toBeTruthy();
    expect(workContractor).toBeTruthy();
    expect(indemnityEmployer).toBeTruthy();

    fireEvent.click(productEmployer);
    fireEvent.click(workContractor);
    fireEvent.click(indemnityEmployer);

    expect(setters.setProductInsurance).toHaveBeenCalledWith('optionB');
    expect(setters.setWorkInsurance).toHaveBeenCalledWith('optionA');
    expect(setters.setIndemnityInsurance).toHaveBeenCalledWith('optionB');
    expect(setters.setProductResponsible).toHaveBeenCalled();
    expect(setters.setWorkResponsible).toHaveBeenCalled();
    expect(setters.setIndemnityResponsible).toHaveBeenCalled();
  });
});
