/* â”€â”€ FLICK CHAT â”€â”€ */
'use strict';

const CHAT = { convId: null, userId: null, prevFiles: [] };

const EMOJIS = {
  'ðŸ• Recent': [],
  'ðŸ˜€ Smileys': ['ðŸ˜€','ðŸ˜ƒ','ðŸ˜„','ðŸ˜','ðŸ˜†','ðŸ˜…','ðŸ˜‚','ðŸ¤£','ðŸ˜Š','ðŸ˜‡','ðŸ™‚','ðŸ˜‰','ðŸ˜','ðŸ¥°','ðŸ˜˜','ðŸ˜‹','ðŸ˜œ','ðŸ¤ª','ðŸ˜Ž','ðŸ¥¸','ðŸ¤©','ðŸ¥³','ðŸ˜','ðŸ˜’','ðŸ˜ž','ðŸ˜Ÿ','ðŸ™','ðŸ˜£','ðŸ˜–','ðŸ˜«','ðŸ˜©','ðŸ¥º','ðŸ˜¢','ðŸ˜­','ðŸ˜¤','ðŸ˜ ','ðŸ˜¡','ðŸ¤¬','ðŸ¤¯','ðŸ˜³','ðŸ¥µ','ðŸ¥¶','ðŸ˜±','ðŸ˜¨','ðŸ˜°','ðŸ˜“','ðŸ¤—','ðŸ¤”','ðŸ¤­','ðŸ¤«','ðŸ¤¥','ðŸ˜¶','ðŸ˜','ðŸ˜‘','ðŸ˜¬','ðŸ™„','ðŸ˜¯','ðŸ˜®','ðŸ˜²','ðŸ¥±','ðŸ˜´','ðŸ¤¤','ðŸ˜µ','ðŸ¤','ðŸ¥´','ðŸ¤¢','ðŸ¤®','ðŸ¤§','ðŸ˜·','ðŸ¤’','ðŸ¤•'],
  'ðŸ‘‹ People': ['ðŸ‘‹','ðŸ¤š','ðŸ–','âœ‹','ðŸ‘Œ','ðŸ¤Œ','âœŒï¸','ðŸ¤ž','ðŸ¤Ÿ','ðŸ¤˜','ðŸ¤™','ðŸ‘ˆ','ðŸ‘‰','ðŸ‘†','ðŸ‘‡','ðŸ‘','ðŸ‘Ž','âœŠ','ðŸ‘Š','ðŸ‘','ðŸ™Œ','ðŸ‘','ðŸ¤²','ðŸ¤','ðŸ™','âœï¸','ðŸ’…','ðŸ’ª','ðŸ¦µ','ðŸ¦¶','ðŸ‘‚','ðŸ‘ƒ','ðŸ‘€','ðŸ‘…','ðŸ‘„','ðŸ§ ','ðŸ¦·','ðŸ‘¶','ðŸ‘¦','ðŸ‘§','ðŸ§‘','ðŸ‘±','ðŸ‘¨','ðŸ‘©','ðŸ§“','ðŸ‘´','ðŸ‘µ'],
  'â¤ï¸ Hearts': ['â¤ï¸','ðŸ§¡','ðŸ’›','ðŸ’š','ðŸ’™','ðŸ’œ','ðŸ–¤','ðŸ¤','ðŸ¤Ž','ðŸ’”','â¤ï¸â€ðŸ”¥','ðŸ’•','ðŸ’ž','ðŸ’“','ðŸ’—','ðŸ’–','ðŸ’˜','ðŸ’','ðŸ’Ÿ','ðŸ’Œ','ðŸ’‹','ðŸ’¯','ðŸ’¢','ðŸ’¥','ðŸ’¦','ðŸ’¨','ðŸ’«','ðŸ’¬','ðŸ’­','ðŸ’¤'],
  'ðŸ¶ Animals': ['ðŸ¶','ðŸ±','ðŸ­','ðŸ¹','ðŸ°','ðŸ¦Š','ðŸ»','ðŸ¼','ðŸ¨','ðŸ¯','ðŸ¦','ðŸ®','ðŸ·','ðŸ¸','ðŸµ','ðŸ™ˆ','ðŸ™‰','ðŸ™Š','ðŸ”','ðŸ§','ðŸ¦','ðŸ¤','ðŸ¦†','ðŸ¦…','ðŸ¦‰','ðŸ¦‡','ðŸº','ðŸ´','ðŸ¦„','ðŸ','ðŸ¦‹','ðŸŒ','ðŸž','ðŸœ','ðŸ¢','ðŸ','ðŸ¦Ž','ðŸ™','ðŸ¦‘','ðŸ¦','ðŸ¦€','ðŸ¡','ðŸ ','ðŸŸ','ðŸ¬','ðŸ³','ðŸ‹','ðŸ¦ˆ','ðŸŠ','ðŸ…','ðŸ†','ðŸ¦“','ðŸ¦','ðŸ˜','ðŸ¦›','ðŸ¦','ðŸª','ðŸ¦’','ðŸ¦˜','ðŸ•','ðŸ©','ðŸˆ','ðŸ‡','ðŸ¿','ðŸ¦”'],
  'ðŸŽ Food': ['ðŸ','ðŸŽ','ðŸ','ðŸŠ','ðŸ‹','ðŸŒ','ðŸ‰','ðŸ‡','ðŸ“','ðŸ«','ðŸ‘','ðŸ¥­','ðŸ','ðŸ¥¥','ðŸ¥','ðŸ…','ðŸ†','ðŸ¥‘','ðŸ¥¦','ðŸ¥¬','ðŸŒ¶','ðŸ§„','ðŸ§…','ðŸ¥”','ðŸ ','ðŸ¥','ðŸ¥¯','ðŸž','ðŸ§€','ðŸ¥š','ðŸ³','ðŸ§ˆ','ðŸ¥ž','ðŸ¥“','ðŸ¥©','ðŸ—','ðŸ–','ðŸŒ­','ðŸ”','ðŸŸ','ðŸ•','ðŸŒ®','ðŸŒ¯','ðŸ','ðŸœ','ðŸ²','ðŸ›','ðŸ£','ðŸ±','ðŸ¦ª','ðŸ¤','ðŸ™','ðŸš','ðŸ§','ðŸ°','ðŸŽ‚','ðŸ­','ðŸ¬','ðŸ«','ðŸ¿','ðŸ©','ðŸª','â˜•','ðŸµ','ðŸ§‹','ðŸº','ðŸ·','ðŸ§ƒ','ðŸ¥¤'],
  'âš½ Sports': ['âš½','ðŸ€','ðŸˆ','âš¾','ðŸ¥Ž','ðŸ','ðŸ‰','ðŸŽ¾','ðŸ¸','ðŸ’','ðŸ¥Š','ðŸ¥‹','â›³','ðŸŽ£','ðŸŽ½','ðŸŽ¿','ðŸ¥Œ','ðŸŽ¯','ðŸŽ±','ðŸ”®','ðŸŽ®','ðŸ•¹','ðŸŽ²','ðŸ§©','ðŸ†','ðŸ¥‡','ðŸ¥ˆ','ðŸ¥‰','ðŸ…','ðŸŽ–','ðŸŽ­','ðŸŽ¨','ðŸŽ¬','ðŸŽ¤','ðŸŽ§','ðŸŽ¼','ðŸŽµ','ðŸŽ¶'],
  'ðŸŒ Travel': ['ðŸš—','ðŸš•','ðŸš™','ðŸŽ','ðŸš“','ðŸš‘','ðŸš’','ðŸš','ðŸ›»','ðŸšš','ðŸš›','ðŸ','ðŸ›µ','ðŸš²','ðŸ›´','âœˆï¸','ðŸš€','ðŸ›¸','ðŸš','â›µ','ðŸš¤','ðŸ›¥','ðŸš¢','âš“','ðŸ—º','ðŸ§­','ðŸ”','â›°','ðŸŒ‹','ðŸ•','ðŸ–','ðŸœ','ðŸ','ðŸ›','ðŸ™','ðŸŒƒ','ðŸŒ†','ðŸŒ‡','ðŸŒ‰','ðŸŒŒ','ðŸŒ ','ðŸŒ„','ðŸŒ…'],
  'ðŸ”¥ Popular': ['ðŸ”¥','ðŸ’¯','âœ¨','âš¡','ðŸŒŸ','ðŸ’«','â­','ðŸŒˆ','ðŸŽ¯','ðŸ’¥','ðŸš€','ðŸŒ™','â˜€ï¸','â„ï¸','ðŸŒŠ','ðŸ€','ðŸ¦‹','ðŸŒ¸','ðŸŒº','ðŸŒ¹','ðŸŒ»','ðŸ‘‘','ðŸ’Ž','ðŸŽ‰','ðŸŽŠ','ðŸŽˆ','ðŸ™','ðŸ‘','ðŸ’ª','âœ…','âŒ','âš ï¸','ðŸ”ž','ðŸ†•','ðŸ†“','ðŸŽ','ðŸŽ€'],
};

/* â•â• CONVERSATIONS â•â• */
async function loadConversations() {
  const list = document.getElementById('conv-list'); if (!list) return;
  try {
    const d = await MessagesAPI.conversations();
    if (!d.conversations.length) { list.innerHTML='<div class="empty-state"><div class="empty-ico">ðŸ’¬</div><h3>No messages yet</h3><p>Start a conversation</p></div>'; return; }
    list.innerHTML = d.conversations.map((c,i) => {
      const last = c.last_message, user = c.user;
      const prev = last ? ({'image':'ðŸ“· Photo','video':'ðŸŽ¥ Video','audio':'ðŸŽ¤ Audio','doc':'ðŸ“„ Doc','location':'ðŸ“ Location'}[last.type] || last.text) : 'Start chatting';
      return `<div class="conv-item ${CHAT.userId===user.id?'active':''}" data-uid="${user.id}" data-cid="${c.id}" onclick="openChat(${user.id})" style="animation:postIn .25s ${i*40}ms both">
        <div class="conv-av-wrap"><img class="conv-av" src="${user.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff'"/>${user.is_online?'<div class="conv-online"></div>':''}</div>
        <div class="conv-info"><div class="conv-top"><span class="conv-name">${esc(user.name)}</span><span class="conv-time">${last?fmtChatTime(last.created_at):''}</span></div><div class="conv-preview ${c.unread?'unread':''}">${esc(prev)}</div></div>
        ${c.unread?`<div class="conv-badge">${c.unread}</div>`:''}
      </div>`;
    }).join('');
    const totalUnread = d.conversations.reduce((s,c)=>s+(c.unread||0),0);
    ['sb-msg-badge','bn-msg-dot','msg-dot'].forEach(id=>{ const el=document.getElementById(id); if(el){el.style.display=totalUnread>0?'flex':'none'; if(el.tagName!=='SPAN'||id==='sb-msg-badge') el.textContent=totalUnread||'';} });
  } catch {}
}

function switchChatTab(btn, type) { document.querySelectorAll('.ctab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); loadConversations(); }
function searchMsgs(q) { document.querySelectorAll('.conv-item').forEach(item=>{ const name=item.querySelector('.conv-name')?.textContent.toLowerCase()||''; item.style.display=name.includes(q.toLowerCase())?'':'none'; }); }

/* â•â• OPEN CHAT â•â• */
async function openChat(userId) {
  CHAT.userId = userId;
  CHAT.prevFiles = [];
  document.querySelectorAll('.conv-item').forEach(el=>el.classList.toggle('active',parseInt(el.dataset.uid)===userId));
  const right = document.getElementById('chat-right');
  right.innerHTML = '<div class="center-pad" style="height:100%"><div class="spin"></div></div>';
  // On mobile: show right panel
  if (window.innerWidth < 768) { document.getElementById('chat-left').style.display='none'; right.style.display='flex'; }
  try {
    const d = await MessagesAPI.getChat(userId);
    CHAT.convId = d.conversation.id;
    buildChatWindow(d.conversation, d.messages);
  } catch(e) { right.innerHTML=`<div class="chat-empty"><div class="chat-empty-ico"><i class="fa-solid fa-message"></i></div><div class="chat-empty-sub">${e.message}</div></div>`; }
}

function buildChatWindow(conv, msgs) {
  const user = conv.user, me = Auth.getUser();
  const right = document.getElementById('chat-right');
  right.innerHTML = `
<div class="chat-win-head">
  <button class="ico-btn chat-back-btn" onclick="closeChatMobile()" style="display:${window.innerWidth<768?'flex':'none'}"><i class="fa-solid fa-arrow-left"></i></button>
  <img class="chat-win-av" src="${user.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff'"/>
  <div class="chat-win-info">
    <div class="chat-win-name">${esc(user.name)}</div>
    <div class="chat-win-status ${user.is_online?'':'offline'}" id="cw-status">${user.is_online?'â— Online':'Last seen recently'}</div>
  </div>
  <div class="chat-win-acts">
    <button class="ico-btn" onclick="showToast('Calling ${esc(user.name)}â€¦ ðŸ“ž')"><i class="fa-solid fa-phone"></i></button>
    <button class="ico-btn" onclick="showToast('Video callâ€¦ ðŸ“¹')"><i class="fa-solid fa-video"></i></button>
    <button class="ico-btn" onclick="openChatInfo(user)"><i class="fa-solid fa-circle-info"></i></button>
  </div>
</div>
<div id="chat-prev-bar" class="chat-prev-bar" style="display:none"></div>
<div class="chat-msgs" id="chat-msgs"></div>
<div class="chat-inp-bar">
  <button class="chat-plus-btn" id="chat-plus" onclick="toggleAttach()"><i class="fa-solid fa-plus"></i></button>
  <div class="chat-inp-wrap">
    <textarea class="chat-textarea" id="chat-ta" placeholder="Messageâ€¦" rows="1" oninput="onChatInput(this)" onkeydown="onChatKey(event)"></textarea>
    <button class="chat-emoji-ico" onclick="toggleEmojiPanel()"><i class="fa-regular fa-face-smile"></i></button>
  </div>
  <button class="send-btn" id="chat-send" onclick="sendMsg()"><i class="fa-solid fa-microphone"></i></button>
</div>`;
  renderMsgs(msgs, me?.id);
  setTimeout(() => { const m=document.getElementById('chat-msgs'); if(m) m.scrollTop=m.scrollHeight; }, 80);
}

function renderMsgs(msgs, myId) {
  const cont = document.getElementById('chat-msgs'); if (!cont) return;
  cont.innerHTML = ''; let lastDate = null;
  msgs.forEach(msg => {
    const d = new Date(msg.created_at).toDateString();
    if (d !== lastDate) { lastDate=d; const sep=document.createElement('div'); sep.className='date-sep'; sep.innerHTML=`<span>${fmtDateLabel(msg.created_at)}</span>`; cont.appendChild(sep); }
    cont.appendChild(buildBubble(msg, myId));
  });
}
function appendMsg(msg) {
  const cont=document.getElementById('chat-msgs'); if(!cont) return;
  const me=Auth.getUser(); cont.appendChild(buildBubble(msg,me?.id)); cont.scrollTop=cont.scrollHeight;
}
function buildBubble(msg, myId) {
  const mine = msg.sender_id === myId;
  const div = document.createElement('div'); div.className=`msg-bub ${mine?'sent':'recv'}`; div.dataset.msgId=msg.id;
  const t = new Date(msg.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
  const tick = mine ? `<i class="fa-solid fa-check-double msg-tick${msg.is_read?' read':''}"></i>` : '';
  const time = `<div class="msg-time">${t} ${tick}</div>`;
  if (msg.type==='image') {
    div.innerHTML=`<div class="msg-img-wrap" onclick="viewImg('${msg.file_url}')"><img src="${msg.file_url}" loading="lazy"/></div>${msg.text?`<div style="margin-top:5px">${esc(msg.text)}</div>`:''}${time}`;
  } else if (msg.type==='video') {
    div.innerHTML=`<div class="msg-file-bub"><div class="msg-file-ico" style="background:#3B82F622;color:#3B82F6"><i class="fa-solid fa-play"></i></div><div class="msg-file-info"><span class="msg-fname">${esc(msg.file_name||'Video')}</span><span class="msg-fsize">${fmtBytes(msg.file_size)}</span></div></div>${time}`;
  } else if (msg.type==='audio') {
    div.innerHTML=`<div class="msg-voice"><button class="voice-play" onclick="playAudio('${msg.file_url}',this)"><i class="fa-solid fa-play"></i></button><div class="voice-bars">${Array.from({length:22},()=>`<div class="voice-bar" style="height:${4+Math.random()*16}px"></div>`).join('')}</div></div>${time}`;
  } else if (msg.type==='doc') {
    const ext=(msg.file_name||'file').split('.').pop().toUpperCase();
    const clr={'PDF':'#EF4444','DOC':'#3B82F6','DOCX':'#3B82F6','XLS':'#22C55E','XLSX':'#22C55E','ZIP':'#8B5CF6'}[ext]||'#7C3AED';
    div.innerHTML=`<a href="${msg.file_url}" target="_blank" class="msg-file-bub"><div class="msg-file-ico" style="background:${clr}22;color:${clr}"><i class="fa-solid fa-file-alt"></i><span class="msg-file-ext" style="background:${clr}">${ext}</span></div><div class="msg-file-info"><span class="msg-fname">${esc(msg.file_name||'Document')}</span><span class="msg-fsize">${fmtBytes(msg.file_size)} Â· Tap to open</span></div><i class="fa-solid fa-download" style="color:var(--t3);font-size:14px"></i></a>${time}`;
  } else if (msg.type==='location') {
    div.innerHTML=`<a href="https://www.openstreetmap.org/?mlat=${msg.latitude}&mlon=${msg.longitude}#map=15" target="_blank" style="display:block;border-radius:12px;overflow:hidden;min-width:180px;text-decoration:none;color:inherit"><div style="height:70px;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:36px">ðŸ“</div><div style="padding:7px 10px;font-size:13px;font-weight:600">Current Location</div></a>${time}`;
  } else {
    div.innerHTML = `${esc(msg.text)}${time}`;
  }
  if (msg.reaction) { const r=document.createElement('div'); r.className='msg-react'; r.textContent=msg.reaction; div.appendChild(r); }
  div.addEventListener('contextmenu', e => { e.preventDefault(); showReactionPicker(div, msg.id); });
  return div;
}

/* â•â• SEND â•â• */
async function sendMsg() {
  const ta=document.getElementById('chat-ta'); const text=(ta?.value||'').trim();
  const prevBar=document.getElementById('chat-prev-bar'); const items=prevBar?Array.from(prevBar.querySelectorAll('.prev-item')):[]; 
  if (!text && !items.length) return;
  for (const item of items) {
    if (!item._file) continue;
    const form=new FormData(); form.append('receiver_id',CHAT.userId); form.append('file',item._file);
    try { const d=await MessagesAPI.sendFile(form); appendMsg(d.message); } catch(e){showToast(e.message);}
  }
  if (text) {
    if(ta) ta.value=''; updateSendBtn(false);
    const opt={id:Date.now(),sender_id:Auth.getUser()?.id,receiver_id:CHAT.userId,text,type:'text',is_read:false,created_at:new Date().toISOString()};
    appendMsg(opt);
    try { await MessagesAPI.send(CHAT.userId,text,'text'); } catch(e){showToast(e.message);}
  }
  if(prevBar){prevBar.innerHTML='';prevBar.style.display='none';}
  updateSendBtn(false); loadConversations();
}
function onChatKey(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }
function onChatInput(ta) { ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,110)+'px'; updateSendBtn(ta.value.trim().length>0||(document.getElementById('chat-prev-bar')?.children.length>0)); }
function updateSendBtn(hasContent) { const btn=document.getElementById('chat-send'); if(btn) btn.innerHTML=hasContent?'<i class="fa-solid fa-paper-plane"></i>':'<i class="fa-solid fa-microphone"></i>'; }
function closeChatMobile() { CHAT.userId=null; document.getElementById('chat-right').innerHTML=document.getElementById('chat-empty-state').outerHTML; document.getElementById('chat-left').style.display='flex'; }

/* â•â• ATTACH â•â• */
function toggleAttach() {
  const p=document.getElementById('attach-panel'), btn=document.getElementById('chat-plus');
  if(p.style.display==='grid'){p.style.display='none';btn.classList.remove('open');}
  else{p.style.display='grid';btn.classList.add('open');setTimeout(()=>document.addEventListener('click',()=>{p.style.display='none';btn.classList.remove('open');},{once:true}),100);}
}
function chatPickMedia()  { document.getElementById('chat-media-inp').click();  }
function chatPickCamera() { document.getElementById('chat-camera-inp').click(); }
function chatPickDoc()    { document.getElementById('chat-doc-inp').click();    }
function chatPickAudio()  { document.getElementById('chat-audio-inp').click();  }
function onChatFile(e, type) {
  document.getElementById('attach-panel').style.display='none';
  document.getElementById('chat-plus')?.classList.remove('open');
  const files=Array.from(e.target.files); if(!files.length) return;
  const bar=document.getElementById('chat-prev-bar'); bar.style.display='flex';
  files.forEach(file=>{const reader=new FileReader();reader.onload=ev=>{const item=document.createElement('div');item.className='prev-item';item._file=file;const isImg=file.type.startsWith('image/');item.innerHTML=isImg?`<img src="${ev.target.result}" class="prev-thumb" style="object-fit:cover"/>`:`<div class="prev-thumb" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:var(--c3)"><span style="font-size:22px">${file.type.startsWith('video/')?'ðŸŽ¥':file.type.startsWith('audio/')?'ðŸŽ¤':'ðŸ“„'}</span><span style="font-size:10px;color:var(--t3);max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</span></div>`;item.innerHTML+=`<button class="prev-rm" onclick="removePrev(this)"><i class="fa-solid fa-xmark"></i></button>`;bar.appendChild(item);updateSendBtn(true);};reader.readAsDataURL(file);});e.target.value='';
}
function removePrev(btn) { btn.parentElement.remove(); const bar=document.getElementById('chat-prev-bar'); if(!bar?.children.length){bar.style.display='none';const ta=document.getElementById('chat-ta');updateSendBtn(ta?.value.trim().length>0);} }
function chatSendLocation() {
  document.getElementById('attach-panel').style.display='none';
  if(!navigator.geolocation){showToast('Geolocation not supported');return;}
  showToast('Getting locationâ€¦ ðŸ“');
  navigator.geolocation.getCurrentPosition(async p=>{try{await MessagesAPI.send(CHAT.userId,'',{type:'location',latitude:p.coords.latitude,longitude:p.coords.longitude});showToast('Location sent ðŸ“');loadConversations();}catch(e){showToast(e.message);}},()=>showToast('Could not get location'));
}

/* â•â• EMOJI PANEL â•â• */
function toggleEmojiPanel() {
  const p=document.getElementById('emoji-panel');
  if(p.style.display==='flex'){p.style.display='none';return;}
  buildEmojiPanel(p); p.style.display='flex';
  setTimeout(()=>document.addEventListener('click',e=>{if(!e.target.closest('#emoji-panel')&&!e.target.closest('.chat-emoji-ico'))p.style.display='none';},{once:true}),100);
}
function buildEmojiPanel(p) {
  const recent=JSON.parse(localStorage.getItem('flick-emoji-recent')||'[]'); EMOJIS['ðŸ• Recent']=recent;
  const cats=Object.keys(EMOJIS); let activeCat=cats[0];
  p.innerHTML=`<div class="ep-search"><input class="ep-search-inp" placeholder="Search emojiâ€¦" oninput="filterEmojiPanel(this.value)" id="ep-q"/></div><div class="ep-cats" id="ep-cats">${cats.map((c,i)=>`<button class="ep-cat${i===0?' active':''}" onclick="showEmojiCat('${c.replace(/'/g,"\\'")}',this)" title="${c}">${c.split(' ')[0]}</button>`).join('')}</div><div class="ep-body" id="ep-body"></div>`;
  renderEmojiCat(cats[0]);
}
function renderEmojiCat(cat) { const body=document.getElementById('ep-body'); if(!body) return; const emojis=EMOJIS[cat]||[]; if(!emojis.length){body.innerHTML='<div class="ep-empty">No recent emojis yet</div>';return;} body.innerHTML=`<div class="ep-cat-label">${cat}</div><div class="ep-grid">${emojis.map(e=>`<button class="ep-emoji" onclick="pickEmoji('${e}')">${e}</button>`).join('')}</div>`; }
function showEmojiCat(cat,btn) { document.querySelectorAll('.ep-cat').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderEmojiCat(cat); }
function filterEmojiPanel(q) { const body=document.getElementById('ep-body'); if(!body) return; if(!q){renderEmojiCat(Object.keys(EMOJIS)[0]);return;} const all=Object.values(EMOJIS).flat().filter((e,i,a)=>a.indexOf(e)===i).slice(0,60); body.innerHTML=`<div class="ep-cat-label">Results</div><div class="ep-grid">${all.map(e=>`<button class="ep-emoji" onclick="pickEmoji('${e}')">${e}</button>`).join('')}</div>`; }
function pickEmoji(em) {
  const ta=document.getElementById('chat-ta'); if(!ta) return;
  const s=ta.selectionStart??ta.value.length; ta.value=ta.value.slice(0,s)+em+ta.value.slice(s); ta.focus(); ta.selectionStart=ta.selectionEnd=s+em.length; onChatInput(ta);
  let r=JSON.parse(localStorage.getItem('flick-emoji-recent')||'[]'); r=[em,...r.filter(e=>e!==em)].slice(0,32); localStorage.setItem('flick-emoji-recent',JSON.stringify(r)); EMOJIS['ðŸ• Recent']=r;
}

/* â•â• REACTIONS â•â• */
function showReactionPicker(bub, msgId) {
  document.getElementById('msg-rp-el')?.remove();
  const p=document.createElement('div'); p.id='msg-rp-el'; p.className='msg-rp';
  ['â¤ï¸','ðŸ˜‚','ðŸ˜®','ðŸ˜¢','ðŸ”¥','ðŸ‘','ðŸ™Œ','ðŸ˜'].forEach(em=>{const btn=document.createElement('button');btn.className='msg-rp-btn';btn.textContent=em;btn.onclick=async()=>{p.remove();try{const d=await MessagesAPI.react(msgId,em);let r=bub.querySelector('.msg-react');if(d.reaction){if(!r){r=document.createElement('div');r.className='msg-react';bub.appendChild(r);}r.textContent=d.reaction;}else if(r)r.remove();}catch{};};p.appendChild(btn);});
  const rect=bub.getBoundingClientRect(); p.style.top=Math.max(8,rect.top-54)+'px'; p.style.left=Math.min(window.innerWidth-310,Math.max(8,rect.left))+'px';
  document.body.appendChild(p); setTimeout(()=>document.addEventListener('click',()=>p.remove(),{once:true}),100);
}

/* â•â• NEW MSG MODAL â•â• */
async function openNewMsg() {
  document.getElementById('newmsg-overlay').style.display='flex';
  const list=document.getElementById('nm-list'); list.innerHTML='<div class="center-pad"><div class="spin"></div></div>';
  try { const d=await UsersAPI.suggested(); renderPeopleList(d.users); } catch { list.innerHTML='<div class="empty-state"><p>Could not load</p></div>'; }
}
function closeNewMsg(e) { if(!e||e.target===document.getElementById('newmsg-overlay')) document.getElementById('newmsg-overlay').style.display='none'; }
async function searchPeople(q) { if(!q.trim()){const d=await UsersAPI.suggested().catch(()=>({users:[]}));renderPeopleList(d.users);return;} try{const d=await UsersAPI.search(q);renderPeopleList(d.users);}catch{} }
function renderPeopleList(users) {
  const list=document.getElementById('nm-list'); if(!list) return;
  if(!users.length){list.innerHTML='<div class="empty-state"><p>No users found</p></div>';return;}
  list.innerHTML=users.map(u=>`<div class="conv-item" onclick="startNewChat(${u.id})"><div class="conv-av-wrap"><img class="conv-av" src="${u.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=7C3AED&color=fff'"/>${u.is_online?'<div class="conv-online"></div>':''}</div><div class="conv-info"><div class="conv-top"><span class="conv-name">${esc(u.name)}</span>${u.is_online?'<span style="color:var(--online);font-size:12px">â— Online</span>':''}</div><div class="conv-preview">@${u.username}</div></div></div>`).join('');
}
function startNewChat(userId) { closeNewMsg(); goto('chat'); openChat(userId); }

/* â•â• UTILS â•â• */
function fmtChatTime(d) { const dt=new Date(d),now=new Date(),diff=(now-dt)/1000; if(diff<60)return'now'; if(diff<3600)return Math.floor(diff/60)+'m'; if(diff<86400)return dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}); return dt.toLocaleDateString('en-US',{weekday:'short'}); }
function fmtDateLabel(d) { const dt=new Date(d),now=new Date(),diff=Math.floor((now-dt)/86400000); if(diff===0)return'Today'; if(diff===1)return'Yesterday'; return dt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }
function viewImg(url) { const v=document.getElementById('img-view'),s=document.getElementById('img-view-src'); if(v&&s){s.src=url;v.style.display='flex';} }
function playAudio(url,btn) { const a=new Audio(url); a.play(); btn.innerHTML='<i class="fa-solid fa-pause"></i>'; a.onended=()=>btn.innerHTML='<i class="fa-solid fa-play"></i>'; }

function openChatInfo(user) {
  var avy = 'https://ui-avatars.com/api/?name='+encodeURIComponent(user.name)+'&background=7C3AED&color=fff';
  makeModal('Chat Info',
    '<div style="padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center">'+
    '<img src="'+user.avatar+'" onerror="this.src=\''+avy+'\'" style="width:80px;height:80px;border-radius:50%;object-fit:cover"/>'+
    '<div><div style="font-size:20px;font-weight:700">'+esc(user.name)+'</div>'+
    '<div style="color:var(--t3);font-size:14px">@'+user.username+'</div>'+
    '<div style="margin-top:6px;font-size:13px;color:'+(user.is_online?'var(--online)':'var(--t3)')+'">'+
    (user.is_online ? '● Online now' : 'Offline') + '</div></div>'+
    '<div style="width:100%;display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--b);padding-top:14px">'+
    '<button class="settings-row" onclick="openVoiceCall(\''+esc(user.name)+'\')"><div class="s-ico" style="background:#22C55E22;color:#22C55E"><i class="fa-solid fa-phone"></i></div>Voice Call</button>'+
    '<button class="settings-row" onclick="openVideoCall(\''+esc(user.name)+'\')"><div class="s-ico" style="background:#3B82F622;color:#3B82F6"><i class="fa-solid fa-video"></i></div>Video Call</button>'+
    '<button class="settings-row" onclick="openUserProfile(\''+user.username+'\')"><div class="s-ico" style="background:#7C3AED22;color:#7C3AED"><i class="fa-solid fa-user"></i></div>View Profile</button>'+
    '<button class="settings-row danger" onclick="showToast(\'Chat cleared\');document.getElementById(\'settings-modal-dynamic\').remove()"><div class="s-ico" style="background:#EF444422;color:#EF4444"><i class="fa-solid fa-trash"></i></div>Clear Chat</button>'+
    '<button class="settings-row danger" onclick="showToast(\'Blocked\');document.getElementById(\'settings-modal-dynamic\').remove()"><div class="s-ico" style="background:#EF444422;color:#EF4444"><i class="fa-solid fa-ban"></i></div>Block User</button>'+
    '</div></div>'
  );
}
