import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LegalDisputeTerms from 'v2/apps/clink/pages/pmp/project-details/legal-dispute-terms';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const setupHooks = () => {
  const setAreDamagesApplicable = jest.fn();
  const setAmendmentsRelevant = jest.fn();
  const setLiquidatedRate = jest.fn();
  const setCapOnDamages = jest.fn();
  const setGoverningLaw = jest.fn();

  return {
    useUpdateProject: {
      useAreLiquidatedDamagesApplicable: [true, setAreDamagesApplicable],
      useLiquidatedDamagesRate: ['5%', setLiquidatedRate],
      useCapOnLiquidatedDamages: ['10%', setCapOnDamages],
      useAmendmentsRelevantEventsMatters: [false, setAmendmentsRelevant],
      useGoverningLaw: ['UK', setGoverningLaw],
      useErrorsLegalDisputeTerms: [[]],
    },
    setters: {
      setAreDamagesApplicable,
      setAmendmentsRelevant,
      setLiquidatedRate,
      setCapOnDamages,
      setGoverningLaw,
    },
  };
};

describe('LegalDisputeTerms', () => {
  it('renders initial values for radio groups and text fields', () => {
    const { useUpdateProject } = setupHooks();

    render(<LegalDisputeTerms useUpdateProject={useUpdateProject} />);

    const radioGroups = screen.getAllByTestId('radio-group');
    expect(radioGroups).toHaveLength(2);
    expect(radioGroups[0]).toHaveAttribute('value', 'true');
    expect(radioGroups[1]).toHaveAttribute('value', 'false');

    expect(
      screen.getByLabelText('liquidated-damages-rate'),
    ).toHaveValue('5%');
    expect(
      screen.getByLabelText('cap-on-liquidated-damages'),
    ).toHaveValue('10%');
    expect(screen.getByLabelText('governing-law')).toHaveValue('UK');
  });

  it('updates form inputs via provided setter functions', () => {
    const { useUpdateProject, setters } = setupHooks();

    render(<LegalDisputeTerms useUpdateProject={useUpdateProject} />);

    fireEvent.change(screen.getByLabelText('liquidated-damages-rate'), {
      target: { value: '7%' },
    });
    fireEvent.change(screen.getByLabelText('cap-on-liquidated-damages'), {
      target: { value: '12%' },
    });
    fireEvent.change(screen.getByLabelText('governing-law'), {
      target: { value: 'Scotland' },
    });

    const radioGroups = screen.getAllByTestId('radio-group');
    const damagesNo = radioGroups[0].querySelector('input[value="false"]');
    const amendmentsYes = radioGroups[1].querySelector('input[value="true"]');

    fireEvent.click(damagesNo);
    fireEvent.click(amendmentsYes);

    expect(setters.setAreDamagesApplicable).toHaveBeenCalledWith(false);
    expect(setters.setAmendmentsRelevant).toHaveBeenCalledWith(true);
    expect(setters.setLiquidatedRate).toHaveBeenCalledWith('7%');
    expect(setters.setCapOnDamages).toHaveBeenCalledWith('12%');
    expect(setters.setGoverningLaw).toHaveBeenCalledWith('Scotland');
  });
});
