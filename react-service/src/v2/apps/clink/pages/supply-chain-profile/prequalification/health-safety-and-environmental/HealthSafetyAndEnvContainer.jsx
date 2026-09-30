import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MuiTabTitle } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import Tabs from 'v2/apps/clink/pages/supply-chain-profile/tabs';
import PreqContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/PreqContent';
import {
  MuiDownloadBox,
  MuiEmptyReferenceBox,
  MuiReferenceBox,
  MuiScrollerContainer,
} from '../mui.styled';
import ReferenceContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/ReferenceContent';
import React from 'react';
import { CONSTANTS } from 'clink-components';
import { TYPES } from 'v2/helpers/prequal/documents';
import DownloadFiles from 'v2/apps/clink/pages/supply-chain-profile/prequalification/DownloadFiles';

const { iconReferencesGray, iconReferencesGreen } = CONSTANTS.s3;

const HealthSafetyAndEnvironmental = ({
  aid,
  prequalificationV2,
  nested,
  accordion,
  contextType,
}) => {
  const { t } = useTranslation();
  const {
    'health-safety': healthSafety,
    'health-safety-environmental-qualifications': healthSafetyEnvQualifications,
    environmental,
  } = prequalificationV2;

  const tabs = [
    {
      id: 1,
      title: (
        <MuiTabTitle icon={iconReferencesGray} iconActive={iconReferencesGreen}>
          {t('preq-health-safety')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, p: '24px 16px 0' }} {...props}>
          <MuiScrollerContainer accordion={accordion}>
            {healthSafety && healthSafety.length ? (
              healthSafety.map((r) => (
                <MuiReferenceBox
                  accordion={accordion}
                  key={`${r.id}-${r.label}`}
                >
                  <ReferenceContent
                    type={TYPES.HS}
                    contextType={contextType}
                    aid={aid}
                    data={r}
                    showExpiredInfo={!r.s3_key}
                  />
                </MuiReferenceBox>
              ))
            ) : (
              <MuiEmptyReferenceBox>
                {t('user-has-no-approved-1')}
                {t('preq-health-safety')}
                {t('user-has-no-approved-2')}.
              </MuiEmptyReferenceBox>
            )}
          </MuiScrollerContainer>
          {Boolean(healthSafety?.filter((r) => r.document).length) && (
            <MuiDownloadBox accordion={accordion}>
              <DownloadFiles
                aid={aid}
                label={t('download-files')}
                type={TYPES.HS}
              />
            </MuiDownloadBox>
          )}
        </PreqContent>
      ),
    },
    {
      id: 2,
      title: (
        <MuiTabTitle icon={iconReferencesGray} iconActive={iconReferencesGreen}>
          {t('preq-health-safety-environmental-qualifications')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, p: '24px 16px 0' }} {...props}>
          <MuiScrollerContainer accordion={accordion}>
            {healthSafetyEnvQualifications &&
            healthSafetyEnvQualifications.length ? (
              healthSafetyEnvQualifications.map((r) => (
                <MuiReferenceBox
                  accordion={accordion}
                  key={`${r.id}-${r.label}`}
                >
                  <ReferenceContent
                    type={TYPES.HSEQ}
                    contextType={contextType}
                    aid={aid}
                    data={r}
                    showExpiredInfo={!r.s3_key}
                  />
                </MuiReferenceBox>
              ))
            ) : (
              <MuiEmptyReferenceBox>
                {t('user-has-no-approved-1')}
                {t('preq-health-safety-environmental-qualifications')}
                {t('user-has-no-approved-2')}.
              </MuiEmptyReferenceBox>
            )}
          </MuiScrollerContainer>
          {Boolean(
            healthSafetyEnvQualifications?.filter((r) => r.document).length,
          ) && (
            <MuiDownloadBox accordion={accordion}>
              <DownloadFiles
                aid={aid}
                label={t('download-files')}
                type={TYPES.HSEQ}
              />
            </MuiDownloadBox>
          )}
        </PreqContent>
      ),
    },
    {
      id: 3,
      title: (
        <MuiTabTitle icon={iconReferencesGray} iconActive={iconReferencesGreen}>
          {t('preq-environmental')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, p: '24px 16px 0' }} {...props}>
          <MuiScrollerContainer accordion={accordion}>
            {Boolean(environmental?.length) ? (
              environmental.map((r) => (
                <MuiReferenceBox
                  accordion={accordion}
                  key={`${r.id}-${r.label}`}
                >
                  <ReferenceContent
                    type={TYPES.EN}
                    contextType={contextType}
                    aid={aid}
                    data={r}
                    showExpiredInfo={!r.s3_key}
                  />
                </MuiReferenceBox>
              ))
            ) : (
              <MuiEmptyReferenceBox>
                {t('user-has-no-approved-1')}
                {t('preq-environmental')}
                {t('user-has-no-approved-2')}.
              </MuiEmptyReferenceBox>
            )}
          </MuiScrollerContainer>
          {Boolean(environmental?.filter((r) => r.document).length) && (
            <MuiDownloadBox accordion={accordion}>
              <DownloadFiles
                aid={aid}
                label={t('download-files')}
                type={TYPES.EN}
              />
            </MuiDownloadBox>
          )}
        </PreqContent>
      ),
    },
  ];

  return <Tabs nested={nested} accordion={accordion} tabs={tabs} />;
};

const mapStateToProps = (state) => {
  return {
    prequalificationV2: state.prequalificationV2,
  };
};

export default connect(mapStateToProps)(HealthSafetyAndEnvironmental);
