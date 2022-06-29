declare const yzb: any;
import { TextDecoder } from '@sinonjs/text-encoding';

class MockYzbNative {
    nextCallbackMap = new Map();
    errorCallbackMap = new Map();
    completeCallbackMap = new Map();
    messageCallback: any = null;
    setCallback(messageCallback: () => void) {
        this.messageCallback = messageCallback;
    }
    sendProcessMessage(data: any) {
        const identity = '123456';
        this.nextCallbackMap.set(identity, data.next);
        this.errorCallbackMap.set(identity, data.error);
        this.completeCallbackMap.set(identity, data.complete);
    }
}
(window as any).TextDecoder = TextDecoder;
(window as any).yzb = {
    native: new MockYzbNative()
};

import { IpcRendererWorker, IpcRenderer, IpcDataHelper } from '../src/index';

describe('IpcDataHelper check', () => {
    test('check array covert to uint8Array', () => {
        let uint8Array: any = null;
        const inputValue = [1, 2, 3, 4];
        if (Array.isArray(inputValue)) {
            uint8Array = Uint8Array.from(inputValue);
        }
        expect(uint8Array instanceof Uint8Array).toEqual(true);
    });
    test('check uint8ArrayToString', () => {
        const inputValue = new Uint8Array(4);
        inputValue[0] = 0x31;
        inputValue[1] = 0x32;
        inputValue[2] = 0x33;
        inputValue[3] = 0x34;
        const result = IpcDataHelper.uint8ArrayToString(inputValue as any, 'ascii');
        const expectResult = '1234';
        expect(result).toEqual(expectResult);
    });

    test('check uint8ArraytoBase64', () => {
        const inputValue = [0x01, 0x02, 0x03, 0x04];
        const result = IpcDataHelper.uint8ArraytoBase64(inputValue as any);
        const expectResult = 'AQIDBA==';
        expect(result).toEqual(expectResult);
    });
    test('check base64ToUint8Array', () => {
        const inputValue = 'AQIDBA==';
        const result = IpcDataHelper.base64ToUint8Array(inputValue);
        const expectResult = new Uint8Array(4);
        expectResult[0] = 0x01;
        expectResult[1] = 0x02;
        expectResult[2] = 0x03;
        expectResult[3] = 0x04;
        expect(result).toEqual(expectResult);
    });
    test('check hexToUint8Array', () => {
        const inputValue = '01020304';
        const result = IpcDataHelper.hexToUint8Array(inputValue);
        const expectResult = new Uint8Array(4);
        expectResult[0] = 0x01;
        expectResult[1] = 0x02;
        expectResult[2] = 0x03;
        expectResult[3] = 0x04;
        expect(result).toEqual(expectResult);
    });

    test('check uint8ArrayToHex', () => {
        const inputValue = new Uint8Array(4);
        inputValue[0] = 0x01;
        inputValue[1] = 0x02;
        inputValue[2] = 0x03;
        inputValue[3] = 0x04;
        const result = IpcDataHelper.uint8ArrayToHex(inputValue);
        const expectResult = '01020304';
        expect(result).toEqual(expectResult);
    });

    test('check encode', () => {
        const type = 'hex';
        const data = '01020304';
        const result = IpcDataHelper.encode(type, data);
        const expectResult = {
            type,
            data
        };
        expect(result).toEqual(expectResult);
    });
});

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
        const testTopicMessage = { k1: 'v1' };
        expect.assertions(2);
        // 先测试once在测试on
        instance.once(testTopic, (message: any) => {
            expect(message).toEqual(testTopicMessage);
        });
        instance.processMessage(testTopic, testTopicMessage);

        instance.on(testTopic, (message: any) => {
            expect(message).toEqual(testTopicMessage);
        });
        instance.processMessage(testTopic, testTopicMessage);
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

        instance.on(testTopic, testOnCallback1);
        expect(instance.messageCallbackMap.size).toEqual(1);
        expect(instance.messageCallbackMap.get(testTopic)).toEqual(testOnCallback1);
        instance.removeListener(testTopic);
        expect(instance.messageCallbackMap.size).toEqual(0);
    });

    test('check removeAllListener', () => {
        const exeName = 'test-exe-name';
        const instance = new IpcRendererWorker(exeName);
        const testOnCallback = (message): void => { console.log(message); };
        const testOnCallback1 = (message): void => { console.log(message); };
        const testTopic = 'test-topic';
        const testTopic1 = 'test-topic1';

        instance.once(testTopic, testOnCallback);
        instance.on(testTopic1, testOnCallback1);
        instance.removeAllListener();
        expect(instance.messageCallbackMap.size).toEqual(0);
        expect(instance.onceMessageCallbackMap.size).toEqual(0);

    });

    test('check send', () => {
        const nextCallback = (result: any) => { };
        const errorCallback = (error: any) => { };
        const completeCallback = () => { };
        const testTopic = 'test-topic';
        const exeName = 'test-exe-name';
        const testTopicMessage = { k1: 'v1' };

        const data = {
            data: {
                exe_name: exeName,
                message: {
                    topic: testTopic,
                    data: testTopicMessage
                },
            },
            next: nextCallback,
            error: errorCallback,
            complete: completeCallback
        };
        const instance = new IpcRendererWorker(exeName);
        instance.send(testTopic, testTopicMessage, nextCallback, errorCallback, completeCallback);
        expect(yzb.native.nextCallbackMap.get('123456')).toEqual(nextCallback);
        expect(yzb.native.errorCallbackMap.get('123456')).toEqual(errorCallback);
        expect(yzb.native.completeCallbackMap.get('123456')).toEqual(completeCallback);

    });

    test('check sendPromise', () => {

        expect.assertions(4);
        const testTopic = 'test-topic';
        const exeName = 'test-exe-name';
        const testTopicMessage = { k1: 'v1' };
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
                exe_name: exeName,
                message: {
                    topic: testTopic,
                    message: testTopicMessage
                },
            }
        };
        const instance = new IpcRendererWorker(exeName);
        instance.sendPromise(testTopic, testTopicMessage).then(nextCallback).catch(errorCallback).finally(completeCallback);
        yzb.native.nextCallbackMap.get('123456')(testResultData);
        instance.sendPromise(testTopic, testTopicMessage).then(nextCallback).catch(errorCallback).finally(completeCallback);
        yzb.native.errorCallbackMap.get('123456')(testErrorData);
    });

});


describe('IpcRenderer check', () => {
    test('check getWorker', () => {
        const instance = new IpcRenderer();
        const exeName = 'test-exe-name';
        const worker = instance.getWorker(exeName);
        expect(worker.exeName).toEqual(exeName);
        expect(instance.messageWorkerMap.get(exeName)).toEqual(worker);
        expect(instance.messageWorkerMap.size).toEqual(1);
    });

    test('check deleteWorker', () => {
        const instance = new IpcRenderer();
        const exeName = 'test-exe-name';
        const worker = instance.getWorker(exeName);
        instance.deleteWorker(exeName);
        expect(instance.messageWorkerMap.size).toEqual(0);
    });

    test('check removeAllWorker', () => {
        const instance = new IpcRenderer();
        const exeName = 'test-exe-name';
        const exeName1 = 'test-exe-name1';

        const worker = instance.getWorker(exeName);
        const worker1 = instance.getWorker(exeName1);
        instance.removeAllWorker();
        expect(instance.messageWorkerMap.size).toEqual(0);
    });

    test('check on topic message callback', () => {
        const testTopic = 'test-topic';
        const testTopicMessage = { k1: 'v1' };
        const exeName = 'test-exe-name';
        const topicMessage = {
            type: 'yzb_ipc_renderer_message',
            name: exeName,
            data: {
                topic: testTopic,
                message: testTopicMessage,
            }
        };
        const instance = new IpcRenderer();
        const worker = instance.getWorker(exeName);
        expect.assertions(1);

        worker.on(testTopic, (message: any) => {
            expect(message).toEqual(testTopicMessage);
        });
        yzb.native.messageCallback.next(topicMessage);
    });

    test('check on not topic message callback', () => {
        const testTopic = 'test-topic';
        const testTopicMessage = { k1: 'v1' };
        const exeName = 'test-exe-name';
        const testMessage = {
            type: 'xxx',
            name: exeName,
            message: {
                topic: testTopic,
                data: testTopicMessage,
            }
        };
        expect.assertions(3);

        const instance = new IpcRenderer();
        instance.setOtherMessageCallback((message) => {
            expect(message).toEqual(testMessage);
        });
        yzb.native.messageCallback.next(testMessage);

        const testMessage1 = {
            type: 'xxx',
            message: testTopicMessage,
            name: exeName
        };
        instance.setOtherMessageCallback((message) => {
            expect(message).toEqual(testMessage1);
        });
        yzb.native.messageCallback.next(testMessage1);

        const testMessage2 = {
            message: 'xxx',
            name: exeName
        };
        instance.setOtherMessageCallback((message) => {
            expect(message).toEqual(testMessage2);
        });
        yzb.native.messageCallback.next(testMessage2);
    });
});
