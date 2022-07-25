import { YzbNativeMock } from '../src/index';
global.yzb = {};
declare var yzb: any;
const mock = new YzbNativeMock();
mock.mockYzbNative();
mock.debuggerSocket.send = (message) => { return message; };
describe('YzbNativeMock check', () => {
    const result = { x: 1 };
    expect.hasAssertions();
    test('check run', () => {
        const config = {
            data: { exe_name: 'test_exe' },
            next: (result: any) => {
                expect(result).toEqual(result);
            }
        };
        const messageSend = yzb.native.run(config);
        const message = {
            identity: messageSend.identity,
            type: 'next',
            result
        };
        mock.processMessage(message);
    });

});