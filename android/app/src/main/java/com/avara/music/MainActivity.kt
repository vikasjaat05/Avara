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
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private val controller: MediaController?
        get() = if (controllerFuture?.isDone == true) controllerFuture?.get() else null

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d("Avara", "Notification permission granted")
        }
    }

    private val musicReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                MusicService.ACTION_NEXT -> {
                    runOnUiThread { webView.evaluateJavascript("window.playNextTrack?.()", null) }
                }
                MusicService.ACTION_PREVIOUS -> {
                    runOnUiThread { webView.evaluateJavascript("window.playPreviousTrack?.()", null) }
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // UI Config
        window.apply {
            clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            statusBarColor = Color.parseColor("#0E0A08")
            navigationBarColor = Color.parseColor("#0E0A08")
        }

        setContentView(R.layout.activity_main)

        setupWebView()
        checkNotificationPermission()
        promptBatteryOptimization()
        
        val filter = IntentFilter().apply {
            addAction(MusicService.ACTION_NEXT)
            addAction(MusicService.ACTION_PREVIOUS)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(musicReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(musicReceiver, filter)
        }
    }

    override fun onStart() {
        super.onStart()
        initializeController()
    }

    override fun onStop() {
        super.onStop()
        releaseController()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(musicReceiver)
    }

    private fun initializeController() {
        val sessionToken = SessionToken(this, ComponentName(this, MusicService::class.java))
        controllerFuture = MediaController.Builder(this, sessionToken).buildAsync()
        controllerFuture?.addListener({
            // Controller is ready
            setupPlayerListeners()
        }, MoreExecutors.directExecutor())
    }

    private fun releaseController() {
        controllerFuture?.let {
            MediaController.releaseFuture(it)
        }
    }

    private fun setupPlayerListeners() {
        controller?.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                if (isPlaying) {
                    runOnUiThread { webView.evaluateJavascript("window.onNativePlaybackStarted?.()", null) }
                } else {
                    runOnUiThread { webView.evaluateJavascript("window.onNativePlaybackPaused?.()", null) }
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = findViewById(R.id.webView)
        webView.apply {
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                userAgentString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
            
            addJavascriptInterface(AvaraWebAppInterface(), "AndroidBridge")
            
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }
            }
            webChromeClient = WebChromeClient()
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                } catch (e: Exception) {}
            }
        }
    }

    inner class AvaraWebAppInterface {
        @JavascriptInterface
        fun playSong(url: String, title: String, artist: String, artUrl: String) {
            runOnUiThread {
                val mediaMetadata = MediaMetadata.Builder()
                    .setTitle(title)
                    .setArtist(artist)
                    .setArtworkUri(Uri.parse(artUrl))
                    .build()

                val mediaItem = MediaItem.Builder()
                    .setUri(url)
                    .setMediaId(url)
                    .setMediaMetadata(mediaMetadata)
                    .build()

                controller?.run {
                    setMediaItem(mediaItem)
                    prepare()
                    play()
                }
            }
        }

        @JavascriptInterface
        fun pauseSong() {
            runOnUiThread { controller?.pause() }
        }

        @JavascriptInterface
        fun resumeSong() {
            runOnUiThread { controller?.play() }
        }

        @JavascriptInterface
        fun seekTo(positionMs: Long) {
            runOnUiThread { controller?.seekTo(positionMs) }
        }

        @JavascriptInterface
        fun setVolume(volume: Float) {
            runOnUiThread { controller?.volume = volume }
        }
        
        @JavascriptInterface
        fun nextSong() {
            runOnUiThread { webView.evaluateJavascript("window.playNextTrack?.()", null) }
        }

        @JavascriptInterface
        fun previousSong() {
            runOnUiThread { webView.evaluateJavascript("window.playPreviousTrack?.()", null) }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
