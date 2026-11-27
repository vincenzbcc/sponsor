from pathlib import Path
import numpy as np
import subprocess as sp

root=Path.cwd()
media=root/'milkshake-brand-landing-page-css-slider-marquee-ticker-custom-cursor'/'dist'/'assets'/'fruit-protein'
out=Path(__file__).parent
flavors=('classic','fragola','banana','mirtillo','kiwi')

def trim_floor(source,alpha,key):
    h,w=alpha.shape
    yy=np.arange(h)[:,None]
    xx=np.arange(w)[None,:]
    # Fit the carton sides in a band above the contact shadow.
    sample=np.arange(round(.745*h),round(.825*h),max(1,h//180))
    xs=np.arange(round(.31*w),round(.72*w))
    strong=alpha[sample[:,None],xs]>215
    qualifying=strong.sum(axis=1)>.07*w
    if qualifying.sum()<4:
        return alpha
    edge=xs[0]+strong.argmax(axis=1)
    right=xs[-1]-strong[:,::-1].argmax(axis=1)
    sample=sample[qualifying]
    edge=edge[qualifying]
    right=right[qualifying]
    def track(values):
        initial=np.polyfit(sample,values,1)
        keep=np.abs(np.polyval(initial,sample)-values)<.011*w
        model=np.polyfit(sample[keep],values[keep],1) if keep.sum()>=4 else initial
        return np.polyval(model,yy)
    margin=max(2,round(w*.005))
    shoulder=(yy>.85*h) & ((xx<track(edge)-margin) | (xx>track(right)+margin))
    if key!='classic':
        shoulder &= np.ptp(source,axis=2)<24
    clean=np.where(shoulder,0,alpha).astype(np.uint8)

    # The base of the four fruit cartons has saturated print. Its last pixels
    # locate the bottom edge even when a pale floor reflection joins the mask.
    floor_start=round(h*.82)
    floors=source[floor_start:]
    chroma=np.ptp(floors,axis=2)
    opaque=clean[floor_start:]>140
    if key!='classic':
        anchors=(chroma>=29)&opaque
        bottom=np.where(anchors,yy[floor_start:],0).max(axis=0)
        neighbors=max(1,w//450)
        expanded=np.maximum.reduce([np.roll(bottom,i) for i in range(-neighbors,neighbors+1)])
        use=expanded>=.858*h
        beyond=(yy>expanded[None,:]+max(1,w//800)) & use[None,:]
        clean[beyond]=0
        # Pale pixels that extend past the printed base belong to the old floor.
        confirmed=expanded>=.825*h
        if confirmed.any():
            columns=np.flatnonzero(confirmed)
            outside_base=(xx<columns[0]-2*max(1,w//800)) | (xx>columns[-1]+2*max(1,w//800))
            orphan=(yy[floor_start:]>.865*h) & outside_base & (chroma<24)
            clean[floor_start:][orphan]=0

            # Inspect the near-contact rows separately. A tilted carton can
            # place its tip well inside the horizontal span of the upper base.
            contact=(chroma>=52)&opaque
            tip=int(np.where(contact,yy[floor_start:],0).max())
            if key=='banana' and tip>.87*h:
                rows=yy[floor_start:]
                active=contact.any(axis=1)
                first=contact.argmax(axis=1)
                last=w-1-contact[:,::-1].argmax(axis=1)
                margin=max(3,round(w*.004))
                outside=(xx<first[:,None]-margin)|(xx>last[:,None]+margin)
                shade=(rows>tip-.026*h)&(rows>.87*h)&(chroma<52)
                clean[floor_start:][shade & ((outside & active[:,None]) | (rows>tip+margin//2))]=0
    else:
        # A neutral carton has no useful saturation channel; follow its sharp
        # lower edge just above the soft cast shadow.
        area=source[:,:,1].astype(np.float32)
        d=max(1,h//400)
        edge_response=np.roll(area,-d,axis=0)-np.roll(area,d,axis=0)
        last=np.where(clean>150,yy,0).max(axis=0)
        near=(yy>=np.maximum(.855*h,last-max(3,h//90))) & (yy<=last+d)
        peaks=np.where(near,edge_response,-100)
        boundary=peaks.argmax(axis=0)
        confidence=(peaks.max(axis=0)>12) & (boundary<last)
        if confidence.any():
            use=np.median(np.array([np.roll(np.where(confidence,boundary,last),shift) for shift in (-2,-1,0,1,2)]),axis=0)
            # Close short drops between adjacent columns along the straight carton edges.
            width=max(2,round(w*.018))
            offsets=range(-width,width+1,max(1,width//10))
            roof=np.maximum.reduce([np.roll(use,i) for i in offsets])
            use=np.minimum(last,np.minimum.reduce([np.roll(roof,i) for i in offsets]))
            clean[(yy>use[None,:]+d)&(last[None,:]>.86*h)]=0
        # The base is a rigid polygon. Bridge small breaks in its visible bottom
        # edge, using the original pixels to restore the short missing section.
        lower=clean[round(.805*h):]>160
        occupied=lower.sum(axis=0)>=max(3,h//80)
        bottom=np.where(lower,yy[round(.805*h):],0).max(axis=0)
        columns=np.flatnonzero(occupied)
        hull=[]
        for x in columns[::max(1,w//800)]:
            point=(int(x),int(bottom[x]))
            while len(hull)>1:
                first,second=hull[-2:]
                turn=(second[0]-first[0])*(point[1]-second[1])-(second[1]-first[1])*(point[0]-second[0])
                if turn<0:
                    break
                hull.pop()
            hull.append(point)
        if len(hull)>1:
            outline=np.interp(xx[0],*[list(values) for values in zip(*hull)])
            top=np.maximum(round(.782*h),np.where(clean>150,yy,0).max(axis=0))
            gap=outline-top
            near_body=(clean[round(.71*h):round(.80*h)]>150).any(axis=0)
            repair=near_body & (gap>0) & (gap<.166*h) & (xx[0]>=hull[0][0]+1) & (xx[0]<=hull[-1][0]-1)
            fill=(yy>top[None,:])&(yy<=outline[None,:])&repair[None,:]
            clean[fill]=255

        # A pale print stripe can split the alpha contour even where both
        # adjacent pixels are on the same face. Fill only bounded row gaps.
        base=clean[round(.77*h):]
        valid=base>=145
        left=np.maximum.accumulate(np.where(valid,xx,-w),axis=1)
        right=np.minimum.accumulate(np.where(valid,xx,2*w)[:,::-1],axis=1)[:,::-1]
        base[(~valid)&(right-left<.042*w)]=255
    return clean

def frames(path,w,h,alpha=False):
    opts=['-c:v','libvpx-vp9'] if alpha else []
    fmt='rgba' if alpha else 'rgb24'
    b=sp.check_output(['ffmpeg','-v','error',*opts,'-i',str(path),'-an','-vf',
      f'scale={w}:{h}:flags=lanczos','-pix_fmt',fmt,'-f','rawvideo','-'])
    return np.frombuffer(b,np.uint8).reshape(-1,h,w,4 if alpha else 3)

if __name__=='__main__':
    rows=[]
    w,h=360,202
    for key in flavors:
        source=frames(media/(key+'-exit.mp4'),w,h)[::-1]
        masks=frames(media/(key+'-reverse.webm'),w,h,True)[:,:,:,3]
        for i in (0,28,45,71):
            old=masks[i]
            new=trim_floor(source[i],old,key)
            crop=np.s_[145:202,100:268]
            rgb=source[i][crop]
            bg=np.array((171,145,231))
            compose=lambda a: np.rint(rgb*(a[crop][:,:,None]/255)+bg*(1-a[crop][:,:,None]/255)).astype(np.uint8)
            rows.append(np.hstack([rgb,compose(old),compose(new)]))
    pixels=np.vstack(rows)
    sp.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','504x1140','-i','-',
       '-frames:v','1',str(out/'feet.png')],input=pixels.tobytes(),check=True)







