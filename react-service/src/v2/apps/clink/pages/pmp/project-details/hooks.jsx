// TODO: Refactor this file. It's huge and non maintainable. Also add unit testing
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'hooks/context';
import { normalizeSections } from './helpers';

const useUpdateProject = (dispatch, projectData = {}) => {
  const navigate = useNavigate();

  // site details
  const [addressOne, setAddressOne] = useState(
    projectData?.site_address_one ?? '',
  );
  const [addressTwo, setAddressTwo] = useState(
    projectData?.site_address_two ?? '',
  );
  const [city, setCity] = useState(projectData?.site_address_city ?? '');
  const [postcode, setPostcode] = useState(
    projectData?.site_address_postcode ?? '',
  );
  // site details 2
  const [openingHoursWeekdays, setOpeningHoursWeekdays] = useState(
    projectData?.opening_hours_weekdays ?? '',
  );
  const [openingHoursWeekends, setOpeningHoursWeekends] = useState(
    projectData?.opening_hours_weekends ?? '',
  );
  const [siteConstrains, setSiteConstrains] = useState(
    projectData?.site_constrains ?? '',
  );
  // client details
  const [clientAddressOne, setClientAddressOne] = useState(
    projectData?.client_address_one ?? '',
  );
  const [clientAddressTwo, setClientAddressTwo] = useState(
    projectData?.client_address_two ?? '',
  );
  const [clientCity, setClientCity] = useState(
    projectData?.client_address_city ?? '',
  );
  const [clientPostcode, setClientPostcode] = useState(
    projectData?.client_address_postcode ?? '',
  );
  // client contact notices
  const [clientName, setClientName] = useState(projectData?.client_name ?? '');
  const [clientRegNumber, setClientRegNumber] = useState(
    projectData?.client_reg_number ?? '',
  );

  // ✅ client contact notices (optional)
  const [clientContactName, setClientContactName] = useState(
    projectData?.client_contact_name ?? '',
  );
  const [clientContactEmail, setClientContactEmail] = useState(
    projectData?.client_contact_email ?? '',
  );
  const [clientContactPostalCode, setClientContactPostalCode] = useState(
    projectData?.client_contact_postal_code ?? '',
  );

  // insurances
  const [workInsurance, setWorkInsurance] = useState(
    projectData?.employer_liabilty_insurance ?? 0,
  );
  const [productInsurance, setProductInsurance] = useState(
    projectData?.public_product_insurance ?? 0,
  );
  const [professionalIndemnityInsurance, setProfessionalIndemnityInsurance] =
    useState(projectData?.professional_indemnity_insurance ?? 0);
  const [productInsuranceResponsible, setProductInsuranceResponsible] =
    useState(projectData?.public_product_insurance_responsible ?? '');
  const [workInsuranceResponsible, setWorkInsuranceResponsible] = useState(
    projectData?.employer_liabilty_insurance_responsible ?? '',
  );
  const [
    professionalIndemnityResponsible,
    setProfessionalIndemnityResponsible,
  ] = useState(projectData?.professional_indemnity_insurance_responsible ?? '');
  // main contract structure
  const [principalContractor, setPrincipalContractor] = useState(
    projectData?.principal_contractor ?? '',
  );
  const [noticeCommenceWorks, setNoticeCommenceWorks] = useState(
    projectData?.notice_period_commence_work_on_site ?? '',
  );
  const [
    commentPeriodSubcontractorDrawings,
    setCommentPeriodSubcontractorDrawings,
  ] = useState(projectData?.comment_period_subcontractor_drawings ?? '');
  const [subContractBaseDate, setSubContractBaseDate] = useState(
    projectData?.sub_contract_base_date ?? '',
  );
  const [sectionalCompletion, setSectionalCompletion] = useState(
    projectData?.does_sectional_completion_apply ?? '',
  );
  const [retentionReleaseDate, setRetentionReleaseDate] = useState(
    projectData?.retention_release_date ?? '',
  );
  const [primeCostAdditionMaterials, setPrimeCostAdditionMaterials] = useState(
    projectData?.prime_cost_addition_for_materials ?? '',
  );
  const [primeCostAdditionPlant, setPrimeCostAdditionPlant] = useState(
    projectData?.prime_cost_addition_for_plant ?? '',
  );
  const [nomineeDisputes, setNomineeDisputes] = useState(
    projectData?.nominee_for_disputes ?? '',
  );
  const [mainContractSignedDate, setMainContractSignedDate] = useState(
    projectData?.main_contract_signed_date ?? '',
  );
  const [rectificationDefectsPeriod, setRectificationDefectsPeriod] = useState(
    projectData?.rectification_defects_period ?? '',
  );
  const [employerAgent, setEmployerAgent] = useState(
    projectData?.employers_agent ?? '',
  );
  const [principalDesigner, setPrincipalDesigner] = useState(
    projectData?.principal_designer ?? '',
  );
  const [formContractMain, setFormContractMain] = useState(
    projectData?.form_of_contract_for_main_contract ?? '',
  );
  const [editionOfJCT, setEditionOfJCT] = useState(
    projectData?.edition_of_jct_contract ?? '',
  );
  const [scheduleOfAmendments, setScheduleOfAmendments] = useState(
    projectData?.schedule_of_amendments_reference ?? '',
  );
  const [retention, setRetention] = useState(projectData?.retention ?? '');
  // key dates
  const [datePossessionSite, setDatePossessionSite] = useState(
    projectData?.date_for_possession_of_site ?? '',
  );
  const [sectionalCompletionDates, setSectionalCompletionDates] =
    useState(null);
  const [reviewPeriodDrawings, setReviewPeriodDrawings] = useState(
    projectData?.review_period_for_drawings ?? '',
  );
  const [advanceWarningPeriod, setAdvanceWarningPeriod] = useState(
    projectData?.advance_warning_period ?? '',
  );
  // key dates - Sectional completion workflow
  const [globalDateForPossession, setGlobalDateForPossession] = useState(
    projectData?.global_date_for_possession ?? '',
  );
  const [projectSections, setProjectSections] = useState(
    normalizeSections(projectData?.project_sections),
  );
  // addresses for notices
  const [mainContractorPostal, setMainContractorPostal] = useState(
    projectData?.main_contractor_postal_address_for_notices ?? '',
  );
  const [mainContractorEmail, setMainContractorEmail] = useState(
    projectData?.main_contractor_email_address_for_notices ?? '',
  );
  const [subContractorPostal, setSubContractorPostal] = useState(
    projectData?.subcontractor_postal_address_for_notices ?? '',
  );
  const [subContractorEmail, setSubContractorEmail] = useState(
    projectData?.subcontractor_email_address_for_notices ?? '',
  );
  // Payment Terms
  const [interimValuationFrequency, setInterimValuationFrequency] =
    useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [finalDateForPayment, setFinalDateForPayment] = useState('');
  const [deadlinePayLessNotices, setDeadlinePayLessNotices] = useState('');
  const [scheduleOfPaymentsProvided, setScheduleOfPaymentsProvided] =
    useState(null);
  const [advancePaymentProvision, setAdvancePaymentProvision] = useState(null);
  const [errorsPaymentTerms, setErrorsPaymentTerms] = useState([]);
  // Legal & Dispute Terms
  const [areLiquidatedDamagesApplicable, setAreLiquidatedDamagesApplicable] =
    useState(null);
  const [liquidatedDamagesRate, setLiquidatedDamagesRate] = useState('');
  const [capOnLiquidatedDamages, setCapOnLiquidatedDamages] = useState('');
  const [amendmentsRelevantEventsMatters, setAmendmentsRelevantEventsMatters] =
    useState(null);
  const [governingLaw, setGoverningLaw] = useState('English Law');
  const [errorsLegalDisputeTerms, setErrorsLegalDisputeTerms] = useState([]);
  //  Design & Warranties
  const [designResponsibility, setDesignResponsibility] = useState(null);
  const [designResponsibilityPeriod, setDesignResponsibilityPeriod] =
    useState('');
  const [collateralWarrantiesRequired, setCollateralWarrantiesRequired] =
    useState(null);
  const [warrantiesProvidedTo, setWarrantiesProvidedTo] = useState('');
  const [errorsDesignWarranties, setErrorsDesignWarranties] = useState([]);
  // Commercial Terms
  const [isPerformanceBond, setIsPerformanceBond] = useState(null);
  // others
  const [gia, setGia] = useState(projectData?.gia ?? '');

  const [errorsOne, setErrorsOne] = useState([]);
  const [errorsTwo, setErrorsTwo] = useState([]);
  const [errorsThree, setErrorsThree] = useState([]);
  const [errorsKeyDates, setErrorsKeyDates] = useState([]);
  const [errorsInsurance, setErrorsInsurance] = useState([]);
  const siteDetailsRef = useRef(null);
  const insuranceRequirementsRef = useRef(null);
  const clientDetailsRef = useRef(null);

  const context = useContext('clink');
  const { actions } = context;
  const [isDirty, setIsDirty] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  const computeSnapshot = useCallback(
    () =>
      JSON.stringify({
        addressOne,
        addressTwo,
        city,
        postcode,
        openingHoursWeekdays,
        openingHoursWeekends,
        siteConstrains,
        clientAddressOne,
        clientAddressTwo,
        clientCity,
        clientPostcode,
        clientName,
        clientRegNumber,
        clientContactName,
        clientContactEmail,
        clientContactPostalCode,
        workInsurance,
        productInsurance,
        professionalIndemnityInsurance,
        productInsuranceResponsible,
        workInsuranceResponsible,
        professionalIndemnityResponsible,
        principalContractor,
        noticeCommenceWorks,
        commentPeriodSubcontractorDrawings,
        subContractBaseDate,
        sectionalCompletion,
        retentionReleaseDate,
        primeCostAdditionMaterials,
        primeCostAdditionPlant,
        nomineeDisputes,
        mainContractSignedDate,
        rectificationDefectsPeriod,
        retention,
        employerAgent,
        principalDesigner,
        formContractMain,
        editionOfJCT,
        scheduleOfAmendments,
        datePossessionSite,
        reviewPeriodDrawings,
        advanceWarningPeriod,
        sectionalCompletionDates,
        globalDateForPossession,
        projectSections,
        mainContractorPostal,
        mainContractorEmail,
        subContractorPostal,
        subContractorEmail,
        interimValuationFrequency,
        paymentDueDate,
        finalDateForPayment,
        deadlinePayLessNotices,
        scheduleOfPaymentsProvided,
        advancePaymentProvision,
        areLiquidatedDamagesApplicable,
        liquidatedDamagesRate,
        capOnLiquidatedDamages,
        amendmentsRelevantEventsMatters,
        governingLaw,
        designResponsibility,
        designResponsibilityPeriod,
        collateralWarrantiesRequired,
        warrantiesProvidedTo,
        isPerformanceBond,
        gia,
      }),
    [
      addressOne,
      addressTwo,
      city,
      postcode,
      openingHoursWeekdays,
      openingHoursWeekends,
      siteConstrains,
      clientAddressOne,
      clientAddressTwo,
      clientCity,
      clientPostcode,
      clientName,
      clientRegNumber,
      clientContactName,
      clientContactEmail,
      clientContactPostalCode,
      workInsurance,
      productInsurance,
      professionalIndemnityInsurance,
      productInsuranceResponsible,
      workInsuranceResponsible,
      professionalIndemnityResponsible,
      principalContractor,
      noticeCommenceWorks,
      commentPeriodSubcontractorDrawings,
      subContractBaseDate,
      sectionalCompletion,
      retentionReleaseDate,
      primeCostAdditionMaterials,
      primeCostAdditionPlant,
      nomineeDisputes,
      mainContractSignedDate,
      rectificationDefectsPeriod,
      retention,
      employerAgent,
      principalDesigner,
      formContractMain,
      editionOfJCT,
      scheduleOfAmendments,
      datePossessionSite,
      reviewPeriodDrawings,
      advanceWarningPeriod,
      sectionalCompletionDates,
      globalDateForPossession,
      projectSections,
      mainContractorPostal,
      mainContractorEmail,
      subContractorPostal,
      subContractorEmail,
      interimValuationFrequency,
      paymentDueDate,
      finalDateForPayment,
      deadlinePayLessNotices,
      scheduleOfPaymentsProvided,
      advancePaymentProvision,
      areLiquidatedDamagesApplicable,
      liquidatedDamagesRate,
      capOnLiquidatedDamages,
      amendmentsRelevantEventsMatters,
      governingLaw,
      designResponsibility,
      designResponsibilityPeriod,
      collateralWarrantiesRequired,
      warrantiesProvidedTo,
      isPerformanceBond,
      gia,
    ],
  );

  // Update state when projectData changes
  useEffect(() => {
    if (projectData && Object.keys(projectData).length > 0) {
      // site details
      setAddressOne(projectData.site_address_one ?? '');
      setAddressTwo(projectData.site_address_two ?? '');
      setCity(projectData.site_address_city ?? '');
      setPostcode(projectData.site_address_postcode ?? '');
      // site details 2
      setOpeningHoursWeekdays(projectData.opening_hours_weekdays ?? '');
      setOpeningHoursWeekends(projectData.opening_hours_weekends ?? '');
      setSiteConstrains(projectData?.site_constrains ?? '');
      // client details
      setClientAddressOne(projectData.client_address_one ?? '');
      setClientAddressTwo(projectData.client_address_two ?? '');
      setClientCity(projectData.client_address_city ?? '');
      setClientPostcode(projectData.client_address_postcode ?? '');
      // client details 2
      setClientName(projectData.client_name ?? '');
      setClientRegNumber(projectData.client_reg_number ?? '');
      // client details 2 (optional)
      setClientContactName(projectData?.client_contact_name ?? '');
      setClientContactEmail(projectData?.client_contact_email ?? '');
      setClientContactPostalCode(projectData?.client_contact_postal_code ?? '');
      // insurances
      setWorkInsurance(projectData?.employer_liabilty_insurance ?? 0);
      setProfessionalIndemnityInsurance(
        projectData?.professional_indemnity_insurance ?? 0,
      );
      setProductInsurance(projectData?.public_product_insurance ?? 0);
      setProductInsuranceResponsible(
        projectData?.public_product_insurance_responsible ?? '',
      );
      setWorkInsuranceResponsible(
        projectData?.employer_liabilty_insurance_responsible ?? '',
      );
      setProfessionalIndemnityResponsible(
        projectData?.professional_indemnity_insurance_responsible ?? '',
      );
      // main contract structure
      setPrincipalContractor(projectData?.principal_contractor ?? '');
      setNoticeCommenceWorks(
        projectData?.notice_period_commence_work_on_site ?? '',
      );
      setCommentPeriodSubcontractorDrawings(
        projectData?.comment_period_subcontractor_drawings ?? '',
      );
      setSubContractBaseDate(projectData?.sub_contract_base_date ?? '');
      setSectionalCompletion(
        projectData?.does_sectional_completion_apply ?? '',
      );
      setRetentionReleaseDate(projectData?.retention_release_date ?? '');
      setPrimeCostAdditionMaterials(
        projectData?.prime_cost_addition_for_materials ?? '',
      );
      setPrimeCostAdditionPlant(
        projectData?.prime_cost_addition_for_plant ?? '',
      );
      setNomineeDisputes(projectData?.nominee_for_disputes ?? '');
      setMainContractSignedDate(projectData?.main_contract_signed_date ?? '');
      setRectificationDefectsPeriod(
        projectData?.rectification_defects_period ?? '',
      );
      setRetention(projectData?.retention ?? '');
      setEmployerAgent(projectData?.employers_agent ?? '');
      setPrincipalDesigner(projectData?.principal_designer ?? '');
      setFormContractMain(
        projectData?.form_of_contract_for_main_contract ?? '',
      );
      setEditionOfJCT(projectData?.edition_of_jct_contract ?? '');
      setScheduleOfAmendments(
        projectData?.schedule_of_amendments_reference ?? '',
      );
      // key dates
      setDatePossessionSite(projectData?.date_for_possession_of_site ?? null);
      setSectionalCompletionDates(
        projectData?.sectional_completion_dates === undefined ||
          projectData?.sectional_completion_dates === null ||
          projectData?.sectional_completion_dates === ''
          ? null
          : !!projectData?.sectional_completion_dates,
      );
      setGlobalDateForPossession(
        projectData?.global_date_for_possession ?? null,
      );
      setProjectSections(normalizeSections(projectData?.project_sections));
      // addresses for notices
      setMainContractorPostal(
        projectData?.main_contractor_postal_address_for_notices ?? '',
      );
      setMainContractorEmail(
        projectData?.main_contractor_email_address_for_notices ?? '',
      );
      setSubContractorPostal(
        projectData?.subcontractor_postal_address_for_notices ?? '',
      );
      setSubContractorEmail(
        projectData?.subcontractor_email_address_for_notices ?? '',
      );
      // Payment Terms
      setInterimValuationFrequency(
        projectData?.interim_valuation_frequency ?? '',
      );
      setPaymentDueDate(projectData?.payment_due_date ?? '');
      setFinalDateForPayment(projectData?.final_date_for_payment ?? '');
      setDeadlinePayLessNotices(
        projectData?.deadline_for_pay_less_notices ?? '',
      );
      setScheduleOfPaymentsProvided(
        projectData?.schedule_of_payments_provided === undefined
          ? null
          : !!projectData?.schedule_of_payments_provided,
      );
      setAdvancePaymentProvision(
        projectData?.advance_payment_provision === undefined
          ? null
          : !!projectData?.advance_payment_provision,
      );
      setErrorsPaymentTerms([]);
      // Legal & Dispute Terms
      setAreLiquidatedDamagesApplicable(
        projectData?.liquidated_damages_applicable === undefined
          ? null
          : !!projectData?.liquidated_damages_applicable,
      );
      setLiquidatedDamagesRate(projectData?.liquidated_damages_rate ?? '');
      setCapOnLiquidatedDamages(projectData?.cap_on_liquidated_damages ?? '');
      setAmendmentsRelevantEventsMatters(
        projectData?.amendments_relevant_events_matters === undefined
          ? null
          : !!projectData?.amendments_relevant_events_matters,
      );
      setGoverningLaw(projectData?.governing_law ?? 'English Law');
      setErrorsLegalDisputeTerms([]);
      //  Design & Warranties
      setDesignResponsibility(
        projectData?.design_responsibility === undefined
          ? null
          : !!projectData?.design_responsibility,
      );
      setDesignResponsibilityPeriod(
        projectData?.design_responsibility_period ?? '',
      );
      setCollateralWarrantiesRequired(
        projectData?.collateral_warranties_required === undefined
          ? null
          : !!projectData?.collateral_warranties_required,
      );
      setWarrantiesProvidedTo(projectData?.warranties_provided_to ?? '');
      setErrorsDesignWarranties([]);
      // Commercial Terms
      setIsPerformanceBond(
        projectData?.performance_bond === undefined
          ? null
          : !!projectData?.performance_bond,
      );
      // others
      setGia(projectData?.gia);
    }
    setInitialSnapshot(null);
    setIsDirty(false);
  }, [projectData]);

  useEffect(() => {
    if (!projectData || initialSnapshot !== null) return;
    const snap = computeSnapshot();
    setInitialSnapshot(snap);
  }, [projectData, initialSnapshot, computeSnapshot]);

  const handleUpdateProject = async () => {
    const result = await dispatch(
      actions.updateProject({
        data: {
          // site details
          site_address_one: addressOne,
          site_address_two: addressTwo ?? '',
          site_address_city: city,
          site_address_postcode: postcode,
          // site details 2
          opening_hours_weekdays: openingHoursWeekdays,
          opening_hours_weekends: openingHoursWeekends,
          site_constrains: siteConstrains,
          // client details
          client_address_one: clientAddressOne,
          client_address_two: clientAddressTwo ?? '',
          client_address_city: clientCity,
          client_address_postcode: clientPostcode,
          // client details 2
          client_name: clientName,
          client_reg_number: clientRegNumber,
          // client details 2 (optional)
          client_contact_name: clientContactName,
          client_contact_email: clientContactEmail,
          client_contact_postal_code: clientContactPostalCode,
          // insurances
          public_product_insurance: productInsurance,
          employer_liabilty_insurance: workInsurance,
          professional_indemnity_insurance: professionalIndemnityInsurance,
          public_product_insurance_responsible: productInsuranceResponsible,
          employer_liabilty_insurance_responsible: workInsuranceResponsible,
          professional_indemnity_insurance_responsible:
            professionalIndemnityResponsible,
          // main contract structure
          principal_contractor: principalContractor,
          notice_period_commence_work_on_site: noticeCommenceWorks,
          comment_period_subcontractor_drawings:
            commentPeriodSubcontractorDrawings,
          sub_contract_base_date: subContractBaseDate,
          does_sectional_completion_apply: sectionalCompletion,
          retention_release_date: retentionReleaseDate,
          prime_cost_addition_for_materials: primeCostAdditionMaterials,
          prime_cost_addition_for_plant: primeCostAdditionPlant,
          nominee_for_disputes: nomineeDisputes,
          main_contract_signed_date: mainContractSignedDate,
          rectification_defects_period: rectificationDefectsPeriod,
          retention,
          employers_agent: employerAgent,
          principal_designer: principalDesigner,
          form_of_contract_for_main_contract: formContractMain,
          edition_of_jct_contract: editionOfJCT,
          schedule_of_amendments_reference: scheduleOfAmendments,
          // key dates
          date_for_possession_of_site: datePossessionSite,
          review_period_for_drawings: reviewPeriodDrawings,
          advance_warning_period: advanceWarningPeriod,
          sectional_completion_dates: sectionalCompletionDates,
          // key dates - section workflow
          global_date_for_possession: globalDateForPossession,
          project_sections: JSON.stringify(projectSections || []),
          // addresses for notices
          main_contractor_postal_address_for_notices: mainContractorPostal,
          main_contractor_email_address_for_notices: mainContractorEmail,
          subcontractor_postal_address_for_notices: subContractorPostal,
          subcontractor_email_address_for_notices: subContractorEmail,
          // Payment Terms
          interim_valuation_frequency: interimValuationFrequency,
          payment_due_date: paymentDueDate,
          final_date_for_payment: finalDateForPayment || null,
          deadline_for_pay_less_notices: deadlinePayLessNotices || null,
          schedule_of_payments_provided: scheduleOfPaymentsProvided,
          advance_payment_provision: advancePaymentProvision,
          // Legal & Dispute Terms
          liquidated_damages_applicable: areLiquidatedDamagesApplicable,
          liquidated_damages_rate: liquidatedDamagesRate,
          cap_on_liquidated_damages: capOnLiquidatedDamages,
          amendments_relevant_events_matters: amendmentsRelevantEventsMatters,
          governing_law: governingLaw,
          //  Design & Warranties
          design_responsibility: designResponsibility,
          design_responsibility_period: designResponsibilityPeriod,
          collateral_warranties_required: collateralWarrantiesRequired,
          warranties_provided_to: warrantiesProvidedTo,
          // Commercial Terms
          performance_bond: isPerformanceBond,
          // others
          gia,
        },
        pid: projectData?.id,
      }),
    );
    if (result?.error) {
      const error = `${result?.error?.name || 'Error'} - ${
        result?.error?.message
      }`;
      setErrorsOne(error);
      setErrorsTwo(error);
      setErrorsThree(error);
      setErrorsKeyDates(error);
      return;
    }
    navigate(
      `/main-contractor/projects/${
        projectData?.slug || undefined
      }/setup/reference_files`,
    );
  };

  useEffect(() => {
    if (!initialSnapshot) return;
    const current = computeSnapshot();
    setIsDirty(current !== initialSnapshot);
  }, [computeSnapshot, initialSnapshot]);

  return {
    isDirty,
    // site details
    useAddressOne: [addressOne, setAddressOne],
    useAddressTwo: [addressTwo, setAddressTwo],
    useCity: [city, setCity],
    usePostcode: [postcode, setPostcode],
    // site details 2
    useWeekdays: [openingHoursWeekdays, setOpeningHoursWeekdays],
    useWeekends: [openingHoursWeekends, setOpeningHoursWeekends],
    useSiteConstrains: [siteConstrains, setSiteConstrains],
    // client details
    useClientAddressOne: [clientAddressOne, setClientAddressOne],
    useClientAddressTwo: [clientAddressTwo, setClientAddressTwo],
    useClientCity: [clientCity, setClientCity],
    useClientPostcode: [clientPostcode, setClientPostcode],
    // client details 2
    useClientName: [clientName, setClientName],
    useClientRegNumber: [clientRegNumber, setClientRegNumber],
    // client contact notices (optional)
    useClientContactName: [clientContactName, setClientContactName],
    useClientContactEmail: [clientContactEmail, setClientContactEmail],
    useClientContactPostalCode: [
      clientContactPostalCode,
      setClientContactPostalCode,
    ],
    // insurances
    useProductInsurance: [productInsurance, setProductInsurance],
    useWorkInsurance: [workInsurance, setWorkInsurance],
    useProfessionalIndemnityInsurance: [
      professionalIndemnityInsurance,
      setProfessionalIndemnityInsurance,
    ],
    useProductInsuranceResponsible: [
      productInsuranceResponsible,
      setProductInsuranceResponsible,
    ],
    useWorkInsuranceResponsible: [
      workInsuranceResponsible,
      setWorkInsuranceResponsible,
    ],
    useProfessionalIndemnityResponsible: [
      professionalIndemnityResponsible,
      setProfessionalIndemnityResponsible,
    ],
    // main contract structure
    usePrincipalContractor: [principalContractor, setPrincipalContractor],
    useNoticeCommenceWorks: [noticeCommenceWorks, setNoticeCommenceWorks],
    useCommentPeriodSubcontractorDrawings: [
      commentPeriodSubcontractorDrawings,
      setCommentPeriodSubcontractorDrawings,
    ],
    useSubContractBaseDate: [subContractBaseDate, setSubContractBaseDate],
    useSectionalCompletion: [sectionalCompletion, setSectionalCompletion],
    useRetentionReleaseDate: [retentionReleaseDate, setRetentionReleaseDate],
    usePrimeCostAdditionMaterials: [
      primeCostAdditionMaterials,
      setPrimeCostAdditionMaterials,
    ],
    usePrimeCostAdditionPlant: [
      primeCostAdditionPlant,
      setPrimeCostAdditionPlant,
    ],
    useNomineeDisputes: [nomineeDisputes, setNomineeDisputes],
    useMainContractSignedDate: [
      mainContractSignedDate,
      setMainContractSignedDate,
    ],
    useRectificationDefectsPeriod: [
      rectificationDefectsPeriod,
      setRectificationDefectsPeriod,
    ],
    useRetention: [retention, setRetention],
    useEmployerAgent: [employerAgent, setEmployerAgent],
    usePrincipalDesigner: [principalDesigner, setPrincipalDesigner],
    useFormContractMain: [formContractMain, setFormContractMain],
    useEditionOfJCT: [editionOfJCT, setEditionOfJCT],
    useScheduleOfAmendments: [scheduleOfAmendments, setScheduleOfAmendments],
    // key dates
    useDatePossessionSite: [datePossessionSite, setDatePossessionSite],
    useSectionalCompletionDates: [
      sectionalCompletionDates,
      setSectionalCompletionDates,
    ],
    useReviewPeriodDrawings: [reviewPeriodDrawings, setReviewPeriodDrawings],
    useAdvanceWarningPeriod: [advanceWarningPeriod, setAdvanceWarningPeriod],
    // key dates - sectional workflow
    useGlobalDateForPossession: [
      globalDateForPossession,
      setGlobalDateForPossession,
    ],
    useProjectSections: [projectSections, setProjectSections],
    // addresses for notices
    useMainContractorPostal: [mainContractorPostal, setMainContractorPostal],
    useMainContractorEmail: [mainContractorEmail, setMainContractorEmail],
    useSubContractorPostal: [subContractorPostal, setSubContractorPostal],
    useSubContractorEmail: [subContractorEmail, setSubContractorEmail],
    // Payment Terms
    useInterimValuationFrequency: [
      interimValuationFrequency,
      setInterimValuationFrequency,
    ],
    usePaymentDueDate: [paymentDueDate, setPaymentDueDate],
    useFinalDateForPayment: [finalDateForPayment, setFinalDateForPayment],
    useDeadlinePayLessNotices: [
      deadlinePayLessNotices,
      setDeadlinePayLessNotices,
    ],
    useScheduleOfPaymentsProvided: [
      scheduleOfPaymentsProvided,
      setScheduleOfPaymentsProvided,
    ],
    useAdvancePaymentProvision: [
      advancePaymentProvision,
      setAdvancePaymentProvision,
    ],
    useErrorsPaymentTerms: [errorsPaymentTerms, setErrorsPaymentTerms],
    // Legal & Dispute Terms
    useAreLiquidatedDamagesApplicable: [
      areLiquidatedDamagesApplicable,
      setAreLiquidatedDamagesApplicable,
    ],
    useLiquidatedDamagesRate: [liquidatedDamagesRate, setLiquidatedDamagesRate],
    useCapOnLiquidatedDamages: [
      capOnLiquidatedDamages,
      setCapOnLiquidatedDamages,
    ],
    useAmendmentsRelevantEventsMatters: [
      amendmentsRelevantEventsMatters,
      setAmendmentsRelevantEventsMatters,
    ],
    useGoverningLaw: [governingLaw, setGoverningLaw],
    useErrorsLegalDisputeTerms: [
      errorsLegalDisputeTerms,
      setErrorsLegalDisputeTerms,
    ],
    // Design & Warranties
    useDesignResponsibility: [designResponsibility, setDesignResponsibility],
    useDesignResponsibilityPeriod: [
      designResponsibilityPeriod,
      setDesignResponsibilityPeriod,
    ],
    useCollateralWarrantiesRequired: [
      collateralWarrantiesRequired,
      setCollateralWarrantiesRequired,
    ],
    useWarrantiesProvidedTo: [warrantiesProvidedTo, setWarrantiesProvidedTo],
    useErrorsDesignWarranties: [
      errorsDesignWarranties,
      setErrorsDesignWarranties,
    ],
    //Commercial Terms
    usePerformanceBond: [isPerformanceBond, setIsPerformanceBond],
    // others
    useGia: [gia, setGia],
    // errors
    useErrorsOne: [errorsOne, setErrorsOne],
    useErrorsTwo: [errorsTwo, setErrorsTwo],
    useErrorsThree: [errorsThree, setErrorsThree],
    useErrorKeyDates: [errorsKeyDates, setErrorsKeyDates],
    useErrorsInsurance: [errorsInsurance, setErrorsInsurance],
    handleUpdateProject,
    siteDetailsRef,
    insuranceRequirementsRef,
    clientDetailsRef,
  };
};

export default useUpdateProject;
