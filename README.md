# @yuanzhibang/renderer

猿之棒渲染端帮助类猿之棒 web 页面开发的辅助库,用以优化 renderer 和 node 进程的通信,具体使用请参考文档

**仓库地址:**

https://github.com/yuanzhibang-tool/yzb-renderer.git

**issue**

https://github.com/yuanzhibang-tool/yzb-renderer/issues

**npm**

https://www.npmjs.com/package/@yuanzhibang/renderer

## 安装

`npm i @yuanzhibang/renderer --save`

或者

`yarn add @yuanzhibang/renderer`

## 使用

> `@yuanzhibang/renderer`该模块仅适用在网页 `renderer` 进程里,该拓展在初始化后,将自动接收`yzb.native.setCallback`的消息回调,请勿在拓展进程的其他部位使用`yzb.native.setCallback`来配置消息回调,否则可能会造成模块工作异常.

_请参考_

`typescript`使用演示
https://github.com/yuanzhibang-tool/yzb-extension-demo-ts/blob/main/src/index.ts

`javascript`使用演示
https://github.com/yuanzhibang-tool/yzb-extension-demo-js/blob/main/src/index.js
