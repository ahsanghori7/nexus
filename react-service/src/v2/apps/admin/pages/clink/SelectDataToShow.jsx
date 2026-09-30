import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import { useContext } from 'hooks/context';
import i18next from 'v2/helpers/i18n';
import SelectDialog from 'v2/apps/shared/components/select';

const MAIN_CONTRACTOR_TYPE = 2;
const SelectDataToShow = ({
  type = MAIN_CONTRACTOR_TYPE,
  account,
  model,
  [model]: stateModel = { status: null, list: [] },
  dispatch,
}) => {
  const { list: accountList } = account;
  const { list, status } = stateModel;
  const [currentValues, setCurrentValues] = useState([]);
  const [options, setOptions] = useState([]);
  const context = useContext();
  const { actions } = context;

  useEffect(() => {
    setCurrentValues(list);
  }, [list]);

  const delayedSearch = debounce((query) => {
    dispatch(
      actions.fetchAccounts({
        query,
        type: query ? type : -1,
        accounts: 1,
        filtered: currentValues,
      })
    );
  }, 500);

  const handleUpdate = (newValues) => {
    const setCurrent = new Set(currentValues.map((i) => Number(i.id)));
    const setNew = new Set(newValues.map((i) => Number(i.id)));
    const newRecords = newValues
      .filter((i) => !setCurrent.has(Number(i.id)))
      .map((i) => Number(i.id));
    const removedRecords = currentValues
      .filter((i) => !setNew.has(Number(i.id)))
      .map((i) => Number(i.id));
    switch (model) {
      case 'features':
        dispatch(
          actions.updateAccountFeatures({
            add: newRecords,
            remove: removedRecords,
          })
        ).then(() => dispatch(actions.fetchAccountFeatures()));
        break;
      case 'customerHealthScore':
        dispatch(
          actions.updateHealthScore({ add: newRecords, remove: removedRecords })
        ).then(() => dispatch(actions.fetchHealthScore()));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    const [_, ...accounts] = accountList.map((a) => ({
      id: Number(a.id),
      label: a.name,
    }));
    const setIds = new Set();
    setOptions(
      [
        ...accounts,
        ...list.map((i) => ({ id: Number(i.id), label: i.account })),
      ].filter((obj) => {
        if (!setIds.has(Number(obj.id))) {
          setIds.add(Number(obj.id));
          return true;
        }
        return false;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountList]);

  return (
    !status.message && (
      <SelectDialog
        title={`${i18next.t('clink-contractors-title')}&nbsp;`}
        options={options}
        defaultValues={list.map((i) => ({
          id: Number(i.id),
          label: i.account,
        }))}
        name="users"
        showAllText={false}
        updateValues={handleUpdate}
        searchCallback={(result) => {
          delayedSearch(result);
        }}
        onCloseCallback={() =>
          setOptions(list.map((i) => ({ id: Number(i.id), label: i.account })))
        }
        context="pegasus"
      />
    )
  );
};

const mapStateToProps = (state) => ({
  account: state.account,
  features: state.features,
  customerHealthScore: state.customerHealthScore,
});

export default connect(mapStateToProps)(SelectDataToShow);
