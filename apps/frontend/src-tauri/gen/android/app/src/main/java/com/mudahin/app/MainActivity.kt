package com.mudahin.app

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.enableEdgeToEdge

/**
 * Activity utama — disiapkan untuk layar berponi (notch / punch-hole).
 *
 * `enableEdgeToEdge()` membuat aplikasi menggambar sampai tepi layar sehingga
 * area status bar, gesture bar, dan cutout menjadi bagian dari viewport. UI web
 * kemudian menahan kontennya sendiri lewat `env(safe-area-inset-*)`
 * (lihat `--safe-top` / `--safe-bottom` di `src/index.css`).
 */
class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Izinkan konten masuk ke area cutout; tanpa ini, beberapa perangkat
        // (Android 9–14) menaruh bilah hitam di sekitar kamera depan.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }
}
