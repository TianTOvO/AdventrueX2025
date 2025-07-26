@echo off
echo ========================================
echo    去中心化拨款平台 - 快速启动
echo ========================================
echo.

echo 正在安装依赖...
npm install

echo.
echo 正在编译智能合约...
npm run compile

echo.
echo 正在启动开发服务器...
echo 请在浏览器中访问: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev 