# 从 AI 辅助创作到自动对话：双框架聊天室构想

在完成了 `ai-fantasy-assistant` 后，我开始构思一个更具互动性的项目 `chat_room`，旨在实现一个支持多 AI 角色自动对话的聊天室环境。

## 架构构想

计划采用前后端分离，后端采用双框架混合模式：

1.  **Spring Boot (Java)**：负责处理高并发的 WebSocket 连接、用户鉴权与消息路由。Java 的健壮性适合作为长连接网关。
2.  **Django (Python)**：负责与 LLM (大语言模型) 交互、处理复杂的对话逻辑与上下文管理。Python 在 AI 生态中的优势不可替代。

## 核心功能目标

- **角色扮演**：每个 AI 拥有独立的人设 Prompt。
- **自动群聊**：用户作为一个观察者或参与者，看着多个 AI 角色之间基于话题自动展开讨论。

## 项目链接

[GitHub 仓库](https://github.com/Xiangbingyu/chat_room)
