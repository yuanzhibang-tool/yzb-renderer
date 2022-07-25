import { YzbNativeMock } from '../src/mock';
global.yzb = {};
declare var yzb: any;
const mock = new YzbNativeMock();
mock.mockYzbNative();

describe('YzbNativeMock check', () => {
    test('check run', () => {
        const config = {
            data: { exe_name: 'test_exe' },
            next: (result: any) => {
                console.log(result);
            }
        };
        const messageSend = yzb.native.run(config);
        expect(true).toEqual(true);
        const message = {
            identity: messageSend.identity,
            type: 'next',
            result: {
                x: 1
            }
        };
        mock.processMessage(message);
    });

});