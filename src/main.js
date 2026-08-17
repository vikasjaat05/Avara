import './style.css';
import { AVARA_SONGS } from './songs.js';

// Application State
let player = null;
let isPlayerReady = false;
let currentPlaylist = [...AVARA_SONGS];
let currentTrackIndex = 0;
let isPlaying = false;
let seekInterval = null;

// DOM Elements - Views
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');

// DOM Elements - Home View
const collectionsList = document.getElementById('collections-list');
const recommendedList = document.getElementById('recommended-list');

// DOM Elements - Mini Player
const miniPlayer = document.getElementById('mini-player');
const miniPlayPauseBtn = document.getElementById('mini-play-pause-btn');
const miniPlayIcon = document.getElementById('mini-play-icon');
const miniPauseIcon = document.getElementById('mini-pause-icon');
const miniTitle = document.getElementById('mini-title');
const miniArtist = document.getElementById('mini-artist');
const miniPrevBtn = document.getElementById('mini-prev-btn');
const miniNextBtn = document.getElementById('mini-next-btn');

// DOM Elements - Full Player
const backBtn = document.getElementById('back-btn');
const fullArt = document.getElementById('full-player-art');
const fullTitle = document.getElementById('full-player-title');
const fullArtist = document.getElementById('full-player-artist');
const fullPlayPauseBtn = document.getElementById('full-play-pause-btn');
const fullPlayIcon = document.getElementById('full-play-icon');
const fullPauseIcon = document.getElementById('full-pause-icon');
const fullPrevBtn = document.getElementById('full-prev-btn');
const fullNextBtn = document.getElementById('full-next-btn');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressBarBg = document.getElementById('progress-bar-bg');
const fullTimeEl = document.getElementById('full-player-time');

// DOM Elements - Nav
const navHome = document.getElementById('nav-home');
const navSearch = document.getElementById('nav-search');
const navHeart = document.getElementById('nav-heart');

// Initialize App
function initApp() {
  renderHomeView();
  loadYouTubeAPI();
  bindEvents();
}

// Render Home View Data
function renderHomeView() {
  // Render Collections (First 5 songs as collections just for UI)
  if (collectionsList) {
    collectionsList.innerHTML = '';
    currentPlaylist.slice(0, 5).forEach((song, idx) => {
      const el = document.createElement('div');
      el.className = 'collection-card';
      el.innerHTML = `
        <div class="collection-img-box">
          <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" alt="${song.title}">
        </div>
        <h4>${song.title.substring(0, 15)}</h4>
        <p>${Math.floor(Math.random() * 200) + 50} songs</p>
      `;
      el.addEventListener('click', () => {
        playTrackAtIndex(idx);
        openFullPlayer();
      });
      collectionsList.appendChild(el);
    });
  }

  // Render Recommended (All songs)
  if (recommendedList) {
    recommendedList.innerHTML = '';
    currentPlaylist.forEach((song, index) => {
      const el = document.createElement('div');
      el.className = 'song-row';
      el.innerHTML = `
        <div class="song-row-info">
          <div class="song-row-title">${song.title.length > 25 ? song.title.substring(0,25)+'...' : song.title}</div>
          <div class="song-row-artist">${song.artist}</div>
        </div>
        <button class="glass-btn song-row-play">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#e63946" style="margin-left:2px;"><path d="M8 5v14l11-7z" /></svg>
        </button>
      `;
      el.addEventListener('click', () => {
        playTrackAtIndex(index);
        openFullPlayer();
      });
      recommendedList.appendChild(el);
    });
  }
}

// View Navigation
function openFullPlayer() {
  playerView.classList.remove('hidden-view');
  navHome.classList.remove('active');
}

function closeFullPlayer() {
  playerView.classList.add('hidden-view');
  navHome.classList.add('active');
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
  const thumbUrl = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;
  
  // Mini Player
  miniTitle.textContent = track.title;
  miniArtist.textContent = track.artist;
  
  // Full Player
  fullTitle.textContent = track.title.length > 20 ? track.title.substring(0,20)+'...' : track.title;
  fullArtist.textContent = track.artist;
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
      const percent = (currentTime / duration) * 100;
      
      // Update text time
      const remaining = duration - currentTime;
      fullTimeEl.textContent = `-${formatTime(remaining)}`;
      
      // Update Horizontal Progress
      if (progressBarFill) {
        progressBarFill.style.width = `${percent}%`;
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

// Seek Functionality (Click on progress bar)
function bindProgressSeek() {
  if (progressBarBg) {
    progressBarBg.addEventListener('click', (e) => {
      if (!isPlayerReady || !player) return;
      const rect = progressBarBg.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = clickX / rect.width;
      const duration = player.getDuration() || 0;
      player.seekTo(duration * percent, true);
    });
  }
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
  miniNextBtn.addEventListener('click', (e) => { e.stopPropagation(); playNextTrack(); });
  miniPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); playPrevTrack(); });
  fullNextBtn.addEventListener('click', playNextTrack);
  fullPrevBtn.addEventListener('click', playPrevTrack);
  
  // Progress Bar Seek
  bindProgressSeek();

  // Navigation
  miniPlayer.addEventListener('click', openFullPlayer);
  backBtn.addEventListener('click', closeFullPlayer);
  
  // Bottom Nav
  navHome.addEventListener('click', () => {
    navHome.classList.add('active');
    navHeart.classList.remove('active');
    closeFullPlayer();
  });
  
  navHeart.addEventListener('click', () => {
    navHeart.classList.toggle('liked'); // Custom toggle for wishlist
  });
  
  navSearch.addEventListener('click', () => {
    // Just a placeholder, we can open home and scroll to top for now
    closeFullPlayer();
    document.querySelector('.view-container').scrollTop = 0;
  });
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
