declare const yzb: any;

export class YzbNativeMock {
    /**
   * 调试服务器地址
   */
    debuggerServerUrl: string;

    /**
    * 调试服务器socket链接
    */
    debuggerSocket: WebSocket;

    configMap = new Map<string, any>();

    constructor(debuggerServerUrl = 'localhost:8889') {
        this.debuggerServerUrl = debuggerServerUrl;
        this.debuggerSocket = new WebSocket(`ws://${this.debuggerServerUrl}`);
        this.debuggerSocket.addEventListener('open', (event) => {
            console.log('调试服务器链接成功!');
        });
        this.debuggerSocket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            this.processMessage(data);
        });
    }

    processMessage(message: any) {
        const identity = message.identity;
        const type = message.type;
        const result = message.result;
        if (identity) {
            if (this.configMap.has(identity)) {
                const callback = this.configMap.get(identity)[type];
                callback(result);
            }
        }
    }

    mockYzbNative() {
        yzb.native = {
            run: (config) => {
                return this.sendMessageToDebuggerServer('run', config);
            },
            stop: (config) => {
                return this.sendMessageToDebuggerServer('stop', config);
            },
            setCallback: (config) => {
                return this.sendMessageToDebuggerServer('setCallback', config, 'setCallback');
            },
            getProcessInfo: (config) => {
                return this.sendMessageToDebuggerServer('getProcessInfo', config);
            },
            sendProcessMessage: (config) => {
                return this.sendMessageToDebuggerServer('sendProcessMessage', config);
            },
            getNativeInfo: (config) => {
                return this.sendMessageToDebuggerServer('getNativeInfo', config);
            },
        };
    }

    sendMessageToDebuggerServer(nativeName: string, config: any, identity: string | null = null) {
        if (typeof config.data === 'undefined') {
            config.data = {};
        }
        if (identity === null) {
            identity = this.makeid(32);
        }

        const storeObject = {
            identity,
            data: config.data,
            cancel: (result: any) => {
                if (config.cancel) {
                    config.cancel(result);
                }
                if (config.complete) {
                    config.complete();
                }
            },
            next: (result: any) => {
                if (config.next) {
                    config.next(result);
                }
                if (config.complete) {
                    config.complete();
                }
            },
            error: (result: any) => {
                if (config.error) {
                    config.error(result);
                }
                if (config.complete) {
                    config.complete();
                }
            },
            complete: () => {
                if (config.complete) {
                    config.complete();
                }
            }
        };

        this.configMap.set(identity as any, storeObject);
        const message = {
            identity,
            nativeName,
            data: config.data
        };
        const messageString = JSON.stringify(message);
        // this.debuggerSocket.send(messageString);
        return message;
    }

    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }
}
