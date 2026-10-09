param(
    [string]$SdkPath = $env:ANDROID_HOME,
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$GradleCache = $env:GRADLE_USER_HOME,
    [switch]$Offline,
    [string[]]$Tasks = @(':app:assembleDebug', ':app:lintDebug', ':app:lintRelease', ':app:assembleRelease')
)
$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
if (-not $SdkPath -and (Test-Path -LiteralPath 'K:\android\sdk')) { $SdkPath = 'K:\android\sdk' }
if (-not $JavaHome -and (Test-Path -LiteralPath 'C:\Program Files\Java\jdk-25.0.2')) { $JavaHome = 'C:\Program Files\Java\jdk-25.0.2' }
if (-not $GradleCache -and (Test-Path -LiteralPath 'K:\aida64-diskmark\src\.local\gradle-user-home')) { $GradleCache = 'K:\aida64-diskmark\src\.local\gradle-user-home' }
if (-not (Test-Path -LiteralPath (Join-Path $SdkPath 'platform-tools\adb.exe'))) { throw 'Pass -SdkPath pointing to an existing Android SDK. This script does not install SDKs.' }
if (-not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin\java.exe'))) { throw 'Pass -JavaHome pointing to an existing JDK.' }
$previous = @{}
foreach ($name in @('JAVA_HOME','ANDROID_HOME','GRADLE_USER_HOME')) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    $env:JAVA_HOME = $JavaHome
    $env:ANDROID_HOME = $SdkPath
    if ($GradleCache) { $env:GRADLE_USER_HOME = $GradleCache }
    [IO.File]::WriteAllText((Join-Path $gameRoot 'android\local.properties'), 'sdk.dir=' + $SdkPath.Replace('\','/').Replace(':','\:') + "`n", [Text.UTF8Encoding]::new($false))
    Push-Location -LiteralPath $gameRoot
    try {
        & node tools/sync.mjs
        if ($LASTEXITCODE -ne 0) { throw 'Compatible web build failed.' }
        $buildArgs = @('-p','android','--no-daemon','--console=plain')
        if ($Offline) { $buildArgs += '--offline' }
        & (Join-Path $gameRoot 'android\gradlew.bat') @buildArgs @Tasks
        if ($LASTEXITCODE -ne 0) { throw 'Android build or Lint failed.' }
    } finally { Pop-Location }
} finally {
    foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
