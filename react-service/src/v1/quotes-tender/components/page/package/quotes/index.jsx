import React, { useCallback, useState, useEffect } from 'react';
import { useContext } from 'v2/hooks/context';
import { connect } from 'react-redux';
import ClinkInput from 'v1/global/components/general-ui/clink-input-v2';
import {
  numToPrice,
  priceValueTest,
  pennyToFloat,
} from 'v1/quotes-tender/helpers/price';
import BudgetEdit from 'v1/quotes-tender/public/images/svg/budget-edit.svg';
import Grid from '@mui/material/Grid2';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableFooter from '@mui/material/TableFooter';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { CONSTANTS } from 'clink-components';
import Quote from './quote';

const { clinkRed, clinkGreen } = CONSTANTS.colors.general;

const getDiff = (total, budget) => {
  let diff = 0;
  let diffVal = '';
  if (total !== 0) {
    diff = budget - total;
    diffVal = numToPrice(diff);
  }

  const color = diff > 0 ? { color: clinkGreen } : { color: clinkRed };

  return (
    <TableCell colSpan={5}>
      <Typography fontWeight={600}>
        Difference +/-: <span style={color}>{diffVal}</span>
      </Typography>
    </TableCell>
  );
};

let Budget = ({ budget, hasBoq, pid, tid, dispatch }) => {
  const context = useContext('clink');
  const { actions } = context;
  const [typingTimeout, setTypingTimeout] = useState(null);

  const debouncedUpdate = useCallback(
    (newValue) => {
      dispatch(
        actions.updateProjectTender({
          id: pid,
          tid,
          data: { budget: newValue },
        }),
      );
    },
    [actions, dispatch, pid, tid],
  );

  const handleChange = useCallback(
    (value) => {
      const newValue = value || 0;
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      setTypingTimeout(
        setTimeout(() => {
          debouncedUpdate(newValue);
        }, 500), // 500ms delay
      );
    },
    [typingTimeout, debouncedUpdate],
  );

  useEffect(() => {
    // Clear the timeout if the component unmounts
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return (
    <ClinkInput
      name="budget"
      label="Budget"
      value={budget}
      validate={priceValueTest}
      disabled={hasBoq}
      change={handleChange}
      parser={(value) => {
        return String(value).replace('.', '');
      }}
      renderer={(value, i) => {
        const { focused } = i.state;
        return focused ? pennyToFloat(value) : numToPrice(value);
      }}
    />
  );
};

Budget = connect()(Budget);

const Quotes = ({
  templates,
  pid,
  tid,
  awarded,
  quotes,
  toggleFilter,
  filteredQuotes,
  hasBoq,
  flagBoq,
  budget,
  filter,
  showSnackbar,
}) => {
  let nonCompliantCount = 0;
  let total = false;
  let hasSelected = 0;
  Object.keys(quotes).forEach((quote) => {
    const {
      compliant,
      price_selected: priceSelected,
      order_price: orderPrice,
      price,
    } = quotes[quote];
    if (!compliant) {
      nonCompliantCount += 1;
    }
    if (priceSelected) {
      total = orderPrice > 0 && awarded ? orderPrice : price;
      hasSelected = quote;
    } else if (!hasSelected && !awarded && compliant) {
      if (!total || price < total) {
        total = price;
      }
    } else if (!hasSelected && awarded && orderPrice > 0) {
      total = orderPrice;
    }
  });

  // TODO: Move filter logic to redux
  return (
    <>
      <div className="table-tab-options">
        {Boolean(awarded) && (
          <div className={filter === true ? 'active tab' : 'tab'}>
            <button type="button" onClick={() => toggleFilter(true)}>
              Awarded
            </button>
          </div>
        )}
        {(Boolean(awarded) || (!awarded && Boolean(nonCompliantCount))) && (
          <div className={filter === 1 ? 'active tab' : 'tab'}>
            <button type="button" onClick={() => toggleFilter(1)}>
              Compliant
            </button>
          </div>
        )}
        {nonCompliantCount > 0 && (
          <div className={filter === 0 ? 'active tab' : 'tab'}>
            <button type="button" onClick={() => toggleFilter(0)}>
              Non-Compliant
            </button>
          </div>
        )}
      </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>
                {awarded ? 'Order Price' : 'Quotation Price'}
              </TableCell>
              <TableCell>Measured Work</TableCell>
              <TableCell>Prelims</TableCell>
              <TableCell>
                Prov Sums /<br /> Other Items
              </TableCell>
              <TableCell>Programme (Weeks)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuotes &&
              Object.keys(filteredQuotes)
                .sort(
                  (quoteA, quoteB) =>
                    filteredQuotes[quoteA].priceToShow -
                    filteredQuotes[quoteB].priceToShow,
                )
                .map((quote) => (
                  <Quote
                    key={quote}
                    packageAwarded={awarded}
                    pid={pid}
                    tid={tid}
                    qid={quote}
                    templates={templates}
                    selectedQuote={hasSelected}
                    flagBoq={flagBoq}
                    {...filteredQuotes[quote]}
                    showSnackbar={showSnackbar}
                  />
                ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>
                <Grid container spacing={2}>
                  <Grid>
                    <Budget
                      hasBoq={hasBoq}
                      pid={pid}
                      tid={tid}
                      budget={budget}
                    />
                  </Grid>
                  {!hasBoq && (
                    <Grid>
                      <IconButton cursor="none">
                        <BudgetEdit />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </TableCell>
              <TableCell colSpan={3}>
                <Typography fontWeight={600}>
                  Total: {numToPrice(total || 0)}
                </Typography>
              </TableCell>
              {getDiff(total || 0, budget)}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </>
  );
};

export default Quotes;
