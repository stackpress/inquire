//stackpress
import Engine from '@stackpress/inquire/Engine';
//local
import type { Connector, Resource } from './types';
import Connection from './Connection';

export function connect(resource: Connector) {
  const connection = new Connection(resource);
  return new Engine<Resource>(connection);
}