import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.4.2/lib/three-vrm.module.js';

const MODEL_URL='https://raw.githubusercontent.com/madjin/vrm-samples/master/Avatar_Orion.vrm';
const canvas=document.querySelector('#avatarCanvas'), loading=document.querySelector('#avatarLoading');
const fallback=document.querySelector('#avatarFallback'), statusText=document.querySelector('#statusText');
let renderer,scene,camera,vrm,mixer,clock=new THREE.Clock(),speaking=false,listening=false,micStream=null,analyser=null,audioContext=null;
function setup(){
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(30,canvas.clientWidth/canvas.clientHeight,.1,100);camera.position.set(0,1.35,3.8);
 scene.add(new THREE.HemisphereLight(0xc8eaff,0x17263b,2));
 const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(1,2,3);scene.add(key);
 const rim=new THREE.PointLight(0x38cfff,30,8);rim.position.set(-1,1.8,-1);scene.add(rim);
 const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
 loader.load(MODEL_URL,g=>{
  vrm=g.userData.vrm;VRMUtils.rotateVRM0(vrm);scene.add(vrm.scene);
  vrm.scene.position.set(0,-1.05,0);vrm.scene.rotation.y=Math.PI;
  // Aim framing toward head/torso; model height varies by source.
  camera.position.set(0,1.25,3.7);camera.lookAt(0,1.15,0);
  loading.style.display='none';
 },undefined,err=>{console.error(err);loading.style.display='none';canvas.style.display='none';fallback.hidden=false;});
 function animate(){
  requestAnimationFrame(animate);const dt=clock.getDelta(),t=clock.elapsedTime;
  if(vrm){
   vrm.update(dt);
   const e=vrm.expressionManager;
   if(e){
    // Gentle idle blink; VRM expression names are standard where provided.
    const blink=(Math.sin(t*0.65)+Math.sin(t*0.23+2))*0.5;
    if(!listening&&!speaking && (Math.sin(t*0.75)>0.985)) e.setValue('blink',1);
    else e.setValue('blink',Math.max(0,blink>0.96?(blink-.96)*22:0));
    let mouth=0;
    if(speaking) mouth=.16+Math.abs(Math.sin(t*12))*.23;
    if(listening&&analyser){const data=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(data);let sum=0;for(const v of data){const x=(v-128)/128;sum+=x*x;}mouth=Math.min(.8,Math.sqrt(sum/data.length)*5);}
    e.setValue('aa',mouth);e.setValue('ih',mouth*.18);
   }
   // tiny natural head sway
   const head=vrm.humanoid?.getNormalizedBoneNode('head');if(head&&!speaking&&!listening)head.rotation.y=Math.sin(t*.45)*.035;
  }
  renderer.render(scene,camera);
 }
 animate();
}
setup();
window.addEventListener('resize',()=>{if(!renderer)return;const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});
const messages=document.querySelector('#messages'),input=document.querySelector('#messageInput');
function addMessage(text,who){const el=document.createElement('div');el.className='message '+who;el.textContent=text;messages.append(el);messages.scrollTop=messages.scrollHeight;}
function replyFor(text){const q=text.toLowerCase();if(/سلام|درود|hi|hello/.test(q))return'سلام به روی ماهت! خوشحالم که اومدی. 😊';if(/اسم|نام/.test(q))return'من ALPHA هستم؛ یک همراه دیجیتالی مهربون.';if(/خوبی|حالت/.test(q))return'من خوبم، ممنون که پرسیدی! تو چطوری؟';if(/کمک|راهنمایی/.test(q))return'حتماً! بگو دقیقاً در چه زمینه‌ای کمکت کنم تا با هم حلش کنیم.';return'پیامت رو دریافت کردم! فعلاً در نسخه نمایشی هستم و برای پاسخ‌های هوشمند واقعی باید سرویس هوش مصنوعی و سرور به پروژه وصل بشه. ✨';}
function speak(text){if(!('speechSynthesis'in window)||document.body.dataset.mute==='yes')return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fa-IR';u.rate=.95;u.pitch=1.05;u.onstart=()=>{speaking=true;statusText.textContent='ALPHA در حال صحبت است…'};u.onend=()=>{speaking=false;statusText.textContent='در انتظار پیام تو'};speechSynthesis.speak(u);}
function send(){const text=input.value.trim();if(!text)return;addMessage(text,'user');input.value='';statusText.textContent='ALPHA در حال فکر کردن…';setTimeout(()=>{const answer=replyFor(text);addMessage(answer,'bot');speak(answer);if(!speaking)statusText.textContent='در انتظار پیام تو';},450);}
document.querySelector('#sendBtn').addEventListener('click',send);
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
document.querySelector('#newChat').addEventListener('click',()=>{messages.innerHTML='';addMessage('گفتگوی تازه شروع شد! چه چیزی توی ذهنته؟','bot');});
document.querySelector('#soundToggle').addEventListener('click',()=>{document.body.dataset.mute=document.body.dataset.mute==='yes'?'no':'yes';if(document.body.dataset.mute==='yes')speechSynthesis.cancel();});
const micBtn=document.querySelector('#micBtn');
micBtn.addEventListener('click',async()=>{
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){addMessage('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود. از Chrome یا Edge استفاده کن.','bot');return;}
 if(listening){listening=false;micBtn.classList.remove('listening');statusText.textContent='در انتظار پیام تو';if(micStream)micStream.getTracks().forEach(t=>t.stop());return;}
 try{
  micStream=await navigator.mediaDevices.getUserMedia({audio:true});audioContext=new AudioContext();const src=audioContext.createMediaStreamSource(micStream);analyser=audioContext.createAnalyser();analyser.fftSize=256;src.connect(analyser);
 }catch(err){addMessage('برای حرکت دهان هنگام صحبت، اجازه میکروفون را فعال کن.','bot');}
 const rec=new SR();rec.lang='fa-IR';rec.interimResults=true;rec.continuous=false;listening=true;micBtn.classList.add('listening');statusText.textContent='دارم گوش می‌کنم…';
 rec.onresult=e=>{let final='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript;}if(final){input.value=final;listening=false;micBtn.classList.remove('listening');if(micStream)micStream.getTracks().forEach(t=>t.stop());send();}};
 rec.onerror=()=>{listening=false;micBtn.classList.remove('listening');statusText.textContent='در انتظار پیام تو';if(micStream)micStream.getTracks().forEach(t=>t.stop());};
 rec.onend=()=>{if(listening){listening=false;micBtn.classList.remove('listening');statusText.textContent='در انتظار پیام تو';if(micStream)micStream.getTracks().forEach(t=>t.stop());}};
 rec.start();
});
