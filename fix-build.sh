#!/bin/bash

echo "=== 开始修复 Strapi 构建问题 ==="

# 1. 检查当前内存和swap状态
echo "当前内存状态："
free -h

# 2. 增加 2GB swap 分区（如果不存在）
if [ ! -f /swapfile ]; then
    echo "创建 2GB swap 分区..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # 添加到 fstab 以持久化
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    fi
    
    echo "Swap 创建完成："
    free -h
    swapon --show
else
    echo "Swap 文件已存在"
fi

# 3. 进入项目目录
cd /opt/blogs || { echo "错误：无法进入 /opt/blogs 目录"; exit 1; }

# 4. 更新 Dockerfile 以增加内存限制
echo "更新 blogs-cms/Dockerfile..."
cat > blogs-cms/Dockerfile << 'EOF'
# 使用 Node.js 20 Alpine 版本作为基础镜像
FROM node:20-alpine

# 安装 Python 和构建工具依赖
RUN apk add --no-cache python3 make g++ py3-pip

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖，构建需要）
RUN npm ci

# 修复 node_modules/.bin 目录的执行权限
RUN chmod +x node_modules/.bin/*

# 复制应用程序代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production

# 构建应用程序（使用更大的堆内存限制）
RUN node --max-old-space-size=2048 ./node_modules/@strapi/strapi/bin/strapi.js build

# 清理开发依赖以减小镜像大小
RUN npm prune --production

# 暴露端口
EXPOSE 1337

# 启动命令
CMD ["node", "./node_modules/@strapi/strapi/bin/strapi.js", "start"]
EOF

echo "Dockerfile 更新完成"

# 5. 清理旧的构建缓存
echo "清理 Docker 构建缓存..."
docker system prune -f

# 6. 构建 Strapi 镜像
echo "开始构建 Strapi 镜像..."
docker compose -f multi-sites.yml build strapi

if [ $? -eq 0 ]; then
    echo "✅ Strapi 镜像构建成功！"
    
    # 7. 启动服务
    echo "启动 Strapi 服务..."
    docker compose -f multi-sites.yml up -d strapi
    
    if [ $? -eq 0 ]; then
        echo "✅ Strapi 服务启动成功！"
        echo "检查服务状态："
        docker compose -f multi-sites.yml ps
        
        echo ""
        echo "=== 修复完成 ==="
        echo "Strapi 管理后台应该可以通过以下地址访问："
        echo "http://43.132.197.38:1337/admin"
        echo ""
        echo "如需查看日志："
        echo "docker compose -f multi-sites.yml logs strapi"
    else
        echo "❌ Strapi 服务启动失败，查看日志："
        docker compose -f multi-sites.yml logs strapi
    fi
else
    echo "❌ Strapi 镜像构建失败"
    echo "请检查构建日志中的错误信息"
fi

echo ""
echo "当前内存使用情况："
free -h