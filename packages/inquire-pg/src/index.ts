//local
import PGConnection from './Connection';
import { connect } from './helpers';

export type {
  Results,
  Resource,
  Connector
} from './types';

export { PGConnection, connect };

export default connect;