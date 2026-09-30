import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MainContractStructure from 'v2/apps/clink/pages/pmp/project-details/main-contract-structure';

jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

const sampleConstants = {
  project: {
    comment_period_subcontractor_drawings: {
      optA: '14 days',
      optB: '21 days',
    },
    does_sectional_completion_apply: {
      yes: 'Yes',
      no: 'No',
    },
    notice_period_commence_work_on_site: {
      week1: '1 week',
      week2: '2 weeks',
    },
    prime_cost_addition_for_materials: {
      five: '5%',
      seven: '7%',
    },
    prime_cost_addition_for_plant: {
      ten: '10%',
      twelve: '12%',
    },
    rectification_defects_period: {
      months12: '12 months',
      months18: '18 months',
    },
    retention_release_date: {
      partial: 'Partial',
      full: 'Full',
    },
    retention: {
      five: '5%',
      ten: '10%',
    },
  },
};

const buildHooks = () => {
  const setPrincipalContractor = jest.fn();
  const setPrincipalDesigner = jest.fn();
  const setEmployerAgent = jest.fn();
  const setFormContractMain = jest.fn();
  const setMainContractSignedDate = jest.fn();
  const setSubContractBaseDate = jest.fn();
  const setNoticeCommenceWorks = jest.fn();
  const setCommentPeriodSubcontractorDrawings = jest.fn();
  const setSectionalCompletion = jest.fn();
  const setRetentionReleaseDate = jest.fn();
  const setRectificationDefectsPeriod = jest.fn();
  const setRetention = jest.fn();
  const setPrimeCostAdditionMaterials = jest.fn();
  const setPrimeCostAdditionPlant = jest.fn();
  const setNomineeDisputes = jest.fn();
  const setEditionOfJCT = jest.fn();
  const setScheduleOfAmendments = jest.fn();

  return {
    useUpdateProject: {
      usePrincipalContractor: ['Main Co', setPrincipalContractor],
      usePrincipalDesigner: ['Designer Ltd', setPrincipalDesigner],
      useEmployerAgent: ['Agent Smith', setEmployerAgent],
      useFormContractMain: ['JCT', setFormContractMain],
      useMainContractSignedDate: ['2024-01-01', setMainContractSignedDate],
      useSubContractBaseDate: ['2024-02-01', setSubContractBaseDate],
      useNoticeCommenceWorks: ['week1', setNoticeCommenceWorks],
      useCommentPeriodSubcontractorDrawings: ['optA', setCommentPeriodSubcontractorDrawings],
      useSectionalCompletion: ['yes', setSectionalCompletion],
      useRetentionReleaseDate: ['partial', setRetentionReleaseDate],
      useRectificationDefectsPeriod: ['months12', setRectificationDefectsPeriod],
      useRetention: ['five', setRetention],
      usePrimeCostAdditionMaterials: ['five', setPrimeCostAdditionMaterials],
      usePrimeCostAdditionPlant: ['ten', setPrimeCostAdditionPlant],
      useNomineeDisputes: ['Mediator', setNomineeDisputes],
      useEditionOfJCT: ['2023', setEditionOfJCT],
      useScheduleOfAmendments: ['Schedule A', setScheduleOfAmendments],
    },
    setters: {
      setPrincipalContractor,
      setPrincipalDesigner,
      setEmployerAgent,
      setFormContractMain,
      setMainContractSignedDate,
      setSubContractBaseDate,
      setNoticeCommenceWorks,
      setCommentPeriodSubcontractorDrawings,
      setSectionalCompletion,
      setRetentionReleaseDate,
      setRectificationDefectsPeriod,
      setRetention,
      setPrimeCostAdditionMaterials,
      setPrimeCostAdditionPlant,
      setNomineeDisputes,
      setEditionOfJCT,
      setScheduleOfAmendments,
    },
  };
};

describe('MainContractStructure', () => {
  it('renders select options derived from constants', () => {
    const { useUpdateProject } = buildHooks();

    render(
      <MainContractStructure
        constants={sampleConstants}
        useUpdateProject={useUpdateProject}
      />,
    );

    expect(screen.getAllByTestId('mui-menu-item').length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText('principal-contractor'),
    ).toHaveValue('Main Co');
    expect(screen.getByLabelText('employer-agent')).toHaveValue('Agent Smith');
    expect(screen.getAllByTestId('date-picker')).toHaveLength(2);
  });

  it('updates values through setter functions when inputs change', () => {
    const { useUpdateProject, setters } = buildHooks();

    render(
      <MainContractStructure
        constants={sampleConstants}
        useUpdateProject={useUpdateProject}
      />,
    );

    fireEvent.change(screen.getByLabelText('principal-contractor'), {
      target: { value: 'Updated Contractor' },
    });
    fireEvent.change(screen.getByLabelText('principal-designer'), {
      target: { value: 'Updated Designer' },
    });
    fireEvent.change(screen.getByLabelText('employer-agent'), {
      target: { value: 'New Agent' },
    });
    fireEvent.change(screen.getByLabelText('form-contract-main'), {
      target: { value: 'New Form' },
    });

    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.change(datePickers[0], { target: { value: '2024-05-01' } });
    fireEvent.change(datePickers[1], { target: { value: '2024-06-01' } });

    fireEvent.change(
      screen.getByLabelText('notice-period-commence-works-on-site'),
      { target: { value: 'week2' } },
    );
    fireEvent.change(
      screen.getByLabelText('comment-period-subcontractor-drawings'),
      { target: { value: 'optB' } },
    );
    fireEvent.change(screen.getByLabelText('sectional-completion'), {
      target: { value: 'no' },
    });
    fireEvent.change(screen.getByLabelText('retention-release-date'), {
      target: { value: 'full' },
    });
    fireEvent.change(
      screen.getByLabelText('rectification-defects-period'),
      { target: { value: 'months18' } },
    );
    fireEvent.change(screen.getByLabelText('retention'), {
      target: { value: 'ten' },
    });
    fireEvent.change(
      screen.getByLabelText('prime-cost-addition-materials'),
      { target: { value: 'seven' } },
    );
    fireEvent.change(
      screen.getByLabelText('prime-cost-addition-plant'),
      { target: { value: 'twelve' } },
    );
    fireEvent.change(screen.getByLabelText('nominee-disputes'), {
      target: { value: 'Arbiter' },
    });
    fireEvent.change(screen.getByLabelText('edition-of-jct-contract'), {
      target: { value: '2024' },
    });
    fireEvent.change(screen.getByLabelText('schedule-of-amendments'), {
      target: { value: 'Schedule B' },
    });

    expect(setters.setPrincipalContractor).toHaveBeenCalledWith('Updated Contractor');
    expect(setters.setPrincipalDesigner).toHaveBeenCalledWith('Updated Designer');
    expect(setters.setEmployerAgent).toHaveBeenCalledWith('New Agent');
    expect(setters.setFormContractMain).toHaveBeenCalledWith('New Form');
    expect(setters.setMainContractSignedDate).toHaveBeenCalledWith('2024-05-01');
    expect(setters.setSubContractBaseDate).toHaveBeenCalledWith('2024-06-01');
    expect(setters.setNoticeCommenceWorks).toHaveBeenCalledWith('week2');
    expect(setters.setCommentPeriodSubcontractorDrawings).toHaveBeenCalledWith('optB');
    expect(setters.setSectionalCompletion).toHaveBeenCalledWith('no');
    expect(setters.setRetentionReleaseDate).toHaveBeenCalledWith('full');
    expect(setters.setRectificationDefectsPeriod).toHaveBeenCalledWith('months18');
    expect(setters.setRetention).toHaveBeenCalledWith('ten');
    expect(setters.setPrimeCostAdditionMaterials).toHaveBeenCalledWith('seven');
    expect(setters.setPrimeCostAdditionPlant).toHaveBeenCalledWith('twelve');
    expect(setters.setNomineeDisputes).toHaveBeenCalledWith('Arbiter');
    expect(setters.setEditionOfJCT).toHaveBeenCalledWith('2024');
    expect(setters.setScheduleOfAmendments).toHaveBeenCalledWith('Schedule B');
  });
});
