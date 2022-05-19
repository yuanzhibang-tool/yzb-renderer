declare const yzb: any;

export class IpcRendererWorker {
  /**
   * 进程名
   */
  exeName: string;

  /**
   * 内部变量无需关注,on保存的回调保存map
   */
  messageCallbackMap = new Map<string, (message: any) => void>();
  /**
   * 内部变量无需关注,once保存的回调保存map
   */
  onceMessageCallbackMap = new Map<string, (message: any) => void>();

  /**
   * 创建类实例
   * @param exeName 进程名
   */
  constructor(exeName: string) {
    this.exeName = exeName;
  }

  /**
   * 内部方法无需关注,用来响应由IpcRenderer转发process.on('message')消息的方法
   * @param topic 消息的topic
   * @param message topic消息的消息体
   */
  onMessage(topic: string, message: any): void {
    if (this.messageCallbackMap.has(topic)) {
      const callback = this.messageCallbackMap.get(topic);
      if (callback) {
        callback(message);
      }
    } else if (this.onceMessageCallbackMap.has(topic)) {
      const callback = this.onceMessageCallbackMap.get(topic);
      if (callback) {
        callback(message);
      }
      this.onceMessageCallbackMap.delete(topic);
    } else { }
  }
  /**
   * 监听拓展进程发送来的topic消息,除非取消监听或者拓展进程生命周期结束,否则该监听一直有效
   * @param topic 监听的topic
   * @param callback 收到topic消息的回调,message为topic消息的消息体
   */
  on(topic: string, callback: (message: any) => void): void {
    if (
      this.messageCallbackMap.has(topic) ||
      this.onceMessageCallbackMap.has(topic)
    ) {
      throw new Error('you can not listen a topic twice!');
    }
    this.messageCallbackMap.set(topic, callback);
  }
  /**
   * 和on方法的作用一致,只不过回调一次后自动移除该回调
   * @param topic 监听的topic
   * @param callback 收到topic消息的回调,message为topic消息的消息体
   */
  once(topic: string, callback: (message: any) => void): void {
    if (
      this.messageCallbackMap.has(topic) ||
      this.onceMessageCallbackMap.has(topic)
    ) {
      throw new Error('you can not listen a topic twice!');
    }
    this.onceMessageCallbackMap.set(topic, callback);
  }
  /**
   * 移除单个topic消息回调,不区分是通过on或者once添加的回调
   * @param topic 移除监听的topic
   */
  removeListener(topic: string): void {
    this.messageCallbackMap.delete(topic);
    this.onceMessageCallbackMap.delete(topic);
  }
  /**
   * 移除所有监听的topic,不区分是通过on或者once添加的回调
   */
  removeAllListener(): void {
    this.messageCallbackMap.clear();
    this.onceMessageCallbackMap.clear();
  }

  /**
   * 向拓展进程发送消息
   * @param topic 消息的topic
   * @param topicMessage topic消息的消息体
   * @param nextCallback next/then结果回调
   * @param errorCallbck error错误回调
   * @param completeCallback 结束回调
   */
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

  /**
   * 以promise的形式向拓展进程发送消息
   * @param topic 消息的topic
   * @param topicMessage topic消息的消息体
   * @returns promise 发送消息的回调promise
   */
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
