import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Loader } from 'clink-components';
import { useTranslation } from 'react-i18next';
import isEmpty from 'lodash/isEmpty';
import { useContext } from 'hooks/context';
import parseCurrency from 'v2/helpers/currency';
import { instructionsBreadcrumbs } from 'v2/apps/clink/pages/shared/template/helpers';
import Template from 'v2/apps/clink/pages/shared/template';
import { getQueryStringVars } from 'v2/helpers/url';
import ProjectManagementTable from 'v2/apps/clink/pages/shared/instruction-list/ProjectManagementTable';
import {
  StyledForecastBudget,
  StyledForecastProjectBudget,
  StyledForecastProjectNumber,
  StyledForecastContainer,
} from './styled';
import DownloadExcel from './DownloadExcel';

const ForecastFinal = ({
  project,
  instructions,
  contextType = 'clink',
  dispatch,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const params = useParams();
  const { type } = getQueryStringVars();
  const { slug } = params;
  const { actions, pages } = context;
  const { forecastFinal } = pages;
  const { table } = forecastFinal;
  const { data } = project;
  const { forecastList, status } = instructions;

  useEffect(() => {
    if (data) {
      dispatch(actions.fetchForecastList(data.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const pid = (data && data.id) || null;
  const rows = forecastList.map((i) =>
    table.rowBuilder({ data: i, pid, dispatch, action: actions.changeBudget })
  );

  let total = 0;
  let profitLoss = 0;
  let projectBudget = 0;
  if (forecastList && forecastList.length) {
    const [totalRow] = [...forecastList].slice(-1);
    total = Number(totalRow.total);
    projectBudget = Number(totalRow.budget);
    profitLoss = Number(projectBudget - total);
  }

  const loading = !isEmpty(status) && status === 'loading';
  const title = t('forecast-finals');
  const breadcrumbs = instructionsBreadcrumbs(slug, type, title, data || {});

  return (
    <Template title={title} extraPadding={loading} breadcrumb={breadcrumbs}>
      {loading && <Loader />}
      {!loading && (
        <StyledForecastContainer content={i18next.t('currency')}>
          <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
            <DownloadExcel
              data={data}
              forecastList={forecastList}
              projectBudget={projectBudget}
              profitLoss={profitLoss}
            />
          </Grid>

          <ProjectManagementTable
            theme="forecast-final"
            columns={table.columns}
            rows={rows}
          />

          <StyledForecastBudget>
            <StyledForecastProjectBudget>
              {`${t('project-budget')}:`}
              <StyledForecastProjectNumber bordered>
                <span>{i18next.t('currency')}</span>
                <span>{parseCurrency(projectBudget)}</span>
              </StyledForecastProjectNumber>
            </StyledForecastProjectBudget>
            <StyledForecastProjectBudget>
              {`${t('profit-loss')}:`}
              <StyledForecastProjectNumber profitValue={profitLoss}>
                <span>{i18next.t('currency')}</span>
                <span>{parseCurrency(profitLoss)}</span>
              </StyledForecastProjectNumber>
            </StyledForecastProjectBudget>
          </StyledForecastBudget>
        </StyledForecastContainer>
      )}
    </Template>
  );
};

ForecastFinal.propTypes = {
  project: PropTypes.shape({
    data: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
    }),
  }).isRequired,
  instructions: PropTypes.shape({
    forecastList: PropTypes.arrayOf(
      PropTypes.shape({
        package: PropTypes.string,
        budget: PropTypes.number,
        order: PropTypes.number,
        variations: PropTypes.number,
        omissions: PropTypes.number,
        total: PropTypes.number,
      })
    ).isRequired,
    status: PropTypes.string,
  }).isRequired,
  contextType: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  project: state.project,
  instructions: state.instructions,
});
export default connect(mapStateToProps)(ForecastFinal);
