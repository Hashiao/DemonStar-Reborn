/* SPDX-License-Identifier: MIT. 三语文案与语言选择 / UI copy and locale selection. */
(() => {
  'use strict';
  const locales=['zh-Hans','zh-Hant','en'];
  // 繁体文案独立编写，不自动转字；数组顺序固定为简中、繁中、英文。
  // Traditional Chinese is authored separately; column order is Hans, Hant, English.
  const copy={
    lanTitle:['局域网联机','區域網路連線','LAN multiplayer'],lanRoom:['联机房间','連線房間','Multiplayer room'],lanCreate:['创建房间','建立房間','Create room'],lanJoin:['加入房间','加入房間','Join room'],lanAddress:['主机地址','主機位址','Host address'],lanCode:['六位房间码','六位房間碼','Six-digit room code'],lanStart:['全员出击','全員出擊','Launch together'],lanLeave:['离开房间','離開房間','Leave room'],lanReconnect:['重新连接','重新連線','Reconnect'],lanLocalPlayer:['本机：玩家 {n}','本機：玩家 {n}','This device: Player {n}'],
    lanInputHint:['联机时每台设备控制自己的战机；这里的操作设置仅影响本机。','連線時每台裝置控制自己的戰機；這裡的操作設定只影響本機。','Each connected device controls its own ship. These controls affect this device only.'],
    lanHint:['先让设备连接同一 Wi-Fi 或手机热点。房主创建房间，其他玩家输入房主显示的地址与房间码。安卓和 iOS 可混合，当前支持双人，每台设备一名玩家。','請先將裝置連接同一個 Wi-Fi 或手機熱點。房主建立房間，其他玩家輸入房主顯示的位址與房間碼。Android 與 iOS 可一起遊玩，目前支援雙人，每台裝置一名玩家。','Connect devices to the same Wi-Fi or personal hotspot. The host creates a room; others enter its address and room code. Android and iOS can join together, two players, one per device.'],lanNativeOnly:['请使用 Android 或 iOS 安装版进行局域网联机。浏览器仍可进行本机多人游玩。','區域網路連線請使用 Android 或 iOS 安裝版。瀏覽器仍可在同一台裝置多人遊玩。','Use the Android or iOS app for LAN play. Local multiplayer remains available in the browser.'],lanHostRules:['房主控制开始、继续、切关和读档。任何玩家都可以请求暂停；断线后保留座位等待重连。','房主控制開始、繼續、換關與讀檔。任何玩家都能要求暫停；斷線後會保留位置供重新連線。','The host controls launch, resume, stage changes and loading. Anyone can request a pause. Disconnected seats are retained for reconnection.'],lanHostOnly:['等待房主继续、切关或读档。','請等待房主繼續、換關或讀檔。','Wait for the host to resume, change stage or load a save.'],
    lanConnected:['已连接','已連線','Connected'],lanDisconnected:['连接已断开','連線已中斷','Disconnected'],lanWaitingAddress:['正在读取地址','正在取得位址','Reading addresses'],lanTestPeer:['浏览器测试端','瀏覽器測試端','Browser test peer'],lanNeedPlayers:['至少需要两位已连接玩家才能出击。','至少需要兩位已連線的玩家才能出擊。','At least two connected players are needed to launch.'],lanEnterAddress:['请输入有效的主机地址和六位房间码。','請輸入有效的主機位址及六位房間碼。','Enter a valid host address and six-digit room code.'],lanSaveCount:['存档人数与当前房间不一致。','存檔人數與目前房間不同。','The save player count differs from this room.'],
    lanBadCode:['房间码不正确。','房間碼不正確。','Incorrect room code.'],lanFull:['房间已满，当前最多两人。','房間已滿，目前最多兩人。','The room is full; two players maximum.'],lanStarted:['游戏已开始，新玩家请等待下一场。','遊戲已開始，新玩家請等候下一場。','The game has started. New players must wait for another run.'],lanPermission:['请在系统设置中允许本地网络访问，再重试。','請在系統設定允許本機網路存取後重試。','Allow local network access in system settings, then retry.'],lanTimeout:['连接超时，正在尝试恢复。','連線逾時，正在嘗試恢復。','Connection timed out. Attempting recovery.'],lanConnectError:['连接未成功，请检查热点、主机地址和系统权限。','連線未成功，請檢查熱點、主機位址及系統權限。','Connection failed. Check the hotspot, host address and system permissions.'],
    lanStatusidle:['尚未连接','尚未連線','Not connected'],lanStatusconnecting:['正在连接…','正在連線…','Connecting…'],lanStatuslobby:['等待玩家加入','等待玩家加入','Waiting for players'],lanStatusplaying:['房间正在进行游戏','房間正在遊戲中','Game in progress'],lanStatusdisconnected:['已暂停，等待重连','已暫停，等待重新連線','Paused, waiting to reconnect'],lanStatusrejected:['无法加入房间','無法加入房間','Could not join room'],lanStatuserror:['网络未就绪','網路尚未就緒','Network unavailable'],
    haptics:['震动反馈','震動回饋','Haptic feedback'],hapticsHint:['受伤、投弹和拾取时震动；仅在支持触感的手机 App 中生效。','受傷、投彈及拾取時提供震動；僅適用於支援觸感的手機 App。','Feedback for hits, bombs and pickups. Available in the phone app on supported hardware.'],
    inputSettings:['玩家与操作','玩家與操作','Players and controls'],playerCount:['同机人数','同機人數','Local players'],playerCountValue:['{n} 人','{n} 人','{n} players'],configurePlayer:['配置玩家','設定玩家','Configure player'],playerNumber:['玩家 {n}','玩家 {n}','Player {n}'],
    playerLimit:['当前版本仅开放单人和双人游玩。','目前版本僅開放單人及雙人遊玩。','This version supports solo and two-player play.'],
    localPlayersHint:['当前支持单人或双人，两人可以同时触屏操作，也可使用键盘或手柄。人数在主菜单设置。','目前支援單人或雙人，兩人可同時使用觸控，也可使用鍵盤或控制器。人數請在主選單設定。','Play solo or with two players using simultaneous touch, a keyboard or controllers. Set the player count from the main menu.'],
    touchMode:['触控方式','觸控方式','Touch mode'],touchfixed:['固定摇杆','固定搖桿','Fixed stick'],touchfloating:['浮动摇杆','浮動搖桿','Floating stick'],touchdpad:['八方向按键','八方向按鍵','Eight-direction pad'],stickSize:['摇杆大小','搖桿大小','Stick size'],stickHorizontal:['摇杆水平位置','搖桿水平位置','Stick horizontal position'],stickVertical:['摇杆垂直位置','搖桿垂直位置','Stick vertical position'],
    mouseControl:['鼠标移动控制','滑鼠移動控制','Mouse movement'],controller:['手柄分配','控制器分配','Controller assignment'],controllerNumber:['手柄 {n}','控制器 {n}','Controller {n}'],mouseButton:['鼠标键 {n}','滑鼠鍵 {n}','Mouse {n}'],padButton:['手柄键 {n}','控制器鍵 {n}','Pad {n}'],
    controllerConflict:['该手柄已分配给另一位玩家。','這個控制器已分配給另一位玩家。','That controller is assigned to another player.'],
    bindingHint:['点击动作后按键盘、鼠标键或手柄按钮。Esc 取消；摇杆与十字键均可移动。','點選動作後按鍵盤、滑鼠鍵或控制器按鈕。Esc 取消；搖桿與方向鍵都能移動。','Select an action, then press a key, mouse button or controller button. Esc cancels. Analog sticks and D-pads move your ship.'],bindingWaiting:['等待按键…','等待按鍵…','Waiting for input…'],bindingSaved:['按键已保存','按鍵已儲存','Binding saved'],bindingConflict:['该按键已用于其他动作，请换一个。','這個按鍵已用於其他動作，請換一個。','That input is already assigned. Choose another.'],unbound:['未设置','未設定','Unbound'],resetControls:['重置此玩家操作','重設此玩家操作','Reset this player’s controls'],backSettings:['返回设置','返回設定','Back to settings'],
    actionup:['上','上','Up'],actiondown:['下','下','Down'],actionleft:['左','左','Left'],actionright:['右','右','Right'],actionfire:['开火','射擊','Fire'],actionbomb:['炸弹','炸彈','Bomb'],actionpause:['暂停','暫停','Pause'],
    directionup:['上','上','Up'],directiondown:['下','下','Down'],directionleft:['左','左','Left'],directionright:['右','右','Right'],directionupLeft:['左上','左上','Up left'],directionupRight:['右上','右上','Up right'],directiondownLeft:['左下','左下','Down left'],directiondownRight:['右下','右下','Down right'],
    playerControls:['玩家 {n} 移动','玩家 {n} 移動','Player {n} movement'],floatingArea:['玩家 {n} 浮动摇杆区域','玩家 {n} 浮動搖桿區域','Player {n} floating stick area'],playerFire:['玩家 {n} 开火','玩家 {n} 射擊','Player {n} fire'],playerBomb:['玩家 {n} 炸弹，剩余 {b} 枚','玩家 {n} 炸彈，剩餘 {b} 枚','Player {n} bomb, {b} remaining'],coopStatus:['命 {l} · 能 {e} · B {b} · 火力 {w}','命 {l}・能 {e}・B {b}・火力 {w}','Lives {l} · E {e} · B {b} · Power {w}'],
    freeStageHint:['可直接选择任意原版关卡。','可直接選擇任何原作關卡。','Choose any original stage.'],stageRestartHint:['选择后以初始装备重新出击。当前关卡可先在存档菜单保存。','選擇後會以初始裝備重新出擊。目前關卡可先到存檔選單儲存。','Selecting a stage starts a new run with starting equipment. Save the current stage first if needed.'],
    saveMenu:['关卡存读档','關卡存讀檔','Stage saves'],autoSave:['自动关卡档','自動關卡存檔','Automatic stage save'],saveSlot:['存档 {n}','存檔 {n}','Slot {n}'],saveSummary:['第 {stage} 关 · {n} 人 · 分数 {score}','第 {stage} 關・{n} 人・分數 {score}','Stage {stage} · {n} players · Score {score}'],emptySave:['空存档','空白存檔','Empty slot'],loadSave:['读取','讀取','Load'],writeSave:['保存关卡','儲存關卡','Save stage'],saveEntryHint:['保存该关开始时的生命、装备和分数，读取后从关卡开头重玩。手动存档在暂停时保存；每次进入新关自动保存。','儲存本關開始時的生命、裝備與分數，讀取後從關卡開頭重玩。暫停時可手動存檔；進入新關時會自動儲存。','Saves retain lives, equipment and score at stage entry. Loading restarts that stage. Save manually while paused; entering a new stage saves automatically.'],saveWritten:['关卡已保存','關卡已儲存','Stage saved'],saveFailed:['无法保存或读取，请检查存储空间。','無法儲存或讀取，請檢查儲存空間。','Could not save or load. Check available storage.'],
    appName:['恶魔之星·重生','惡魔之星・重生','DemonStar Reborn'],
    remaster:['恶魔之星 · 高清重制','惡魔之星・高畫質重製','DemonStar · HD Remaster'],
    subtitle:['恶 魔 之 星 · 重 生','惡 魔 之 星 ・ 重 生','DemonStar Reborn'],
    edition:['街机复刻 / 01','街機重製 / 01','Arcade Remaster / 01'],
    offline:['离线就绪','離線暢玩','Ready offline'],
    slogan:['经典街机，重新起飞。','經典街機，再度出擊。','A classic takes flight again.'],
    introEyebrow:['经典从未落幕','經典，再次登場','The classic lives on'],
    introTitleHtml:['再一次，<br>冲破天际。','再一次，<br>衝破天際。','Take flight.<br>Break through.'],
    introCopyHtml:['经典的 DemonStar，<br>在掌心重新起飞。','熟悉的 DemonStar，<br>在掌上再度出擊。','Classic DemonStar,<br>back in your hands.'],
    introSpecHtml:['<b>18</b> 道防线 <span>／</span> <b>18</b> 位旗舰','<b>18</b> 道防線 <span>／</span> <b>18</b> 艘旗艦','<b>18</b> stages <span>/</span> <b>18</b> bosses'],
    introNoteHtml:['原版地图编排 · AI 高清重绘<br>非官方恶魔之星高清重制','原作關卡配置・AI 高畫質重繪<br>非官方惡魔之星重製版','Original stage layouts · AI-redrawn art<br>Unofficial DemonStar HD remake'],
    howTo:['操作指南','操作說明','How to play'],
    gameAria:['恶魔之星重生游戏','惡魔之星重生遊戲','DemonStar Reborn game'],
    fieldAria:['飞行战场，左摇杆移动，按住 A 开火，B 释放炸弹','飛行戰場：左側搖桿移動，按住 A 射擊，按 B 使用炸彈','Battlefield. Move with the left stick, hold A to fire, press B for a bomb.'],
    score:['得分 {n}','分數 {n}','Score {n}'],
    lives:['剩余 {n} 条生命，备用战机 {spares} 架','剩餘生命 {n}，備用戰機 {spares} 架','Lives: {n}. Spare ships: {spares}.'],
    stage:['关卡 {n}','第 {n} 關','Stage {n}'],
    stageName:['第 {n} 关','第 {n} 關','Stage {n}'],
    boss:['第 {n} 关旗舰','第 {n} 關首領','Boss {n}'],
    pauseAria:['暂停游戏','暫停遊戲','Pause game'],
    bombsAria:['炸弹 {n} 枚，后拾取先使用','炸彈 {n} 枚，最後取得的會先使用','Bombs: {n}. The most recently collected bomb is used first.'],
    energy:['能量 {n} / {max}','能量 {n} / {max}','Energy {n} / {max}'],
    unofficial:['非官方高清重制 · V0.2','非官方高畫質重製・V0.2','Unofficial HD remake · V0.2'],
    settings:['设置','設定','Settings'],
    sfx:['音效','音效','Sound effects'],
    soundToggleAria:['切换音效','切換音效','Toggle sound effects'],
    soundMenu:['音效 {state}','音效 {state}','Sound {state}'],
    onShort:['开','開','on'],offShort:['关','關','off'],
    on:['开启','開啟','On'],off:['关闭','關閉','Off'],
    best:['最高纪录','最高紀錄','Best score'],
    start:['开始游戏','開始遊戲','Start game'],
    difficulty:['难度 · {name}','難度・{name}','Difficulty · {name}'],
    difficulty0:['容易','簡單','Easy'],difficulty1:['一般','普通','Normal'],difficulty2:['较难','困難','Hard'],difficulty3:['疯狂','瘋狂','Insane'],
    missions:['选择关卡','選擇關卡','Select stage'],
    helpMenu:['怎么玩 ↗','怎麼玩 ↗','How to play ↗'],
    tapStart:['轻触屏幕以开始游戏','輕觸螢幕開始遊戲','Tap the screen to start'],
    baseWeapon:['双联机炮','雙聯機砲','Twin cannon'],
    weapon0:['质子激光','質子雷射','Proton laser'],weapon1:['离子炮','離子砲','Ion cannon'],weapon2:['等离子炮','電漿砲','Plasma cannon'],weapon3:['磁力脉冲','磁力脈衝','Magnetic pulse'],
    weaponLevel:['{name} · {n} 级','{name}・{n} 級','{name} · Lv {n}'],
    powerAria:['增强等级 {n} / 6','火力等級 {n} / 6','Power level {n} / 6'],
    chooseWeapon:['拾取颜色球选择武器','拾取彩色能量球切換武器','Collect a colored orb to choose a weapon'],
    sameColor:['同色升档 · 换色重置','同色升級・換色重置','Match colors to power up · New color resets'],
    maxPower:['同色或 S 触发清屏','同色或 S，發動清場攻擊','Same color or S unleashes a screen attack'],
    launch:['母舰出击中','正從母艦起飛','Launching from carrier'],
    move:['移动','移動','Move'],fire:['开火','射擊','Fire'],bombLabel:['炸弹','炸彈','Bomb'],
    joystickAria:['移动摇杆','移動搖桿','Movement stick'],
    fireAria:['A 按住开火','A 按住射擊','A: hold to fire'],
    bombAria:['B 释放炸弹，剩余 {n} 枚','B 使用炸彈，剩餘 {n} 枚','B: use a bomb. Remaining: {n}.'],
    gearMissile:['导弹 {n}','飛彈 {n}','Missiles {n}'],gearHoming:['追踪 {n}','追蹤彈 {n}','Homing {n}'],
    gearSide:['侧射 {n}','側向砲 {n}','Side guns {n}'],gearRear:['后射 {n}','後方砲 {n}','Rear guns {n}'],gearShield:['护盾','護盾','Shield'],
    gameSettings:['游戏设置','遊戲設定','Game settings'],
    language:['语言','語言','Language'],languageHint:['立即生效，下次启动保留选择。','立即套用，下次啟動會保留選擇。','Applies immediately. Your choice is saved.'],
    languageSessionHint:['已切换；当前浏览环境无法保存设置。','已套用；目前的瀏覽環境無法儲存設定。','Applied for this session. Settings cannot be saved in this browser.'],
    sfxVolume:['音效音量','音效音量','Sound volume'],music:['背景音乐','背景音樂','Background music'],musicVolume:['音乐音量','音樂音量','Music volume'],healthBars:['高血量敌机血条','高血量敵機血量條','High-HP enemy bars'],bossHealthBars:['Boss 血条','首領血量條','Boss health bar'],healthBarsHint:['仅显示血量不低于开局方形补给机的普通敌人。','只顯示血量不低於開場方形補給機的一般敵人。','Only regular enemies with at least the opening supply ship’s maximum HP.'],
    hangar:['返回机库','返回機庫','Back to hangar'],pausedTag:['游戏已暂停','遊戲已暫停','Game paused'],pausedTitle:['暂时停靠','暫停一下','Flight paused'],
    pausedBody:['战机已悬停。准备好了就继续。','休息一下，準備好了就繼續。','Take a breather. Continue when you are ready.'],
    resume:['继续飞行','繼續遊戲','Resume flight'],mainMenu:['返回主菜单','返回主選單','Main menu'],
    quitTitle:['结束本次飞行？','結束這次出擊？','End this flight?'],
    quitBody:['最高分与已解锁关卡会保留，本次战斗进度将结束。','最高分數和已解鎖關卡會保留，但這次出擊的進度將會結束。','Your best score and unlocked stages are saved. This flight will end.'],
    quit:['结束并返回','結束並返回','End flight'],helpTag:['游戏说明','遊戲說明','How to play'],helpTitle:['飞行指南','飛行指南','Flight guide'],ready:['准备起飞','準備出擊','Ready to fly'],
    guideHtml:[
      '<li><b>移动</b>　左侧虚拟摇杆移动；<span class="keyboard-help">电脑使用 WASD 或方向键。</span>按住右侧 A 开火，松开停止；<span class="keyboard-help">电脑按住 Z / J。</span></li><li><b>炸弹</b>　点击右侧 B <span class="keyboard-help">或按空格。</span>清除弹幕并对 Boss 造成伤害。</li><li><b>补给</b>　彩色球同色升档、换色回最低档；三色 S 直接满火力，满级再吃 S 或同色球触发清屏弹。E 补满能量，晶体恢复 2 格，M 导弹，B 炸弹。部分补给循环换色，接触拾取。</li><li><b>躲避</b>　避开敌机与弹幕，装甲耗尽会损失生命并重置火力。</li><li><b>暂停</b>　点击 Ⅱ <span class="keyboard-help">或按 Esc / P。</span>切到后台会自动暂停。</li>',
      '<li><b>移動</b>　用左側搖桿操控戰機，按住右側 A 射擊，放開就停止。<span class="keyboard-help">電腦可用 WASD 或方向鍵移動，按住 Z / J 射擊。</span></li><li><b>炸彈</b>　按右側 B <span class="keyboard-help">或空白鍵，</span>消除彈幕並重創首領。</li><li><b>補給</b>　連吃同色能量球可強化火力，換色則從最低等級開始。三色 S 可直接升滿；滿級後再吃同色球或 S，就能發動清場攻擊。E 補滿能量，晶體回復 2 格，M 補充飛彈，B 補充炸彈。部分道具會輪流換色，碰到就能取得。</li><li><b>閃避</b>　避開敵機和彈幕。裝甲耗盡會損失一條命，火力也會重置。</li><li><b>暫停</b>　按 Ⅱ <span class="keyboard-help">或 Esc / P。</span>切換到其他 App 時，遊戲會自動暫停。</li>',
      '<li><b>Move</b>　Use the left stick. Hold A to fire; release to stop. <span class="keyboard-help">On a keyboard, move with WASD or the arrow keys and hold Z / J to fire.</span></li><li><b>Bombs</b>　Press B <span class="keyboard-help">or Space</span> to clear bullets and damage enemies.</li><li><b>Pickups</b>　Matching colored orbs increase power; changing color resets it to the lowest level. A colored S gives full power. At maximum power, another matching orb or S unleashes a screen attack. E restores all energy, crystals restore 2 bars, M adds missiles, and B adds a bomb. Some pickups cycle colors. Touch them to collect.</li><li><b>Dodge</b>　Avoid enemies and bullets. Losing all armor costs a life and resets your weapons.</li><li><b>Pause</b>　Press Ⅱ <span class="keyboard-help">or Esc / P.</span> Switching to another app pauses the game automatically.</li>'
    ],
    guideFooterHtml:['原作 18 关地图 · 4 档难度 · 离线存档<br>非官方 DemonStar 同人重制 · v{version}','原作 18 關・4 種難度・離線儲存<br>非官方 DemonStar 同人重製 · v{version}','18 original stages · 4 difficulties · Offline saves<br>Unofficial DemonStar fan remake · v{version}'],
    campaign:['原版战役','原作戰役','Original campaign'],missionTitle:['选择出击点','選擇出擊關卡','Choose a stage'],
    missionHint:['通过上一关即可解锁。各难度单独保存进度。','通過上一關即可解鎖。各種難度的進度會分開儲存。','Clear a stage to unlock the next. Progress is saved separately for each difficulty.'],
    bonusBombs:['炸弹奖励 · {n} × 1000','炸彈加分・{n} × 1000','Bomb bonus · {n} × 1000'],bonusMedals:['勋章奖励 · {n} × 2000','勳章加分・{n} × 2000','Medal bonus · {n} × 2000'],bonusTotal:['本关奖励合计','本關加分合計','Total stage bonus'],
    kills:['击落敌机','擊落敵機','Enemies destroyed'],accuracy:['命中率','命中率','Accuracy'],flightTime:['飞行时间','飛行時間','Flight time'],currentStage:['当前关卡','目前關卡','Current stage'],
    nextStage:['下一关 →','下一關 →','Next stage →'],retry:['再次出击','再戰一次','Fly again'],missionComplete:['任务完成','任務完成','Mission complete'],combatLog:['战斗记录','戰鬥紀錄','Combat record'],victory:['星海已重获自由','星海重獲自由','The stars are free'],stageClear:['防线已突破','成功突破防線','Stage cleared'],gameOver:['任务结束','任務結束','Mission over'],
    pickupWeapon:['质子补给','質子火力','Proton power'],pickupIon:['离子补给','離子火力','Ion power'],pickupPlasma:['等离子补给','電漿火力','Plasma power'],pickupMagnetic:['磁力补给','磁力火力','Magnetic power'],pickupEnergy:['装甲修复','裝甲修復','Armor restored'],pickupFull:['火力全满','火力全滿','Full power'],pickupShield:['能量护盾','能量護盾','Shield acquired'],pickupBomb:['炸弹补给','炸彈補充','Bomb acquired'],pickupScatter:['散射补给','散射炸彈補充','Scatter bomb acquired'],pickupMega:['激光炮补给','雷射砲補充','Laser cannon acquired'],pickupMissile:['导弹补给','飛彈補充','Missiles acquired'],pickupHoming:['追踪补给','追蹤飛彈補充','Homing missiles acquired'],pickupSide:['侧向火力','側向火力','Side guns acquired'],pickupRear:['后向火力','後方火力','Rear guns acquired'],pickupMedal:['获得勋章','取得勳章','Medal acquired'],pickupCrystal:['能量 +2','能量 +2','Energy +2'],pickupFallback:['获得补给','取得補給','Pickup acquired'],
    nova0:['质子清屏','質子清場攻擊','Proton burst'],nova1:['离子清屏','離子清場攻擊','Ion burst'],nova2:['等离子清屏','電漿清場攻擊','Plasma burst'],nova3:['磁力清屏','磁力清場攻擊','Magnetic burst'],
    fleet:['猛禽战机 / 地球舰队','猛禽戰機 / 地球艦隊','Raptor fighter / Earth fleet'],noCoins:['无需投币','免投幣','No coins needed'],
    controls:['操作说明','操作說明','Controls'],keepMoving:['保持移动','保持移動','Keep moving'],moveKeys:['方向键 / WASD / 摇杆','方向鍵 / WASD / 搖桿','Arrow keys / WASD / stick'],breakout:['绝境突围','突破重圍','Break through'],bombKeys:['空格键 / B 炸弹 · Z / A 开火','空白鍵 / B 炸彈・Z / A 射擊','Space / B: bomb · Z / A: fire'],rest:['短暂停靠','暫停一下','Take a break'],pauseKeys:['Esc / P 暂停游戏','Esc / P 暫停遊戲','Esc / P: pause'],supplies:['战场补给','戰場補給','Pickups'],upgrade:['升级火力','強化火力','Power up'],ionPower:['离子火力','離子火力','Ion power'],energyShield:['能量护盾','能量護盾','Energy shield'],refillBomb:['补充炸弹','補充炸彈','Extra bomb'],
    supplyNoteHtml:['接触补给即可拾取。<br>保持机动，留意装甲能量。','碰到道具就能取得。<br>保持移動，留意裝甲能量。','Touch pickups to collect them.<br>Keep moving and watch your armor.'],
    openSource:['游戏代码开放，欢迎共同完善。','遊戲程式碼開源，歡迎一起改進。','Open-source game code. Contributions welcome.'],noAds:['无广告 · 无内购 · 无需联网','無廣告・無課金・免連線','No ads · No purchases · No connection needed']
  };
  const messages={};for(const [index,locale] of locales.entries()){messages[locale]={};for(const key of Object.keys(copy))messages[locale][key]=copy[key][index];}
  const valid=locale=>locales.includes(locale);
  function detect(tag){
    const parts=String(tag||'').toLowerCase().replace(/_/g,'-').split('-');
    if(parts[0]!=='zh')return 'en';
    // 明确字形优先于地区，例如 zh-Hans-HK 仍为简体。
    // Explicit script wins over region: zh-Hans-HK remains Simplified Chinese.
    if(parts.includes('hans'))return 'zh-Hans';if(parts.includes('hant'))return 'zh-Hant';
    return parts.some(p=>['tw','hk','mo'].includes(p))?'zh-Hant':'zh-Hans';
  }
  function preferred(){
    // 原生宿主通过本地 URL 片段传递系统语言，无 JS 桥接、网络或权限。
    // Native hosts pass the system language in the local URL fragment; no bridge or network.
    const match=String(globalThis.location?.hash||'').match(/(?:^#|&)system-language=([^&]+)/);
    if(match){try{return decodeURIComponent(match[1]);}catch{/* 损坏参数回退 / Malformed parameter falls back. */}}
    return globalThis.navigator?.languages?.[0]||globalThis.navigator?.language||'en';
  }
  let locale='en';
  function select(value){if(!valid(value))return false;locale=value;return true;}
  function resolve(saved,system){return valid(saved)?saved:detect(system);}
  function t(key,values={}){return (messages[locale][key]??messages.en[key]??key).replace(/\{(\w+)\}/g,(match,name)=>values[name]===undefined?match:String(values[name]));}
  function apply(root=document){
    document.documentElement.lang=locale;document.title=t('appName');
    for(const el of root.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    // HTML 文案只来自随包词典，不加载远程翻译。
    // HTML copy comes only from the bundled catalog; translations are never fetched.
    for(const el of root.querySelectorAll('[data-i18n-html]'))el.innerHTML=t(el.dataset.i18nHtml);
    for(const el of root.querySelectorAll('[data-i18n-aria]'))el.setAttribute('aria-label',t(el.dataset.i18nAria));
    document.documentElement.classList.remove('localizing');
  }
  globalThis.DemonStarI18n={locales,messages,valid,detect,preferred,resolve,select,t,apply,get locale(){return locale;}};
})();
