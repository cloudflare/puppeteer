import { Skipped } from '../utils.js';

export const useFakeTimers = (): never => {
    throw new Skipped("Skipped because sinon.useFakeTimers is not supported in this environment");
};

export const spy = (): never => {
    throw new Skipped("Skipped because sinon.spy is not supported in this environment");
};

export const stub = (): never => {
    throw new Skipped("Skipped because sinon.stub is not supported in this environment");
};

export default {};
