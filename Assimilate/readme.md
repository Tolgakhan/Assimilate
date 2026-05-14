# 🔵 Assimilate

**Assimilate**, temel mekaniklerini *Katamari Damacy*'den alan, hızlı tempolu ve web tabanlı bir 2D hayatta kalma (bullet-hell) oyunudur. Oyuncular merkezdeki mavi çekirdeği kontrol eder ve üzerlerine gelen düşman dalgalarından kurtulmak için onlara çarpıp kendi kütlelerine katarak onları birer "et kalkanı" olarak kullanmak zorundadır.

Hiçbir eklenti veya kütüphane gerektirmeden doğrudan tarayıcı üzerinden oynanabilir.

## 📸 Ekran Görüntüleri

<img width="1865" height="942" alt="image" src="https://github.com/user-attachments/assets/c29ef17d-3062-40b7-8a53-25b0b33f821c" />

*Oyunun başlangıç menüsü*

<img width="1866" height="941" alt="ekran_goruntusu_2" src="https://github.com/user-attachments/assets/f56c90be-e056-45cf-9bc3-bee2785f2059" />

*Mermi cehennemi (bullet hell).*

## 🎮 Oynanış Mekanikleri

Sen bir Çekirdeksin. Ateş edemezsin. Tek savunman, düşmanlarını onlara karşı kullanmak.

* **Asimilasyon:** Standart düşmanlara ve keskin nişancılara çarparak onları çekirdeğine yapıştır. Etrafında dönmeye başlayarak sana gelen mermileri emen birer kalkana dönüşecekler.
* **Taktiksel Hareket:** Standart WASD kontrolleri ile mermi cehennemi senaryolarında keskin ve hassas manevralar yap.
* **Artan Zorluk:** Hayatta kaldığın süre boyunca oyun zorlaşır. Sistem her 20 saniyede bir düşman doğma oranını artırır ve sahaya daha ölümcül yeni düşman tipleri sürer.
* **Kalkan Yönetimi:** Düşman mermileri asimile ettiğin kalkanlardan birine çarptığında o kalkan yok olur. Hayatta kalmak için sürekli hareket et ve yeni kalkanlar toplamaya devam et!

## 👾 Düşman Tipleri

1. **Standart (Kırmızı):** Oyuncuyu takip eder ve orta hızda mermi ateşler.
2. **Keskin Nişancı / Sniper (Mor):** Çok yavaş hareket eder ancak seri atış (rapid-fire) mekaniğine sahiptir, oyuncuyu sürekli hareket halinde kalmaya zorlar.
3. **Kamikaze (Turuncu):** Çok hızlıdır. Ateş etmez ancak oyuncuya veya kalkanlara çarptığında patlar (yakındaki kalkanları da yok eder). **Dikkat:** Kamikazeler arena duvarlarından tam 3 kez sekerse de patlar, bu yüzden arenada öngörülemeyen alan hasarı (AoE) tehlikeleri yaratırlar!

## 🛠️ Teknik Detaylar

Bu proje hiçbir harici oyun motoru veya ağır kütüphane kullanılmadan, tamamen "vanilla" web teknolojileri ile geliştirilmiştir.

* **Görüntü İşleme (Rendering):** Oyuncu, düşmanlar, mermiler ve özel parçacık patlama efektlerinin çizimi için HTML5 `<canvas>` API'si kullanılmıştır.
* **Ses Sistemi:** **Web Audio API** kullanan özel ses motoru. Dışarıdan yüklenen ses dosyaları (MP3/WAV vb.) yerine; lazer, çarpışma ve oyun bitiş sesleri eş zamanlı olarak tarayıcı osilatörleri (`sine`, `square`, `sawtooth`, `triangle`) ile üretilir.
* **Çarpışma Tespiti:** Çekirdek, kalkanlar ve mermiler arasındaki hassas temas kutuları (hitbox) için Pisagor teoremi tabanlı 2D dairesel çarpışma kontrolleri kullanılmıştır.

## 🚀 Nasıl Çalıştırılır

Oyun tamamen istemci tarafında (client-side) çalıştığı için kurulumu inanılmaz derecede basittir:

1. Bu depoyu (repository) bilgisayarınıza klonlayın veya ZIP olarak indirin.
2. `index.html` dosyasını herhangi bir modern web tarayıcısında (Chrome, Firefox, Edge, Safari) açın.
3. **"Oyuna Başla"** butonuna tıklayın ve hayatta kalmaya çalışın!

## ⌨️ Kontroller

* **W:** Yukarı
* **A:** Sola
* **S:** Aşağı
* **D:** Sağa

---
*JavaScript, HTML ve CSS ile geliştirilmiştir.*
