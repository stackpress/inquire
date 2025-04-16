//local
import PGLiteConnection from './Connection.js';
import { connect } from './helpers.js';

export type {
  Results,
  Resource,
  Connector
} from './types.js';

export { PGLiteConnection, connect };

export default connect;