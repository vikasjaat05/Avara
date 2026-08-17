import { AVARA_SONGS } from './songs.js';

// ─── State ───────────────────────────────────────────────────
let ytPlayer       = null;
let ytReady        = false;
let currentIndex   = 0;
let isPlaying      = false;
let playlist       = [...AVARA_SONGS];
let filteredList   = [...AVARA_SONGS];
let likedSongs     = new Set();
let progressTimer  = null;
let isInPlayerView = false;

// ─── DOM (grabbed AFTER DOMContentLoaded) ────────────────────
let DOM = {};

function grabDOM() {
  DOM = {
    homeView:         document.getElementById('home-view'),
    playerView:       document.getElementById('player-view'),
    collectionsEl:    document.getElementById('collections-container'),
    songList:         document.getElementById('song-list'),

    // Player
    backBtn:          document.getElementById('back-btn'),
    albumArt:         document.getElementById('album-art'),
    songTitle:        document.getElementById('song-title'),
    songArtist:       document.getElementById('song-artist'),
    playPauseBtn:     document.getElementById('play-pause-btn'),
    playIcon:         document.getElementById('play-icon'),
    pauseIcon:        document.getElementById('pause-icon'),
    prevBtn:          document.getElementById('prev-btn'),
    nextBtn:          document.getElementById('next-btn'),
    progressTrack:    document.getElementById('progress-track'),
    progressFill:     document.getElementById('progress-fill'),
    timeCurrent:      document.getElementById('time-current'),
    timeRemaining:    document.getElementById('time-remaining'),
    lyricsBox:        document.getElementById('lyrics-box'),
    playerHeartBtn:   document.getElementById('player-heart-btn'),
    playerHeartSvg:   document.getElementById('player-heart-svg'),

    // Mini Player
    miniPlayer:       document.getElementById('mini-player'),
    miniPlayerInner:  document.getElementById('mini-player-inner'),
    miniArt:          document.getElementById('mini-art'),
    miniTitle:        document.getElementById('mini-title'),
    miniArtist:       document.getElementById('mini-artist'),
    miniPrev:         document.getElementById('mini-prev'),
    miniPlayPause:    document.getElementById('mini-play-pause'),
    miniPlayIcon:     document.getElementById('mini-play-icon'),
    miniPauseIcon:    document.getElementById('mini-pause-icon'),
    miniNext:         document.getElementById('mini-next'),
    miniProgressFill: document.getElementById('mini-progress-fill'),

    // Nav
    navHome:          document.getElementById('nav-home'),
    navSearchBtn:     document.getElementById('nav-search-btn'),
    navHeart:         document.getElementById('nav-heart'),
    navHeartSvg:      document.getElementById('nav-heart-svg'),

    // Search
    searchToggle:     document.getElementById('search-toggle'),
    searchBar:        document.getElementById('search-bar'),
    searchInput:      document.getElementById('search-input'),
    searchClose:      document.getElementById('search-close'),
  };
}

// ─── YouTube API ──────────────────────────────────────────────
function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src   = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new window.YT.Player('yt-player', {
    height: '1', width: '1',
    videoId: playlist[0].id,
    playerVars: {
      autoplay:      0,
      controls:      0,
      playsinline:   1,
      rel:           0,
      modestbranding: 1,
    },
    events: {
      onReady:       onYTReady,
      onStateChange: onYTStateChange,
    },
  });
};

function onYTReady(event) {
  ytReady = true;
  updateTrackUI(playlist[currentIndex]);
}

function onYTStateChange(event) {
  const S = window.YT.PlayerState;
  if (event.data === S.PLAYING) {
    isPlaying = true;
    updatePlayUI(true);
    startProgressTimer();
  } else if (event.data === S.PAUSED) {
    isPlaying = false;
    updatePlayUI(false);
  } else if (event.data === S.ENDED) {
    nextTrack();
  }
}

// ─── Playback ─────────────────────────────────────────────────
function playTrack(index) {
  if (index < 0) index = filteredList.length - 1;
  if (index >= filteredList.length) index = 0;
  currentIndex = index;
  const track = filteredList[currentIndex];
  updateTrackUI(track);
  if (ytReady && ytPlayer) {
    ytPlayer.loadVideoById(track.id);
    ytPlayer.playVideo();
  }
  showMiniPlayer();
}

function togglePlayPause() {
  if (!ytReady || !ytPlayer) return;
  if (isPlaying) { ytPlayer.pauseVideo(); }
  else           { ytPlayer.playVideo(); }
}

function prevTrack() {
  playTrack(currentIndex - 1);
}
function nextTrack() {
  playTrack(currentIndex + 1);
}

// ─── UI Updates ───────────────────────────────────────────────
function updateTrackUI(track) {
  if (!track) return;
  const thumb = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;

  // Player view
  if (DOM.albumArt)    DOM.albumArt.src = thumb;
  if (DOM.songTitle)   DOM.songTitle.textContent  = track.title;
  if (DOM.songArtist)  DOM.songArtist.textContent = track.artist;

  // Lyrics
  if (DOM.lyricsBox && track.lyrics) {
    DOM.lyricsBox.innerHTML = track.lyrics
      .map(l => `<div class="lyrics-line">${l}</div>`).join('');
  } else if (DOM.lyricsBox) {
    DOM.lyricsBox.innerHTML = '';
  }

  // Mini player
  if (DOM.miniArt)    DOM.miniArt.src = thumb;
  if (DOM.miniTitle)  DOM.miniTitle.textContent  = track.title;
  if (DOM.miniArtist) DOM.miniArtist.textContent = track.artist;

  // Heart state
  updateHeartUI(likedSongs.has(currentIndex));

  // Highlight playing song in list
  document.querySelectorAll('.song-row').forEach((row, i) => {
    row.classList.toggle('playing', i === currentIndex);
  });
}

function updatePlayUI(playing) {
  // Player view icons
  if (DOM.playIcon)  DOM.playIcon.style.display  = playing ? 'none' : '';
  if (DOM.pauseIcon) DOM.pauseIcon.style.display = playing ? ''     : 'none';

  // Mini player icons
  if (DOM.miniPlayIcon)  DOM.miniPlayIcon.style.display  = playing ? 'none' : '';
  if (DOM.miniPauseIcon) DOM.miniPauseIcon.style.display = playing ? ''     : 'none';
}

function updateHeartUI(liked) {
  // Player heart
  if (DOM.playerHeartBtn) DOM.playerHeartBtn.classList.toggle('liked', liked);
  if (DOM.playerHeartSvg) {
    DOM.playerHeartSvg.setAttribute('fill', liked ? '#ff4d4f' : 'none');
    DOM.playerHeartSvg.setAttribute('stroke', liked ? '#ff4d4f' : 'currentColor');
  }
}

// ─── Progress ─────────────────────────────────────────────────
function startProgressTimer() {
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = setInterval(tickProgress, 300);
}

function tickProgress() {
  if (!ytReady || !ytPlayer || !isPlaying) return;
  try {
    const current  = ytPlayer.getCurrentTime() || 0;
    const duration = ytPlayer.getDuration() || 1;
    const pct      = (current / duration) * 100;
    const remain   = duration - current;

    if (DOM.progressFill)      DOM.progressFill.style.width = pct + '%';
    if (DOM.miniProgressFill)  DOM.miniProgressFill.style.width = pct + '%';
    if (DOM.timeCurrent)       DOM.timeCurrent.textContent  = fmtTime(current);
    if (DOM.timeRemaining)     DOM.timeRemaining.textContent = '-' + fmtTime(remain);
  } catch (_) {}
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// ─── View Switching ───────────────────────────────────────────
function showPlayerView() {
  isInPlayerView = true;
  DOM.homeView.classList.remove('active-view');
  DOM.homeView.classList.add('hidden-view');
  DOM.playerView.classList.remove('hidden-view');
  DOM.playerView.classList.add('active-view');
  DOM.navHome.classList.remove('active');
  hideMiniPlayer();
}

function showHomeView() {
  isInPlayerView = false;
  DOM.playerView.classList.remove('active-view');
  DOM.playerView.classList.add('hidden-view');
  DOM.homeView.classList.remove('hidden-view');
  DOM.homeView.classList.add('active-view');
  DOM.navHome.classList.add('active');
  if (isPlaying || ytReady) showMiniPlayer();
}

function showMiniPlayer() {
  if (!isInPlayerView && DOM.miniPlayer) {
    DOM.miniPlayer.style.display = 'block';
  }
}
function hideMiniPlayer() {
  if (DOM.miniPlayer) DOM.miniPlayer.style.display = 'none';
}

// ─── Render Home ──────────────────────────────────────────────
function renderHome(songs) {
  // Collections = first 5 unique songs as cards
  if (DOM.collectionsEl) {
    DOM.collectionsEl.innerHTML = '';
    playlist.slice(0, 5).forEach((song, i) => {
      const card = document.createElement('div');
      card.className = 'collection-card';
      card.innerHTML = `
        <div class="collection-thumb">
          <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" alt="${song.title}" loading="lazy">
        </div>
        <div class="c-title">${song.title.substring(0, 14)}</div>
        <div class="c-sub">${song.category || ''}</div>
      `;
      card.addEventListener('click', () => {
        filteredList = [...playlist];
        playTrack(i);
        showPlayerView();
      });
      DOM.collectionsEl.appendChild(card);
    });
  }

  // Song list
  if (DOM.songList) {
    DOM.songList.innerHTML = '';
    songs.forEach((song, i) => {
      const row = document.createElement('div');
      row.className = 'song-row';
      if (i === currentIndex && (isPlaying || ytReady)) row.classList.add('playing');
      row.innerHTML = `
        <div class="song-thumb">
          <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" alt="${song.title}" loading="lazy">
        </div>
        <div class="song-row-info">
          <div class="song-row-title">${song.title}</div>
          <div class="song-row-artist">${song.artist}</div>
        </div>
        <button class="song-play-btn" aria-label="Play ${song.title}">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
      `;
      const playFn = (e) => {
        e.stopPropagation();
        filteredList = [...songs];
        playTrack(i);
        showPlayerView();
      };
      row.addEventListener('click', playFn);
      row.querySelector('.song-play-btn').addEventListener('click', playFn);
      DOM.songList.appendChild(row);
    });
  }
}

// ─── Search ───────────────────────────────────────────────────
function openSearch() {
  if (DOM.searchBar) {
    DOM.searchBar.classList.remove('hidden');
    if (DOM.searchInput) DOM.searchInput.focus();
  }
}
function closeSearch() {
  if (DOM.searchBar) {
    DOM.searchBar.classList.add('hidden');
    if (DOM.searchInput) DOM.searchInput.value = '';
    renderHome(playlist);
  }
}

// ─── Wishlist Nav ─────────────────────────────────────────────
let wishlistView = false;
function toggleWishlistView() {
  wishlistView = !wishlistView;
  if (wishlistView) {
    DOM.navHeart.classList.add('active', 'liked');
    DOM.navHome.classList.remove('active');
    showHomeView();
    const liked = playlist.filter((_, i) => likedSongs.has(i));
    renderHome(liked.length ? liked : playlist);
  } else {
    DOM.navHeart.classList.remove('active', 'liked');
    DOM.navHome.classList.add('active');
    renderHome(playlist);
  }
}

// ─── Event Bindings ───────────────────────────────────────────
function bindEvents() {
  // Back button
  DOM.backBtn.addEventListener('click', showHomeView);

  // Play/Pause
  DOM.playPauseBtn.addEventListener('click', togglePlayPause);

  // Next / Prev
  DOM.nextBtn.addEventListener('click', nextTrack);
  DOM.prevBtn.addEventListener('click', prevTrack);

  // Mini player
  DOM.miniPlayerInner.addEventListener('click', showPlayerView);
  DOM.miniPlayPause.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); });
  DOM.miniNext.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });
  DOM.miniPrev.addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });

  // Progress bar seek
  DOM.progressTrack.addEventListener('click', (e) => {
    if (!ytReady || !ytPlayer) return;
    const rect = DOM.progressTrack.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    ytPlayer.seekTo((ytPlayer.getDuration() || 0) * pct, true);
  });

  // Player heart / like
  DOM.playerHeartBtn.addEventListener('click', () => {
    if (likedSongs.has(currentIndex)) {
      likedSongs.delete(currentIndex);
      updateHeartUI(false);
    } else {
      likedSongs.add(currentIndex);
      updateHeartUI(true);
    }
  });

  // Bottom nav
  DOM.navHome.addEventListener('click', () => {
    wishlistView = false;
    DOM.navHeart.classList.remove('active', 'liked');
    DOM.navHome.classList.add('active');
    showHomeView();
    renderHome(playlist);
  });

  DOM.navHeart.addEventListener('click', toggleWishlistView);

  DOM.navSearchBtn.addEventListener('click', () => {
    DOM.navSearchBtn.classList.add('active');
    DOM.navHome.classList.remove('active');
    DOM.navHeart.classList.remove('active', 'liked');
    wishlistView = false;
    showHomeView();
    openSearch();
  });

  // Search bar
  DOM.searchToggle.addEventListener('click', openSearch);
  DOM.searchClose.addEventListener('click', closeSearch);
  DOM.searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const results = q
      ? playlist.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
      : playlist;
    renderHome(results);
  });
}

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  grabDOM();
  renderHome(playlist);
  loadYouTubeAPI();
  bindEvents();
});
