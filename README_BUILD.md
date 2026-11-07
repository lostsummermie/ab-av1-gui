# 用 GitHub Actions 打包 ab-av1-gui

1. 把整个 `ab-av1-gui/` 文件夹上传到一个新的 GitHub 仓库
2. 进入仓库的 `Actions` 页面，等第一次构建完成（大概 10-20 分钟）
3. 构建成功后，会创建一个 Draft Release，里面有 Windows 的 `.msi` 或 `.exe` 下载链接
4. 也可以在 `Actions -> Build Tauri App -> Artifacts` 里下载构建产物

注意：
- 仓库可以是公开或私有的都行（GitHub Actions 都能用）
- Windows 版只需要下载 `ab-av1-gui_*.exe`（或者安装包）即可使用
- 运行时仍需要 `ab-av1`、`ffmpeg` 等依赖在你的电脑上，界面只是调用它们
