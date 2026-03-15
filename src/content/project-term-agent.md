# Term-Agent：打造你的终端智能助手并发布至 PyPI

Term-Agent 是我开发的一个基于命令行的智能助手，旨在让开发者无需离开终端即可获得 AI 的帮助。

## 核心功能

- **自然语言转命令**：输入 "如何解压 tar.gz 文件"，自动生成 `tar -xzvf file.tar.gz` 并执行。
- **代码解释**：选中一段代码或指定文件，让 AI 解释其含义。
- **Git 提交助手**：根据 `git diff` 自动生成 Commit Message。

## PyPI 发布之路

这是我第一次将 Python 包发布到 PyPI，经历了完整的开源流程：

1.  **项目结构规范化**：配置 `setup.py` (或 `pyproject.toml`)，定义依赖、版本号与入口点 (Entry Points)。
2.  **构建分发包**：使用 `build` 工具生成 Wheel 和 Source Distribution。
3.  **上传至 PyPI**：通过 `twine` 将包上传至 PyPI 仓库。

现在，任何人都可以通过一行命令安装使用：
```bash
pip install term-agent
```

## 项目链接

[GitHub 仓库](https://github.com/Xiangbingyu/term-agent)
