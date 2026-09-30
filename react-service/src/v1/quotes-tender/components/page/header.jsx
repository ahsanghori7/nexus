import React, { useCallback } from 'react';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import { getUrl } from 'v2/helpers/url';
import DownloadButton from 'v1/transactions/components/shared/DownloadButton';

const quoteCount = (newCount, total) => {
  if (newCount && total) {
    return (
      <div className="quote-count">
        <span>
          <span>{newCount} </span>
          new quotes&nbsp;
        </span>
        out of {total}
      </div>
    );
  }
  return null;
};

class Gia extends React.Component {
  constructor(props) {
    super(props);
    const { gia } = props;
    this.state = { value: gia };
    this.timeout = 0;
    this.setGia = this.setGia.bind(this);
    this.updateGia = this.updateGia.bind(this);
  }

  componentWillUnmount() {
    this.timeout = null;
  }

  setGia(value) {
    this.setState({ value }, () => {
      const gia = Number(value);
      if (gia) {
        this.updateGia(gia);
      }
    });
  }

  updateGia(gia) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      const { onGiaChange } = this.props;
      onGiaChange(gia);
    }, 500);
  }

  render() {
    const { value } = this.state;
    const { countryCode } = this.props;
    return (
      <div className="gia-container">
        <div className="gia-label">
          Gross Internal Floor (GIA) area {countryCode === 'UK' ? 'ft' : 'm'}/2
          <span>*</span>
        </div>
        <div>
          <input
            name="gia"
            placeholder="GIA"
            value={value}
            onChange={(e) => this.setGia(e.target.value)}
            onFocus={() => this.setGia('')}
          />
        </div>
      </div>
    );
  }
}

const Header = ({ gia, pid, quotesData, clinkAccount, dispatch }) => {
  const context = useContext('clink');
  const { actions } = context;

  const onGiaChange = useCallback(
    (grossIntArea) => {
      dispatch(actions.updateProject({ pid, data: { gia: grossIntArea } }));
    },
    [actions, dispatch, pid],
  );

  const { tenders } = quotesData;

  let hasQuotes = false;

  // Check if any object inside tenders object has a quotes array or object with at least 1 entry
  for (const key in tenders) {
    if (Object.prototype.hasOwnProperty.call(tenders, key)) {
      const tender = tenders[key];

      if (tender?.quotes && Boolean(Object.keys(tender.quotes).length)) {
        hasQuotes = true;
        break;
      }
    }
  }

  return (
    <div className="header-items">
      <div className="header-left">
        {quoteCount()}
        {hasQuotes && (
          <DownloadButton
            downloadLink={getUrl('CLINK_APP_HOST', `/reports/quotes/${pid}`)}
          >
            DOWNLOAD QUOTES REPORT
          </DownloadButton>
        )}
      </div>
      <div className="header-right">
        <Gia
          gia={gia}
          pid={pid}
          onGiaChange={onGiaChange}
          countryCode={clinkAccount?.country?.code ?? 'UK'}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(Header);
