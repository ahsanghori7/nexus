import React, { useEffect } from 'react';
import { Table } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Actions from './Actions';

function Projects(props) {
  const { projects, dispatch, params } = props;
  const { list, statusList } = projects;
  const context = useContext();
  const { actions, pages } = context;
  const { projects: projectPage } = pages;
  const { actions: actionsProjects, columns, actionColumn } = projectPage;
  const { config: columnAction } = actionColumn;

  useEffect(() => {
    const term = params && params.term ? params.term : '';
    dispatch(actions.fetchProjects(term));
    dispatch(actions.fetchStatusList());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listWithActions =
    list && list.length
      ? list.map((project) => {
          return {
            ...project,
            project: (
              <a
                href={`${BASE_URLS.APP_CLINK}/relay?action=account&method=switchGhostMode&redirect_project=${project.slug}`}
              >
                {project.project}
              </a>
            ),
            actions: (
              <Actions
                project={project}
                projectsActions={actionsProjects}
                actionColumn={actionColumn}
                statusList={statusList}
                handleConfirm={(status) => {
                  dispatch(
                    actions.changeStatus({
                      project,
                      status,
                    })
                  );
                }}
              />
            ),
          };
        })
      : [];

  const formattedColumns =
    [
      ...columns,
      { ...columnAction, label: i18next.t('users-table-column-status') },
    ].map((column) => ({
      ...column,
      label: column.label || i18next.t(`projects-table-column-${column.key}`),
    })) || [];
  return (
    <Table
      columns={formattedColumns}
      rows={listWithActions}
      pagination
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
    />
  );
}

const mapStateToProps = (state) => ({
  projects: state.projects,
  users: state.users,
});

export default connect(mapStateToProps)(Projects);
