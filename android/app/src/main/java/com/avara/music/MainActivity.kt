package com.avara.music

import android.Manifest
import android.annotation.SuppressLint
import android.content.*
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var controllerFuture: ListenableFuture<MediaController>? = null

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (!isGranted) Toast.makeText(this, "Please allow notifications for background music", Toast.LENGTH_LONG).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            statusBarColor = Color.parseColor("#0E0A08")
            navigationBarColor = Color.parseColor("#0E0A08")
        }
        setContentView(R.layout.activity_main)

        setupWebView()
        checkNotificationPermission()
        promptBatteryOptimization()
    }

    override fun onStart() {
        super.onStart()
        val sessionToken = SessionToken(this, ComponentName(this, MusicService::class.java))
        controllerFuture = MediaController.Builder(this, sessionToken).buildAsync()
    }

    override fun onStop() {
        super.onStop()
        controllerFuture?.let { MediaController.releaseFuture(it) }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = findViewById(R.id.webView)
        webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                userAgentString = "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
            }
            addJavascriptInterface(AvaraWebAppInterface(), "AndroidBridge")
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    view?.evaluateJavascript(getJsBridge(), null)
                }
            }
            loadUrl("https://avara-ashiq.vercel.app/")
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    @SuppressLint("BatteryLife")
    private fun promptBatteryOptimization() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !pm.isIgnoringBatteryOptimizations(packageName)) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } catch (e: Exception) {}
        }
    }

    inner class AvaraWebAppInterface {
        @JavascriptInterface
        fun playSong(url: String, title: String, artist: String, artUrl: String) {
            runOnUiThread {
                Log.d("AvaraBridge", "Playing: $title URL: $url")
                val intent = Intent(this@MainActivity, MusicService::class.java).apply {
                    action = MusicService.ACTION_PLAY
                    putExtra("url", url)
                    putExtra("title", title)
                    putExtra("artist", artist)
                    putExtra("artUrl", artUrl)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent)
                } else {
                    startService(intent)
                }
            }
        }

        @JavascriptInterface
        fun pauseSong() {
            runOnUiThread { 
                val intent = Intent(this@MainActivity, MusicService::class.java).apply {
                    action = "com.avara.music.PAUSE"
                }
                startService(intent)
            }
        }
    }

    private fun getJsBridge(): String {
        return """
            (function() {
                if (window.AvaraBridgeLoaded) return;
                window.AvaraBridgeLoaded = true;

                console.log('Avara Bridge Injection Started');

                function syncToNative(url, title, artist, art) {
                    if (!url || !url.startsWith('http')) return;
                    if (window.lastUrl === url) return;
                    window.lastUrl = url;
                    
                    console.log('Syncing to Native:', title);
                    window.AndroidBridge.playSong(url, title, artist, art);
                }

                // Intercept ANY Audio object creation and src setting
                const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
                
                Object.defineProperty(HTMLAudioElement.prototype, 'src', {
                    set: function(val) {
                        console.log('Audio src set detected:', val);
                        const title = document.getElementById('player-title')?.innerText || 'Avara Music';
                        const artist = document.getElementById('player-artist')?.innerText || 'Avara';
                        const artUrl = document.getElementById('player-art')?.src || '';
                        
                        syncToNative(val, title, artist, artUrl);
                        
                        // Mute the web audio so only native plays
                        this.muted = true;
                        this.volume = 0;
                        originalSrcDescriptor.set.call(this, val);
                    },
                    get: function() {
                        return originalSrcDescriptor.get.call(this);
                    }
                });

                // Periodic check for active audio
                setInterval(function() {
                    const audios = document.querySelectorAll('audio');
                    audios.forEach(audio => {
                        if (!audio.paused && !audio.muted) {
                            const title = document.getElementById('player-title')?.innerText || 'Avara Music';
                            const artist = document.getElementById('player-artist')?.innerText || 'Avara';
                            const artUrl = document.getElementById('player-art')?.src || '';
                            syncToNative(audio.src, title, artist, artUrl);
                            audio.muted = true;
                        }
                    });
                }, 2000);

            })();
        """.trimIndent()
    }
}
