# 后端与 AI 融合之路：从 Java 生态到 Agent 架构

我的技术栈演进是一条从经典后端工程向 AI原生应用架构转型的路线。

## 扎实的后端根基：Java & Spring Boot
大二时期，我系统掌握了 Java 后端开发体系：
- **JVM 原理**：深入理解类加载机制与字节码执行流程。
- **数据结构**：熟练运用 ArrayList, HashMap (红黑树优化), ConcurrentHashMap 等核心容器。
- **Spring 生态**：掌握 Spring Boot 的自动装配原理与微服务架构设计。
- **数据库**：熟练使用 MySQL 与 PostgreSQL，理解索引优化与事务隔离级别。

## 拥抱 AI 原生：Python & Agent
随着大模型技术的爆发，我迅速将技术重心拓展至 Python AI 生态：
- **Agent 框架**：熟练使用 **LangChain** 进行链式调用，使用 **CrewAI** 编排多智能体协作。
- **MCP (Model Context Protocol)**：紧跟前沿标准，实践了 MCP 规范。通过 `@mcp.tool()` 注解封装工具，实现了客户端与 MCP Server 的标准通信，为大模型提供了标准化的外部工具调用接口。
- **混合架构实践**：在最新的聊天室项目中，我尝试了 **Spring Boot (WebSocket/高并发)** + **Django (AI 逻辑/LLM 交互)** 的双框架模式，发挥各自语言的生态优势。

这种“工程化落地 + AI 赋能”的复合能力，使我能够在构建复杂应用时，既保证系统的稳定性，又能引入前沿的智能特性。
