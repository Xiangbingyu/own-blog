# 超热爱第一周：Spring Boot 与团队协作初体验

入职"超热爱"项目程序开发组的第一周，是充实而高效的一周。从框架入门到代码提交，每一环节都让我对工程化开发有了更深的理解。

## 技术栈快速上手：Spring Boot 全家桶

本周的核心任务是熟悉公司项目的技术架构。作为一个以 Java 为主的后端项目，技术栈包括：

- **Spring Boot**：作为项目的基础框架，我系统学习了自动装配原理、依赖注入机制以及配置管理体系。
- **Spring Security + JWT**：实现了用户登录的安全认证流程。通过 JWT Token 的生成与校验，理解了无状态认证的设计思想。
- **Swagger**：集成 API 文档自动生成，让前后端协作更加高效。

在开发过程中，我使用了 `enterprise-java-backend` 和 `enterprise-react-frontend` 两个 Skills 来辅助开发。这两个 Skills 帮助我快速理解了企业级项目的代码结构与最佳实践，大大缩短了上手时间。

## 团队协作规范：从代码到习惯

第一周的另一大收获是理解了团队编程规范的重要性。在多次代码提交中，我逐渐适应了以下规范：

### Bean 命名规范

公司对 Bean 的命名有明确要求，需要能够清晰表达其职责。例如：
- `UserLoginService` - 用户登录服务
- `OrderQueryRepository` - 订单查询仓储
- `PaymentNotifyController` - 支付通知控制器

这种命名方式让代码的可读性大大提升，新人也能快速定位功能模块。

### @Resource 注解规范

在依赖注入时，公司要求 `@Resource` 注解必须指定 `name` 属性：

```java
@Resource(name = "userLoginService")
private UserLoginService userLoginService;
```

这样做的好处是：
1. 明确指定注入的 Bean 名称，避免歧义
2. 在存在多个同类型实现时，不会出现注入错误
3. 代码意图更加清晰，便于维护

### Swagger API 文档管理

使用 Swagger 自动生成 API 文档是团队的标准实践。通过注解方式描述接口：

```java
@ApiOperation(value = "用户登录", notes = "通过用户名密码登录系统")
@ApiResponses({
    @ApiResponse(code = 200, message = "登录成功"),
    @ApiResponse(code = 401, message = "认证失败")
})
@PostMapping("/login")
public Result<LoginResponse> login(@RequestBody LoginRequest request) {
    // ...
}
```

这让前端同学可以实时查看最新的接口文档，减少了沟通成本。

## 代码提交与 Code Review

本周我完成了多次代码提交，每次提交都经历了 Code Review 流程。从 Review 意见中，我学到了很多：

- 提交信息要清晰描述改动内容
- 单次提交的改动范围要适中
- 代码风格要与项目保持一致
- 关键逻辑需要添加注释说明

## 小结

第一周的经历让我深刻体会到，企业级开发不仅仅是写代码，更是一个系统工程。从框架选型到编码规范，从版本管理到团队协作，每个环节都有其存在的意义。

接下来的工作中，我将继续深入学习业务逻辑，争取早日能够独立承担模块开发任务。同时，也会持续关注代码质量，让每一行代码都经得起推敲。
