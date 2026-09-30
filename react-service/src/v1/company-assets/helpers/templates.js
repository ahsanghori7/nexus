import moment from 'moment';

const MONTHS = 12;
class Templates {
  static getTemplate = (templates, id) => {
    const [selectedTemplate] = templates.filter(
      (template) => template.id === id
    );
    return selectedTemplate ?? null;
  };

  static addTemplate = (templates, template) => [...templates, template];

  static getRowValuationDates = (date) => {
    const B = new Date(date);
    const A = Templates.addDays(B, -4);
    const C = Templates.addDays(B, 12);
    const D = Templates.addDays(C, 5);
    const F = Templates.addDays(C, 14);
    const E = Templates.addDays(F, -5);
    return { A, B, C, D, E, F };
  };

  static addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  static addMonth = (date = new Date(), sum = 0) => {
    const nextMonth = date.getMonth() + sum;
    const newDate = new Date(date.setMonth(nextMonth));
    if (nextMonth % MONTHS < newDate.getMonth()) {
      return new Date(newDate.getFullYear(), newDate.getMonth(), 0);
    }
    return newDate;
  };

  static formatDate(date) {
    return moment(date).format('DD-MMM-YY');
  }
}

export default Templates;
export { MONTHS };
