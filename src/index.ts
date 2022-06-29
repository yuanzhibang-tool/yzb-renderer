import { ExtensionLifecycleEventMessageTopic, ExtensionRendererMessageTopic } from '@yuanzhibang/common';
declare const yzb: any;

export interface IpcData {

  /**
   * 数据类型
   */
  type: 'base64' | 'hex';

  /**
   * 数据的具体值,本质为字符串,hex为16进制字符串'0e3a'
   */
  data: string;
}
/**
 * ipc通信的数据类型,用来对数据进行解码编码
 */
export class IpcDataHelper {

  /**
   * uint8Array转换为字符串
   * @param uint8Array 输入的uint8Array
   * @param encoding 可选值参考:https://encoding.spec.whatwg.org/#names-and-labels
   * @returns 转换成功的字符串
   */
  static uint8ArrayToString(uint8Array: Uint8Array, encoding: string): string {
    if (Array.isArray(uint8Array)) {
      uint8Array = Uint8Array.from(uint8Array);
    }
    const decoder = new TextDecoder(encoding);
    const result = decoder.decode(uint8Array);
    return result;
  }
  /**
   * uint8Array转换为base64
   * @param uint8Array 输入的uint8Array
   * @returns 转换后的base64
   */
  static uint8ArraytoBase64(uint8Array: Uint8Array): string {
    if (Array.isArray(uint8Array)) {
      uint8Array = Uint8Array.from(uint8Array);
    }
    return window.btoa(String.fromCharCode.apply(null, uint8Array as any));
  }

  /**
   * uint8Array转换为hex
   * @param uint8Array 输入的uint8Array
   * @returns 转换后的hex
   */
  static uint8ArrayToHex(uint8Array: Uint8Array): string {
    if (Array.isArray(uint8Array)) {
      uint8Array = Uint8Array.from(uint8Array);
    }
    const hex: Array<string> = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < uint8Array.length; i++) {
      const current = uint8Array[i] < 0 ? uint8Array[i] + 256 : uint8Array[i];
      // tslint:disable-next-line: no-bitwise
      hex.push((current >>> 4).toString(16));
      // tslint:disable-next-line: no-bitwise
      hex.push((current & 0xF).toString(16));
    }
    return hex.join('');
  }

  /**
   * base64转换为uint8Array
   * @param base64 输入的base64
   * @returns  转换后的uint8Array
   */
  static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const u8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const indexValue = binaryString.charCodeAt(i);
      u8Array[i] = indexValue;
    }
    return u8Array;
  }
  /**
   * hex转换为uint8Array
   * @param hex 输入的hex
   * @returns  转换后的uint8Array
   */
  static hexToUint8Array(hex: string): Uint8Array {
    const u8Array = new Uint8Array(hex.length / 2);
    for (let c = 0; c < hex.length; c += 2) {
      const subString = hex.substring(c, c + 2);
      const value = parseInt(subString, 16);
      const index = c / 2;
      u8Array[index] = value;
    }
    return u8Array;
  }
  /**
   * 生成IpcData
   * @param type 编码格式
   * @param data 编码后的字符串
   * @returns 生成的IpcData对象
   */
  static encode(type: 'base64' | 'hex', data: string): IpcData {
    return {
      type,
      data
    };
  }
}
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

  // !生命周期相关函数

  /**
   * 在process在执行时候调用,代表猿之棒客户端已经启动该process,该回调由猿之棒客户端触发
   * @param 对应生命周期需要执行的回调 
   */
  onStart(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_START, callback);
  }

  /**
   * 在process将要初始化的时候调用,代表已经进入process处理阶段,该回调由extension调用触发
   * @param 对应生命周期需要执行的回调 
   */
  onWillInit(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_WILL_INIT, callback);
  }

  /**
   * 在process完成初始化的时候调用,代表已经完成process初始化,该回调由extension调用触发
   * @param 对应生命周期需要执行的回调 
   */
  onInit(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_INIT, callback);
  }

  /**
   * 在process主动退出前调用,该回调由extension调用触发
   * @param 对应生命周期需要执行的回调 
   */
  onWillExit(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_WILL_EXIT, callback);
  }

  /**
   * 在process退出时调用,该回调由猿之棒客户端触发,由node child_process exit事件触发,具体参考:https://nodejs.org/api/child_process.html#event-exit
   * @param 对应生命周期需要执行的回调 
   */
  onExit(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_EXIT, callback);
  }

  /**
   * 在process出现错误时调用,该回调由猿之棒客户端触发,由node child_process error事件触发,具体参考:https://nodejs.org/api/child_process.html#event-error
   * @param 对应生命周期需要执行的回调 
   */
  onError(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_ERROR, callback);
  }

  /**
   * 在process关闭时调用,该回调由猿之棒客户端触发,由node child_process close事件触发,具体参考:https://nodejs.org/api/child_process.html#event-close
   * @param 对应生命周期需要执行的回调 
   */
  onClose(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_CLOSE, callback);
  }

  /**
   * 在process触发stderr时调用,该回调由猿之棒客户端触发,由node child_process.stderr data事件触发,具体参考:https://nodejs.org/api/child_process.html#subprocessstderr
   * @param 对应生命周期需要执行的回调 
   */
  onStdError(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_STDERR, callback);
  }

  /**
   * 在process触发stdout时调用,该回调由猿之棒客户端触发,由node child_process.stdout data事件触发,具体参考:https://nodejs.org/api/child_process.html#subprocessstdout
   * @param 对应生命周期需要执行的回调 
   */
  onStdOut(callback: (message: any) => void): void {
    this.messageCallbackMap.set(ExtensionLifecycleEventMessageTopic.ON_STDOUT, callback);
  }

  /**
   * 内部方法无需关注,用来响应由IpcRenderer转发process.on('message')消息的方法
   * @param topic 消息的topic
   * @param message topic消息的消息体
   */
  processMessage(topic: string, message: any): void {
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
      throw new Error(`you can not listen a topic twice! topic: ${topic}`);
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
      throw new Error(`you can not listen a topic twice! topic: ${topic}`);
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
  send(topic: string, topicMessage: any = null, nextCallback: ((result: any) => void) | null = null, errorCallbck: ((error: any) => void) | null = null, completeCallback: (() => void) | null = null): void {
    const data: any = {
      data: {
        exe_name: this.exeName,
        message: {
          topic,
          message: topicMessage
        },
      }
    };
    if (nextCallback) {
      data.next = nextCallback;
    }
    if (errorCallbck) {
      data.error = errorCallbck;
    }
    if (completeCallback) {
      data.complete = completeCallback;
    }
    yzb.native.sendProcessMessage(data);
  }

  /**
   * 以promise的形式向拓展进程发送消息
   * @param topic 消息的topic
   * @param topicMessage topic消息的消息体
   * @returns promise 发送消息的回调promise
   */
  sendPromise(topic: string, topicMessage: any = null): Promise<any> {
    return new Promise((resolve, reject): any => {
      const data = {
        data: {
          exe_name: this.exeName,
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

  /**
   * 向进程发送用户退出消息
   * @param message 退出的消息,用以给process做一些处理,可以是null
   * @returns promise process收到消息后给renderer的回调promise
   */
  exit(message: any = null): Promise<any> {
    return this.sendPromise(ExtensionRendererMessageTopic.USER_EXIT, message);
  }

  /**
   * 向进程发送获取属性的消息
   * @param message 获取属性需要的消息,用以给process做一些处理,可以是null
   * @returns promise process收到消息后给renderer的回调promise
   */
  getProperty(message: any = null): Promise<any> {
    return this.sendPromise(ExtensionRendererMessageTopic.GET_PROPERTY, message);
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
              const messageData = messageObject.data;
              const messageTopic = messageData.topic;
              const messageTopicMessage = messageData.message;
              // 查找对应的回调,有则执行,无则不执行
              if (this.messageWorkerMap.has(exeName)) {
                const worker = this.messageWorkerMap.get(exeName);
                if (worker !== null && typeof worker === 'object') {
                  worker.processMessage(messageTopic, messageTopicMessage);
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
