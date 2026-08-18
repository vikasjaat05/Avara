import './style.css';
import { AVARA_SONGS } from './songs.js';

// ─── State ───────────────────────────────────────────────────────────────────
let ytPlayer     = null;
let ytIsReady    = false;
let pendingPlay  = null;   // queued play when player not ready yet
let currentIdx   = 0;
let isPlaying    = false;
let playlist     = [...AVARA_SONGS];
let likedSet     = new Set();
let shuffleOn    = false;
let repeatOn     = false;
let progressInt  = null;
let inPlayer     = false;

// ─── DOM ─────────────────────────────────────────────────────────────────────
let D = {};

function grabDOM() {
  D.homeView        = document.getElementById('home-view');
  D.playerView      = document.getElementById('player-view');
  D.songList        = document.getElementById('song-list');
  D.miniPlayer      = document.getElementById('mini-player');
  D.miniExpand      = document.getElementById('mini-expand');
  D.miniCenter      = document.querySelector('.mini-center');
  D.miniLabel       = document.getElementById('mini-label');
  D.miniSublabel    = document.getElementById('mini-sublabel');
  D.miniPlayPause   = document.getElementById('mini-play-pause');
  D.miniPlayIcon    = document.getElementById('mini-play-icon');
  D.miniPauseIcon   = document.getElementById('mini-pause-icon');
  D.playerDownBtn   = document.getElementById('player-down-btn');
  D.playerFromLine2 = document.getElementById('player-from-line2');
  D.playerArt       = document.getElementById('player-art');
  D.playerTitle     = document.getElementById('player-title');
  D.playerArtist    = document.getElementById('player-artist');
  D.progressTrack   = document.getElementById('progress-track');
  D.progressFill    = document.getElementById('progress-fill');
  D.timeCurrent     = document.getElementById('time-current');
  D.timeRemaining   = document.getElementById('time-remaining');
  D.playPauseBtn    = document.getElementById('play-pause-btn');
  D.playIcon        = document.getElementById('play-icon');
  D.pauseIcon       = document.getElementById('pause-icon');
  D.prevBtn         = document.getElementById('prev-btn');
  D.nextBtn         = document.getElementById('next-btn');
  D.shuffleBtn      = document.getElementById('shuffle-btn');
  D.repeatBtn       = document.getElementById('repeat-btn');
  D.likeBtn         = document.getElementById('like-btn');
  D.likeSvg         = document.getElementById('like-svg');
  D.volumeSlider    = document.getElementById('volume-slider');
  D.navDiscover     = document.getElementById('nav-discover');
  D.navSearchBtn    = document.getElementById('nav-search-btn');
  D.navLibrary      = document.getElementById('nav-library');
  D.navHistory      = document.getElementById('nav-history');
  D.searchBar       = document.getElementById('search-bar');
  D.searchInput     = document.getElementById('search-input');
  D.searchClose     = document.getElementById('search-close');
}

// ─── YouTube Init ─────────────────────────────────────────────────────────────
// window.onYouTubeIframeAPIReady + YouTube API <script> are in index.html
// and execute BEFORE this module loads. We register via _ytCbs.
function initYT() {
  function create() {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '1',
      width: '1',
      videoId: playlist[0].id,
      playerVars: {
        autoplay:       0,
        controls:       0,
        playsinline:    1,    // Critical for iOS
        rel:            0,
        modestbranding: 1,
        iv_load_policy: 3,
        fs:             0,
      },
      events: {
        onReady: function() {
          ytIsReady = true;
          // If user tapped before player was ready, play now
          if (pendingPlay !== null) {
            const idx = pendingPlay;
            pendingPlay = null;
            _doPlay(idx);
          }
        },
        onStateChange: onYTStateChange,
        onError: function(e) {
          console.warn('YT Error:', e.data);
          // Skip errored song
          setTimeout(() => nextTrack(), 1000);
        },
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
  if (e.data === S.PLAYING) {
    isPlaying = true;
    setPlayUI(true);
    startProgressTick();
  } else if (e.data === S.PAUSED) {
    isPlaying = false;
    setPlayUI(false);
  } else if (e.data === S.ENDED) {
    if (repeatOn) {
      ytPlayer.seekTo(0, true);
      ytPlayer.playVideo();
    } else {
      nextTrack();
    }
  }
}

// ─── Playback ─────────────────────────────────────────────────────────────────
function _doPlay(idx) {
  // This is the actual play — must be called with ytPlayer ready
  const song = playlist[idx];
  ytPlayer.loadVideoById({ videoId: song.id, startSeconds: 0 });
  // loadVideoById auto-plays, but call playVideo() just to be safe
  ytPlayer.playVideo();
}

function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;

  updateTrackUI(playlist[currentIdx]);
  showMiniPlayer();
  highlightPlayingRow();

  if (ytIsReady && ytPlayer) {
    _doPlay(idx);
  } else {
    // Queue it — will fire in onReady
    pendingPlay = idx;
  }
}

function togglePlayPause() {
  if (!ytIsReady || !ytPlayer) return;
  if (isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

function prevTrack() {
  const idx = shuffleOn
    ? Math.floor(Math.random() * playlist.length)
    : (currentIdx - 1 + playlist.length) % playlist.length;
  playTrack(idx);
}

function nextTrack() {
  const idx = shuffleOn
    ? Math.floor(Math.random() * playlist.length)
    : (currentIdx + 1) % playlist.length;
  playTrack(idx);
}

// ─── UI Updates ───────────────────────────────────────────────────────────────
function updateTrackUI(song) {
  if (!song) return;
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
  if (D.playerArt)       D.playerArt.src = thumb;
  if (D.playerTitle)     D.playerTitle.textContent = song.title;
  if (D.playerArtist)    D.playerArtist.textContent = song.artist;
  if (D.playerFromLine2) D.playerFromLine2.textContent = song.category || 'Avara Ashiq';
  if (D.miniLabel)       D.miniLabel.textContent = song.title;
  if (D.miniSublabel)    D.miniSublabel.textContent = song.artist;
  setLikeUI(likedSet.has(currentIdx));
}

function setPlayUI(playing) {
  if (D.playIcon)      D.playIcon.style.display      = playing ? 'none' : '';
  if (D.pauseIcon)     D.pauseIcon.style.display      = playing ? '' : 'none';
  if (D.miniPlayIcon)  D.miniPlayIcon.style.display   = playing ? 'none' : '';
  if (D.miniPauseIcon) D.miniPauseIcon.style.display  = playing ? '' : 'none';
}

function setLikeUI(liked) {
  if (D.likeBtn) D.likeBtn.classList.toggle('liked', liked);
  if (D.likeSvg) {
    D.likeSvg.setAttribute('fill',   liked ? '#c0392b' : 'none');
    D.likeSvg.setAttribute('stroke', liked ? '#c0392b' : 'currentColor');
  }
}

function highlightPlayingRow() {
  document.querySelectorAll('.song-row').forEach((r, i) => {
    r.classList.toggle('playing', i === currentIdx);
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function startProgressTick() {
  if (progressInt) clearInterval(progressInt);
  progressInt = setInterval(() => {
    if (!ytIsReady || !ytPlayer || !isPlaying) return;
    try {
      const cur = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration() || 1;
      const pct = (cur / dur) * 100;
      if (D.progressFill)  D.progressFill.style.width     = pct + '%';
      if (D.timeCurrent)   D.timeCurrent.textContent      = fmt(cur);
      if (D.timeRemaining) D.timeRemaining.textContent    = '-' + fmt(dur - cur);
    } catch (_) {}
  }, 300);
}

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sc = Math.floor(s % 60);
  return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}

// ─── View Transitions ─────────────────────────────────────────────────────────
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

// ─── Render ───────────────────────────────────────────────────────────────────
function renderSongList(songs) {
  if (!D.songList) return;
  D.songList.innerHTML = '';
  songs.forEach((song) => {
    const realIdx = playlist.indexOf(song);
    const row = document.createElement('div');
    row.className = 'song-row' + (realIdx === currentIdx && isPlaying ? ' playing' : '');
    row.innerHTML = `
      <div class="song-row-info">
        <div class="song-row-title">${song.title}</div>
        <div class="song-row-artist">${song.artist}</div>
      </div>
      <div class="song-row-right">
        <button class="song-row-dots" aria-label="More options">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </div>
    `;

    // Tap row → play + open player
    row.addEventListener('click', (e) => {
      if (e.target.closest('.song-row-dots')) return;
      playTrack(realIdx);
      openPlayer();
    });

    // Dots → like/unlike
    row.querySelector('.song-row-dots').addEventListener('click', (e) => {
      e.stopPropagation();
      if (likedSet.has(realIdx)) likedSet.delete(realIdx);
      else likedSet.add(realIdx);
      const btn = row.querySelector('.song-row-dots');
      btn.style.color = likedSet.has(realIdx) ? '#c0392b' : '';
    });

    D.songList.appendChild(row);
  });
}

// ─── Nav Helper ───────────────────────────────────────────────────────────────
function setActiveNav(btn) {
  [D.navDiscover, D.navSearchBtn, D.navLibrary, D.navHistory].forEach(b => {
    if (b) b.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
}

// ─── Event Bindings ───────────────────────────────────────────────────────────
function bindAll() {
  // Player back
  D.playerDownBtn.addEventListener('click', closePlayer);

  // Mini player
  if (D.miniExpand)  D.miniExpand.addEventListener('click',  openPlayer);
  if (D.miniCenter)  D.miniCenter.addEventListener('click',  openPlayer);
  D.miniPlayPause.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); });

  // Full player controls
  D.playPauseBtn.addEventListener('click', togglePlayPause);
  D.prevBtn.addEventListener('click', prevTrack);
  D.nextBtn.addEventListener('click', nextTrack);

  // Shuffle / Repeat
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
    if (!ytIsReady || !ytPlayer) return;
    const rect = D.progressTrack.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    ytPlayer.seekTo((ytPlayer.getDuration() || 0) * pct, true);
  });

  // Volume
  if (D.volumeSlider) {
    D.volumeSlider.addEventListener('input', () => {
      if (ytIsReady && ytPlayer && ytPlayer.setVolume) {
        ytPlayer.setVolume(+D.volumeSlider.value);
      }
    });
  }

  // Bottom Nav
  D.navDiscover.addEventListener('click', () => {
    setActiveNav(D.navDiscover);
    renderSongList(playlist);
    closePlayer();
  });

  D.navSearchBtn.addEventListener('click', () => {
    setActiveNav(D.navSearchBtn);
    closePlayer();
    if (D.searchBar) {
      D.searchBar.classList.toggle('hidden');
      if (!D.searchBar.classList.contains('hidden') && D.searchInput) {
        D.searchInput.focus();
      }
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

  // Search
  if (D.searchInput) {
    D.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      renderSongList(
        q ? playlist.filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)
        ) : playlist
      );
    });
  }
  if (D.searchClose) {
    D.searchClose.addEventListener('click', () => {
      D.searchBar.classList.add('hidden');
      if (D.searchInput) D.searchInput.value = '';
      renderSongList(playlist);
      setActiveNav(D.navDiscover);
    });
  }

  // Scroll arrows
  const scrollUp   = document.getElementById('scroll-up');
  const scrollDown = document.getElementById('scroll-down');
  const homeScroll = document.querySelector('.home-scroll');
  if (scrollUp && homeScroll)   scrollUp.addEventListener('click',   () => homeScroll.scrollBy({ top: -200, behavior: 'smooth' }));
  if (scrollDown && homeScroll) scrollDown.addEventListener('click', () => homeScroll.scrollBy({ top:  200, behavior: 'smooth' }));
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  grabDOM();
  renderSongList(playlist);
  initYT();
  bindAll();
});
