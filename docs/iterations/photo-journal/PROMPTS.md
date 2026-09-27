# 照片手帐 · 生图记录

工具：内置 Image Gen。三张独立生成的概念图，非运行中的原型截图。

参考：项目 docs/images/home.jpg 与 docs/images/mobile-home.jpg。原始本地图片读取器出现环境错误后，使用同一截图的内存预览作为对话中的真实图片参考传入，未使用纯文本替代视觉来源。

- 图 1：传入最近 2 张参考图（现有首页、现有手机首页）。
- 图 2：传入最近 2 张参考图（现有手机首页、刚生成的图 1）。
- 图 3：传入最近 3 张参考图（现有手机首页、图 1、图 2）。
- 日期锚点：2026-09-27，周日。
- 下面保留最终生成请求的提示词。尺寸为提示词中的目标视口，输出图片按实际生成尺寸保存。

## 图 1：最终提示词

```text
Use case: ui-mockup. Create a realistic, production-quality simplified-Chinese UI design for 心晴, an existing private mood diary and self-care app, extending the TWO attached real product preview images with PHOTO JOURNALING. The attached desktop and mobile screenshots are existing-product visual references, not edit targets. This concept is called “随手留住这一刻”: photo attachments gracefully integrated in the existing desktop mood entry. ONE independent design image, ONE full desktop app screen, not a collage or presentation slide. Target dimensions 1440 x 1024, natural desktop aspect ratio. Current date anchor 2026-09-27 Sunday; dates use 2026年9月27日 周日.

Preserve the existing brand orange sun / 心晴 logotype, softly textured warm ivory washi paper background #faf6ee, muted terracotta primary buttons #b9654b, ink brown #352a24, muted text #8c8175, fine rules #ded5c8, pale sage #758067, watercolour mood faces, subtle pressed daisy botanical decoration, elegant Noto Serif SC headings and restrained readable sans body. Keep texture very light behind text. Do not reproduce demo banners or source sample records. Lifestyle and travel photographs should be natural editorial PHOTOS, not watercolour illustrations. They are hypothetical sample content.

Layout: full-width quiet header76px with sun and 心晴 left, small phrase “让情绪，也有安放的地方。”; center navigation 今日心情 active terracotta underline, 情绪回顾, 自我关怀. Left180px paper date rail September27 Sunday, large terracotta27, a small daisy bunch below. Main working column starts x230 widthabout820; right x1110 width260 has familiar subtle yellow breathing care note with daisies, “让心情缓一缓” and “开始呼吸练习”, two quiet paper edges to its right. It stays much quieter than the photo journal.

Main header “把今天，也留在照片里。” subtitle “一张照片、一句话，都是值得留下的日子。” Compact row of 5 existing soft watercolour mood faces with exact labels 很低落 / 不太好 / 一般 / 还不错 / 很开心; fourth selected with terracotta ring; label “此刻心情 · 可选”. Keep original compact tag chips 学业 工作 人际 家庭 睡眠 身体 其他.
Photo section heading “这一刻的照片” and muted “3 / 9”, secondary “整理照片”. Three landscape thumbnails with warm off-white instant-photo borders, straight and orderly: quiet sea and coastal path, sunlit cafe with coffee, green hillside village. Each has a discreet removal x. Fourth small dashed-outline plus slot “添加照片”. No giant upload box. Photos are visual focus, about180px tall. Tiny hint “拖动调整顺序，首张作为封面”.
Below a lined-paper text area with “海边的风很轻，今天想把脚步放慢一点。” and generous space, bottom-right secondary “展开写日记 ↗”. Editable date row “2026年9月27日” with pencil icon; small “仅自己可见”. Primary terracotta pill “存下这一刻 →”, next to muted “草稿已保存”. Realistic 14–16px body type, generous spacing, only one primary action. One subtle small top or bottom label “功能概念稿” so this cannot be confused with the current live product. No social likes, invented data, cloud sync claims, dashboard cards, excessive shadows, gradients, device frame or watermark. Complete viewport, no cut-off controls. Faithful evolution of the attached product.
```

## 图 2：最终提示词

```text
Use case: ui-mockup. Create ONE beautiful and realistic simplified-Chinese MOBILE app UI screen for 心晴 photo journaling. Concept name “写成一页旅行手帐”. This is an independent design direction centered on a focused full-page journal editor for a person who took travel photos and wants to write a longer entry, rather than a dense homepage form. Target UI dimensions 390 x 844, render at high resolution at exactly that proportion; ONE app content screen ONLY, no multiple screens, phone frame, bezel, OS statusbar, clock, battery, home indicator, device shadow or mockup background. Current date anchor is 2026-09-27 Sunday. Use 2026年9月27日 周日.

The two attached screenshots are VISUAL STYLE REFERENCES for the existing 心晴 brand and its extended paper-style desktop UI. Retain very pale cream textured paper #faf6ee, legible dark brown #352a24, muted terracotta #b9654b, olive-sage accents, Noto Serif SC editorial headings and matching simple sans14-16px controls, understated instant-photo white border, original watercolor mood-face style. This is a calm intimate journal, not social media or a heavy card dashboard. Photographs are realistic hypothetical sample vacation photos, never watercolor images or personal user data.

Layout in 390x844 logical pixels: top app toolbar height56px with left chevron + “返回”, centered small 心晴 brand word, right quiet “草稿已保存” with check; a thin hairline below. 22px side margins. Compact small date editable row “2026年9月27日 · 周日” and pencil, subtle “仅自己可见” lock. Next large serif editable TITLE “在海边，把日子放慢” occupying one or two graceful lines. Photo group beneath: one wide cinematic natural photo of a quiet blue sea, rocky coast, warm late-summer sunlight and wooden seaside path, height175px. Its fine white paper border has a tiny corner “封面”. Under it three tidy small squares in a row: 2 attached images (sunlit cafe coffee, green hillside) and one plus “添加” tile, with a discreet “3 / 9” label. Photos are orderly, not an overlapping collage.
Below photos, a single photo-management text link “整理照片” aligned right. Then journal body text directly on paper, no enclosing input rectangle, comfortably readable lineheight28px:
“原本只是想出来走一走，
却在海边坐了很久。
风吹过来的时候，心里的声音
也跟着慢了下来。

拍下这几张照片，
想留住今天这份安静。”
Show a subtle caret at end to make editable state obvious, just two very faint horizontal rules, no handwriting font for dense text. Small meaningful helper beneath “一句话也好，一整篇也好。” and subtle “96 / 5000” on right; exact count can be omitted instead of wrong.
Low on page, an optional mood row with a SMALL soft terracotta watercolour face, “此刻心情”, “还不错” and a chevron; not a five-face chooser by default. Very bottom pinned unobtrusive paper action area, single large terracotta pill button “保存这篇日记 →”, with tiny discreet text “功能概念稿” beneath or near margin. Do not show mobile tabs in focused composing screen, no keyboard, no delete toolbar, no AI rewrite button, no sharing, cloud sync or location permissions.
Priority: photo cover and personal words together, clear typing affordance, restful room to write, one primary save action, text fully legible, entire button in viewport. If vertical content is tight remove helper copy rather than shrinking text or clipping. No made-up extra controls. Match brand warmth while organizing specifically for single-handed Android use.
```

## 图 3：最终提示词

```text
Use case: ui-mockup. Create ONE realistic, polished simplified-Chinese MOBILE interface concept for 心晴 mood/photo diary. Concept name “把日子慢慢翻回来”, a PHOTO-LED JOURNAL TIMELINE as a different information hierarchy / product entry point from the previous composer concepts. Target logical dimensions390 x844, render high resolution maintaining390:844. ONE complete mobile app screen only, NO device body, bezel, statusbar, OS clock/battery, home indicator, rounded device mask, outer canvas or multi-screen collage.

The attached existing mobile screenshot and previous cream paper desktop/mobile concepts are STYLE GROUNDING ONLY. Preserve 心晴 with warm sun logo, #faf6ee barely textured paper surface, #352a24 text, terracotta #b9654b active accents and primary action, sage #758067 subtle mood, Noto Serif SC headings, legible matching sans14–16px. Real photo content looks like editorial travel and daily lifestyle photography, not watercolor. Use watercolour only for the tiny mood symbol. Subtle white photo borders, generous negative space, no card nesting, gradients or dashboard metrics, minimal hairline separators. Soft paper warmth but contrast enough for accessible reading.
Current date anchor2026-09-27 Sunday. Present recent entries dated09月27日 周日 and09月26日 周六 in descending order. All records and photos are fictional design examples, not actual user records. Small discreet footer label“功能概念稿”.

Screen: existing brand header height56 with sun+心晴 at left and small unobtrusive lock icon “私密手帐” at right. Existing 3-item primary navigation next row: 今日心情 / 情绪回顾 / 自我关怀. 情绪回顾 active terracotta underline. Next small secondary view switch integrated directly on paper: “情绪趋势” and “我的手帐”, with 我的手帐 active. Heading row beneath with elegant serif “那些留住的日子。” at left and modest terracotta pill “＋ 记一笔” at right; this is the ONLY primary action. Very quiet photo filter text “全部记录” selected with underline, “有照片” next to it, nothing else.

Main content a chronological paper journal list with simple date separators. First entry09月27日 周日, on right a SMALL watercolour peach mood face with “还不错”. Beneath date, a strong wide landscape cover photograph of a tranquil blue sea, rocky coastline and wood-railed coastal walking path in late-summer sunlight. Clean fine white border. Bottom-right tiny clear photo-count overlay “3张”. Beneath photo serif title“在海边，把日子放慢”, then two compact muted lines of actual excerpt “海边的风很轻，今天想把脚步放慢一点。想留住这份安静。” and small right chevron suggesting tap to open entire entry. Do not add share/heart/comment/favorite.
After generous paper gap and fine divider, second entry09月26日 周六. This entry has NO mood rating; do not invent one. Two small real photos side by side, one sunlit cafe coffee and daisies by window, one warm evening street facade. Under them shorter text “拐进一家小店，遇见了喜欢的光。” Keep timeline readable and complete without clipped footer or button. If needed shorten first excerpt and reduce inter-row gaps to fit, do not shrink all typography. Omit botanical decoration if it competes with real photographs.
One screen tells the story: multiple-day photos AND journal words kept together privately, each entry opens full detail, add new record with one clear action. No filters that pretend cloud accounts, sharing, location tracking, AI analysis or search. Preserve existing app identity and nav, focus only on reviewing photo journals.
```