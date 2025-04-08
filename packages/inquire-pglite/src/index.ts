//local
import PGLiteConnection from './Connection';
import { connect } from './helpers';

export type {
  Results,
  Resource,
  Connector
} from './types';

export { PGLiteConnection, connect };

export default connect;