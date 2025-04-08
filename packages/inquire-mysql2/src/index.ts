//local
import Mysql2Connection from './Connection';
import { connect } from './helpers';

export type {
  Results,
  Resource,
  Connector
} from './types';

export { Mysql2Connection, connect };

export default connect;