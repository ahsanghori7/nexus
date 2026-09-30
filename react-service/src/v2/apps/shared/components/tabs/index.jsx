import React, { useEffect } from 'react';
import Content from './Content';
import Header from './Header';

const maxWidth = '1378px !important';
const Tabs = ({
  tabs = [],
  block = false,
  setPageFromExternal = () => null,
  pageFromExternal = 0,
  percentComplete = 0,
  showPercent,
  lastStepSave,
  lastStepFunction = () => null,
  hideActionButtonsInTabs = [],
  countryCode = 'UK',
  contextType = 'prosper',
}) => {
  const [page, setPage] = React.useState(pageFromExternal);

  useEffect(() => {
    setPage(pageFromExternal);
  }, [pageFromExternal]);

  useEffect(() => {
    if (page !== pageFromExternal) {
      setPageFromExternal(page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <>
      <Header
        tabs={tabs}
        page={page}
        setPage={setPage}
        maxWidth={maxWidth}
        block={block}
      />
      <Content
        tabs={tabs}
        page={page}
        setPage={setPage}
        maxWidth={maxWidth}
        showPercent={showPercent}
        percentComplete={percentComplete}
        lastStepSave={lastStepSave}
        lastStepFunction={lastStepFunction}
        hideActionButtonsInTabs={hideActionButtonsInTabs}
        countryCode={countryCode}
        contextType={contextType}
      />
    </>
  );
};

export default Tabs;
