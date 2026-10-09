"""Offline sound-design reconstruction, without exporting original recordings.

Only coarse time-varying band energy is measured from the user's local effects.
Fresh seeded noise excites each band; no original sample/phase is reused. The
announcer is a separately synthesized voice passed with --voice, not game PCM.
Dependencies (existing maintainer Python): numpy, scipy. No network or API.
"""
import argparse,base64,hashlib,json,math,runpy,wave
from pathlib import Path
import numpy as np
from scipy import signal

ROOT=Path(__file__).resolve().parents[1]
RATE=11025
SOUNDS={'proton':'W_PSHOT1','ion':'W_PSHOT2','plasma':'W_PSHOT3','hit':'W_HITSHIP',
        'explosion':'W_EXPLOSION1','heavyExplosion':'W_EXPLOSION2','bomb':'W_MEGABOMB',
        'pickup':'W_GETSHOT','menu':'W_MENUCLICK','magnetic':'W_PULSAR2'}

def read_wave(path):
    with wave.open(str(path),'rb') as wav:
        raw=wav.readframes(wav.getnframes());width=wav.getsampwidth();rate=wav.getframerate()
        data=(np.frombuffer(raw,np.uint8).astype(float)-128)/128 if width==1 else np.frombuffer(raw,'<i2').astype(float)/32768
        data=data.reshape(-1,wav.getnchannels()).mean(axis=1)
    divisor=math.gcd(RATE,rate)
    if rate!=RATE:data=signal.resample_poly(data,RATE//divisor,rate//divisor)
    return data-data.mean()

def reconstruct(reference,seed):
    """24 broad frequency bands, energy knots every 20ms; random excitation."""
    random=np.random.default_rng(seed);n=len(reference);result=np.zeros(n)
    edges=np.geomspace(35,5100,25);hop=round(RATE*.020);window=max(3,round(RATE*.018))
    positions=np.r_[np.arange(0,n,hop),n-1];profile=[]
    for lo,hi in zip(edges[:-1],edges[1:]):
        sos=signal.butter(2,[lo,hi],btype='bandpass',fs=RATE,output='sos')
        band=signal.sosfilt(sos,reference)
        envelope=np.sqrt(np.maximum(0,np.convolve(band*band,np.ones(window)/window,'same')))
        # Quantize the energy summary; original PCM and phase never enter output.
        knots=np.round(envelope[positions],4);profile.append(knots.tolist())
        excitation=signal.sosfilt(sos,random.normal(size=n+RATE))[-n:]
        excitation/=max(1e-6,np.sqrt(np.mean(excitation*excitation)))
        result+=excitation*np.interp(np.arange(n),positions,knots)
    result*=np.sqrt(np.mean(reference*reference))/max(1e-6,np.sqrt(np.mean(result*result)))
    # Preserve the rough 8-bit arcade texture, with a short click-free edge.
    fade=min(60,n//8);result[:fade]*=np.linspace(0,1,fade);result[-fade:]*=np.linspace(1,0,fade)
    result=np.round(np.clip(result,-.96,.96)*127)/127
    return result,{'duration':round(n/RATE,4),'bands':24,'envelope_step_ms':20,
                   'reference_rms':round(float(np.sqrt(np.mean(reference*reference))),4),
                   'output_rms':round(float(np.sqrt(np.mean(result*result))),4),
                   'waveform_correlation':round(float(np.corrcoef(reference,result)[0,1]),4)}

def radio_voice(path):
    x=read_wave(path);active=np.flatnonzero(abs(x)>max(abs(x))*.015)
    x=x[max(0,active[0]-200):min(len(x),active[-1]+201)]
    # Lower the new speaker's pitch by ~3 semitones, preserving a short phrase.
    x=signal.resample(x,round(len(x)*1.19))
    x=signal.sosfilt(signal.butter(3,[340,2700],btype='bandpass',fs=RATE,output='sos'),x)
    x/=max(1e-6,max(abs(x)));x=np.tanh(x*3.4)*.62
    t=np.arange(len(x))/RATE;x*=.84+.16*np.sin(2*np.pi*67*t)
    random=np.random.default_rng(40412);noise=random.normal(size=len(x));noise=signal.sosfilt(signal.butter(2,[700,3800],btype='bandpass',fs=RATE,output='sos'),noise)
    x+=noise*.025
    lead=round(.055*RATE);tail=round(.08*RATE)
    start=signal.sosfilt(signal.butter(2,[850,3500],btype='bandpass',fs=RATE,output='sos'),random.normal(size=lead))*.13
    end=signal.sosfilt(signal.butter(2,[600,3500],btype='bandpass',fs=RATE,output='sos'),random.normal(size=tail))*.12*np.linspace(1,0,tail)
    return np.round(np.clip(np.r_[start,x,end],-.88,.88)*127)/127

def main():
    p=argparse.ArgumentParser();p.add_argument('original',type=Path);p.add_argument('--voice',type=Path,required=True);a=p.parse_args()
    api=runpy.run_path(str(ROOT/'tools/inspect-original.py'))
    entries={e['name']:e['data'] for e in api['read_glb'](a.original/'sounds.glb')}
    local=ROOT/'.local/reference/audio';local.mkdir(parents=True,exist_ok=True)
    out=ROOT/'web/assets/audio';out.mkdir(parents=True,exist_ok=True);bank={};report={}
    signals={}
    for kind,name in SOUNDS.items():
        source=local/(name+'.wav');source.write_bytes(entries[name])
        signals[kind],report[kind]=reconstruct(read_wave(source),sum(name.encode())+404)
        report[kind]['reference_resource']=name
    signals['missionStart']=radio_voice(a.voice)
    for kind,data in signals.items():
        pcm=np.round(np.clip(data,-1,1)*32767).astype('<i2').tobytes()
        with wave.open(str(out/(kind+'.wav')),'wb') as wav:
            wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes(pcm)
        bank[kind]={'rate':RATE,'pcm':base64.b64encode(pcm).decode('ascii')}
    (ROOT/'web/js/soundbank.js').write_text('/* Reconstructed sound-design assets. See docs/AUDIO_MOTION.md; not original PCM. */\n'+'globalThis.DemonStarSounds='+json.dumps(bank,separators=(',',':'))+';\n',encoding='utf-8')
    (ROOT/'.local/audio-reconstruction-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'effects':len(SOUNDS),'voice':'new offline TTS, radio filtered','report':str(ROOT/'.local/audio-reconstruction-report.json'),'duration':{k:round(len(v)/RATE,3) for k,v in signals.items()}}))
if __name__=='__main__':main()
