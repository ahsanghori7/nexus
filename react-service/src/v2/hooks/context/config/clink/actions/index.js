import {
  planMyProjectActions,
  procurementToolsActions,
  projectDocumentsActions,
  projectManagement,
} from './links';

const getActions = (base) => ({
  planMyProject: planMyProjectActions(base),
  procurementTools: procurementToolsActions(base),
  projectDocuments: projectDocumentsActions(base),
  projectManagement: projectManagement(base),
});

export default getActions;
