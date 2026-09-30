import React from 'react';
import moment from 'moment';
import {
  Card,
  CardBody,
  CardImage,
  CardLink,
  CardTitle,
  CardInfoLine,
} from 'clink-components';
import { useTranslation } from 'react-i18next';

const RegisteredCardV2 = ({ item, cardTheme = 'prosper-big-card', image }) => {
  const { t } = useTranslation();
  return (
    item && (
      <Card key={item.id} theme={cardTheme}>
        {image && <CardImage theme={cardTheme} src={image} alt={item.name} />}
        <CardTitle theme={cardTheme}>{item.name}</CardTitle>
        <CardBody theme={cardTheme}>
          <CardInfoLine theme={cardTheme}>
            <span>{t('unlocked')}:</span>
            {item.registeredDate && (
              <span className="green-values">
                {String(
                  moment(new Date(item.registeredDate)).format('Do MMMM YYYY')
                )}
              </span>
            )}
          </CardInfoLine>
          {item.tenderTags &&
            Boolean(item.tenderTags.length) &&
            item.tenderTags.map((tag) => (
              <CardInfoLine
                key={`${tag.label}-${tag.created_at}`}
                theme={cardTheme}
              >
                <>
                  <span>{tag.label}:</span>
                  <span className="green-values">
                    {tag.created_at
                      ? String(
                          moment(new Date(tag.created_at)).format(
                            'Do MMMM YYYY'
                          )
                        )
                      : 'N/A'}
                  </span>
                </>
              </CardInfoLine>
            ))}
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

export default RegisteredCardV2;
