# 使用 Node.js 20 Alpine 版本作为基础镜像
FROM node:20-alpine

# 安装 Python 和构建工具依赖
RUN apk add --no-cache python3 make g++ py3-pip

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 设置 npm 镜像与重试策略以提升网络稳定性
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000

# 安装所有依赖（包括开发依赖，构建需要）
RUN npm ci

# 修复 node_modules/.bin 目录的执行权限
RUN chmod +x node_modules/.bin/*

# 复制应用程序代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1536

# 构建应用程序（直接通过 node 调用 Strapi CLI，绕过可执行权限问题）
RUN node ./node_modules/@strapi/strapi/bin/strapi.js build

# 清理开发依赖以减小镜像大小
RUN npm prune --production

# 暴露端口
EXPOSE 1337

# 启动命令（同样用 node 调用 CLI）
CMD ["node", "./node_modules/@strapi/strapi/bin/strapi.js", "start"]