import { } from 'jest';
import { IpcRendererWorker, IpcRenderer } from '../src/index';

class MockYzbNative {
    setCallback() { }
    sendProcessMessage() { }
}
(global as any).yzb = {
    native: new MockYzbNative()
};

describe('IpcRendererWorker check', () => {
    test('check constructor', () => {

    });
});


describe('IpcRenderer check', () => {
    test('check constructor', () => {

    });
});
