import { useForm } from 'react-hook-form';
import createDocObj from './common';

const useDocumentsForm = (data, typeDocument) => {
  const {
    reset,
    control,
    trigger,
    register,
    setValue,
    getValues,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm({ defaultValues: createDocObj(data, typeDocument) });

  const values = getValues();

  return {
    values,
    handleSubmit,
    reset,
    trigger,
    register,
    setValue,
    resetField,
    control,
    errors,
  };
};

export default useDocumentsForm;
