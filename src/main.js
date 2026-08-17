import './style.css';
import { AVARA_SONGS } from './songs.js';

// Application State
let player = null;
let isPlayerReady = false;
let currentPlaylist = [...AVARA_SONGS];
let currentTrackIndex = 0;
let isPlaying = false;
let seekInterval = null;

// DOM Elements
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');
const miniPlayer = document.getElementById('mini-player');
const closePlayerBtn = document.getElementById('close-player-btn');
const songsListContainer = document.getElementById('songs-list-container');

// Mini Player Elements
const miniArt = document.getElementById('mini-art');
const miniTitle = document.getElementById('mini-title');
const miniArtist = document.getElementById('mini-artist');
const miniPlayPauseBtn = document.getElementById('mini-play-pause-btn');
const miniPlayIcon = document.getElementById('mini-play-icon');
const miniPauseIcon = document.getElementById('mini-pause-icon');

// Full Player Elements
const fullArt = document.getElementById('full-player-art');
const fullTitle = document.getElementById('full-player-title');
const fullArtist = document.getElementById('full-player-artist');
const fullPlayPauseBtn = document.getElementById('full-play-pause-btn');
const fullPlayIcon = document.getElementById('full-play-icon');
const fullPauseIcon = document.getElementById('full-pause-icon');
const fullTimeEl = document.getElementById('full-player-time');
const progressArc = document.getElementById('circular-progress-arc');

// Full Controls
const rewindBtn = document.getElementById('rewind-btn');
const forwardBtn = document.getElementById('forward-btn');
const prevBtn = document.getElementById('full-prev-btn');
const nextBtn = document.getElementById('full-next-btn');

// Initialize App
function initApp() {
  renderSongsList();
  loadYouTubeAPI();
  bindEvents();
}

// Render Songs List
function renderSongsList() {
  if (!songsListContainer) return;
  songsListContainer.innerHTML = '';
  
  currentPlaylist.forEach((song, index) => {
    if (!song) return;
    const el = document.createElement('div');
    el.className = `song-item ${index === currentTrackIndex ? 'active' : ''}`;
    el.innerHTML = `
      <div class="song-thumb-wrapper">
        <img class="song-thumb" src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" alt="${song.title}">
        <div class="song-play-overlay">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="song-info">
        <div class="song-name">${song.title}</div>
        <div class="song-artist">${song.artist}</div>
      </div>
      <div class="song-time">3:45</div>
      <button class="heart-btn ${Math.random() > 0.5 ? 'liked' : ''}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    `;
    
    // Play song on click
    el.addEventListener('click', (e) => {
      // Don't play if clicking heart
      if (e.target.closest('.heart-btn')) {
        const heart = e.target.closest('.heart-btn');
        heart.classList.toggle('liked');
        return;
      }
      playTrackAtIndex(index);
      openFullPlayer();
    });
    
    songsListContainer.appendChild(el);
  });
}

// Update Active Song in List
function updateActiveSongListItem() {
  const items = songsListContainer.querySelectorAll('.song-item');
  items.forEach((item, index) => {
    if (index === currentTrackIndex) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// View Navigation
function openFullPlayer() {
  playerView.classList.remove('hidden-view');
  miniPlayer.style.display = 'none'; // Hide mini player when full player is open
}

function closeFullPlayer() {
  playerView.classList.add('hidden-view');
  miniPlayer.style.display = 'flex';
}

// YouTube Player Initialization
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
    playerVars: { autoplay: 0, controls: 0 },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady() {
  isPlayerReady = true;
  const currentTrack = currentPlaylist[currentTrackIndex];
  if (currentTrack) {
    updateTrackUI(currentTrack);
  }
  
  // Setup SVG Circle Math
  if (progressArc) {
    const radius = progressArc.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    // We only want a half circle arc (bottom part)
    // By offsetting dasharray, we can create an arc of specific length
    const arcLength = circumference * 0.45; // 45% of the circle
    progressArc.style.strokeDasharray = `${arcLength} ${circumference - arcLength}`;
    progressArc.style.strokeDashoffset = arcLength; // Start empty
    progressArc.dataset.arcLength = arcLength;
  }
  
  startProgressTracker();
}

function onPlayerStateChange(event) {
  if (event.data === window.YT.PlayerState.PLAYING) {
    isPlaying = true;
    updatePlayPauseUI(true);
  } else if (event.data === window.YT.PlayerState.PAUSED) {
    isPlaying = false;
    updatePlayPauseUI(false);
  } else if (event.data === window.YT.PlayerState.ENDED) {
    playNextTrack();
  }
}

// Playback Logic
function playTrackAtIndex(index) {
  if (index < 0 || index >= currentPlaylist.length) return;
  currentTrackIndex = index;
  const track = currentPlaylist[currentTrackIndex];

  updateTrackUI(track);
  updateActiveSongListItem();

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

// Rewind / Forward Logic
function skipTime(seconds) {
  if (!isPlayerReady || !player) return;
  const currentTime = player.getCurrentTime() || 0;
  player.seekTo(currentTime + seconds, true);
}

// UI Updates
function updateTrackUI(track) {
  if (!track) return;
  const thumbUrl = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;
  
  // Mini Player
  miniTitle.textContent = track.title;
  miniArtist.textContent = track.artist;
  miniArt.src = thumbUrl;
  
  // Apply Marquee if title is long
  if (track.title.length > 20) {
    miniTitle.classList.add('scroll');
  } else {
    miniTitle.classList.remove('scroll');
  }

  // Full Player
  fullTitle.textContent = `"${track.title}"`;
  
  // Dynamic font sizing for artist name
  let nameLines = track.artist.split(' ');
  if(nameLines.length > 1) {
    fullArtist.innerHTML = nameLines[0] + '<br>' + nameLines.slice(1).join(' ');
  } else {
    fullArtist.innerHTML = track.artist;
  }
  
  // Scale down font if artist name is super long
  if (track.artist.length > 15) {
    fullArtist.style.fontSize = '36px';
  } else {
    fullArtist.style.fontSize = '52px';
  }
  
  fullArt.src = thumbUrl;
}

function updatePlayPauseUI(playing) {
  if (playing) {
    miniPlayIcon.classList.add('hidden');
    miniPauseIcon.classList.remove('hidden');
    fullPlayIcon.classList.add('hidden');
    fullPauseIcon.classList.remove('hidden');
  } else {
    miniPlayIcon.classList.remove('hidden');
    miniPauseIcon.classList.add('hidden');
    fullPlayIcon.classList.remove('hidden');
    fullPauseIcon.classList.add('hidden');
  }
}

function startProgressTracker() {
  if (seekInterval) clearInterval(seekInterval);
  seekInterval = setInterval(() => {
    if (!isPlayerReady || !player || !isPlaying) return;
    try {
      const currentTime = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 1;
      
      // Update text time
      fullTimeEl.textContent = formatTime(currentTime);
      
      // Update Circular Progress
      if (progressArc && progressArc.dataset.arcLength) {
        const percent = currentTime / duration;
        const arcLength = parseFloat(progressArc.dataset.arcLength);
        // strokeDashoffset goes from arcLength (empty) to 0 (full arc)
        const offset = arcLength - (arcLength * percent);
        progressArc.style.strokeDashoffset = offset;
      }
      
    } catch (err) {}
  }, 250);
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Event Bindings
function bindEvents() {
  // Play/Pause
  miniPlayPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
  fullPlayPauseBtn.addEventListener('click', togglePlayPause);
  
  // Next/Prev
  nextBtn.addEventListener('click', playNextTrack);
  prevBtn.addEventListener('click', playPrevTrack);
  
  // Rewind/Forward
  rewindBtn.addEventListener('click', () => skipTime(-10));
  forwardBtn.addEventListener('click', () => skipTime(10));
  
  // Open/Close Full Player
  miniPlayer.addEventListener('click', openFullPlayer);
  closePlayerBtn.addEventListener('click', closeFullPlayer);
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
