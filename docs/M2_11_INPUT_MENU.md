# M2.11 · iOS 长按与主菜单 / iOS long presses and main menu

用户报告 iOS 长按 A/B 或摇杆会选中文字，导致游戏无法正常操作。代码仅在 `.screen` 设置未加前缀的 `user-select:none`，操作区设置 `touch-action:none` 并取消 pointerdown 默认事件。WebKit 的文字选择/长按菜单与滚动、pointer 默认行为不同；现有自动化只验证短时触点与脚本事件，没有系统长按验收。

The user reports text selection when holding A/B or the stick on iOS, blocking gameplay. The code only set unprefixed `user-select:none` on `.screen`, with `touch-action:none` and cancelled pointer defaults. WebKit selection/callouts are separate from scrolling and pointer defaults. Prior automation covered short contacts/script events, not system long presses.

修复：为游戏及子元素显式设置 `-webkit-user-select:none`、`user-select:none` 与 `-webkit-touch-callout:none`。操作区对真实 touchstart/move/end 使用非被动的 preventDefault，同时拦截 selection/contextmenu/dragstart；事件继续传播到旧 iOS 的触控转换层。保护不应用到表单触控，地址/房间码文本框保留选择、编辑菜单和粘贴。

Fix: explicitly apply prefixed/unprefixed selection suppression and callout suppression to gameplay descendants. Controls cancel native touchstart/move/end defaults through non-passive listeners, plus selection/contextmenu/dragstart. Events still reach the legacy iOS touch adapter. Text fields retain selection, editing menus and paste, outside the control-only touch guard.

设置由右上角小按钮移到主菜单第三项；第一项“单人游戏”固定启动一人，第二项“多人游戏”提供“同屏双人”和“局域网双人”。取消设置中的联机入口和人数切换，保留分玩家操作映射。联机暂停中仍可查看当前房间。空白处不再直接开局，Enter 激活当前聚焦按钮；多人子页返回上一级。三语文案同步，3P/4P 仍仅协议预留。

Settings moves from the small top-right control to the third main entry. First is Single player, explicitly one player; second is Multiplayer with same-device two-player and LAN choices. Settings no longer initiates LAN or changes player counts, but retains individual bindings. Network pause can still show the active room. Empty-area taps no longer launch; Enter activates the focused option and multiplayer children return to their parent. All three locales are updated; P3/P4 remain protocol reserves.

验证：新增三语、五种尺寸的菜单可达性与路由检查；六触点长按 1.5 秒、单人覆盖旧双人偏好、文本框例外，以及既有双人/存档/键鼠手柄/局域网/旧触控回退回归。新增 XCTest 系统 `press(forDuration: 1.6)`，在既有 iPhone/iPad 模拟器检查单/双人 A、B、摇杆及实际动作。原生结果在正式发布前补齐；不把模拟器当作用户真机复测。

Verification adds three-locale/five-size menu reachability and routing, six-contact 1.5-second holds, solo overriding prior two-player preferences, editable fields and existing multiplayer/save/input/LAN/legacy-touch regressions. New XCTest system `press(forDuration: 1.6)` checks solo/two-player A, B and sticks with actual gameplay responses on existing iPhone/iPad simulators. Native results must be recorded before release; simulators do not replace the user's physical-device retest.

依据 / References: [Apple Safari CSS reference](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariCSSRef/Articles/StandardCSSProperties.html), [WebKit: touch-action does not disable selection](https://bugs.webkit.org/show_bug.cgi?id=194812), [WebKit long-press callout behavior](https://bugs.webkit.org/show_bug.cgi?id=231161).
