# 语言与双语维护 / Localization and bilingual maintenance

## 简体中文

从 v0.2.6 起，游戏提供简体中文、繁体中文、英语。首次启动从原生宿主的首选语言识别；浏览器预览读取 `navigator.languages[0]`。明确的 `Hans/Hant` 优先于地区，TW/HK/MO 使用繁体，CN/SG/未指定地区的 zh 使用简体，其他语言使用英语。不会因为首选法语、第二语言是中文，就跳过法语回退规则选择中文。

Android 通过 `Configuration.locales[0].toLanguageTag()`、iOS 通过 `Locale.preferredLanguages.first` 获取首选语言，随本地 URL 的 `system-language` 片段传给网页。没有新 JavaScript 桥接、网络请求或权限。选择存入既有 `demonstar-reborn-v1.language`；有效保存值优先，旧存档新增语言时保留分数、解锁、难度及声音偏好。无可用存储时本次会话仍可切换，浏览器不能保存的限制不会被伪装成已保存。

主菜单设置和暂停设置都可切换，立即更新可见文本、HUD、装备状态、Boss 名称、帮助、结算和无障碍标签，不重开游戏。暂停仍保持暂停；下次启动保留选择。桌面应用名称跟随系统资源语言，游戏内手动选择只影响游戏界面。英文无线电录音及原作标志保留原样，不合成配音。

繁体版是一套适合港澳台读者的通用繁体文案，并非三套地区方言。采用常见游戏术语，说明句独立改写，不用简转繁工具机械生成。没有声称经过当地母语玩家审校；后续可根据实际反馈调整用词。

| 简体中文 | 繁体中文 | English | 说明 |
|---|---|---|---|
| 设置 / 主菜单 | 設定 / 主選單 | Settings / Main menu | 采用常见界面用语 |
| 虚拟摇杆 / 开火 | 搖桿 / 射擊 | Stick / Fire | 操作按钮短而明确 |
| 导弹 / 等离子炮 | 飛彈 / 電漿砲 | Missiles / Plasma cannon | 繁体游戏常见术语，允许地区反馈微调 |
| 同色升档 | 同色升級 / 強化火力 | Match colors to power up | 说明实际效果，不照搬“档位” |
| 清屏弹 | 清場攻擊 | Screen attack | 对应满火力额外攻击，不暗示必杀全部敌人 |
| 结束本次飞行？ | 結束這次出擊？ | End this flight? | 按语境改写 |

长期维护：README.md 与 README.en.md 保持等价；新增或修改的核心注释、重要代码说明、提交信息、PR、Release 及重要 Git 信息使用简体中文和英文。历史标签与历史发布说明不覆写。词典中保持三语键名和 `{变量}` 完整一致，HTML 文案只接受仓库内固定词典。新增文案必须经过语言检测、持久化、旧存档、暂停切换、布局及实际原生宿主检查。

## English

Starting with v0.2.6, the game supports Simplified Chinese, Traditional Chinese and English. First launch uses the native host's preferred language; browser previews use `navigator.languages[0]`. An explicit `Hans/Hant` script overrides region. TW/HK/MO select Traditional Chinese, CN/SG or unspecified Chinese select Simplified Chinese, and all other languages select English. A lower-ranked Chinese preference does not override an unsupported first preference such as French.

Android reads `Configuration.locales[0].toLanguageTag()` and iOS reads `Locale.preferredLanguages.first`. A local `system-language` URL fragment passes the preference to the web game without a new JavaScript bridge, network request or permission. The choice is stored as `demonstar-reborn-v1.language`; valid saved choices win. Migrating an older save preserves scores, unlocks, difficulty and audio preferences. Switching still works for the current session if browser storage is unavailable; durable saving is not guaranteed in that case.

Language controls are available from both main-menu and pause settings. Changes immediately update visible copy, HUD, equipment, boss names, help, results and accessibility labels without restarting combat. Paused gameplay remains paused, and the choice persists on the next launch. The launcher name follows system resources; the in-game override affects the game UI. Original English radio recordings and the DemonStar logo remain unchanged; no synthesized dubbing is introduced.

Traditional Chinese is a shared, naturally written catalog for readers in Hong Kong, Macao and Taiwan, not three dialect editions. It uses familiar game terminology and independently rewritten instructions instead of character conversion. Native-speaker review is not claimed. Terms such as 設定, 主選單, 搖桿, 飛彈 and 電漿砲 may be refined with regional player feedback; the glossary above identifies deliberate choices.

Long-term maintenance: keep README.md and README.en.md equivalent. New or changed core comments, significant code explanations, commit messages, PRs, releases and important Git information must be in Simplified Chinese and English. Do not overwrite historical release notes or tags. Catalog keys and `{placeholders}` must match across all three languages; HTML copy must come only from bundled constants. Validate language detection, persistence, migration, switching while paused, layout and native-host behavior whenever copy or locale handling changes.

## 参考与验收 / References and verification

- [Android Configuration.getLocales](https://developer.android.com/reference/android/content/res/Configuration#getLocales()) · [Locale.toLanguageTag](https://developer.android.com/reference/java/util/Locale#toLanguageTag())
- [Apple Locale.preferredLanguages](https://developer.apple.com/documentation/foundation/locale/preferredlanguages) · [Localized bundle display names](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html)
- `tests/i18n.test.mjs`：字形/地区、保存优先级、原生片段、词典/占位符检查。Script/region routing, saved precedence, native hint and catalog/placeholder validation.
- `tests/localization-browser.mjs`：七种首选语言、三语菜单/HUD/设置/结算、旧存档与五种布局。Seven preferred languages, trilingual UI, legacy saves and five layouts.
- 最低部署系统与真机未实测；具体环境在 Release 的 verification.json 中。Minimum deployment versions and physical devices are not verified; exact tested environments are listed in release verification.json.
