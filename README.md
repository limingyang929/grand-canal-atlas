# 一河千年 · 大运河时空演变与文化遗产

网络地理信息系统课程项目。涵盖18座城市184处文化地点；淮安14处地点的44个发展节点、六时代查阅、八幕诗文导览、图文档案与来源阅读。

网站发布地址：https://limingyang929.github.io/grand-canal-atlas/

## 发布结构

- `.site-package`：完整课程展示资源的分卷ZIP及SHA-256清单，含页面、程序、数据、图像、资料图瓦片与许可说明。
- `scripts/prepare_github_pages.py`：按顺序校验并重组ZIP，提取至`_site`。
- `.github/workflows/pages.yml`：GitHub Actions构建与Pages部署流程。
- `source`：主要浏览器端程序与数据构建程序，便于直接审阅。运行版本及登记图像见分卷资源。

资源采用分卷上传以适应当前连接的文件传输方式；它们属于同一个完整版本，不需要在浏览器逐卷加载。部署后网站直接提供普通HTML、JavaScript、JSON、图片和瓦片。

## 本地复现

安装Python后，在仓库根目录运行`python scripts/prepare_github_pages.py`，然后打开`_site/打开网站.html`。支持file方式浏览，也可使用静态HTTP服务；核心数据和登记图片无需外站，外部原文与部分大范围底图仍需联网。

原创代码与第三方数据、图像分别遵循其许可。详细出处在网站资料页及`THIRD_PARTY_NOTICES.md`中。动画连线表示资料联系与阅读顺序，不是实测文化传播路径；184处空间目录不等于184条完整历史时间线。
