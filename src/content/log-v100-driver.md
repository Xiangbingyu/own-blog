# NVIDIA V100 驱动安装与 Bug 踩坑记录

在配置深度学习环境时，Tesla V100 的驱动安装往往比普通消费级显卡更为复杂。本项目 `NVIDIA-V100-Driver-Automator` 旨在自动化这一过程，解决版本不匹配和内核冲突等常见问题。

## 遇到的核心问题

1.  **驱动版本与内核不兼容**：Linux 内核更新后，旧版驱动模块无法编译加载。
2.  **CUDA 版本冲突**：系统预装的 CUDA Toolkit 与显卡驱动要求的版本不一致。
3.  **持久化模式失效**：重启后显卡设定（如功率限制）丢失。

## 解决方案

- 编写 Shell 脚本自动检测系统内核版本，匹配最佳驱动。
- 使用 DKMS (Dynamic Kernel Module Support) 确保内核更新后驱动依然可用。
- 配置 systemd 服务实现显卡设置的持久化。

## 项目链接

[GitHub 仓库](https://github.com/Xiangbingyu/NVIDIA-V100-Driver-Automator)
