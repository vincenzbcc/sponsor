from floor import *
w,h=480,270
key='classic'
original=frames(media/(key+'-exit.mp4'),w,h)[::-1]
shape=frames(media/(key+'-reverse.webm'),w,h,True)[:,:,:,3]
for i in (4,20,60,68):
    s=trim_floor(original[i],shape[i],key)
    ys=np.arange(h)[:,None]
    old=np.where(shape[i]>140,ys,0).max(axis=0)
    new=np.where(s>140,ys,0).max(axis=0)
    r=np.flatnonzero(np.abs(np.diff(new.astype(int)))>7)
    print(i, [(int(x),int(old[x]),int(new[x]),int(new[x+1])) for x in r if 170<x<332])
