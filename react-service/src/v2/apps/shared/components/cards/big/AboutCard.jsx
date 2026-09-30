import React from 'react';
import {
  Card,
  CardBody,
  CardInfoLine,
  Image,
  CONSTANTS,
} from 'clink-components';
import i18next from 'v2/helpers/i18n';
import moment from 'moment';

const { locationLogo, infoLogo, rocketLogo, calendarLogo, statusLogo } =
  CONSTANTS.s3;
const AboutCard = ({
  restricted = false,
  region = '*****',
  type = '*****',
  start = '4th December 2021',
  end = '19th November 2021',
  phase = '*****',
  cardTheme = 'prosper-about-card',
}) => {
  return (
    <Card theme={cardTheme}>
      <CardBody theme={cardTheme} disabled={restricted}>
        <CardInfoLine theme={cardTheme}>
          <div className="info__line--head">
            <Image src={locationLogo} />
            {i18next.t('text-project-location')}:
          </div>
          <span className="info__line--description">{region}</span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <div className="info__line--head">
            <Image src={infoLogo} />
            {i18next.t('text-project-type')}:
          </div>
          <span className="info__line--description">{type}</span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <div className="info__line--head">
            <Image src={rocketLogo} /> {i18next.t('text-start-on-site')}:
          </div>
          <span className="info__line--description">
            {String(moment(new Date(start)).format('Do MMMM YYYY'))}
          </span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <div className="info__line--head">
            <Image src={calendarLogo} /> {i18next.t('text-pc-date')}:
          </div>
          <span className="info__line--description">
            {String(moment(new Date(end)).format('Do MMMM YYYY'))}
          </span>
        </CardInfoLine>
        <CardInfoLine theme={cardTheme}>
          <div className="info__line--head">
            <Image src={statusLogo} /> {i18next.t('status')}:
          </div>
          <span className="info__line--description">{phase}</span>
        </CardInfoLine>
      </CardBody>
    </Card>
  );
};

export default AboutCard;
