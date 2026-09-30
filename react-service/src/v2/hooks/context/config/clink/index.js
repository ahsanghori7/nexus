import actions from 'store/reducers/actions';
import getActions from './actions';
import table from './table';
import instructionsVariationsTable from './instructionsVariationsTable';
import forecastTable from './forecastTable';

const base = `${BASE_URLS.CLINK}/project`;
const clink = {
  base,
  pages: {
    addTeam: {
      path: 'add_team',
      table,
    },
    projectDashboard: {
      base,
      actions: getActions,
      path: 'project_dashboard/:slug',
      keyTitle: 'clink-enquiries-title',
    },
    instructionsVariations: { table: instructionsVariationsTable },
    ncr: {
      table: instructionsVariationsTable,
    },
    forecastFinal: {
      table: forecastTable,
    },
    addNewInstruction: {},
  },
  actions: actions.clink,
};

export default clink;
