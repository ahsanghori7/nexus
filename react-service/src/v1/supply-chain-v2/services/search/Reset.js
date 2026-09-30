import GlobalService, { getConfig } from '../../../global/services/clink';

const defaultConfig = getConfig({
  submitUrl: `${BASE_URLS.CLINK_APP_HOST}/relay?action=supply_chain&method=getChain`,
  method: 'GET',
  key: 'ResetSearch',
});

class Reset extends GlobalService {
  constructor(config = defaultConfig) {
    super(config);
  }

  submitError() {
    return undefined;
  }

  static formatTrades(tradesOptions) {
    return Object.values(tradesOptions).flatMap((trades) =>
      Object.entries(trades)
        .map((trade) =>
          trade[0] === 'label'
            ? null
            : {
                value: trade[0],
                label: trade[1].label,
              }
        )
        .filter((trade) => trade !== null)
    );
  }
}

export default Reset;
