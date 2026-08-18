import './style.css';
import { AVARA_SONGS } from './songs.js';

// ─── LocalStorage Persistence Keys ───────────────────────────────────────────
const KEY_LAST_SONG_ID = 'avara_last_song_id';
const KEY_LAST_TIME    = 'avara_last_progress_time';
const KEY_LIKED_IDS    = 'avara_liked_song_ids';

// ─── State ───────────────────────────────────────────────────────────────────
let ytPlayer     = null;
let ytIsReady    = false;
let pendingPlay  = null;
let currentIdx   = 0;
let isPlaying    = false;
let playlist     = AVARA_SONGS.filter(Boolean);
let likedSet     = new Set();
let shuffleOn    = false;
let repeatOn     = false;
let progressInt  = null;
let inPlayer     = false;
let initialSeek  = 0; // Seek time from saved session state

// ─── DOM References ──────────────────────────────────────────────────────────
let D = {};

function grabDOM() {
  D.homeView        = document.getElementById('home-view');
  D.playerView      = document.getElementById('player-view');
  D.songList        = document.getElementById('song-list');
  D.playerBg        = document.getElementById('player-bg');
  D.playerArt       = document.getElementById('player-art');
  D.playerTitle     = document.getElementById('player-title');
  D.playerArtist    = document.getElementById('player-artist');
  D.playerLikeBtn   = document.getElementById('player-like-btn');
  D.playerLikeSvg   = document.getElementById('player-like-svg');
  D.lyricsLine      = document.getElementById('lyrics-line');
  D.progressTrack   = document.getElementById('progress-track');
  D.progressFill    = document.getElementById('progress-fill');
  D.progressThumb   = document.getElementById('progress-thumb');
  D.timeCur         = document.getElementById('time-cur');
  D.timeRem         = document.getElementById('time-rem');
  D.playPauseBtn    = document.getElementById('play-pause-btn');
  D.playIcon        = document.getElementById('play-icon');
  D.pauseIcon       = document.getElementById('pause-icon');
  D.prevBtn         = document.getElementById('prev-btn');
  D.nextBtn         = document.getElementById('next-btn');
  D.shuffleBtn      = document.getElementById('shuffle-btn');
  D.repeatBtn       = document.getElementById('repeat-btn');
  D.backBtn         = document.getElementById('back-btn');
  D.volSlider       = document.getElementById('vol-slider');

  // Mini player
  D.miniPlayer      = document.getElementById('mini-player');
  D.miniArt         = document.getElementById('mini-art');
  D.miniTitle       = document.getElementById('mini-title');
  D.miniArtist      = document.getElementById('mini-artist');
  D.miniOpen        = document.getElementById('mini-open');
  D.miniPlayBtn     = document.getElementById('mini-play-btn');
  D.miniPlayIcon    = document.getElementById('mini-play-icon');
  D.miniPauseIcon   = document.getElementById('mini-pause-icon');
  D.miniProgFill    = document.getElementById('mini-prog-fill');

  // Desktop sidebar
  D.sdPlayerPanel   = document.getElementById('sd-player-panel');
  D.sdArt           = document.getElementById('sd-art');
  D.sdTitle         = document.getElementById('sd-title');
  D.sdArtist        = document.getElementById('sd-artist');
  D.sdProgressFill  = document.getElementById('sd-progress-fill');
  D.sdCur           = document.getElementById('sd-cur');
  D.sdRem           = document.getElementById('sd-rem');
  D.sdPlayBtn       = document.getElementById('sd-play');
  D.sdPlayIcon      = document.getElementById('sd-play-icon');
  D.sdPauseIcon     = document.getElementById('sd-pause-icon');
  D.sdPrevBtn       = document.getElementById('sd-prev');
  D.sdNextBtn       = document.getElementById('sd-next');
  D.sdProgressTrack = document.getElementById('sd-progress-track');
  D.sdDiscover      = document.getElementById('sd-discover');
  D.sdSearch        = document.getElementById('sd-search');
  D.sdLibrary       = document.getElementById('sd-library');
  D.sdLiked         = document.getElementById('sd-liked');

  // Nav (mobile)
  D.navHome         = document.getElementById('nav-home');
  D.navSearch       = document.getElementById('nav-search-mob');
  D.navMusic        = document.getElementById('nav-music-mob');
  D.navLiked        = document.getElementById('nav-liked-mob');

  // Search & Chips
  D.searchToggle    = document.getElementById('search-toggle-btn');
  D.searchBar       = document.getElementById('search-bar');
  D.searchInput     = document.getElementById('search-input');
  D.searchClose     = document.getElementById('search-close');
  D.topChips        = document.querySelectorAll('.top-chip');
  D.quickCards      = document.querySelectorAll('.quick-card');
  D.shelfCards      = document.querySelectorAll('.shelf-card');
}

// ─── Restore Persistence ─────────────────────────────────────────────────────
function restoreSavedState() {
  // Restore Liked Songs
  try {
    const rawLiked = localStorage.getItem(KEY_LIKED_IDS);
    if (rawLiked) {
      const arr = JSON.parse(rawLiked);
      arr.forEach(id => {
        const idx = playlist.findIndex(s => s.id === id);
        if (idx !== -1) likedSet.add(idx);
      });
    }
  } catch(e) { console.warn('Failed restoring liked songs', e); }

  // Restore Last Song & Seek Position
  try {
    const savedSongId = localStorage.getItem(KEY_LAST_SONG_ID);
    const savedTime   = parseFloat(localStorage.getItem(KEY_LAST_TIME) || '0');

    if (savedSongId) {
      const idx = playlist.findIndex(s => s.id === savedSongId);
      if (idx !== -1) {
        currentIdx = idx;
        initialSeek = savedTime > 0 ? savedTime : 0;
      }
    }
  } catch(e) { console.warn('Failed restoring last song', e); }
}

function saveState() {
  try {
    const currentSong = playlist[currentIdx];
    if (currentSong) {
      localStorage.setItem(KEY_LAST_SONG_ID, currentSong.id);
    }
    // Save liked ids
    const likedIds = Array.from(likedSet).map(idx => playlist[idx] && playlist[idx].id).filter(Boolean);
    localStorage.setItem(KEY_LIKED_IDS, JSON.stringify(likedIds));
  } catch(e) {}
}

function savePlaybackTime(sec) {
  try {
    if (sec > 0) localStorage.setItem(KEY_LAST_TIME, sec.toString());
  } catch(e) {}
}

// ─── YouTube Init ────────────────────────────────────────────────────────────
function initYT() {
  const initialSong = playlist[currentIdx] || playlist[0];
  function create() {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '180', width: '320',
      videoId: initialSong.id,
      playerVars: {
        autoplay: 0, controls: 0, playsinline: 1,
        rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0,
      },
      events: {
        onReady() {
          ytIsReady = true;
          if (initialSeek > 0) {
            try { ytPlayer.seekTo(initialSeek, false); } catch(_) {}
          }
          if (pendingPlay !== null) {
            const idx = pendingPlay; pendingPlay = null;
            _doPlay(idx);
          }
        },
        onStateChange: onYTState,
        onError(e) { console.warn('YT error', e.data); setTimeout(nextTrack, 1500); },
      },
    });
  }
  if (window._ytReady) create();
  else window._ytCbs.push(create);
}

function onYTState(e) {
  const S = window.YT.PlayerState;
  if (e.data === S.PLAYING) {
    isPlaying = true;
    setPlayUI(true);
    startTick();
  } else if (e.data === S.PAUSED) {
    isPlaying = false;
    setPlayUI(false);
  } else if (e.data === S.ENDED) {
    if (repeatOn) { ytPlayer.seekTo(0,true); ytPlayer.playVideo(); }
    else nextTrack();
  }
}

// ─── Playback Controls ───────────────────────────────────────────────────────
function _doPlay(idx) {
  const song = playlist[idx];
  if (!song) return;
  saveState();

  if (initialSeek > 0) {
    const startSec = Math.floor(initialSeek);
    initialSeek = 0; // reset for future plays
    ytPlayer.loadVideoById({ videoId: song.id, startSeconds: startSec });
  } else {
    ytPlayer.loadVideoById({ videoId: song.id, startSeconds: 0 });
  }
  ytPlayer.playVideo();
}

function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;
  initialSeek = 0; // New track starts from beginning

  updateTrackUI(playlist[currentIdx]);
  showMini();
  highlightRow();

  if (ytIsReady && ytPlayer) _doPlay(idx);
  else pendingPlay = idx;
}

function togglePlay() {
  if (!ytIsReady || !ytPlayer) {
    playTrack(currentIdx);
    return;
  }
  if (isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    if (initialSeek > 0) {
      _doPlay(currentIdx);
    } else {
      ytPlayer.playVideo();
    }
  }
}

function prevTrack() { playTrack(shuffleOn ? randIdx() : currentIdx - 1); }
function nextTrack() { playTrack(shuffleOn ? randIdx() : currentIdx + 1); }
function randIdx()   { return Math.floor(Math.random() * playlist.length); }

// ─── UI Updates ──────────────────────────────────────────────────────────────
function updateTrackUI(song) {
  if (!song) return;
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;

  // Player view
  if (D.playerArt)    D.playerArt.src = thumb;
  if (D.playerTitle)  D.playerTitle.textContent = song.title;
  if (D.playerArtist) D.playerArtist.textContent = song.artist;
  if (D.playerBg)     D.playerBg.style.backgroundImage = `url(${thumb})`;

  // Mini player
  if (D.miniArt)    D.miniArt.src    = thumb;
  if (D.miniTitle)  D.miniTitle.textContent  = song.title;
  if (D.miniArtist) D.miniArtist.textContent = song.artist;

  // Desktop sidebar
  if (D.sdArt) {
    D.sdArt.src = thumb;
    if (D.sdPlayerPanel) D.sdPlayerPanel.classList.remove('hidden');
  }
  if (D.sdTitle)  D.sdTitle.textContent  = song.title;
  if (D.sdArtist) D.sdArtist.textContent = song.artist;

  setLikeUI(likedSet.has(currentIdx));
}

function setPlayUI(playing) {
  if (D.playIcon)     D.playIcon.style.display     = playing ? 'none' : '';
  if (D.pauseIcon)    D.pauseIcon.style.display    = playing ? '' : 'none';
  if (D.miniPlayIcon) D.miniPlayIcon.style.display  = playing ? 'none' : '';
  if (D.miniPauseIcon)D.miniPauseIcon.style.display = playing ? '' : 'none';
  if (D.sdPlayIcon)   D.sdPlayIcon.style.display    = playing ? 'none' : '';
  if (D.sdPauseIcon)  D.sdPauseIcon.style.display   = playing ? '' : 'none';
}

function setLikeUI(liked) {
  if (D.playerLikeBtn) D.playerLikeBtn.classList.toggle('liked', liked);
}

function highlightRow() {
  document.querySelectorAll('.song-row').forEach((r) => {
    const idx = parseInt(r.dataset.idx);
    r.classList.toggle('playing', idx === currentIdx);
  });
}

// ─── Progress Tick & Persistence ─────────────────────────────────────────────
function startTick() {
  if (progressInt) clearInterval(progressInt);
  progressInt = setInterval(() => {
    if (!ytIsReady || !ytPlayer || !isPlaying) return;
    try {
      const cur = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration() || 1;
      const pct = (cur / dur) * 100;

      savePlaybackTime(cur);

      // Main player
      if (D.progressFill)  D.progressFill.style.width = pct + '%';
      if (D.progressThumb) D.progressThumb.style.left = pct + '%';
      if (D.timeCur) D.timeCur.textContent = fmt(cur);
      if (D.timeRem) D.timeRem.textContent = '-' + fmt(dur - cur);

      // Mini player
      if (D.miniProgFill) D.miniProgFill.style.width = pct + '%';

      // Desktop sidebar
      if (D.sdProgressFill) D.sdProgressFill.style.width = pct + '%';
      if (D.sdCur) D.sdCur.textContent = fmt(cur);
      if (D.sdRem) D.sdRem.textContent = '-' + fmt(dur - cur);
    } catch(_) {}
  }, 400);
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s/60), sc = Math.floor(s%60);
  return `${m}:${sc<10?'0':''}${sc}`;
}

// ─── View Switching ──────────────────────────────────────────────────────────
function openPlayer() {
  inPlayer = true;
  D.homeView.classList.replace('active-view','hidden-view');
  D.playerView.classList.replace('hidden-view','active-view');
  if (D.miniPlayer) D.miniPlayer.classList.add('hidden');
  setMobNav(null);
}

function closePlayer() {
  inPlayer = false;
  D.playerView.classList.replace('active-view','hidden-view');
  D.homeView.classList.replace('hidden-view','active-view');
  setMobNav(D.navHome);
  showMini();
}

function showMini() {
  if (!inPlayer && D.miniPlayer) {
    D.miniPlayer.classList.remove('hidden');
  }
}

// ─── Song List Render ────────────────────────────────────────────────────────
let _currentFilter = 'all';

function renderSongList(songs, filter) {
  if (!D.songList) return;
  if (filter !== undefined) _currentFilter = filter;
  D.songList.innerHTML = '';
  const safe = (songs || playlist).filter(Boolean);

  if (safe.length === 0 && _currentFilter === 'liked') {
    D.songList.innerHTML = `
      <div style="text-align:center;padding:50px 24px;color:var(--text-sub)">
        <div style="font-size:42px;margin-bottom:8px">💚</div>
        <div style="font-size:16px;font-weight:700">No Liked Songs Yet</div>
        <div style="font-size:13px;margin-top:4px">Tap ♡ on any song to save it to your Library</div>
      </div>
    `;
    return;
  }

  safe.forEach((song, i) => {
    const realIdx = playlist.indexOf(song);
    const liked   = likedSet.has(realIdx);
    const el = document.createElement('div');
    el.className = 'song-row' + (realIdx === currentIdx && isPlaying ? ' playing' : '');
    el.dataset.idx = realIdx;
    el.innerHTML = `
      <div class="song-thumb-wrap">
        <img class="song-thumb" src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
      </div>
      <div class="song-row-info">
        <div class="song-row-title">${song.title}</div>
        <div class="song-row-artist">${song.artist}</div>
      </div>
      <button class="song-row-like-btn ${liked ? 'liked' : ''}" data-idx="${realIdx}" aria-label="Like">
        <svg viewBox="0 0 24 24" fill="${liked ? 'var(--spotify-green)' : 'none'}" stroke="${liked ? 'var(--spotify-green)' : 'currentColor'}" stroke-width="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
    `;

    el.addEventListener('click', (e) => {
      if (e.target.closest('.song-row-like-btn')) return;
      playTrack(realIdx);
      openPlayer();
    });

    el.querySelector('.song-row-like-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(e.currentTarget.dataset.idx);
      const btn = e.currentTarget;
      const svg = btn.querySelector('svg');
      if (likedSet.has(idx)) {
        likedSet.delete(idx);
        btn.classList.remove('liked');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
      } else {
        likedSet.add(idx);
        btn.classList.add('liked');
        svg.setAttribute('fill', 'var(--spotify-green)');
        svg.setAttribute('stroke', 'var(--spotify-green)');
      }
      saveState();
      if (idx === currentIdx) setLikeUI(likedSet.has(idx));
    });

    D.songList.appendChild(el);
  });
}

// ─── Nav Helpers ─────────────────────────────────────────────────────────────
function setMobNav(btn) {
  [D.navHome, D.navSearch, D.navMusic, D.navLiked].forEach(b => b && b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}
function setSdNav(btn) {
  [D.sdDiscover, D.sdSearch, D.sdLibrary, D.sdLiked].forEach(b => b && b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ─── Event Bindings ──────────────────────────────────────────────────────────
function bindAll() {
  // Player controls
  D.backBtn.addEventListener('click', closePlayer);
  D.playPauseBtn.addEventListener('click', togglePlay);
  D.prevBtn.addEventListener('click', prevTrack);
  D.nextBtn.addEventListener('click', nextTrack);
  D.shuffleBtn.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    D.shuffleBtn.classList.toggle('active', shuffleOn);
  });
  D.repeatBtn.addEventListener('click', () => {
    repeatOn = !repeatOn;
    D.repeatBtn.classList.toggle('active', repeatOn);
  });
  D.playerLikeBtn.addEventListener('click', () => {
    if (likedSet.has(currentIdx)) likedSet.delete(currentIdx);
    else likedSet.add(currentIdx);
    setLikeUI(likedSet.has(currentIdx));
    saveState();
    highlightRow();
  });

  // Progress seek
  D.progressTrack.addEventListener('click', (e) => {
    if (!ytIsReady || !ytPlayer) return;
    const r = D.progressTrack.getBoundingClientRect();
    const targetSec = (ytPlayer.getDuration() || 0) * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    ytPlayer.seekTo(targetSec, true);
    savePlaybackTime(targetSec);
  });

  // Volume
  if (D.volSlider) D.volSlider.addEventListener('input', () => {
    if (ytIsReady && ytPlayer) ytPlayer.setVolume(+D.volSlider.value);
  });

  // Mini player
  D.miniOpen.addEventListener('click', openPlayer);
  D.miniPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

  // Desktop sidebar controls
  if (D.sdPlayBtn) D.sdPlayBtn.addEventListener('click', togglePlay);
  if (D.sdPrevBtn) D.sdPrevBtn.addEventListener('click', prevTrack);
  if (D.sdNextBtn) D.sdNextBtn.addEventListener('click', nextTrack);
  if (D.sdProgressTrack) D.sdProgressTrack.addEventListener('click', (e) => {
    if (!ytIsReady || !ytPlayer) return;
    const r = D.sdProgressTrack.getBoundingClientRect();
    const targetSec = (ytPlayer.getDuration() || 0) * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    ytPlayer.seekTo(targetSec, true);
    savePlaybackTime(targetSec);
  });

  // Sidebar Nav
  if (D.sdDiscover) D.sdDiscover.addEventListener('click', () => { setSdNav(D.sdDiscover); renderSongList(playlist, 'all'); });
  if (D.sdSearch)   D.sdSearch.addEventListener('click',   () => { setSdNav(D.sdSearch); toggleSearch(); });
  if (D.sdLibrary)  D.sdLibrary.addEventListener('click',  () => { setSdNav(D.sdLibrary); renderSongList(playlist, 'all'); });
  if (D.sdLiked)    D.sdLiked.addEventListener('click',    () => {
    setSdNav(D.sdLiked);
    const liked = playlist.filter((_,i) => likedSet.has(i));
    renderSongList(liked, 'liked');
  });

  // Mobile Bottom Nav
  D.navHome.addEventListener('click',   () => { setMobNav(D.navHome); renderSongList(playlist, 'all'); closePlayer(); });
  D.navSearch.addEventListener('click', () => { setMobNav(D.navSearch); closePlayer(); toggleSearch(); });
  D.navMusic.addEventListener('click',  () => { setMobNav(D.navMusic); renderSongList(playlist, 'all'); closePlayer(); });
  D.navLiked.addEventListener('click',  () => {
    setMobNav(D.navLiked);
    closePlayer();
    const liked = playlist.filter((_,i) => likedSet.has(i));
    renderSongList(liked, 'liked');
  });

  // Search
  if (D.searchToggle) D.searchToggle.addEventListener('click', toggleSearch);
  if (D.searchInput) D.searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderSongList(q ? playlist.filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    ) : playlist);
  });
  if (D.searchClose) D.searchClose.addEventListener('click', () => {
    D.searchBar.classList.add('hidden');
    D.searchInput.value = '';
    renderSongList(playlist, 'all');
  });

  // Top Category Chips
  D.topChips.forEach(chip => chip.addEventListener('click', () => {
    D.topChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const f = chip.dataset.filter;
    if (f === 'all') {
      renderSongList(playlist, 'all');
    } else if (f === 'trending') {
      renderSongList(playlist.slice(0, 12), 'trending');
    } else if (f === 'romantic') {
      const romantic = playlist.filter(s => s.artist && (s.artist.includes('Sonu') || s.title.includes('Love') || s.title.includes('Dil') || s.category?.includes('यादें')));
      renderSongList(romantic.length ? romantic : playlist.slice(0, 10), 'romantic');
    } else if (f === 'sad') {
      const sad = playlist.filter(s => s.category && (s.category.includes('दर्द') || s.category.includes('बेवफाई')));
      renderSongList(sad.length ? sad : playlist.slice(5, 15), 'sad');
    } else if (f === 'lofi') {
      renderSongList(playlist.slice(10, 20), 'lofi');
    }
  }));

  // Quick Cards Interaction
  D.quickCards.forEach((card, idx) => card.addEventListener('click', () => {
    const targetIdx = idx % playlist.length;
    playTrack(targetIdx);
  }));

  // Shelf Cards Interaction
  D.shelfCards.forEach((card, idx) => card.addEventListener('click', () => {
    const targetIdx = (idx * 2) % playlist.length;
    playTrack(targetIdx);
  }));
}

function toggleSearch() {
  if (!D.searchBar) return;
  D.searchBar.classList.toggle('hidden');
  if (!D.searchBar.classList.contains('hidden') && D.searchInput) {
    setTimeout(() => D.searchInput.focus(), 50);
  }
}

// ─── Boot & Initialization ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  grabDOM();
  restoreSavedState();
  updateTrackUI(playlist[currentIdx]);
  setPlayUI(false); // ALWAYS start in PAUSED state on page load (no autoplay)

  if (initialSeek > 0) {
    if (D.timeCur) D.timeCur.textContent = fmt(initialSeek);
  }

  showMini();
  renderSongList(playlist, 'all');
  initYT();
  bindAll();
});
