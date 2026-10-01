export const execSync = unsupported('execSync');
export const spawn = unsupported('spawn');
export const spawnSync = unsupported('spawnSync');
export const fork = unsupported('fork');

function unsupported(operation: string) {
  return () => {
    throw new Error(`${operation} not implemented`);
  };
}

export default {execSync, spawn, spawnSync, fork};
