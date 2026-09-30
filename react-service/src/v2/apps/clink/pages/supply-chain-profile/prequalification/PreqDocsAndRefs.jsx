import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import Tabs from 'v2/apps/clink/pages/supply-chain-profile/tabs';
import PreqContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/PreqContent';
import InsuranceContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/insurance/Content';
import ReferenceContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/ReferenceContent';
import AccreditationContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/accreditation/Content';
import ManagerSystemContent from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/management-system/Content';
import DownloadFiles from 'v2/apps/clink/pages/supply-chain-profile/prequalification/DownloadFiles';
import { MuiTabTitle } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import { MuiTabQuizz } from 'v2/apps/clink/pages/supply-chain-profile/tab-forms/muitabs.styled';
import {
  MuiScrollerContainer,
  MuiInsuranceBox,
  MuiDownloadBox,
  MuiReferenceBox,
  MuiEmptyReferenceBox,
} from './mui.styled';
import { SECTIONS } from 'v2/helpers/prequal/documents';
import { NOT_PROVIDED } from 'v2/apps/shared/components/prequalification/v2/references';

const {
  iconAccreditationsGray,
  iconAccreditationsGreen,
  iconIncusrancesGray,
  iconIncusrancesGreen,
  iconManagementGray,
  iconManagementGreen,
  iconReferencesGray,
  iconReferencesGreen,
} = CONSTANTS.s3;

const PreqDocsAndRefs = ({
  aid,
  prequalificationV2,
  nested,
  accordion,
  clinkAccount,
  contextType,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const { country } = clinkAccount;
  const {
    insurances,
    accreditation,
    'custom-certificate': customCertificate,
    'management-system': managementSystem,
    references,
  } = prequalificationV2;

  const approvedReferences =
    references && references.filter((r) => r.status === 'approved');

  const tabs = [
    {
      id: 1,
      title: (
        <MuiTabTitle
          icon={iconIncusrancesGray}
          iconActive={iconIncusrancesGreen}
        >
          {t('insurances')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, pl: { xs: 1, lg: 0 } }} {...props}>
          {!largeScreen && (
            <MuiTabQuizz sx={{ ml: { xs: 1, sm: 0 }, mt: 2 }}>
              {t('insurances')}
            </MuiTabQuizz>
          )}
          <MuiScrollerContainer accordion={accordion}>
            {(insurances || []).map((i) => (
              <MuiInsuranceBox accordion={accordion} key={`${i.id}-${i.label}`}>
                <InsuranceContent country={country} aid={aid} data={i} />
              </MuiInsuranceBox>
            ))}
          </MuiScrollerContainer>
          {Boolean((insurances || []).filter((i) => i.date).length) && (
            <MuiDownloadBox accordion={accordion}>
              <DownloadFiles
                aid={aid}
                label={t('download-insurances-files')}
                type="insurances"
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
          {t('preq-references')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ flexGrow: 1, p: '24px 16px 0' }} {...props}>
          {!largeScreen && (
            <MuiTabQuizz sx={{ mb: 1, mt: '-4px', ml: { xs: 2, sm: 1 } }}>
              {t('preq-references')}
            </MuiTabQuizz>
          )}
          <MuiScrollerContainer accordion={accordion}>
            {approvedReferences && approvedReferences.length ? (
              approvedReferences.map((r) => (
                <MuiReferenceBox
                  accordion={accordion}
                  key={`${r.id}-${r.label}`}
                >
                  <ReferenceContent
                    type={SECTIONS.REF}
                    contextType={contextType}
                    aid={aid}
                    data={r}
                    showExpiredInfo={r.status === NOT_PROVIDED}
                  />
                </MuiReferenceBox>
              ))
            ) : (
              <MuiEmptyReferenceBox>
                {t('user-has-no-approved-1')}
                {t('preq-references')}
                {t('user-has-no-approved-2')}.
              </MuiEmptyReferenceBox>
            )}
          </MuiScrollerContainer>
        </PreqContent>
      ),
    },
    {
      id: 3,
      title: (
        <MuiTabTitle
          icon={iconAccreditationsGray}
          iconActive={iconAccreditationsGreen}
        >
          {t('accreditations')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent
          sx={{ flexGrow: 1, ml: '0!important', px: { xs: 2, sm: 4 }, pt: 3 }}
          {...props}
        >
          {!largeScreen && (
            <MuiTabQuizz sx={{ mb: '-4px' }}>{t('accreditations')}</MuiTabQuizz>
          )}
          <MuiScrollerContainer accordion={accordion}>
            {[...(accreditation || []), ...(customCertificate || [])].map(
              (a) => (
                <AccreditationContent
                  accordion={accordion}
                  key={`${a.id}-${a.label}`}
                  aid={aid}
                  data={a}
                />
              ),
            )}
          </MuiScrollerContainer>
          <MuiDownloadBox accordion={accordion}>
            {Boolean((accreditation || []).filter((i) => i.date).length) && (
              <DownloadFiles
                aid={aid}
                label={t('download-accreditations-files')}
                type="accreditation"
              />
            )}
          </MuiDownloadBox>
        </PreqContent>
      ),
    },
    {
      id: 4,
      title: (
        <MuiTabTitle icon={iconManagementGray} iconActive={iconManagementGreen}>
          {t('management-system')}
        </MuiTabTitle>
      ),
      // eslint-disable-next-line react/no-unstable-nested-components
      Content: (props) => (
        <PreqContent sx={{ px: 3, py: 1, flexGrow: 1 }} {...props}>
          {!largeScreen && (
            <MuiTabQuizz sx={{ mt: 1, ml: { xs: 1, sm: 0 } }}>
              {t('management-system')}
            </MuiTabQuizz>
          )}
          <MuiScrollerContainer accordion={accordion}>
            {(managementSystem || []).map((m) => (
              <Grid key={`${m.id}-${m.label}`} item xs={12} md={4}>
                <ManagerSystemContent
                  accordion={accordion}
                  aid={aid}
                  data={m}
                />
              </Grid>
            ))}
          </MuiScrollerContainer>
          <MuiDownloadBox accordion={accordion}>
            {Boolean((managementSystem || []).filter((i) => i.date).length) && (
              <DownloadFiles
                aid={aid}
                label={t('download-files')}
                type="management-system"
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
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(PreqDocsAndRefs);
