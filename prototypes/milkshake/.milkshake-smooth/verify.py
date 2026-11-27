import numpy as np, subprocess as sp
from pathlib import Path
import json
t=Path(__file__).parent
media=t.parent/'milkshake-brand-landing-page-css-slider-marquee-ticker-custom-cursor'/'dist'/'assets'/'fruit-protein'
for key,bg in {'classic':(248,246,240),'fragola':(241,112,125),'banana':(247,202,83),'mirtillo':(175,151,234),'kiwi':(181,212,91)}.items():
    clip=t/(key+'-smooth.mp4')
    inf=json.loads(sp.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,nb_read_frames,r_frame_rate:format=duration','-of','json',str(clip)]))
    assert list(inf['streams'][0].values())==[1920,1080,'24/1','72'] and float(inf['format']['duration'])==3
    def load(path,rgba=False):
        opts=['-c:v','libvpx-vp9'] if rgba else []
        raw=sp.check_output(['ffmpeg','-v','error',*opts,'-i',str(path),'-vf','scale=480:270:flags=lanczos','-pix_fmt','rgba' if rgba else 'rgb24','-f','rawvideo','-'])
        return np.frombuffer(raw,np.uint8).reshape(72,270,480,-1)
    old=load(media/(key+'-surface.mp4'))
    new=load(clip)
    shape=load(media/(key+'-reverse.webm'),True)[:,:,:,3]
    band=(shape>70)&(shape<253)
    high=lambda f: ((f.min(axis=-1)>224)&(np.ptp(f,axis=-1)<28)&band).sum()
    core=shape[:,55:208,218:246]>=250
    for delta in (-8,8):
        core &= shape[:,55+delta:208+delta,218:246]>=250
        core &= shape[:,55:208,218+delta:246+delta]>=250
    diff=np.abs(new[:,55:208,218:246].astype(np.int16)-old[:,55:208,218:246].astype(np.int16))[core].mean()
    print(key,'light border:',high(old),'→',high(new),'central RGB deviation:',round(diff,2))


    if key in ('banana','kiwi','mirtillo'):
        rows=np.vstack([np.hstack([old[i],new[i]]) for i in (23,40,71)])
        sp.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','960x810','-i','-','-frames:v','1',str(t/(key+'-comparison.png'))],input=rows.tobytes(),check=True)



