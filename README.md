# Work Assistant Electron

一款仅面向 Windows 的个人工作助手桌面应用，使用 Electron 构建。

## ✨ 功能
- ⏰ 久坐和喝水定时提醒，使用 Windows 系统通知
- ⏳ 午休、下班实时倒计时
- 💰 按工作日和工作时段计算实时薪资收益
- 🧮 月薪、缺勤、公积金、社保、个税和到手工资估算
- 📦 关闭或最小化窗口后驻留系统托盘
- 💾 使用 localStorage 保存所有配置
- 📅 中国法定节假日、调休补班和自定义单位日历
- 🚀 可选的 Windows 开机自动启动
- 🛎️ 托盘快速暂停提醒和查看今日收益
- 💳 发薪日倒计时、今日与本月工作统计
- 🎨 简洁暗色界面

## 环境要求

- Windows 10/11
- Node.js 20 或更高版本
- npm 10 或更高版本

## 本地运行

```powershell
npm install
npm run dev
```

## 打包 Windows 安装程序

```powershell
npm run build:win
```

生成结果位于 `dist` 目录。

如果 Electron 依赖下载不稳定，可以临时使用镜像：

```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install
npm run build:win
```

## 薪资计算说明

个税采用月度换算税率表和每月 5000 元基本减除费用估算，未计入专项附加扣除及累计预扣差异，计算结果仅供参考。
