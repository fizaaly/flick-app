/* ── FLICK STORIES ── */
'use strict';
const SV = { groups:[], gi:0, si:0, timer:null };

async function loadStories() {
  const row = document.getElementById('stories-row');
  if (!row) return;
  const add = row.querySelector('.add-story');
  row.innerHTML = ''; if (add) row.appendChild(add);
  try {
    const d = await StoriesAPI.get();
    SV.groups = d.story_groups || [];
    SV.groups.forEach((g, i) => {
      const item = document.createElement('div');
      item.className = 'story-item';
      item.innerHTML = `<div class="story-ring ${g.seen_all?'seen':''}"><img class="story-av" src="${g.user.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(g.user.name)}&background=7C3AED&color=fff'"/></div><span>${g.user.name.split(' ')[0]}</span>`;
      item.onclick = () => openStory(i);
      row.appendChild(item);
    });
  } catch {}
}

function openStory(gi) {
  SV.gi = gi; SV.si = 0;
  document.getElementById('story-overlay').style.display = 'flex';
  showStory();
}

function showStory() {
  const g = SV.groups[SV.gi];
  if (!g) { closeStory(); return; }
  const s = g.stories[SV.si];
  if (!s) { if (SV.gi < SV.groups.length - 1) { SV.gi++; SV.si = 0; showStory(); } else closeStory(); return; }
  document.getElementById('story-bg').style.cssText = `position:absolute;inset:0;background:url('${s.media_url}') center/cover;filter:blur(20px) brightness(.4) scale(1.1);transform:translateZ(0)`;
  const mediaArea = document.getElementById('story-overlay');
  let mediaEl = mediaArea.querySelector('.story-media-el');
  if (!mediaEl) { mediaEl = document.createElement('img'); mediaEl.className = 'story-media-el'; mediaEl.style.cssText = 'position:absolute;z-index:1;max-width:100%;max-height:100%;object-fit:contain;left:50%;top:50%;transform:translate(-50%,-50%)'; mediaArea.appendChild(mediaEl); }
  mediaEl.src = s.media_url;
  document.getElementById('story-uav').src = g.user.avatar;
  document.getElementById('story-uname').textContent = g.user.name;
  document.getElementById('story-utime').textContent = timeAgo(s.created_at);
  const pb = document.getElementById('story-prog-row'); pb.innerHTML = '';
  g.stories.forEach((_, i) => {
    const bar = document.createElement('div');
    bar.style.cssText = 'flex:1;height:2px;background:rgba(255,255,255,.3);border-radius:99px;overflow:hidden';
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:#fff;border-radius:99px;width:' + (i < SV.si ? '100%' : '0%');
    if (i === SV.si) { fill.style.transition = 'width 5s linear'; requestAnimationFrame(() => fill.style.width = '100%'); }
    bar.appendChild(fill); pb.appendChild(bar);
  });
  StoriesAPI.view(s.id).catch(() => {});
  const items = document.querySelectorAll('#stories-row .story-item:not(.add-story)');
  if (items[SV.gi]) items[SV.gi].querySelector('.story-ring')?.classList.add('seen');
  clearTimeout(SV.timer);
  SV.timer = setTimeout(storyNext, 5000);
}

function storyNext() { const g = SV.groups[SV.gi]; if (!g) { closeStory(); return; } if (SV.si < g.stories.length - 1) { SV.si++; showStory(); } else if (SV.gi < SV.groups.length - 1) { SV.gi++; SV.si = 0; showStory(); } else closeStory(); }
function storyPrev() { if (SV.si > 0) { SV.si--; showStory(); } else if (SV.gi > 0) { SV.gi--; SV.si = 0; showStory(); } }
function closeStory() { clearTimeout(SV.timer); document.getElementById('story-overlay').style.display = 'none'; }
function sendStoryReply() { const inp = document.getElementById('story-reply-inp'); const g = SV.groups[SV.gi]; if (!inp?.value.trim() || !g) return; MessagesAPI.send(g.user.id, inp.value.trim(), 'text').then(() => showToast('Replied 💬')).catch(e => showToast(e.message)); inp.value = ''; }
function storyReact(em) { const g = SV.groups[SV.gi]; if (!g) return; MessagesAPI.send(g.user.id, em, 'text').then(() => showToast(em + ' sent!')).catch(() => {}); }
document.addEventListener('mousedown', e => { if (e.target.closest('#story-overlay') && !e.target.closest('.story-nav-l') && !e.target.closest('.story-nav-r') && !e.target.closest('.story-bottom-row')) { clearTimeout(SV.timer); } });
document.addEventListener('mouseup',   e => { if (e.target.closest('#story-overlay') && document.getElementById('story-overlay').style.display !== 'none') { SV.timer = setTimeout(storyNext, 4000); } });
