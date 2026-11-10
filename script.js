import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
// Procedural 3D avatar: no external character file is needed.
const canvas=document.querySelector('#avatar');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,canvas.clientWidth/canvas.clientHeight,.1,100);camera.position.set(0,1.35,5.3);
scene.add(new THREE.HemisphereLight(0xcceeff,0x19283b,2.1));const key=new THREE.DirectionalLight(0xffffff,2.8);key.position.set(2,3,4);scene.add(key);const rim=new THREE.PointLight(0x39cfff,24,9);rim.position.set(-2,2,-2);scene.add(rim);
const avatar=new THREE.Group();scene.add(avatar);
const mat=(color,rough=.65,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const skin=mat(0xe5c6b7,.8),hair=mat(0xe7f0f7,.34),hairShade=mat(0xb9cad8,.45),jacket=mat(0x152d43,.45,.35),white=mat(0xeaf5fb,.35,.15),blue=mat(0x43cfff,.25,.25),dark=mat(0x14212c,.25),iris=mat(0x38b9f2,.2),mouthMat=mat(0x653b42);
function ball(parent,x,y,z,sx,sy,sz,material){let m=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m}
function capsule(parent,a,b,r,material){let d=new THREE.Vector3().subVectors(b,a);let m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),16),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(m);return m}
// torso, neck, head
ball(avatar,0,.05,0,.83,.95,.43,jacket);ball(avatar,0,.05,.435,.47,.78,.055,white);
ball(avatar,0,.91,0,.23,.34,.23,skin);
const head=new THREE.Group();head.position.set(0,1.72,0);avatar.add(head);
ball(head,0,0,0,.58,.75,.48,skin);
// ears
ball(head,-.57,-.02,0,.12,.2,.13,skin);ball(head,.57,-.02,0,.12,.2,.13,skin);
// hair cap + fringe locks
ball(head,0,.48,-.02,.61,.37,.52,hair);
for(let i=0;i<7;i++){let x=-.48+i*.16;let lock=ball(head,x,.35,.28,.14,.34,.15,i%2?hair:hairShade);lock.rotation.z=(i-3)*-.12;}
for(let i=0;i<5;i++){let x=-.48+i*.24;let lock=ball(head,x,.12,-.32,.17,.43,.18,hair);lock.rotation.z=(i-2)*.12;}
// eyes, whites, iris, pupils and brows
const eyeGroups=[];
for(const x of [-.23,.23]){let eg=new THREE.Group();eg.position.set(x,.1,.414);head.add(eg);ball(eg,0,0,0,.145,.09,.055,white);ball(eg,0,0,.05,.064,.066,.025,iris);ball(eg,0,0,.072,.028,.04,.012,dark);ball(eg,-.02,.025,.084,.012,.012,.008,white);let brow=ball(head,x,.255,.405,.17,.035,.045,hairShade);brow.rotation.z=x<0?-.08:.08;eyeGroups.push(eg)}
// nose, mouth (animated scale)
ball(head,0,-.09,.47,.07,.14,.075,skin);
const mouth=ball(head,0,-.34,.435,.105,.025,.025,mouthMat);
const smile= new THREE.Mesh(new THREE.TorusGeometry(.105,.012,8,24,Math.PI),mat(0x9c6265));smile.position.set(0,-.32,.443);smile.rotation.z=Math.PI;head.add(smile);
// collar and cyan details
const collarL=ball(avatar,-.2,.68,.34,.2,.34,.09,white);collarL.rotation.z=-.4;const collarR=ball(avatar,.2,.68,.34,.2,.34,.09,white);collarR.rotation.z=.4;
capsule(avatar,new THREE.Vector3(0,-.45,.49),new THREE.Vector3(0,.48,.49),.012,blue);
const mouse={x:0,y:0};window.addEventListener('pointermove',e=>{mouse.x=(e.clientX/innerWidth-.5)*2;mouse.y=(e.clientY/innerHeight-.5)*2});
let speaking=false,listening=false,audioAnalyser=null,stream=null;
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();head.rotation.y+=(mouse.x*.22-head.rotation.y)*.035;head.rotation.x+=(-mouse.y*.09-head.rotation.x)*.035;avatar.position.y=Math.sin(t*1.2)*.018;
let open= speaking ? .09+Math.abs(Math.sin(t*11))*.16 : 0;
if(listening&&audioAnalyser){let ar=new Uint8Array(audioAnalyser.fftSize);audioAnalyser.getByteTimeDomainData(ar);let sum=0;for(let v of ar){let q=(v-128)/128;sum+=q*q}open=Math.min(.24,Math.sqrt(sum/ar.length)*1.6)}
mouth.scale.y=.02+open;
const blink=Math.sin(t*.72)>0.994?0.08:1;eyeGroups.forEach(g=>{g.scale.y+=(blink-g.scale.y)*.3});
renderer.render(scene,camera)}animate();
window.addEventListener('resize',()=>{let w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()});
const box=document.querySelector('#messages'),input=document.querySelector('#input');
function add(text,who){let el=document.createElement('div');el.className='msg '+who;el.textContent=text;box.append(el);box.scrollTop=box.scrollHeight}
function answer(q){if(/سلام|درود|hello/i.test(q))return'سلام! خیلی خوشحالم که با من حرف می‌زنی. 😊';if(/خوبی|حالت/.test(q))return'من خوبم، ممنون که پرسیدی! تو چطوری؟';if(/اسم|نام/.test(q))return'من ALPHA هستم، همراه دیجیتالی مهربون تو.';return'پیامت رو گرفتم! این نسخه فعلاً نمایشی است؛ برای پاسخ هوشمند واقعی باید سرویس هوش مصنوعی امن به سایت وصل شود. ✨'}
function say(text){if(!('speechSynthesis'in window))return; speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang='fa-IR';u.onstart=()=>speaking=true;u.onend=()=>speaking=false;speechSynthesis.speak(u)}
function send(){let q=input.value.trim();if(!q)return;add(q,'user');input.value='';let a=answer(q);setTimeout(()=>{add(a,'bot');say(a)},350)}
document.querySelector('#send').onclick=send;input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
document.querySelector('#newChat').onclick=()=>{box.innerHTML='';add('گفتگوی جدید شروع شد! چه چیزی دوست داری بپرسی؟','bot')};
document.querySelector('#mic').onclick=async()=>{let SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){add('برای تشخیص صدای فارسی از Chrome یا Edge استفاده کن.','bot');return}try{stream=await navigator.mediaDevices.getUserMedia({audio:true});let ctx=new AudioContext();audioAnalyser=ctx.createAnalyser();audioAnalyser.fftSize=256;ctx.createMediaStreamSource(stream).connect(audioAnalyser)}catch(e){add('اجازه میکروفون را فعال کن.','bot')}
let rec=new SR();rec.lang='fa-IR';rec.onstart=()=>listening=true;rec.onresult=e=>{let s=e.results[e.results.length-1][0].transcript;if(e.results[e.results.length-1].isFinal){listening=false;input.value=s;send()}};rec.onerror=()=>listening=false;rec.onend=()=>{listening=false;if(stream)stream.getTracks().forEach(t=>t.stop())};rec.start()};
