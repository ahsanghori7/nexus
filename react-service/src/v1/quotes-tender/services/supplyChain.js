import Relay from '../../global/services/Relay';

// TODO: check if we can use/delete this
// when implementing refactored version
// of supply chain endpoint
class SupplyChain extends Relay {
  constructor(pid, tid) {
    super('supply_chain', 'getContractors');
    this._pid = pid;
    this._tid = tid;
    this._contractors = null;
  }

  set pid(pid) {
    this._pid = pid;
  }

  get pid() {
    return this._pid;
  }

  set tid(tid) {
    this._tid = tid;
  }

  get tid() {
    return this._tid;
  }

  set contractors(contractors) {
    this._contractors = contractors;
  }

  get contractors() {
    return this._contractors;
  }

  async getContractors() {
    if (!this.contractors) {
      return this.getJson({ pid: this.pid, tid: this.tid }).then((j) => {
        this.contractors = j;
        return new Promise((resolve, reject) => {
          if (this.contractors) {
            resolve(this.contractors);
          } else {
            reject();
          }
        });
      });
    }
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => resolve(this.contractors));
  }
}

export default SupplyChain;
