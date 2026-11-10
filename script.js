const form=document.getElementById('chatForm');
const input=document.getElementById('messageInput');
const messages=document.getElementById('messages');
const clearBtn=document.getElementById('clearBtn');

function addMessage(text,who){
  const row=document.createElement('div'); row.className=`message ${who}`;
  const avatar=document.createElement('span'); avatar.className='avatar'; avatar.textContent=who==='bot'?'A':'شما';
  const bubble=document.createElement('div'); bubble.className='bubble'; bubble.textContent=text;
  row.append(avatar,bubble); messages.append(row); messages.scrollTop=messages.scrollHeight;
}
function reply(text){
  const t=text.trim();
  if(/سلام|درود|hello/i.test(t)) return 'سلام به روی ماهت! 😊 خوشحالم اومدی. دوست داری درباره چی گپ بزنیم؟';
  if(/خودت|معرفی/i.test(t)) return 'من آلفا هستم؛ یک ربات نمایشی مهربون و فارسی‌زبان. فعلاً در نسخه آزمایشی‌ام و جواب‌هام از قبل تعریف شدن.';
  if(/جوک|خنده/i.test(t)) return 'یه روز کامپیوتر رفت دکتر؛ گفت: هرچی می‌خورم ویروسم خوب نمی‌شه! 😄';
  if(/اسم|نام/i.test(t)) return 'اسم من ALPHA هست؛ خوش اومدی دوست من!';
  if(/خداحافظ|فعلا|بای/i.test(t)) return 'فعلاً دوست من! هر وقت برگشتی من همین‌جام. 👋';
  if(/دوست/i.test(t)) return 'چه خوب! منم خوشحالم باهات آشنا شدم. 😊';
  return 'چه سؤال جالبی! 🌟 من فعلاً نسخه نمایشی آلفا هستم و هنوز به هوش مصنوعی واقعی وصل نشدم. بعداً می‌تونیم این قابلیت رو به من اضافه کنیم.';
}
form.addEventListener('submit',e=>{
  e.preventDefault(); const value=input.value.trim(); if(!value)return;
  addMessage(value,'user'); input.value='';
  setTimeout(()=>addMessage(reply(value),'bot'),350);
});
document.querySelectorAll('.suggestions button').forEach(btn=>btn.addEventListener('click',()=>{
  input.value=btn.textContent; form.requestSubmit();
}));
clearBtn.addEventListener('click',()=>{
  messages.innerHTML='';
  addMessage('گفتگوی تازه شروع شد! 😊 چی تو ذهنته؟','bot');
});
