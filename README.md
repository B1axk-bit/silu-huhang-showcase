# 丝路护航公开展示站

“丝路护航”是面向证券营业部员工的合规沟通智能助手。本仓库仅承载公开、脱敏、概念化的静态展示站，用于介绍产品定位、治理思路和阶段性建设成果。

## 产品闭环

新员工先启航，平时学案例，办事先自查，遇事问小航。

## 展示边界

- 不连接真实业务系统；
- 不接收或保存客户、员工及业务信息；
- 不调用任何远程模型或业务接口；
- 不构成投资建议、业务审批、合规批准或正式处理结论；
- 不代表任何机构的正式业务系统或制度要求。

## 技术实现

站点采用原生 HTML、CSS 和 JavaScript，无服务端依赖、无远程字体、无第三方运行时资源、无分析脚本。站点由 GitHub Actions 发布到 GitHub Pages。

## 本地查看

```bash
python3 -m http.server 4173 --directory site
```

然后在浏览器中访问本地 4173 端口。

## 公开内容验证

```bash
python3 scripts/validate-public-content.py
python3 scripts/validate-links.py
```

二维码资产在正式 Pages 地址可访问后生成并执行解码验证。

在 macOS 上复现二维码物料：

```bash
python3 -m pip install segno Pillow opencv-python-headless
python3 scripts/generate-qr.py
```

二维码测试页位于 `site/qr-test/`，包含白底、深色底、打印尺寸和手机屏幕模拟。

## 许可

代码以 MIT License 发布。监管机关公开页面及其内容的权利归原发布方所有，本展示站仅提供短摘要和来源链接。
