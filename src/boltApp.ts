import { App as BoltApp } from '@slack/bolt';

let boltApp: BoltApp;

const getBoltApp = (): BoltApp => boltApp;
const setBoltApp = (newBoltApp: BoltApp): BoltApp => (boltApp = newBoltApp);

export { getBoltApp, setBoltApp };
