import React, { useState, useEffect } from 'react';
import isArray from 'lodash/isArray';
import { useTranslation } from 'react-i18next';
import SelectDialog from 'v2/apps/shared/components/select';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import httpHelper from 'v2/services/httpHelper';
import {
  modalSx,
  saveModalAcceptSx,
  saveModalCancelSx,
} from 'v2/apps/clink/pages/boq/content/style';

const Add = ({
  data = null,
  myRef = null,
  entities = [],
  reset = () => null,
  navigateAfterAdding = () => null,
}) => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [trades, setTrades] = useState([]);
  const [currentValueTrades, setCurrentValueTrades] = useState([]);
  const { t } = useTranslation();

  const handleTrades = (dataT) => {
    setCurrentValueTrades(dataT);
  };

  useEffect(() => {
    if (data) {
      setTenders(data.tender);
    }
  }, [data]);

  useEffect(() => {
    // we need only draft tenders or published ones
    const tradesArray = tenders.filter((item) => item.state >= 1);
    if (isArray(tradesArray)) {
      setTrades(
        (tradesArray || []).map((ne) => ({ id: ne.id, label: ne.label }))
      );
    }
  }, [tenders]);

  useEffect(() => {
    if (entities?.length && !currentValueTrades.length) {
      const newEntities = trades.filter((trade) => {
        return entities.filter((e) => e.tender_id === trade.id).length;
      });
      setCurrentValueTrades(
        newEntities.map((ne) => ({ id: ne.id, label: ne.label }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, entities]);

  const handleOpen = (trade) =>
    setOpen({
      id: 'add-boq-entity',
      navTitle: 'are-you-sure',
      title: 'entities-modal-text',
      cancel: 'cancel',
      confirm: 'confirm',
      handleAccept: () => {
        setLoading(true);
        setCurrentValueTrades([...currentValueTrades, trade]);
        return httpHelper({
          url: `boq/entity/${trade.id}`,
          method: 'POST',
        }).then(() => {
          setLoading(false);
          setOpen(false);
          reset().then(() => {
            navigateAfterAdding(trade.id);
          });
        });
      },
    });

  return (
    <>
      <Modal
        open={open}
        setOpen={setOpen}
        style={modalSx}
        acceptStyleProp={saveModalAcceptSx}
        cancelStyleProp={saveModalCancelSx}
      />
      {!loading && (
        <SelectDialog
          myRef={myRef}
          title={t('entities-modal-title')}
          options={trades}
          name="trades"
          placeholder=""
          emptyStateMessage={t('boq-add-package-no-results')}
          defaultValues={currentValueTrades}
          updateValues={handleTrades}
          context="clink"
          uncheck
          uncheckAction={handleOpen}
        />
      )}
    </>
  );
};

export default Add;
