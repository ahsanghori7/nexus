import React from 'react';
import moment from 'moment';
import Subscription from 'v2/helpers/user/subscription';
import { useTranslation } from 'react-i18next';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { Image, CONSTANTS } from 'clink-components';
import { DEFAULT_DATE_FORMAT } from 'v2/helpers/date';
import ItemData from 'v2/apps/shared/components/ItemData';

const { locationLogo, infoLogo, calendarLogo } = CONSTANTS.s3;

const subscriptionHelper = new Subscription();
const Content = ({ data, idContact, subcontractor = {} }) => {
  const { t } = useTranslation();

  const url = `/company_profile/${data.group_id}${
    idContact ? `/${idContact}` : ''
  }?pid=${data.project_id}`;
  let link = url;
  link =
    link &&
    subcontractor &&
    !subscriptionHelper.isExternal(subcontractor.subscription_id)
      ? link
      : null;

  const extraLink = {
    state: {
      fromUrl: window.location.pathname,
      fromName: t('enquiries'),
    },
  };
  return data ? (
    <CardContent>
      <List>
        <ItemData
          icon={<Image src={locationLogo} />}
          label={t('enquiries-table-column-contractor')}
          value={data.contractor ?? ''}
          link={link}
          extraLink={extraLink}
        />
        <ItemData
          icon={<Image src={infoLogo} />}
          label={t('text-service-required')}
          value={data.service ?? ''}
        />
        <ItemData
          icon={<Image src={calendarLogo} />}
          label={t('text-start-on-site')}
          value={
            data.startOnSite
              ? String(
                  moment(new Date(data.startOnSite)).format(DEFAULT_DATE_FORMAT)
                )
              : ''
          }
        />
        <ItemData
          icon={<Image src={calendarLogo} />}
          label={t('text-estimated-decision-date')}
          value={
            data.decisionDate && data.decisionDate !== 'Invalid date'
              ? String(
                  moment(new Date(data.decisionDate)).format(
                    DEFAULT_DATE_FORMAT
                  )
                )
              : 'N/a'
          }
        />
        <ItemData
          icon={
            <Typography
              sx={{ fontSize: '22px', paddingLeft: '2px' }}
              color="error"
            >
              {t('currency')}
            </Typography>
          }
          label={t('text-package-size')}
          value={data.size ?? ''}
        />
        <ItemData
          icon={
            <Typography
              sx={{ fontSize: '22px', paddingLeft: '2px' }}
              color="error"
            >
              {t('currency')}
            </Typography>
          }
          label="Employers Liability"
          value={data.employer_liabilty_insurance ?? ''}
        />
      </List>
    </CardContent>
  ) : null;
};

export default Content;
