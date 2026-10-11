# 可视化关卡编辑器规划 / Visual level editor plan

记录日期 / Recorded: 2026-10-11。代码核查基线 / Inspected code baseline: M2.16 / v0.2.16。

**状态：仅固化规划，尚未开发，也不代表本轮获准实施。** 用户要求让不懂编程的飞机射击游戏玩家也能制作关卡，并能直接加载内置 18 关、复制后修改，原关卡不可覆盖。下面分别记录已确认目标、建议方案、开发顺序和待确认决策，不新增版本或发布包。

**Status: planning record only; unimplemented and not authorization to begin implementation this turn.** The user wants players without programming knowledge to create levels by loading any of the eighteen built-in stages, copying and modifying them while keeping the originals unmodifiable. This document separates confirmed goals, proposed design, implementation sequence and pending decisions. It introduces no version or binary release.

## 1. 目标与范围 / Goals and scope

**用户明确要求 / Explicit user requirements:**

- 面向不怎么懂编程的飞机射击游戏爱好者，编辑过程无需编写代码或手改数据文件。
  Serve shooting-game enthusiasts with little programming knowledge, without code or manual data-file editing.
- 一开始就能加载全部 18 个内置关卡作为复制来源，再修改副本；原来的 18 关不可被编辑器更改或覆盖。
  All eighteen built-in stages are available from the outset as copy sources. Edit the copies; the editor must not modify or overwrite the original stages.
- 自定义关卡可基于原关卡继续修改、保存，也能作为其他自定义作品的复制来源。
  Custom levels can be modified and saved from original templates, then copied into further custom works.

**建议产品形态 / Proposed product shape:** 游戏内置可视化编辑器，主要流程为“选择原作模板 → 创建副本 → 拖动修改 → 一键试玩 → 保存、分享”。首版集中于单关制作，完整编辑的设备范围和自定义数值权限仍待确认，见第 10 节。

An integrated visual editor with the flow “choose an original template → create a copy → drag to edit → playtest → save/share.” Focus the first version on individual levels. Full-editing device coverage and custom numeric permissions remain pending in section 10.

规划沿用当前单人/双人玩法，3P/4P 仅保留协议/内核扩展，不以编辑器开放四人。保留经典 HUD、原作蓝色 P2、三语界面及现有操作规则。复制来源是项目当前复刻的 18 关；复制功能不意味着原作全部行为已经 1:1 验收。

Retain current solo/two-player play, with P3/P4 reserved only in protocol/core. Preserve the classic HUD, original blue P2, three-language UI and existing control rules. Templates are the project's current eighteen-stage recreation; copying them does not certify complete original-game fidelity.

## 2. 原作保护与作品管理 / Original protection and work management

建议提供两个清楚的入口 / Proposed library entries:

| 入口 / Entry | 内容与操作 / Content and actions |
|---|---|
| 原作模板 / Original templates | 全部 18 关，不要求通关解锁；可浏览、预览，只有“复制并编辑”，不能覆盖保存。 / All eighteen stages without progression locks; browse/preview and Copy and edit, with no overwrite save. |
| 我的关卡 / My levels | 新建空白关卡、编辑、复制、重命名、删除、导入和导出。 / Create a blank level, edit, duplicate, rename, delete, import and export. |

例如将第一关复制为“第一关·我的改版”。每个自定义作品具有独立身份和版本，不直接占用第 19、20 关等官方编号，避免与以后官方战役冲突。显示名称不作为唯一身份，同名作品不能误覆盖。

For example, copy stage one as “Stage One — My Remix.” Each custom work has an independent identity and revision rather than taking official stage numbers such as 19 or 20. Display names are not unique identities; matching names must not cause accidental overwrites.

隔离必须包括布局、敌机配置、路径与炮火参数；不能只复制地图数组，却仍修改所有关卡共用的敌机模板。修改副本只影响该作品。后续模板更新不应静默改写既有作品的保存配置；需要格式迁移时保留可恢复副本，并说明不兼容情况，不承诺未来引擎修复后所有历史行为绝对不变。

Isolation must cover layouts, enemy configuration, paths and gun parameters. Copying only the map while mutating globally shared enemy definitions is insufficient. Changes affect only that work. Template updates must not silently rewrite saved configurations; format migration keeps a recoverable copy and explains incompatibilities, without promising identical historical behavior across every future engine fix.

## 3. 编辑界面 / Editing interface

以下是桌面/平板布局建议，手机完整编辑另见待决策项 / Proposed desktop/tablet layout; full phone editing remains a pending decision:

| 区域 / Area | 功能 / Function |
|---|---|
| 左侧素材栏 / Left palette | 敌机、炮台、地物、补给、Boss 分类；缩略图和易懂名称，不以内部编号为主要标签。 / Fighters, turrets, scenery, supplies and bosses with thumbnails and readable names instead of internal IDs. |
| 中间关卡画布 / Central canvas | 纵向查看整关，拖放、框选、缩放、移动、复制；明确显示战场边界与当前预览区域。 / View the vertical level, drag/drop, box-select, zoom, move and duplicate; show battlefield bounds and the preview viewport. |
| 右侧属性栏 / Right inspector | 只显示当前对象可修改的属性，复杂项目放在高级选项。 / Show editable properties of the selection; place complex controls under Advanced. |
| 底部进程条 / Bottom progression strip | 出场顺序、波次间隔、Boss 和关卡终点，可定位到对应画布位置。 / Spawn order, wave spacing, bosses and level end, linked to canvas positions. |
| 顶部工具栏 / Top toolbar | 撤销、重做、保存、试玩、返回。 / Undo, redo, save, playtest and back. |

画布保留原作像素美术辨识度，工具优先清晰和可操作。滚动区域有明确滚动条，主要退出操作始终易找。界面与提示支持简体中文、繁体中文、英语，沿用即时语言切换且不丢编辑内容的规则。

Preserve the game's recognizable pixel art on the canvas and make tools clear and usable. Scrollable areas show visible scrollbars, and exit navigation remains easy to find. Support Simplified Chinese, Traditional Chinese and English, applying language changes without losing edits.

地图纵向进度是主要定位依据，可联动显示预计出现时间。Boss 战、停滚及其他条件可能改变实际耗时，相关秒数必须标作预估，不能误导为精确墙钟时间。

Use vertical map progression as the primary coordinate, optionally linked to estimated spawn times. Boss fights, scroll stops and other conditions can change duration; label affected times as estimates rather than exact wall-clock promises.

## 4. 基础编辑与高级选项 / Basic editing and advanced controls

| 玩家目标 / Player goal | 建议操作 / Proposed interaction |
|---|---|
| 增加敌机 / Add enemies | 从素材栏拖入，或复制已有对象。 / Drag from the palette or duplicate an existing object. |
| 调整出场 / Change spawning | 在画布/进程条前后移动，整组调整波次位置。 / Move along the canvas/progression strip or shift a whole wave. |
| 编队 / Formations | 框选分组，设置数量、间距和出场间隔。 / Group selections and set count, spacing and spawn intervals. |
| 飞行路线 / Flight paths | 拖动路径节点，用箭头显示方向，预览移动过程。 / Drag path nodes, show direction arrows and preview motion. |
| 炮火 / Firing | 选择已有炮火预设，提供独立小窗口预览。 / Select existing firing presets with a small preview. |
| 补给 / Supplies | 选取图标，区分直接放置和击毁后掉落。 / Choose icons and distinguish placed supplies from destruction drops. |
| 节奏 / Pacing | 插入空白段、复制一段波次、整段前移或后移。 / Insert quiet sections, copy wave sections and shift them earlier/later. |
| 关底 / Ending | 放置指定 Boss，或选择其他明确的关卡结束条件。 / Place a designated boss or choose another explicit end condition. |

默认继承模板的配置，只改玩家明确选择的内容。基础模式提供摆放、路径、波次和掉落；高级选项再提供更细的配置。速度、射击间隔及 HP 等数值权限以第 10 节决策为准；本记录不解除原作战役既有参数冻结。

Inherit template configuration by default and change only what the player selects. Basic mode covers placement, paths, waves and drops; Advanced exposes finer controls. Numeric permissions for speed, firing intervals and HP depend on section 10. This record does not lift existing original-campaign parameter freezes.

原作内部编号、位标志和炮口数组不作为新手输入方式。未理解或暂未支持编辑的原始字段，在复制、编辑其他字段、保存和导入导出时须保留；不得用通用配置替代未知行为，也不能显示为已可任意编辑。

Internal IDs, bit flags and gun arrays are not novice-facing input. Preserve unknown or not-yet-editable source fields through copying, unrelated edits, saving and import/export. Do not replace unknown behavior with generic settings or present it as freely editable.

## 5. 试玩与草稿恢复 / Playtesting and draft recovery

建议提供从头试玩、从选中波次试玩、暂停观察与慢速预览；结束后回到刚才的编辑位置。使用正式游戏引擎和素材加载逻辑，避免编辑器预览与真实游玩走两套行为。

Offer playtests from the beginning or selected wave, paused inspection and slow previews, returning to the previous editing position afterward. Use the actual game engine and asset loading rather than a separate behavior implementation for previews.

局部试玩可以选择测试装备和难度，但属于明确标识的调试状态，不写入正式成绩、解锁或普通自动存档。跳过前半关后的测试不等于真实连续游玩的状态；需明确如何初始化场上对象和装备。拖动进程条首先用于布局浏览，不承诺任意时刻的精确回放/倒带。

Local playtests may choose test equipment and difficulty, but are explicitly debug sessions that do not update official scores, unlocks or normal autosaves. Skipping earlier play is not equivalent to uninterrupted gameplay; define how live objects and equipment initialize. Scrubbing first navigates the layout, not arbitrary exact replay/rewind.

基础可靠性包括撤销/重做、草稿自动保存和异常退出恢复。试玩不能污染编辑数据；返回后未保存修改仍保留，正式导出前可单独验证。草稿与用于游玩的已保存版本应有清楚状态提示。

Reliability includes undo/redo, draft autosave and crash recovery. Playtests must not mutate authored data; unsaved edits survive returning, and export can run validation separately. Clearly distinguish drafts from saved playable revisions.

## 6. 检查与新手反馈 / Validation and novice feedback

草稿允许不完整；正式游玩/导出前，阻止会导致无法加载或明显无法结束的结构性错误，并用可定位到对象的提示说明原因。

Allow incomplete drafts. Before normal play/export, block structural errors that prevent loading or clearly prevent finishing, with messages that identify the relevant objects.

- 检查结束条件、必需 Boss/对象、路径数据、掉落与资源引用，以及敌机/炮弹/资源数量是否在运行限制内。
  Check ending conditions, required bosses/objects, path data, drop/resource references and runtime limits for enemies, bullets and assets.
- 对敌机密度高、长时间空白、路径完全在战场外等情况给出可忽略提醒；合理的屏外入场路线不能误判为错误。
  Give dismissible warnings for high density, long empty sections or paths entirely outside play; valid off-screen entry routes must not be treated as errors.
- 区分错误与难度建议，不因作品很难而禁止创作。静态检查不能证明一定可通关或一定好玩，最终仍需要试玩。
  Separate errors from difficulty advice; difficult works remain valid creations. Static checks do not prove beatability or fun, so playtesting remains necessary.

## 7. 游玩、存档与分享 / Play, saves and sharing

建议在现有单人/多人快速开局页面选择“原作战役 / 自定义关卡”，避免增加不必要的分层入口。自定义成绩和关卡档与原作分开，避免修改版影响原作解锁或最高分。

Select Original campaign / Custom levels within the existing quick solo/multiplayer setup, avoiding unnecessary navigation layers. Separate custom scores/checkpoints from original records so remixes cannot alter official unlocks or high scores.

作品导出为一个文件，包含布局、配置、名称、作者、作品身份/修订、文件格式与兼容版本，以及所需内置素材的引用。首版建议只使用游戏已有可发布素材，不要求玩家维护图片/音频目录，不打包本地原作受限资源，也不执行导入脚本。文件扩展名与具体格式在实现时确定。

Export one file containing layout, configuration, title, author, work identity/revision, format/compatibility version and built-in asset references. Initially use existing distributable game assets, without user-managed image/audio directories, restricted local-original resources or executable imported scripts. Choose the extension and exact format during implementation.

存档必须关联具体作品版本。作品被编辑、替换或缺失时，不能按同名文件静默加载另一张地图；采用保留版本或清楚提示缺少匹配版本的方案。格式校验失败和不支持版本要有可理解提示，不能直接覆盖现有作品。

Bind saves to a specific work revision. When a work changes, is replaced or disappears, never silently load another map by matching its name. Retain revisions or clearly report a missing matching revision. Explain invalid/unsupported formats without overwriting existing works.

首版先做单关文件分享。多关排序组成自定义战役、更复杂 Boss 行为与素材创作留作后续扩展；本方案不包含社区服务器或多人实时共同编辑。

Start with individual-level file sharing. Sequenced custom campaigns, complex boss authoring and asset creation are later extensions. This proposal does not include a community server or real-time collaborative editing.

## 8. 双人联机与现有实现缺口 / Two-player LAN and implementation gaps

建议自定义关卡支持单人、同机双人和局域网双人，分阶段验收。LAN 由房主选关，核对作品版本与内容校验值；客户端缺少作品时提示接收关卡，完成数据验证和素材准备后才可开局。只同步关卡名称不足以保证两端使用同一份作品。保留现有房主权限、准备/暂停和重连规则。

Propose solo, shared-device two-player and LAN two-player support with staged verification. The host selects a level; peers check revision and content hashes. Prompt clients to receive missing levels and complete validation/asset preparation before starting. Names alone do not establish identical content. Preserve host authority, ready/pause and reconnect rules.

当前实现中以下内容需适配，不能把编辑器当作只增加一个拖拽界面 / Current integration work extends beyond adding a drag-and-drop screen:

| 位置 / Location | 当前约束与计划 / Constraint and planned work |
|---|---|
| [关卡格式 / map format](FORMAT.md)、[数据 / campaign data](../web/js/campaign.js) | 已有 18 关、8,368 个事件和 387 个定义；按稳定定义 ID 引用，不能依赖原作中可能失效的编辑缓存索引。需保留原字段与顺序语义。 / Eighteen stages, 8,368 events and 387 definitions use stable definition IDs, not potentially stale original editor-cache indices. Preserve fields and ordering semantics. |
| [游戏内核 / game core](../web/js/original-rules.js) | 加载/换关与关卡档校验限 1–18，并使用共用定义；需独立关卡身份、内容解析与副本配置隔离，兼容旧档。 / Loading, advancement and checkpoint validation assume stages 1–18 and shared definitions. Introduce independent identities/content resolution and isolated copy configuration while preserving legacy saves. |
| [渲染 / renderer](../web/js/render-hd.js)、[音乐 / music](../web/js/music.js) | 素材集合与 BGM 按内置关卡映射；需按自定义内容解析依赖，保持显式原型映射、按需加载和完整解码检查。 / Assets and BGM map to built-in stages. Resolve custom dependencies while retaining explicit prototype mappings, demand loading and complete decoding checks. |
| [开局界面 / app](../web/js/app.js)、[存档 / save store](../web/js/save-store.js) | 原作解锁、成绩、开局和存档入口需要区分作品身份与修订，试玩不能覆盖正式档案。 / Unlocks, scores, setup and saves need work identities/revisions; playtests must not overwrite normal progress. |
| [快照 / snapshots](../web/js/network-state.js)、[会话 / sessions](../web/js/lan.js) | 网络校验依赖内置关卡范围与定义表；需作品协商、接收验证及配置解析，不能仅传新增关卡编号。 / Validation depends on built-in ranges/definitions. Add work negotiation, validated receipt and configuration resolution, not just another stage number. |

保留原作战役回归与移动端性能边界。不能为了自定义内容全量解码所有图片，或重新引入通用飞机/地物回退。参考 [还原边界](FIDELITY.md) / [fidelity limits](FIDELITY.en.md)。

Preserve original-campaign regressions and mobile performance limits. Custom content must not force decoding every image or reintroduce generic fighter/scenery fallbacks. Refer to the linked fidelity documents.

## 9. 建议开发顺序与验收 / Proposed sequence and acceptance

| 阶段 / Phase | 交付与验证 / Deliverable and checks |
|---|---|
| 1. 内容隔离 / Content isolation | 内置只读、自定义身份、18 关复制/保存/重载；确认原数据和其他作品不变。 / Read-only originals, custom identity and copy/save/reload for all eighteen templates; originals and other works remain unchanged. |
| 2. 基础编辑 / Basic editor | 素材栏、画布、属性、撤销重做、基础草稿恢复、一键试玩。 / Palette, canvas, inspector, undo/redo, basic draft recovery and playtest. |
| 3. 创作辅助 / Authoring aids | 波次/编队、路径与炮火预设、检查提示、完整恢复流程。 / Waves/formations, paths/firing presets, validation messages and complete recovery flow. |
| 4. 分享与双人 / Sharing and two-player | 导入导出、自定义存档、同机双人、LAN 内容同步与兼容验证。 / Import/export, custom checkpoints, local two-player, LAN content synchronization and compatibility checks. |
| 后续 / Later | 自定义战役、多阶段 Boss 编辑、素材创作。 / Custom campaigns, multi-phase boss editing and asset creation. |

关键验收标准 / Key acceptance criteria:

1. 对全部 18 个模板，复制后不作修改，在相同引擎版本、种子、难度及输入下保持与内置版本相同的运行结果。编辑/删除任一副本，不改变原关卡和其他作品。
   For all eighteen templates, unchanged copies match built-in behavior with the same engine version, seed, difficulty and inputs. Editing/deleting a copy leaves originals and other works unchanged.
2. 保存/重载、导出/导入保留布局、路径、炮火和未开放字段；错误文件不能覆盖有效作品，撤销与异常恢复能找回编辑内容。
   Save/reload and export/import retain layouts, paths, firing and hidden fields. Invalid files cannot overwrite valid works; undo and crash recovery restore edits.
3. 试玩使用正式行为且不改变正式成绩、解锁、存档；返回编辑位置并保留草稿。正常自定义存档恢复匹配的作品版本。
   Playtests use actual gameplay without changing official scores, unlocks or saves, then return to the editing position/draft. Normal custom saves resolve their matching work revision.
4. 自定义作品包含跨原关卡素材时仍正确按需加载；缺失素材、极端密度或不支持配置产生明确反馈。通过浏览器不等于已通过 Android/iOS 真机。
   Cross-template asset combinations load correctly on demand. Missing assets, extreme density and unsupported configurations give clear feedback. Browser passes do not certify Android/iOS hardware.
5. LAN 两端使用同一内容，缺失、不同版本和损坏包得到明确处理；暂停、换关/读档和重连按范围验证，第三人仍被拒绝。
   LAN peers use identical content and handle missing, mismatched or damaged works explicitly. Verify applicable pause, advancement/load and reconnect behavior, while still rejecting a third player.
6. 请不懂编程的玩家完成“复制第一关 → 增加一队敌机 → 调整掉落 → 试玩 → 导出”，记录是否需要开发者指导，作为易用性验收而不是仅凭开发者判断。
   Ask non-programmers to copy stage one, add a wave, change a drop, playtest and export. Record required assistance as usability evidence rather than relying only on developer judgment.

本阶段尚未排期或分配里程碑；不得据此立即改玩法或发包。与 [最后阶段平台交付规划](FINAL_PLATFORM_DELIVERY.md) 协调，保留其最后实施的约定；编辑器具体排期需另行确定，不能把“电脑优先编辑”的建议误写成桌面安装包已交付。

No schedule or milestone is assigned, and this record does not initiate gameplay changes or releases. Coordinate with the linked final platform delivery plan while preserving its last-phase placement. Editor scheduling is separate; a desktop-first editing proposal does not imply desktop packages already exist.

## 10. 两项待确认决策 / Two pending decisions

| 项目 / Decision | 当前建议，尚未获用户确认 / Current recommendation, not yet confirmed |
|---|---|
| 编辑设备范围 / Editing devices | 优先电脑与平板完整编辑，手机先支持导入游玩与基础修改；手机完整长关卡编辑需要专门的触控布局。 / Prioritize full desktop/tablet editing, with phone import/play and basic edits first. Full long-level editing on phones needs a dedicated touch layout. |
| 自定义数值权限 / Custom numeric permissions | 允许在高级选项修改自定义作品的敌机 HP、速度和炮火参数，并提供恢复模板值；不修改原作战役或玩家全局机动性。 / Allow enemy HP, speed and firing changes in custom works under Advanced, with Restore template values; preserve original campaign values and global player mobility. |

用户要求“固化为 MD”仅确认记录本方案，不应解释为上述两项已拍板或自动解除现有数值冻结。后续启动开发前确认这两项；其余细节按本建议方案继续细化。

The request to persist this plan confirms documentation, not resolution of these two decisions or automatic removal of existing numeric freezes. Confirm them before implementation, then refine the remaining details from this proposal.
