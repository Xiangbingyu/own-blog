# 用户登录安全逻辑：Token 管理与密码加密实战

用户登录是绝大多数应用系统的入口，其安全性至关重要。本文结合"超热爱"项目的实践，探讨 Token 管理和密码加密的最佳方案。

## 一、Access Token + Refresh Token 双 Token 机制

### 为什么需要双 Token？

单一的 Access Token 面临两难抉择：
- **Token 有效期短**：频繁刷新影响用户体验
- **Token 有效期长**：被劫持后攻击窗口过大

双 Token 机制完美解决了这一矛盾。

### 存储策略：内存 vs Cookie

| Token 类型 | 存储位置 | 理由 |
|-----------|---------|------|
| Access Token | 前端内存（变量） | 不持久化，页面关闭即丢失，降低 XSS 风险 |
| Refresh Token | HttpOnly Cookie | 无法被 JavaScript 访问，防止 XSS 盗取 |

### 滑动窗口续期机制

传统的被动过期机制存在体验断层。滑动窗口机制实现了无感续期：

```
用户操作 → 检测 Token 即将过期 → 自动用 Refresh Token 换取新 Token
```

实现要点：
1. Access Token 有效期设为 15 分钟
2. Refresh Token 有效期设为 7 天
3. 每次接口请求时，检查 Access Token 剩余有效期
4. 若剩余有效期 < 5 分钟，触发静默刷新
5. Refresh Token 只在刷新接口调用，不参与业务请求

```
┌─────────────────────────────────────────────────────────┐
│                    滑动窗口续期流程                        │
├─────────────────────────────────────────────────────────┤
│  1. 前端发起请求，携带 Access Token                       │
│  2. 后端校验 Token，发现即将过期（剩余 < 5分钟）           │
│  3. 前端静默调用 /refresh 接口，携带 Refresh Token        │
│  4. 后端验证 Refresh Token，颁发新的 Access Token         │
│  5. 重试原请求，用户无感知                                  │
└─────────────────────────────────────────────────────────┘
```

### Refresh Token 旋转策略

为防止 Refresh Token 被窃取后滥用，采用"一次一换"策略：
- 每次使用 Refresh Token 刷新后，颁发新的 Refresh Token
- 旧 Refresh Token 立即失效
- 若检测到 Refresh Token 被重复使用，触发安全警报并清除所有 Token

## 二、密码加密：盐值哈希与 BCrypt

### 简单方案：盐值 + SHA-256

最基础的密码加密方案：

```java
public String hashPassword(String password, String salt) {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    digest.update(salt.getBytes());
    byte[] hash = digest.digest(password.getBytes());
    return Base64.getEncoder().encodeToString(hash);
}
```

存在的问题：
- SHA-256 计算速度极快，容易被暴力破解
- 盐值需要单独存储，增加了管理复杂度
- 无法防止彩虹表攻击

### 推荐方案：BCrypt

BCrypt 是专为密码哈希设计的算法，具有以下特点：

```java
// BCrypt 加密
public String hashPassword(String password) {
    return BCrypt.hashpw(password, BCrypt.gensalt(12));
}

// BCrypt 校验
public boolean verifyPassword(String password, String hashed) {
    return BCrypt.checkpw(password, hashed);
}
```

BCrypt 的优势：

| 特性 | 说明 |
|-----|------|
| 内置盐值 | 盐值直接嵌入哈希字符串，无需单独存储 |
| 计算成本高 | 可通过 cost factor 控制计算时间，抵御暴力破解 |
| 自适应 | 随着硬件性能提升，可增加 cost factor 保持安全 |

### 更强方案：Argon2

Argon2 是 2015 年密码哈希竞赛的冠军，在 BCrypt 基础上进一步增强：

```java
public String hashPassword(String password) {
    return Argon2PasswordEncoder.generateSecret(
        Argon2Parameters.builder(Argon2Parameters.ARGON2id)
            .withMemoryAsHeap(65536, 4)
            .withIterations(3, 4)
            .withParallelism(4)
            .build()
    );
}
```

三种变体：
- **Argon2d**：GPU 抵抗性强，适合加密货币
- **Argon2i**：侧信道攻击抵抗性强，适合密码哈希
- **Argon2id**：混合模式，兼具两者优点（推荐）

## 三、Spring Security 核心配置解析

### CSRF 防护机制

CSRF（跨站请求伪造）攻击原理：

```
用户已登录银行网站 → 访问恶意网站 → 恶意网站自动发起转账请求 → 浏览器携带 Cookie → 银行执行转账
```

Spring Security 默认启用 CSRF 防护，通过 Token 验证请求来源：

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringAntMatchers("/api/public/**")  // 公开接口放行
            );
    }
}
```

关键点：
- CSRF Token 通常放在请求头或表单中
- `CookieCsrfTokenRepository.withHttpOnlyFalse()` 让前端能读取到 Token
- 公开接口需显式排除

### anyRequest() 与路径匹配

Spring Security 6.x 的请求匹配链：

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()      // 1. 公开接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")   // 2. 角色控制
                .anyRequest().authenticated()                        // 3. 其他需认证
            );
    }
}
```

匹配顺序：**从上到下，匹配即停止**。因此：
- 精确路径放前面
- `anyRequest()` 放最后作为兜底

### 完整的登录安全配置示例

```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringAntMatchers("/api/auth/login", "/api/auth/register")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), 
                UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(exceptionHandlerFilter(), 
                JwtAuthenticationFilter.class);
        
        return http.build();
    }
}
```

## 小结

用户登录安全是一个系统工程：
- **Token 管理**：双 Token + 滑动窗口 + 旋转 Refresh Token
- **密码加密**：避免自研哈希，使用 BCrypt/Argon2
- **Spring Security**：合理配置 CSRF 和请求匹配规则

任何一环的疏漏都可能导致安全风险，唯有系统性设计才能保障用户身份安全。
