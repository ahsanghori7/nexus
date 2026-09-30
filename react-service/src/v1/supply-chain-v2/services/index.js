import { httpHelperV2 as httpHelperService } from 'v2/services/httpHelper';
import Relay from '../../global/services/Relay';
import SupplyChainHelper from '../helpers';
import ResetSearch from './search/Reset';

class SupplyChainV2 {
  regions() {
    return [];
  }

  async trades() {
    return [];
  }

  filterRepeatValues(data) {
    return data
      ? data.filter(
          (value, index, self) =>
            index === self.findIndex((t) => Number(t.id) === Number(value.id)),
        )
      : [];
  }

  async fetchAll() {
    const result = await httpHelperService({ url: 'account/supply-chain' });
    const data = (result && result.data && Object.values(result.data)) || [];
    const info = result && result.info ? result.info : { total: 0 };
    const aid = result && result.aid ? result.aid : 0;
    return { data: data.map((o) => SupplyChainHelper.mapData(o)), info, aid };
  }

  async addData(data) {
    const newData = SupplyChainHelper.getDataFromForm(data);
    const response = await httpHelperService({
      url: 'account/supply-chain',
      method: 'POST',
      body: newData.data,
    });
    if (response?.data?.subcontractor_id) {
      return SupplyChainHelper.transformFormData(
        response.data.subcontractor_id,
        data,
      );
    }
    throw new Error('An error ocurred when creating subcontractor');
  }

  async editData(data, params) {
    const newData = SupplyChainHelper.getDataFromForm(data);
    const response = await httpHelperService({
      url: `account/supply-chain/${params?.id || 0}`,
      method: 'PATCH',
      body: newData.data,
    });
    if (response?.data?.status) {
      const { id } = params;
      return SupplyChainHelper.transformFormData(id, data);
    }
    throw new Error('An error ocurred when updating subcontractor');
  }

  async removeData(data) {
    return httpHelperService({
      url: `account/supply-chain/${data?.id || 0}`,
      method: 'DELETE',
    });
  }

  async searchByNumber(number) {
    const service = new Relay('company_house', 'searchByRegNumber');
    return service.getJson({ number }).then((result) => {
      const response = {
        found: false,
        address: {},
        name: '',
        has_account: false,
        contact_name: '',
        email: '',
        phone: '',
        in_supply_chain: false,
      };
      if (result && result.found) {
        const hasAccount = Boolean(result.account_match);
        response.found = result.found;
        response.address = result.address;
        response.name = result.name;
        response.in_supply_chain = Boolean(result.in_supply_chain);
        response.has_account = hasAccount;
        response.contact_name = hasAccount ? result.contact_name || '' : '';
        response.email = hasAccount ? result.email || '' : '';
        response.phone = hasAccount ? result.phone || '' : '';
      }
      return response;
    });
  }

  async searchByInternalData(region = 0, search = {}) {
    const keys = Object.keys(search);
    const values = Object.values(search);
    let url = `companies/company_options/${region}`;
    keys.forEach((key, index) => {
      if (!index) {
        url += '?';
      } else {
        url += '&';
      }
      url += `${key}=${values[index]}`;
    });
    return httpHelperService({ url });
  }

  async searchByName(nameParam) {
    const service = new Relay('company_house', 'searchByName');
    return service
      .getJson({ name: encodeURIComponent(nameParam?.name), subcontractorType: nameParam?.subcontractorType || 'uk' })
      .then((result) => {
        const found = result && result.found;
        const companies =
          (result &&
            result.companies &&
            result.companies.map((company, id) => ({
              ...company,
              id,
              found,
              has_account: Boolean(company.account_match),
              content: company.name || 'No company name',
            }))) ||
          [];
        return { found, companies };
      });
  }

  async validateEmail(email) {
    const service = new Relay('account', 'emailExists', { email });
    return service.getJson().then((result) => {
      const { exists } = result;
      return exists;
    });
  }
}

export default SupplyChainV2;
export { ResetSearch };

export const dedupeAttributeOptions = (options) =>
  new SupplyChainV2().filterRepeatValues(options);
