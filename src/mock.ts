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

    /**
     * 无需关注,调用配置存储
     */
    configMap = new Map<string, any>();


    /**
     * 初始化函数
     * @param [debuggerServerUrl] 调试的ws地址,需要配合@yuanzhibang/extension-debugger
     */
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

    /**
     * 处理ws调试服务器发送来的消息
     * @param message 
     */
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


    /**
     * Mocks yzb.native方法
     */
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

    /**
     * 内部方法无需关注，发送消息到调试服务器
     * @param nativeName native的方法名run,stop,setCallback,getProcessInfo,sendProcessMessage,getNativeInfo
     * @param config 调用方法的配置
     * @param [identity] 调用识别
     * @returns  发送的消息体
     */
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
        this.debuggerSocket.send(messageString);
        return message;
    }

    /**
     * 生成唯一的id
     * @param length 生成的长度
     * @returns 对应长度的随机字符串
     */
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
