import { } from 'jest';
declare const yzb: any;

class MockYzbNative {
    nextCallbackMap = new Map();
    errorCallbackMap = new Map();
    completeCallbackMap = new Map();

    setCallback() { }
    sendProcessMessage(data: any) {
        const identity = '123456';
        this.nextCallbackMap.set(identity, data.next);
        this.errorCallbackMap.set(identity, data.error);
        this.completeCallbackMap.set(identity, data.complete);
    }
}
(global as any).yzb = {
    native: new MockYzbNative()
};

import { IpcRendererWorker, IpcRenderer } from '../src/index';


describe('IpcRendererWorker check', () => {
    test('check constructor', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        expect(instance.exeName).toEqual(exeName);
    });

    test('check onMessage', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testTopic = 'test-topic';
        const testTopicData = { k1: 'v1' };
        expect.assertions(2);
        // 先测试once在测试on
        instance.once(testTopic, (message: any) => {
            expect(message).toEqual(testTopicData);
        });
        instance.onMessage(testTopic, testTopicData);

        instance.on(testTopic, (message: any) => {
            expect(message).toEqual(testTopicData);
        });
        instance.onMessage(testTopic, testTopicData);
    });

    test('check on', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testOnCallback = (message): void => { console.log(message); };
        const testTopic = 'test-topic';
        instance.on(testTopic, testOnCallback);
        const storeCallback = instance.messageCallbackMap.get(testTopic);
        expect(storeCallback).toEqual(testOnCallback);
    });

    test('check on twice error', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testOnCallback = (message): void => { console.log(message); };
        const testOnCallback1 = (message): void => { console.log(message); };

        const testTopic = 'test-topic';
        expect.assertions(5);
        instance.on(testTopic, testOnCallback);
        try {
            instance.on(testTopic, testOnCallback1);
        } catch (error: any) {
            expect(error.message).toEqual('you can not listen a topic twice!');
        }
        expect(instance.messageCallbackMap.size).toEqual(1);
        expect(instance.messageCallbackMap.get(testTopic)).toEqual(testOnCallback);

        try {
            instance.once(testTopic, testOnCallback1);
        } catch (error: any) {
            expect(error.message).toEqual('you can not listen a topic twice!');
        }
        expect(instance.onceMessageCallbackMap.size).toEqual(0);
    });

    test('check once', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testOnCallback = (message): void => { console.log(message); };
        const testTopic = 'test-topic';
        instance.once(testTopic, testOnCallback);
        const storeCallback = instance.onceMessageCallbackMap.get(testTopic);
        expect(storeCallback).toEqual(testOnCallback);
    });

    test('check once twice error', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testOnCallback = (message): void => { console.log(message); };
        const testOnCallback1 = (message): void => { console.log(message); };

        const testTopic = 'test-topic';
        expect.assertions(5);
        instance.once(testTopic, testOnCallback);
        try {
            instance.once(testTopic, testOnCallback1);
        } catch (error: any) {
            expect(error.message).toEqual('you can not listen a topic twice!');
        }
        expect(instance.onceMessageCallbackMap.size).toEqual(1);
        expect(instance.onceMessageCallbackMap.get(testTopic)).toEqual(testOnCallback);

        try {
            instance.on(testTopic, testOnCallback1);
        } catch (error: any) {
            expect(error.message).toEqual('you can not listen a topic twice!');
        }
        expect(instance.messageCallbackMap.size).toEqual(0);
    });

    test('check removeListener', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testOnCallback = (message): void => { console.log(message); };
        const testOnCallback1 = (message): void => { console.log(message); };
        const testTopic = 'test-topic';

        instance.once(testTopic, testOnCallback);
        expect(instance.onceMessageCallbackMap.size).toEqual(1);
        expect(instance.onceMessageCallbackMap.get(testTopic)).toEqual(testOnCallback);
        instance.removeListener(testTopic);
        expect(instance.onceMessageCallbackMap.size).toEqual(0);

        instance.on(testTopic, testOnCallback);
        expect(instance.messageCallbackMap.size).toEqual(1);
        expect(instance.messageCallbackMap.get(testTopic)).toEqual(testOnCallback);
        instance.removeListener(testTopic);
        expect(instance.messageCallbackMap.size).toEqual(0);
    });
    test('check send', () => {
        const nextCallback = (result: any) => { };
        const errorCallback = (error: any) => { };
        const completeCallback = () => { };
        const testTopic = 'test-topic';
        const exeName = 'test-exe-name';
        const testTopicData = { k1: 'v1' };

        const data = {
            data: {
                process_name: exeName,
                message: {
                    topic: testTopic,
                    data: testTopicData
                },
            },
            next: nextCallback,
            error: errorCallback,
            complete: completeCallback
        };
        const instance = new IpcRendererWorker(exeName);
        instance.send(testTopic, testTopicData, nextCallback, errorCallback, completeCallback);
        expect(yzb.native.nextCallbackMap.get('123456')).toEqual(nextCallback);
        expect(yzb.native.errorCallbackMap.get('123456')).toEqual(errorCallback);
        expect(yzb.native.completeCallbackMap.get('123456')).toEqual(completeCallback);

    });

    test('check promiseSend', () => {

        expect.assertions(4);
        const testTopic = 'test-topic';
        const exeName = 'test-exe-name';
        const testTopicData = { k1: 'v1' };
        const testResultData = { r1: 'v1' };
        const testErrorData = { e1: 'v1' };
        const nextCallback = (result: any) => {
            expect(result).toEqual(testResultData);
        };
        const errorCallback = (error: any) => {
            expect(error).toEqual(testErrorData);
        };
        const completeCallback = () => {
            expect(true).toEqual(true);
        };
        const data = {
            data: {
                process_name: exeName,
                message: {
                    topic: testTopic,
                    data: testTopicData
                },
            }
        };
        const instance = new IpcRendererWorker(exeName);
        instance.promiseSend(testTopic, testTopicData).then(nextCallback).catch(errorCallback).finally(completeCallback);
        yzb.native.nextCallbackMap.get('123456')(testResultData);
        instance.promiseSend(testTopic, testTopicData).then(nextCallback).catch(errorCallback).finally(completeCallback);
        yzb.native.errorCallbackMap.get('123456')(testResultData);
    });

});


describe('IpcRenderer check', () => {
    test('check constructor', () => {

    });
});
