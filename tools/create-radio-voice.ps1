param([string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) '.local\mission-start-voice.wav'))
$ErrorActionPreference = 'Stop'
# Uses an already installed offline Windows voice. No network, recording or model download.
Add-Type -AssemblyName System.Speech
$voiceSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $voiceSynth.SelectVoice('Microsoft Zira Desktop')
    $voiceSynth.Rate = 6
    $voiceSynth.SetOutputToWaveFile($OutputPath)
    $voiceSynth.Speak('Mission start')
} finally { $voiceSynth.Dispose() }
