# Asisten Sidang Tesis Urban Patchwork — versi gratis

## Apa yang tersedia
- Mode **Live Otomatis**: ucapan yang dikenali browser langsung ditelusuri ke basis pengetahuan tesis.
- Mode **Semi-Otomatis**: ucapan masuk ke kotak teks agar dapat diperiksa/diedit sebelum pencarian.
- Pertanyaan manual tetap dapat diketik.
- Basis pengetahuan diekstrak dari draft tesis `261010 #5 Draft Tesis (JUDUL BARU).docx` yang tersedia pada percakapan, terdiri dari paragraf dan isi tabel.
- Tidak memerlukan API key, server, database, atau layanan berbayar.

## Batasan penting
Ini **bukan model AI generatif**. Karena syaratnya harus sepenuhnya gratis dan tanpa API, aplikasi melakukan pencarian berbasis kata kunci dan menampilkan bagian tesis yang paling relevan. Ia tidak dapat menyusun jawaban baru setara ChatGPT, melakukan penalaran bebas, atau menjamin bahwa cuplikan teratas sudah menjawab pertanyaan secara lengkap. Jangan membaca hasil mentah sebagai jawaban final; gunakan sebagai pengingat sumber dan susun jawaban dengan pemahaman sendiri.

Speech Recognition menggunakan kemampuan browser. Chrome/Edge desktop direkomendasikan. Dukungan Safari/iPhone tidak konsisten. Browser dapat memproses pengenalan suara melalui layanan penyedia browser; aplikasi ini sendiri tidak menyimpan atau mengunggah audio. Selalu sampaikan bahwa mikrofon sedang digunakan dan dapat dihentikan kapan saja.

## Cara memasang ke GitHub Pages
1. Buka repository `urban-patchwork-recorder` di GitHub.
2. Buka **Add file → Create new file** atau **Upload files**.
3. Buat folder `asisten-ai` dengan mengunggah seluruh isi folder `asisten-ai` dari paket ini. Struktur harus seperti berikut:

```
asisten-ai/
  index.html
  app.js
  style.css
  data/
    knowledge-base.json
```

4. Commit perubahan ke branch `main`.
5. Pastikan Settings → Pages tetap menggunakan **Deploy from a branch**, branch `main`, folder `/(root)`.
6. Tunggu GitHub Pages selesai menerbitkan. Buka:

`https://mzddin.github.io/urban-patchwork-recorder/asisten-ai/`

7. Uji dari Chrome/Edge desktop, izinkan mikrofon saat diminta, lalu coba pertanyaan manual terlebih dahulu.

## Menghubungkan dari portal utama
Tambahkan tautan/menu ke URL di atas pada halaman portal utama. Jangan menghapus atau mengganti file portal utama yang sudah ada.

## Privasi dan keamanan
- Tidak ada API key atau rahasia di frontend.
- Tidak ada backend dan tidak ada database.
- Teks pertanyaan diproses di browser dan dicocokkan dengan file JSON yang ikut dipublikasikan di repository.
- Repository GitHub Pages bersifat publik jika repository publik. Jangan menaruh data pribadi, rekaman sidang, atau dokumen rahasia di folder publik.
- Jika nanti ingin jawaban generatif, diperlukan model yang dijalankan lokal pada perangkat atau layanan model eksternal. Layanan eksternal umumnya memiliki batas gratis/biaya dan bukan jaminan gratis permanen.
