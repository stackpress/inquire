//local
import BetterSqlite3Connection from './Connection.js';
import { connect } from './helpers.js';

export type {
  Results,
  Resource,
  Connector
} from './types.js';

export { BetterSqlite3Connection, connect };

export default connect;