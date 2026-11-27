from floor import *
w,h=480,270
i=56
orig=frames(media/'banana-exit.mp4',w,h)[::-1][i]
sh=frames(media/'banana-reverse.webm',w,h,True)[i,:,:,3]
old=frames(media/'banana-cutout.webm',w,h,True)[i,:,:,3]
new=trim_floor(orig,sh,'banana')
for y in range(231,257):
    columns=np.flatnonzero(old[y]>120)
    if len(columns): print(y,[(int(x),orig[y,x].tolist(),int(new[y,x])) for x in columns[:6]])
