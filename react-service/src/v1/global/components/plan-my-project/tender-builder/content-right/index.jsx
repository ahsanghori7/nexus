import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { getInputs } from './helpers';
import Content from './Content';
import Loading from '../../../Loading';

const ContentRight = (props) => {
  const {
    dispatch,
    formFields,
    slug,
    pid,
    selectedTenders,
    setOpenForm,
    page,
    deleteTender,
    updateCustomTenders,
    loading: parentLoading,
    savePackagesRef,
    init,
    currentDependencies,
    constants,
    attributes,
    project,
  } = props;
  const { regions: region } = attributes;
  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    dispatch(actions.fetchAttrRegions());
    dispatch(actions.fetchConstants());
  }, [actions, dispatch]);
  const [tenderBuilderPackagesData] = formFields;

  const milestones = project?.milestones || {};

  return !region?.length || !constants?.default_categories.length ? (
    <Loading />
  ) : (
    <Content
      loading={parentLoading}
      selectedTenders={selectedTenders}
      setOpenForm={setOpenForm}
      tenderBuilderPackagesData={tenderBuilderPackagesData}
      region={region}
      constants={constants}
      slug={slug}
      page={page}
      pid={pid}
      deleteTender={deleteTender}
      updateCustomTenders={updateCustomTenders}
      savePackagesRef={savePackagesRef}
      init={init}
      currentDependencies={currentDependencies}
      project={project}
      milestones={milestones}
    />
  );
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
    attributes: state.attributes,
    project: state.project,
  };
};

export default connect(mapStateToProps)(ContentRight);
export { getInputs };
