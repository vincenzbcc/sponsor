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
  const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception.description);
  return result.result.value;
}
const delay=(ms)=>new Promise(r=>setTimeout(r,ms));
async function until(expression){
  for(let n=0;n<145;n++){ if(await js(expression))return; await delay(40); }
  throw Error(expression);
}
async function open(entry,width,height,mobile){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:mobile?3:1,mobile});
  const file=path.resolve(__dirname,"..","milkshake-brand-landing-page-css-slider-marquee-ticker-custom-cursor",entry,"index.html");
  await send("Page.navigate",{url:pathToFileURL(file).href+"#shakes"});
  await until(`typeof clips!=="undefined" && clips.size===5 && Math.abs(showcase.getBoundingClientRect().top)<4`);
}
async function screenshot(file){
  const {data}=await send("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync(path.join(__dirname,file+".png"),Buffer.from(data,"base64"));
  return data;
}
async function click(key){
  return js(`document.querySelector('[data-select-flavor="${key}"]').click(); [selected, getComputedStyle(showcase).getPropertyValue("--spot").trim(), getComputedStyle(showcase.querySelector(".flavor-art"),"::before").backgroundImage]`);
}
async function run(){
  const {targetInfos}=await send("Target.getTargets");
  ({sessionId}=await send("Target.attachToTarget",{targetId:targetInfos.find(a=>a.type==="page").targetId,flatten:true}));
  await send("Page.enable");
  await open("dist",1440,900,false);
  await until(`useVideo && [...clips.values()].every(v=>v.readyState>=2)`);
  for(const [key,spot] of Object.entries({classic:"#fff2d3",fragola:"#ffc0c9",banana:"#ffedaa",mirtillo:"#e1d0ff",kiwi:"#edfa9d"})){
    const state=await click(key);
    assert.deepEqual(state.slice(0,2),[key,spot]);
    assert.match(state[2],/radial-gradient/);
    assert.deepEqual(await js(`(() => {const v=clips.get(selected);return [v.paused,v.duration,v.videoWidth,v.currentSrc.split('/').pop(),getComputedStyle(v).maskImage]})()`),
      [false,3,1920,key+"-cutout.webm","none"]);
    await until(`clips.get(selected).ended`);
    if(key==="banana" || key==="classic") await screenshot("desktop-"+key);
    console.log(key,"video then held splash, spotlight verified");
  }
  await send("Input.dispatchMouseEvent",{type:"mouseMoved",x:1030,y:410});
  await delay(420);
  const transform=await js(`[getComputedStyle(brickMedia).transform,getComputedStyle(showcase.querySelector('.flavor-fruit-set.is-visible .flavor-fruit')).transform]`);
  assert.equal(transform[0],transform[1]);
  assert.notEqual(transform[0],"matrix(1, 0, 0, 1, 0, 0)");
  assert.ok(await js(`brick.click(); clips.get(selected).currentTime<.25 && !clips.get(selected).paused`));
  await click("fragola"); await click("banana");
  assert.deepEqual(await js(`[...clips].filter(([,v])=>!v.paused).map(([k])=>k)`),["banana"]);
  await open("src",390,844,true);
  await until(`useVideo && [...clips.values()].every(v=>v.readyState>=2)`);
  await click("kiwi");
  await until(`clips.get('kiwi').ended`);
  await screenshot("mobile-kiwi");
  assert.equal(await js(`document.documentElement.scrollWidth`),390);
  await send("Page.addScriptToEvaluateOnNewDocument",{source:`Object.defineProperty(navigator,"vendor",{get:()=>"Apple Computer, Inc."});`});
  await open("dist",390,844,true);
  assert.equal(await js(`useVideo`),false);
  await click("kiwi");
  await until(`clips.get("kiwi").complete && clips.get("kiwi").naturalWidth===768`);
  const reference=await screenshot("fallback-kiwi-start");
  await delay(1050);
  const during=await screenshot("fallback-kiwi-motion");
  assert.notEqual(reference,during);
  await delay(2400);
  const end=await screenshot("fallback-kiwi-end");
  await delay(140);
  assert.equal(end,await screenshot("fallback-kiwi-still"));
  await click("kiwi");
  await until(`clips.get("kiwi").complete && clips.get("kiwi").naturalWidth===768`);
  assert.notEqual(end,await screenshot("fallback-kiwi-replay"));
  console.log("shared pointer motion, mobile video and one-pass animated fallback verified");
}
const timer=setTimeout(()=>{process.exitCode=1;chrome.kill();},65_000);
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{clearTimeout(timer);chrome.kill();});
