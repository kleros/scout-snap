import { isLocalSnap } from './snap';
import { Snap } from '../types';

export const shouldDisplayReconnectButton = (installedSnap?: Snap): boolean =>
  installedSnap ? isLocalSnap(installedSnap.id) ?? false : false;
