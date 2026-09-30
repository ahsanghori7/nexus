import React from 'react';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  MuiTabQuizz,
  MuiTabContent,
} from 'v2/apps/clink/pages/supply-chain-profile/tab-forms/muitabs.styled';
import {
  MuiFinancialInput,
  MuiFinancialDetails,
} from 'v2/apps/clink/pages/supply-chain-profile/tab-forms/mui-financial.styled';
import Tabs from 'v2/apps/clink/pages/supply-chain-profile/tabs';
import { MuiTabTitle } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import {
  InputWithAdornment,
  SimpleInput,
} from 'v2/apps/clink/pages/supply-chain-profile/inputs';

const {
  iconTradesGray,
  iconTradesGreen,
  iconLocationsGray,
  iconLocationsGreen,
  iconTurnoverGray,
  iconTurnoverGreen,
  iconProjectGray,
  iconProjectGreen,
} = CONSTANTS.s3;

const TabeOneComponent = ({ offering, trades, largeScreen }) =>
  Boolean(offering && trades) && (
    <MuiTabContent>
      {!largeScreen && <MuiTabQuizz>{i18next.t('trades')}</MuiTabQuizz>}
      {[...trades]
        .sort((itemA, itemB) =>
          itemA.label.toLowerCase().localeCompare(itemB.label.toLowerCase()),
        )
        .map((i) => (
          <SimpleInput key={i.id} value={i.label} />
        ))}
    </MuiTabContent>
  );

const TabTwoComponent = ({ offering, regions, largeScreen }) =>
  Boolean(offering && regions) && (
    <MuiTabContent>
      {!largeScreen && <MuiTabQuizz> {i18next.t('locations')}</MuiTabQuizz>}
      {[...regions]
        .sort((itemA, itemB) =>
          itemA.label.toLowerCase().localeCompare(itemB.label.toLowerCase()),
        )
        .map((i) => (
          <SimpleInput key={i.id} value={i.label} />
        ))}
    </MuiTabContent>
  );

const TabThreeComponent = ({
  turnover,
  largeScreen,
  defaultTurnover,
  country,
  companyInformation,
}) =>
  Boolean(turnover) && (
    <MuiTabContent financial>
      {!largeScreen && <MuiTabQuizz> {i18next.t('financial')}</MuiTabQuizz>}
      <MuiTabQuizz>{i18next.t('turnover-past-years')}</MuiTabQuizz>
      {[...turnover, ...defaultTurnover]
        .sort((itemA, itemB) => Number(itemA.year) - Number(itemB.year))
        .map((i) => (
          <MuiFinancialInput
            key={i.id}
            adornment={String(i.year)}
            value={i.value}
            profitBeforeTax={i.profit_before_tax}
            country={country}
          />
        ))}
      <MuiFinancialDetails data={companyInformation} />
    </MuiTabContent>
  );

const TabFourComponent = ({
  largeScreen,
  smallScreen,
  country,
  companyInformation,
}) =>
  Boolean(companyInformation) && (
    <MuiTabContent>
      {!largeScreen && (
        <MuiTabQuizz> {i18next.t('text-project-size')}</MuiTabQuizz>
      )}
      <MuiTabQuizz>{i18next.t('accomodate-value')}</MuiTabQuizz>
      <InputWithAdornment
        adornment={smallScreen ? i18next.t('minimum') : i18next.t('min')}
        value={companyInformation?.min_order_value}
        country={country}
      />
      <InputWithAdornment
        adornment={smallScreen ? i18next.t('maximum') : i18next.t('max')}
        value={companyInformation?.max_order_value}
        country={country}
      />
    </MuiTabContent>
  );

const CompanyOfferingForm = ({
  offering,
  turnover,
  companyInformation,
  nested,
  colorTheme,
  clinkAccount,
}) => {
  const theme = useTheme();
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const smallScreen = useMediaQuery(theme.breakpoints.up('sm'));
  const { trades, regions } = offering;
  const { country } = clinkAccount;

  const currentYear = new Date().getFullYear();
  const defaultYears = [currentYear, currentYear - 1, currentYear - 2];
  const defaultTurnover = defaultYears
    .filter(
      (year) => !turnover.map((i) => Number(i.year)).includes(Number(year)),
    )
    .map((year) => ({
      active_trading: false,
      id: `default-${year}`,
      initialized: true,
      label: '0.00',
      value: '0.00',
      year,
    }));

  const tabs = [
    {
      id: 1,
      title: (
        <MuiTabTitle icon={iconTradesGray} iconActive={iconTradesGreen}>
          {i18next.t('trades')}
        </MuiTabTitle>
      ),
      Content:
        // eslint-disable-next-line react/no-unstable-nested-components
        () => (
          <TabeOneComponent
            offering={offering}
            trades={trades}
            largeScreen={largeScreen}
          />
        ),
    },
    {
      id: 2,
      title: (
        <MuiTabTitle icon={iconLocationsGray} iconActive={iconLocationsGreen}>
          {i18next.t('locations')}
        </MuiTabTitle>
      ),
      Content:
        // eslint-disable-next-line react/no-unstable-nested-components
        () => (
          <TabTwoComponent
            offering={offering}
            regions={regions}
            largeScreen={largeScreen}
          />
        ),
    },
    {
      id: 3,
      title: (
        <MuiTabTitle icon={iconTurnoverGray} iconActive={iconTurnoverGreen}>
          {i18next.t('financial')}
        </MuiTabTitle>
      ),
      Content:
        // eslint-disable-next-line react/no-unstable-nested-components
        () => (
          <TabThreeComponent
            turnover={turnover}
            defaultTurnover={defaultTurnover}
            largeScreen={largeScreen}
            country={country}
            companyInformation={companyInformation}
          />
        ),
    },
    {
      id: 4,
      title: (
        <MuiTabTitle icon={iconProjectGray} iconActive={iconProjectGreen}>
          {i18next.t('text-project-size')}
        </MuiTabTitle>
      ),
      Content:
        // eslint-disable-next-line react/no-unstable-nested-components
        () => (
          <TabFourComponent
            largeScreen={largeScreen}
            smallScreen={smallScreen}
            country={country}
            companyInformation={companyInformation}
          />
        ),
    },
  ];

  return <Tabs colorTheme={colorTheme} nested={nested} tabs={tabs} />;
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(CompanyOfferingForm);
