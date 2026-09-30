import React, { useEffect, useState, useRef } from 'react';
import i18next from 'v2/helpers/i18n';
import {
  Button,
  Form,
  InputFormControlled,
  InputForm,
  Loader,
} from 'clink-components';
import { connect } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import isEmpty from 'lodash/isEmpty';
import { useContext } from 'hooks/context';
import { goTo, getQueryStringVars, setQueryStringVars } from 'v2/helpers/url';
import parseCurrency from 'v2/helpers/currency';
import Loading from 'v2/apps/shared/components/Loading';
import WarnModal from 'v2/apps/shared/components/WarnModal';
import InfoModal from 'v2/apps/shared/components/InfoModal';
import { instructionsBreadcrumbs } from 'v2/apps/clink/pages/shared/template/helpers';
import Template from 'v2/apps/clink/pages/shared/template';
import {
  StyledAddNewWrapper,
  StyledDropdownColumn,
  StyledAddDescriptionColumn,
  StyledAddAppendixColumn,
  StyledAddButtons,
  StyledButtonsWrapper,
  StyledBond,
  StyledValueColumnLeft,
  StyledValueColumnRight,
} from './styled';
import PreviewModal from './PreviewModal';
import useFormInstruction from './useFormInstruction';
import Dropzone from 'v2/apps/shared/components/dropzone';
import Editor from 'v2/apps/shared/components/editor';
import { Typography } from '@mui/material';

const pageMapping = {
  urlName: {
    'instructions-variations': 1,
    ncr: 2,
  },
  buttonName: {
    'instructions-variations': 'save-send-instruction',
    ncr: 'save-send-ncr',
  },
  urlPage: {
    'instructions-variations': 'instructions_variations',
    ncr: 'ncr',
  },
  label: {
    'instructions-variations': 'instruction',
    ncr: 'NCR',
  },
  info: {
    'instructions-variations': 'instruction-variation-info',
    ncr: 'ncr-info',
  },
};

const CREATE_MODE = 'create';
const EDIT_MODE = 'edit';
const SENT_STATUS = 1;

const FormInstruction = ({
  project,
  instructions,
  contextType = 'clink',
  theme = 'c-link',
  dispatch,
}) => {
  const { id, type } = getQueryStringVars();

  const [mode, setMode] = useState(id ? EDIT_MODE : CREATE_MODE);
  const [defaultValues, setDefaultValues] = useState({});
  const [openPreview, setOpenPreview] = useState(false);
  const params = useParams();
  const { slug } = params;
  const context = useContext(contextType);
  const { actions } = context;
  const { t } = useTranslation();
  const { data: dataProject } = project;
  const { data, subcontractorsList, status, blocked, sentSuccessfully } =
    instructions;

  const ref = useRef(null);
  const editorRef = useRef(null);

  // eslint-disable-next-line no-unused-vars
  const [_, setSearchParams] = useSearchParams();

  useEffect(() => {
    setMode(id ? EDIT_MODE : CREATE_MODE);
  }, [id]);

  useEffect(() => {
    if (dataProject && dataProject.id) {
      dispatch(actions.fetchSubcontractors(dataProject.id));
    }
  }, [actions, dataProject, dispatch]);

  useEffect(() => {
    if (dataProject && dataProject.id) {
      if (mode === CREATE_MODE) {
        setDefaultValues({
          pid: dataProject.id,
          type: pageMapping.urlName[type],
          subcontractor: null,
          package: null,
          description: '',
          value: '',
          tba: false,
        });
      }
      if (mode === EDIT_MODE) {
        dispatch(actions.fetchInstruction({ id }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractorsList, mode, id]);

  useEffect(() => {
    if (data) {
      if (data.status && Number(data.status.id) === SENT_STATUS) {
        dispatch(actions.blockAccess());
      } else if (data.id && mode === CREATE_MODE) {
        setSearchParams(setQueryStringVars({ id: data.id }));
        setMode(EDIT_MODE);
        if (Object.keys(data).length === 1) {
          dispatch(
            actions.fetchInstruction({ id: data.id, hideLoading: true }),
          );
        }
      } else {
        const newValue = data.price || '';
        setDefaultValues({
          pid: (dataProject && dataProject.id) || 0,
          type: data && data.type ? data.type.id : 0,
          subcontractor: data.subcontractor,
          package: data.tender,
          description: data.description || '',
          value: !newValue ? '' : parseCurrency(newValue),
          tba: !newValue,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const createInstruction = (form) => {
    if (mode === CREATE_MODE) {
      dispatch(actions.createInstruction({ data: form }));
    }
  };

  const updateInstruction = (idInstruction, instruction) => {
    if (mode === EDIT_MODE) {
      dispatch(actions.updateInstruction({ id: idInstruction, instruction }));
    }
  };

  const loading = !isEmpty(status) && status === 'loading';
  const fullLoading =
    !loading && !isEmpty(defaultValues) && !isEmpty(dataProject);
  const disabledPreview = !(
    id &&
    dataProject &&
    data &&
    data.status &&
    Number(data.status.id) !== SENT_STATUS
  );

  const breadcrumbs = instructionsBreadcrumbs(
    slug,
    type,
    t(type),
    dataProject || {},
    true,
    id,
    false,
  );
  return blocked ? (
    <Loading status="error" message={t('already-sent')} />
  ) : (
    <Template
      title={t(type)}
      slug={slug}
      extraPadding={loading}
      breadcrumb={breadcrumbs}
    >
      {loading && <Loader />}
      {!loading && !isEmpty(status) && status === 'send-instruction-error' && (
        <WarnModal />
      )}
      {!loading && isEmpty(subcontractorsList) && (
        <InfoModal
          theme={theme}
          title={t('no-subcontractors')}
          message={t('no-orders-yet')}
          closeLabel={t('issue-order')}
          disableEscapeKeyDown
          onHidden={() => {
            goTo(`${BASE_URLS.CLINK}/project/${slug}/quotes_tender`);
          }}
        />
      )}
      {sentSuccessfully && (
        <InfoModal
          theme={theme}
          title={t('success')}
          message={`Your ${pageMapping.label[type]} was sent`}
          closeLabel={t('done')}
          disableEscapeKeyDown
          success
          onHidden={() => {
            goTo(
              `${BASE_URLS.CLINK}/project/${slug}/${pageMapping.urlPage[type]}`,
            );
          }}
        />
      )}
      {!loading && fullLoading && (
        <Form
          className="add-new-instruction-form"
          disableUntilValid
          defaultValues={defaultValues}
          method="POST"
          onSubmit={(formData, e) => {
            const { nativeEvent } = e;
            const { submitter } = nativeEvent;
            const labelSubmitButton =
              submitter.textContent || submitter.innerText;
            const { type: typeValue, description, value } = formData;
            const newValue = value
              ? parseFloat(value.toString().replace(/,/g, '')) * 100
              : null;
            const instruction = {
              type: typeValue,
              price: Number(newValue),
              description,
            };
            setDefaultValues({
              ...defaultValues,
              value,
              description,
              tba: !newValue,
            });
            if (labelSubmitButton === t('save-draft')) {
              updateInstruction(id, { ...instruction, status: 2 });
            } else if (labelSubmitButton === t(pageMapping.buttonName[type])) {
              updateInstruction(id, { ...instruction, status: 1 });
            }
          }}
          render={(formHook) => {
            const {
              formState,
              register,
              trigger,
              setValue,
              control,
              getValues,
            } = formHook;

            const { errors } = formState;
            const { subcontractor, package: subPackage, tba } = getValues();

            // eslint-disable-next-line react-hooks/rules-of-hooks
            useFormInstruction(
              subcontractor,
              setValue,
              getValues,
              createInstruction,
            );

            const showPackageSelect = subcontractor && subcontractor.id;
            return (
              <>
                <InputForm
                  errors={errors}
                  register={register}
                  rules={{}}
                  name="pid"
                  type="hidden"
                />
                <InputForm
                  errors={errors}
                  register={register}
                  rules={{}}
                  name="type"
                  type="hidden"
                />
                <StyledAddNewWrapper>
                  <StyledDropdownColumn>
                    <InputFormControlled
                      errors={errors}
                      placeholder="Select from list"
                      register={register}
                      setValue={setValue}
                      control={control}
                      name="subcontractor"
                      type="select"
                      label={i18next.t('choose-subcontractor')}
                      rules={{ required: 'required' }}
                      theme="clink-new-instructions"
                      trigger={trigger}
                      selectOption={() => {
                        trigger(['subcontractor']);
                      }}
                      readOnly={
                        (!isEmpty(subcontractor) && mode === EDIT_MODE) ||
                        !isEmpty(subPackage)
                      }
                      options={subcontractorsList}
                    />
                    {showPackageSelect && (
                      <InputFormControlled
                        errors={errors}
                        placeholder="Select from list"
                        register={register}
                        setValue={setValue}
                        control={control}
                        name="package"
                        type="select"
                        label="What Package does this relate to?"
                        rules={{ required: 'required' }}
                        theme="clink-new-instructions"
                        trigger={trigger}
                        selectOption={(option) => {
                          trigger(['package']);
                          createInstruction({
                            pid: dataProject.id,
                            sid: subcontractor.id,
                            tid: option.id,
                            type: pageMapping.urlName[type],
                          });
                        }}
                        readOnly={!isEmpty(subPackage)}
                        options={subcontractor.packages}
                      />
                    )}
                  </StyledDropdownColumn>
                  {subPackage && subPackage.id && (
                    <>
                      <StyledAddDescriptionColumn>
                        <Typography
                          component="label"
                        >
                          Add a description
                        </Typography>
                        <Editor
                          ref={editorRef}
                          defaultValue={data?.description || ""}
                          label="Add a description"
                          onTextChange={(_delta, _oldDelta, source) => {
                            if (source === "user") {
                              const html = editorRef.current.root.innerHTML;
                              setValue("description", html, { shouldValidate: true });
                              trigger("description");
                            }
                          }}
                        />
                        {errors.description && (
                          <p className="error-message">{errors.description.message}</p>
                        )}
                      </StyledAddDescriptionColumn>
                      <StyledAddAppendixColumn>
                        <StyledValueColumnLeft content={i18next.t('currency')}>
                          <InputFormControlled
                            autoComplete="value"
                            label="Add a value"
                            errors={errors}
                            placeholder="1,500.00"
                            name="value"
                            type="currency"
                            theme={theme}
                            register={register}
                            control={control}
                            setValue={setValue}
                            trigger={trigger}
                            onBlur={() => trigger(['value'])}
                            allowComma={false}
                            rules={{
                              onChange: (e) => {
                                const value = e.target.value;
                                setValue('tba', !value);
                              },
                              validate: {
                                required: (value) => {
                                  if (!tba && !value) {
                                    return 'required';
                                  }
                                  return true;
                                },
                              },
                            }}
                          />
                        </StyledValueColumnLeft>
                        <StyledBond>OR</StyledBond>
                        <StyledValueColumnRight>
                          <InputFormControlled
                            autoComplete="tba"
                            errors={errors}
                            options={[
                              { label: 'To be valued & agreed', value: 1 },
                            ]}
                            name="tba"
                            type="checkbox"
                            register={register}
                            control={control}
                            trigger={trigger}
                            onBlur={() => trigger(['tba'])}
                            rules={{
                              onChange: (e) => {
                                const newChecked = e.currentTarget.checked;
                                if (newChecked) {
                                  setValue('value', '');
                                }
                              },
                            }}
                          />
                        </StyledValueColumnRight>
                        <Dropzone
                          data={data}
                          errors={errors}
                          register={register}
                          theme="c-link"
                        />
                      </StyledAddAppendixColumn>
                    </>
                  )}
                </StyledAddNewWrapper>
                {subPackage && subPackage.id && (
                  <StyledAddButtons>
                    <StyledButtonsWrapper>
                      <Button type="submit" label={t('save-draft')} ref={ref} />
                      <PreviewModal
                        disabledPreview={disabledPreview}
                        id={id}
                        type={type}
                        openPreview={openPreview}
                        setOpenPreview={setOpenPreview}
                        refSave={ref}
                      />
                      <Button
                        type="submit"
                        label={t(pageMapping.buttonName[type])}
                        color="green"
                      />
                    </StyledButtonsWrapper>
                    <p>{t(pageMapping.info[type])}</p>
                  </StyledAddButtons>
                )}
              </>
            );
          }}
        />
      )}
    </Template>
  );
};

const mapStateToProps = (state) => ({
  project: state.project,
  instructions: state.instructions,
});
export default connect(mapStateToProps)(FormInstruction);
