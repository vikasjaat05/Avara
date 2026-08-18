package com.avara.music

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.support.v4.media.session.MediaSessionCompat
import androidx.core.app.NotificationCompat

class MusicService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null
    private var silentTrack: AudioTrack? = null
    private var mediaSession: MediaSessionCompat? = null
    private val CHANNEL_ID = "AvaraMusicChannel"
    private val NOTIFICATION_ID = 101

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        
        // 1. Acquire WakeLock to keep CPU running
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Avara::MusicWakeLock")
        wakeLock?.acquire(24 * 60 * 60 * 1000L /* 24 hours */)

        // 2. Start Silent Audio to keep OS from killing the process
        startSilentPlayback()

        // 3. Setup MediaSession to register as a legitimate media player
        mediaSession = MediaSessionCompat(this, "AvaraMusicSession").apply {
            isActive = true
        }
    }

    private fun startSilentPlayback() {
        try {
            val bufferSize = AudioTrack.getMinBufferSize(44100, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
            silentTrack = AudioTrack(
                AudioManager.STREAM_MUSIC,
                44100,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize,
                AudioTrack.MODE_STREAM
            )
            val silence = ShortArray(bufferSize)
            silentTrack?.play()
            
            // Write silence in a background thread
            Thread {
                while (silentTrack != null) {
                    try {
                        silentTrack?.write(silence, 0, silence.size)
                        Thread.sleep(1000)
                    } catch (e: Exception) { break }
                }
            }.start()
        } catch (e: Exception) {}
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        return START_STICKY
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) 
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT 
            else PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AVARA Music")
            .setContentText("🎧 Sangeet chal raha hai...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setStyle(androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession?.sessionToken))
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Avara Music Service Channel",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps music playing in background"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            silentTrack?.stop()
            silentTrack?.release()
            silentTrack = null
            mediaSession?.release()
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (e: Exception) {}
    }
}
