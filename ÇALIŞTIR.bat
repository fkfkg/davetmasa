@echo off
chcp 65001 >nul
color 0A
title DavetMasa Web Sunucusu

echo =======================================================
echo          DAVETMASA WEB SUNUCUSU BAŞLATILIYOR
echo =======================================================
echo.
echo ⚠️ DİKKAT: SİSTEMDE LİSANS KEY ZORUNLULUĞU AKTİFTİR ⚠️
echo - Uygulamayı kullanabilmek için geçerli bir lisans gereklidir.
echo - Lisans anahtarı üretmek için 'dist\AdminKeygen.exe' aracını kullanın.
echo - Lisans ekranı açıldığında AdminKeygen'den ürettiğiniz anahtarı girin.
echo.
echo Tarayıcı birazdan otomatik açılacak... 
echo Eğer açılmazsa Chrome'a girip şu adresi yazabilirsiniz:
echo http://localhost:3000
echo.
echo Sunucuyu kapatmak için bu pencereyi (X) işaretinden kapatabilirsiniz.
echo =======================================================
echo.

:: Tarayıcıyı aç (3 saniye gecikmeli ki sunucu ayağa kalksın)
start "" "http://localhost:3000"

:: Next.js sunucusunu çalıştır
call npm run dev

echo.
echo Bir hata oluştu veya sunucu durduruldu! Lütfen üstteki hata mesajlarını okuyun.
pause
