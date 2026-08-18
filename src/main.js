// Web Audio API Background Keep-Alive Context (Fixes Mobile Screen Lock Audio!)
let audioCtx = null;
let keepAliveOsc = null;

function enableBackgroundAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      keepAliveOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001; // virtually silent frequency keep-alive
      keepAliveOsc.connect(gain);
      gain.connect(audioCtx.destination);
      keepAliveOsc.start();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch(e) {}

  if (D.bgAudio) {
    D.bgAudio.play().catch(() => {});
  }
}

function stopBackgroundAudio() {
  if (D.bgAudio) {
    try { D.bgAudio.pause(); } catch(e) {}
  }
}

// ─── LocalStorage Keys ───────────────────────────────────────────────────────
const KEY_LAST_SONG_ID = 'avara_last_song_id';
const KEY_LAST_TIME    = 'avara_last_progress_time';
const KEY_LIKED_IDS    = 'avara_liked_song_ids';
const KEY_THEME_MODE   = 'avara_theme_mode';
const KEY_MOOD_COUNTS  = 'avara_mood_counts';
const KEY_PLAY_HISTORY = 'avara_play_history';
const KEY_PERMS_DONE   = 'avara_perms_done';

// ─── State ───────────────────────────────────────────────────────────────────
let ytPlayer          = null;
let ytIsReady         = false;
let pendingPlay       = null;
let currentIdx        = 0;
let isPlaying         = false;
let playlist          = AVARA_SONGS.filter(Boolean);
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

// O(1) Fast Map Lookup (Fixes 100% Lag!)
let songIdIndexMap    = new Map();

function rebuildSongIndexMap() {
  songIdIndexMap.clear();
  playlist.forEach((song, idx) => {
    if (song && song.id) songIdIndexMap.set(song.id, idx);
  });
}

function getSongIndex(song) {
  if (!song || !song.id) return -1;
  return songIdIndexMap.has(song.id) ? songIdIndexMap.get(song.id) : -1;
}

// ─── DOM References ──────────────────────────────────────────────────────────
let D = {};

function grabDOM() {
  // Silent Keep-Alive Audio for Background Playback
  D.bgAudio         = document.getElementById('bg-keepalive');


  // Permissions Modal DOM
  D.permsModal          = document.getElementById('permissions-modal');
  D.closePermsModal     = document.getElementById('close-permissions-modal');
  D.grantNotifBtn       = document.getElementById('grant-notif-perm-btn');
  D.grantLocBtn         = document.getElementById('grant-loc-perm-btn');
  D.donePermsBtn        = document.getElementById('done-permissions-btn');

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

  // Header Actions & Theme
  D.themeToggleBtn  = document.getElementById('theme-toggle-btn');
  D.sunIcon         = document.getElementById('theme-sun-icon');
  D.moonIcon        = document.getElementById('theme-moon-icon');
  D.searchToggle    = document.getElementById('search-toggle-btn');
  D.catChips        = document.querySelectorAll('.cat-chip');

  // Pro Toolbar Elements
  D.sleepTimerBtn   = document.getElementById('sleep-timer-btn');
  D.sleepTimerLabel = document.getElementById('sleep-timer-label');
  D.eqPresetBtn     = document.getElementById('eq-preset-btn');
  D.eqModeLabel     = document.getElementById('eq-mode-label');
  D.shareSongBtn    = document.getElementById('share-song-btn');

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

// ─── Background Audio Keep-Alive for Phone Lock & Switching Apps ─────────────
function startBackgroundKeepAlive() {
  enableBackgroundAudio();
}

function stopBackgroundKeepAlive() {
  stopBackgroundAudio();
}


// Override visibilitychange so mobile browsers do NOT freeze playback!
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && isPlaying) {
    startBackgroundKeepAlive();
    if (ytPlayer && ytIsReady) {
      try { ytPlayer.playVideo(); } catch(e) {}
    }
  }
});

// ─── Real Native App Permissions Modal ───────────────────────────────────────
function initPermissionsModal() {
  const isDone = localStorage.getItem(KEY_PERMS_DONE);
  if (!isDone && D.permsModal) {
    setTimeout(() => D.permsModal.classList.remove('hidden'), 1200);
  }

  const closeModal = () => {
    if (D.permsModal) D.permsModal.classList.add('hidden');
    localStorage.setItem(KEY_PERMS_DONE, 'true');
  };

  if (D.closePermsModal) D.closePermsModal.addEventListener('click', closeModal);
  if (D.donePermsBtn)    D.donePermsBtn.addEventListener('click', closeModal);

  if (D.grantNotifBtn) {
    D.grantNotifBtn.addEventListener('click', () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            D.grantNotifBtn.textContent = 'Allowed ✓';
            D.grantNotifBtn.classList.add('active');
          }
        });
      }
    });
  }

  if (D.grantLocBtn) {
    D.grantLocBtn.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            D.grantLocBtn.textContent = 'Allowed ✓';
            D.grantLocBtn.classList.add('active');
          },
          () => {
            D.grantLocBtn.textContent = 'Denied';
          }
        );
      }
    });
  }
}

// ─── Top Hero Swiper Carousel (Continuous Smooth Auto-Loop) ───────────────────
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
      const realIdx = songIdIndexMap.has(songId) ? songIdIndexMap.get(songId) : 0;
      playTrack(realIdx);
      openPlayer();
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

// ─── Pro Feature: Share Song via WhatsApp & Native Share ──────────────────────
function shareCurrentSong() {
  const song = playlist[currentIdx];
  if (!song) return;
  const text = `🎧 Listening to "${song.title}" by ${song.artist} on Avara Music!\n👉 https://avara-ashiq.vercel.app/`;
  if (navigator.share) {
    navigator.share({ title: song.title, text: text, url: 'https://avara-ashiq.vercel.app/' }).catch(() => {});
  } else {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
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

// ─── Boomerang Canvas Video Background Loop ──────────────────────────────────
function initBoomerangBg() {
  const video  = document.getElementById('bm-video');
  const canvas = document.getElementById('bm-canvas');
  if (!video || !canvas) return;

  const frames = [];
  const maxW = 960;
  let isCapturing = true;

  function captureFrame() {
    if (!isCapturing || !video.videoWidth) return;
    try {
      const offCanvas = document.createElement('canvas');
      const scale = Math.min(1, maxW / video.videoWidth);
      offCanvas.width  = video.videoWidth * scale;
      offCanvas.height = video.videoHeight * scale;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
      frames.push(offCanvas);
    } catch(e) {}
  }

  function frameLoop() {
    if (isCapturing && !video.paused && !video.ended) {
      captureFrame();
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(frameLoop);
      } else {
        requestAnimationFrame(frameLoop);
      }
    }
  }

  video.addEventListener('play', () => {
    frameLoop();
  });

  video.addEventListener('ended', () => {
    isCapturing = false;
    if (frames.length > 5) {
      video.classList.add('hidden');
      canvas.classList.remove('hidden');

      let frameIdx = 0;
      let forward = true;
      const ctx = canvas.getContext('2d');

      setInterval(() => {
        const frame = frames[frameIdx];
        if (frame) {
          canvas.width  = frame.width;
          canvas.height = frame.height;
          ctx.drawImage(frame, 0, 0);
        }

        if (forward) {
          frameIdx++;
          if (frameIdx >= frames.length - 1) forward = false;
        } else {
          frameIdx--;
          if (frameIdx <= 0) forward = true;
        }
      }, 1000 / 30);
    } else {
      video.currentTime = 0;
      video.play();
    }
  });
}

// ─── Persistence & Listening History ─────────────────────────────────────────
function restoreSavedState() {
  try {
    const rawLiked = localStorage.getItem(KEY_LIKED_IDS);
    if (rawLiked) {
      const arr = JSON.parse(rawLiked);
      arr.forEach(id => {
        const idx = getSongIndex({ id });
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
      const idx = getSongIndex({ id: savedSongId });
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
    startBackgroundKeepAlive();
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

// ─── Playback ────────────────────────────────────────────────────────────────
function _doPlay(idx) {
  const song = playlist[idx];
  if (!song) return;
  saveState();
  recordSongPlay(song);
  setupMediaSession(song);
  startBackgroundKeepAlive();

  if (initialSeek > 0) {
    const startSec = Math.floor(initialSeek);
    initialSeek = 0;
    ytPlayer.loadVideoById({ videoId: song.id, startSeconds: startSec });
  } else {
    ytPlayer.loadVideoById({ videoId: song.id, startSeconds: 0 });
  }
  ytPlayer.playVideo();
}

function playTrack(idx) {
  if (idx < 0) idx = playlist.length - 1;
  if (idx >= playlist.length) idx = 0;
  currentIdx = idx;
  initialSeek = 0;

  updateTrackUI(playlist[currentIdx]);
  showMini();
  highlightRow();

  if (ytIsReady && ytPlayer) _doPlay(idx);
  else pendingPlay = idx;
}

function togglePlay() {
  if (!ytIsReady || !ytPlayer) {
    playTrack(currentIdx);
    return;
  }
  if (isPlaying) {
    ytPlayer.pauseVideo();
    stopBackgroundKeepAlive();
  } else {
    startBackgroundKeepAlive();
    if (initialSeek > 0) {
      _doPlay(currentIdx);
    } else {
      ytPlayer.playVideo();
    }
  }
}

function prevTrack() { playTrack(shuffleOn ? randIdx() : currentIdx - 1); }
function nextTrack() { playTrack(shuffleOn ? randIdx() : currentIdx + 1); }
function randIdx()   { return Math.floor(Math.random() * playlist.length); }

// ─── UI Updates ──────────────────────────────────────────────────────────────
function updateTrackUI(song) {
  if (!song) return;
  const thumb = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;

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
    if (!ytIsReady || !ytPlayer || !isPlaying) return;
    try {
      const cur = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration() || 1;
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
  const views = [D.homeView, D.searchView, D.libraryView, D.likedView];
  views.forEach(v => v && v.classList.replace('active-view','hidden-view'));
  D.playerView.classList.replace('hidden-view','active-view');
  if (D.miniPlayer) D.miniPlayer.classList.add('hidden');
}

function closePlayer() {
  inPlayer = false;
  D.playerView.classList.replace('active-view','hidden-view');
  switchTab(currentTab || 'home');
}

function showMini() {
  if (!inPlayer && D.miniPlayer) {
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
    const realIdx = getSongIndex(song);
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
      const realIdx = getSongIndex(song);
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
  // Cap home shelf to 30 items for 60 FPS smooth horizontal scrolling
  const songs = playlist.filter(s => s.category === categoryFullName || (s.category && s.category.includes(badgeTag))).slice(0, 30);

  songs.forEach((song) => {
    const realIdx = getSongIndex(song);
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
    container.appendChild(card);
  });
}

// ─── Render Search Results ───────────────────────────────────────────────────
function renderSearchResults(query) {
  if (!D.searchResultsList) return;
  const q = (query || '').trim().toLowerCase();
  D.searchResultsList.innerHTML = '';

  if (D.searchResultsHeading) {
    D.searchResultsHeading.textContent = q ? `Search Results for "${query}"` : 'Top Trending Tracks';
  }
  if (D.mainSearchClear) {
    D.mainSearchClear.classList.toggle('hidden', !q);
  }

  const matches = q
    ? playlist.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)))
    : playlist.slice(0, 50);

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

  renderSongRowList(D.searchResultsList, matches);
}

// ─── Render Library View Songs ────────────────────────────────────────────────
function renderLibrarySongs(songs, filter) {
  if (!D.librarySongsList) return;
  D.librarySongsList.innerHTML = '';
  const safe = (songs || playlist).filter(Boolean);
  renderSongRowList(D.librarySongsList, safe);
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

  renderSongRowList(D.likedSongsList, likedArr);
}

// ─── Helper: Render Standard Song Rows with Virtual Infinite Batching ────────
function renderSongRowList(container, songs) {
  container.innerHTML = '';
  const batchSize = 40;
  let currentRenderedIndex = 0;

  function renderBatch() {
    const nextBatch = songs.slice(currentRenderedIndex, currentRenderedIndex + batchSize);
    nextBatch.forEach((song) => {
      const realIdx = getSongIndex(song);
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
        <button class="song-row-like-btn ${liked ? 'liked' : ''}" data-idx="${realIdx}" aria-label="Like">
          <svg viewBox="0 0 24 24" fill="${liked ? 'var(--accent)' : 'none'}" stroke="${liked ? 'var(--accent)' : 'currentColor'}" stroke-width="2" width="18" height="18">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      `;

      el.addEventListener('click', (e) => {
        if (e.target.closest('.song-row-like-btn')) return;
        playTrack(realIdx);
        openPlayer();
      });

      el.querySelector('.song-row-like-btn').addEventListener('click', (e) => {
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

      container.appendChild(el);
    });

    currentRenderedIndex += batchSize;

    // Attach sentinel for infinite scroll if more items remain
    if (currentRenderedIndex < songs.length) {
      const sentinel = document.createElement('div');
      sentinel.className = 'load-more-sentinel';
      sentinel.style.height = '40px';
      container.appendChild(sentinel);

      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          sentinel.remove();
          renderBatch();
        }
      }, { rootMargin: '200px' });

      observer.observe(sentinel);
    }
  }

  renderBatch();
}

// ─── Event Bindings ──────────────────────────────────────────────────────────
function bindAll() {
  if (D.themeToggleBtn) D.themeToggleBtn.addEventListener('click', toggleTheme);

  D.backBtn.addEventListener('click', closePlayer);
  D.playPauseBtn.addEventListener('click', togglePlay);
  D.prevBtn.addEventListener('click', prevTrack);
  D.nextBtn.addEventListener('click', nextTrack);

  // Pro Toolbar Controls
  if (D.sleepTimerBtn) D.sleepTimerBtn.addEventListener('click', toggleSleepTimer);
  if (D.eqPresetBtn)   D.eqPresetBtn.addEventListener('click', toggleEqualizer);
  if (D.shareSongBtn)  D.shareSongBtn.addEventListener('click', shareCurrentSong);

  D.shuffleBtn.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    D.shuffleBtn.classList.toggle('active', shuffleOn);
  });
  D.repeatBtn.addEventListener('click', () => {
    repeatOn = !repeatOn;
    D.repeatBtn.classList.toggle('active', repeatOn);
  });

  D.playerLikeBtn.addEventListener('click', () => {
    if (likedSet.has(currentIdx)) likedSet.delete(currentIdx);
    else likedSet.add(currentIdx);
    setLikeUI(likedSet.has(currentIdx));
    saveState();
    highlightRow();
    if (currentTab === 'liked') renderLikedSongs();
  });

  D.progressTrack.addEventListener('click', (e) => {
    if (!ytIsReady || !ytPlayer) return;
    const r = D.progressTrack.getBoundingClientRect();
    const targetSec = (ytPlayer.getDuration() || 0) * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    ytPlayer.seekTo(targetSec, true);
    savePlaybackTime(targetSec);
  });

  if (D.volSlider) D.volSlider.addEventListener('input', () => {
    if (ytIsReady && ytPlayer) ytPlayer.setVolume(+D.volSlider.value);
  });

  D.miniOpen.addEventListener('click', openPlayer);
  D.miniPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

  if (D.sdPlayBtn) D.sdPlayBtn.addEventListener('click', togglePlay);
  if (D.sdPrevBtn) D.sdPrevBtn.addEventListener('click', prevTrack);
  if (D.sdNextBtn) D.sdNextBtn.addEventListener('click', nextTrack);
  if (D.sdProgressTrack) D.sdProgressTrack.addEventListener('click', (e) => {
    if (!ytIsReady || !ytPlayer) return;
    const r = D.sdProgressTrack.getBoundingClientRect();
    const targetSec = (ytPlayer.getDuration() || 0) * Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    ytPlayer.seekTo(targetSec, true);
    savePlaybackTime(targetSec);
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

  // Dedicated Search View Input Listener (Debounced 150ms)
  if (D.mainSearchInput) {
    let searchDebounce = null;
    D.mainSearchInput.addEventListener('input', (e) => {
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderSearchResults(e.target.value);
      }, 150);
    });
  }
  if (D.mainSearchClear) {
    D.mainSearchClear.addEventListener('click', () => {
      if (D.mainSearchInput) D.mainSearchInput.value = '';
      renderSearchResults('');
    });
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
        const realIdx = getSongIndex(likedArr[0]);
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
      const realIdx = getSongIndex(song);
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
document.addEventListener('DOMContentLoaded', () => {
  rebuildSongIndexMap();
  grabDOM();
  initTheme();
  initPermissionsModal();
  initBoomerangBg();
  initHeroSwiper();
  restoreSavedState();
  updateTrackUI(playlist[currentIdx]);
  setPlayUI(false);

  if (initialSeek > 0) {
    if (D.timeCur) D.timeCur.textContent = fmt(initialSeek);
  }

  renderHomeSections();
  initYT();
  bindAll();
  switchTab('home');
});
