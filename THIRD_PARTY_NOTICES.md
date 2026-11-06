# 第三方软件与数据说明

更新日期：2026-10-26。

2026-10-30外观重构补充：标题采用本地托管的 **Noto Serif SC** 显示字集，版权及SIL Open Font License 1.1原文见 `frontend/assets/fonts/OFL.txt`。字体从Google Fonts官方接口按本项目题名字集取得，源地址、字集与SHA-256见 `frontend/assets/fonts/SOURCE.json`；字集外字符采用系统字体回退。该字体不适用项目MIT代码许可。图志全图视图在缩放级别15以下使用普通在线OpenStreetMap瓦片补充当代背景，保留OSM来源署名；只按浏览器当前视野请求，不进行批量预取或离线打包。详细现势矢量、资料图和历史事件继续分别表达。

## 项目代码

根目录 `LICENSE` 用于本项目原创程序、SQL 和样式等代码。外部软件、数据、PDF、地图、图片及其原始文字不因此改为 MIT。课程说明文档引用的外部内容保留来源；正式公开交付时按来源逐项组织发布内容。

## 软件与依赖

本阶段复用本机 PostgreSQL/PostGIS、Java 与 GeoServer 安装作为运行环境。`.runtime/` 的服务引擎副本和 `.vendor/` 的 Python 安装不放入源码包。源码提供固定依赖清单，重建时从对应上游取得软件并保留其许可文件。

- PostgreSQL 17 的许可原件位于本机 `C:/Program Files/PostgreSQL/17/server_license.txt`，为 PostgreSQL License。
- GeoServer 引擎保留自身 `LICENSE.html`，说明采用 GNU GPL v2 或后续版本；不能把引擎副本重标为项目 MIT。
- PostGIS、Java 及 GeoServer 内含组件分别保留各自安装中的版权和许可说明。当前没有制作或发布含这些运行时的二进制分发包。
- Python 依赖的版本及上游发行包分别由 `requirements-data.txt`、`requirements-spatial.txt`、`requirements-services.txt` 确定。发行包内的 `*.dist-info/METADATA` 与许可文件是相应许可来源；未来含依赖的分发包须同时保留这些文件。

当前可运行的核心工具采用开源路线，不要求 ArcGIS 商业授权或付费地图密钥。清口样页采用 OpenLayers 10.11.0（BSD-2-Clause），固定资源、获取 URL 与 SHA-256 在 `frontend/vendor/manifest.json`，原许可证在 `frontend/vendor/OPENLAYERS-LICENSE.md`。

## 数据与制图

| 数据 | 当前使用条件与呈现方式 |
| --- | --- |
| OpenStreetMap 原始及派生水道、地点 | 保留 `© OpenStreetMap contributors` 与 ODbL-1.0；页面及导出保留署名，按 OSM 数据条件处理。来源见 `https://www.openstreetmap.org/copyright` |
| GeoNames 城市参考 | 按来源记录保留 CC BY 4.0 署名，不能包装成精确历史遗址坐标 |
| Natural Earth 陆地轮廓 | 来源标明公共领域，保留名称与获取记录 |
| UNESCO、ICOMOS 与官方工程资料 | 逐项查看 `data/metadata/source-catalog.json` 的权利、用途及发布条件，不将公开可访问解释为整件可再许可 |
| 清口扫描图及数字化参考 | 原图使用条件和基准仍需独立核实，保留待审标记；不自动进入网站公开静态资源包 |

WMS 核查图是本地验证证据，其中含清口参考的合成图不等于已批准的公开发布素材。最终网站公开范围将在交付阶段按来源核查；现阶段已具备数据、源码、SQL、样式和可复现的服务配置。

清口样页使用的完整栅格同样仅在本机参考展示，不自动进入公开发布包。新增遗产要素目录记录名称事实及出处；新归档 S024—S029 的网页原件仍不由前端目录静态托管。697 点科研数据集只作为查找线索，未下载实体数据或将其全库公开提供。

本轮从S010原图派生的XYZ瓦片和逐页WebP预览位于本机运行时目录，保留同样的资料条件。S030—S033是文化叙事研究的独立网页归档，不默认取得其照片、馆藏图或原文的再许可；事实摘要保留来源和表述差异。

五处核查点位另附 S034—S038 的简短事实整理及原始链接，原件保存于数据归档目录，不复制其照片。S007/S010 的五张图面节选保存于 `.runtime/point-previews/`，由固定点位接口在本机提供，使用条件与原图一致；不作为原创 MIT 图片放入前端源码发布目录。来源与图面裁取记录见 `data/processed/point-material-previews.json`。

S039—S045 为商业街区、人群生活与文化消费资料，独立台账见 `data/metadata/commerce-source-catalog.json`。现已纳入站内来源目录；淮安章节使用简短事实摘要、原文定位和发布机构链接，不公开原文照片或全文。S041 的名称、类型、位置文字、年代与面积整理为事实样本，保留来源与空值，不将保护名录解释为历史人口或商业普查，也不把外部整件资料改为 MIT。

S046 是 OSM/Nominatim 的河下古镇区域检索快照，保留 OSM 对象身份和获取时间，按 ODbL-1.0 署名，来源条件见 [OpenStreetMap copyright](https://www.openstreetmap.org/copyright)。该代表点不表示历史建筑或保护边界。故事地图复用 S010 本机瓦片；核查拼图位于 `.runtime/story-map-review/`，不进入前端公开素材目录。

2026-10-26 图文整改补充：上文“不复制照片”的说明记录此前阶段。本轮从 S040、S059—S063 的已核对页面引用资料照片，仅在 `.runtime/story-media-research/` 保存，并通过固定 ID 接口用于本地课程预览。每图保留原 URL、图注、原权利人说明与 SHA256；不纳入 MIT 图像资产，不表示获得开放再许可。13 条建筑中两条只有明确标注的街巷环境参考，不能当作对应单体外观。

S047、S049 为有界 OSM API 原始快照，衍生 GeoJSON 与页面均保留 `© OpenStreetMap contributors · ODbL-1.0`。S064—S079 为官方虚拟游览页面和场景 XML，仅摘录场景名称、拍摄时间与经纬度事实并链接原全景，不复制全景影像；XML 未声明坐标系，不将它们视为测绘坐标。S056 只引用公开地点坐标事实，不使用高德底图素材。

坐标近似转换采用 [eviltransform](https://github.com/googollee/eviltransform) 的 Python 实现，许可证为 **BSD-2-Clause**，版权属 Googol Lee 与原贡献者。未经修改的源码归档为 `data/raw/S057.py`，其完整许可原文保留为 `data/raw/S058.txt`；构建按归档 SHA256 验证后加载。该文件不适用本项目原创代码的 MIT 声明。现有源码归档哈希固定，运行时不下载未审阅的新算法版本。

2026-10-26 诗文图志扩充：S080、S081、S082、S084、S085已加入独立来源台账及站内资料页。古代诗文采用短句摘引，公开录文与现代转引分别记录；维基文库的现代整理信息保留其原有使用条件。S081润州会馆照片保留“罗志摄”署名；S062相关图像、S085报纸摘图和官方全景的三幅面图均保留原始来源。上文“仅链接全景、不复制全景影像”是此前阶段的说明，本轮在本机运行时目录新增三幅原始面图用于课程预览。它们均不因项目原创代码采用MIT而获得开放再许可，不自动进入公开素材包；PDF摘图记录页码和裁切框，不移除原有题注。媒体处理清单与限制见19号实施记录。

2026-10-26 S086—S103 地点扩充：有效来源为S086—S093、S095—S098、S100、S102、S103；S094、S099、S101未进入有效目录。S086的OSM派生几何与水门桥位置图保留ODbL-1.0署名。新增25幅来源页面资料图和2幅官方完整全景面图存于本机运行时目录，逐项保留原始URL、题注、时间说明与SHA256；照片及全景图不自动适用MIT，不移除水印。文通塔坐标仅作为有出处的百科事实参考，基准仍待核；其历史介绍和照片另据S089。详见20号实施记录与媒体清单。


2026-10-30四图首页：清江浦日景采用凤凰网江苏／淮安发布报道配图，夜景采用我苏网／淮安新闻网报道配图，均未取得新的开放再许可，仅作本机课程预览，保留来源，不自动纳入公开素材包。徐扬等《乾隆南巡图》卷四黄淮交流与卷六大运河至苏州局部来自The Metropolitan Museum of Art（藏品49251、41493），馆方标注Public Domain。原件与等比网页压缩版本保存在.runtime，出处、尺寸、SHA-256及替换原因见config/home-images.json和data/metadata/home-media.json。图像不适用原创代码MIT声明；苏州题材在网页明确标注。


2026-10-31跨城新增150处地点：原始OSM快照与回执保存在data/raw/canal-corridor，来源台账见data/metadata/canal-corridor-sources.json；新增坐标、局部背景及派生数据遵守ODbL-1.0，保留© OpenStreetMap contributors。小比例尺陆地轮廓复用S020 Natural Earth公共领域原件，不含行政界线。90处百科段落采用维基百科贡献者的短段原文，保留条目链接与CC BY-SA 4.0说明；Wikipedia和Wikidata原始响应及请求地址归档在data/raw/corridor-wikimedia。69处场所资料图来自Wikimedia Commons，并保留逐图作者、来源页、许可和原文件地址；网页版本作等比缩放与JPEG转码，具体清单在config/canal-corridor-notes.json及已发布GeoJSON的photo字段。照片、展品图、碑牌和历史版画按图注区分；它们的授权与原创代码MIT分别适用。新数据的开放许可不改变原有淮安资料图与首页图片的使用条件。完整流程见docs/30_跨城新增150处文化地点实施记录.md。
2026-10-31首页首图更新：使用Chensiyuan《1 shantang street canal 2023.jpg》，2023年12月26日摄，原片9504×6336，来源 https://commons.wikimedia.org/wiki/File:1_shantang_street_canal_2023.jpg 。按CC BY-SA 4.0使用（https://creativecommons.org/licenses/by-sa/4.0/），四个WebP版本仅等比缩放和转码，页面按视口裁切；图像衍生版本沿用CC BY-SA 4.0，不适用原创代码MIT。首页及页尾提供署名、原片和许可链接，明确地点为苏州山塘河。此前清江浦1080像素首图退出首页，原件留作过程记录；其他三幅图片的条件保持各自原有说明。

2026-10-31用户选定三幅运河全景后：首页首图改为苏州日报／苏州市人民政府“京杭大运河苏州宝带桥段迷人晚霞”配图（1800×1013，2026-04-24摄）；新增杭州拱宸桥、桥西历史街区照片（1999×1333，落榜进士／新浪，2022-10-11刊发）和高邮城区段镇国寺、货船队照片（2112×1600，张德春摄／红网，2024-06-21刊发）。三图逐一保留来源页、署名与哈希，只等比缩小和WebP转码，不生成像素细节、不移除标记。未取得开放再许可，沿用本机课程预览范围，不自动进入公开素材包，也不适用原创代码MIT。具体原始URL及权利记录见config/home-images.json、data/metadata/home-media.json和第33号实施记录。此前山塘河照片退出当前首页，其原片与许可记录作为过程档案保留。
