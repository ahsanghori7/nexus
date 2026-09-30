import React from 'react';
import moment from 'moment';
import capitalize from 'lodash/capitalize';
import ReactHtmlParser from 'react-html-parser';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { metricSystemFormat } from 'v2/helpers/currency';
import { expiredDate } from 'v2/helpers/date';
import { OTHER_CERTIFICATE_DOC } from 'v2/helpers/prequal/documents';
import Doc from './Doc';
import Content from './documents_v2/Content';

const DocumentInfo = ({
  aid,
  data = [],
  setSelected,
  handleRemove,
  handleOnShow,
  showValue = true,
  showExpiration = true,
  showRequestedBy = true,
  icon = null,
  defaultIcon = null,
  expiration = null,
  money = null,
  options = [],
}) => {
  const { t } = useTranslation();

  const actions = (d) => [
    {
      id: 1,
      label: capitalize(t('edit')),
      action: () => {
        setSelected(d);
        handleOnShow();
      },
    },
  ];

  return data.map((d) => {
    let getLabel = options.filter((o) => o.label === d.label);
    getLabel = getLabel.length ? d.label : OTHER_CERTIFICATE_DOC;
    const docIcon = icon && [getLabel] in icon ? icon[getLabel] : defaultIcon;
    const docExpiration =
      expiration && [getLabel] in expiration
        ? expiration[getLabel]
        : showExpiration;
    const docMoney = money && [getLabel] in money ? money[getLabel] : showValue;

    const requested = d.requested;
    const responsiveView = docMoney ? { xs: 5, md: 8, lg: 9 } : { xs: 12 };
    return (
      <Doc
        key={`${d.id}-${d.label}`}
        expired={expiredDate(new Date(d.date))}
        requested={requested}
        updateAction={() => {
          setSelected(d);
          handleOnShow();
        }}
        actions={
          d && Boolean(d.id) && !requested
            ? [
                ...actions(d),
                {
                  id: 2,
                  label: t('delete'),
                  action: () => handleRemove(d.id),
                },
              ]
            : actions(d)
        }
      >
        <Content
          aid={aid}
          title={d.label}
          idDoc={d.id}
          icon={docIcon}
          date={d.date}
          document={d.document}
          fileName={d.original_file}
        >
          {d && d.description && (
            <Grid
              item
              xs={12}
              sx={{
                'p, div': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '500px',
                  display: 'none',
                  '&:nth-of-type(-n+2)': {
                    display: 'block',
                  },
                },
              }}
            >
              {ReactHtmlParser(d.description)}
            </Grid>
          )}
          {!requested && docMoney && (
            <Grid item xs={7} md={4} lg={3}>
              <Typography>
                {t('value')}
                <br />
                {Boolean(d && d.price) && metricSystemFormat(d.price)}
              </Typography>
            </Grid>
          )}
          {!requested && docExpiration && (
            <Grid item {...responsiveView}>
              <Typography>
                {expiredDate(new Date(d.date)) ? t('expired') : t('expiration')}
                <br />
                {Boolean(d.date) &&
                  String(moment(new Date(d.date)).format('MM/YYYY'))}
              </Typography>
            </Grid>
          )}
          {requested && showRequestedBy && (
            <Grid item xs={12}>
              <Typography>
                {t('update-requested-by')}
                <br />
                {d.requestedBy}
              </Typography>
            </Grid>
          )}
        </Content>
      </Doc>
    );
  });
};

export default DocumentInfo;
