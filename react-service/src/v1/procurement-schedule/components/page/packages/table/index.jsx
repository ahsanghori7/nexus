import React from 'react';
import ClinkService from '../../../../../global/services/clink';
import StyledTable from './StyledTable';
import {
  Actions,
  Status,
  Title,
  CustomToolbar,
  formattedAwardedTo,
  CustomToolbarSelect,
  CustomCheckbox,
  getStatusLabel,
} from './row-assets';

const defaultOptions = {
  filterType: 'checkbox',
  search: false,
  download: false,
  print: false,
  viewColumns: false,
  filter: false,
  sort: false,
  pagination: false,
  textLabels: {
    body: {
      noMatch: 'Please add a subcontractor from the list above.',
    },
  },
  responsive: 'simple',
  elevation: 0,
};

const getDefaultColumns = (isShortlistedSubcontractorEnabled) => [
  isShortlistedSubcontractorEnabled ? 'Supplier Name' : 'Supply Chain',
  'Status',
  'Actions',
];

const supplyRows = (
  data,
  projectData,
  initialValues,
  packageData,
  packageAwarded,
  isCustom,
  callback,
  slug,
) =>
  data.map((subcontractor, index) => {
    const { status, last_action: lastAction } = subcontractor;
    const formattedStatusLabel = getStatusLabel(subcontractor);
    return [
      <Title key={subcontractor.sub_id} subcontractor={subcontractor} />,
      <Status
        key={subcontractor.sub_id}
        status={status}
        formattedStatusLabel={formattedStatusLabel}
        lastAction={lastAction}
        packageAwarded={packageAwarded}
        meta={subcontractor.meta}
      />,
      <Actions
        key={subcontractor.sub_id}
        subcontractor={subcontractor}
        formattedStatusLabel={formattedStatusLabel}
        projectData={projectData}
        packageAwarded={packageAwarded}
        initialValues={initialValues}
        packageData={packageData}
        isCustom={isCustom}
        callback={callback}
        listSize={data.length}
        listIndex={index}
        slug={slug}
      />,
    ];
  });

const Table = ({
  data = [],
  columns,
  options = defaultOptions,
  projectData,
  slug,
  packageAwarded,
  packageAwardedTo,
  hasDocument,
  hasTenderAddendum,
  initialValues,
  packageData,
  isCustom,
  callback,
  accountInfo,
}) => {
  const customToolbar = ({ displayData }) => {
    return (
      <CustomToolbar
        displayData={displayData}
        tid={packageData.id}
        slug={slug}
        hasDocument={hasDocument}
        hasTenderAddendum={hasTenderAddendum}
        accountInfo={accountInfo}
      />
    );
  };

  const filteredOptions = {
    ...options,
  };
  filteredOptions.selectableRowsHeader = !packageAwarded;
  filteredOptions.selectableRowsHideCheckboxes = packageAwarded;
  filteredOptions.customToolbar = customToolbar;

  filteredOptions.customToolbarSelect = (selectedRows, displayData) => (
    <CustomToolbarSelect
      selectedRows={selectedRows}
      displayData={displayData}
      pid={projectData.id}
      tid={packageData.id}
      isCustom={isCustom}
      initialValues={initialValues}
      callback={callback}
      slug={slug}
      packageData={packageData}
    />
  );
  let formattedData = ClinkService.transformToArray(data);
  formattedData = packageAwarded
    ? formattedAwardedTo(packageAwardedTo, formattedData)
    : formattedData;
  // eslint-disable-next-line react/no-unstable-nested-components
  const Checkbox = (props) => (
    <CustomCheckbox {...props} subcontractors={formattedData} />
  );
  const resolvedColumns = columns ?? getDefaultColumns();

  return (
    <StyledTable
        data-testid="supply-chain-table"
        data={supplyRows(
          formattedData,
          projectData,
          initialValues,
          packageData,
          packageAwarded,
          isCustom,
          callback,
          slug,
        )}
        columns={resolvedColumns}
        options={filteredOptions}
        className="packages-component__list"
        components={{
          Checkbox,
        }}
      />
  );
};

export default Table;
