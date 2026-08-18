import './style.css';
import { AVARA_SONGS } from './songs.js';

// ─── State ───────────────────────────────────────────────────────────────────
let ytPlayer    = null;
let currentIdx  = 0;
let isPlaying   = false;
let playlist    = [...AVARA_SONGS];
let displayList = [...AVARA_SONGS];
let likedSet    = new Set();
let shuffleOn   = false;
let repeatOn    = false;
let progressInt = null;
let inPlayer    = false;

// ─── DOM (populated in init after DOMContentLoaded) ──────────────────────────
let D = {};

function grabDOM() {
  D = {
    homeView:         document.getElementById('home-view'),
    playerView:       document.getElementById('player-view'),
    songList:         document.getElementById('song-list'),
    miniPlayer:       document.getElementById('mini-player'),
    miniExpand:       document.getElementById('mini-expand'),
    miniCenter:       document.querySelector('.mini-center'),
    miniLabel:        document.getElementById('mini-label'),
    miniSublabel:     document.getElementById('mini-sublabel'),
    miniPlayPause:    document.getElementById('mini-play-pause'),
    miniPlayIcon:     document.getElementById('mini-play-icon'),
    miniPauseIcon:    document.getElementById('mini-pause-icon'),
    playerDownBtn:    document.getElementById('player-down-btn'),
    playerFromLine2:  document.getElementById('player-from-line2'),
    playerArt:        document.getElementById('player-art'),
    playerTitle:      document.getElementById('player-title'),
    playerArtist:     document.getElementById('player-artist'),
    progressTrack:    document.getElementById('progress-track'),
    progressFill:     document.getElementById('progress-fill'),
    timeCurrent:      document.getElementById('time-current'),
    timeRemaining:    document.getElementById('time-remaining'),
    playPauseBtn:     document.getElementById('play-pause-btn'),
    playIcon:         document.getElementById('play-icon'),
    pauseIcon:        document.getElementById('pause-icon'),
    prevBtn:          document.getElementById('prev-btn'),
    nextBtn:          document.getElementById('next-btn'),
    shuffleBtn:       document.getElementById('shuffle-btn'),
    repeatBtn:        document.getElementById('repeat-btn'),
    likeBtn:          document.getElementById('like-btn'),
    likeSvg:          document.getElementById('like-svg'),
    volumeSlider:     document.getElementById('volume-slider'),
    navDiscover:      document.getElementById('nav-discover'),
    navSearchBtn:     document.getElementById('nav-search-btn'),
    navLibrary:       document.getElementById('nav-library'),
    navHistory:       document.getElementById('nav-history'),
    searchBar:        document.getElementById('search-bar'),
    searchInput:      document.getElementById('search-input'),
    searchClose:      document.getElementById('search-close'),
  };
}

// ─── YouTube Initialization ──────────────────────────────────────────────────
// window.onYouTubeIframeAPIReady is set in index.html inline script BEFORE
// the YouTube API <script> tag, so this callback system is safe.
function initYT() {
  function create() {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '1', width: '1',
      videoId: playlist[currentIdx].id,
      playerVars: {
        autoplay:       0,
        controls:       0,
        playsinline:    1,
        rel:            0,
        modestbranding: 1,
        iv_load_policy: 3,
      },
      events: {
        onReady:       function() { /* ready */ },
        onStateChange: onYTStateChange,
        onError:       function(e) { console.warn('YT error', e.data); nextTrack(); },
      },
    });
  }

  if (window._ytReady) {
    create();
  } else {
    window._ytCbs.push(create);
  }
}

function onYTStateChange(e) {
  const S = window.YT.PlayerState;
  switch (e.data) {
    case S.PLAYING:
      isPlaying = true;
      updatePlayUI(true);
      startProgressTick();
      break;
    case S.PAUSED:
      isPlaying = false;
      updatePlayUI(false);
      break;
    case S.ENDED:
      handleSongEnd();
      break;
  }
}

function handleSongEnd() {
  if (repeatOn) {
    ytPlayer.seekTo(0, true);
    ytPlayer.playVideo();
  } else if (shuffleOn) {
    playTrack(Math.floor(Math.random() * playlist.length));
  } else {
    nextTrack();
  }
}

// ─── Playback ────────────────────────────────────────────────────────────────
function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;
  const song = playlist[currentIdx];
  updateTrackUI(song);
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(song.id);
  }
  showMiniPlayer();
  highlightPlayingRow();
}

function togglePlayPause() {
  if (!ytPlayer) return;
  if (isPlaying) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
}

function prevTrack() {
  if (shuffleOn) playTrack(Math.floor(Math.random() * playlist.length));
  else playTrack(currentIdx - 1);
}

function nextTrack() {
  if (shuffleOn) playTrack(Math.floor(Math.random() * playlist.length));
  else playTrack(currentIdx + 1);
}

// ─── UI Updates ──────────────────────────────────────────────────────────────
function updateTrackUI(song) {
  if (!song) return;
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;

  if (D.playerArt)      D.playerArt.src = thumb;
  if (D.playerTitle)    D.playerTitle.textContent = song.title;
  if (D.playerArtist)   D.playerArtist.textContent = song.artist;
  if (D.playerFromLine2) D.playerFromLine2.textContent = song.category || 'Avara Ashiq';
  if (D.miniLabel)      D.miniLabel.textContent = song.title;
  if (D.miniSublabel)   D.miniSublabel.textContent = song.artist;

  // Like state
  const liked = likedSet.has(currentIdx);
  setLikeUI(liked);
}

function updatePlayUI(playing) {
  if (D.playIcon)      D.playIcon.style.display  = playing ? 'none' : '';
  if (D.pauseIcon)     D.pauseIcon.style.display = playing ? '' : 'none';
  if (D.miniPlayIcon)  D.miniPlayIcon.style.display  = playing ? 'none' : '';
  if (D.miniPauseIcon) D.miniPauseIcon.style.display = playing ? '' : 'none';
}

function setLikeUI(liked) {
  if (D.likeBtn) D.likeBtn.classList.toggle('liked', liked);
  if (D.likeSvg) {
    D.likeSvg.setAttribute('fill', liked ? '#c0392b' : 'none');
    D.likeSvg.setAttribute('stroke', liked ? '#c0392b' : 'currentColor');
  }
}

function highlightPlayingRow() {
  document.querySelectorAll('.song-row').forEach((r, i) => {
    r.classList.toggle('playing', i === currentIdx);
  });
}

// ─── Progress ────────────────────────────────────────────────────────────────
function startProgressTick() {
  if (progressInt) clearInterval(progressInt);
  progressInt = setInterval(tickProgress, 300);
}

function tickProgress() {
  if (!ytPlayer || !isPlaying) return;
  try {
    const cur  = ytPlayer.getCurrentTime() || 0;
    const dur  = ytPlayer.getDuration() || 1;
    const pct  = (cur / dur) * 100;
    const rem  = dur - cur;
    if (D.progressFill)  D.progressFill.style.width = pct + '%';
    if (D.timeCurrent)   D.timeCurrent.textContent  = fmt(cur);
    if (D.timeRemaining) D.timeRemaining.textContent = '-' + fmt(rem);
  } catch(_) {}
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sc = Math.floor(s % 60);
  return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}

// ─── View Transitions ────────────────────────────────────────────────────────
function openPlayer() {
  inPlayer = true;
  D.homeView.classList.replace('active-view', 'hidden-view');
  D.playerView.classList.replace('hidden-view', 'active-view');
  setActiveNav(null);
  if (D.miniPlayer) D.miniPlayer.classList.add('hidden');
}

function closePlayer() {
  inPlayer = false;
  D.playerView.classList.replace('active-view', 'hidden-view');
  D.homeView.classList.replace('hidden-view', 'active-view');
  setActiveNav(D.navDiscover);
  if (ytPlayer) showMiniPlayer();
}

function showMiniPlayer() {
  if (!inPlayer && D.miniPlayer) D.miniPlayer.classList.remove('hidden');
}

// ─── Render Song List ─────────────────────────────────────────────────────────
function renderSongList(songs) {
  if (!D.songList) return;
  D.songList.innerHTML = '';
  songs.forEach((song, i) => {
    const realIdx = playlist.indexOf(song);
    const row = document.createElement('div');
    row.className = 'song-row' + (realIdx === currentIdx && isPlaying ? ' playing' : '');
    // Duration placeholder (we don't have real durations, use index-based fake or blank)
    row.innerHTML = `
      <div class="song-row-info">
        <div class="song-row-title">${song.title}</div>
        <div class="song-row-artist">${song.artist}</div>
      </div>
      <div class="song-row-right">
        <button class="song-row-dots" aria-label="More options">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
      </div>
    `;
    row.addEventListener('click', (e) => {
      if (e.target.closest('.song-row-dots')) return;
      playTrack(realIdx);
      openPlayer();
    });
    row.querySelector('.song-row-dots').addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle like
      if (likedSet.has(realIdx)) likedSet.delete(realIdx);
      else likedSet.add(realIdx);
      // Visual feedback
      const btn = e.currentTarget;
      btn.style.color = likedSet.has(realIdx) ? '#c0392b' : '';
    });
    D.songList.appendChild(row);
  });
}

// ─── Nav helper ──────────────────────────────────────────────────────────────
function setActiveNav(btn) {
  [D.navDiscover, D.navSearchBtn, D.navLibrary, D.navHistory].forEach(b => {
    if (b) b.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
}

// ─── Event Bindings ──────────────────────────────────────────────────────────
function bindAll() {

  // Player down (minimize)
  D.playerDownBtn.addEventListener('click', closePlayer);

  // Mini player expand
  if (D.miniExpand) D.miniExpand.addEventListener('click', openPlayer);
  if (D.miniCenter) D.miniCenter.addEventListener('click', openPlayer);

  // Mini play/pause
  D.miniPlayPause.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });

  // Full player controls
  D.playPauseBtn.addEventListener('click', togglePlayPause);
  D.prevBtn.addEventListener('click', prevTrack);
  D.nextBtn.addEventListener('click', nextTrack);

  // Shuffle & Repeat toggles
  D.shuffleBtn.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    D.shuffleBtn.classList.toggle('active', shuffleOn);
  });
  D.repeatBtn.addEventListener('click', () => {
    repeatOn = !repeatOn;
    D.repeatBtn.classList.toggle('active', repeatOn);
  });

  // Like
  D.likeBtn.addEventListener('click', () => {
    if (likedSet.has(currentIdx)) likedSet.delete(currentIdx);
    else likedSet.add(currentIdx);
    setLikeUI(likedSet.has(currentIdx));
  });

  // Progress seek
  D.progressTrack.addEventListener('click', (e) => {
    if (!ytPlayer) return;
    const rect = D.progressTrack.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    ytPlayer.seekTo((ytPlayer.getDuration() || 0) * pct, true);
  });

  // Volume slider
  if (D.volumeSlider) {
    D.volumeSlider.addEventListener('input', () => {
      if (ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(+D.volumeSlider.value);
    });
  }

  // Bottom Nav
  D.navDiscover.addEventListener('click', () => {
    setActiveNav(D.navDiscover);
    displayList = [...playlist];
    renderSongList(displayList);
    closePlayer();
  });

  D.navSearchBtn.addEventListener('click', () => {
    setActiveNav(D.navSearchBtn);
    closePlayer();
    if (D.searchBar) {
      D.searchBar.classList.toggle('hidden');
      if (!D.searchBar.classList.contains('hidden')) D.searchInput.focus();
    }
  });

  D.navLibrary.addEventListener('click', () => {
    setActiveNav(D.navLibrary);
    closePlayer();
    renderSongList(playlist);
  });

  D.navHistory.addEventListener('click', () => {
    setActiveNav(D.navHistory);
    closePlayer();
    const liked = playlist.filter((_, i) => likedSet.has(i));
    renderSongList(liked.length ? liked : playlist);
  });

  // Search events
  if (D.searchInput) {
    D.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      renderSongList(q
        ? playlist.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
        : playlist
      );
    });
  }
  if (D.searchClose) {
    D.searchClose.addEventListener('click', () => {
      D.searchBar.classList.add('hidden');
      D.searchInput.value = '';
      renderSongList(playlist);
      setActiveNav(D.navDiscover);
    });
  }

  // Scroll arrows (scroll song list)
  const scrollUp   = document.getElementById('scroll-up');
  const scrollDown = document.getElementById('scroll-down');
  const homeScroll = document.querySelector('.home-scroll');
  if (scrollUp)   scrollUp.addEventListener('click',   () => homeScroll.scrollBy({ top: -200, behavior: 'smooth' }));
  if (scrollDown) scrollDown.addEventListener('click', () => homeScroll.scrollBy({ top:  200, behavior: 'smooth' }));
}

// ─── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  grabDOM();
  renderSongList(playlist);
  initYT();
  bindAll();
});
