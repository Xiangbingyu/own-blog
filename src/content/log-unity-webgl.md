# 将 Unity 数字人接入 Web：React 与 WebGL 的融合

在 `AIassistant_React` 项目中，为了在网页端展示逼真的 3D 心理辅导员形象，探索了 Unity 到 WebGL 的导出与集成方案。

## 技术实现路径

1.  **Unity WebGL 导出**：配置 Unity 构建设置，优化模型面数与纹理压缩，以减少 WebGL 包体大小。
2.  **React 组件封装**：使用 `react-unity-webgl` 库将构建好的 loader 封装为 React 组件。
3.  **双向通信**：
    - **JS 调用 Unity**：前端将语音识别转换后的文本发送给 Unity 进行口型驱动。
    - **Unity 调用 JS**：Unity 触发特定事件（如动画结束）通知前端更新 UI。

## 挑战与优化

- **加载速度**：启用了 Gzip 压缩与流式加载。
- **内存管理**：在组件卸载时正确清理 WebGL 上下文，防止内存泄漏。

## 项目链接

[GitHub 仓库](https://github.com/Xiangbingyu/AIassistant_React)
