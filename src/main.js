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
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
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
  setupPlaylistDrawer();
  setupMoodFilters();
  setupShayariCardCreator();
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
  const artistEl = document.querySelector('.sp-artist');
  if (artistEl) artistEl.textContent = track.artist || '';
  // Album art
  if (albumArt) albumArt.src = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;
  // Update now playing strip
  updateNowPlayingStrip();
  // Update active state in playlist drawer
  updateDrawerActiveState();
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
      
      const totalTimeEl = document.getElementById('total-time');
      if (totalTimeEl && duration > 1) {
        totalTimeEl.textContent = formatTime(duration);
      }

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

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle('active', isShuffle);
      showToast(isShuffle ? '🔀 शफ़ल (Shuffle) चालू' : '🔀 शफ़ल (Shuffle) बंद');
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      isRepeat = !isRepeat;
      repeatBtn.classList.toggle('active', isRepeat);
      showToast(isRepeat ? '🔂 रिपीट (Repeat) चालू' : '🔂 रिपीट (Repeat) बंद');
    });
  }

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

  // ─── Ambient Sound Mixer Setup (बारिश 🌧️, कांच 🪟, रोना 😢) ─────────────
  
  // Helper: create and bind one ambient sound control  
  function createAmbientControl({ toggleId, volumeId, fillId, audioSrc, loop = true, onStart, onStop }) {
    const btn = document.getElementById(toggleId);
    const slider = document.getElementById(volumeId);
    const fill = document.getElementById(fillId);
    if (!btn || !slider || !fill) return null;

    let audio = null;
    let isPlaying = false;

    function ensureAudio() {
      if (!audio && audioSrc) {
        audio = new Audio(audioSrc);
        audio.loop = loop;
        audio.volume = 0;
      }
    }

    function setVol(val) {
      fill.style.width = `${val}%`;
      if (audio) audio.volume = val / 100;
    }

    function start(vol = 40) {
      ensureAudio();
      isPlaying = true;
      btn.classList.add('active');
      slider.value = vol;
      setVol(vol);
      if (audio) {
        audio.play().catch(e => console.log(`[${toggleId}] play blocked:`, e));
      }
      if (onStart) onStart();
    }

    function stop() {
      isPlaying = false;
      btn.classList.remove('active');
      if (audio) audio.pause();
      if (onStop) onStop();
    }

    btn.addEventListener('click', () => {
      isPlaying ? stop() : start();
    });

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      setVol(val);
      if (val > 0 && !isPlaying) { start(val); }
      else if (val === 0 && isPlaying) { stop(); slider.value = 0; fill.style.width = '0%'; }
    });

    return { start, stop };
  }

  // 1. Rain (looping WAV from local public/sounds/)
  createAmbientControl({
    toggleId: 'rain-toggle-btn',
    volumeId: 'rain-volume',
    fillId: 'rain-fill',
    audioSrc: '/sounds/rain.wav',
    loop: true
  });

  // 2. Glass Break (looping WAV - subtle at low volume)
  createAmbientControl({
    toggleId: 'glass-toggle-btn',
    volumeId: 'glass-volume',
    fillId: 'glass-fill',
    audioSrc: '/sounds/glass-break.wav',
    loop: true
  });

  // 3. Crying (Web Audio API synthesized crying-like tone)
  (function setupCryingSound() {
    const btn = document.getElementById('cry-toggle-btn');
    const slider = document.getElementById('cry-volume');
    const fill = document.getElementById('cry-fill');
    if (!btn || !slider || !fill) return;

    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;
    let lfoGain = null;
    let lfo = null;
    let isPlaying = false;

    function createCryingTone(vol) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Main carrier oscillator — sine wave at a "crying" frequency
      oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(320, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(280, audioCtx.currentTime + 1.5);
      oscillator.frequency.linearRampToValueAtTime(320, audioCtx.currentTime + 3);

      // LFO for tremolo / sob effect
      lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 4; // 4 Hz sob tremolo

      lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 40; // depth of tremolo pitch mod

      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      // Master gain
      gainNode = audioCtx.createGain();
      gainNode.gain.value = vol / 100 * 0.15;

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      lfo.start();
    }

    function stopCryingTone() {
      try {
        if (oscillator) { oscillator.stop(); oscillator = null; }
        if (lfo) { lfo.stop(); lfo = null; }
        if (audioCtx) { audioCtx.close(); audioCtx = null; }
      } catch(e) {}
    }

    function setVol(val) {
      fill.style.width = `${val}%`;
      if (gainNode) gainNode.gain.value = val / 100 * 0.15;
    }

    btn.addEventListener('click', () => {
      if (isPlaying) {
        isPlaying = false;
        btn.classList.remove('active');
        stopCryingTone();
      } else {
        isPlaying = true;
        btn.classList.add('active');
        const vol = parseInt(slider.value) || 40;
        slider.value = vol;
        fill.style.width = `${vol}%`;
        createCryingTone(vol);
      }
    });

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      fill.style.width = `${val}%`;
      if (val > 0 && !isPlaying) {
        isPlaying = true;
        btn.classList.add('active');
        createCryingTone(val);
      } else if (val === 0 && isPlaying) {
        isPlaying = false;
        btn.classList.remove('active');
        stopCryingTone();
      } else if (isPlaying) {
        setVol(val);
      }
    });
  })();
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
  const shayariCreateCardBtn = document.getElementById('shayari-create-card-btn');

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

  if (shayariCreateCardBtn) {
    shayariCreateCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shayariBox.classList.add('hidden'); // Close Shayari box
      
      const modal = document.getElementById('card-creator-modal');
      const textInput = document.getElementById('creator-text-input');
      
      if (modal && textInput) {
        textInput.value = shayariContent.textContent; // Set current shayari
        modal.classList.remove('hidden');
        // Trigger preview update
        textInput.dispatchEvent(new Event('input'));
      }
    });
  }

  // Close box on click outside
  document.addEventListener('click', (e) => {
    if (!shayariBox.classList.contains('hidden') && !shayariBox.contains(e.target) && e.target !== shayariBtn) {
      shayariBox.classList.add('hidden');
    }
  });
}

// ─── Playlist Drawer Panel (📋 गीत सूची) ──────────────────────────────
function populatePlaylistDrawer(songsToRender = currentPlaylist) {
  const drawerList = document.getElementById('drawer-songs-list');
  if (!drawerList) return;
  drawerList.innerHTML = '';

  const activeTrack = currentPlaylist[currentTrackIndex];

  songsToRender.forEach((track) => {
    // Find correct index in original currentPlaylist
    const originalIndex = currentPlaylist.findIndex(t => t.id === track.id);
    const isActive = activeTrack && activeTrack.id === track.id;

    const item = document.createElement('div');
    item.className = `drawer-item ${isActive ? 'active' : ''}`;
    item.setAttribute('data-id', track.id);
    item.innerHTML = `
      <img src="https://img.youtube.com/vi/${track.id}/hqdefault.jpg" alt="${track.title}" class="drawer-item-thumb" />
      <div class="drawer-item-meta">
        <div class="drawer-item-title">${track.title}</div>
        <div class="drawer-item-artist">${track.artist}</div>
      </div>
      <div class="drawer-item-status">
        ${isActive ? '▶' : ''}
      </div>
    `;

    item.addEventListener('click', () => {
      if (originalIndex !== -1) {
        playTrackAtIndex(originalIndex);
        // Close drawer on mobile
        if (window.innerWidth <= 768) {
          document.getElementById('playlist-drawer').classList.add('hidden');
        }
      }
    });

    drawerList.appendChild(item);
  });
}

function updateDrawerActiveState() {
  const activeTrack = currentPlaylist[currentTrackIndex];
  if (!activeTrack) return;
  const items = document.querySelectorAll('.drawer-item');
  items.forEach(item => {
    const id = item.getAttribute('data-id');
    const isCurrent = id === activeTrack.id;
    item.classList.toggle('active', isCurrent);
    const statusDiv = item.querySelector('.drawer-item-status');
    if (statusDiv) {
      statusDiv.innerHTML = isCurrent ? '▶' : '';
    }
  });
}

function setupPlaylistDrawer() {
  const playlistToggleBtn = document.getElementById('playlist-toggle-btn');
  const playlistDrawer = document.getElementById('playlist-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const searchInput = document.getElementById('playlist-search');

  if (!playlistToggleBtn || !playlistDrawer || !drawerCloseBtn) return;

  // Initial list rendering
  populatePlaylistDrawer();

  playlistToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playlistDrawer.classList.toggle('hidden');
  });

  drawerCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playlistDrawer.classList.add('hidden');
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = currentPlaylist.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.artist.toLowerCase().includes(query)
      );
      populatePlaylistDrawer(filtered);
    });
  }

  // Close drawer on click outside
  document.addEventListener('click', (e) => {
    if (!playlistDrawer.classList.contains('hidden') && !playlistDrawer.contains(e.target) && e.target !== playlistToggleBtn) {
      playlistDrawer.classList.add('hidden');
    }
  });
}

// ─── Mood Filters Logic (Pills) ───────────────────────────────────────
function setupMoodFilters() {
  const pills = document.querySelectorAll('.mood-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.getAttribute('data-category');
      
      // Save previously playing track ID
      const prevActiveId = currentPlaylist[currentTrackIndex]?.id;

      // Filter currentPlaylist
      if (category === 'all') {
        currentPlaylist = [...AVARA_SONGS];
      } else {
        currentPlaylist = AVARA_SONGS.filter(s => s.category === category);
      }

      // Rebuild carousel
      renderCoverflow();

      // Rebuild drawer
      populatePlaylistDrawer();

      // Sync active track index
      const newIdx = currentPlaylist.findIndex(s => s.id === prevActiveId);
      if (newIdx !== -1) {
        currentTrackIndex = newIdx;
      } else {
        currentTrackIndex = 0;
      }

      // Load & play correct track safely
      playTrackAtIndex(currentTrackIndex);
    });
  });
}

// ─── Shayari Card Creator Modal Logic ─────────────────────────────────
function setupShayariCardCreator() {
  const modal = document.getElementById('card-creator-modal');
  const closeBtn = document.getElementById('creator-close-btn');
  const textInput = document.getElementById('creator-text-input');
  const authorInput = document.getElementById('creator-author-input');
  const previewText = document.getElementById('preview-text');
  const previewAuthor = document.getElementById('preview-author');
  const previewSticker = document.getElementById('preview-sticker');
  const cardPreview = document.getElementById('card-preview');

  const themeBtns = document.querySelectorAll('.theme-select-btn');
  const stickerBtns = document.querySelectorAll('.sticker-select-btn');
  const downloadBtn = document.getElementById('creator-download-btn');
  const copyBtn = document.getElementById('creator-copy-btn');

  if (!modal || !closeBtn || !textInput || !authorInput || !previewText || !previewAuthor || !previewSticker || !cardPreview) return;

  // Sync inputs to preview
  textInput.addEventListener('input', () => {
    previewText.textContent = textInput.value;
  });

  authorInput.addEventListener('input', () => {
    previewAuthor.textContent = authorInput.value ? `— ${authorInput.value}` : '';
  });

  // Theme selector
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const theme = btn.getAttribute('data-theme');
      cardPreview.className = `card-preview ${theme}`;
    });
  });

  // Sticker selector
  stickerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stickerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sticker = btn.getAttribute('data-sticker');
      previewSticker.textContent = sticker;
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Close modal on click outside content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // Download Card
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      drawCardToCanvasAndDownload();
    });
  }

  // Copy card text
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = textInput.value;
      const author = authorInput.value;
      const copyStr = `${text}\n\n— ${author}`;
      
      navigator.clipboard.writeText(copyStr).then(() => {
        showToast('📋 कॉपी कर लिया गया है!');
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    });
  }
}

// Draw to high-res canvas
function drawCardToCanvasAndDownload() {
  const textInput = document.getElementById('creator-text-input');
  const authorInput = document.getElementById('creator-author-input');
  
  if (!textInput || !authorInput) return;

  const text = textInput.value;
  const author = authorInput.value;
  const sticker = document.querySelector('.sticker-select-btn.active')?.getAttribute('data-sticker') || '💔';
  const theme = document.querySelector('.theme-select-btn.active')?.getAttribute('data-theme') || 'theme-liquid-dark';

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // 1. Draw Background Gradient
  let grad = ctx.createLinearGradient(0, 0, 800, 800);
  if (theme === 'theme-liquid-red') {
    grad.addColorStop(0, '#2b0811');
    grad.addColorStop(1, '#150005');
  } else if (theme === 'theme-liquid-gold') {
    grad.addColorStop(0, '#1f1b0a');
    grad.addColorStop(1, '#0a0802');
  } else { // dark
    grad.addColorStop(0, '#111111');
    grad.addColorStop(1, '#1a1625');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 800);

  // 2. Draw Glow Blob (Ambient depth)
  let blobGrad = ctx.createRadialGradient(400, 400, 50, 400, 400, 300);
  if (theme === 'theme-liquid-red') {
    blobGrad.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
  } else if (theme === 'theme-liquid-gold') {
    blobGrad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
  } else {
    blobGrad.addColorStop(0, 'rgba(255, 220, 120, 0.20)');
  }
  blobGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = blobGrad;
  ctx.fillRect(0, 0, 800, 800);

  // 3. Draw premium borders
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 752, 752);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, 728, 728);

  // 4. Draw Sticker emoji
  ctx.font = '72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sticker, 400, 200);

  // 5. Draw Wrapped Shayari Text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = '500 32px "Outfit", sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;

  const words = text.split(' ');
  let line = '';
  let lines = [];
  const maxWidth = 640;
  const lineHeight = 50;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Center text blocks vertically
  let startY = 410 - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), 400, startY + (i * lineHeight));
  }

  // 6. Draw Author Signature
  ctx.shadowBlur = 0; // reset shadow
  if (theme === 'theme-liquid-red') {
    ctx.fillStyle = '#fb7185';
  } else {
    ctx.fillStyle = '#ffdc78';
  }
  ctx.font = 'bold 26px "Outfit", sans-serif';
  ctx.fillText(`— ${author}`, 400, startY + (lines.length * lineHeight) + 60);

  // 7. Trigger download
  const link = document.createElement('a');
  link.download = 'avara_shayari_card.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Simple Toast message helper
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = message;
  
  // Custom toast styling if not defined in style.css
  toast.style.background = 'rgba(255, 220, 120, 0.16)';
  toast.style.backdropFilter = 'blur(10px)';
  toast.style.border = '1px solid rgba(255, 220, 120, 0.30)';
  toast.style.color = '#ffdc78';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '8px';
  toast.style.margin = '10px';
  toast.style.fontFamily = '"Outfit", sans-serif';
  toast.style.fontSize = '13px';
  toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
  toast.style.transition = 'opacity 0.4s';
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', initApp);


