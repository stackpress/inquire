//local
import BetterSqlite3Connection from './Connection';
import { connect } from './helpers';

export type {
  Results,
  Resource,
  Connector
} from './types';

export { BetterSqlite3Connection, connect };

export default connect;