from floor import *
import struct, json

for key in flavors:
    clip=out/(key+'-contour.webm')
    metadata=json.loads(sp.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0',
        '-show_entries','stream=width,height,r_frame_rate,nb_read_frames:stream_tags=alpha_mode:format=duration',
        '-of','json',str(clip)]))
    v=metadata['streams'][0]
    assert (v['width'],v['height'],v['r_frame_rate'],v['nb_read_frames'],v['tags']['alpha_mode'])==(1920,1080,'24/1','72','1')
    assert float(metadata['format']['duration'])==3
    data=(out/(key+'-contour-animation.webp')).read_bytes()
    p=12
    durations=[]
    while p+8<=len(data):
        ident=data[p:p+4]
        size=struct.unpack_from('<I',data,p+4)[0]
        if ident==b'ANMF':
            durations.append(int.from_bytes(data[p+20:p+23],'little'))
        elif ident==b'ANIM':
            assert int.from_bytes(data[p+12:p+14],'little')==1
        p+=8+size+(size%2)
    assert len(durations)==72, (key,len(durations))
    assert abs(sum(durations)-3000)<42,(key,sum(durations))
    w,h=480,270
    old=frames(media/(key+'-reverse.webm'),w,h,True)
    new=frames(clip,w,h,True)
    base=frames(media/(key+'-exit.mp4'),w,h)[::-1]
    shape=new[:,:,:,3]
    assert not shape[:,:20,:40].any()
    assert not shape[:,-6:,:].any()
    region=shape[:,50:208,204:254]>=250
    for dy,dx in [(0,5),(0,-5),(5,0),(-5,0)]:
        region &= shape[:,50+dy:208+dy,204+dx:254+dx]>=250
    deviation=np.abs(new[:,50:208,204:254,:3].astype('i2')-base[:,50:208,204:254,:].astype('i2'))[region].mean()
    assert deviation<5,(key,deviation)
    old_floor=old[:,220:,:,3]
    new_floor=shape[:,220:,:]
    removed=(old_floor.astype('i2')-new_floor.astype('i2')>135).sum()
    assert removed>400
    print(key,'true alpha, 72 frames, WebP',sum(durations),'ms, floor pixels removed:',removed,'central deviation:',round(deviation,2),flush=True)

