import React, { useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import useMuiTheme from 'v2/apps/shared/components/muiTheme';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { connect } from 'react-redux';
import { Loader } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import capitalize from 'lodash/capitalize';
import isEmpty from 'lodash/isEmpty';
import { useParams, Link as ReactLink } from 'react-router-dom';
import Template from 'v2/apps/clink/pages/shared/template';
import ProjectManagementTable from './ProjectManagementTable';

const pageMapping = {
  methodName: {
    'instructions-variations': 'listInstruction',
    ncr: 'listNcr',
  },
  buttonName: {
    'instructions-variations': 'add-new-instruction',
    ncr: 'add-new-ncr',
  },
};

const InstructionsList = ({
  contextType = 'clink',
  instructions,
  project,
  dispatch,
  type = 'instructions-variations',
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const { slug } = params;
  const context = useContext(contextType);
  const theme = useMuiTheme(contextType);
  const { base, pages, actions } = context;
  const { instructionsVariations, projectDashboard } = pages;
  const { table } = instructionsVariations;
  const { actions: getActions } = projectDashboard;
  const { projectManagement } = getActions(`${base}/${slug}/`);
  // eslint-disable-next-line no-unused-vars
  const [_instruction, _ncr, forecastFinal, addNewInstruction] =
    projectManagement;
  const { data: dataProject } = project;
  const { list, status } = instructions;

  const onlySmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const onlyLargeScreen = useMediaQuery(theme.breakpoints.down('xl'));
  // Large screens
  let dropdownOffset = onlyLargeScreen ? -48 : -75;
  // Mobile
  dropdownOffset = onlySmallScreen ? -88 : dropdownOffset;
  useEffect(() => {
    dispatch(actions.resetInstruction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dataProject && dataProject.id) {
      dispatch(
        actions.fetchInstructions({
          pid: dataProject.id,
          method: pageMapping.methodName[type],
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataProject]);

  const rows = list.map((data) =>
    table.rowBuilder({
      data,
      deleteAction: () => dispatch(actions.deleteInstruction(data.id)),
      slug,
      dropdownOffset,
    }),
  );

  const label = t('view-forecast-final')
    .toLowerCase()
    .split(' ')
    .map((i) => capitalize(i))
    .join(' ');

  const loading = !isEmpty(status) && status === 'loading';
  return (
    <Template
      title={t(type)}
      extraPadding={loading}
      header={
        <ReactLink to={`${addNewInstruction.link}?type=${type}`}>
          <Button
            color="success"
            onClick={() => {
              dispatch(actions.changeInstructionStatus('loading'));
            }}
            variant="contained"
          >
            {t(pageMapping.buttonName[type])}
          </Button>
        </ReactLink>
      }
    >
      {loading && (
        <Box textAlign="center" pt={2}>
          <Loader />
        </Box>
      )}
      {isEmpty(status) && (
        <ProjectManagementTable columns={table.columns} rows={rows} />
      )}
      <Box textAlign="center" pt={2}>
        <Button
          color="success"
          LinkComponent={ReactLink}
          to={forecastFinal.link || ''}
          variant="contained"
          size="large"
        >
          {label}
        </Button>
      </Box>
    </Template>
  );
};

const mapStateToProps = (state) => {
  return {
    instructions: state.instructions,
    project: state.project,
  };
};

export default connect(mapStateToProps)(InstructionsList);
