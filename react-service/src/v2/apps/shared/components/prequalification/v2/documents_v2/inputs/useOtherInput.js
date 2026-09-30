import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TYPES, OTHER_CERTIFICATE_DOC } from 'v2/helpers/prequal/documents';

const useOtherInput = (data, type, options, selectedOptions, documentsForm) => {
  const { t } = useTranslation();
  const { values, trigger, setValue } = documentsForm;
  const { label } = values;

  const otherValue =
    data &&
    data.section &&
    data.section === type &&
    !options.filter((s) => s.label === label).length;

  const [other, setOther] = useState(otherValue);

  useEffect(() => {
    if (other) {
      setValue('custom_label', label);
      setValue('section', other ? type : TYPES.ACC);
      trigger('section');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [other]);

  const handleOther = (e) =>
    setOther(String(e.target.value) === String(OTHER_CERTIFICATE_DOC));

  const validateTextField = (value = '') => {
    if (selectedOptions.includes(value.toLocaleLowerCase())) {
      const check =
        data &&
        data.custom_label &&
        value.toLocaleLowerCase() === data.custom_label.toLocaleLowerCase()
          ? true
          : t('existing-accreditation');
      if (!data || (data && !('id' in data))) {
        return check;
      }
    }
    return true;
  };

  return [other, handleOther, otherValue, validateTextField];
};

export default useOtherInput;
