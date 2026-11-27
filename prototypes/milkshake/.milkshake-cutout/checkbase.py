from floor import *
w,h=360,202
rgb=frames(media/'classic-exit.mp4',w,h)[0]
m=frames(media/'classic-reverse.webm',w,h,True)[-1,:,:,3]
c=trim_floor(rgb,m,'classic')
y=np.arange(h)[:,None]
for x in range(145,234,2):
    a=np.where(m[:,x]>140,y[:,0],0).max()
    b=np.where(c[:,x]>140,y[:,0],0).max()
    if b>120 or a>120: print(x,a,b,rgb[min(190,b),x].tolist())
