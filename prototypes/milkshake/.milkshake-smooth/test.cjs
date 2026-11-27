const {spawn}=require("node:child_process"), assert=require("node:assert/strict");
const {pathToFileURL}=require("node:url"), path=require("node:path"), fs=require("node:fs");
const chrome=spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",["--headless=new","--no-sandbox","--disable-crashpad-for-testing","--disable-gpu","--remote-debugging-pipe","--disable-extensions","--no-first-run","--user-data-dir="+path.join(__dirname,"profile"),"about:blank"],{stdio:["ignore","ignore","ignore","pipe","pipe"],windowsHide:true});
let id=0, sessionId, queue=new Map(), buffer="";
chrome.stdio[4].setEncoding("utf8").on("data",part=>{
  buffer+=part; let end; while((end=buffer.indexOf("\0"))>=0){
    const message=JSON.parse(buffer.slice(0,end)); buffer=buffer.slice(end+1);
    if(queue.has(message.id)){ const {resolve,reject}=queue.get(message.id); queue.delete(message.id); message.error?reject(Error(JSON.stringify(message.error))):resolve(message.result); }
  }
});
chrome.on("exit",()=>{for(const {reject} of queue.values())reject(Error("Chrome closed"));});
function send(method,params={}){
  const request=++id; chrome.stdio[3].write(JSON.stringify({id:request,method,params,sessionId})+"\0");
  return new Promise((resolve,reject)=>queue.set(request,{resolve,reject}));
}
async function js(expression){
  const result=await send("Runtime.evaluate",{expression,returnByValue:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception.description);
  return result.result.value;
}
async function until(expression){
  for(let n=0;n<120;n++){ if(await js(expression))return; await new Promise(r=>setTimeout(r,40)); }
  throw Error(expression);
}
async function run(){
  const {targetInfos}=await send("Target.getTargets");
  ({sessionId}=await send("Target.attachToTarget",{targetId:targetInfos.find(a=>a.type==="page").targetId,flatten:true}));
  await send("Page.enable");
  for(const [entry,mobile,flavors] of [["dist",false,["classic","fragola","banana","mirtillo","kiwi"]],["src",true,["kiwi"]]]){
    await send("Emulation.setDeviceMetricsOverride",{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:mobile?3:1,mobile});
    const file=path.resolve(__dirname,"..","milkshake-brand-landing-page-css-slider-marquee-ticker-custom-cursor",entry,"index.html");
    await send("Page.navigate",{url:pathToFileURL(file).href+"#shakes"});
    await until(`typeof videos!=="undefined" && [...videos.values()].every(v=>v.readyState>=2)`);
    await until(`Math.abs(showcase.getBoundingClientRect().top)<4`);
    for(const key of flavors){
      const state=await js(`document.querySelector('[data-select-flavor="${key}"]').click(); (()=>{const v=videos.get(selected);return [selected,v.paused,v.duration,v.videoWidth,v.currentSrc.split('/').pop()];})()`);
      assert.deepEqual(state,[key,false,3,1920,key+"-smooth.mp4"]);
      await until(`videos.get(selected).ended`);
      if(key==="banana" || mobile){
        const {data}=await send("Page.captureScreenshot",{format:"png"});
        fs.writeFileSync(path.join(__dirname,entry+"-"+key+".png"),Buffer.from(data,"base64"));
      }
      console.log(entry,key,"played to final splash");
    }
    assert.ok(await js(`brick.click(); videos.get(selected).currentTime<.25 && !videos.get(selected).paused`));
  }
}
const timer=setTimeout(()=>{process.exitCode=1;chrome.kill();},50_000);
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{clearTimeout(timer);chrome.kill();});
