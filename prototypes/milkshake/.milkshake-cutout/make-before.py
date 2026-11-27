from floor import *
from concurrent.futures import ThreadPoolExecutor
import ctypes, sys

blend=ctypes.CDLL(str(out/'composite.dll')).composite
blend.argtypes=[ctypes.c_void_p]*3+[ctypes.c_int]*2
blend.restype=None
w,h=1920,1080
convert=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s','1920x1080']

def render(key):
    original=sp.Popen(['ffmpeg','-v','error','-threads','2','-i',str(media/(key+'-exit.mp4')),
        '-an','-vf','reverse,format=rgb24','-filter_threads','2','-f','rawvideo','-'],stdout=sp.PIPE)
    alpha=sp.Popen(['ffmpeg','-v','error','-threads','2','-c:v','libvpx-vp9','-i',str(media/(key+'-reverse.webm')),
        '-an','-vf','format=yuva420p,alphaextract','-filter_threads','2','-f','rawvideo','-'],stdout=sp.PIPE)
    encoder=sp.Popen([
        *convert,'-r','24','-i','-','-an','-filter_threads','2',
        '-vf','scale=out_color_matrix=bt601,format=yuva420p,setparams=range=tv:color_primaries=bt709:color_trc=iec61966-2-1:colorspace=smpte170m',
        '-c:v','libvpx-vp9','-crf','16','-b:v','0','-deadline','good','-cpu-used','5',
        '-row-mt','1','-g','24','-threads','4','-auto-alt-ref','0',str(out/(key+'-cutout.webm'))],stdin=sp.PIPE)
    fallback=sp.Popen([
        *convert,'-r','24','-i','-','-an','-filter_threads','2',
        '-vf','scale=768:432:flags=lanczos','-c:v','libwebp_anim','-quality','83','-loop','1',
        str(out/(key+'-cutout-animation.webp'))],stdin=sp.PIPE)
    result=np.empty((h,w,4),np.uint8)
    with original.stdout,alpha.stdout,encoder.stdin,fallback.stdin:
        for i in range(72):
            source=np.frombuffer(original.stdout.read(w*h*3),np.uint8).reshape(h,w,3)
            shape=np.frombuffer(alpha.stdout.read(w*h),np.uint8).reshape(h,w)
            shape=trim_floor(source,shape,key)
            blend(source.ctypes.data,shape.ctypes.data,result.ctypes.data,w,h)
            raw=result.tobytes()
            encoder.stdin.write(raw)
            fallback.stdin.write(raw)
            if i==0:
                sp.run([*convert,'-i','-','-vf','scale=960:540:flags=lanczos','-frames:v','1',
                    '-c:v','libwebp','-quality','93',str(out/(key+'-cutout-start.webp'))],input=raw,check=True)
    for process in (original,alpha,encoder,fallback):
        assert process.wait()==0
    print(key,'encoded',flush=True)

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(render,sys.argv[1:] or flavors))

