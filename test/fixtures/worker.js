import events from 'events';

export default class Worker extends events.EventEmitter {
  constructor(queue, type, workerFn, opts = {}) {
    super();

    this.queue = queue;
    this.type = type;
    this.workerFn = workerFn;
    this.options = opts;
  }

  getProp(name) {
    return this[name];
  }
}