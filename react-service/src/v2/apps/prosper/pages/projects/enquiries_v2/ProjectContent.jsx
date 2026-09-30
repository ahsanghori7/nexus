import React from 'react';
import moment from 'moment';
import upperFirst from 'lodash/upperFirst';
import { useTranslation } from 'react-i18next';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import { Image, CONSTANTS } from 'clink-components';
import { DEFAULT_DATE_FORMAT } from 'v2/helpers/date';
import ItemData from 'v2/apps/shared/components/ItemData';
import { getProjectLogo } from 'v2/helpers/url';

const {
  locationLogo,
  infoLogo,
  calendarLogo,
  statusLogo,
  prosperPackagesDefault,
} = CONSTANTS.s3;

const ProjectContent = ({ data }) => {

  const { t } = useTranslation();
  return data ? (
    <Card
      sx={{
        maxWidth: 345,
        margin: '0 auto',
        padding: '16px',
        marginTop: '40px',
      }}
      variant="outlined"
    >
      <>
        <CardMedia
          component="img"
          height="218"
          image={getProjectLogo(data.project_id)}
          alt='Project Logo'
          onError={(e) => {
          e.target.src = prosperPackagesDefault
          }}
        />
        <CardContent>
          <List>
            <ItemData
              icon={<Image src={locationLogo} />}
              label={t('text-project-region')}
              value={data.project_region ?? ''}
            />
            <ItemData
              icon={<Image src={infoLogo} />}
              label={t('text-project-type')}
              value={data.project_type ?? ''}
            />
            <ItemData
              icon={<Image src={calendarLogo} />}
              label={t('text-start-on-site')}
              value={
                data.project_start
                  ? String(
                      moment(new Date(data.project_start)).format(
                        DEFAULT_DATE_FORMAT
                      )
                    )
                  : ''
              }
            />
            <ItemData
              icon={<Image src={calendarLogo} />}
              label={t('text-pc-date')}
              value={
                data.project_completion
                  ? String(
                      moment(new Date(data.project_completion)).format(
                        DEFAULT_DATE_FORMAT
                      )
                    )
                  : ''
              }
            />
            <ItemData
              icon={<Image src={statusLogo} />}
              label={t('status')}
              value={upperFirst(data.project_status ?? '')}
            />
          </List>
        </CardContent>
      </>
    </Card>
  ) : null;
};

export default ProjectContent;
