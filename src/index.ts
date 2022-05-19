declare const yzb: any;

export class IpcRendererWorker {
  exeName: string;
  messageCallbackMap = new Map();
  onceMessageCallbackMap = new Map();

  constructor(exeName: string) {
    this.exeName = exeName;
  }
  onMessage(topic: string, message: any): void {
    if (this.messageCallbackMap.has(topic)) {
      const callback = this.messageCallbackMap.get(topic);
      callback(message);
    } else if (this.onceMessageCallbackMap.has(topic)) {
      const callback = this.onceMessageCallbackMap.get(topic);
      callback(message);
      this.onceMessageCallbackMap.delete(topic);
    } else { }
  }
  on(topic: string, callback: (message: any) => void): void {
    if (
      this.messageCallbackMap.has(topic) ||
      this.onceMessageCallbackMap.has(topic)
    ) {
      throw new Error('you can not listen a topic twice!');
    }
    this.messageCallbackMap.set(topic, callback);
  }
  once(topic: string, callback: (message: any) => void): void {
    if (
      this.messageCallbackMap.has(topic) ||
      this.onceMessageCallbackMap.has(topic)
    ) {
      throw new Error('you can not listen a topic twice!');
    }
    this.onceMessageCallbackMap.set(topic, callback);
  }
  removeListener(topic: string): void {
    this.messageCallbackMap.delete(topic);
    this.onceMessageCallbackMap.delete(topic);
  }

  removeAllListener(): void {
    this.messageCallbackMap.clear();
    this.onceMessageCallbackMap.clear();
  }

  // tslint:disable-next-line: max-line-length
  send(topic: string, topicMessage: any, nextCallback: (result: any) => void, errorCallbck: (error: any) => void, completeCallback: () => void): void {
    const data = {
      data: {
        process_name: this.exeName,
        message: {
          topic,
          message: topicMessage
        },
      },
      next: nextCallback,
      error: errorCallbck,
      complete: completeCallback
    };
    yzb.native.sendProcessMessage(data);
  }

  sendPromise(topic: string, topicMessage: any): Promise<any> {
    return new Promise((resolve, reject): any => {
      const data = {
        data: {
          process_name: this.exeName,
          message: {
            topic,
            message: topicMessage
          },
        },
        next: (result: any) => {
          resolve(result);
        },
        error: (error: any) => {
          reject(error);
        }
      };
      yzb.native.sendProcessMessage(data);
    });
  }
}


/**
 * 渲染进程的主体类
 */
export class IpcRenderer {

  /**
   * 内部变量无需关注,存储worker的map
   */
  messageWorkerMap = new Map<string, IpcRendererWorker>();
  /**
   * 内部变量无需关注,除了topic消息以外,其他拓展进程发送来的消息监听回调
   */
  otherMessageCallback: ((message: any) => void) | null = null;

  /**
   * 创建类实例
   */
  constructor() {
    if (typeof yzb === 'undefined') {
      throw new Error('yzb is not found, please read the document.');
    }
    const data = {
      data: {},
      next: (messageObject: any) => {
        if (messageObject !== null && typeof messageObject === 'object') {
          if (messageObject.hasOwnProperty('type')) {
            const exeName = messageObject.name;
            const type = messageObject.type;
            if (type === 'yzb_ipc_renderer_message') {
              // 此为ipc消息类型
              const messageData = messageObject.message;
              const messageTopic = messageData.topic;
              const messageTopicMessage = messageData.message;
              // 查找对应的回调,有则执行,无则不执行
              if (this.messageWorkerMap.has(exeName)) {
                const worker = this.messageWorkerMap.get(exeName);
                if (worker !== null && typeof worker === 'object') {
                  worker.onMessage(messageTopic, messageTopicMessage);
                } else {
                  this.messageWorkerMap.delete(exeName);
                }
              } else {
                // 没有回调可执行
              }
            } else {
              if (this.otherMessageCallback) {
                this.otherMessageCallback(messageObject);
              }
            }
          } else {
            if (this.otherMessageCallback) {
              this.otherMessageCallback(messageObject);
            }
          }
        } else {
          if (this.otherMessageCallback) {
            this.otherMessageCallback(messageObject);
          }
        }
      },
    };
    yzb.native.setCallback(data);
  }
  /**
   * 根据拓展进程名字获取单个进程通信worker
   * @param exeName 进程名字
   * @returns worker 对应进程通信worker
   */
  getWorker(exeName: string): IpcRendererWorker {
    const worker = new IpcRendererWorker(exeName);
    this.messageWorkerMap.set(exeName, worker);
    return worker;
  }
  /**
   * 根据拓展进程名字删除单个进程通信worker
   * @param exeName 进程名字
   */
  deleteWorker(exeName: string): void {
    this.messageWorkerMap.delete(exeName);
  }
  /**
   * 删除所有进程通信worker
   */
  removeAllWorker(): void {
    this.messageWorkerMap.clear();
  }
  /**
   * 设置除了topic消息以外,其他拓展进程发送来的消息监听回调
   * @param callback 消息回调
   */
  setOtherMessageCallback(callback: (message: any) => void): void {
    this.otherMessageCallback = callback;
  }
}

export const ipc = new IpcRenderer();
