# 贡献约定 / Contributing

**简体中文**：修改前阅读 [AGENTS.md](AGENTS.md)、[还原状态](docs/FIDELITY.md) 与相关原作取证记录。玩法数值必须有证据；语言修改不得改变模拟、伤害或存档进度。新增/修改的核心注释、重要说明、提交信息、PR 和 Release 使用简体中文及英文；同步维护 [中文 README](README.md) 与 [English README](README.en.md)。游戏三语文案在 `web/js/i18n.js` 独立维护，繁体中文需按港澳台通用游戏表达润色。参见 [语言规范](docs/LOCALIZATION.md)。

**English**: Before making changes, read [AGENTS.md](AGENTS.md), [fidelity status](docs/FIDELITY.en.md) and the relevant original-game research. Gameplay values require evidence; localization must not change simulation, damage or saved progression. Write new/changed core comments, important explanations, commit messages, PRs and releases in both Simplified Chinese and English. Keep the two READMEs synchronized. Maintain the three UI catalogs in `web/js/i18n.js`; write Traditional Chinese naturally for Hong Kong, Macao and Taiwan. See the [localization policy](docs/LOCALIZATION.md).

提交示例 / Commit example:

```text
新增三语设置与语言识别 / Add trilingual settings and locale detection

简体中文：保存手动语言选择，切换时保留战斗及解锁进度。
English: Persist manual locale choices without resetting combat or unlocks.
```

PR 与发布说明需说明变更、依据、测试结果及未验收范围，两种语言信息一致。禁止提交原始游戏、参考图、私钥、凭据或未授权素材；不得覆盖正式版本标签。每个完成的里程碑交付源码、独立签名 APK、设备 IPA（无签名时明确 unsigned）、SHA-256 和验收报告。

PRs and release notes must describe the change, evidence, verification and untested limits with equivalent information in both languages. Never commit the original game, reference art, keys, credentials or unauthorized assets, and never overwrite published tags. Each completed milestone ships source, an independently signed APK, a device IPA (clearly marked unsigned when applicable), SHA-256 checksums and a verification report.
