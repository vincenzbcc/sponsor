from floor import *
import sys
flavors=sys.argv[1:] or flavors
bg=np.array([175,150,232])
w,h=480,270
rows=[]
for key in flavors:
    clip=frames(out/(key+'-contour.webm'),w,h,True)
    src=frames(media/(key+'-exit.mp4'),w,h)[::-1]
    row=[]
    for i in range(0,72,4):
        x=np.s_[205:264,155:315]
        rgba=clip[i][x]
        a=rgba[:,:,3:4]/255
        cell=np.vstack([src[i][x],np.rint(rgba[:,:,:3]*a+bg*(1-a)).astype(np.uint8)])
        row.append(cell)
    for i in (0,6,12):
        rows.append(np.hstack(row[i:i+6]))
for j,key in enumerate(flavors):
    im=np.vstack(rows[j*3:j*3+3])
    sp.run(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','960x354','-i','-',
        '-frames:v','1',str(out/(key+'-finished-feet.png'))],input=im.tobytes(),check=True)


