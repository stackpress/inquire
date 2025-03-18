//stackpress
import Engine from '@stackpress/inquire/Engine';
//local
import type { Connector, Resource } from './types';
import Connection from './Connection';

export function connect(resource: Connector): Engine<Resource> {
  const connection = new Connection(resource);
  return new Engine<Resource>(connection);
}