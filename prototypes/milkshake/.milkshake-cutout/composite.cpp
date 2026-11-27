#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

static float smooth(float a,float b,float x) {
  const float s=std::clamp((x-a)/(b-a),0.f,1.f);
  return s*s*(3.f-2.f*s);
}

extern "C" __declspec(dllexport) void composite(const uint8_t *rgb, const uint8_t *matte,
    uint8_t *out, int w, int h) {
  const int bounds=w*h;
  const int firstRow=int(h*.805f);
  const int floorStart=firstRow*w;
  std::vector<uint8_t> attached(matte,matte+bounds);
  std::vector<uint8_t> reached(bounds-floorStart);
  std::vector<int> queue;
  auto visit=[&](int p){
    if(matte[p]>=125 && !reached[p-floorStart]){
      reached[p-floorStart]=1;
      queue.push_back(p);
    }
  };
  for(int x=int(.27f*w);x<int(.76f*w);x++) visit(floorStart+x);
  for(std::size_t i=0;i<queue.size();i++){
    const int p=queue[i];
    if(p%w>0) visit(p-1);
    if(p%w<w-1) visit(p+1);
    if(p>=floorStart+w) visit(p-w);
    if(p<bounds-w) visit(p+w);
  }
  for(int p=floorStart;p<bounds;p++) if(!reached[p-floorStart]) attached[p]=0;
  matte=attached.data();
  std::vector<uint8_t> distance(bounds);
  for(int y=1;y<h-1;y++) for(int x=1;x<w-1;x++){
    const int p=y*w+x;
    if(matte[p]>=125) distance[p]=std::min({16,1+distance[p-w],1+distance[p-1]});
  }
  for(int y=h-2;y>0;y--) for(int x=w-2;x>0;x--){
    const int p=y*w+x;
    if(distance[p]) distance[p]=std::min({(int)distance[p],1+distance[p+w],1+distance[p+1]});
  }
  const int offsets[8]={-1,1,-w,w,-w-1,-w+1,w-1,w+1};
  for(int p=0;p<bounds;p++){
    const int d=distance[p];
    if(!d){
      std::fill_n(out+p*4,4,0);
      continue;
    }
    if(d>=15 && matte[p]>=250){
      std::copy_n(rgb+p*3,3,out+p*4); out[p*4+3]=255;
      continue;
    }
    int inner=p;
    for(int step=0;step<10 && distance[inner]<10;step++){
      int next=inner;
      for(int off:offsets) if(distance[inner+off]>distance[next]) next=inner+off;
      if(next==inner) break;
      inner=next;
    }
    float alpha=(matte[p]/255.f)*smooth(.55f,4.25f,d);
    const float colorMix=(1.f-smooth(1,10,d))*.98f;
    const float lo=std::min({rgb[p*3],rgb[p*3+1],rgb[p*3+2]});
    const float hi=std::max({rgb[p*3],rgb[p*3+1],rgb[p*3+2]});
    const float paleFringe=smooth(220,248,lo)*(1.f-smooth(12,30,hi-lo));
    alpha*=1.f-.90f*paleFringe*(1.f-smooth(2,14,d));
    const float floor=smooth(.84f,.93f,(p/w)/(float)h);
    const float shadow=floor*(1.f-smooth(7,24,hi-lo))*(1.f-smooth(3,10,d));
    for(int c=0;c<3;c++){
      const float color=rgb[p*3+c]+(rgb[inner*3+c]-rgb[p*3+c])*colorMix;

      out[p*4+c]=std::clamp((int)std::lround(color),0,255);
    }
    out[p*4+3]=(uint8_t)std::lround(255.f*alpha*(1.f-.92f*shadow));
  }
}



