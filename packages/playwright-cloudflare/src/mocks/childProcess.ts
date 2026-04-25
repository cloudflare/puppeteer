export const execSync = () => {
    throw new Error('execSync not implemented');
};

export const execFile = () => {
    throw new Error('execFile not implemented');
};

export const spawn = () => {
    throw new Error('spawn not implemented');
};

export const spawnSync = () => {
    throw new Error('spawnSync not implemented');
};

export const fork = () => {
    throw new Error('fork not implemented');
};

export default {
    execFile,
    execSync,
    spawn,
    spawnSync,
    fork,
};
