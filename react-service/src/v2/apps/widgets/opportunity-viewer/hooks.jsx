import React, { useEffect, useState } from 'react';
import { useContext } from 'hooks/context';
import Cookies from 'js-cookie';
import { subdomain, hasCookie } from './config';

function Hooks({
  show = true,
  discover = false,
  subcontractor = {},
  attributes,
  dispatch,
}) {
  const { regions: regionsOptions, loading1, loading2 } = attributes;
  const [showOpportunities, setShowOpportunities] = useState(show && !discover);
  const [trades, setTrades] = useState([]);
  const [regions, setRegions] = useState([]);
  const [initialOption, setInitialOption] = React.useState({
    trades: [],
    regions: [],
    lastCookie: '',
  });

  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;

  useEffect(() => {
    if (!loading1 && !loading2 && !regionsOptions.length) {
      dispatch(actions.fetchAttrRegions());
      dispatch(actions.fetchPublicTrades());
    }
  }, [dispatch, actions, loading1, loading2, regionsOptions]);

  useEffect(() => {
    if (discover) {
      dispatch(actions.fetchSubcontractorInfo());
    }
  }, [actions, discover, dispatch]);

  useEffect(() => {
    if (show && regions?.length && trades?.length) {
      const sendTrades = trades.map((tr) => Number(tr.id));
      const sendRegions = regions.map((r) => Number(r.id));
      const data = {
        trades: sendTrades,
        regions: sendRegions,
      };
      dispatch(actions.fetchOpportunity({ data }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, regions]);

  useEffect(() => {
    let lastCookieInitial = '';
    let regionsInitial = [];
    let tradesInitial = [];
    if (Cookies.get(hasCookie, subdomain)) {
      lastCookieInitial = Cookies.get(hasCookie, subdomain);
    }
    if (regions && regions.length) {
      regionsInitial = [...regions];
    }
    if (trades && trades.length) {
      tradesInitial = [...trades];
    }
    setInitialOption({
      trades: tradesInitial,
      lastCookie: lastCookieInitial,
      regions: regionsInitial,
    });
  }, [trades, regions]);

  const handleSubmit = () => {
    if (trades) {
      const tradesIds = trades.map((t) => Number(t.id));
      dispatch(
        actions.updateOfferingsTrades({
          aid: subcontractor.accountId,
          trades: tradesIds,
        }),
      );
    }
    if (regions) {
      const regionIds = regions.map((r) => Number(r.id));
      dispatch(
        actions.updateOfferingsRegions({
          aid: subcontractor.accountId,
          regions: regionIds,
        }),
      );
    }
  };
  useEffect(() => {
    if (discover && !show && subcontractor && subcontractor.id) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, regions, subcontractor]);

  return {
    trades,
    setTrades,
    regions,
    setRegions,
    initialOption,
    setInitialOption,
    handleSubmit,
    showOpportunities,
    setShowOpportunities,
  };
}

export default Hooks;
