import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Table } from 'clink-components';
import { useContext } from 'hooks/context';
import Actions from './Actions';

function Features({ features, dispatch, contextType = 'admin' }) {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { pages, actions } = context;
  const { features: featuresPage } = pages;
  const { actions: featuresActions, columns, actionColumn } = featuresPage;
  const { config: columnAction } = actionColumn;
  const { list, featureList } = features;

  useEffect(() => {
    dispatch(actions.fetchFeatures());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (featureList && featureList.length) {
      dispatch(actions.fetchAccountFeatures());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureList]);

  const listWithActions =
    list && list.length
      ? list.map((row) => ({
          ...row,
          actions: <Actions data={row} actions={featuresActions} />,
        }))
      : [];

  const formattedColumns =
    [...columns, { ...columnAction, label: t('table-column-actions') }].map(
      (column) => ({
        ...column,
        label: column.label || t(`users-table-column-${column.key}`),
      })
    ) || [];

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
  features: state.features,
});

export default connect(mapStateToProps)(Features);
