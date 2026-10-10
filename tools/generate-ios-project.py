"""Generate a dependency-free UIKit/WKWebView Xcode project (iOS 12+)."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
project = root / 'ios/DemonStar.xcodeproj'
project.mkdir(parents=True, exist_ok=True)
ids = {name: f'{n:024X}' for n, name in enumerate(['project', 'main', 'sourceGroup', 'products', 'target', 'product', 'sources', 'resources', 'frameworks', 'configList', 'targetConfigList', 'debug', 'release', 'targetDebug', 'targetRelease', 'swift', 'swiftBuild', 'web', 'webBuild', 'launch', 'launchBuild', 'plist', 'assets', 'assetsBuild', 'localeEn', 'localeHans', 'localeHant', 'localeEnBuild', 'localeHansBuild', 'localeHantBuild'], 1)}
objects = []
def add(name, value): objects.append(f'{ids[name]} = {{ {value} }};')
def ref(name): return ids[name]
add('swift', 'isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>";')
add('web', 'isa = PBXFileReference; lastKnownFileType = folder; path = Web; sourceTree = "<group>";')
add('launch', 'isa = PBXFileReference; lastKnownFileType = file.storyboard; path = LaunchScreen.storyboard; sourceTree = "<group>";')
add('plist', 'isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>";')
add('assets', 'isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>";')
# 本地化桌面名称随系统显示。 / Localized launcher names follow the system language.
for name, folder in [('localeEn','en'),('localeHans','zh-Hans'),('localeHant','zh-Hant')]:
    add(name, f'isa = PBXFileReference; lastKnownFileType = folder; path = "{folder}.lproj"; sourceTree = "<group>";')
for name, file in [('localeEnBuild','localeEn'),('localeHansBuild','localeHans'),('localeHantBuild','localeHant'),('swiftBuild', 'swift'), ('webBuild', 'web'), ('launchBuild', 'launch'), ('assetsBuild', 'assets')]:
    add(name, f'isa = PBXBuildFile; fileRef = {ref(file)};')
add('product', 'isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = DemonStar.app; sourceTree = BUILT_PRODUCTS_DIR;')
add('main', f'isa = PBXGroup; children = ({ref("sourceGroup")},{ref("products")}); sourceTree = "<group>";')
add('sourceGroup', f'isa = PBXGroup; children = ({",".join(ref(n) for n in ["swift", "web", "launch", "plist", "assets", "localeEn", "localeHans", "localeHant"])}); path = DemonStar; sourceTree = "<group>";')
add('products', f'isa = PBXGroup; children = ({ref("product")}); name = Products; sourceTree = "<group>";')
for name, kind, files in [('sources','PBXSourcesBuildPhase',['swiftBuild']),('resources','PBXResourcesBuildPhase',['webBuild','launchBuild','assetsBuild','localeEnBuild','localeHansBuild','localeHantBuild']),('frameworks','PBXFrameworksBuildPhase',[])]:
    add(name, f'isa = {kind}; buildActionMask = 2147483647; files = ({",".join(ref(n) for n in files)}); runOnlyForDeploymentPostprocessing = 0;')
add('target', f'isa = PBXNativeTarget; buildConfigurationList = {ref("targetConfigList")}; buildPhases = ({ref("sources")},{ref("frameworks")},{ref("resources")}); buildRules = (); dependencies = (); name = DemonStar; productName = DemonStar; productReference = {ref("product")}; productType = "com.apple.product-type.application";')
for name, children in [('configList',['debug','release']),('targetConfigList',['targetDebug','targetRelease'])]:
    add(name, f'isa = XCConfigurationList; buildConfigurations = ({",".join(ref(n) for n in children)}); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
base = 'CLANG_ENABLE_MODULES = YES; IPHONEOS_DEPLOYMENT_TARGET = 12.0; SDKROOT = iphoneos; SWIFT_VERSION = 5.0;'
for name, label in [('debug','Debug'),('release','Release')]: add(name, f'isa = XCBuildConfiguration; buildSettings = {{ {base} }}; name = {label};')
settings = 'ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon; CODE_SIGN_STYLE = Automatic; CURRENT_PROJECT_VERSION = 9; GENERATE_INFOPLIST_FILE = NO; INFOPLIST_FILE = DemonStar/Info.plist; IPHONEOS_DEPLOYMENT_TARGET = 12.0; LD_RUNPATH_SEARCH_PATHS = ("$(inherited)","@executable_path/Frameworks"); MARKETING_VERSION = 0.2.7; PRODUCT_BUNDLE_IDENTIFIER = io.github.hashiao.demonstar; PRODUCT_NAME = "$(TARGET_NAME)"; SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"; TARGETED_DEVICE_FAMILY = "1,2"; SWIFT_VERSION = 5.0;'
for name,label in [('targetDebug','Debug'),('targetRelease','Release')]:
    add(name, f'isa = XCBuildConfiguration; buildSettings = {{ {settings} SWIFT_OPTIMIZATION_LEVEL = "{"-Onone" if label == "Debug" else "-O"}"; }}; name = {label};')
add('project', f'isa = PBXProject; attributes = {{ LastUpgradeCheck = 1640; }}; buildConfigurationList = {ref("configList")}; compatibilityVersion = "Xcode 14.0"; developmentRegion = en; hasScannedForEncodings = 0; knownRegions = (en,"zh-Hans","zh-Hant",Base); mainGroup = {ref("main")}; productRefGroup = {ref("products")}; projectDirPath = ""; projectRoot = ""; targets = ({ref("target")});')
(project / 'project.pbxproj').write_text('// !$*UTF8*$!\n{ archiveVersion = 1; classes = {}; objectVersion = 56; objects = {\n' + '\n'.join(objects) + f'\n}}; rootObject = {ref("project")}; }}\n', encoding='utf-8')
schemes = project / 'xcshareddata/xcschemes'
schemes.mkdir(parents=True, exist_ok=True)
reference = f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ref("target")}" BuildableName="DemonStar.app" BlueprintName="DemonStar" ReferencedContainer="container:DemonStar.xcodeproj"/>'
(schemes / 'DemonStar.xcscheme').write_text(f'<?xml version="1.0" encoding="UTF-8"?><Scheme LastUpgradeVersion="1640" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{reference}</BuildActionEntry></BuildActionEntries></BuildAction><LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></LaunchAction><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>')
print('Generated iOS 12+ Xcode project.')
