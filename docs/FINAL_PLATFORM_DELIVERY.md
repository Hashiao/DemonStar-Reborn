# 最后阶段：各平台安装包与跨平台局域网
# Final phase: platform packages and cross-platform LAN

记录日期 / Recorded: 2026-10-11。核查基线 / Inspected baseline: M2.16 / v0.2.16，`b41df7a`。

**状态：需求与缺口已固化，暂不实施。这是项目最后阶段的交付工作，不是 M2.16 已完成功能。** 用户已接受为不同系统分别提供安装包；先完成当前游戏还原、移动端修复和既定验收，再启动本阶段。本记录不新增里程碑编号、不更改版本、不触发发包。

**Status: requirements and gaps recorded; implementation deferred to the final project phase, not delivered by M2.16.** The user accepts separate packages for each operating system. Finish existing fidelity, mobile fixes and planned verification before this phase. This record assigns no new milestone, changes no version and triggers no binary release.

## 1. 已确认范围 / Confirmed scope

- 目标覆盖 Windows、macOS、Linux、Android、iOS；各自提供适用的安装包。桌面用户下载、安装或解压、启动即可游玩，不要求安装 Node.js、Python、npm、SDK，不要求执行命令、配置环境或手动启动服务器。离线资源与必要运行时随包交付，或由正常安装流程自动处理。
  Target Windows, macOS, Linux, Android and iOS with appropriate packages. Desktop users download, install/extract and launch without installing Node.js, Python, npm or SDKs, running commands, configuring a development environment or manually starting a server. Ship offline assets and required runtimes, or handle dependencies through the normal installer.
- 单人、同机双人和局域网双人为实际玩法范围；五个平台之间任意两种组合均为最终互通目标，同一平台的两台设备也包括在内。房主与客户端角色均需支持。3P/4P 仍只保留协议与内核扩展，不能借本阶段开放四人玩法。
  Public play remains solo, shared-device two-player and two-player LAN. The final interoperability target includes every pair among the five platforms, including two devices on the same platform, with either side hosting. P3/P4 remain protocol/core reserves; this phase does not open four-player play.
- 局域网沿用同一 Wi-Fi 或系统热点，不依赖互联网中转、游戏账号、路由器端口转发。网络必须允许设备互访；连接同一热点不保证一定可达，访客网络或客户端隔离需明确提示。
  Use a shared Wi-Fi network or system hotspot without internet relays, game accounts or router port forwarding. Peers must be reachable; a shared hotspot alone does not guarantee this. Explain guest-network/client-isolation failures.
- 桌面独立安装包是本阶段主要交付方式。“只打开普通浏览器就可跨平台联机”不作为必要验收条件；浏览器独立联网或自动启动本地服务的启动器另列候选扩展，不阻塞安装包方案。
  Standalone desktop packages are the primary deliverable. Cross-platform LAN in an ordinary browser alone is not a required acceptance gate. Browser networking or a launcher-managed local service remains an optional extension and does not block packaged delivery.
- 保留已核实玩法、经典 HUD、P2 蓝色、三语、存档和操作设置；桌面适配不得改变机动性、逻辑步长、关卡、HP/伤害。保留 Android 现有音频实现和 M2.16 的 iOS 专用适配边界。
  Preserve verified gameplay, classic HUD, blue P2, three languages, saves and controls. Desktop support must not alter mobility, simulation steps, stages or HP/damage. Retain Android playback and the iOS-only M2.16 audio boundary.

## 2. 当前能力与不足 / Baseline and gaps

| 项目 / Area | 已有基础 / Existing basis | 尚缺 / Remaining gap |
|---|---|---|
| 游戏内核 / Game core | 共用离线 Canvas，已有键鼠/手柄及同机双人逻辑。 / Shared offline Canvas with keyboard/mouse/gamepad and local two-player logic. | 桌面打包后的焦点、全屏、输入、音频及性能验收；不能把 Windows 浏览器结果当作 macOS/Linux 通过。 / Packaged desktop focus, fullscreen, input, audio and performance checks; Windows browser evidence does not certify macOS/Linux. |
| 桌面交付 / Desktop delivery | `tools/serve.mjs` 是绑定 `127.0.0.1:4173` 的开发服务器。 / The development server binds to `127.0.0.1:4173`. | 无桌面壳、安装包、发布流水线；开发服务器不是免配置用户启动器。 / No desktop shell, installer or release pipeline; the development server is not a turnkey launcher. |
| 移动端传输 / Mobile transport | Android `ServerSocket/Socket`；iOS `NWListener/NWConnection`；TCP 37654，换行分隔 UTF-8 JSON。 / Native Android/iOS TCP on port 37654 with newline-delimited UTF-8 JSON. | 桌面同协议传输与受限桥接，地址选择、生命周期和系统权限适配。 / Matching desktop transport/restricted bridge, address selection, lifecycle and permission integration. |
| 会话协议 / Sessions | `demonstar-lan-1`、输入 v3、状态 v2，房主权威、准备/暂停、重连、换关/读档。 / Protocol, input v3 and state v2 with authoritative host, ready/pause, reconnect and stage/load operations. | 平台标识当前仅 android/ios/browser；增加桌面标识时同步校验与显示，明确版本兼容或拒绝提示。 / Platform IDs currently admit only android/ios/browser; desktop IDs need matching validation/display and explicit compatibility/rejection. |
| 浏览器联网 / Browser networking | 普通浏览器没有现有原生 TCP 桥；页面 CSP 为 `connect-src 'none'`。 / Ordinary browsers lack the native TCP bridge; CSP uses `connect-src 'none'`. | 仅发布网页不能复用原生建房；需浏览器可用传输、发现/信令或本地桥方案，并按需调整连接策略。 / Hosting the page alone does not supply native hosting; browser transport, discovery/signaling or a local bridge and scoped connection policy are additional work. |
| 房间入口 / Room entry | 已有建房、地址加入和六位房间代码。 / Hosting, address joining and a six-digit room code exist. | 房间代码不等于地址发现；目前无自动发现，需改善地址展示和连接失败反馈。 / A room code is not address discovery; automatic discovery is absent, and address/error UX needs work. |
| 跨设备证据 / Device evidence | 已有 Android 双原生进程、iOS 双模拟器和协议/浏览器回归。 / Android native-process pairs, iOS simulator pairs and protocol/browser regressions exist. | 五平台实机组合、实际热点、拒绝授权重试和最低系统验证未齐全。 / Physical five-platform pairs, real hotspots, permission denial/retry and minimum-system evidence are incomplete. |
| 分发 / Distribution | 有独立签名 APK 与明确标注 unsigned 的 IPA。 / An independently signed APK and explicitly unsigned IPA exist. | 无桌面正式分发与签名方案；unsigned IPA 不能直接安装，iOS 即装即玩仍有分发条件缺口。 / Desktop distribution/signing is missing; an unsigned IPA is not directly installable, leaving an iOS distribution gap. |

代码定位 / Code anchors: [native.js](../web/js/native.js)、[lan.js](../web/js/lan.js)、[Android bridge](../android/app/src/main/java/io/github/hashiao/demonstar/GameBridge.java)、[iOS bridge](../ios/DemonStar/GameBridge.swift)、[开发服务器 / developer server](../tools/serve.mjs)、[CSP](../web/index.html)、[package.json](../package.json)。历史证据见 [M2.10 网络记录 / network evidence](M2_10_NETWORK.md)、[设备验收清单 / device checklist](M2_10_DEVICE_CHECKLIST.md)、[M2.16 音频边界 / audio limits](M2_16_IOS_AUDIO.md)。

## 3. 实现候选与工作量 / Candidate implementation and effort

**首选评估候选为 Electron，自带 Chromium/Node，复用离线游戏页和原生 TCP 协议；尚未锁定框架、版本或最低系统。** 其优势是桌面三系统具有较统一的运行环境，代价是包体和内存较大。最终采用前核对支持系统、维护成本、许可与实测表现，不将候选写成已经采用。

**Electron is the leading candidate for evaluation, bundling Chromium/Node while reusing the offline game and native TCP protocol; framework, version and minimum OS are not locked.** It offers a more consistent desktop runtime at the cost of larger packages and memory use. Confirm supported systems, maintenance, licenses and measured behavior before adoption; a candidate is not an implemented decision.

桌面网络在主进程/受限桥接中实现，保留现有消息容量、队列限制、UTF-8 拆包和旧会话隔离。渲染层只获得必要游戏接口，不向任意网页暴露 Node 或无限制网络能力。无需为适配桌面重写移动端传输；如确需调整共用协议元数据，保留双端回归，并向不兼容版本明确提示升级。

Implement desktop networking through the main process/restricted bridge, retaining message/queue limits, UTF-8 framing and stale-session isolation. Expose only required game operations to the renderer, not Node or unrestricted networking to arbitrary pages. Desktop work should reuse mobile transport; necessary shared protocol metadata changes require both mobile regressions and explicit upgrade messages for incompatible peers.

自动房间发现是建议的易用性改进，具体采用 Bonjour/mDNS、其他发现方式或仅优化直接加入，留到最后阶段技术验证后决定。保留直接地址回退；不能将发现成功等同于实际会话已连通，也不能假定所有热点允许发现广播。

Automatic room discovery is a proposed usability improvement. Decide between Bonjour/mDNS, another discovery method or improved direct joining after final-phase validation. Retain direct-address fallback. Discovery does not prove session connectivity, and hotspot discovery traffic cannot be assumed available.

| 工作 / Work | 初步难度 / Initial estimate | 原因 / Reason |
|---|---|---|
| 桌面单机/同机双人包 / Desktop solo/local packages | 较低至中等 / Low–medium | 内核可复用，主要是壳、输入、持久化与打包。 / Reusable core; shell, input, persistence and packaging work. |
| 桌面三系统 LAN / Desktop LAN | 中等 / Medium | 同协议网络桥接、生命周期和防火墙处理。 / Matching bridge, lifecycle and firewall handling. |
| 桌面与 Android/iOS 互通 / Desktop–mobile LAN | 中等偏上 / Medium–high | 权限、热点、多网卡和房主/客户端组合的实机验证。 / Physical permission, hotspot, multi-interface and host/client combinations. |
| 稳定免开发环境发布 / Reliable turnkey releases | 中等偏上 / Medium–high | 签名、平台依赖、安装升级和多平台构建。 / Signing, dependencies, installation/upgrades and multi-platform builds. |
| 纯浏览器跨平台联机 / Browser-only LAN | 额外较高工作量 / Higher additional effort | 无现成原生 TCP 能力，需另行设计传输与连接流程。 / No existing native TCP bridge; separate transport/connection design. |

以上为代码结构评估，不是工期承诺；主要风险在交付与实机覆盖，不是重做游戏内核。
These are architecture-based estimates, not schedule commitments. Delivery and hardware coverage dominate risk, rather than rebuilding the game core.

## 4. 安装包与用户体验 / Packages and user experience

| 系统 / System | 目标交付 / Target delivery | 必须解决或说明 / Required resolution or disclosure |
|---|---|---|
| Windows | 安装器，或解压后双击可执行程序的便携包。 / Installer or extract-and-launch portable package. | 所需运行时无需用户另配；明确签名与系统信誉提示状态，不保证签名后绝无提示。 / No manual runtime setup; disclose signing/reputation status without promising zero prompts. |
| macOS | `.dmg` / `.app`。 | 正式便捷分发评估 Developer ID 签名及公证；不把未签名包绕过系统保护视为默认安装步骤。 / Evaluate Developer ID signing and notarization for smooth distribution; bypassing system protections is not the normal install flow. |
| Linux | 按声明支持的发行版提供包；具体格式待定。 / Packages for explicitly supported distributions; format pending. | 安装流程处理依赖；AppImage 可能依赖 FUSE，不能声称任意发行版下载即跑。 / Installer handles dependencies; AppImage may require FUSE, so universal extract-and-run compatibility is not assumed. |
| Android | 项目独立签名 Release APK。 / Project-signed Release APK. | 沿用现有分发与平台授权流程，复测局域网和音频。 / Preserve distribution/permission flow and regress LAN/audio. |
| iOS / iPadOS | 保持 ASCII 文件名 `DemonStar.ipa`，分发方式另定。 / Keep ASCII filename `DemonStar.ipa`; distribution route pending. | 未签名 IPA 需要用户签名，不能满足字面意义的直接安装；正式签名/可用分发渠道及其限制必须解决或明确保留缺口。 / Unsigned IPA requires user signing and cannot meet literal direct installation; resolve a supported signing/distribution route or explicitly retain this gap. |

预期流程：下载对应包 → 正常安装/解压 → 启动 → 单人游戏或多人游戏 → 同机双人或局域网建房/加入。启动后的游戏与局域网不应要求联网下载运行时或游戏资源。系统可能要求首次网络/防火墙授权，属于正常系统交互；不要求关闭防火墙、安全保护或配置开发环境。签名、公证和构建所需开发环境属于开发者职责，不转嫁给玩家。

Expected flow: download the matching package → normal install/extract → launch → single player or multiplayer → local two-player or LAN host/join. Gameplay and LAN after installation must not require runtime/asset downloads. First-use network/firewall permissions are normal OS interactions; users must not disable firewalls/security or configure development tools. Signing, notarization and build environments remain developer responsibilities.

桌面数据保存到可写的用户目录；安装位置只读、路径含中文/空格时也能启动和存读档。升级保留设置、关卡档与进度；卸载的数据保留策略需清楚说明。桌面不具备陀螺仪/触感时提供已有输入回退，不虚报硬件能力。

Store desktop data in writable user locations. Read-only install directories and paths containing spaces/non-ASCII characters must not break launch or saves. Preserve settings, checkpoints and progress across upgrades; explain uninstall data retention. Use existing input fallbacks when desktop sensors/haptics are absent rather than reporting unsupported hardware capabilities.

## 5. 验收矩阵与证据 / Acceptance matrix and evidence

以下是最终实机发布验收矩阵，**全部待验证**。行是房主、列是客户端；25 个方向组合包含同系统双设备，不能只测一个方向。已有模拟器/协议通过记录不填入此表冒充实机通过。每格还应记录 OS/CPU、设备、包版本/哈希、网络类型、结果及失败原因。

This is the final physical-device release matrix; **all entries are pending**. Rows host, columns join. The 25 directional categories include two devices on the same OS; one direction does not certify the reverse. Simulator/protocol evidence must not be entered as physical passes. Record OS/CPU, devices, package version/hash, network type, result and failure reason for each case.

| 房主 → 客户端 / Host → Guest | Windows | macOS | Linux | Android | iOS |
|---|---|---|---|---|---|
| Windows | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending |
| macOS | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending |
| Linux | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending |
| Android | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending |
| iOS | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending | 待验证 / Pending |

验收必须覆盖 / Required checks:

- 无开发环境的干净系统：安装、冷启动、离线单人/同机双人/局域网、升级后设置及存档、正常卸载；所声明系统/架构分别验证。
  Clean systems without developer tools: installation, cold launch, offline solo/local/LAN play, upgrade persistence and normal uninstall, for each declared OS/architecture.
- 实际路由器 Wi-Fi、Android 热点、iPhone 热点及适用的桌面热点；热点提供者作为房主/客户端也要区分。无法互访的网络应给出有用反馈，不要求用户设置端口转发。
  Real router Wi-Fi, Android/iPhone hotspots and applicable desktop hotspots; distinguish whether the hotspot provider hosts or joins. Give useful feedback for unreachable peers without router port forwarding.
- 授权拒绝/重试、防火墙拦截、端口占用、多网卡/VPN 地址选择、断网/切网、后台/休眠/唤醒、房主退出、重连与旧输入释放。
  Permission denial/retry, firewall blocking, occupied ports, multi-interface/VPN address selection, network loss/change, background/sleep/resume, host exit, reconnect and stale-input release.
- 两人独立移动/开火/炸弹、准备与中立位确认、暂停/恢复、难度、换关、读档与装备同步；拒绝第三人；不同版本兼容或清楚拒绝。保持现有房主权限规则。
  Independent movement/fire/bombs, ready/neutral confirmation, pause/resume, difficulty, stage/load and equipment sync; reject a third player and clearly handle version mismatch. Preserve host authority.
- 桌面键鼠/手柄与改键、切出窗口防粘键、窗口/全屏/缩放、音频和性能；Android/iOS 原有触屏与音频回归。双端不同帧率不得改变战斗数值。
  Desktop keyboard/mouse/gamepad/remapping, focus-loss input release, window/fullscreen/scaling, audio and performance, plus mobile touch/audio regressions. Different render rates must not change combat values.
- 简体中文、繁体中文、英语的菜单、安装/启动说明、错误反馈与布局；记录未测设备/系统和复现步骤，不将构建成功等同游玩通过。
  Three-language menus, install/launch guidance, errors and layout; record untested devices/systems and reproduction steps. A successful build is not a gameplay pass.

25 格是平台组合，不是测试总数。CPU、最低系统、Linux 发行版、路由器/热点类型会继续扩展用例。可先分阶段发布已验证平台，但必须写明支持范围和未验收组合，不能宣称最终目标全部完成。

The 25 cells are platform categories, not the total test count. Architectures, minimum OS versions, Linux distributions and network types add cases. Staged releases may cover verified platforms first, with explicit support and unverified combinations; they do not establish completion of the final target.

## 6. 最后阶段顺序与完成条件 / Final-phase sequence and gates

1. 先明确支持的 OS/CPU/Linux 范围、壳与签名/分发条件；建立桌面离线单人/同机双人安装包，并验证干净系统启动。
   Define supported OS/CPU/Linux scope, shell and signing/distribution conditions; package offline desktop solo/local play and verify clean-system launch.
2. 接入现有 TCP 与会话接口，先验证桌面双端，再逐项验证桌面与移动端及移动端之间的实机组合。
   Integrate the existing TCP/session interfaces, verify desktop pairs, then desktop–mobile and mobile–mobile physical pairs.
3. 完成建房/加入与连接失败提示；评估并落实选定的发现方案，保留直接加入路径。
   Complete room/join/error UX; evaluate and implement the selected discovery approach, retaining direct joining.
4. 建立各平台构建、安装、回归与签名检查，记录完整证据；适用的移动端构建/Lint/模拟器与真机检查继续执行。
   Establish per-platform builds, installation, regressions and signature checks with evidence; retain applicable mobile build/Lint/simulator and hardware checks.
5. 按既定项目规则提交源码并发布配套包、SHA-256、中英 Release/README 和测试边界；不覆盖历史标签。不发布凭据、私钥或受限制原始资产。
   Follow project rules for source commits and releases with packages, SHA-256, bilingual release notes/READMEs and test limits. Preserve historical tags and exclude credentials, private keys and restricted original assets.

完成条件是声明范围内用户无需开发环境即可游玩，所宣称互通组合有对应证据，分发与签名状态真实披露。iOS 若仍只能交付 unsigned IPA，应保持“须自行签名”的标注，并明确其便捷安装目标尚未达成；不得以文件重命名替代验收。

Completion requires play without development setup within the declared scope, evidence for every claimed interoperable pair, and accurate distribution/signing disclosures. If iOS still ships only unsigned IPA, retain the user-signing label and explicitly mark convenient installation unresolved; renaming is not verification.

## 7. 留到启动本阶段时决策 / Decisions deferred until this phase

- 桌面框架和版本、Windows/macOS 最低版本、CPU 架构、Linux 发行版基线及包格式。
  Desktop framework/version, Windows/macOS minimums, CPU architectures, Linux baselines and package formats.
- Windows/macOS 签名与公证所需条件、iOS 可用签名/分发渠道；不假定账号、证书或预算已具备。
  Windows/macOS signing/notarization prerequisites and an available iOS signing/distribution route; accounts, certificates and budget are not assumed.
- 自动发现方式及降级体验，热点与多网卡的实测支持边界，版本兼容策略与升级提示。
  Discovery/fallback approach, measured hotspot/multi-interface support, version compatibility and upgrade messaging.
- 实机与 CI 资源、各平台发布先后及最终兼容范围；纯浏览器扩展是否另立后续任务。
  Hardware/CI availability, platform release order and final compatibility scope, plus whether browser-only support becomes a separate later task.

这些是最后阶段的技术/交付决策，不阻塞当前游戏工作。本记录不要求现在安装桌面工具链、改写联机或启动桌面开发。
These final-phase technical/delivery decisions do not block current game work. This record does not call for installing desktop toolchains, rewriting networking or starting desktop development now.

## 参考 / References

- [Electron runtime](https://www.electronjs.org/docs/latest/)、[distribution](https://www.electronjs.org/docs/latest/tutorial/distribution-overview)、[code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)、[restricted renderer/security guidance](https://www.electronjs.org/docs/latest/tutorial/security)。用于评估打包运行时和桥接边界；实施前重新核对版本支持。 / For runtime packaging and bridge boundaries; recheck version support before implementation.
- [Apple: distribution-signed Mac code](https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac/)。用于核对 Mac 分发签名条件。 / For Mac distribution signing requirements.
- [Node TCP API](https://nodejs.org/api/net.html)。桌面复用现有 TCP 的候选实现基础。 / Candidate basis for desktop reuse of existing TCP.
- [AppImage FUSE requirements](https://docs.appimage.org/user-guide/troubleshooting/fuse.html)。Linux 免配置交付需要检查的依赖边界。 / Dependency limits to check for turnkey Linux delivery.
