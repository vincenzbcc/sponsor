from pathlib import Path
import ctypes
import subprocess as sp
from concurrent.futures import ThreadPoolExecutor
import numpy as np

root=Path.cwd()
media=root/'milkshake-brand-landing-page-css-slider-marquee-ticker-custom-cursor'/'dist'/'assets'/'fruit-protein'
out=root/'.milkshake-smooth'
colors={'classic':(248,246,240),'fragola':(241,112,125),'banana':(247,202,83),'mirtillo':(175,151,234),'kiwi':(181,212,91)}
blend=ctypes.CDLL(str(out/'composite.dll')).composite
blend.argtypes=[ctypes.c_void_p]*3+[ctypes.c_int]*5
blend.restype=None
w,h=1920,1080
convert=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1920x1080']

def render(key):
    original=sp.Popen(['ffmpeg','-v','error','-threads','2','-i',str(media/(key+'-exit.mp4')),
        '-an','-vf','reverse,format=rgb24','-filter_threads','2','-f','rawvideo','-'],stdout=sp.PIPE)
    alpha=sp.Popen(['ffmpeg','-v','error','-threads','2','-c:v','libvpx-vp9','-i',str(media/(key+'-reverse.webm')),
        '-an','-vf','format=yuva420p,alphaextract','-filter_threads','2','-f','rawvideo','-'],stdout=sp.PIPE)
    encoder=sp.Popen([
        *convert,'-r','24','-i','-','-an','-filter_threads','2',
        '-vf','scale=out_color_matrix=bt601,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=iec61966-2-1:colorspace=smpte170m',
        '-c:v','libx264','-crf','13','-preset','fast','-g','24','-threads','3',
        '-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6',
        '-colorspace','smpte170m','-color_primaries','bt709','-color_trc','iec61966-2-1',
        '-movflags','+faststart+write_colr',str(out/(key+'-smooth.mp4'))],stdin=sp.PIPE)
    result=np.empty((h,w,3),np.uint8)
    with original.stdout,alpha.stdout,encoder.stdin:
        for i in range(72):
            source=np.frombuffer(original.stdout.read(w*h*3),np.uint8)
            shape=np.frombuffer(alpha.stdout.read(w*h),np.uint8)
            assert (source.size,shape.size)==(w*h*3,w*h)
            blend(source.ctypes.data,shape.ctypes.data,result.ctypes.data,w,h,*colors[key])
            encoder.stdin.write(result.tobytes())
            if i==0:
                sp.run([*convert,'-i','-','-frames:v','1','-c:v','libwebp','-quality','94',
                    str(out/(key+'-smooth-start.webp'))],input=result.tobytes(),check=True)
    for p in (original,alpha,encoder):
        assert p.wait()==0
    print(key,'rendered',flush=True)

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(render,colors))
