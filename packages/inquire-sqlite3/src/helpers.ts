//stackpress
import Engine from '@stackpress/inquire/Engine';
//local
import type { Connector, Resource } from './types.js';
import Connection from './Connection.js';

export function connect(resource: Connector): Engine<Resource> {
  const connection = new Connection(resource);
  return new Engine<Resource>(connection);
}