import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import Tabs from 'v2/apps/clink/pages/supply-chain-profile/tabs';
import PreqContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/PreqContent';
import ReferenceContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/ReferenceContent';
import { MuiTabTitle } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import {
  MuiScrollerContainer,
  MuiReferenceBox,
  MuiEmptyReferenceBox,
  MuiDownloadBox,
} from './mui.styled';
import { CONSTANTS } from 'clink-components';
import { TYPES } from 'v2/helpers/prequal/documents';
import DownloadFiles from 'v2/apps/clink/pages/supply-chain-profile/prequalification/DownloadFiles';

const { iconReferencesGray, iconReferencesGreen } = CONSTANTS.s3;

const QualityAndExample = ({
  aid,
  prequalificationV2,
  nested,
  accordion,
  contextType,
}) => {
  const { t } = useTranslation();
  const { 'example-documents': exampleDocuments, quality } = prequalificationV2;

  const tabs = [
    {
      id: 1,
      title: (
        <MuiTabTitle icon={iconReferencesGray} iconActive={iconReferencesGreen}>
          {t('preq-quality')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, p: '24px 16px 0' }} {...props}>
          <MuiScrollerContainer accordion={accordion}>
            {quality && quality.length ? (
              quality.map((r) => (
                <MuiReferenceBox
                  accordion={accordion}
                  key={`${r.id}-${r.label}`}
                >
                  <ReferenceContent
                    type={TYPES.QU}
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
                {t('preq-qualities')}
                {t('user-has-no-approved-2')}.
              </MuiEmptyReferenceBox>
            )}
          </MuiScrollerContainer>
          <MuiDownloadBox accordion={accordion}>
            {Boolean(quality?.filter((r) => r.document).length) && (
              <DownloadFiles
                aid={aid}
                label={t('download-files')}
                type={TYPES.QU}
              />
            )}
          </MuiDownloadBox>
        </PreqContent>
      ),
    },
    {
      id: 2,
      title: (
        <MuiTabTitle icon={iconReferencesGray} iconActive={iconReferencesGreen}>
          {t('preq-example-documents')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, p: '24px 16px 0' }} {...props}>
          <MuiScrollerContainer accordion={accordion}>
            {exampleDocuments && exampleDocuments.length ? (
              exampleDocuments.map((r) => (
                <MuiReferenceBox
                  accordion={accordion}
                  key={`${r.id}-${r.label}`}
                >
                  <ReferenceContent
                    type={TYPES.ED}
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
                {t('preq-example-documents')}
                {t('user-has-no-approved-2')}.
              </MuiEmptyReferenceBox>
            )}
          </MuiScrollerContainer>
          <MuiDownloadBox accordion={accordion}>
            {Boolean(exampleDocuments?.filter((r) => r.document).length) && (
              <DownloadFiles
                aid={aid}
                label={t('download-files')}
                type={TYPES.ED}
              />
            )}
          </MuiDownloadBox>
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

export default connect(mapStateToProps)(QualityAndExample);
