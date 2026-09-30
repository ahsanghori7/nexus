import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import {
  Card,
  CardBody,
  CardImage,
  CardLink,
  CardTitle,
  CardInfoLine,
  Image,
  CONSTANTS,
} from 'clink-components';
import { useTranslation } from 'react-i18next';
import { checkIfImageExists } from 'v2/helpers/url';
import { DEFAULT_DATE_FORMAT } from 'v2/helpers/date';
import { MuiNewOpportunityBanner } from 'v2/apps/shared/components/cards/big/styled';

const {
  locationLogo,
  infoLogo,
  rocketLogo,
  calendarLogo,
  statusLogo,
  prosperPackagesDefault,
  distancePurple,
} = CONSTANTS.s3;
const { blueMagentaViolet } = CONSTANTS.colors.general;

const OpportunityCard = ({
  item,
  cardTheme = 'prosper-big-card',
  distanceData = null,
}) => {
  const { t } = useTranslation();
  const [image, setImage] = useState('');
  const { isNew } = item;

  useEffect(() => {
    checkIfImageExists(item.projectImage, (exists) => {
      setImage(exists ? item.projectImage : prosperPackagesDefault);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card key={item.id} theme={cardTheme}>
      {isNew && (
        <MuiNewOpportunityBanner>
          {t('new-opportunity')}
        </MuiNewOpportunityBanner>
      )}
      <CardImage theme={cardTheme} src={image} alt={item.projectName} />
      <CardTitle theme={cardTheme}>{item.projectName}</CardTitle>
      <CardBody theme={cardTheme} disabled={item.restricted}>
        <CardInfoLine theme={cardTheme}>
          <span>
            <Image src={locationLogo} />
            {t('text-project-region')}:
          </span>
          <span className="green-values">{item.region}</span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <span>
            <Image src={infoLogo} />
            {t('text-project-type')}:
          </span>
          <span className="green-values">{item.type}</span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <span>
            <Image src={rocketLogo} /> {t('text-start-on-site')}:
          </span>
          <span className="green-values">
            {item.start
              ? String(moment(new Date(item.start)).format(DEFAULT_DATE_FORMAT))
              : ''}
          </span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <span>
            <Image src={calendarLogo} /> {t('text-pc-date')}:
          </span>
          <span className="green-values">
            {item.end
              ? String(moment(new Date(item.end)).format(DEFAULT_DATE_FORMAT))
              : ''}
          </span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <span>
            <Image src={statusLogo} /> {t('status')}:
          </span>
          <span className="green-values">{item.phase}</span>
        </CardInfoLine>
        {distanceData &&
          distanceData.distance &&
          distanceData.distance.text && (
            <Grid container justifyContent="center">
              <Grid item sx={{ span: { width: 40 } }}>
                <Image src={distancePurple} />
              </Grid>
              <Grid
                container
                item
                flexDirection="column"
                sx={{ width: 142, textAlign: 'center' }}
              >
                <Grid sx={{ height: 20 }} item>
                  <Typography sx={{ color: blueMagentaViolet, fontSize: 16 }}>
                    {distanceData.distance.text} {t('away')}
                  </Typography>
                </Grid>
                <Grid sx={{ height: 20 }} item>
                  <Typography sx={{ fontSize: 14 }}>
                    {t('from-your-address')}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          )}
        <CardInfoLine theme={cardTheme}>
          <div className="link-wrapper">
            <CardLink
              theme={cardTheme}
              disabled={item.restricted}
              href={`${item.viewProject}`}
            >
              {`${t('View details')}`}
            </CardLink>
          </div>
        </CardInfoLine>
      </CardBody>
    </Card>
  );
};

export default OpportunityCard;
