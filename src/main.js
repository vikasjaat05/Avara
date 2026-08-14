import './style.css';
import { AVARA_SONGS } from './songs.js';

// Application State
let player = null;
let isPlayerReady = false;
let currentPlaylist = [...AVARA_SONGS];
let currentTrackIndex = 0;
let isPlaying = false;
let isMuted = false;
let volumeLevel = 80;
let isShuffle = false;
let seekInterval = null;
let isDraggingSeekbar = false;
let consecutiveErrorCount = 0;

// DOM Elements
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const albumArt = document.getElementById('player-album-art');
const songTitleEl = document.getElementById('player-song-title');
const lyricsLineEl = document.getElementById('player-lyrics-line');
const coverflowTrack = document.getElementById('coverflow-track');
const hindiBrandTitle = document.getElementById('hindi-brand-title');

const volumeIconBtn = document.getElementById('volume-icon-btn');
const volHighIcon = document.getElementById('vol-high');
const volMuteIcon = document.getElementById('vol-mute');
const volumeBar = document.getElementById('volume-bar');

// Initialize App
function initApp() {
  renderCoverflow();
  loadYouTubeAPI();
  bindEvents();
  setupShayariWidget();
}

// Render Symmetrical 3D CoverFlow Carousel
function renderCoverflow() {
  if (!coverflowTrack) return;
  coverflowTrack.innerHTML = '';

  const N = currentPlaylist.length;

  currentPlaylist.forEach((track, index) => {
    const card = document.createElement('div');
    card.className = 'cover-card';

    // Calculate symmetrical cyclic offset for 3D fan effect (-2, -1, 0, 1, 2)
    let offset = index - currentTrackIndex;
    if (N > 1) {
      while (offset > Math.floor(N / 2)) offset -= N;
      while (offset < -Math.floor((N - 1) / 2)) offset += N;
    }

    card.setAttribute('data-offset', offset);

    // Cards show ONLY album art - no text inside to avoid duplication
    card.innerHTML = `
      <img src="https://img.youtube.com/vi/${track.id}/hqdefault.jpg" alt="${track.title}" />
    `;

    card.addEventListener('click', () => {
      playTrackAtIndex(index);
    });

    coverflowTrack.appendChild(card);
  });

  // Update the now-playing strip below the coverflow
  updateNowPlayingStrip();
}

function updateNowPlayingStrip() {
  const strip = document.getElementById('now-playing-strip');
  if (!strip) return;
  const track = currentPlaylist[currentTrackIndex];
  if (!track) return;
  strip.innerHTML = `
    <div class="nps-title">${track.title}</div>
    <div class="nps-artist">${track.artist}</div>
  `;
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
  const firstVideoId = currentPlaylist[0]?.id || 'xAHS7PhfI6Q';
  player = new window.YT.Player('youtube-player', {
    height: '100%',
    width: '100%',
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
  player.setVolume(volumeLevel);
  updateTrackUI(currentPlaylist[currentTrackIndex]);
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
    playNextTrack();
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

  updateTrackUI(track);
  renderCoverflow();

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
  if (isShuffle && currentPlaylist.length > 1) {
    let nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    while (nextIndex === currentTrackIndex) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    }
    playTrackAtIndex(nextIndex);
  } else {
    const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    playTrackAtIndex(nextIndex);
  }
}

function playPrevTrack() {
  const prevIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  playTrackAtIndex(prevIndex);
}

// UI Updates
function updateTrackUI(track) {
  if (!track) return;
  // Song title (new card player)
  songTitleEl.textContent = track.title || 'Unknown Song';
  // Artist field in card player
  const artistEl = document.querySelector('.gpc-artist');
  if (artistEl) artistEl.textContent = track.artist || '';
  // Album art
  if (albumArt) albumArt.src = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;
  // Update now playing strip
  updateNowPlayingStrip();
}

const liveSoundwave = document.getElementById('live-soundwave');

function updatePlayPauseUI(playing) {
  const vinyl = document.querySelector('.sp-vinyl');
  if (playing) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    if (liveSoundwave) liveSoundwave.classList.remove('hidden');
    if (playPauseBtn) playPauseBtn.classList.add('playing-pulse');
    if (hindiBrandTitle) hindiBrandTitle.classList.add('playing-glow');
    if (vinyl) vinyl.classList.add('spinning');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    if (liveSoundwave) liveSoundwave.classList.add('hidden');
    if (playPauseBtn) playPauseBtn.classList.remove('playing-pulse');
    if (hindiBrandTitle) hindiBrandTitle.classList.remove('playing-glow');
    if (vinyl) vinyl.classList.remove('spinning');
  }
}

// Progress Ticker & In-Capsule Synchronized Hindi Lyrics Line Updating
function startProgressTracker() {
  if (seekInterval) clearInterval(seekInterval);
  seekInterval = setInterval(() => {
    if (!isPlayerReady || !player || !isPlaying || isDraggingSeekbar) return;
    try {
      const currentTime = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 1;
      const percent = (currentTime / duration) * 100;

      progressBar.value = percent;
      progressFill.style.width = `${percent}%`;
      currentTimeEl.textContent = formatTime(currentTime);

      // Dynamically update the live Hindi lyrics line RIGHT INSIDE the song capsule
      const currentTrack = currentPlaylist[currentTrackIndex];
      if (currentTrack && currentTrack.lyrics && currentTrack.lyrics.length > 0 && lyricsLineEl) {
        const lyricIdx = Math.floor((currentTime / duration) * currentTrack.lyrics.length);
        const activeLine = currentTrack.lyrics[Math.min(lyricIdx, currentTrack.lyrics.length - 1)];
        if (lyricsLineEl.textContent !== activeLine) {
          lyricsLineEl.textContent = activeLine;
        }
      }
    } catch (err) {}
  }, 250);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Seekbar Dragging
progressBar.addEventListener('input', (e) => {
  isDraggingSeekbar = true;
  const val = parseFloat(e.target.value);
  progressFill.style.width = `${val}%`;
  if (isPlayerReady && player) {
    const duration = player.getDuration() || 0;
    const seekTime = (val / 100) * duration;
    currentTimeEl.textContent = formatTime(seekTime);
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

// Event Bindings
function bindEvents() {
  playPauseBtn.addEventListener('click', togglePlayPause);
  nextBtn.addEventListener('click', playNextTrack);
  prevBtn.addEventListener('click', playPrevTrack);

  // Volume slider — increase / decrease volume
  const volFill = document.getElementById('vol-fill');

  function updateVolFill(val) {
    if (volFill) volFill.style.width = val + '%';
  }

  volumeBar.addEventListener('input', (e) => {
    volumeLevel = parseInt(e.target.value, 10);
    updateVolFill(volumeLevel);
    if (isPlayerReady && player) {
      if (volumeLevel === 0) {
        player.mute();
        isMuted = true;
        volHighIcon.classList.add('hidden');
        volMuteIcon.classList.remove('hidden');
      } else {
        player.unMute();
        player.setVolume(volumeLevel);
        isMuted = false;
        volHighIcon.classList.remove('hidden');
        volMuteIcon.classList.add('hidden');
      }
    }
  });

  // Speaker icon — toggle mute/unmute
  volumeIconBtn.addEventListener('click', () => {
    if (!isPlayerReady || !player) return;
    isMuted = !isMuted;
    if (isMuted) {
      player.mute();
      volHighIcon.classList.add('hidden');
      volMuteIcon.classList.remove('hidden');
    } else {
      player.unMute();
      player.setVolume(volumeLevel);
      volHighIcon.classList.remove('hidden');
      volMuteIcon.classList.add('hidden');
    }
  });
}

// ─── Shayari Widget (💔 दर्द-ए-दिल) ───────────────────────────────────
const shayaris = [
  "दिल के टूटने से कोई आवाज़ नहीं होती, बस कुछ लोग ख़ामोशी से बिखर जाते हैं।",
  "मोहब्बत की महफ़िल में आज हमारा ज़िक्र हुआ, सबने वाह-वाह कहा और हम मुस्कुरा दिए।",
  "तेरी बेवफाई का कोई शिकवा नहीं मुझे, बस अफ़सोस इस बात का है कि मैंने तुझसे वफ़ा की उम्मीद की थी।",
  "हम तो तेरे दिल की महफ़िल सजाने आए थे, पर क्या पता था कि हम सिर्फ तमाशा बनकर रह जाएंगे।",
  "शीशा टूटे तो आवाज आती है, पर जब दिल टूटता है तो कोई आवाज नहीं आती।",
  "दर्द ही सही पर तूने कुछ तो दिया, वो लोग भी हैं जिन्होंने सिर्फ उम्मीदें दी थीं।",
  "पत्थर की दुनिया में शीशे का दिल लेकर निकले थे, टूटना ही था उसे।",
  "काँच की तरह तोड़ दिया उसने हमें, खुद को ही समेटने में अब उम्र गुज़र रही है।",
  "वफ़ा का नाम अब कोई मत लेना, हमने वफ़ा करके सिर्फ ज़ख्म पाए हैं।",
  "ज़िंदगी से कोई शिकवा नहीं, बस मौत का इंतज़ार है, जो तेरे जाने के बाद बेहद हसीन लगती है।",
  "अब तो तन्हाइयों में जीने की आदत सी हो गई है, महफ़िलें भी अब बेगानी सी लगती हैं।",
  "तेरे ज़ख्मों को सीने में दबाकर मुस्कुराते हैं, हम तो वो आशिक हैं जो टूट कर भी वफ़ा निभाते हैं।",
  "वो छोड़ कर गए हमें उस मोड़ पर, जहाँ से वापस जाना मुमकिन न था।",
  "तुमने तो कह दिया कि हमारा कोई वास्ता नहीं, ज़रा उनसे तो पूछो जिन पर क्या गुज़र गई।"
];

let currentShayariIndex = 0;

function setupShayariWidget() {
  const shayariBtn = document.getElementById('shayari-btn');
  const shayariBox = document.getElementById('shayari-box');
  const shayariCloseBtn = document.getElementById('shayari-close-btn');
  const shayariContent = document.getElementById('shayari-content');
  const shayariNextBtn = document.getElementById('shayari-next-btn');

  if (!shayariBtn || !shayariBox || !shayariCloseBtn || !shayariContent || !shayariNextBtn) return;

  function showNewShayari() {
    shayariContent.style.transition = 'opacity 0.2s';
    shayariContent.style.opacity = 0;
    setTimeout(() => {
      shayariContent.textContent = shayaris[currentShayariIndex];
      shayariContent.style.opacity = 1;
    }, 200);
  }

  // Set initial shayari
  currentShayariIndex = Math.floor(Math.random() * shayaris.length);
  shayariContent.textContent = shayaris[currentShayariIndex];

  shayariBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shayariBox.classList.toggle('hidden');
  });

  shayariCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shayariBox.classList.add('hidden');
  });

  shayariNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentShayariIndex = (currentShayariIndex + 1) % shayaris.length;
    showNewShayari();
  });

  // Close box on click outside
  document.addEventListener('click', (e) => {
    if (!shayariBox.classList.contains('hidden') && !shayariBox.contains(e.target) && e.target !== shayariBtn) {
      shayariBox.classList.add('hidden');
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);

