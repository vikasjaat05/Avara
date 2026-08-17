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
const searchTriggers = document.querySelectorAll('.search-trigger');
const searchContainer = document.getElementById('search-input-container');
const searchInput = document.getElementById('search-input');

// Initialize App
function initApp() {
  renderHomeView();
  loadYouTubeAPI();
  bindEvents();
}

// Render Home View Data
function renderHomeView() {
  // Render Collections (First 5 songs)
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

  // Render Recommended
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
        <button class="red-play-btn song-row-play">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px;"><path d="M8 5v14l11-7z" /></svg>
        </button>
      `;
      // Ensure clicking anywhere in the row plays the song
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
    playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
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
  } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.CUED) {
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
  if (miniTitle) miniTitle.textContent = track.title;
  if (miniArtist) miniArtist.textContent = track.artist;
  
  // Full Player
  if (fullTitle) fullTitle.textContent = track.title.length > 20 ? track.title.substring(0,20)+'...' : track.title;
  if (fullArtist) fullArtist.textContent = track.artist;
  if (fullArt) fullArt.src = thumbUrl;
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
      if (fullTimeEl) fullTimeEl.textContent = `-${formatTime(remaining)}`;
      
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

// Seek Functionality
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
  // Mini Player Controls
  if (miniPlayPauseBtn) {
    miniPlayPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });
  }
  if (miniNextBtn) {
    miniNextBtn.addEventListener('click', (e) => { e.stopPropagation(); playNextTrack(); });
  }
  if (miniPrevBtn) {
    miniPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); playPrevTrack(); });
  }
  if (miniPlayer) {
    miniPlayer.addEventListener('click', openFullPlayer);
  }

  // Full Player Controls
  if (fullPlayPauseBtn) fullPlayPauseBtn.addEventListener('click', togglePlayPause);
  if (fullNextBtn) fullNextBtn.addEventListener('click', playNextTrack);
  if (fullPrevBtn) fullPrevBtn.addEventListener('click', playPrevTrack);
  if (backBtn) backBtn.addEventListener('click', closeFullPlayer);
  
  // Progress Bar Seek
  bindProgressSeek();

  // Bottom Navigation
  if (navHome) {
    navHome.addEventListener('click', () => {
      navHome.classList.add('active');
      if (navHeart) navHeart.classList.remove('active');
      closeFullPlayer();
    });
  }
  
  if (navHeart) {
    navHeart.addEventListener('click', (e) => {
      e.stopPropagation(); // ensure it doesn't bubble if needed
      navHeart.classList.toggle('liked');
    });
  }
  
  // Search Triggers
  searchTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeFullPlayer();
      const scrollContent = homeView.querySelector('.scroll-content');
      if (scrollContent) scrollContent.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Toggle search bar visibility
      if (searchContainer) {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active') && searchInput) {
           setTimeout(() => searchInput.focus(), 100);
        }
      }
    });
  });
  
  // Close search when clicking outside
  document.addEventListener('click', (e) => {
    if (searchContainer && searchContainer.classList.contains('active')) {
      if (!searchContainer.contains(e.target) && !e.target.closest('.search-trigger')) {
        searchContainer.classList.remove('active');
      }
    }
  });
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Preloader Removal
let preloaderRemoved = false;
function removePreloader() {
  if (preloaderRemoved) return;
  preloaderRemoved = true;
  const preloader = document.getElementById('preloader');
  if(preloader) {
    preloader.classList.add('fade-out');
    setTimeout(() => preloader.remove(), 500);
  }
}

// Fallback: Force removal after max 2.5s (so total time with fadeout is max 3s)
setTimeout(removePreloader, 2500);

window.addEventListener('load', () => {
  // If loaded fast, remove it but leave it for at least 800ms for a nice effect
  setTimeout(removePreloader, 800);
});
