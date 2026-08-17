import { AVARA_SONGS } from './songs.js';

// ─── State ───
let ytPlayer    = null;
let currentIdx  = 0;
let isPlaying   = false;
let playlist    = [...AVARA_SONGS];
let likedSet    = new Set();
let shuffleOn   = false;
let repeatOn    = false;
let progressInt = null;
let inPlayer    = false;

// ─── DOM refs (populated in init) ───
let D = {};

function init() {
  D.homeView       = document.getElementById('home-view');
  D.playerView     = document.getElementById('player-view');
  D.songList       = document.getElementById('song-list');
  D.compCard       = document.getElementById('compilation-card');
  D.miniPlayer     = document.getElementById('mini-player');
  D.miniArt        = document.getElementById('mini-art');
  D.miniTitle      = document.getElementById('mini-title');
  D.miniArtist     = document.getElementById('mini-artist');
  D.miniPlayBtn    = document.getElementById('mini-play');
  D.miniPlayIcon   = document.getElementById('mini-play-icon');
  D.miniPauseIcon  = document.getElementById('mini-pause-icon');
  D.miniPrev       = document.getElementById('mini-prev');
  D.miniNext       = document.getElementById('mini-next');
  D.miniProgressFill = document.getElementById('mini-progress-fill');
  D.backBtn        = document.getElementById('back-btn');
  D.playerTitle    = document.getElementById('player-song-title');
  D.playerArtist   = document.getElementById('player-artist');
  D.playerArt      = document.getElementById('player-art');
  D.progressTrack  = document.getElementById('progress-track');
  D.progressFill   = document.getElementById('progress-fill');
  D.timeCurrent    = document.getElementById('time-current');
  D.timeTotal      = document.getElementById('time-total');
  D.playPauseBtn   = document.getElementById('play-pause-btn');
  D.playIcon       = document.getElementById('play-icon');
  D.pauseIcon      = document.getElementById('pause-icon');
  D.prevBtn        = document.getElementById('prev-btn');
  D.nextBtn        = document.getElementById('next-btn');
  D.shuffleBtn     = document.getElementById('shuffle-btn');
  D.repeatBtn      = document.getElementById('repeat-btn');
  D.likeBtn        = document.getElementById('like-btn');
  D.likeSvg        = document.getElementById('like-svg');
  D.navHome        = document.getElementById('nav-home');
  D.navSearch      = document.getElementById('nav-search');
  D.navHeart       = document.getElementById('nav-heart');
  D.navHeartSvg    = document.getElementById('nav-heart-svg');

  renderSongList(playlist);
  renderCompilation();
  setupYT();
  bindAll();
}

// ─── YouTube Setup ───────────────────────────────────────────
// The global onYouTubeIframeAPIReady + the <script> tags are in index.html
// We just register our callback here
function setupYT() {
  function createPlayer() {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '1', width: '1',
      videoId: playlist[currentIdx].id,
      playerVars: { autoplay: 0, controls: 0, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: function() {},
        onStateChange: onYTState,
      }
    });
  }

  if (window._ytReady) {
    createPlayer();
  } else {
    window._ytReadyCallbacks.push(createPlayer);
  }
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
    handleEnd();
  }
}

function handleEnd() {
  if (repeatOn) {
    ytPlayer.seekTo(0, true);
    ytPlayer.playVideo();
    return;
  }
  if (shuffleOn) {
    playTrack(Math.floor(Math.random() * playlist.length));
  } else {
    playTrack((currentIdx + 1) % playlist.length);
  }
}

// ─── Playback ─────────────────────────────────────────────────
function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;
  const song = playlist[currentIdx];

  // Update UI first (instant feedback)
  updateTrackUI(song);

  // Load & play
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(song.id);
  }

  // Show mini player when playing
  if (D.miniPlayer) D.miniPlayer.classList.remove('hidden');

  // Highlight row
  document.querySelectorAll('.song-row').forEach((r, i) => {
    r.classList.toggle('playing', i === currentIdx);
  });
}

function togglePlay() {
  if (!ytPlayer) return;
  if (isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

function prev() {
  if (shuffleOn) playTrack(Math.floor(Math.random() * playlist.length));
  else playTrack(currentIdx - 1);
}
function next() {
  if (shuffleOn) playTrack(Math.floor(Math.random() * playlist.length));
  else playTrack(currentIdx + 1);
}

// ─── UI Updates ───────────────────────────────────────────────
function updateTrackUI(song) {
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
  if (D.playerTitle)  D.playerTitle.textContent  = song.title;
  if (D.playerArtist) D.playerArtist.textContent = song.artist;
  if (D.playerArt)    D.playerArt.src = thumb;
  if (D.miniArt)      D.miniArt.src   = thumb;
  if (D.miniTitle)    D.miniTitle.textContent  = song.title;
  if (D.miniArtist)   D.miniArtist.textContent = song.artist;

  // Like state
  const liked = likedSet.has(currentIdx);
  if (D.likeBtn) D.likeBtn.classList.toggle('liked', liked);
  if (D.likeSvg) {
    D.likeSvg.setAttribute('fill', liked ? '#e8455e' : 'none');
    D.likeSvg.setAttribute('stroke', liked ? '#e8455e' : 'currentColor');
  }
}

function setPlayUI(playing) {
  if (D.playIcon)      D.playIcon.style.display  = playing ? 'none' : '';
  if (D.pauseIcon)     D.pauseIcon.style.display = playing ? '' : 'none';
  if (D.miniPlayIcon)  D.miniPlayIcon.style.display  = playing ? 'none' : '';
  if (D.miniPauseIcon) D.miniPauseIcon.style.display = playing ? '' : 'none';
}

// ─── Progress Ticker ──────────────────────────────────────────
function startTick() {
  if (progressInt) clearInterval(progressInt);
  progressInt = setInterval(tick, 300);
}

function tick() {
  if (!ytPlayer || !isPlaying) return;
  try {
    const cur = ytPlayer.getCurrentTime() || 0;
    const dur = ytPlayer.getDuration() || 1;
    const pct = (cur / dur) * 100;
    if (D.progressFill)     D.progressFill.style.width     = pct + '%';
    if (D.miniProgressFill) D.miniProgressFill.style.width = pct + '%';
    if (D.timeCurrent)      D.timeCurrent.textContent = fmt(cur);
    if (D.timeTotal)        D.timeTotal.textContent   = fmt(dur);
  } catch (_) {}
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sc = Math.floor(s % 60);
  return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}

// ─── View Switching ───────────────────────────────────────────
function goToPlayer() {
  inPlayer = true;
  D.homeView.classList.replace('active-view', 'hidden-view');
  D.playerView.classList.replace('hidden-view', 'active-view');
  D.navHome.classList.remove('active');
  if (D.miniPlayer) D.miniPlayer.classList.add('hidden');
}

function goToHome() {
  inPlayer = false;
  D.playerView.classList.replace('active-view', 'hidden-view');
  D.homeView.classList.replace('hidden-view', 'active-view');
  D.navHome.classList.add('active');
  if (isPlaying || ytPlayer) {
    if (D.miniPlayer) D.miniPlayer.classList.remove('hidden');
  }
}

// ─── Render ───────────────────────────────────────────────────
function renderSongList(songs) {
  if (!D.songList) return;
  D.songList.innerHTML = '';
  songs.forEach((song, i) => {
    const row = document.createElement('div');
    row.className = 'song-row' + (i === currentIdx && isPlaying ? ' playing' : '');
    row.innerHTML = `
      <div class="song-thumb">
        <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
      </div>
      <div class="song-row-info">
        <div class="song-row-title">${song.title}</div>
        <div class="song-row-artist">${song.artist}</div>
      </div>
      <button class="song-row-dots" aria-label="More">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    `;
    row.addEventListener('click', (e) => {
      if (e.target.closest('.song-row-dots')) return;
      playTrack(i);
      goToPlayer();
    });
    D.songList.appendChild(row);
  });
}

function renderCompilation() {
  if (!D.compCard) return;
  const song = playlist[Math.floor(playlist.length / 2)];
  D.compCard.innerHTML = `
    <img src="https://img.youtube.com/vi/${song.id}/maxresdefault.jpg" onerror="this.src='https://img.youtube.com/vi/${song.id}/hqdefault.jpg'" alt="Compilation">
    <div class="comp-label">The Best Sad Songs</div>
  `;
  D.compCard.addEventListener('click', () => {
    playTrack(Math.floor(playlist.length / 2));
    goToPlayer();
  });
}

// ─── Bind Events ──────────────────────────────────────────────
function bindAll() {
  // Back
  D.backBtn.addEventListener('click', goToHome);

  // Play/Pause
  D.playPauseBtn.addEventListener('click', togglePlay);
  D.miniPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

  // Prev / Next
  D.prevBtn.addEventListener('click', prev);
  D.nextBtn.addEventListener('click', next);
  D.miniPrev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  D.miniNext.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  // Mini player click → open full player
  document.getElementById('mini-player').addEventListener('click', goToPlayer);
  // Prevent buttons inside from bubbling to mini-player
  document.querySelectorAll('.mini-controls button').forEach(btn => {
    btn.addEventListener('click', e => e.stopPropagation());
  });

  // Seek on progress track
  D.progressTrack.addEventListener('click', (e) => {
    if (!ytPlayer) return;
    const rect = D.progressTrack.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    const dur  = ytPlayer.getDuration() || 0;
    ytPlayer.seekTo(pct * dur, true);
  });

  // Shuffle
  D.shuffleBtn.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    D.shuffleBtn.classList.toggle('active', shuffleOn);
  });

  // Repeat
  D.repeatBtn.addEventListener('click', () => {
    repeatOn = !repeatOn;
    D.repeatBtn.classList.toggle('active', repeatOn);
  });

  // Like
  D.likeBtn.addEventListener('click', () => {
    if (likedSet.has(currentIdx)) {
      likedSet.delete(currentIdx);
    } else {
      likedSet.add(currentIdx);
    }
    const liked = likedSet.has(currentIdx);
    D.likeBtn.classList.toggle('liked', liked);
    D.likeSvg.setAttribute('fill', liked ? '#e8455e' : 'none');
    D.likeSvg.setAttribute('stroke', liked ? '#e8455e' : 'currentColor');
  });

  // Bottom Nav
  D.navHome.addEventListener('click', () => {
    D.navHome.classList.add('active');
    D.navHeart.classList.remove('active', 'liked');
    D.navSearch.classList.remove('active');
    goToHome();
  });

  D.navHeart.addEventListener('click', () => {
    D.navHeart.classList.toggle('liked');
    D.navHeart.classList.toggle('active');
    D.navHome.classList.remove('active');
    // Show liked songs
    const liked = playlist.filter((_, i) => likedSet.has(i));
    renderSongList(liked.length > 0 ? liked : playlist);
    goToHome();
  });

  D.navSearch.addEventListener('click', () => {
    D.navSearch.classList.toggle('active');
    D.navHome.classList.remove('active');
    goToHome();
    // Simple prompt-based search for now (could be replaced with inline UI)
    const q = prompt('Search songs or artists:');
    if (q) {
      const r = playlist.filter(s =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.artist.toLowerCase().includes(q.toLowerCase())
      );
      renderSongList(r.length ? r : playlist);
    } else {
      renderSongList(playlist);
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
