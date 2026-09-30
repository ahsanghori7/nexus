import React, { useEffect, useRef } from 'react';

/** React Dependencies **/
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';

/** 3rd Party Dependencies **/
import orderBy from 'lodash/orderBy';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';

/** Local Dependencies **/
import { useContext } from 'hooks/context';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import flag from 'v2/helpers/flags';

/** App Component **/
import { BoqContainer } from 'v2/apps/clink/pages/tender-analysis/styled/mui';
import QuoteReview from 'v2/apps/clink/pages/tender-analysis/quote-review';
import QuoteHistory from 'v2/apps/clink/pages/tender-analysis/quote-history';
import { TenderAnalysisHeader } from './TenderAnalysisHeader';

const TenderAnalysis = ({ boq, dispatch, contextType = 'clink' }) => {
  const myRef = useRef(null);
  const { slug: projectSlug, tid } = useParams();
  const context = useContext(contextType);
  const { actions } = context;

  const {
    loading,
    units,
    entity,
    loadedQuotes,
    quotes,
    orderTemplates,
    quoteHistory = [],
  } = boq;
  //Entity can be null as its not defined in the initial state, prob a toDo to fix there.
  const entries = entity ? entity.entries : [];
  const budget = entries.reduce((partialSum, rd) => {
    if (Number(rd.budget_total)) {
      return partialSum + Number(rd.budget_total);
    }
    return partialSum + Number(rd.budget_rate) * Number(rd.quantity);
  }, 0);
  /**
   * Load a single BOQ for a package
   * Get the units
   */
  useEffect(() => {
    if (projectSlug) {
      dispatch(actions.fetchBoQByTenderId({ projectSlug, tid }));
      dispatch(actions.fetchUnits());
      dispatch(actions.fetchOrderTemplates());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug]);

  /**
   * Once the BOQ Entity is loaded we need to get all the quotes
   * There is a ToDo in the fetchBoQQuotes action fulfillment, be mindful not to use the rate from the entity.entities
   * and only use quote data from the quotes prop
   * Details of the BOQ Quote Api Response can be found : https://c-link.atlassian.net/wiki/x/CQAkBw
   */
  useEffect(() => {
    if (entity && entity.id && !loadedQuotes) {
      dispatch(actions.fetchBoQQuotes(entity.id));
    }
    return () => {
      dispatch(actions.setLocalLoadQuotes(false));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  useEffect(() => {
    if (entity && entity.id && !quoteHistory.length) {
      dispatch(actions.fetchQuoteHistory({ boqId: entity.id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  /**
   * Map the items or the grid and enrich with the unit symbol
   * @type {*[]}
   */
  const items =
    (entries && [
      ...entries.map((entry) => {
        const entityUnit = units.find((unit) => {
          return unit.id === entry.unit_id;
        });
        if (entityUnit) {
          const { symbol, name } = entityUnit;
          return { unit: symbol, unit_name: name, ...entry };
        }
        return entry;
      }),
    ]) ||
    [];

  /**
   * Loop all the quotes to build the table data requiring item level rate and total, and a table total summary
   * We need to map the subcontractors quote to each row item and keep them aligned for the table,
   * filling empty data the subcontractor may not have quoted for yet
   * ToDo:
   * - calculate percent and total difference from the boq item budget, if one provided
   * - Add a new row that shows the item budget then the best price next to it as per the design
   * For Guidance See Design (https://xd.adobe.com/view/60bceb6e-f76a-43b3-8b90-0b6c5bea6940-35ef/screen/3150adda-916f-44c8-a0fe-43af66b7fa24)
   */
  let quoteTableItems =
    (entries &&
      quotes &&
      quotes.map((q) => {
        const { quote: quoteItems, programme, subcontractor, differences } = q;
        const rows = items.map((en) => {
          const quoteItem = quoteItems.find((qi) => {
            return qi.boq_item_id === en.id;
          });
          const quoteItemRate = quoteItem ? Number(quoteItem.rate) : 0;
          const total = quoteItemRate * Number(en.quantity);
          const hasNewChanges = differences.includes(en.id);

          const rowData = {
            boq_item_id: en.id,
            rate: parseCurrency(
              quoteItemRate,
              currencyConfig[i18next.t('currency')]
            ),
            totalValue: total,
            total: parseCurrency(total, currencyConfig[i18next.t('currency')]),
            unit: en.unit,
            description: en.description,
            quantity: en.quantity,
            best: quoteItem ? quoteItem.best_price : false,
            hasNewChanges,
            tooltipText: hasNewChanges ? i18next.t('item-quote-update') : '',
          };
          return rowData;
        });

        /**
         * Get the summary Total by looping the rowData and summing the item level totals
         * Also add in the quote programme and subcontractor data
         */
        const summaryTotal = rows.reduce(
          (partialSum, rd) => partialSum + rd.totalValue,
          0
        );
        const margin = budget - summaryTotal;
        return {
          ...q,
          summary: summaryTotal,
          summaryCurrency: parseCurrency(
            summaryTotal,
            currencyConfig[i18next.t('currency')]
          ),
          margin,
          marginCurrency: parseCurrency(
            margin,
            currencyConfig[i18next.t('currency')]
          ),
          rows,
          id: q.id,
          programme,
          subcontractor,
        };
      })) ||
    [];
  const bestPrice = maxBy(quoteTableItems, (o) => o.margin);
  const bestProgramme = minBy(quoteTableItems, (o) => Number(o.programme));
  quoteTableItems =
    (bestPrice &&
      quoteTableItems.map((qt) => ({
        ...qt,
        bestPrice: qt.margin === bestPrice.margin,
        bestProgramme: qt.programme === bestProgramme.programme,
      }))) ||
    quoteTableItems;
  quoteTableItems = orderBy(quoteTableItems, ['margin'], ['desc']);
  quoteTableItems = quoteTableItems.map((qi) => {
    const newQi = {
      ...qi,
    };
    const notCurrent = quoteTableItems.filter((qq) => qq.id !== qi.id);
    newQi.rows = newQi.rows.map((newQ) => {
      let priceMatch = false;
      notCurrent.forEach((nc) => {
        nc.rows.forEach((rnc) => {
          if (
            !priceMatch &&
            newQ.boq_item_id === rnc.boq_item_id &&
            newQ.total === rnc.total
          ) {
            priceMatch = true;
          }
        });
      });
      return {
        ...newQ,
        priceMatch,
      };
    });
    return newQi;
  });
  /**
   * Build a tab content list from the quote data
   * @type {{label, content}[]|*[]}
   */
  let quoteOverviewContent =
    (quotes &&
      quoteTableItems && [
        ...quoteTableItems.map((quote) => ({
          label: quote.subcontractor.name || '',
          content: (
            <>
              <QuoteReview
                orderTemplates={orderTemplates}
                quote={quote}
                units={units}
                entity={entity}
              />
              <QuoteHistory
                data={quoteHistory[quote?.subcontractor?.id ?? 0]}
                entity={entity}
                subcontractor={quote.subcontractor}
              />
            </>
          ),
        })),
      ]) ||
    [];
  quoteOverviewContent = flag('HIDE_TABS') ? quoteOverviewContent : [];

  return (
    <BoqContainer>
      <TenderAnalysisHeader
        totalBudget={budget}
        myRef={myRef}
        slug={projectSlug}
        tabsArray={quoteOverviewContent}
        loading={loading}
        quoteTableItems={quoteTableItems}
        items={items}
        tid={tid}
      />
    </BoqContainer>
  );
};

const mapStateToProps = (state) => {
  return {
    boq: state.boq,
  };
};

export default connect(mapStateToProps)(TenderAnalysis);
