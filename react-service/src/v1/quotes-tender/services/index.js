import ProjectService from '../../global/services/project';

class QuoteService extends ProjectService {
  async getProjectQuotes(data) {
    const params = {
      ...data,
      method: 'getTransactionQuotes',
    };
    this.method = 'GET';
    return this.projectAction(params);
  }

  async getProjectSummary(data) {
    const params = {
      ...data,
      method: 'getTransactionSummary',
    };
    this.method = 'GET';
    return this.projectAction(params);
  }
}

export default QuoteService;
