import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import startCase from 'lodash/startCase';
import DocContainer from '../DocContainer';
import useSelectedData from './useSelectedData';
import DocumentInfo from '../DocumentInfo';

const filterToShowDocs = (docs = []) =>
  docs ? docs.filter((i) => i.id || (i.id === null && i.requested)) : [];

const Section = ({
  aid,
  data,
  type,
  documentInputs,
  showOtherOptionForAll = false,
  sectionData = [],
  handleSubmit,
  handleRemove,
}) => {
  const { t } = useTranslation();
  const [selectedData, setSelectedData] = useSelectedData(null);
  const [open, setOpen] = useState(false);

  const {
    title = '',
    description = '',
    Inputs,
    showValue,
    showExpiration,
    showRequestedBy,
    icon = null,
    defaultIcon = null,
    expiration = null,
    money = null,
  } = documentInputs;

  const options =
    sectionData && sectionData.options
      ? sectionData.options.map((o) => ({
          id: o.id,
          label: o.name,
          value: o.name,
          ...('extra' in o && { extra: o.extra }),
        }))
      : [];

  const selectedOptions =
    data && filterToShowDocs(data).map((i) => i.label.toLocaleLowerCase());

  const handleOnClose = () => {
    setOpen(false);
  };

  const handleOnShow = () => {
    setOpen(true);
  };

  const [actionLabel, editLabel, newLabel] = ['add', 'edit', 'new'].map(
    (text) => startCase(`${t(text)} ${t(type, { count: 1 })}`),
  );

  return (
    <DocContainer
      aid={aid}
      type={type}
      title={title}
      actionLabel={actionLabel}
      titleDialog={selectedData ? editLabel : newLabel}
      description={description}
      action={() => {
        setSelectedData(null);
        handleOnShow();
      }}
      open={open}
      Inputs={Inputs}
      options={options}
      handleOnClose={handleOnClose}
      selectedOptions={selectedOptions}
      handleSubmit={(body) => {
        handleSubmit(body);
        handleOnClose();
      }}
      showOtherOptionForAll={showOtherOptionForAll}
      selected={selectedData}
    >
      <DocumentInfo
        aid={aid}
        data={filterToShowDocs(data)}
        handleOnShow={handleOnShow}
        handleRemove={handleRemove}
        setSelected={setSelectedData}
        selected={selectedData}
        showValue={showValue}
        showExpiration={showExpiration}
        showRequestedBy={showRequestedBy}
        icon={icon}
        defaultIcon={defaultIcon}
        expiration={expiration}
        money={money}
        options={options}
      />
    </DocContainer>
  );
};

export default Section;
