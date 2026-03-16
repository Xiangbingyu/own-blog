# 使用Ubuntu基础镜像（服务器若能拉取则自动拉取，若不能则离线处理）
FROM ubuntu:22.04

# 避免交互模式，设置环境变量
ENV DEBIAN_FRONTEND=noninteractive

# 安装Nginx（手动安装，绕开镜像拉取）
RUN apt update && \
    apt install -y nginx && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# 复制你的博客文件到Nginx默认目录
COPY ./src/ /usr/share/nginx/html/

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]