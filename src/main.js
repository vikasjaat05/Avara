import './style.css';

// ─── LocalStorage Keys ───────────────────────────────────────────────────────
const KEY_LAST_SONG_ID = 'avara_last_song_id';
const KEY_LAST_TIME    = 'avara_last_progress_time';
const KEY_LIKED_IDS    = 'avara_liked_song_ids';
const KEY_THEME_MODE   = 'avara_theme_mode';
const KEY_MOOD_COUNTS  = 'avara_mood_counts';
const KEY_PLAY_HISTORY = 'avara_play_history';

// ─── State ───────────────────────────────────────────────────────────────────
let ytPlayer          = null;
let ytIsReady         = false;
let pendingPlay       = null;
let currentIdx        = 0;
let isPlaying         = false;
let playlist          = [];
let categorizedSongs  = { Romantic: [], Heartbreak: [], Guru: [], Rap: [], New: [], Haryanvi: [] };
let likedSet          = new Set();
let shuffleOn         = false;
let repeatOn          = false;
let progressInt       = null;
let inPlayer          = false;
let initialSeek       = 0;
let currentTheme      = 'dark';
let currentTab        = 'home';
let moodCounts        = { heartbreak: 0, deep: 0, memories: 0 };
let playHistory       = [];
let deferredPwaPrompt = null;

// Pro Features State
let sleepTimerId      = null;
let sleepTimerMinutes = 0;
let eqPresets         = ['Normal', 'Bass Boost 🔊', 'Vocal 🎤', 'Acoustic 🎸', 'Treble ✨'];
let eqCurrentIdx      = 0;

// ─── DOM References ──────────────────────────────────────────────────────────
let D = {};

function grabDOM() {
  // Views
  D.homeView        = document.getElementById('home-view');
  D.searchView      = document.getElementById('search-view');
  D.libraryView     = document.getElementById('library-view');
  D.likedView       = document.getElementById('liked-view');
  D.playerView      = document.getElementById('player-view');

  // Lists & Containers
  D.quickGrid       = document.getElementById('quick-grid');
  D.shelfRecommended= document.getElementById('shelf-recommended');
  D.recTitle        = document.getElementById('rec-shelf-title');
  D.recSubtitle     = document.getElementById('rec-shelf-subtitle');
  D.recMoodBadge    = document.getElementById('rec-mood-badge');
  
  // Category Shelves
  D.shelfRomantic   = document.getElementById('shelf-romantic');
  D.shelfBewafai    = document.getElementById('shelf-bewafai');
  D.shelfGuru        = document.getElementById('shelf-guru');
  D.shelfRap         = document.getElementById('shelf-rap');
  D.shelfNew         = document.getElementById('shelf-new');
  D.shelfHaryanvi    = document.getElementById('shelf-haryanvi');

  D.mainSearchInput     = document.getElementById('main-search-input');
  D.mainSearchClear     = document.getElementById('main-search-clear');
  D.searchResultsHeading= document.getElementById('search-results-heading');
  D.searchResultsList   = document.getElementById('search-results-list');
  D.searchTagChips      = document.querySelectorAll('.search-tag-chip');

  D.librarySongsList    = document.getElementById('library-songs-list');
  D.libraryCatChips     = document.querySelectorAll('.cat-chip-lib');

  D.likedSongsList      = document.getElementById('liked-songs-list');
  D.likedCountSub       = document.getElementById('liked-count-sub');
  D.playAllLikedBtn     = document.getElementById('play-all-liked-btn');

  // Hero Spotlight
  D.heroBanner      = document.getElementById('hero-banner');
  D.heroBg          = document.getElementById('hero-bg');
  D.heroTitle       = document.getElementById('hero-title');
  D.heroArtist      = document.getElementById('hero-artist');
  D.heroPlayBtn     = document.getElementById('hero-play-btn');

  // Header Actions & Theme
  D.themeToggleBtn  = document.getElementById('theme-toggle-btn');
  D.sunIcon         = document.getElementById('theme-sun-icon');
  D.moonIcon        = document.getElementById('theme-moon-icon');
  D.searchToggle    = document.getElementById('search-toggle-btn');
  D.catChips        = document.querySelectorAll('.cat-chip');

  // Download App DOM
  D.headerDownloadBtn = document.getElementById('header-download-btn');
  D.sdDownloadBtn     = document.getElementById('sd-download-app');
  D.downloadModal     = document.getElementById('download-modal');
  D.closeDownloadModal= document.getElementById('close-download-modal');
  D.triggerPwaBtn     = document.getElementById('trigger-pwa-install-btn');

  // Pro Toolbar Elements
  D.sleepTimerBtn   = document.getElementById('sleep-timer-btn');
  D.sleepTimerLabel = document.getElementById('sleep-timer-label');
  D.eqPresetBtn     = document.getElementById('eq-preset-btn');
  D.eqModeLabel     = document.getElementById('eq-mode-label');
  D.shareSongBtn    = document.getElementById('share-song-btn');
  D.videoModeBtn        = document.getElementById('video-mode-btn');
  D.videoModeLabel      = document.getElementById('video-mode-label');
  D.videoPlayerBox      = document.getElementById('video-player-box');
  D.fullscreenVideoBtn  = document.getElementById('fullscreen-video-btn');



  // Full Player Overlay DOM
  D.playerBg        = document.getElementById('player-bg');
  D.playerArt       = document.getElementById('player-art');
  D.playerTitle     = document.getElementById('player-title');
  D.playerArtist    = document.getElementById('player-artist');
  D.playerLikeBtn   = document.getElementById('player-like-btn');
  D.playerLikeSvg   = document.getElementById('player-like-svg');
  D.lyricsLine      = document.getElementById('lyrics-line');
  D.progressTrack   = document.getElementById('progress-track');
  D.progressFill    = document.getElementById('progress-fill');
  D.progressThumb   = document.getElementById('progress-thumb');
  D.timeCur         = document.getElementById('time-cur');
  D.timeRem         = document.getElementById('time-rem');
  D.playPauseBtn    = document.getElementById('play-pause-btn');
  D.playIcon        = document.getElementById('play-icon');
  D.pauseIcon       = document.getElementById('pause-icon');
  D.prevBtn         = document.getElementById('prev-btn');
  D.nextBtn         = document.getElementById('next-btn');
  D.shuffleBtn      = document.getElementById('shuffle-btn');
  D.repeatBtn       = document.getElementById('repeat-btn');
  D.backBtn         = document.getElementById('back-btn');
  D.volSlider       = document.getElementById('vol-slider');

  // Mini player
  D.miniPlayer      = document.getElementById('mini-player');
  D.miniArt         = document.getElementById('mini-art');
  D.miniTitle       = document.getElementById('mini-title');
  D.miniArtist      = document.getElementById('mini-artist');
  D.miniOpen        = document.getElementById('mini-open');
  D.miniPlayBtn     = document.getElementById('mini-play-btn');
  D.miniPlayIcon    = document.getElementById('mini-play-icon');
  D.miniPauseIcon   = document.getElementById('mini-pause-icon');
  D.miniProgFill    = document.getElementById('mini-prog-fill');

  // Desktop sidebar
  D.sdPlayerPanel   = document.getElementById('sd-player-panel');
  D.sdArt           = document.getElementById('sd-art');
  D.sdTitle         = document.getElementById('sd-title');
  D.sdArtist        = document.getElementById('sd-artist');
  D.sdProgressFill  = document.getElementById('sd-progress-fill');
  D.sdCur           = document.getElementById('sd-cur');
  D.sdRem           = document.getElementById('sd-rem');
  D.sdPlayBtn       = document.getElementById('sd-play');
  D.sdPlayIcon      = document.getElementById('sd-play-icon');
  D.sdPauseIcon     = document.getElementById('sd-pause-icon');
  D.sdPrevBtn       = document.getElementById('sd-prev');
  D.sdNextBtn       = document.getElementById('sd-next');
  D.sdProgressTrack = document.getElementById('sd-progress-track');
  D.sdDiscover      = document.getElementById('sd-discover');
  D.sdSearch        = document.getElementById('sd-search');
  D.sdLibrary       = document.getElementById('sd-library');
  D.sdLiked         = document.getElementById('sd-liked');

  // Mobile Bottom Navigation
  D.navHome         = document.getElementById('nav-home');
  D.navSearch       = document.getElementById('nav-search-mob');
  D.navMusic        = document.getElementById('nav-music-mob');
  D.navLiked        = document.getElementById('nav-liked-mob');
}

// ─── Media Session API (Lock Screen & Bluetooth Sync) ─────────────────────────
function setupMediaSession(song) {
  if ('mediaSession' in navigator && song) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Avara Music',
      artwork: [
        { src: `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  }
}

// ─── Pro Feature: Sleep Timer ────────────────────────────────────────────────
function toggleSleepTimer() {
  const options = [0, 15, 30, 45, 60];
  const curIndex = options.indexOf(sleepTimerMinutes);
  const nextIndex = (curIndex + 1) % options.length;
  sleepTimerMinutes = options[nextIndex];

  if (sleepTimerId) clearTimeout(sleepTimerId);

  if (sleepTimerMinutes > 0) {
    D.sleepTimerLabel.textContent = `${sleepTimerMinutes}m`;
    D.sleepTimerBtn.classList.add('active');
    sleepTimerId = setTimeout(() => {
      if (isPlaying) togglePlay();
      sleepTimerMinutes = 0;
      D.sleepTimerLabel.textContent = 'Off';
      D.sleepTimerBtn.classList.remove('active');
      alert('💤 Sleep Timer: Music auto-paused. Goodnight!');
    }, sleepTimerMinutes * 60 * 1000);
  } else {
    D.sleepTimerLabel.textContent = 'Off';
    D.sleepTimerBtn.classList.remove('active');
  }
}

// ─── Pro Feature: Audio Equalizer ────────────────────────────────────────────
function toggleEqualizer() {
  eqCurrentIdx = (eqCurrentIdx + 1) % eqPresets.length;
  const name = eqPresets[eqCurrentIdx];
  D.eqModeLabel.textContent = name;
  if (eqCurrentIdx > 0) D.eqPresetBtn.classList.add('active');
  else D.eqPresetBtn.classList.remove('active');
}

// ─── Pro Feature: Video Mode / Audio Mode Switcher ───────────────────────────
let isVideoMode = false;

function toggleVideoMode() {
  isVideoMode = !isVideoMode;

  const ytContainer = document.getElementById('yt-player');
  const song = playlist[currentIdx];

  if (isVideoMode) {
    if (D.videoModeLabel) D.videoModeLabel.textContent = '🎵 Audio Mode';
    if (D.videoModeBtn) D.videoModeBtn.classList.add('active');
    if (D.playerArt) D.playerArt.classList.add('hidden');
    if (D.videoPlayerBox) {
      D.videoPlayerBox.classList.remove('hidden');
      if (ytContainer) {
        D.videoPlayerBox.appendChild(ytContainer);
        ytContainer.style.position = 'absolute';
        ytContainer.style.inset = '0';
        ytContainer.style.width = '100%';
        ytContainer.style.height = '100%';
        ytContainer.style.left = '0';
        ytContainer.style.top = '0';
        ytContainer.style.zIndex = '10';
      }
    }

    // Capture current playback progress and pause native background audio
    let curTime = 0;
    if (isNativeAudioPlaying && nativeAudio) {
      curTime = nativeAudio.currentTime || 0;
      nativeAudio.pause();
      isNativeAudioPlaying = false;
    } else if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
      curTime = ytPlayer.getCurrentTime() || 0;
    }

    if (song && ytIsReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      try {
        ytPlayer.unMute();
        ytPlayer.loadVideoById({ videoId: song.id, startSeconds: Math.floor(curTime) });
        ytPlayer.playVideo();
        isPlaying = true;
        setPlayUI(true);
      } catch(e) {}
    }
  } else {
    if (D.videoModeLabel) D.videoModeLabel.textContent = '🎬 Watch Video';
    if (D.videoModeBtn) D.videoModeBtn.classList.remove('active');
    if (D.playerArt) D.playerArt.classList.remove('hidden');
    if (D.videoPlayerBox) {
      D.videoPlayerBox.classList.add('hidden');
    }
    if (ytContainer) {
      document.body.appendChild(ytContainer);
      ytContainer.style.position = 'fixed';
      ytContainer.style.left = '-600px';
      ytContainer.style.top = '-600px';
      ytContainer.style.width = '320px';
      ytContainer.style.height = '180px';
      ytContainer.style.zIndex = '-999';
    }
  }
}

function toggleFullscreenVideo() {
  const box = D.videoPlayerBox || document.getElementById('yt-player');
  if (!box) return;

  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (box.requestFullscreen) {
      box.requestFullscreen();
    } else if (box.webkitRequestFullscreen) {
      box.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

// ─── Pro Feature: Share Song via Native Share / WhatsApp ──────────────────────
function shareCurrentSong() {
  const song = playlist[currentIdx];
  if (!song) return;
  const text = `🎧 "${song.title}" by ${song.artist} — Listen on Avara Music!\n👉 https://avara-ashiq.vercel.app/`;
  if (navigator.share) {
    navigator.share({ title: song.title, text, url: 'https://avara-ashiq.vercel.app/' }).catch(() => {});
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }
}

// ─── PWA Prompt & Download Modal ──────────────────────────────────────────────


function initDownloadModal() {
  const checkStandalone = () => {
    const ua = navigator.userAgent || '';
    const isWebView = /wv|Android.*Version\/[0-9]/i.test(ua) || window.Android || Boolean(window.chrome && window.chrome.webview);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.matchMedia('(display-mode: fullscreen)').matches ||
                        window.matchMedia('(display-mode: minimal-ui)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://') ||
                        isWebView;
    if (isStandalone) {
      document.body.classList.add('is-standalone-app');
      document.querySelectorAll('.download-app-btn, #sd-download-app, #header-download-btn, .download-highlight').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    }
  };
  checkStandalone();
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
  } catch(e) {}


  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    document.body.classList.add('is-standalone-app');
    if (D.headerDownloadBtn) D.headerDownloadBtn.style.display = 'none';
    if (D.sdDownloadBtn) D.sdDownloadBtn.style.display = 'none';
  });

  const openModal = () => {
    if (D.downloadModal) D.downloadModal.classList.remove('hidden');
  };
  const closeModal = () => {
    if (D.downloadModal) D.downloadModal.classList.add('hidden');
  };

  if (D.headerDownloadBtn) D.headerDownloadBtn.addEventListener('click', openModal);
  if (D.sdDownloadBtn) D.sdDownloadBtn.addEventListener('click', openModal);
  if (D.closeDownloadModal) D.closeDownloadModal.addEventListener('click', closeModal);

  if (D.triggerPwaBtn) {
    D.triggerPwaBtn.addEventListener('click', () => {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        deferredPwaPrompt.userChoice.then(() => {
          deferredPwaPrompt = null;
          closeModal();
        });
      } else {
        alert('Avara App added to Home Screen!');
      }
    });
  }
}


// ─── Theme Toggle & Dynamic Meta Color Sync ─────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem(KEY_THEME_MODE);
  currentTheme = savedTheme || 'dark';
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(`theme-${theme}`);
  localStorage.setItem(KEY_THEME_MODE, theme);

  const themeColor = theme === 'dark' ? '#0F172A' : '#F8FAFC';
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) metaTheme.setAttribute('content', themeColor);

  const msNavColor = document.getElementById('meta-ms-nav-color');
  if (msNavColor) msNavColor.setAttribute('content', themeColor);

  if (D.sunIcon && D.moonIcon) {
    if (theme === 'dark') {
      D.moonIcon.style.display = '';
      D.sunIcon.style.display  = 'none';
    } else {
      D.moonIcon.style.display = 'none';
      D.sunIcon.style.display  = '';
    }
  }
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ─── Web Audio API Background Keep-Alive Context ────────────────────────────
let audioCtx = null;
let keepAliveOsc = null;

function enableBackgroundAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      keepAliveOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001; // silent keep-alive
      keepAliveOsc.connect(gain);
      gain.connect(audioCtx.destination);
      keepAliveOsc.start();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch(e) {}
}

// ─── Top Hero Swiper Carousel Logic ───────────────────────────────────────────
let swiperCurrentIndex = 0;
let swiperInterval = null;

function initHeroSwiper() {
  const wrapper = document.getElementById('swiper-wrapper');
  const slides  = document.querySelectorAll('.swiper-slide');
  const dots    = document.querySelectorAll('.swiper-dot');
  if (!wrapper || !slides.length) return;

  function goToSlide(idx) {
    swiperCurrentIndex = (idx + slides.length) % slides.length;
    wrapper.style.transform = `translateX(-${swiperCurrentIndex * 100}%)`;
    slides.forEach((s, i) => s.classList.toggle('active', i === swiperCurrentIndex));
    dots.forEach((d, i) => d.classList.toggle('active', i === swiperCurrentIndex));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index);
      goToSlide(idx);
      restartSwiperTimer();
    });
  });

  document.querySelectorAll('.slide-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const songId = btn.dataset.songId;
      const realIdx = playlist.findIndex(s => s.id === songId);
      if (realIdx !== -1) {
        playTrack(realIdx);
        openPlayer();
      }
    });
  });

  // Touch Swipe Support
  let startX = 0;
  wrapper.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  wrapper.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 40) { goToSlide(swiperCurrentIndex + 1); restartSwiperTimer(); }
    else if (endX - startX > 40) { goToSlide(swiperCurrentIndex - 1); restartSwiperTimer(); }
  }, { passive: true });

  function startSwiperTimer() {
    if (swiperInterval) clearInterval(swiperInterval);
    swiperInterval = setInterval(() => {
      goToSlide(swiperCurrentIndex + 1);
    }, 3500);
  }

  function restartSwiperTimer() {
    startSwiperTimer();
  }

  startSwiperTimer();
}

// ─── Persistence & Listening History ─────────────────────────────────────────
function restoreSavedState() {
  try {
    const rawLiked = localStorage.getItem(KEY_LIKED_IDS);
    if (rawLiked) {
      const arr = JSON.parse(rawLiked);
      arr.forEach(id => {
        const idx = playlist.findIndex(s => s.id === id);
        if (idx !== -1) likedSet.add(idx);
      });
    }
  } catch(e) {}

  try {
    const rawMoods = localStorage.getItem(KEY_MOOD_COUNTS);
    if (rawMoods) moodCounts = JSON.parse(rawMoods);

    const rawHist = localStorage.getItem(KEY_PLAY_HISTORY);
    if (rawHist) playHistory = JSON.parse(rawHist);
  } catch(e) {}

  try {
    const savedSongId = localStorage.getItem(KEY_LAST_SONG_ID);
    const savedTime   = parseFloat(localStorage.getItem(KEY_LAST_TIME) || '0');

    if (savedSongId) {
      const idx = playlist.findIndex(s => s.id === savedSongId);
      if (idx !== -1) {
        currentIdx = idx;
        initialSeek = savedTime > 0 ? savedTime : 0;
      }
    }
  } catch(e) {}
}

function saveState() {
  try {
    const currentSong = playlist[currentIdx];
    if (currentSong) {
      localStorage.setItem(KEY_LAST_SONG_ID, currentSong.id);
    }
    const likedIds = Array.from(likedSet).map(idx => playlist[idx] && playlist[idx].id).filter(Boolean);
    localStorage.setItem(KEY_LIKED_IDS, JSON.stringify(likedIds));
    localStorage.setItem(KEY_MOOD_COUNTS, JSON.stringify(moodCounts));
    localStorage.setItem(KEY_PLAY_HISTORY, JSON.stringify(playHistory));
  } catch(e) {}
}

function recordSongPlay(song) {
  if (!song) return;
  const cat = song.category || '';
  if (cat.includes('Heartbreak') || cat.includes('💔')) {
    moodCounts.heartbreak = (moodCounts.heartbreak || 0) + 1;
  } else if (cat.includes('Rap') || cat.includes('🎤') || cat.includes('Haryanvi')) {
    moodCounts.deep = (moodCounts.deep || 0) + 1;
  } else if (cat.includes('Romantic') || cat.includes('💖') || cat.includes('Guru')) {
    moodCounts.memories = (moodCounts.memories || 0) + 1;
  }

  playHistory.unshift(song.id);
  if (playHistory.length > 50) playHistory.pop();

  saveState();
  renderRecommendedSection();
}

function savePlaybackTime(sec) {
  try {
    if (sec > 0) localStorage.setItem(KEY_LAST_TIME, sec.toString());
  } catch(e) {}
}

// ─── YouTube Init ────────────────────────────────────────────────────────────
function initYT() {
  const initialSong = playlist[currentIdx] || playlist[0];
  function create() {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '180', width: '320',
      videoId: initialSong.id,
      playerVars: {
        autoplay: 0, controls: 0, playsinline: 1,
        rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0,
      },
      events: {
        onReady() {
          ytIsReady = true;
          try {
            const startSec = initialSeek > 0 ? Math.floor(initialSeek) : 0;
            ytPlayer.cueVideoById({ videoId: initialSong.id, startSeconds: startSec });
          } catch(e) {}

          if (pendingPlay !== null) {
            const idx = pendingPlay; pendingPlay = null;
            _doPlay(idx);
          }
        },
        onStateChange: onYTState,
        onError(e) { console.warn('YT error', e.data); setTimeout(nextTrack, 1500); },
      },
    });
  }
  if (window._ytReady) create();
  else window._ytCbs.push(create);
}

function onYTState(e) {
  const S = window.YT.PlayerState;
  if (e.data === S.PLAYING) {
    isPlaying = true;
    setPlayUI(true);
    startTick();
  } else if (e.data === S.PAUSED || e.data === S.CUED) {
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

// ─── Dual Hybrid Audio Engine (HTML5 Native Audio + Android Native Bridge) ──
let nativeAudio = new Audio();
nativeAudio.crossOrigin = 'anonymous';
let isNativeAudioPlaying = false;

// Check if running inside Android App with Bridge
const isAndroidApp = typeof window.AndroidBridge !== 'undefined';

nativeAudio.addEventListener('play', () => {
  isNativeAudioPlaying = true;
  isPlaying = true;
  setPlayUI(true);
  startTick();
});

nativeAudio.addEventListener('pause', () => {
  isNativeAudioPlaying = false;
  if (!ytPlayer || ytPlayer.getPlayerState() !== 1) {
    isPlaying = false;
    setPlayUI(false);
  }
});

nativeAudio.addEventListener('ended', () => {
  isNativeAudioPlaying = false;
  if (repeatOn) {
    nativeAudio.currentTime = 0;
    nativeAudio.play();
  } else {
    nextTrack();
  }
});

// Bridge callbacks from Native Java
window.onNativePlaybackStarted = () => {
  isPlaying = true;
  setPlayUI(true);
  startTick();
};
window.onNativePlaybackPaused = () => {
  isPlaying = false;
  setPlayUI(false);
};
window.playNextTrack = () => nextTrack();
window.playPreviousTrack = () => prevTrack();

async function fetchAudioStreamUrl(songId) {
  const endpoints = [
    `https://pipedapi.kavin.rocks/streams/${songId}`,
    `https://api.piped.yt/streams/${songId}`,
    `https://pipedapi.mha.fi/streams/${songId}`
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const streams = data.audioStreams || [];
        if (streams.length > 0) {
          return streams[streams.length - 1].url;
        }
      }
    } catch(e) {}
  }
  return null;
}

// ─── Playback ────────────────────────────────────────────────────────────────
function _doPlay(idx) {
  const song = playlist[idx];
  if (!song) return;
  enableBackgroundAudio();
  saveState();
  recordSongPlay(song);
  setupMediaSession(song);

  // Synchronously trigger YouTube player on user gesture
  if (ytIsReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    try {
      if (isVideoMode) {
        ytPlayer.unMute();
      }
      if (initialSeek > 0) {
        ytPlayer.loadVideoById({ videoId: song.id, startSeconds: Math.floor(initialSeek) });
      } else {
        ytPlayer.loadVideoById({ videoId: song.id, startSeconds: 0 });
      }
      ytPlayer.playVideo();
      isPlaying = true;
      setPlayUI(true);
    } catch(e) {}
  }

  // If in Video mode, skip native background audio stream to ensure 100% video playback of current song
  if (isVideoMode) {
    if (nativeAudio) {
      nativeAudio.pause();
      isNativeAudioPlaying = false;
    }
    return;
  }

  // 1. Android Native App Bridge
  if (isAndroidApp && window.AndroidBridge) {
    fetchAudioStreamUrl(song.id).then(streamUrl => {
      if (streamUrl) {
        const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
        window.AndroidBridge.playSong(streamUrl, song.title, song.artist, thumb);
      }
    });
    return;
  }

  // 2. Mobile Web Native Audio Stream Proxy (Background backup)
  fetchAudioStreamUrl(song.id).then(streamUrl => {
    if (streamUrl && nativeAudio && !isVideoMode) {
      try {
        if (ytPlayer && typeof ytPlayer.mute === 'function') {
          ytPlayer.mute();
        }
      } catch(e) {}
      nativeAudio.src = streamUrl;
      if (initialSeek > 0) {
        nativeAudio.currentTime = initialSeek;
        initialSeek = 0;
      }
      nativeAudio.play().catch(() => {
        if (ytPlayer && typeof ytPlayer.unMute === 'function') {
          ytPlayer.unMute();
        }
      });
    }
  });
}


function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;
  initialSeek = 0;

  updateTrackUI(playlist[currentIdx]);
  showMini();
  highlightRow();

  _doPlay(idx);
}

function togglePlay() {
  if (isAndroidApp && window.AndroidBridge) {
    if (isPlaying) {
      try { window.AndroidBridge.pauseSong(); } catch(e) {}
      isPlaying = false;
    } else {
      try { window.AndroidBridge.resumeSong(); } catch(e) {}
      isPlaying = true;
    }
    setPlayUI(isPlaying);
    return;
  }

  if (isNativeAudioPlaying) {
    nativeAudio.pause();
    isPlaying = false;
    setPlayUI(false);
    if (ytIsReady && ytPlayer) try { ytPlayer.pauseVideo(); } catch(e) {}
  } else if (nativeAudio.src) {
    nativeAudio.play().catch(() => {});
    isPlaying = true;
    setPlayUI(true);
    if (ytIsReady && ytPlayer) try { ytPlayer.playVideo(); } catch(e) {}
  } else if (ytIsReady && ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
    const state = ytPlayer.getPlayerState();
    if (state === 1) {
      ytPlayer.pauseVideo();
      isPlaying = false;
      setPlayUI(false);
    } else {
      ytPlayer.playVideo();
      isPlaying = true;
      setPlayUI(true);
    }
  } else {
    playTrack(currentIdx);
  }
}

function prevTrack() { playTrack(shuffleOn ? randIdx() : currentIdx - 1); }
function nextTrack() { playTrack(shuffleOn ? randIdx() : currentIdx + 1); }
function randIdx()   { return Math.floor(Math.random() * playlist.length); }



// ─── UI Updates ──────────────────────────────────────────────────────────────
function updateTrackUI(song) {
  if (!song) return;
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;

  // Hero update
  if (D.heroBg)     D.heroBg.style.backgroundImage = `url(${thumb})`;
  if (D.heroTitle)  D.heroTitle.textContent = song.title;
  if (D.heroArtist) D.heroArtist.textContent = song.artist;

  // Player view
  if (D.playerArt)    D.playerArt.src = thumb;
  if (D.playerTitle)  D.playerTitle.textContent = song.title;
  if (D.playerArtist) D.playerArtist.textContent = song.artist;
  if (D.playerBg)     D.playerBg.style.backgroundImage = `url(${thumb})`;
  if (D.lyricsLine)   D.lyricsLine.textContent = `♪ ${song.title} — ${song.artist} ♪`;

  // Mini player
  if (D.miniArt)    D.miniArt.src    = thumb;
  if (D.miniTitle)  D.miniTitle.textContent  = song.title;
  if (D.miniArtist) D.miniArtist.textContent = song.artist;

  // Desktop sidebar
  if (D.sdArt) {
    D.sdArt.src = thumb;
    if (D.sdPlayerPanel) D.sdPlayerPanel.classList.remove('hidden');
  }
  if (D.sdTitle)  D.sdTitle.textContent  = song.title;
  if (D.sdArtist) D.sdArtist.textContent = song.artist;

  setLikeUI(likedSet.has(currentIdx));
}

function setPlayUI(playing) {
  if (D.playIcon)       D.playIcon.style.display       = playing ? 'none' : '';
  if (D.pauseIcon)      D.pauseIcon.style.display      = playing ? '' : 'none';
  if (D.miniPlayIcon)   D.miniPlayIcon.style.display    = playing ? 'none' : '';
  if (D.miniPauseIcon)  D.miniPauseIcon.style.display   = playing ? '' : 'none';
  if (D.sdPlayIcon)     D.sdPlayIcon.style.display      = playing ? 'none' : '';
  if (D.sdPauseIcon)    D.sdPauseIcon.style.display     = playing ? '' : 'none';
}

function setLikeUI(liked) {
  if (D.playerLikeBtn) D.playerLikeBtn.classList.toggle('liked', liked);
}

function highlightRow() {
  document.querySelectorAll('.song-row').forEach((r) => {
    const idx = parseInt(r.dataset.idx);
    r.classList.toggle('playing', idx === currentIdx);
  });
  document.querySelectorAll('.quick-card').forEach((c) => {
    const idx = parseInt(c.dataset.idx);
    c.classList.toggle('playing-card', idx === currentIdx);
  });
}

// ─── Progress Tick & Persistence ─────────────────────────────────────────────
function startTick() {
  if (progressInt) clearInterval(progressInt);
  progressInt = setInterval(() => {
    if (!isPlaying) return;
    try {
      let cur = 0;
      let dur = 1;
      if (isNativeAudioPlaying && nativeAudio.duration) {
        cur = nativeAudio.currentTime || 0;
        dur = nativeAudio.duration || 1;
      } else if (ytIsReady && ytPlayer) {
        cur = ytPlayer.getCurrentTime() || 0;
        dur = ytPlayer.getDuration() || 1;
      } else {
        return;
      }
      const pct = (cur / dur) * 100;

      savePlaybackTime(cur);

      if (D.progressFill)  D.progressFill.style.width = pct + '%';
      if (D.progressThumb) D.progressThumb.style.left = pct + '%';
      if (D.timeCur) D.timeCur.textContent = fmt(cur);
      if (D.timeRem) D.timeRem.textContent = '-' + fmt(dur - cur);

      if (D.miniProgFill) D.miniProgFill.style.width = pct + '%';

      if (D.sdProgressFill) D.sdProgressFill.style.width = pct + '%';
      if (D.sdCur) D.sdCur.textContent = fmt(cur);
      if (D.sdRem) D.sdRem.textContent = '-' + fmt(dur - cur);
    } catch(_) {}
  }, 400);
}


function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s/60), sc = Math.floor(s%60);
  return `${m}:${sc<10?'0':''}${sc}`;
}

// ─── View Switching (Multi-Tab Architecture) ──────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  inPlayer   = false;

  const views = [D.homeView, D.searchView, D.libraryView, D.likedView, D.playerView];
  views.forEach(v => {
    if (v) {
      v.classList.remove('active-view');
      v.classList.add('hidden-view');
    }
  });

  [D.navHome, D.navSearch, D.navMusic, D.navLiked].forEach(b => b && b.classList.remove('active'));
  [D.sdDiscover, D.sdSearch, D.sdLibrary, D.sdLiked].forEach(b => b && b.classList.remove('active'));

  if (tab === 'home') {
    D.homeView.classList.remove('hidden-view');
    D.homeView.classList.add('active-view');
    if (D.navHome) D.navHome.classList.add('active');
    if (D.sdDiscover) D.sdDiscover.classList.add('active');
  } else if (tab === 'search') {
    D.searchView.classList.remove('hidden-view');
    D.searchView.classList.add('active-view');
    if (D.navSearch) D.navSearch.classList.add('active');
    if (D.sdSearch) D.sdSearch.classList.add('active');
    renderSearchResults('');
    if (D.mainSearchInput) setTimeout(() => D.mainSearchInput.focus(), 80);
  } else if (tab === 'library') {
    D.libraryView.classList.remove('hidden-view');
    D.libraryView.classList.add('active-view');
    if (D.navMusic) D.navMusic.classList.add('active');
    if (D.sdLibrary) D.sdLibrary.classList.add('active');
    renderLibrarySongs(playlist, 'all');
  } else if (tab === 'liked') {
    D.likedView.classList.remove('hidden-view');
    D.likedView.classList.add('active-view');
    if (D.navLiked) D.navLiked.classList.add('active');
    if (D.sdLiked) D.sdLiked.classList.add('active');
    renderLikedSongs();
  }

  showMini();
}

function openPlayer() {
  inPlayer = true;
  // Show luxury player view overlay
  if (D.playerView) {
    D.playerView.classList.remove('hidden-view');
    D.playerView.classList.add('active-view');
  }
  // Hide mini player bar
  if (D.miniPlayer) D.miniPlayer.classList.add('hidden');
}

function closePlayer() {
  inPlayer = false;
  // Hide player view overlay smoothly
  if (D.playerView) {
    D.playerView.classList.remove('active-view');
    D.playerView.classList.add('hidden-view');
  }
  showMini();
}

function showMini() {
  if (!inPlayer && D.miniPlayer && playlist[currentIdx]) {
    D.miniPlayer.classList.remove('hidden');
  }
}

// ─── AI Personalized Recommendation Engine ───────────────────────────────────
function renderRecommendedSection() {
  if (!D.shelfRecommended) return;
  D.shelfRecommended.innerHTML = '';

  const { heartbreak = 0, deep = 0, memories = 0 } = moodCounts;
  const totalListened = heartbreak + deep + memories;

  let topMood = 'mix';
  if (totalListened >= 2) {
    if (heartbreak >= deep && heartbreak >= memories) topMood = 'heartbreak';
    else if (deep >= heartbreak && deep >= memories) topMood = 'deep';
    else if (memories >= heartbreak && memories >= deep) topMood = 'memories';
  }

  let title = 'Recommended For You ✨';
  let subtitle = 'Based on your recent listening history';
  let badgeText = '✨ Personalized Mix';
  let recommendedSongs = [];

  if (topMood === 'heartbreak') {
    title = 'Recommended For You 💔';
    subtitle = 'Curated based on your Sad & Heartbreak listening vibe';
    badgeText = '💔 Sad Vibe';
    recommendedSongs = playlist.filter(s => s.category && s.category.includes('Heartbreak')).slice(0, 10);
  } else if (topMood === 'deep') {
    title = 'Recommended For You 🎤';
    subtitle = 'Curated based on your Hip-Hop & Rap listening vibe';
    badgeText = '🎤 Rap Vibe';
    recommendedSongs = playlist.filter(s => s.category && (s.category.includes('Rap') || s.category.includes('Haryanvi'))).slice(0, 10);
  } else if (topMood === 'memories') {
    title = 'Recommended For You 💖';
    subtitle = 'Curated based on your Romantic & Love vibe';
    badgeText = '💖 Love Vibe';
    recommendedSongs = playlist.filter(s => s.category && (s.category.includes('Romantic') || s.category.includes('Guru'))).slice(0, 10);
  } else {
    title = 'Recommended For You ✨';
    subtitle = 'Play songs to unlock your custom AI mood mix';
    badgeText = '✨ Mix Vibe';
    recommendedSongs = playlist.slice(0, 10);
  }

  if (D.recTitle) D.recTitle.textContent = title;
  if (D.recSubtitle) D.recSubtitle.textContent = subtitle;
  if (D.recMoodBadge) D.recMoodBadge.textContent = badgeText;

  recommendedSongs.forEach((song) => {
    const realIdx = playlist.indexOf(song);
    const card = document.createElement('div');
    card.className = 'shelf-card';
    card.innerHTML = `
      <div class="card-cover">
        <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
        <span class="card-cat-badge">${badgeText.split(' ')[0]} Rec</span>
      </div>
      <div class="card-title">${song.title}</div>
      <div class="card-sub">${song.artist}</div>
    `;
    card.addEventListener('click', () => {
      playTrack(realIdx);
      openPlayer();
    });
    D.shelfRecommended.appendChild(card);
  });
}

// ─── Render Dynamic Home Category Shelves ─────────────────────────────────────
function renderHomeSections() {
  if (D.quickGrid) {
    D.quickGrid.innerHTML = '';
    const quickSongs = playlist.slice(0, 8);
    quickSongs.forEach((song) => {
      const realIdx = playlist.indexOf(song);
      const card = document.createElement('div');
      card.className = 'quick-card' + (realIdx === currentIdx ? ' playing-card' : '');
      card.dataset.idx = realIdx;
      card.innerHTML = `
        <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
        <div class="quick-card-info">
          <div class="quick-title">${song.title}</div>
          <div class="quick-artist">${song.artist}</div>
        </div>
        <div class="eq-icon">
          <span></span><span></span><span></span>
        </div>
      `;
      card.addEventListener('click', () => {
        playTrack(realIdx);
        openPlayer();
      });
      D.quickGrid.appendChild(card);
    });
  }

  renderRecommendedSection();

  // 1. 💖 Romantic Hits
  renderCategoryShelf(D.shelfRomantic, '💖 Romantic Hits', 'Romantic');
  // 2. 💔 Heartbreak Hits
  renderCategoryShelf(D.shelfBewafai, '💔 Heartbreak Hits', 'Heartbreak');
  // 3. 👑 Guru Randhawa Special
  renderCategoryShelf(D.shelfGuru, '👑 Guru Randhawa Special', 'Guru');
  // 4. 🎤 Hindi Rap & Hip-Hop
  renderCategoryShelf(D.shelfRap, '🎤 Hindi Rap & Hip-Hop', 'Rap');
  // 5. ✨ New Hits 2026
  renderCategoryShelf(D.shelfNew, '✨ New Hits 2026', 'New');
  // 6. 🔥 Haryanvi Bangers
  renderCategoryShelf(D.shelfHaryanvi, '🔥 Haryanvi Bangers', 'Haryanvi');
}

function renderCategoryShelf(container, categoryFullName, badgeTag) {
  if (!container) return;
  container.innerHTML = '';
  // Fetch from pre-indexed categories for zero-lag
  const songs = (categorizedSongs[badgeTag] || []).slice(0, 25);

  const fragment = document.createDocumentFragment();
  songs.forEach((song) => {
    const realIdx = playlist.indexOf(song);
    const card = document.createElement('div');
    card.className = 'shelf-card';
    card.innerHTML = `
      <div class="card-cover">
        <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
        <span class="card-cat-badge">${badgeTag}</span>
      </div>
      <div class="card-title">${song.title}</div>
      <div class="card-sub">${song.artist}</div>
    `;
    card.addEventListener('click', () => {
      playTrack(realIdx);
      openPlayer();
    });
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
}

// ─── Render Search Results (Debounced & Capped for 60FPS) ──────────────────────
let searchDebounceTimer = null;

function renderSearchResults(query) {
  if (!D.searchResultsList) return;
  const q = (query || '').trim().toLowerCase();

  if (D.searchResultsHeading) {
    D.searchResultsHeading.textContent = q ? `Search Results for "${query}"` : 'Top Trending Tracks';
  }
  if (D.mainSearchClear) {
    D.mainSearchClear.classList.toggle('hidden', !q);
  }

  const matches = q
    ? playlist.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q))).slice(0, 50)
    : playlist.slice(0, 25);

  if (matches.length === 0) {
    D.searchResultsList.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--text-sub)">
        <div style="font-size:36px;margin-bottom:8px">🔍</div>
        <div style="font-size:15px;font-weight:700">No matching songs found</div>
        <div style="font-size:12px;margin-top:4px">Try searching for Guru Randhawa, DIVINE, Sonu Nigam, or song titles</div>
      </div>
    `;
    return;
  }

  renderSongRowList(D.searchResultsList, matches, false);
}

// ─── Render Library View Songs (Infinite Scroll & High Speed) ─────────────────
let libraryCurrentOffset = 0;
let libraryActiveList = [];

function renderLibrarySongs(songs, filter) {
  if (!D.librarySongsList) return;
  D.librarySongsList.innerHTML = '';
  libraryActiveList = (songs || playlist).filter(Boolean);
  libraryCurrentOffset = 0;

  appendLibraryBatch();
}

function appendLibraryBatch(batchSize = 35) {
  if (!D.librarySongsList || libraryCurrentOffset >= libraryActiveList.length) return;

  const nextBatch = libraryActiveList.slice(libraryCurrentOffset, libraryCurrentOffset + batchSize);
  libraryCurrentOffset += batchSize;

  renderSongRowList(D.librarySongsList, nextBatch, true);
}

// ─── Render Liked Songs View ──────────────────────────────────────────────────
function renderLikedSongs() {
  if (!D.likedSongsList) return;
  D.likedSongsList.innerHTML = '';
  const likedArr = playlist.filter((_, i) => likedSet.has(i));

  if (D.likedCountSub) {
    D.likedCountSub.textContent = `${likedArr.length} ${likedArr.length === 1 ? 'Song' : 'Songs'} Saved`;
  }

  if (likedArr.length === 0) {
    D.likedSongsList.innerHTML = `
      <div style="text-align:center;padding:60px 24px;color:var(--text-sub)">
        <div style="font-size:48px;margin-bottom:12px">❤️</div>
        <div style="font-size:18px;font-weight:700;color:var(--text)">No Liked Songs Yet</div>
        <div style="font-size:13px;margin-top:6px">Tap ♡ on any song to save it to your Liked Songs</div>
      </div>
    `;
    return;
  }

  renderSongRowList(D.likedSongsList, likedArr, false);
}

// ─── Helper: Render Standard Song Rows (DocumentFragment Batching) ────────────
function renderSongRowList(container, songs, isAppend = false) {
  if (!container) return;
  if (!isAppend) container.innerHTML = '';

  const fragment = document.createDocumentFragment();

  songs.forEach((song) => {
    const realIdx = playlist.indexOf(song);
    const liked   = likedSet.has(realIdx);
    const el = document.createElement('div');
    el.className = 'song-row' + (realIdx === currentIdx && isPlaying ? ' playing' : '');
    el.dataset.idx = realIdx;
    el.innerHTML = `
      <div class="song-thumb-wrap">
        <img class="song-thumb" src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
      </div>
      <div class="song-row-info">
        <div class="song-row-title">${song.title}</div>
        <div class="song-row-artist">${song.artist}</div>
      </div>
      <div class="song-row-actions">
        <button class="song-row-video-btn" data-idx="${realIdx}" title="Watch Video" aria-label="Watch Video">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-9 11V9l6 3-6 3z"/></svg>
        </button>
        <button class="song-row-like-btn ${liked ? 'liked' : ''}" data-idx="${realIdx}" aria-label="Like">
          <svg viewBox="0 0 24 24" fill="${liked ? 'var(--accent)' : 'none'}" stroke="${liked ? 'var(--accent)' : 'currentColor'}" stroke-width="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
    `;

    el.addEventListener('click', (e) => {
      if (e.target.closest('.song-row-like-btn') || e.target.closest('.song-row-video-btn')) return;
      playTrack(realIdx);
      openPlayer();
    });

    const videoBtn = el.querySelector('.song-row-video-btn');
    if (videoBtn) {
      videoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.dataset.idx);
        playTrack(idx);
        if (!isVideoMode) {
          toggleVideoMode();
        }
        openPlayer();
      });
    }

    const likeBtn = el.querySelector('.song-row-like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.dataset.idx);
        const btn = e.currentTarget;
        const svg = btn.querySelector('svg');
        if (likedSet.has(idx)) {
          likedSet.delete(idx);
          btn.classList.remove('liked');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
        } else {
          likedSet.add(idx);
          btn.classList.add('liked');
          svg.setAttribute('fill', 'var(--accent)');
          svg.setAttribute('stroke', 'var(--accent)');
        }
        saveState();
        if (idx === currentIdx) setLikeUI(likedSet.has(idx));
        if (currentTab === 'liked') renderLikedSongs();
      });
    }

    fragment.appendChild(el);
  });

  container.appendChild(fragment);
}


// ─── Event Bindings ──────────────────────────────────────────────────────────
function bindAll() {
  if (D.themeToggleBtn) D.themeToggleBtn.addEventListener('click', toggleTheme);

  if (D.heroPlayBtn) D.heroPlayBtn.addEventListener('click', () => {
    playTrack(currentIdx);
    openPlayer();
  });

  if (D.backBtn)      D.backBtn.addEventListener('click', closePlayer);
  if (D.playPauseBtn) D.playPauseBtn.addEventListener('click', togglePlay);
  if (D.prevBtn)      D.prevBtn.addEventListener('click', prevTrack);
  if (D.nextBtn)      D.nextBtn.addEventListener('click', nextTrack);

  // Pro Toolbar Controls
  if (D.videoModeBtn)       D.videoModeBtn.addEventListener('click', toggleVideoMode);
  if (D.fullscreenVideoBtn) D.fullscreenVideoBtn.addEventListener('click', toggleFullscreenVideo);
  if (D.sleepTimerBtn)      D.sleepTimerBtn.addEventListener('click', toggleSleepTimer);
  if (D.eqPresetBtn)        D.eqPresetBtn.addEventListener('click', toggleEqualizer);
  if (D.shareSongBtn)       D.shareSongBtn.addEventListener('click', shareCurrentSong);

  if (D.shuffleBtn) {
    D.shuffleBtn.addEventListener('click', () => {
      shuffleOn = !shuffleOn;
      D.shuffleBtn.classList.toggle('active', shuffleOn);
    });
  }
  if (D.repeatBtn) {
    D.repeatBtn.addEventListener('click', () => {
      repeatOn = !repeatOn;
      D.repeatBtn.classList.toggle('active', repeatOn);
    });
  }

  if (D.playerLikeBtn) {
    D.playerLikeBtn.addEventListener('click', () => {
      if (likedSet.has(currentIdx)) likedSet.delete(currentIdx);
      else likedSet.add(currentIdx);
      setLikeUI(likedSet.has(currentIdx));
      saveState();
      highlightRow();
      if (currentTab === 'liked') renderLikedSongs();
    });
  }

  if (D.progressTrack) {
    D.progressTrack.addEventListener('click', (e) => {
      const r = D.progressTrack.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (isNativeAudioPlaying && nativeAudio.duration) {
        const targetSec = nativeAudio.duration * fraction;
        nativeAudio.currentTime = targetSec;
        savePlaybackTime(targetSec);
      } else if (ytIsReady && ytPlayer) {
        const targetSec = (ytPlayer.getDuration() || 0) * fraction;
        ytPlayer.seekTo(targetSec, true);
        savePlaybackTime(targetSec);
      }
    });
  }

  if (D.volSlider) {
    D.volSlider.addEventListener('input', () => {
      const vol = +D.volSlider.value;
      if (ytIsReady && ytPlayer) ytPlayer.setVolume(vol);
      if (nativeAudio) nativeAudio.volume = vol / 100;
    });
  }

  if (D.miniOpen)    D.miniOpen.addEventListener('click', openPlayer);
  if (D.miniPlayer)  D.miniPlayer.addEventListener('click', (e) => {
    if (e.target.closest('#mini-play-btn')) return;
    openPlayer();
  });
  if (D.miniPlayBtn) D.miniPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

  if (D.sdPlayBtn) D.sdPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
  if (D.sdPrevBtn) D.sdPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });
  if (D.sdNextBtn) D.sdNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });

  // Desktop Sidebar player panel — click card to reopen full player
  if (D.sdPlayerPanel) {
    D.sdPlayerPanel.addEventListener('click', (e) => {
      if (e.target.closest('#sd-play') || e.target.closest('#sd-prev') || e.target.closest('#sd-next') || e.target.closest('#sd-progress-track')) return;
      if (playlist[currentIdx]) openPlayer();
    });
  }

  if (D.sdProgressTrack) D.sdProgressTrack.addEventListener('click', (e) => {
    const r = D.sdProgressTrack.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    if (isNativeAudioPlaying && nativeAudio.duration) {
      const targetSec = nativeAudio.duration * fraction;
      nativeAudio.currentTime = targetSec;
      savePlaybackTime(targetSec);
    } else if (ytIsReady && ytPlayer) {
      const targetSec = (ytPlayer.getDuration() || 0) * fraction;
      ytPlayer.seekTo(targetSec, true);
      savePlaybackTime(targetSec);
    }
  });

  // Global Keyboard Shortcuts (Esc to minimize player, Space to toggle play)
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape' && inPlayer) {
      closePlayer();
    } else if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    }
  });

  // Desktop Sidebar Tab Switching
  if (D.sdDiscover) D.sdDiscover.addEventListener('click', () => switchTab('home'));
  if (D.sdSearch)   D.sdSearch.addEventListener('click',   () => switchTab('search'));
  if (D.sdLibrary)  D.sdLibrary.addEventListener('click',  () => switchTab('library'));
  if (D.sdLiked)    D.sdLiked.addEventListener('click',    () => switchTab('liked'));

  // Mobile Bottom Navigation Tab Switching
  if (D.navHome)   D.navHome.addEventListener('click',   () => switchTab('home'));
  if (D.navSearch) D.navSearch.addEventListener('click', () => switchTab('search'));
  if (D.navMusic)  D.navMusic.addEventListener('click',  () => switchTab('library'));
  if (D.navLiked)  D.navLiked.addEventListener('click',  () => switchTab('liked'));

  // Header Search Icon Button
  if (D.searchToggle) D.searchToggle.addEventListener('click', () => switchTab('search'));

  // Home View Category Chips Filtering
  if (D.catChips) {
    D.catChips.forEach(chip => {
      chip.addEventListener('click', () => {
        D.catChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.filter;
        if (cat === 'all') {
          renderHomeSections();
        } else {
          renderFilteredHome(cat);
        }
      });
    });
  }

  // Dedicated Search View Input Listener (Debounced 120ms for 60FPS Speed)
  if (D.mainSearchInput) {
    D.mainSearchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        renderSearchResults(val);
      }, 120);
    });
  }
  if (D.mainSearchClear) {
    D.mainSearchClear.addEventListener('click', () => {
      if (D.mainSearchInput) D.mainSearchInput.value = '';
      renderSearchResults('');
    });
  }

  // Infinite Scroll Listener for Library View
  const libScroll = document.querySelector('#library-view .view-scroll');
  if (libScroll) {
    libScroll.addEventListener('scroll', () => {
      if (libScroll.scrollTop + libScroll.clientHeight >= libScroll.scrollHeight - 300) {
        appendLibraryBatch();
      }
    }, { passive: true });
  }


  // Quick Search Tag Chips
  if (D.searchTagChips) {
    D.searchTagChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.query;
        if (D.mainSearchInput) D.mainSearchInput.value = q;
        renderSearchResults(q);
      });
    });
  }

  // Library View Category Filter Chips
  if (D.libraryCatChips) {
    D.libraryCatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        D.libraryCatChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const f = chip.dataset.filter;
        if (f === 'all') {
          renderLibrarySongs(playlist, 'all');
        } else {
          renderLibrarySongs(playlist.filter(s => s.category === f || (s.category && s.category.includes(f))), f);
        }
      });
    });
  }

  // Liked View "Play All Liked" Button
  if (D.playAllLikedBtn) {
    D.playAllLikedBtn.addEventListener('click', () => {
      const likedArr = playlist.filter((_, i) => likedSet.has(i));
      if (likedArr.length) {
        const realIdx = playlist.indexOf(likedArr[0]);
        playTrack(realIdx);
        openPlayer();
      }
    });
  }
}

function renderFilteredHome(catFilter) {
  const filtered = playlist.filter(s => s.category === catFilter || (s.category && s.category.includes(catFilter)));

  if (D.quickGrid) {
    D.quickGrid.innerHTML = '';
    filtered.slice(0, 8).forEach((song) => {
      const realIdx = playlist.indexOf(song);
      const card = document.createElement('div');
      card.className = 'quick-card' + (realIdx === currentIdx ? ' playing-card' : '');
      card.dataset.idx = realIdx;
      card.innerHTML = `
        <img src="https://img.youtube.com/vi/${song.id}/hqdefault.jpg" loading="lazy" alt="">
        <div class="quick-card-info">
          <div class="quick-title">${song.title}</div>
          <div class="quick-artist">${song.artist}</div>
        </div>
        <div class="eq-icon"><span></span><span></span><span></span></div>
      `;
      card.addEventListener('click', () => {
        playTrack(realIdx);
        openPlayer();
      });
      D.quickGrid.appendChild(card);
    });
  }
}

// ─── Boot & Initialization ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  grabDOM();
  initTheme();
  initDownloadModal();
  initHeroSwiper();

  try {
    const res = await fetch('/songs.json');
    const data = await res.json();
    playlist = data.filter(Boolean);

    // Pre-index categories
    playlist.forEach(s => {
      if (!s.category) return;
      if (s.category.includes('Romantic')) categorizedSongs.Romantic.push(s);
      if (s.category.includes('Heartbreak')) categorizedSongs.Heartbreak.push(s);
      if (s.category.includes('Guru')) categorizedSongs.Guru.push(s);
      if (s.category.includes('Rap')) categorizedSongs.Rap.push(s);
      if (s.category.includes('New')) categorizedSongs.New.push(s);
      if (s.category.includes('Haryanvi')) categorizedSongs.Haryanvi.push(s);
    });
  } catch(e) {
    console.error("Failed to load songs", e);
  }

  restoreSavedState();
  updateTrackUI(playlist[currentIdx] || playlist[0]);

  setPlayUI(false);

  if (initialSeek > 0) {
    if (D.timeCur) D.timeCur.textContent = fmt(initialSeek);
  }

  renderHomeSections();
  initYT();
  bindAll();
  switchTab('home');
});
