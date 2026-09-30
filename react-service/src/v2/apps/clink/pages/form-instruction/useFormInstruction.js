import isNil from 'lodash/isNil';
import { useEffect, useState } from 'react';

const selectUniquePackage = (sub) =>
  sub && sub.packages && sub.packages.length === 1;

const useFormInstruction = (
  s,
  setValue,
  getValues,
  createInstruction
) => {
  const [sub, setSub] = useState();
  const [pack, setPack] = useState();
  const [fullForm, setFullForm] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveData = () => {
    const { subcontractor, package: tender, pid, type } = getValues();
    createInstruction({
      pid,
      sid: subcontractor.id,
      tid: tender.id,
      type,
    });
  };

  useEffect(() => {
    if (!isNil(s)) {
      setSub(s);
    }
  }, [s]);

  useEffect(() => {
    if (selectUniquePackage(sub)) {
      setPack(sub.packages[0]);
      setValue('package', sub.packages[0]);
    } else {
      setFullForm(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub]);

  useEffect(() => {
    if (sub && pack) {
      saveData();
    }
    setFullForm(!isNil(pack));
  }, [pack, saveData, sub]);

  return { fullForm };
};

export default useFormInstruction;
