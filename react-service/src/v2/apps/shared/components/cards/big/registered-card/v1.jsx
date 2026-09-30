import React, { useRef } from 'react';
import moment from 'moment';
import {
  Card,
  CardBody,
  CardImage,
  CardLink,
  CardTitle,
  CardInfoLine,
  Badge,
} from 'clink-components';
import { useTranslation } from 'react-i18next';
import { StyledTooltip } from '../styled';

const BadgeTooltip = ({ item, arrowPosition }) => {
  const { t } = useTranslation();
  const {
    label,
    start_on_site: startOnSite,
    tender_return: tenderReturn,
  } = item;
  return (
    <>
      <StyledTooltip
        className="prosper-tooltip-content"
        arrowPosition={arrowPosition}
      >
        <div className="prosper-tooltip-content-row">
          {t('label-tender-return-date')}:{' '}
          <span>
            {String(moment(new Date(tenderReturn)).format('DD MMMM YYYY'))}
          </span>
        </div>
        <div className="prosper-tooltip-content-row">
          {t('label-start-on-site-date')}:{' '}
          <span>
            {String(moment(new Date(startOnSite)).format('DD MMMM YYYY'))}
          </span>
        </div>
      </StyledTooltip>
      <div className="prosper-tooltip-trigger">{label}</div>
    </>
  );
};

const Tag = ({ tag }) => {
  const badgeRef = useRef();

  let arrowPosition = '';
  if (badgeRef.current) {
    const { clientWidth } = badgeRef.current;
    arrowPosition = `${clientWidth / 2}px`;
  }

  return (
    <Badge
      ref={badgeRef}
      color="prosper-orange"
      key={`${tag.label}-${tag.created_at}`}
      text={<BadgeTooltip arrowPosition={arrowPosition} item={tag} />}
    />
  );
};

const RegisteredCardV1 = ({ item, cardTheme = 'prosper-big-card', image }) => {
  const { t } = useTranslation();
  return (
    item && (
      <Card key={item.id} theme={cardTheme}>
        {image && <CardImage theme={cardTheme} src={image} alt={item.name} />}
        <CardTitle theme={cardTheme}>{item.name}</CardTitle>
        <CardBody theme={cardTheme}>
          <CardInfoLine theme={cardTheme}>
            <span>{t('registered')}:</span>
            {item.registeredDate && (
              <span className="green-values">
                {String(
                  moment(new Date(item.registeredDate)).format('Do MMMM YYYY'),
                )}
              </span>
            )}
          </CardInfoLine>
          <CardInfoLine theme={cardTheme}>
            {item.tenderTags && Boolean(item.tenderTags.length) && (
              <div className="card__info-description">
                {item.tenderTags.map((tag) => (
                  <Tag key={`${tag.label}-${tag.created_at}`} tag={tag} />
                ))}
              </div>
            )}
          </CardInfoLine>
          <CardInfoLine theme={cardTheme}>
            <div className="link-wrapper">
              <CardLink
                theme={cardTheme}
                disabled={item.restricted}
                href={`${item.viewProject}?unlocked_projects`}
              >
                {`${t('View details')}`}
              </CardLink>
            </div>
          </CardInfoLine>
        </CardBody>
      </Card>
    )
  );
};

export default RegisteredCardV1;
