import './style.css';
import { AVARA_SONGS } from './songs.js';

// Application State
let player = null;
let isPlayerReady = false;
let currentPlaylist = [...AVARA_SONGS];
let currentTrackIndex = 0;
let isPlaying = false;
let isRepeat = false;
let seekInterval = null;
let isDraggingSeekbar = false;
let consecutiveErrorCount = 0;

// DOM Elements
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const repeatBtn = document.getElementById('repeat-btn');
const progressBar = document.getElementById('progress-bar');
const progressDot = document.getElementById('progress-dot');
const waveProgress = document.getElementById('wave-progress');
const waveBgPath = document.getElementById('wave-bg-path');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const albumArt = document.getElementById('player-album-art');
const songTitleEl = document.getElementById('player-song-title');
const artistEl = document.getElementById('player-artist');

// Initialize App
function initApp() {
  restoreSessionState();
  loadYouTubeAPI();
  bindEvents();
}

// Restore last played session state from localStorage
function restoreSessionState() {
  try {
    currentPlaylist = AVARA_SONGS.filter(s => s && s.id);
    const savedTrackId = localStorage.getItem('avara_last_track_id');
    if (savedTrackId) {
      const idx = currentPlaylist.findIndex(s => s && s.id === savedTrackId);
      if (idx !== -1) {
        currentTrackIndex = idx;
      }
    }
  } catch (e) {}

  if (currentTrackIndex < 0 || currentTrackIndex >= currentPlaylist.length) {
    currentTrackIndex = 0;
  }
}

// Load YouTube iFrame API for Background Audio
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    createYTPlayer();
    return;
  }
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    createYTPlayer();
  };
}

function createYTPlayer() {
  const firstVideoId = currentPlaylist[currentTrackIndex]?.id || 'xAHS7PhfI6Q';
  player = new window.YT.Player('youtube-player', {
    height: '1',
    width: '1',
    videoId: firstVideoId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      enablejsapi: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

function onPlayerReady() {
  isPlayerReady = true;
  try {
    player.unMute();
    player.setVolume(100);
  } catch(e) {}

  const currentTrack = currentPlaylist[currentTrackIndex];
  if (currentTrack) {
    player.cueVideoById(currentTrack.id);
    updateTrackUI(currentTrack);
  }

  // Resume at exact seek time where user left off
  try {
    const savedSeekTime = parseFloat(localStorage.getItem('avara_last_seek_time'));
    if (!isNaN(savedSeekTime) && savedSeekTime > 2) {
      setTimeout(() => {
        try {
          if (player && player.seekTo) {
            player.seekTo(savedSeekTime, true);
            updateSeekbarUI(savedSeekTime, player.getDuration() || 1);
          }
        } catch(err) {}
      }, 600);
    }
  } catch(e) {}

  startProgressTracker();
}

function onPlayerStateChange(event) {
  if (event.data === window.YT.PlayerState.PLAYING) {
    isPlaying = true;
    consecutiveErrorCount = 0;
    updatePlayPauseUI(true);
  } else if (event.data === window.YT.PlayerState.PAUSED) {
    isPlaying = false;
    updatePlayPauseUI(false);
  } else if (event.data === window.YT.PlayerState.ENDED) {
    if (isRepeat) {
      if (isPlayerReady && player) {
        player.seekTo(0);
        player.playVideo();
      }
    } else {
      playNextTrack();
    }
  }
}

function onPlayerError(e) {
  console.warn('YouTube Player Error Code:', e.data);
  consecutiveErrorCount++;
  if (consecutiveErrorCount >= currentPlaylist.length) {
    consecutiveErrorCount = 0;
    return;
  }
  setTimeout(() => playNextTrack(), 500);
}

// Playback Controls
function playTrackAtIndex(index) {
  if (index < 0 || index >= currentPlaylist.length) return;
  currentTrackIndex = index;
  const track = currentPlaylist[currentTrackIndex];

  try {
    localStorage.setItem('avara_last_track_id', track.id);
    localStorage.setItem('avara_last_track_index', currentTrackIndex);
    localStorage.setItem('avara_last_seek_time', 0);
  } catch(e) {}

  updateTrackUI(track);

  if (isPlayerReady && player) {
    player.loadVideoById(track.id);
    player.playVideo();
  }
}

function togglePlayPause() {
  if (!isPlayerReady || !player) return;
  if (isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function playNextTrack() {
  const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
  playTrackAtIndex(nextIndex);
}

function playPrevTrack() {
  const prevIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  playTrackAtIndex(prevIndex);
}

// UI Updates
function updateTrackUI(track) {
  if (!track) return;
  if (songTitleEl) songTitleEl.textContent = track.title || 'Unknown Song';
  if (artistEl) artistEl.textContent = track.artist || 'Unknown Artist';
  if (albumArt) albumArt.src = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;
}

function updatePlayPauseUI(playing) {
  if (playing) {
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.remove('hidden');
    const vinyl = document.querySelector('.vinyl-record');
    if (vinyl) {
      vinyl.style.animation = 'spin 4s linear infinite';
    }
  } else {
    if (playIcon) playIcon.classList.remove('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    const vinyl = document.querySelector('.vinyl-record');
    if (vinyl) {
      vinyl.style.animation = 'none';
    }
  }
}

// Add spinning animation for the vinyl dynamically
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(styleSheet);


// Progress Ticker & Seekbar logic
function startProgressTracker() {
  if (seekInterval) clearInterval(seekInterval);
  seekInterval = setInterval(() => {
    if (!isPlayerReady || !player || !isPlaying || isDraggingSeekbar) return;
    try {
      const currentTime = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 1;
      updateSeekbarUI(currentTime, duration);
      
      // Save seek position
      if (Math.floor(currentTime) % 2 === 0) {
        try { localStorage.setItem('avara_last_seek_time', currentTime); } catch(e) {}
      }
    } catch (err) {}
  }, 250);
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateSeekbarUI(currentTime, duration) {
  const percent = (currentTime / duration) * 100;
  
  if (progressBar) progressBar.value = percent;
  if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
  if (totalTimeEl && duration > 1) totalTimeEl.textContent = formatTime(duration);

  if (waveBgPath && waveProgress && progressDot) {
    // Get total length of SVG path
    const pathLength = waveBgPath.getTotalLength();
    
    // Set dash array and offset for filling the wave
    waveProgress.style.strokeDasharray = pathLength;
    waveProgress.style.strokeDashoffset = pathLength - (percent / 100) * pathLength;
    
    // Calculate the point on the path to position the dot
    const point = waveBgPath.getPointAtLength((percent / 100) * pathLength);
    // Convert SVG coordinates to DOM coordinates (relative to the container)
    // Assuming viewBox is 0 0 300 40 and container is 100% width
    const svgRect = waveBgPath.closest('svg').getBoundingClientRect();
    const scaleX = svgRect.width / 300;
    const scaleY = svgRect.height / 40;
    
    progressDot.style.display = 'block';
    progressDot.style.left = `${point.x * scaleX}px`;
    progressDot.style.top = `${point.y * scaleY}px`;
  }
}

// Seekbar Dragging
if (progressBar) {
  progressBar.addEventListener('input', (e) => {
    isDraggingSeekbar = true;
    const val = parseFloat(e.target.value);
    
    if (isPlayerReady && player) {
      const duration = player.getDuration() || 0;
      const seekTime = (val / 100) * duration;
      updateSeekbarUI(seekTime, duration);
    }
  });

  progressBar.addEventListener('change', (e) => {
    const val = parseFloat(e.target.value);
    if (isPlayerReady && player) {
      const duration = player.getDuration() || 0;
      const seekTime = (val / 100) * duration;
      player.seekTo(seekTime, true);
    }
    isDraggingSeekbar = false;
  });
}

// Event Bindings
function bindEvents() {
  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
  if (nextBtn) nextBtn.addEventListener('click', playNextTrack);
  if (prevBtn) prevBtn.addEventListener('click', playPrevTrack);

  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      isRepeat = !isRepeat;
      if (isRepeat) {
        repeatBtn.querySelector('svg').setAttribute('stroke', '#111111');
      } else {
        repeatBtn.querySelector('svg').setAttribute('stroke', '#475b75');
      }
    });
  }
}

// Boot the app when DOM is fully parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
