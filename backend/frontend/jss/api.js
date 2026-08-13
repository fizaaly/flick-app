/* ── FLICK API CLIENT ── */
'use strict';

// Auto-detect: agar ngrok ya koi aur domain hai to wahi use karo
const BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://flick-app-production-822e.up.railway.app/api';

/* ── AUTH STORAGE ── */
const Auth = {
  getToken()   { return localStorage.getItem('flick-token'); },
  setToken(t)  { localStorage.setItem('flick-token', t); },
  getRefresh() { return localStorage.getItem('flick-refresh'); },
  setRefresh(t){ localStorage.setItem('flick-refresh', t); },
  setUser(u)   { localStorage.setItem('flick-user', JSON.stringify(u)); },
  getUser()    { try { return JSON.parse(localStorage.getItem('flick-user')); } catch { return null; } },
  clear()      { ['flick-token','flick-refresh','flick-user'].forEach(k => localStorage.removeItem(k)); },
  isLoggedIn() { return !!this.getToken(); }
};

/* ── FETCH WRAPPER ── */
async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...opts, headers });
  } catch (networkErr) {
    throw { status: 0, message: 'Cannot connect to server. Make sure backend is running at localhost:5000' };
  }

  if (res.status === 401 && Auth.getRefresh()) {
    try {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Auth.getRefresh()}` }
      });
      if (r.ok) {
        const d = await r.json();
        Auth.setToken(d.access_token);
        headers['Authorization'] = `Bearer ${d.access_token}`;
        res = await fetch(`${BASE}${path}`, { ...opts, headers });
      } else { Auth.clear(); location.reload(); return; }
    } catch { Auth.clear(); location.reload(); return; }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.error || 'Something went wrong' };
  return data;
}

const api = {
  get:    p       => apiFetch(p, { method: 'GET' }),
  post:   (p, b)  => apiFetch(p, { method: 'POST',   body: b instanceof FormData ? b : JSON.stringify(b) }),
  put:    (p, b)  => apiFetch(p, { method: 'PUT',    body: JSON.stringify(b) }),
  del:    p       => apiFetch(p, { method: 'DELETE' }),
  upload: (p, f)  => apiFetch(p, { method: 'POST',   body: f }),
};

const AuthAPI     = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
  logout:   () => api.post('/auth/logout', {}),
  me:       () => api.get('/auth/me'),
  update:   d => api.put('/auth/me', d),
};
const PostsAPI    = {
  feed:       (p=1)      => api.get(`/posts/feed?page=${p}`),
  explore:    (p=1,q='') => api.get(`/posts/explore?page=${p}&q=${encodeURIComponent(q)}`),
  get:        id         => api.get(`/posts/${id}`),
  create:     f          => api.upload('/posts', f),
  delete:     id         => api.del(`/posts/${id}`),
  like:       id         => api.post(`/posts/${id}/like`, {}),
  save:       id         => api.post(`/posts/${id}/save`, {}),
  saved:      ()         => api.get('/posts/saved'),
  comments:   (id,p=1)   => api.get(`/posts/${id}/comments?page=${p}`),
  addComment: (id,t)     => api.post(`/posts/${id}/comments`, { text: t }),
  delComment: id         => api.del(`/posts/comments/${id}`),
};
const MessagesAPI = {
  conversations: ()        => api.get('/messages/conversations'),
  getChat:       (uid,p=1) => api.get(`/messages/conversations/${uid}?page=${p}`),
  send:          (rid,txt,type='text') => api.post('/messages/send', { receiver_id: rid, text: txt, type }),
  sendFile:      f         => api.upload('/messages/send-file', f),
  react:         (id,e)    => api.post(`/messages/${id}/react`, { emoji: e }),
  markRead:      cid       => api.post(`/messages/conversations/${cid}/read`, {}),
};
const StoriesAPI  = {
  get:    ()  => api.get('/stories'),
  create: f   => api.upload('/stories', f),
  view:   id  => api.post(`/stories/${id}/view`, {}),
  delete: id  => api.del(`/stories/${id}`),
};
const UsersAPI    = {
  search:    q         => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  suggested: ()        => api.get('/users/suggested'),
  profile:   u         => api.get(`/users/${u}`),
  posts:     (u,p=1)   => api.get(`/users/${u}/posts?page=${p}`),
  follow:    id        => api.post(`/users/${id}/follow`, {}),
  followers: id        => api.get(`/users/${id}/followers`),
  following: id        => api.get(`/users/${id}/following`),
  avatar:    f         => api.upload('/users/avatar', f),
};
