import './style.css';
import { AVARA_SONGS } from './songs.js';

// ─── State ──────────────────────────────────────────────────────────────────
let ytPlayer    = null;
let ytIsReady   = false;
let pendingPlay = null;
let currentIdx  = 0;
let isPlaying   = false;
let playlist    = AVARA_SONGS.filter(Boolean);
let likedSet    = new Set();
let shuffleOn   = false;
let repeatOn    = false;
let progressInt = null;
let inPlayer    = false;

// ─── DOM ────────────────────────────────────────────────────────────────────
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
  D.miniPrevBtn     = document.getElementById('mini-prev-btn');
  D.miniNextBtn     = document.getElementById('mini-next-btn');
  D.miniProgFill    = document.getElementById('mini-prog-fill');
  // Desktop sidebar
  D.sdPlayerPanel   = document.getElementById('sd-player-panel');
  D.sdArt           = document.getElementById('sd-art');
  D.sdArtBlur       = document.getElementById('sd-art-blur');
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
  // Nav (mobile)
  D.navHome         = document.getElementById('nav-home');
  D.navSearch       = document.getElementById('nav-search-mob');
  D.navMusic        = document.getElementById('nav-music-mob');
  D.navLiked        = document.getElementById('nav-liked-mob');
  // Nav (desktop sidebar)
  D.sdDiscover      = document.getElementById('sd-discover');
  D.sdSearch        = document.getElementById('sd-search');
  D.sdLibrary       = document.getElementById('sd-library');
  D.sdLiked         = document.getElementById('sd-liked');
  // Home
  D.searchToggle    = document.getElementById('search-toggle-btn');
  D.searchBar       = document.getElementById('search-bar');
  D.searchInput     = document.getElementById('search-input');
  D.searchClose     = document.getElementById('search-close');
  D.filterChips     = document.querySelectorAll('.chip');
}

// ─── YouTube Init ────────────────────────────────────────────────────────────
function initYT() {
  function create() {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '180', width: '320',
      videoId: playlist[0].id,
      playerVars: {
        autoplay: 0, controls: 0, playsinline: 1,
        rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0,
      },
      events: {
        onReady() {
          ytIsReady = true;
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
    D.playerView && D.playerView.classList.add('playing-state');
  } else if (e.data === S.PAUSED) {
    isPlaying = false;
    setPlayUI(false);
    D.playerView && D.playerView.classList.remove('playing-state');
  } else if (e.data === S.ENDED) {
    if (repeatOn) { ytPlayer.seekTo(0,true); ytPlayer.playVideo(); }
    else nextTrack();
  }
}

// ─── Playback ────────────────────────────────────────────────────────────────
function _doPlay(idx) {
  const song = playlist[idx];
  if (!song) return;
  ytPlayer.loadVideoById({ videoId: song.id, startSeconds: 0 });
  ytPlayer.playVideo();
}

function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;
  updateTrackUI(playlist[currentIdx]);
  showMini();
  highlightRow();
  if (ytIsReady && ytPlayer) _doPlay(idx);
  else pendingPlay = idx;
}

function togglePlay() {
  if (!ytIsReady || !ytPlayer) return;
  isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
}
function prevTrack() { playTrack(shuffleOn ? randIdx() : currentIdx - 1); }
function nextTrack() { playTrack(shuffleOn ? randIdx() : currentIdx + 1); }
function randIdx()   { return Math.floor(Math.random() * playlist.length); }

// ─── UI Updates ──────────────────────────────────────────────────────────────
function updateTrackUI(song) {
  if (!song) return;
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
  const maxres = `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`;

  // Player view
  if (D.playerArt)    D.playerArt.src = thumb;
  if (D.playerTitle)  D.playerTitle.textContent = song.title;
  if (D.playerArtist) D.playerArtist.textContent = song.artist;
  // BG blur
  if (D.playerBg)     D.playerBg.style.backgroundImage = `url(${thumb})`;
  // Lyrics
  if (D.lyricsLine && song.lyrics && song.lyrics.length) {
    D.lyricsLine.textContent = song.lyrics[0];
    animateLyrics(song.lyrics);
  }
  // Mini player
  if (D.miniArt)    D.miniArt.src    = thumb;
  if (D.miniTitle)  D.miniTitle.textContent  = song.title;
  if (D.miniArtist) D.miniArtist.textContent = song.artist;
  // Desktop sidebar
  if (D.sdArt)    { D.sdArt.src = thumb; D.sdPlayerPanel && D.sdPlayerPanel.classList.remove('hidden'); }
  if (D.sdTitle)  D.sdTitle.textContent  = song.title;
  if (D.sdArtist) D.sdArtist.textContent = song.artist;

  setLikeUI(likedSet.has(currentIdx));
}

let lyricsTimer = null;
function animateLyrics(lines) {
  if (lyricsTimer) clearInterval(lyricsTimer);
  if (!D.lyricsLine || !lines.length) return;
  let i = 0;
  D.lyricsLine.style.opacity = '0';
  setTimeout(() => {
    D.lyricsLine.textContent = lines[0];
    D.lyricsLine.style.opacity = '1';
  }, 200);
  lyricsTimer = setInterval(() => {
    i = (i + 1) % lines.length;
    D.lyricsLine.style.opacity = '0';
    setTimeout(() => {
      if (D.lyricsLine) {
        D.lyricsLine.textContent = lines[i];
        D.lyricsLine.style.opacity = '1';
      }
    }, 300);
  }, 4000);
}

function setPlayUI(playing) {
  if (D.playIcon)     D.playIcon.style.display    = playing ? 'none' : '';
  if (D.pauseIcon)    D.pauseIcon.style.display   = playing ? '' : 'none';
  if (D.miniPlayIcon) D.miniPlayIcon.style.display = playing ? 'none' : '';
  if (D.miniPauseIcon)D.miniPauseIcon.style.display= playing ? '' : 'none';
  if (D.sdPlayIcon)   D.sdPlayIcon.style.display   = playing ? 'none' : '';
  if (D.sdPauseIcon)  D.sdPauseIcon.style.display  = playing ? '' : 'none';
}

function setLikeUI(liked) {
  if (D.playerLikeBtn) D.playerLikeBtn.classList.toggle('liked', liked);
}

function highlightRow() {
  document.querySelectorAll('.song-row').forEach((r, i) => {
    r.classList.toggle('playing', i === currentIdx);
  });
}

// ─── Progress Tick ───────────────────────────────────────────────────────────
function startTick() {
  if (progressInt) clearInterval(progressInt);
  progressInt = setInterval(() => {
    if (!ytIsReady || !ytPlayer || !isPlaying) return;
    try {
      const cur = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration() || 1;
      const pct = (cur / dur) * 100;
      // Main player
      if (D.progressFill)  D.progressFill.style.width = pct + '%';
      if (D.progressThumb) D.progressThumb.style.left = pct + '%';
      if (D.timeCur) D.timeCur.textContent = fmt(cur);
      if (D.timeRem) D.timeRem.textContent = '-' + fmt(dur - cur);
      // Mini
      if (D.miniProgFill) D.miniProgFill.style.width = pct + '%';
      // Sidebar
      if (D.sdProgressFill) D.sdProgressFill.style.width = pct + '%';
      if (D.sdCur) D.sdCur.textContent = fmt(cur);
      if (D.sdRem) D.sdRem.textContent = '-' + fmt(dur - cur);
    } catch(_) {}
  }, 300);
}
function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s/60), sc = Math.floor(s%60);
  return `${m}:${sc<10?'0':''}${sc}`;
}

// ─── Views ──────────────────────────────────────────────────────────────────
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
  if (!inPlayer && D.miniPlayer && ytPlayer) {
    D.miniPlayer.classList.remove('hidden');
  }
}

// ─── Song List Render ────────────────────────────────────────────────────────
let _currentFilter = 'all'; // track current view for re-renders

function renderSongList(songs, filter) {
  if (!D.songList) return;
  if (filter !== undefined) _currentFilter = filter;
  D.songList.innerHTML = '';
  const safe = (songs || playlist).filter(Boolean);

  // Empty state for liked songs
  if (safe.length === 0 && _currentFilter === 'liked') {
    D.songList.innerHTML = `
      <div style="text-align:center;padding:60px 24px;color:rgba(255,255,255,.3)">
        <div style="font-size:48px;margin-bottom:12px">♡</div>
        <div style="font-size:15px;font-weight:600">No Liked Songs Yet</div>
        <div style="font-size:13px;margin-top:6px">Tap ♡ on any song to add it here</div>
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
    el.style.animationDelay = (i * 0.04) + 's';
    el.innerHTML = `
      <div class="song-thumb-wrap">
        <img class="song-thumb" src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
      </div>
      <div class="song-row-info">
        <div class="song-row-title">${song.title}</div>
        <div class="song-row-artist">${song.artist}</div>
      </div>
      <button class="song-row-like-btn ${liked ? 'liked' : ''}" data-idx="${realIdx}" aria-label="Like">
        <svg viewBox="0 0 24 24" fill="${liked ? '#e8455e' : 'none'}" stroke="${liked ? '#e8455e' : 'currentColor'}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    `;

    // Tap row → play + open player
    el.addEventListener('click', (e) => {
      if (e.target.closest('.song-row-like-btn')) return; // don't open player when liking
      playTrack(realIdx);
      openPlayer();
    });

    // Heart button → toggle like
    el.querySelector('.song-row-like-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const idx  = parseInt(e.currentTarget.dataset.idx);
      const btn  = e.currentTarget;
      const svg  = btn.querySelector('svg');
      if (likedSet.has(idx)) {
        likedSet.delete(idx);
        btn.classList.remove('liked');
        svg.setAttribute('fill',   'none');
        svg.setAttribute('stroke', 'currentColor');
        // If currently showing liked songs, remove this row
        if (_currentFilter === 'liked') {
          el.style.transition = 'opacity .25s, transform .25s';
          el.style.opacity    = '0';
          el.style.transform  = 'translateX(30px)';
          setTimeout(() => {
            el.remove();
            // If list is now empty, re-render to show empty state
            if (!D.songList.querySelector('.song-row')) {
              renderSongList([], 'liked');
            }
          }, 260);
        }
      } else {
        likedSet.add(idx);
        btn.classList.add('liked');
        svg.setAttribute('fill',   '#e8455e');
        svg.setAttribute('stroke', '#e8455e');
        // Bounce animation
        btn.style.transform = 'scale(1.3)';
        setTimeout(() => btn.style.transform = '', 200);
      }
      // Keep player like button in sync
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
    likedSet.has(currentIdx) ? likedSet.delete(currentIdx) : likedSet.add(currentIdx);
    setLikeUI(likedSet.has(currentIdx));
  });

  // Progress seek
  D.progressTrack.addEventListener('click', (e) => {
    if (!ytIsReady || !ytPlayer) return;
    const r = D.progressTrack.getBoundingClientRect();
    ytPlayer.seekTo((ytPlayer.getDuration()||0) * Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)), true);
  });

  // Volume
  if (D.volSlider) D.volSlider.addEventListener('input', () => {
    if (ytIsReady && ytPlayer) ytPlayer.setVolume(+D.volSlider.value);
  });

  // Mini player
  D.miniOpen.addEventListener('click', openPlayer);
  D.miniPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
  D.miniPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });
  D.miniNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });

  // Desktop sidebar controls
  if (D.sdPlayBtn) D.sdPlayBtn.addEventListener('click', togglePlay);
  if (D.sdPrevBtn) D.sdPrevBtn.addEventListener('click', prevTrack);
  if (D.sdNextBtn) D.sdNextBtn.addEventListener('click', nextTrack);
  if (D.sdProgressTrack) D.sdProgressTrack.addEventListener('click', (e) => {
    if (!ytIsReady || !ytPlayer) return;
    const r = D.sdProgressTrack.getBoundingClientRect();
    ytPlayer.seekTo((ytPlayer.getDuration()||0) * Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), true);
  });

  // Desktop sidebar nav
  if (D.sdDiscover) D.sdDiscover.addEventListener('click', () => { setSdNav(D.sdDiscover); renderSongList(playlist); });
  if (D.sdSearch)   D.sdSearch.addEventListener('click',   () => { setSdNav(D.sdSearch); toggleSearch(); });
  if (D.sdLibrary)  D.sdLibrary.addEventListener('click',  () => { setSdNav(D.sdLibrary); renderSongList(playlist); });
  if (D.sdLiked) D.sdLiked.addEventListener('click', () => {
    setSdNav(D.sdLiked);
    const liked = playlist.filter((_,i) => likedSet.has(i));
    renderSongList(liked, 'liked');
  });

  // Mobile bottom nav
  D.navHome.addEventListener('click',   () => { setMobNav(D.navHome); renderSongList(playlist); closePlayer(); });
  D.navSearch.addEventListener('click', () => { setMobNav(D.navSearch); closePlayer(); toggleSearch(); });
  D.navMusic.addEventListener('click',  () => { setMobNav(D.navMusic); renderSongList(playlist); closePlayer(); });
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
    renderSongList(playlist);
  });

  D.filterChips.forEach(chip => chip.addEventListener('click', () => {
    D.filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const f = chip.dataset.filter;
    if (f === 'all') {
      renderSongList(playlist, 'all');
    } else if (f === 'liked') {
      const liked = playlist.filter((_,i) => likedSet.has(i));
      renderSongList(liked, 'liked');
    } else {
      const filtered = playlist.filter(s => s.category && s.category.toLowerCase().includes(
        f === 'sad' ? 'बेवफाई' : 'दर्द'
      ));
      renderSongList(filtered, f);
    }
  }));
}

function toggleSearch() {
  if (!D.searchBar) return;
  D.searchBar.classList.toggle('hidden');
  if (!D.searchBar.classList.contains('hidden') && D.searchInput) {
    setTimeout(() => D.searchInput.focus(), 50);
  }
}

// ─── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  grabDOM();
  renderSongList(playlist);
  initYT();
  bindAll();
});
