import React from 'react';
import isArray from 'lodash/isArray';
import { getUrl } from 'v2/helpers/url';
import Subscription from 'v2/helpers/user/subscription';
import { mapData, EXTERNAL, getDataFromForm } from './isolated-functions';

const CLINK_NETWORK = 3;
const subscriptionHelper = new Subscription();
class SupplyChainHelper {
  static subClinkNetwork() {
    return CLINK_NETWORK;
  }

  static subExternal() {
    return EXTERNAL;
  }

  static selectOption(data, selected) {
    return [...data, selected];
  }

  static createOption(options) {
    return [...options].map((option) => ({
      id: option.id,
      label: option.label,
    }));
  }

  static selectOptionV2(selected) {
    return selected;
  }

  static mapData = (data) => mapData(data);

  static getFullAddress = (address = {}) => {
    const {
      address_line_1: addressLine1 = '',
      address_line_2: addressLine2 = '',
      country = '',
      locality = '',
      region = '',
      postal_code: postcode = '',
      premises = '',
    } = address;

    return address
      ? [
          premises,
          addressLine1,
          addressLine2,
          locality,
          region,
          country,
          postcode,
        ]
          .map((item) => item || '')
          .filter((item) => item !== '')
          .join(', ')
      : '';
  };

  static getDataFromForm = (data) => getDataFromForm(data);

  static transformFormData = (id, data) => {
    const users = {
      id,
      firstname: data.contact_name,
      email: data.email,
      lastname: '',
      account_id: id,
    };
    return {
      ...data,
      id,
      company: data.company_name,
      users,
    };
  };

  static showData = (row) => {
    const { users, subscription_id } = row;
    let Wrapper = ({ children }) => children;
    if (
      users?.account_id &&
      !subscriptionHelper.isExternalMin(subscription_id)
    ) {
      const url = getUrl(
        'CLINK_APP_HOST',
        `/main-contractor/supply_chain/${users.account_id}?return=sc`,
      );
      Wrapper = ({ children }) => (
        <a href={url} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }

    return {
      id: row.id,
      company: <Wrapper>{row.company_name}</Wrapper>,
      email: row.email || '',
      'contact-name': row.contact_name,
      'contact-number': row.phone || row.mobile || '',
      created_at: row.created_at || '',
      status: row?.status?.label || {},
      trades: row?.trades || [],
      locations: row?.locations || [],
    };
  };

  static joinData = (data, field, emptyMessage = '', separator = ', ') => {
    const newData = (data && isArray(data) && data.map((d) => d[field])) || '';
    return newData.length ? newData.join(separator) : emptyMessage;
  };
}

export default SupplyChainHelper;
