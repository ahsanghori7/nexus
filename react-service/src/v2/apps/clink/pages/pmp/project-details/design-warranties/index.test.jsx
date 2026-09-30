import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DesignWarranties from 'v2/apps/clink/pages/pmp/project-details/design-warranties';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const buildHooks = () => {
  const setDesignResponsibility = jest.fn();
  const setDesignResponsibilityPeriod = jest.fn();
  const setCollateralWarrantiesRequired = jest.fn();
  const setWarrantiesProvidedTo = jest.fn();

  return {
    useUpdateProject: {
      useDesignResponsibility: [true, setDesignResponsibility],
      useDesignResponsibilityPeriod: ['12 months', setDesignResponsibilityPeriod],
      useCollateralWarrantiesRequired: [false, setCollateralWarrantiesRequired],
      useWarrantiesProvidedTo: ['Client', setWarrantiesProvidedTo],
      useErrorsDesignWarranties: [[]],
    },
    setters: {
      setDesignResponsibility,
      setDesignResponsibilityPeriod,
      setCollateralWarrantiesRequired,
      setWarrantiesProvidedTo,
    },
  };
};

describe('DesignWarranties', () => {
  it('renders default values and labels', () => {
    const { useUpdateProject } = buildHooks();

    render(<DesignWarranties useUpdateProject={useUpdateProject} />);

    const radioGroups = screen.getAllByTestId('radio-group');
    expect(radioGroups).toHaveLength(2);
    expect(radioGroups[0]).toHaveAttribute('value', 'true');
    expect(radioGroups[1]).toHaveAttribute('value', 'false');

    expect(
      screen.getByLabelText('design-responsibility-period'),
    ).toHaveValue('12 months');
    expect(screen.getByLabelText('warranties-provided')).toHaveValue('Client');
  });

  it('updates form fields and radios via provided setters', () => {
    const { useUpdateProject, setters } = buildHooks();

    render(<DesignWarranties useUpdateProject={useUpdateProject} />);

    fireEvent.change(screen.getByLabelText('design-responsibility-period'), {
      target: { value: '24 months' },
    });
    fireEvent.change(screen.getByLabelText('warranties-provided'), {
      target: { value: 'Stakeholders' },
    });

    const radioGroups = screen.getAllByTestId('radio-group');
    const designNo = radioGroups[0].querySelector('input[value="false"]');
    const collateralYes = radioGroups[1].querySelector('input[value="true"]');

    fireEvent.click(designNo);
    fireEvent.click(collateralYes);

    expect(setters.setDesignResponsibility).toHaveBeenCalledWith(false);
    expect(setters.setDesignResponsibilityPeriod).toHaveBeenCalledWith('24 months');
    expect(setters.setCollateralWarrantiesRequired).toHaveBeenCalledWith(true);
    expect(setters.setWarrantiesProvidedTo).toHaveBeenCalledWith('Stakeholders');
  });
});
