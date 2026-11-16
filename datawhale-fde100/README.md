# Datawhale FDE 案例 100（page 图集）

一份 244 页的 FDE 案例资料，按整页导出为 PNG，**不是**课程内容，是配套的案例参考库。

| 项 | 值 |
|---|---|
| 页数 | 244（编号 01–244，连续无缺号） |
| 单页尺寸 | 3355 × 4672 px（约 400 dpi 的 A4 竖版） |
| 总体积 | 421.5 MB |
| 格式 | PNG（无文字层，纯图像） |

## 阅读

按文件名数字顺序阅读即可：

```
Datawhale FDE案例100_01.png
Datawhale FDE案例100_02.png
...
Datawhale FDE案例100_244.png
```

本地批量查看：

```bash
open -a Preview *.png          # macOS，整个目录一次打开
```

因为没有文字层，GitHub 上**无法用搜索定位内容**。需要按主题查的话，得先做一次 OCR。

## 与主课程的关系

不属于腾讯云 ADP FDE 认证课，是独立的案例素材。放在同一仓库只是便于集中归档，
学习路线（[`../学习路线.md`](../学习路线.md)）**没有**把这部分排进去。

## 体积提示

这 244 张图占了仓库约 78% 的体积。如果只想要课程本体、不想要案例库：

```bash
git clone --filter=blob:none --sparse git@github.com:lentilxiang/fde-learning.git
cd fde-learning
git sparse-checkout set --no-cone '/*' '!/datawhale-fde100'
```
