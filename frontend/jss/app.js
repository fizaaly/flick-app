/* FLICK APP */
'use strict';

var APP = {
  page:'feed', theme:localStorage.getItem('flick-theme')||'dark',
  initialized:false, currentPostId:null,
  feedPage:1, feedLoading:false, feedHasMore:true,
  explorePage:1, exploreQ:'', exploreTimer:null,
  selectedFeeling:null, mediaFiles:[],
};

var FEELINGS = [
  {e:'😊',l:'Happy'},{e:'😍',l:'Loved'},{e:'🥳',l:'Celebrating'},{e:'😂',l:'Laughing'},
  {e:'🥰',l:'Grateful'},{e:'😢',l:'Sad'},{e:'😤',l:'Frustrated'},{e:'😴',l:'Tired'},
  {e:'🤩',l:'Excited'},{e:'💪',l:'Motivated'},{e:'😌',l:'Relaxed'},{e:'🔥',l:'Lit'},
  {e:'😮',l:'Surprised'},{e:'🙏',l:'Blessed'},{e:'❤️',l:'In love'},{e:'😡',l:'Angry'},
  {e:'🤗',l:'Hugging'},{e:'😬',l:'Nervous'},{e:'🌟',l:'Shining'},{e:'🎉',l:'Festive'},
  {e:'☕',l:'Cozy'},{e:'✈️',l:'Traveling'},{e:'🍕',l:'Foody'},{e:'🎮',l:'Gaming'},
];

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', function() {
  applyTheme(APP.theme);
  setTimeout(function() {
    var s = document.getElementById('splash');
    if (s) { s.style.opacity='0'; s.style.transition='opacity 0.4s'; }
    setTimeout(function() {
      if (s) s.style.display='none';
      checkAuth();
    }, 400);
  }, 1800);
});

async function checkAuth() {
  if (!Auth.isLoggedIn()) { showAuth(); return; }
  /* timeout - agar 5 seconds mein response nahi aaya to login page dikhao */
  var timer = setTimeout(function() { Auth.clear(); showAuth(); }, 5000);
  try {
    var d = await AuthAPI.me();
    clearTimeout(timer);
    Auth.setUser(d.user);
    showApp();
  } catch(e) {
    clearTimeout(timer);
    Auth.clear();
    showAuth();
  }
}

function showAuth() {
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('app').style.display  = 'none';
}

function showApp() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display  = 'flex';
  if (!APP.initialized) { APP.initialized = true; initApp(); }
}

function initApp() {
  var u = Auth.getUser();
  if (u) {
    setEl('profile-name',  u.name);
    setEl('profile-uname', '@'+u.username);
    setEl('profile-bio',   u.bio||'');
    setEl('ps-posts',      fmtNum(u.posts_count||0));
    setEl('ps-followers',  fmtNum(u.followers||0));
    setEl('ps-following',  fmtNum(u.following||0));
    var pa=document.getElementById('profile-av'); if(pa) pa.src=u.avatar||'';
    var ca=document.getElementById('create-av');  if(ca) ca.src=u.avatar||'';
    setEl('create-uname', u.name);
  }
  /* Load feed first - others lazily when tab is opened */
  loadFeed();
  setTimeout(function(){ loadStories(); }, 500);
  setTimeout(function(){ loadConversations(); }, 1000);
  loadNotificationsPage();
  /* infinite scroll */
  var pg = document.getElementById('tab-feed');
  if (pg) {
    pg.addEventListener('scroll', function() {
      if (pg.scrollTop+pg.clientHeight >= pg.scrollHeight-300) loadFeed(false);
    }, { passive:true });
  }
}

/* ── AUTH ── */
function switchForm(m) {
  document.getElementById('form-login').style.display    = m==='login'    ?'flex':'none';
  document.getElementById('form-register').style.display = m==='register' ?'flex':'none';
}
function toggleEye(id, btn) {
  var i=document.getElementById(id); if(!i) return;
  i.type = i.type==='password'?'text':'password';
  btn.querySelector('i').className = i.type==='password'?'fa-solid fa-eye':'fa-solid fa-eye-slash';
}
async function doLogin() {
  var u=val('l-user'), p=val('l-pass');
  if(!u||!p){showToast('Fill all fields');return;}
  var btn=document.getElementById('login-btn');
  btn.textContent='Signing in…'; btn.disabled=true;
  try {
    /* send as both username and email so backend accepts either */
    var d=await AuthAPI.login({username:u, email:u, password:p});
    Auth.setToken(d.access_token);
    Auth.setRefresh(d.refresh_token);
    Auth.setUser(d.user);
    showApp();
    showToast('Welcome back 👋');
  } catch(e) {
    showToast(e.message||'Login failed. Check your username/password');
  }
  btn.textContent='Sign In'; btn.disabled=false;
}
async function doRegister() {
  var name=val('r-name'),uname=val('r-user'),email=val('r-email'),pass=val('r-pass');
  if(!name||!uname||!email||!pass){showToast('Fill all fields');return;}
  if(pass.length<6){showToast('Password min 6 chars');return;}
  var btn=document.getElementById('reg-btn');
  btn.textContent='Creating…'; btn.disabled=true;
  try {
    var d=await AuthAPI.register({name:name,username:uname,email:email,password:pass});
    Auth.setToken(d.access_token); Auth.setRefresh(d.refresh_token); Auth.setUser(d.user);
    showApp(); showToast('Welcome to Flick ⚡');
  } catch(e){showToast(e.message||'Register failed');}
  finally{btn.textContent='Create Account';btn.disabled=false;}
}
async function doLogout() {
  try{await AuthAPI.logout();}catch(e){}
  Auth.clear(); APP.initialized=false;
  closeSettings();
  document.getElementById('app').style.display ='none';
  document.getElementById('auth').style.display='flex';
  showToast('Logged out');
}

/* ── NAV ── */
function goto(tab) {
  if(APP.page===tab) return; APP.page=tab;
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  var el=document.getElementById('tab-'+tab); if(el) el.classList.add('active');
  document.querySelectorAll('.sb-item[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
  document.querySelectorAll('.bn-item[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
  if(tab==='reels')         loadReels();
  if(tab==='explore')       loadExploreGrid();
  if(tab==='profile')       loadProfileGrid();
  if(tab==='notifications') loadNotificationsPage();
}
function applyTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('flick-theme',t);}
function toggleTheme(){APP.theme=APP.theme==='dark'?'light':'dark';applyTheme(APP.theme);showToast(APP.theme==='dark'?'🌙 Dark':'☀️ Light');}

/* ── FEED ── */
async function loadFeed(reset) {
  if(reset===undefined) reset=true;
  if(APP.feedLoading) return;
  if(reset){APP.feedPage=1;APP.feedHasMore=true;}
  if(!APP.feedHasMore) return;
  APP.feedLoading=true;
  var cont=document.getElementById('feed-list');
  if(reset&&cont) cont.innerHTML=skelHtml(3);
  try {
    var d=await PostsAPI.feed(APP.feedPage);
    if(reset&&cont) cont.innerHTML='';
    if(!d.posts.length&&reset&&cont){
      cont.innerHTML='<div class="empty-state"><div class="empty-ico">📸</div><h3>No posts yet</h3><p>Create your first post!</p></div>';
    } else {
      d.posts.forEach(function(p){if(cont) cont.appendChild(buildPostCard(p));});
    }
    APP.feedHasMore=d.has_more;
    APP.feedPage++;
  } catch(e){
    if(reset&&cont) cont.innerHTML='<div class="empty-state"><div class="empty-ico">⚠️</div><h3>Could not load</h3><p>'+esc(e.message)+'</p><button class="btn-grad sm" onclick="loadFeed()" style="margin-top:12px">Try again</button></div>';
  }
  APP.feedLoading=false;
}

/* ── POST CARD ── */
function buildPostCard(post) {
  var div=document.createElement('div');
  div.className='post-card';
  div.setAttribute('data-post-id', post.id);
  var imgs=post.images||[], multi=imgs.length>1;
  var avy='https://ui-avatars.com/api/?name='+enc(post.user.name)+'&background=7C3AED&color=fff';
  var likeI=post.is_liked?'solid':'regular', saveI=post.is_saved?'solid':'regular';
  var html='';
  /* header */
  html+='<div class="post-hd">';
  html+='<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;cursor:pointer;flex-shrink:0" onclick="openUserProfile(\''+post.user.username+'\')">';
  html+='<img src="'+post.user.avatar+'" style="width:100%;height:100%;object-fit:cover" onerror="this.src=\''+avy+'\'"/></div>';
  html+='<div class="post-uinfo"><div class="post-uname">'+esc(post.user.name)+'</div>';
  html+='<div class="post-umeta">@'+post.user.username+' · '+timeAgo(post.created_at)+'</div></div>';
  html+='<button class="post-more" onclick="showPostOptions('+post.id+','+post.user.id+')"><i class="fa-solid fa-ellipsis"></i></button></div>';
  /* images */
  if(imgs.length){
    html+='<div class="post-media-wrap" id="pmw-'+post.id+'">';
    for(var i=0;i<imgs.length;i++){
      html+='<img src="'+imgs[i].url+'" style="display:'+(i===0?'block':'none')+'" loading="lazy" ondblclick="doubleTapLike(event,'+post.id+')" />';
    }
    if(multi) html+='<div class="post-media-count"><i class="fa-solid fa-images"></i> 1/'+imgs.length+'</div>';
    html+='</div>';
    if(multi){
      html+='<div class="post-dots" id="pdots-'+post.id+'">';
      for(var j=0;j<imgs.length;j++) html+='<div class="post-dot '+(j===0?'on':'')+'" onclick="goToSlide('+post.id+','+j+')"></div>';
      html+='</div>';
    }
  }
  /* actions */
  html+='<div class="post-actions">';
  html+='<button class="act-btn'+(post.is_liked?' liked':'')+'" id="like-'+post.id+'" onclick="toggleLike('+post.id+')"><i class="fa-'+likeI+' fa-heart"></i><span class="act-count" id="lc-'+post.id+'">'+fmtNum(post.likes)+'</span></button>';
  html+='<button class="act-btn" onclick="openPostDetail('+post.id+')"><i class="fa-regular fa-comment"></i><span class="act-count">'+fmtNum(post.comments)+'</span></button>';
  html+='<button class="act-btn" onclick="sharePost('+post.id+')"><i class="fa-solid fa-paper-plane"></i></button>';
  html+='<span class="act-space"></span>';
  html+='<button class="act-btn'+(post.is_saved?' saved':'')+'" id="save-'+post.id+'" onclick="toggleSave('+post.id+')"><i class="fa-'+saveI+' fa-bookmark"></i></button>';
  html+='</div>';
  html+='<div class="post-likes" id="pl-'+post.id+'">'+fmtNum(post.likes)+' likes</div>';
  if(post.caption) html+='<div class="post-caption"><span class="cap-uname">'+esc(post.user.name)+'</span> '+esc(post.caption)+'</div>';
  if(post.comments>0) html+='<div class="post-view-comments" onclick="openPostDetail('+post.id+')">View all '+fmtNum(post.comments)+' comments</div>';
  html+='<div class="post-ts">'+fmtDate(post.created_at)+'</div>';
  html+='<div class="post-comment-bar">';
  html+='<input class="pcb-inp" placeholder="Add a comment…" onkeydown="quickComment(event,'+post.id+')"/>';
  html+='</div>';
  div.innerHTML=html;
  return div;
}

async function toggleLike(id){
  var btn=document.getElementById('like-'+id),cnt=document.getElementById('lc-'+id),pl=document.getElementById('pl-'+id);
  if(!btn)return; var was=btn.classList.contains('liked');
  btn.classList.toggle('liked',!was); btn.querySelector('i').className='fa-'+(!was?'solid':'regular')+' fa-heart';
  try{var d=await PostsAPI.like(id);if(cnt)cnt.textContent=fmtNum(d.likes);if(pl)pl.textContent=fmtNum(d.likes)+' likes';}
  catch(e){btn.classList.toggle('liked',was);btn.querySelector('i').className='fa-'+(was?'solid':'regular')+' fa-heart';}
}
async function toggleSave(id){
  var btn=document.getElementById('save-'+id);if(!btn)return;
  var was=btn.classList.contains('saved');btn.classList.toggle('saved',!was);
  btn.querySelector('i').className='fa-'+(!was?'solid':'regular')+' fa-bookmark';
  try{var d=await PostsAPI.save(id);showToast(d.saved?'Saved ✅':'Removed');}
  catch(e){btn.classList.toggle('saved',was);}
}
function doubleTapLike(e,id){
  var h=document.createElement('div');h.className='dtap-heart';h.textContent='❤️';
  h.style.cssText='left:'+e.offsetX+'px;top:'+e.offsetY+'px;';
  e.target.parentElement.appendChild(h);setTimeout(function(){h.remove();},800);
  var btn=document.getElementById('like-'+id);if(btn&&!btn.classList.contains('liked'))toggleLike(id);
}
function goToSlide(id,idx){
  var w=document.getElementById('pmw-'+id);if(!w)return;
  w.querySelectorAll('img').forEach(function(img,i){img.style.display=i===idx?'block':'none';});
  var c=w.querySelector('.post-media-count');if(c)c.innerHTML='<i class="fa-solid fa-images"></i> '+(idx+1)+'/'+w.querySelectorAll('img').length;
  var dots=document.getElementById('pdots-'+id);if(dots)dots.querySelectorAll('.post-dot').forEach(function(d,i){d.className='post-dot '+(i===idx?'on':'');});
}
async function quickComment(e,id){if(e.key!=='Enter')return;var t=e.target.value.trim();if(!t)return;try{await PostsAPI.addComment(id,t);showToast('Posted 💬');e.target.value='';}catch(err){showToast(err.message);}}
function sharePost(id){if(navigator.clipboard)navigator.clipboard.writeText(location.origin+'?post='+id).then(function(){showToast('Copied 🔗');});}
function openUserProfile(u){showToast('@'+u);}
async function showPostOptions(id,ownerId){var me=Auth.getUser();if(me&&me.id===ownerId){if(!confirm('Delete post?'))return;try{await PostsAPI.delete(id);var el=document.querySelector('[data-post-id="'+id+'"]');if(el)el.remove();showToast('Deleted');}catch(e){showToast(e.message);}}else{showToast('Report coming soon');}}

/* ── POST DETAIL ── */
async function openPostDetail(id){
  APP.currentPostId=id;
  var ov=document.getElementById('post-overlay');ov.style.display='flex';
  document.getElementById('pm-media').innerHTML='<div class="center-pad"><div class="spin"></div></div>';
  document.getElementById('pm-comments').innerHTML='';
  document.getElementById('pm-head').innerHTML='';
  document.getElementById('pm-actions').innerHTML='';
  try{
    var res=await Promise.all([PostsAPI.get(id),PostsAPI.comments(id)]);
    var p=res[0].post,cd=res[1],imgs=p.images||[];
    var avy='https://ui-avatars.com/api/?name='+enc(p.user.name)+'&background=7C3AED&color=fff';
    document.getElementById('pm-media').innerHTML=imgs.length?'<img src="'+imgs[0].url+'" style="width:100%;height:100%;object-fit:contain"/>':'<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:48px">📝</div>';
    document.getElementById('pm-head').innerHTML='<img src="'+p.user.avatar+'" style="width:38px;height:38px;border-radius:50%;object-fit:cover" onerror="this.src=\''+avy+'\''+'"/><div style="flex:1"><div style="font-weight:600;font-size:14px">'+esc(p.user.name)+'</div><div style="font-size:12px;color:var(--t3)">@'+p.user.username+'</div></div><button class="ico-btn" onclick="document.getElementById(\'post-overlay\').style.display=\'none\'"><i class="fa-solid fa-xmark"></i></button>';
    var cc=document.getElementById('pm-comments');
    if(p.caption)cc.innerHTML='<div class="comment-row"><div><strong>'+esc(p.user.name)+'</strong> '+esc(p.caption)+'</div></div>';
    cd.comments.forEach(function(c){var d=document.createElement('div');d.className='comment-row';d.innerHTML='<img src="'+c.user.avatar+'" class="com-av" onerror="this.style.display=\'none\'"/><div><strong>'+esc(c.user.name)+'</strong> '+esc(c.text)+'<div style="font-size:12px;color:var(--t3);margin-top:3px">'+timeAgo(c.created_at)+'</div></div>';cc.appendChild(d);});
    document.getElementById('pm-actions').innerHTML='<div style="display:flex;gap:4px;margin-bottom:8px"><button class="act-btn'+(p.is_liked?' liked':'')+'" onclick="toggleLike('+p.id+')"><i class="fa-'+(p.is_liked?'solid':'regular')+' fa-heart"></i></button><button class="act-btn"><i class="fa-regular fa-comment"></i></button><button class="act-btn" onclick="sharePost('+p.id+')"><i class="fa-solid fa-paper-plane"></i></button><button class="act-btn'+(p.is_saved?' saved':'')+'" style="margin-left:auto" onclick="toggleSave('+p.id+')"><i class="fa-'+(p.is_saved?'solid':'regular')+' fa-bookmark"></i></button></div><div style="font-weight:700;font-size:14px">'+fmtNum(p.likes)+' likes</div>';
  }catch(e){document.getElementById('pm-media').innerHTML='<div class="center-pad">'+e.message+'</div>';}
}
function closePostOverlay(e){if(!e||e.target===document.getElementById('post-overlay'))document.getElementById('post-overlay').style.display='none';}
async function submitComment(){var inp=document.getElementById('pm-comment-inp'),t=inp?inp.value.trim():'';if(!t||!APP.currentPostId)return;try{await PostsAPI.addComment(APP.currentPostId,t);showToast('Posted 💬');inp.value='';openPostDetail(APP.currentPostId);}catch(e){showToast(e.message);}}

/* ── EXPLORE ── */
async function loadExploreGrid(reset){
  if(reset===undefined)reset=true;
  var grid=document.getElementById('explore-grid');if(!grid)return;
  if(reset){APP.explorePage=1;grid.innerHTML=skelHtml(2,true);}
  try{
    var d=await PostsAPI.explore(APP.explorePage,APP.exploreQ);
    if(reset)grid.innerHTML='';
    if(!d.posts.length&&reset){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🔍</div><h3>Nothing found</h3></div>';return;}
    d.posts.forEach(function(p,i){
      var item=document.createElement('div');item.className='explore-item';
      var imgs=p.images||[];
      if(imgs.length){item.innerHTML='<img src="'+imgs[0].url+'" loading="lazy"/><div class="explore-overlay"><span><i class="fa-solid fa-heart"></i> '+fmtNum(p.likes)+'</span><span><i class="fa-solid fa-comment"></i> '+fmtNum(p.comments)+'</span></div>';}
      else{item.innerHTML='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--c3);font-size:28px">📝</div>';}
      item.onclick=function(){openPostDetail(p.id);};grid.appendChild(item);
    });
    APP.explorePage++;
  }catch(e){if(reset)grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><p>'+e.message+'</p></div>';}
}
function onExploreSearch(q){APP.exploreQ=q;clearTimeout(APP.exploreTimer);APP.exploreTimer=setTimeout(function(){loadExploreGrid(true);},500);}
function filterExplore(btn,type){document.querySelectorAll('#explore-tags .pill').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');APP.exploreQ=type==='all'?'':type;loadExploreGrid(true);}

/* ── REELS ── */
async function loadReels(){
  var cont=document.getElementById('reels-cont');if(!cont||cont.dataset.loaded==='1')return;
  cont.innerHTML='<div class="center-pad" style="height:100vh"><div class="spin"></div></div>';
  try{
    var d=await PostsAPI.explore(1);cont.innerHTML='';
    var posts=d.posts.filter(function(p){return p.images&&p.images.length>0;});
    if(!posts.length){cont.innerHTML='<div style="height:100vh;display:flex;align-items:center;justify-content:center;color:var(--t2);text-align:center;padding:20px"><div><div style="font-size:48px;margin-bottom:12px">🎬</div><h3>No reels yet</h3></div></div>';return;}
    posts.forEach(function(p){
      var url=p.images[0].url,item=document.createElement('div');item.className='reel-item';
      var avy='https://ui-avatars.com/api/?name='+enc(p.user.name)+'&background=7C3AED&color=fff';
      var h='<div class="reel-bg" style="background-image:url(\''+url+'\')"></div><img src="'+url+'" class="reel-img" loading="lazy"/>';
      h+='<div class="reel-overlay"><div class="reel-user-row"><img src="'+p.user.avatar+'" class="reel-uav" onerror="this.src=\''+avy+'\'"/><span class="reel-uname">'+esc(p.user.name)+'</span><button class="reel-follow-btn" onclick="reelFollow(this,'+p.user.id+')">Follow</button></div>';
      if(p.caption)h+='<div class="reel-caption">'+esc(p.caption)+'</div>';
      h+='<div class="reel-audio-row"><div class="reel-disc"><i class="fa-solid fa-music"></i></div><span>'+esc(p.user.name)+'</span></div></div>';
      h+='<div class="reel-side"><div class="reel-act"><button onclick="toggleLike('+p.id+')"><i class="fa-'+(p.is_liked?'solid':'regular')+' fa-heart"'+(p.is_liked?' style="color:#EF4444"':'')+' ></i></button><span>'+fmtNum(p.likes)+'</span></div>';
      h+='<div class="reel-act"><button onclick="openPostDetail('+p.id+')"><i class="fa-solid fa-comment"></i></button><span>'+fmtNum(p.comments)+'</span></div>';
      h+='<div class="reel-act"><button onclick="sharePost('+p.id+')"><i class="fa-solid fa-paper-plane"></i></button><span>Share</span></div></div>';
      item.innerHTML=h;cont.appendChild(item);
    });
    cont.dataset.loaded='1';
  }catch(e){cont.innerHTML='<div style="height:100vh;display:flex;align-items:center;justify-content:center;color:var(--t2)">'+e.message+'</div>';}
}
async function reelFollow(btn,id){try{var d=await UsersAPI.follow(id);btn.textContent=d.following?'Following':'Follow';showToast(d.following?'Following! 🎉':'Unfollowed');}catch(e){showToast(e.message);}}

/* ── PROFILE ── */
async function loadProfileGrid(){
  var grid=document.getElementById('profile-grid');if(!grid)return;
  var u=Auth.getUser();if(!u)return;
  grid.innerHTML=skelHtml(2,true);
  try{
    var d=await UsersAPI.posts(u.username);grid.innerHTML='';
    if(!d.posts.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">📸</div><h3>No posts yet</h3></div>';return;}
    d.posts.forEach(function(p,i){
      var item=document.createElement('div');item.className='explore-item';
      var imgs=p.images||[];
      item.innerHTML=imgs.length?'<img src="'+imgs[0].url+'" loading="lazy"/><div class="explore-overlay"></div>':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--c3);font-size:24px">📝</div>';
      item.onclick=function(){openPostDetail(p.id);};grid.appendChild(item);
    });
  }catch(e){}
}
function switchGridTab(btn, tab) {
  document.querySelectorAll('.gtab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  if (tab === 'posts') {
    loadProfileGrid();
  } else if (tab === 'saved') {
    loadSavedPosts();
  } else if (tab === 'reels') {
    loadProfileReels();
  } else if (tab === 'tagged') {
    loadTaggedPosts();
  }
}

async function loadSavedPosts() {
  var grid = document.getElementById('profile-grid'); if (!grid) return;
  grid.innerHTML = skelHtml(2, true);
  try {
    var d = await PostsAPI.saved();
    grid.innerHTML = '';
    if (!d.posts.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🔖</div><h3>No saved posts</h3><p>Save posts to see them here</p></div>';
      return;
    }
    d.posts.forEach(function(p) {
      var item = document.createElement('div'); item.className = 'explore-item';
      var imgs = p.images || [];
      item.innerHTML = imgs.length ? '<img src="'+imgs[0].url+'" loading="lazy"/><div class="explore-overlay"></div>' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--c3);font-size:24px">📝</div>';
      item.onclick = function() { openPostDetail(p.id); };
      grid.appendChild(item);
    });
  } catch(e) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>'+esc(e.message)+'</p></div>'; }
}

async function loadProfileReels() {
  var grid = document.getElementById('profile-grid'); if (!grid) return;
  grid.innerHTML = skelHtml(2, true);
  try {
    var u = Auth.getUser(); if (!u) return;
    var d = await UsersAPI.posts(u.username);
    grid.innerHTML = '';
    var posts = d.posts.filter(function(p){ return p.images && p.images.length > 0; });
    if (!posts.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🎬</div><h3>No reels yet</h3></div>';
      return;
    }
    posts.forEach(function(p) {
      var item = document.createElement('div'); item.className = 'explore-item';
      var imgs = p.images || [];
      item.innerHTML = '<img src="'+imgs[0].url+'" loading="lazy"/><div class="explore-overlay"><span><i class="fa-solid fa-play"></i></span></div>';
      item.onclick = function() { openPostDetail(p.id); };
      grid.appendChild(item);
    });
  } catch(e) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>'+esc(e.message)+'</p></div>'; }
}

function loadTaggedPosts() {
  var grid = document.getElementById('profile-grid'); if (!grid) return;
  grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🏷️</div><h3>No tagged posts</h3><p>Posts you are tagged in will appear here</p></div>';
}
async function editProfile(){var u=Auth.getUser();var name=prompt('Name:',u?u.name:'');if(!name)return;var bio=prompt('Bio:',u?u.bio:'');try{var d=await AuthAPI.update({name:name,bio:bio});Auth.setUser(d.user);setEl('profile-name',d.user.name);setEl('profile-bio',d.user.bio||'');showToast('Updated ✅');closeSettings();}catch(e){showToast(e.message);}}
function changeAvatar(){var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=async function(e){var f=e.target.files[0];if(!f)return;var form=new FormData();form.append('avatar',f);try{var d=await UsersAPI.avatar(form);var av=document.getElementById('profile-av');if(av)av.src=d.avatar;var u=Auth.getUser();if(u){u.avatar=d.avatar;Auth.setUser(u);}showToast('Updated ✅');}catch(ex){showToast(ex.message);}};inp.click();}
function shareProfile(){if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(function(){showToast('Copied 🔗');});}
function showFollowers() {
  var u = Auth.getUser(); if (!u) return;
  UsersAPI.followers(u.id).then(function(d) {
    showUserListModal('Followers', d.users);
  }).catch(function(e) { showToast(e.message); });
}

function showFollowing() {
  var u = Auth.getUser(); if (!u) return;
  UsersAPI.following(u.id).then(function(d) {
    showUserListModal('Following', d.users);
  }).catch(function(e) { showToast(e.message); });
}

function showPostsCount() {
  loadProfileGrid();
  document.querySelectorAll('.gtab').forEach(function(b){b.classList.remove('active');});
  document.querySelector('.gtab:first-child').classList.add('active');
}

function showUserListModal(title, users) {
  var existing = document.getElementById('userlist-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'userlist-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

  var sheet = document.createElement('div');
  sheet.style.cssText = 'background:var(--c4);border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:70vh;display:flex;flex-direction:column;animation:slideUp .25s ease';

  var head = '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--b);font-weight:700;font-size:16px"><span>'+title+'</span><button onclick="document.getElementById(\'userlist-modal\').remove()" style="width:32px;height:32px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;font-size:14px">✕</button></div>';

  var body = '<div style="overflow-y:auto;flex:1">';
  if (!users.length) {
    body += '<div class="empty-state"><div class="empty-ico">👥</div><h3>No '+title.toLowerCase()+' yet</h3></div>';
  } else {
    users.forEach(function(u) {
      var avy = 'https://ui-avatars.com/api/?name='+encodeURIComponent(u.name)+'&background=7C3AED&color=fff';
      body += '<div style="display:flex;align-items:center;gap:12px;padding:12px 18px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'var(--c5)\'" onmouseout="this.style.background=\'\'">'+
        '<img src="'+u.avatar+'" onerror="this.src=\''+avy+'\'" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0"/>'+
        '<div style="flex:1"><div style="font-weight:600;font-size:15px">'+esc(u.name)+'</div><div style="font-size:13px;color:var(--t3)">@'+u.username+'</div></div>'+
        '<button onclick="toggleFollowUser(this,'+u.id+')" style="padding:6px 16px;border-radius:99px;background:var(--acc);color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer">'+(u.is_following?'Following':'Follow')+'</button>'+
        '</div>';
    });
  }
  body += '</div>';

  sheet.innerHTML = head + body;
  modal.appendChild(sheet);
}

async function toggleFollowUser(btn, id) {
  try {
    var d = await UsersAPI.follow(id);
    btn.textContent = d.following ? 'Following' : 'Follow';
    btn.style.background = d.following ? 'var(--c3)' : 'var(--acc)';
    btn.style.color = d.following ? 'var(--t1)' : '#fff';
  } catch(e) { showToast(e.message); }
}

/* ── NOTIFICATIONS ── */
function loadNotificationsPage(){var l=document.getElementById('notif-list');if(l)l.innerHTML='<div class="empty-state"><div class="empty-ico">🔔</div><h3>No activity yet</h3></div>';}
function filterNotifs(btn,type){document.querySelectorAll('#tab-notifications .pill').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');}
function markAllRead(){showToast('All caught up ✅');}

/* ── SETTINGS ── */
function openSettings() {
  var u = Auth.getUser();
  if (u) {
    var av = document.getElementById('settings-av');
    var nm = document.getElementById('settings-name');
    var un = document.getElementById('settings-uname');
    if (av) av.src = u.avatar || '';
    if (nm) nm.textContent = u.name;
    if (un) un.textContent = '@' + u.username;
  }
  var badge = document.getElementById('theme-badge');
  if (badge) badge.textContent = APP.theme === 'dark' ? '🌙 Dark' : '☀️ Light';
  document.getElementById('settings-overlay').style.display = 'flex';
}
function updateThemeBadge() {
  var badge = document.getElementById('theme-badge');
  if (badge) badge.textContent = APP.theme === 'dark' ? '🌙 Dark' : '☀️ Light';
}
function closeSettings(e) {
  if (!e || e.target === document.getElementById('settings-overlay'))
    document.getElementById('settings-overlay').style.display = 'none';
}

function openChangePassword() {
  closeSettings();
  var modal = makeModal('Change Password',
    '<div style="display:flex;flex-direction:column;gap:12px;padding:16px 18px">'+
    '<input id="cp-current" type="password" placeholder="Current password" style="padding:11px 14px;border-radius:10px;background:var(--c3);border:1.5px solid var(--b);font-size:15px;color:var(--t1);width:100%"/>'+
    '<input id="cp-new" type="password" placeholder="New password (min 6 chars)" style="padding:11px 14px;border-radius:10px;background:var(--c3);border:1.5px solid var(--b);font-size:15px;color:var(--t1);width:100%"/>'+
    '<input id="cp-confirm" type="password" placeholder="Confirm new password" style="padding:11px 14px;border-radius:10px;background:var(--c3);border:1.5px solid var(--b);font-size:15px;color:var(--t1);width:100%"/>'+
    '<button onclick="submitChangePassword()" class="btn-grad full" style="margin-top:4px">Update Password</button>'+
    '</div>'
  );
}

async function submitChangePassword() {
  var cur = document.getElementById('cp-current').value.trim();
  var nw  = document.getElementById('cp-new').value.trim();
  var con = document.getElementById('cp-confirm').value.trim();
  if (!cur || !nw || !con) { showToast('Fill all fields'); return; }
  if (nw !== con) { showToast('Passwords do not match'); return; }
  if (nw.length < 6) { showToast('Min 6 characters'); return; }
  try {
    await AuthAPI.update({ current_password: cur, new_password: nw });
    showToast('Password updated ✅');
    document.getElementById('settings-modal-dynamic')?.remove();
  } catch(e) { showToast(e.message); }
}

function openPrivacy() {
  closeSettings();
  var modal = makeModal('Privacy & Security',
    '<div class="settings-list">'+
    '<div class="settings-sect-label">Account Privacy</div>'+
    '<button class="settings-row" onclick="togglePrivateAccount()"><i class="fa-solid fa-lock"></i> Private Account<span id="private-badge" style="margin-left:auto;background:var(--c3);border-radius:99px;padding:3px 10px;font-size:12px;color:var(--t2)">'+(Auth.getUser() && Auth.getUser().is_private ? 'On' : 'Off')+'</span></button>'+
    '<div class="settings-sect-label">Interactions</div>'+
    '<button class="settings-row"><i class="fa-solid fa-comment-slash"></i> Restrict Comments<span style="margin-left:auto;font-size:12px;color:var(--t3)">Everyone</span></button>'+
    '<button class="settings-row"><i class="fa-solid fa-user-lock"></i> Restrict Messages<span style="margin-left:auto;font-size:12px;color:var(--t3)">Everyone</span></button>'+
    '<div class="settings-sect-label">Data</div>'+
    '<button class="settings-row"><i class="fa-solid fa-download"></i> Download Your Data<i class="fa-solid fa-chevron-right" style="margin-left:auto;font-size:12px;color:var(--t3)"></i></button>'+
    '</div>'
  );
}

async function togglePrivateAccount() {
  var u = Auth.getUser(); if (!u) return;
  try {
    var d = await AuthAPI.update({ is_private: !u.is_private });
    Auth.setUser(d.user);
    var badge = document.getElementById('private-badge');
    if (badge) badge.textContent = d.user.is_private ? 'On' : 'Off';
    showToast(d.user.is_private ? 'Account is now private 🔒' : 'Account is now public 🌍');
  } catch(e) { showToast(e.message); }
}

function openNotifSettings() {
  closeSettings();
  var modal = makeModal('Notifications',
    '<div class="settings-list">'+
    '<div class="settings-sect-label">Push Notifications</div>'+
    settingsToggle('Likes', true) +
    settingsToggle('Comments', true) +
    settingsToggle('New Followers', true) +
    settingsToggle('Messages', true) +
    settingsToggle('Mentions', true) +
    '<div class="settings-sect-label">Email Notifications</div>'+
    settingsToggle('Weekly digest', false) +
    settingsToggle('Product updates', false) +
    '</div>'
  );
}

function settingsToggle(label, defaultOn) {
  var id = 'tog-'+label.replace(/\s/g,'-').toLowerCase();
  return '<div class="settings-row"><span>'+label+'</span>'+
    '<div onclick="this.classList.toggle(\'on\')" id="'+id+'" style="width:44px;height:24px;border-radius:99px;background:'+(defaultOn?'var(--acc)':'var(--c3)')+';cursor:pointer;position:relative;transition:background .2s;margin-left:auto;flex-shrink:0">'+
    '<div style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;'+(defaultOn?'right:2px':'left:2px')+';transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div></div></div>';
}

function openLanguage() {
  makeModal('Language', 
    '<div class="settings-list">' +
    ['English','Urdu - اردو','Hindi - हिंदी','Arabic - العربية','French - Français','Spanish - Español','German - Deutsch','Turkish - Türkçe','Persian - فارسی','Bengali - বাংলা'].map(function(lang, i) {
      var active = i === 0;
      return '<button class="settings-row" onclick="selectLanguage(this,\''+lang+'\')" style="'+(active?'color:var(--acc)':'')+'">'+
        '<div class="s-ico" style="background:#3B82F622;color:#3B82F6"><i class="fa-solid fa-globe"></i></div>'+lang+
        (active ? '<i class="fa-solid fa-check" style="margin-left:auto;color:var(--acc)"></i>' : '<span style="width:20px;margin-left:auto"></span>')+
        '</button>';
    }).join('') +
    '</div>'
  );
}

function selectLanguage(btn, lang) {
  document.querySelectorAll('#settings-modal-dynamic .settings-row').forEach(function(b) {
    b.style.color = '';
    var check = b.querySelector('.fa-check'); if (check) check.remove();
  });
  btn.style.color = 'var(--acc)';
  var icon = document.createElement('i');
  icon.className = 'fa-solid fa-check';
  icon.style.cssText = 'margin-left:auto;color:var(--acc)';
  btn.appendChild(icon);
  localStorage.setItem('flick-language', lang);
  showToast('Language: ' + lang.split(' - ')[0] + ' ✅');
}

function openArchivedPosts() {
  closeSettings();
  var modal = makeModal('Archive',
    '<div class="empty-state"><div class="empty-ico">📦</div><h3>No archived posts</h3><p>Archived posts will appear here</p></div>'
  );
}

function openActivity() {
  closeSettings();
  var u = Auth.getUser();
  var modal = makeModal('Your Activity',
    '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:14px">'+
    '<div style="background:var(--c3);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;color:var(--t3)">Total Posts</div><div style="font-size:28px;font-weight:700">'+((u&&u.posts_count?u.posts_count:0)||0)+'</div></div><i class="fa-solid fa-images" style="font-size:28px;color:var(--acc);opacity:.6"></i></div>'+
    '<div style="background:var(--c3);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;color:var(--t3)">Followers</div><div style="font-size:28px;font-weight:700">'+((u&&u.followers?u.followers:0)||0)+'</div></div><i class="fa-solid fa-users" style="font-size:28px;color:var(--acc);opacity:.6"></i></div>'+
    '<div style="background:var(--c3);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;color:var(--t3)">Following</div><div style="font-size:28px;font-weight:700">'+((u&&u.following?u.following:0)||0)+'</div></div><i class="fa-solid fa-user-plus" style="font-size:28px;color:var(--acc);opacity:.6"></i></div>'+
    '<div style="background:var(--c3);border-radius:14px;padding:16px"><div style="font-size:13px;color:var(--t3);margin-bottom:8px">Member since</div><div style="font-size:16px;font-weight:600">'+((u && u.created_at) ? new Date(u.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : 'Today')+'</div></div>'+
    '</div>'
  );
}

function openHelp() {
  closeSettings();
  var modal = makeModal('Help & Support',
    '<div class="settings-list">'+
    '<button class="settings-row" onclick="showToast(\'Opening Help Center…\')"><i class="fa-solid fa-book"></i> Help Center<i class="fa-solid fa-chevron-right" style="margin-left:auto;font-size:12px;color:var(--t3)"></i></button>'+
    '<button class="settings-row" onclick="showToast(\'Contact support coming soon\')"><i class="fa-solid fa-envelope"></i> Contact Support<i class="fa-solid fa-chevron-right" style="margin-left:auto;font-size:12px;color:var(--t3)"></i></button>'+
    '<button class="settings-row" onclick="showToast(\'Community guidelines coming soon\')"><i class="fa-solid fa-scale-balanced"></i> Community Guidelines<i class="fa-solid fa-chevron-right" style="margin-left:auto;font-size:12px;color:var(--t3)"></i></button>'+
    '<button class="settings-row" onclick="showToast(\'Terms of service coming soon\')"><i class="fa-solid fa-file-contract"></i> Terms of Service<i class="fa-solid fa-chevron-right" style="margin-left:auto;font-size:12px;color:var(--t3)"></i></button>'+
    '<button class="settings-row" onclick="showToast(\'Privacy policy coming soon\')"><i class="fa-solid fa-user-shield"></i> Privacy Policy<i class="fa-solid fa-chevron-right" style="margin-left:auto;font-size:12px;color:var(--t3)"></i></button>'+
    '</div>'
  );
}

function openReport() {
  closeSettings();
  var modal = makeModal('Report a Problem',
    '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:12px">'+
    '<p style="color:var(--t2);font-size:14px">Describe the problem you are experiencing:</p>'+
    '<textarea id="report-text" placeholder="Describe the issue…" style="width:100%;min-height:120px;padding:12px;background:var(--c3);border:1.5px solid var(--b);border-radius:12px;font-size:14px;color:var(--t1);resize:none"></textarea>'+
    '<button onclick="submitReport()" class="btn-grad full">Send Report</button>'+
    '</div>'
  );
}

function submitReport() {
  var text = document.getElementById('report-text')?.value.trim();
  if (!text) { showToast('Please describe the issue'); return; }
  showToast('Report sent. Thank you! ✅');
  document.getElementById('settings-modal-dynamic')?.remove();
}

function openAbout() {
  closeSettings();
  var modal = makeModal('About Flick',
    '<div style="padding:20px 18px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px">'+
    '<div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#7C3AED,#EC4899);display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff"><i class="fa-solid fa-bolt-lightning"></i></div>'+
    '<div style="font-size:24px;font-weight:800;background:linear-gradient(135deg,#7C3AED,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Flick</div>'+
    '<div style="font-size:14px;color:var(--t3)">Version 1.0.0</div>'+
    '<div style="font-size:14px;color:var(--t2);line-height:1.6;max-width:280px">Connect, share and vibe with people around the world. Your social universe.</div>'+
    '<div style="font-size:13px;color:var(--t3);margin-top:8px">© 2026 Flick. All rights reserved.</div>'+
    '</div>'
  );
}

function openBlockedUsers() {
  closeSettings();
  var modal = makeModal('Blocked Accounts',
    '<div class="empty-state"><div class="empty-ico">🚫</div><h3>No blocked accounts</h3><p>Blocked accounts will appear here</p></div>'
  );
}

function confirmDeactivate() {
  closeSettings();
  if (confirm('Are you sure you want to deactivate your account? You can reactivate by logging in again.')) {
    doLogout();
    showToast('Account deactivated');
  }
}

function changePassword() { openChangePassword(); }

/* Helper: create dynamic modal */
function makeModal(title, bodyHtml) {
  var existing = document.getElementById('settings-modal-dynamic');
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = 'settings-modal-dynamic';
  modal.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  var sheet = document.createElement('div');
  sheet.style.cssText = 'background:var(--c4);border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;animation:slideUp .22s ease;border:1px solid var(--b)';
  sheet.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--b);position:sticky;top:0;background:var(--c4);z-index:1;border-radius:20px 20px 0 0"><span style="font-size:17px;font-weight:700">'+title+'</span><button onclick="document.getElementById(\'settings-modal-dynamic\').remove()" style="width:34px;height:34px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-xmark"></i></button></div>'+bodyHtml;
  modal.appendChild(sheet);
  return modal;
}
/* ── STORY ── */
function openAddStory(){var inp=document.createElement('input');inp.type='file';inp.accept='image/*,video/*';inp.onchange=async function(e){var f=e.target.files[0];if(!f)return;showToast('Uploading…');var form=new FormData();form.append('media',f);try{await StoriesAPI.create(form);showToast('Story posted ✅');loadStories();}catch(ex){showToast(ex.message||'Failed');}};inp.click();}

/* ── NEW MSG ── */
async function openNewMsg(){document.getElementById('newmsg-overlay').style.display='flex';var list=document.getElementById('nm-list');list.innerHTML='<div class="center-pad"><div class="spin"></div></div>';try{var d=await UsersAPI.suggested();renderPeopleList(d.users);}catch(e){list.innerHTML='<div class="empty-state"><p>Could not load</p></div>';}}
function closeNewMsg(e){if(!e||e.target===document.getElementById('newmsg-overlay'))document.getElementById('newmsg-overlay').style.display='none';}
async function searchPeople(q){if(!q.trim()){try{var d=await UsersAPI.suggested();renderPeopleList(d.users);}catch(e){}return;}try{var d=await UsersAPI.search(q);renderPeopleList(d.users);}catch(e){}}
function renderPeopleList(users){var list=document.getElementById('nm-list');if(!list)return;if(!users.length){list.innerHTML='<div class="empty-state"><p>No users found</p></div>';return;}list.innerHTML=users.map(function(u){var avy='https://ui-avatars.com/api/?name='+encodeURIComponent(u.name)+'&background=7C3AED&color=fff';return '<div class="conv-item" onclick="startNewChat('+u.id+')" style="cursor:pointer"><div class="conv-av-wrap"><img class="conv-av" src="'+u.avatar+'" onerror="this.src=\''+avy+'\'"/>'+(u.is_online?'<div class="conv-online"></div>':'')+'</div><div class="conv-info"><div class="conv-top"><span class="conv-name">'+esc(u.name)+'</span></div><div class="conv-preview">@'+u.username+'</div></div></div>';}).join('');}
function startNewChat(userId){closeNewMsg();goto('chat');openChat(userId);}

/* ── CREATE POST ── */
function openCreate(){var u=Auth.getUser();if(!u)return;APP.mediaFiles=[];APP.selectedFeeling=null;document.getElementById('post-text').value='';document.getElementById('create-preview').innerHTML='';document.getElementById('feeling-chip').style.display='none';document.getElementById('feeling-picker').style.display='none';document.getElementById('loc-row').style.display='none';var ca=document.getElementById('create-av');if(ca)ca.src=u.avatar||'';setEl('create-uname',u.name);document.getElementById('create-overlay').style.display='flex';}
function closeCreate(e){if(!e||e.target===document.getElementById('create-overlay'))document.getElementById('create-overlay').style.display='none';}
function pickMedia(){document.getElementById('media-inp').click();}
function onMediaPicked(e){var files=Array.from(e.target.files);if(!files.length)return;var prev=document.getElementById('create-preview');prev.innerHTML='';files.forEach(function(file){APP.mediaFiles.push(file);var reader=new FileReader();reader.onload=function(ev){var item=document.createElement('div');item.style.cssText='position:relative;width:80px;height:80px;border-radius:10px;overflow:hidden;flex-shrink:0';item.innerHTML=file.type.startsWith('image/')?'<img src="'+ev.target.result+'" style="width:100%;height:100%;object-fit:cover"/>':'<div style="width:100%;height:100%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:28px">🎥</div>';item.innerHTML+='<button onclick="this.parentElement.remove()" style="position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer">✕</button>';prev.appendChild(item);};reader.readAsDataURL(file);});e.target.value='';}
function toggleLocation(){var r=document.getElementById('loc-row');r.style.display=r.style.display==='none'?'flex':'none';}
function tagPeople(){
  makeModal('Tag People',
    '<div><div class="search-bar" style="margin:12px 16px"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search people to tag..." oninput="searchTagPeople(this.value)" id="tag-search" style="flex:1;background:none;border:none;font-size:14px;color:var(--t1)"/></div><div id="tag-people-list" style="max-height:300px;overflow-y:auto"></div><div id="tagged-people" style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;min-height:40px"></div></div>'
  );
  setTimeout(function(){searchTagPeople('');},100);
}
function openFeelings(){var p=document.getElementById('feeling-picker');p.style.display=p.style.display==='none'?'block':'none';if(p.style.display==='block')renderFeelingGrid('');}
function filterFeelings(q){renderFeelingGrid(q);}
function renderFeelingGrid(q){var grid=document.getElementById('feeling-grid');if(!grid)return;var list=q?FEELINGS.filter(function(f){return f.l.toLowerCase().includes(q.toLowerCase());}):FEELINGS;grid.innerHTML=list.map(function(f){return '<button onclick="selectFeeling(\''+f.e+'\',\''+f.l+'\')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:12px;cursor:pointer;border:none;background:none;font-size:12px;color:var(--t2)"><span style="font-size:26px">'+f.e+'</span><span>'+f.l+'</span></button>';}).join('');}
function selectFeeling(e,l){APP.selectedFeeling={e:e,l:l};document.getElementById('feeling-picker').style.display='none';var chip=document.getElementById('feeling-chip');chip.style.display='flex';chip.innerHTML='<span style="display:flex;align-items:center;gap:6px;background:rgba(124,58,237,.12);color:var(--acc);border:1px solid rgba(124,58,237,.25);border-radius:99px;padding:4px 12px;font-size:13px;font-weight:600">'+e+' feeling '+l+'<button onclick="removeFeeling()" style="margin-left:4px;border-radius:50%;background:rgba(124,58,237,.2);border:none;cursor:pointer;color:var(--acc);width:16px;height:16px;font-size:9px">✕</button></span>';showToast(e+' '+l+' added!');}
function removeFeeling(){APP.selectedFeeling=null;document.getElementById('feeling-chip').style.display='none';}
async function submitPost(){var caption=document.getElementById('post-text').value.trim();var location=document.getElementById('loc-inp')?document.getElementById('loc-inp').value.trim():'';var audience=document.getElementById('post-audience')?document.getElementById('post-audience').value:'public';if(APP.selectedFeeling)caption+=(caption?' ':'')+' — feeling '+APP.selectedFeeling.e+' '+APP.selectedFeeling.l;if(!caption&&!APP.mediaFiles.length){showToast('Write something or add a photo');return;}var btn=document.getElementById('post-btn');btn.textContent='Posting…';btn.disabled=true;try{var form=new FormData();form.append('caption',caption);form.append('location',location);form.append('audience',audience);APP.mediaFiles.forEach(function(f){form.append('images',f);});var d=await PostsAPI.create(form);closeCreate();document.getElementById('post-text').value='';APP.mediaFiles=[];APP.selectedFeeling=null;var cont=document.getElementById('feed-list');if(cont&&d.post)cont.insertBefore(buildPostCard(d.post),cont.firstChild);showToast('Posted! ✅');}catch(e){showToast(e.message||'Failed');}finally{btn.textContent='Post';btn.disabled=false;}}

/* ── UTILS ── */
function showToast(msg,ms){if(!ms)ms=2500;var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove('show');},ms);}
function fmtNum(n){n=parseInt(n)||0;if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return''+n;}
function fmtBytes(b){b=parseInt(b)||0;if(b>=1048576)return(b/1048576).toFixed(1)+'MB';if(b>=1024)return(b/1024).toFixed(0)+'KB';return b+'B';}
function timeAgo(d){var s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d';}
function fmtDate(d){return new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric'}).toUpperCase();}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function enc(s){return encodeURIComponent(s||'');}
function val(id){var el=document.getElementById(id);return el?el.value.trim():'';}
function setEl(id,txt){var el=document.getElementById(id);if(el)el.textContent=txt;}
function skelHtml(n,grid){if(grid)return Array(n*3).fill('<div style="aspect-ratio:1;background:var(--c3)"></div>').join('');return Array(n).fill('<div style="padding:14px;border-bottom:1px solid var(--b)"><div style="display:flex;gap:11px;margin-bottom:12px"><div style="width:44px;height:44px;border-radius:50%;background:var(--c3);flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:7px"><div style="height:13px;width:55%;border-radius:6px;background:var(--c3)"></div><div style="height:11px;width:35%;border-radius:6px;background:var(--c3)"></div></div></div><div style="width:100%;height:260px;background:var(--c3)"></div></div>').join('');}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){document.querySelectorAll('[id$="-overlay"]').forEach(function(el){if(el.style.display!=='none')el.style.display='none';});}});

/* ── SETTINGS FUNCTIONS ── */

function openLinkedAccounts() {
  makeModal('Linked Accounts',
    '<div style="padding:18px;display:flex;flex-direction:column;gap:10px">'+
    '<p style="font-size:14px;color:var(--t2);line-height:1.6">Link your social accounts for easier login and sharing.</p>'+
    '<div style="background:var(--c3);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px">'+
    '<div style="width:40px;height:40px;border-radius:50%;background:#EA433522;display:flex;align-items:center;justify-content:center;color:#EA4335;font-size:20px"><i class="fa-brands fa-google"></i></div>'+
    '<div style="flex:1"><div style="font-weight:600">Google</div><div style="font-size:12px;color:var(--t3)">Not linked</div></div>'+
    '<button onclick="showToast(\'Sign in with Google to link\')" style="padding:6px 14px;border-radius:99px;background:var(--acc);color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer">Link</button></div>'+
    '<div style="background:var(--c3);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px">'+
    '<div style="width:40px;height:40px;border-radius:50%;background:#1877F222;display:flex;align-items:center;justify-content:center;color:#1877F2;font-size:20px"><i class="fa-brands fa-facebook"></i></div>'+
    '<div style="flex:1"><div style="font-weight:600">Facebook</div><div style="font-size:12px;color:var(--t3)">Not linked</div></div>'+
    '<button onclick="showToast(\'Facebook linking coming soon\')" style="padding:6px 14px;border-radius:99px;background:var(--c5);color:var(--t1);font-size:13px;font-weight:600;border:1px solid var(--b);cursor:pointer">Soon</button></div>'+
    '</div>'
  );
}

function openTwoFactor() {
  makeModal('Two-Factor Authentication',
    '<div style="padding:18px;display:flex;flex-direction:column;gap:14px">'+
    '<div style="background:var(--c3);border-radius:14px;padding:16px;display:flex;align-items:center;gap:14px">'+
    '<div style="width:48px;height:48px;border-radius:50%;background:#8B5CF622;display:flex;align-items:center;justify-content:center;font-size:22px;color:#8B5CF6;flex-shrink:0"><i class="fa-solid fa-shield-halved"></i></div>'+
    '<div><div style="font-weight:600;margin-bottom:4px">Add extra security</div><div style="font-size:13px;color:var(--t3)">Two-factor authentication adds an extra layer of security to your account</div></div></div>'+
    '<button class="btn-grad full" onclick="showToast(\'2FA setup coming soon\')">Enable 2FA</button>'+
    '</div>'
  );
}

function openLoginActivity() {
  makeModal('Login Activity',
    '<div style="padding:18px;display:flex;flex-direction:column;gap:10px">'+
    '<div style="font-size:13px;color:var(--t3);margin-bottom:4px">Recent login sessions</div>'+
    '<div style="background:var(--c3);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px">'+
    '<div style="width:40px;height:40px;border-radius:50%;background:#22C55E22;display:flex;align-items:center;justify-content:center;color:#22C55E"><i class="fa-solid fa-desktop"></i></div>'+
    '<div style="flex:1"><div style="font-weight:600;font-size:14px">Windows · Chrome</div><div style="font-size:12px;color:var(--t3)">Current session · Active now</div></div>'+
    '<span style="background:#22C55E22;color:#22C55E;border-radius:99px;padding:3px 8px;font-size:11px;font-weight:600">Active</span></div>'+
    '<button class="settings-row danger" onclick="showToast(\'All other sessions logged out\')"><i class="fa-solid fa-right-from-bracket"></i> Log out all other sessions</button>'+
    '</div>'
  );
}

function openChatSettings() {
  makeModal('Chat Settings',
    '<div class="settings-list">'+
    '<div class="settings-sect-label">Chats</div>'+
    makeToggleRow('Enter to Send', false, 'enter-send')+
    makeToggleRow('Read Receipts', true, 'read-receipts')+
    makeToggleRow('Online Status', true, 'online-status')+
    makeToggleRow('Typing Indicator', true, 'typing-ind')+
    '<div class="settings-sect-label">Media</div>'+
    makeToggleRow('Auto-play Videos', true, 'auto-video')+
    makeToggleRow('Save to Gallery', false, 'save-gallery')+
    '<div class="settings-sect-label">Background</div>'+
    '<button class="settings-row" onclick="showToast(\'Chat wallpaper coming soon\')"><div class="s-ico" style="background:#7C3AED22;color:#7C3AED"><i class="fa-solid fa-image"></i></div>Chat Wallpaper<i class="fa-solid fa-chevron-right" style="margin-left:auto;color:var(--t3);font-size:12px"></i></button>'+
    '</div>'
  );
}

function openMediaAutoDownload() {
  makeModal('Media Auto-Download',
    '<div class="settings-list">'+
    '<div class="settings-sect-label">When using mobile data</div>'+
    makeToggleRow('Photos', true, 'dl-ph-data')+
    makeToggleRow('Videos', false, 'dl-vid-data')+
    makeToggleRow('Documents', false, 'dl-doc-data')+
    '<div class="settings-sect-label">When on WiFi</div>'+
    makeToggleRow('Photos', true, 'dl-ph-wifi')+
    makeToggleRow('Videos', true, 'dl-vid-wifi')+
    makeToggleRow('Documents', true, 'dl-doc-wifi')+
    '</div>'
  );
}

function openEmailNotifs() {
  makeModal('Email Notifications',
    '<div class="settings-list">'+
    makeToggleRow('Weekly Activity Digest', false, 'email-digest')+
    makeToggleRow('New Followers', true, 'email-follow')+
    makeToggleRow('Product Updates', false, 'email-product')+
    makeToggleRow('Tips & Tutorials', false, 'email-tips')+
    '</div>'
  );
}

function makeToggleRow(label, defaultOn, id) {
  var color = defaultOn ? 'var(--acc)' : 'var(--c3)';
  var pos   = defaultOn ? 'right:2px;left:auto' : 'left:2px;right:auto';
  return '<div class="settings-row" onclick="toggleSettingSwitch(\''+id+'\',this)">'+
    '<span>'+label+'</span>'+
    '<div id="sw-'+id+'" data-on="'+defaultOn+'" style="width:44px;height:24px;border-radius:99px;background:'+color+';cursor:pointer;position:relative;margin-left:auto;flex-shrink:0;transition:background .2s">'+
    '<div style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;'+pos+';transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div></div></div>';
}

function toggleSettingSwitch(id) {
  var sw = document.getElementById('sw-'+id); if (!sw) return;
  var on = sw.dataset.on === 'true';
  on = !on; sw.dataset.on = on;
  sw.style.background = on ? 'var(--acc)' : 'var(--c3)';
  var dot = sw.querySelector('div');
  if (dot) { dot.style.right = on ? '2px' : 'auto'; dot.style.left = on ? 'auto' : '2px'; }
}

/* ── TAG PEOPLE ── */
async function searchTagPeople(q) {
  var list = document.getElementById('tag-people-list'); if (!list) return;
  list.innerHTML = '<div class="center-pad"><div class="spin"></div></div>';
  try {
    var d = q ? await UsersAPI.search(q) : await UsersAPI.suggested();
    if (!d.users.length) { list.innerHTML = '<div class="empty-state"><p>No users found</p></div>'; return; }
    list.innerHTML = d.users.map(function(u) {
      var avy = 'https://ui-avatars.com/api/?name='+encodeURIComponent(u.name)+'&background=7C3AED&color=fff';
      return '<div class="settings-row" style="cursor:pointer" onclick="addTag(\''+u.username+'\',\''+u.name+'\')">'+
        '<img src="'+u.avatar+'" onerror="this.src=\''+avy+'\'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0"/>'+
        '<div><div style="font-weight:600;font-size:14px">'+esc(u.name)+'</div><div style="font-size:13px;color:var(--t3)">@'+u.username+'</div></div>'+
        '</div>';
    }).join('');
  } catch(e) { list.innerHTML = '<div class="empty-state"><p>'+e.message+'</p></div>'; }
}

function addTag(username, name) {
  var container = document.getElementById('tagged-people'); if (!container) return;
  if (container.querySelector('[data-tag="'+username+'"]')) { showToast('Already tagged'); return; }
  var chip = document.createElement('div');
  chip.setAttribute('data-tag', username);
  chip.style.cssText = 'display:flex;align-items:center;gap:6px;background:rgba(124,58,237,.12);color:var(--acc);border:1px solid rgba(124,58,237,.25);border-radius:99px;padding:5px 12px;font-size:13px;font-weight:600';
  chip.innerHTML = '@'+username+'<button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--acc);font-size:11px;margin-left:2px">✕</button>';
  container.appendChild(chip);
  showToast('@'+username+' tagged!');
  var inp = document.getElementById('tag-search'); if (inp) inp.value = '';
  searchTagPeople('');
}

/* ── USER PROFILE VISIT ── */
async function openUserProfile(username) {
  makeModal('Profile',
    '<div style="text-align:center;padding:20px 16px 0"><div class="spin"></div></div>'
  );
  try {
    var d = await UsersAPI.profile(username);
    var u = d.user;
    var avy = 'https://ui-avatars.com/api/?name='+encodeURIComponent(u.name)+'&background=7C3AED&color=fff';
    var modal = document.getElementById('settings-modal-dynamic');
    if (!modal) return;
    var sheet = modal.querySelector('div');
    sheet.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--b);position:sticky;top:0;background:var(--c4);z-index:1;border-radius:20px 20px 0 0">'+
      '<span style="font-size:17px;font-weight:700">Profile</span>'+
      '<button onclick="document.getElementById(\'settings-modal-dynamic\').remove()" style="width:34px;height:34px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-xmark"></i></button></div>'+
      '<div style="padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:12px">'+
      '<img src="'+u.avatar+'" onerror="this.src=\''+avy+'\'" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--b)"/>'+
      '<div style="text-align:center"><div style="font-size:20px;font-weight:700">'+esc(u.name)+'</div>'+
      '<div style="color:var(--t3);font-size:14px;margin-top:3px">@'+u.username+'</div>'+
      (u.bio ? '<div style="color:var(--t2);font-size:14px;margin-top:8px;line-height:1.5">'+esc(u.bio)+'</div>' : '')+
      (u.is_online ? '<div style="color:var(--online);font-size:13px;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:var(--online);display:inline-block"></span>Online</div>' : '<div style="color:var(--t3);font-size:13px;margin-top:6px">Offline</div>')+
      '</div>'+
      '<div style="display:flex;gap:24px;padding:12px 0;border-top:1px solid var(--b);border-bottom:1px solid var(--b);width:100%;justify-content:center">'+
      '<div style="text-align:center"><div style="font-size:20px;font-weight:700">'+fmtNum(u.posts_count||0)+'</div><div style="font-size:12px;color:var(--t3)">Posts</div></div>'+
      '<div style="text-align:center"><div style="font-size:20px;font-weight:700">'+fmtNum(u.followers||0)+'</div><div style="font-size:12px;color:var(--t3)">Followers</div></div>'+
      '<div style="text-align:center"><div style="font-size:20px;font-weight:700">'+fmtNum(u.following||0)+'</div><div style="font-size:12px;color:var(--t3)">Following</div></div>'+
      '</div>'+
      '<div style="display:flex;gap:10px;width:100%;padding-top:4px">'+
      '<button onclick="followUserFromProfile(this,'+u.id+')" style="flex:1;padding:10px;border-radius:99px;background:'+(u.is_following?'var(--c3)':'var(--acc)')+';color:'+(u.is_following?'var(--t1)':'#fff')+';font-weight:600;font-size:14px;border:'+(u.is_following?'1px solid var(--b)':'none')+';cursor:pointer">'+(u.is_following?'Following':'Follow')+'</button>'+
      '<button onclick="startNewChat('+u.id+')" style="flex:1;padding:10px;border-radius:99px;background:var(--c3);color:var(--t1);font-weight:600;font-size:14px;border:1px solid var(--b);cursor:pointer">Message</button>'+
      '</div>'+
      '</div>';
  } catch(e) { showToast(e.message); document.getElementById('settings-modal-dynamic')?.remove(); }
}

async function followUserFromProfile(btn, id) {
  try {
    var d = await UsersAPI.follow(id);
    btn.textContent = d.following ? 'Following' : 'Follow';
    btn.style.background = d.following ? 'var(--c3)' : 'var(--acc)';
    btn.style.color = d.following ? 'var(--t1)' : '#fff';
    btn.style.border = d.following ? '1px solid var(--b)' : 'none';
    showToast(d.following ? 'Following! 🎉' : 'Unfollowed');
  } catch(e) { showToast(e.message); }
}

/* ── CALLING (UI) ── */
function openVoiceCall(name) {
  makeModal('Voice Call',
    '<div style="padding:30px 20px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center">'+
    '<div style="width:80px;height:80px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;animation:pulse 1.5s infinite"><i class="fa-solid fa-phone"></i></div>'+
    '<div><div style="font-size:20px;font-weight:700">'+esc(name)+'</div><div style="color:var(--t3);font-size:14px;margin-top:4px">Calling...</div></div>'+
    '<div style="display:flex;gap:20px;margin-top:10px">'+
    '<button onclick="showToast(\'Muted\')" style="width:56px;height:56px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;font-size:20px"><i class="fa-solid fa-microphone-slash"></i></button>'+
    '<button onclick="document.getElementById(\'settings-modal-dynamic\').remove()" style="width:56px;height:56px;border-radius:50%;background:#EF4444;border:none;cursor:pointer;font-size:20px;color:#fff"><i class="fa-solid fa-phone-slash"></i></button>'+
    '<button onclick="showToast(\'Speaker on\')" style="width:56px;height:56px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;font-size:20px"><i class="fa-solid fa-volume-high"></i></button>'+
    '</div></div>'
  );
  showToast('Voice calls coming soon 📞');
}

function openVideoCall(name) {
  makeModal('Video Call',
    '<div style="padding:30px 20px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center">'+
    '<div style="width:80px;height:80px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;animation:pulse 1.5s infinite"><i class="fa-solid fa-video"></i></div>'+
    '<div><div style="font-size:20px;font-weight:700">'+esc(name)+'</div><div style="color:var(--t3);font-size:14px;margin-top:4px">Video calling...</div></div>'+
    '<div style="display:flex;gap:20px;margin-top:10px">'+
    '<button onclick="showToast(\'Camera off\')" style="width:56px;height:56px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;font-size:20px"><i class="fa-solid fa-video-slash"></i></button>'+
    '<button onclick="document.getElementById(\'settings-modal-dynamic\').remove()" style="width:56px;height:56px;border-radius:50%;background:#EF4444;border:none;cursor:pointer;font-size:20px;color:#fff"><i class="fa-solid fa-phone-slash"></i></button>'+
    '<button onclick="showToast(\'Muted\')" style="width:56px;height:56px;border-radius:50%;background:var(--c3);border:none;cursor:pointer;font-size:20px"><i class="fa-solid fa-microphone-slash"></i></button>'+
    '</div></div>'
  );
  showToast('Video calls coming soon 📹');
}
