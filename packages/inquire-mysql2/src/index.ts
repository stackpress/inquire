//local
import Mysql2Connection from './Connection.js';
import { connect } from './helpers.js';

export type {
  Results,
  Resource,
  Connector
} from './types.js';

export { Mysql2Connection, connect };

export default connect;