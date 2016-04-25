import events from 'events';
import { isPlainObject } from 'lodash';
import logger from './helpers/logger';
import { JOB_STATUS_PENDING } from './helpers/constants';
import createIndex from './helpers/create_index';

const debug = logger('job');

export default class Job extends events.EventEmitter {
  constructor(client, index, type, payload, options = {}) {
    if (typeof type !== 'string') throw new Error('Type must be a string');
    if (!isPlainObject(payload)) throw new Error('Payload must be a plain object');

    super();

    this.client = client;
    this.index = index;
    this.type = type;
    this.payload = payload;
    this.timeout = options.timeout || 10000;
    this.maxAttempts = options.max_attempts || 3;
    this.priority = Math.max(Math.min(options.priority || 10, 20), -20);

    this.ready = createIndex(client, index)
    .then(() => {
      return this.client.index({
        index: this.index,
        type: this.type,
        body: {
          payload: this.payload,
          priority: this.priority,
          timeout: this.timeout,
          created_at: new Date(),
          attempts: 0,
          max_attempts: this.maxAttempts,
          status: JOB_STATUS_PENDING,
        }
      })
      .then((doc) => {
        this.document = {
          id: doc._id,
          type: doc._type,
          version: doc._version,
        };
        debug('Job created', this.document);
      });
    })
    .catch((err) => {
      debug('Job creation failed', err);
      this.emit('error', err);
      throw err;
    });
  }

}
