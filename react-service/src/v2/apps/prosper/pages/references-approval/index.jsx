import React, { useState } from 'react';
import { CONSTANTS } from 'clink-components';
import { useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import PHPGloblals from 'v2/helpers/php-globals';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Title from 'v2/apps/prosper/pages/sign-up/shared/Title';
import InputText from 'v2/apps/prosper/pages/sign-up/shared/InputText';
import Container from 'v2/apps/prosper/pages/sign-up/shared/Container';
import moment from 'moment';
import ThankYouReference from './ThankYouReference';

const { prosperBoxRed } = CONSTANTS.colors.prosper;
const { platinum } = CONSTANTS.colors.general;

const sxTextarea = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid rgba(0, 0, 0, 0.25)',
  borderRadius: '4px',
  fontFamily: 'inherit',
  padding: 8,
  lineHeight: 1.5,
};

const sxInputs = {
  '& input': {
    backgroundColor: platinum,
    fontSize: '13px',
  },
  '& label': {
    pb: 1,
    color: prosperBoxRed,
    fontSize: '14px',
  },
};

function Form() {
  const params = useParams();
  const { token } = params;

  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const [summary, setSummary] = useState('');
  const [submitError, setSubmitError] = useState(false);

  const conf = PHPGloblals();
  const data = (conf && conf.data) || {};

  const disableSubmit =
    !data ||
    !data.project ||
    !data.client ||
    !data.email ||
    !data.value ||
    !data.completion_date ||
    !data.description_of_works;

  const extra = {
    component: 'form',
    method: 'post',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestBody = {
      project: data.project,
      client: data.client,
      email: data.email,
      value: data.value,
      completion_date: data.completion_date,
      description_of_works: data.description_of_works,
      summary,
    };

    try {
      const response = await fetch(
        `${BASE_URLS.PROSPER}${RELAY.HOST}/${RELAY.VERSION}${BASE_URLS.REFERENCE}/activate/${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      setSubmitError(true);
    }
  };

  return (
    <>
      {submitError && <p>Error: Something went wrong</p>}
      {submitted && !submitError && <ThankYouReference />}
      {!submitted && !submitError && (
        <Container extra={extra} footer={false} name={false}>
          <Grid sx={sxInputs} container flexDirection="column">
            <Grid item my={5}>
              <Title
                sx={{
                  fontSize: '24pt',
                  whiteSpace: 'no-wrap',
                  marginBottom: '20px',
                }}
                title={t('work-reference-approval')}
              />
            </Grid>

            <Grid item mb={3}>
              <InputText
                id="project"
                name="project"
                label={t('enquiries-table-column-project')}
                placeholder={t('enquiries-table-column-project')}
                type="text"
                value={data.project}
                readOnly
              />
            </Grid>

            <Grid item mb={3}>
              <InputText
                id="client"
                name="client"
                label={t('enquiries-table-column-contractor')}
                placeholder={t('enquiries-table-column-contractor')}
                type="text"
                value={data.client}
                readOnly
              />
            </Grid>

            <Grid item mb={3}>
              <InputText
                id="email"
                name="email"
                label={t('email')}
                placeholder={t('email')}
                type="text"
                value={data.email}
                readOnly
              />
            </Grid>

            <Grid item mb={3}>
              <InputText
                id="value"
                name="value"
                label={t('approx-value')}
                placeholder={t('approx-value')}
                type="text"
                value={data.value}
                readOnly
              />
            </Grid>

            <Grid item mb={3}>
              <InputText
                id="completion_date"
                name="completion_date"
                label={t('approx-completion-date')}
                placeholder={t('approx-completion-date')}
                type="text"
                value={
                  (data.completion_date &&
                    moment(data.completion_date).format('Do MMM YYYY')) ||
                  null
                }
                readOnly
              />
            </Grid>

            <Grid item mb={3}>
              <InputLabel
                sx={{ fontWeight: 'bold', color: 'black' }}
                htmlFor=""
              >
                {t('work-description')}
              </InputLabel>
              <TextareaAutosize
                id="work-description"
                name="work-description"
                minRows={10}
                value={data.description_of_works}
                readOnly
                style={{ ...sxTextarea, backgroundColor: platinum }}
              />
            </Grid>

            <Grid item mb={3}>
              <InputLabel
                sx={{ fontWeight: 'bold', color: 'black' }}
                htmlFor=""
              >
                {t('summary')}
              </InputLabel>
              <TextareaAutosize
                id="summary"
                name="summary"
                minRows={10}
                value={summary}
                style={sxTextarea}
                onChange={(e) => setSummary(e.target.value)}
              />
            </Grid>

            <Grid item my={5}>
              <Button
                design="red"
                disabled={Boolean(disableSubmit)}
                onClick={handleSubmit}
              >
                {t('approve')}
              </Button>
            </Grid>
          </Grid>
        </Container>
      )}
    </>
  );
}

export default Form;
