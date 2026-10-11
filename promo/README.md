# Lisandan Kültüre — Tanıtım Filmi (motion graphic)

3:12 süreli (v11), **3840×2160 (4K UHD), 60 fps**, müzikli tanıtım filmi (yalnızca iki kısa gerçek anlatım kesiti).
Final dosya: `out/lisandan-kulture-v11-4k.mp4` (H.264 High + AAC 48 kHz). v11 = v8 filmi aynen + araya eklenen 10 özellik
sahnesi ve baştan yazılmış müzik (aşağıda "v10" ve "v11").

Film tamamen kodla üretilir: `index.html` + `film.css` + `film.js` deterministik bir zaman çizelgesidir
(`window.__seek(t)` → t anının tam karesi). 1920×1080 CSS kompozisyonu **device scale factor 2** ile
rasterize edilir; metin, SVG ve UI gerçek 4K çözünürlükte çizilir (upscale yok). Görseller orijinal
çözünürlüklerinden (Adam B1 bölümleri 3200×4000) dışa aktarılmıştır.

Sahneler kendi saatleriyle koreografe edilir; `scene(..., warp)` ile film zamanına eşlenir. Böylece v2'deki
sahneler koreografisi bozulmadan yavaşlatıldı, araya yeni sahneler eklendi.

## Zaman çizelgesi (90 BPM; kesmeler vuruşlarda)

| Sahne | Süre | İçerik |
|-------|------|--------|
| Hook | 0.0–4.7 | Yıldız, logo kemeri, 5 kitabın illüstrasyonları arasında uçuş: **Oku. Dinle. Anla.** |
| Hikâye sayfası | 4.7–10.7 | Adam B1 · 1. bölüm: sayfa 3B'de kurulur; sesli anlatım, keşif noktası (Soil), Word Notes etiketleri. |
| Word Notes | 10.7–15.3 | "Messenger" sayfadan kopar → Word Note kartı (anlam + Arapça). Bölüm 1'in 4 kelimesi. |
| EN ⇄ AR | 15.3–20.7 | Gerçek dil anahtarı; RTL ışık dikişi sayfayı ayna düzenli Arapça sürüme çevirir; «قصص تُقرأ، وتُسمع، وتُعاش.» |
| Bölüm döngüsü | 20.7–29.3 | Akış göstergesi **Hikâye → Quick Challenge → Language Focus**. Quick Challenge çözülür; "After reading" Language Focus'un 4 gerçek etkinliği; 1. etkinlik (Source Voice and Story Time) eşleştirilir. Ardından 12 bölümün rayı: her bölümde aynı döngü. |
| Kitap sonu | 29.3–42.7 | Kemer kapısından geçiş; üstte gerçek sırayla ilerleyen çubuk: **Knowledge Check → Master Glossary → Vocabulary Challenge → Language Review → Final Challenge**. Master Glossary'de kitabın 48 kelimesinin tamamı, öz-değerlendirme (Confident / Practice / New) ve güven haritası. |
| Seviyeler | 42.7–48.7 | Mecca Before Islam: **A2 — Temel, B1 — Orta, B2 — Üst**; üç ayrı illüstrasyon dünyası ve her seviyeden aynı konudaki gerçek cümle. |
| Kılavuzlar | 48.7–54.7 | Işık dikişinden açılan kitap: **Öğretmen Kılavuzu** (16 bölüm) · **Evde Bağımsız Çalışma Kılavuzu** (12 bölüm, 60 etkinlik). |
| Final | 54.7–60.0 | Kütüphane duvarı, logo, **Lisandan Kültüre**, "Etkileşimli Dil ve Değerler Kütüphanesi", English · العربية · A2 · B1 · B2. |

### Doğrulanan öğrenme akışı (kaynak kod)

- Bölüm içi: `src/components/book/StoryPage.tsx` hikâye metninden sonra önce **Quick Challenge** panelini,
  ardından "After reading" **Language Focus** panelini gösterir; Self-Study Guide ders planları da aynı sırayı önerir.
- Kitap sonu: `src/core/content/uiBookFinalization.ts` → `reorderPreparedLearningFlow` sırası
  `knowledge → glossaries → vocabulary → review → final`. Uygulamadaki içindekiler: 13 Knowledge Check,
  14 Master Glossary, 15 Vocabulary Challenge, 16 Language Review ("After vocabulary"), 17 Final Challenge.

## Ses

Konuşma / TTS yok. `scripts/build_audio.py` özgün, prosedürel bir müzik besteler (hazır sample yok → lisans
sorunu yok): pad, yaylı ensemble, piyano motifi, kalimba arpeji, bas, sinematik davul; bölümler filmi izler
(sakin hikâye → bölüm döngüsü → kitap sonunda doruk → seviyelerde nefes → kılavuzlarda yükseliş → D majörde
final). Üzerine ince ses tasarımı: geçiş whoosh'ları, UI tıkları, doğru cevap çanı, riser ve final darbesi.
Master: -14 LUFS, -1.2 dBTP.

## Kullanılan gerçek proje assetleri

- Logo (`home_icon.png`) → `assets/brand/`
- Hikâye illüstrasyonları (Adam, Abraham, Moses, Mecca, Yunus Emre; A2/B1/B2) → `assets/img/`,
  Adam B1'in 12 bölüm görseli → `assets/img/adam_b1/`, duvar → `assets/img/wall/`
- Adam B1: 1. bölüm İngilizce/Arapça metin, Word Notes, hotspot'lar, Quick Challenge, Language Focus
  etkinlikleri, 12 bölüm başlığı, Knowledge Check soruları, Master Glossary'nin 48 kelimesi (tanım, tür,
  bölüm, kategori), Vocabulary Challenge ve Language Review ekran içerikleri, Final Challenge ekranı
- Mecca A2/B1/B2 "Age of Ignorance" cümleleri
- Teacher Guide ve Self-Study Guide başlıkları/bölüm listeleri
- Fontlar: Poppins (OFL, uygulamanın fontu), Arakom (`public/`); renkler `src/index.css` tokenlarından

## Üretim komutları

```bash
pip install playwright imageio-ffmpeg numpy scipy soundfile
# Chromium: PLAYWRIGHT_BROWSERS_PATH altında ya da --chrome /yol/chrome

python3 promo/scripts/build_audio.py                        # → promo/out/mix.wav (+ stems)
python3 promo/scripts/render.py --workers 4 --crf 14 --out promo/out/master-4k.mp4   # 4K60 master
python3 promo/scripts/render.py --stills 12 33.8 57         # 4K tek kareler → promo/out/stills/
python3 promo/scripts/render.py --scale 1 --workers 4 --out promo/out/preview-1080.mp4  # hızlı 1080p önizleme
```

Önizleme: `promo/` klasörünü bir HTTP sunucusuyla açıp `index.html` (gerçek zamanlı döngü) veya
`index.html?t=33.8` (tek kare) adresine gidin.


## v8 — Arapça keşif noktaları ve gerçek anlatım

- **EN ⇄ AR sahnesi** (≈37.2–46.7 sn): dil Arapçaya geçtikten sonra kamera bölüm illüstrasyonuna yaklaşır; iki keşif
  noktasına dokunulur ve Arapça kartlar açılır — «التراب» ve «المسؤولية في الأرض» (metinler
  `src/data/adam/b1/ar/pages.ts` 1. bölüm hotspot'larından, değiştirilmeden). Film bu vuruş için bir ölçü (4 vuruş,
  2.667 sn) uzadı: toplam **1:41**.
- **Sesli anlatım**: uygulamanın kendi 1. bölüm kayıtlarından iki kısa kesit — hikâye sayfasında oynat tuşuna
  basılınca İngilizce "Adam (pbuh) is the first Messenger and the father of all humans." (≈24.3 sn), Arapçaya
  geçince «آدم (عليه السلام) هو أول رسول وأبو البشر جميعا» (≈39.8 sn; Arapça oynatıcı da ilerler). Anlatım
  sırasında müzik alçalır. Kesitler: `assets/audio/narration_{en,ar}_ch1.wav`.
- **Müzik**: ilk (prosedürel) müzik. Yeni ölçü için Gm9 ölçüsü (vuruş 59–63) bir kez tekrarlanır; sonraki bütün
  bölümler kesmelere aynen oturur.

Teslim dosyası (YouTube 4K için yüksek bitrate H.264, ~80 Mbps): yalnızca değişen aralık yeniden çizilir, geri
kalan kareler önceki master'dan yeniden sıkıştırılmadan kopyalanır:

```bash
python3 promo/scripts/build_audio.py                       # müzik + efekt + anlatım → out/mix.wav
# yeni film 39.75 → 50.733 sn (kareler 2385–3044) 4K kayıpsız çizilir (promo/out/v8/run.sh)
python3 promo/scripts/splice_copy.py --master promo/out/master-4k-v2.mp4 \
    --patch promo/out/v8/r_0.mkv promo/out/v8/r_1.mkv promo/out/v8/r_2.mkv promo/out/v8/r_3.mkv \
    --from 39.75 --old-to 48.066667 --out promo/out/lisandan-kulture-4k.mp4
```


## v10 — v8 aynen, araya 7 yeni özellik sahnesi (4 Ekim 2026)

Kural (proje sahibi): önceki film (v8) temel alınır, içindeki hiçbir sahne, tempo, giriş ve kapanış değişmez;
yeni özellikler yalnızca sahnelerin arasına, aynı sakin tempoda eklenir. Reddedilen v9 (commit 70a26d8) kullanılmaz.

- **Nasıl:** `timeline.json → inserts` yedi ekleme noktası verir. `film.js` içindeki `mapTime` film zamanını v8 zamanına
  çevirir: ekleme sahnesi yarım saniyede (insertFade) v8'in üstüne açılır, v8 o karede bekler, sahne biter, aynı kareden
  v8 devam eder. Aynı noktadaki eklemeler birbirine geçer. v8'in kendi sahne kodu değişmedi.
- **Müzik:** `build_audio.py → splice_inserts` müziği ekleme noktasından önceki tam ölçülerle uzatır (her ekleme tam ölçü:
  8 sn = 3 ölçü, 10.67 sn = 4 ölçü), böylece v8'in bütün kesmeleri yine vuruşa düşer. Efektler eklemenin altında söner,
  ekleme sahnelerinin dokunuşlarına küçük tık sesleri gelir.
- **Ekran görüntüleri:** `assets/img/app/*.jpg`, çalışan uygulamadan 2× (3840×2160) alındı.

| Ekleme | v8 noktası | Süre | Ekranda | Yazı |
|---|---|---|---|---|
| n1 · Üç yol | 23.30 (hook → hikâye) | 8 sn | Student / Teacher / On my own, yalnız simge ve isim; Student seçilir | Herkes için bir yol. |
| n2 · Before you read | 31.35 (hikâye → Word Notes) | 8 sn | Adam B1 1. bölüm: soil seçilir, Check my guess, Your guess was right! | Okumadan önce tahmin et. |
| n3 · I can + grup görevi | 62.62 (bölüm döngüsü → kitap sonu) | 10.67 sn | I can: Yes, Yes, Almost; History Radio Show: roller, 4. adım | Ne öğrendiğini kendin gör. · Grupla, rollerle konuş. |
| n4 · Sonuç kartı | 81.25 (kitap sonu → seviyeler) | 8 sn | Result card, kod 2ENLRSSA, Check a result code | Sonucunu öğretmenine göster. |
| n5 · Kendi başına | 88.30 (seviyeler → kılavuzlar) | 8 sn | Seviye testi B1, My words kartı | Kendi hızında öğren. |
| n6 · Öğretmen | 88.30 | 10.67 sn | Lesson card (40 dk), Class mode açılır, Show the answer | Derse hazır, tahtaya hazır. |
| n7 · Yerler ve haritalar | 88.30 | 8 sn | Moses A2 Places &amp; People (Midian), Moses’s Journey (Midian) | Hikâyenin geçtiği yerleri keşfet. |

v8 içindeki küçük düzeltmeler (planda onaylı): Arapça anlatım uygulamanın şimdiki kadın sesi (`narration_ar_ch1.wav`,
Adam B1 1. bölüm, 2.26–7.30 sn); Arapça sayfa metni ve Word Note «نبي» ile hikâye metniyle aynı; Word Notes kartında
"Save to My words"; İngilizce metinde güncel yazımlar (Hijr, Sad, khalifah); kılavuzdaki "✦ Lesson Prep" yerine pano simgesi.

```bash
python3 promo/scripts/build_audio.py
python3 promo/scripts/render.py --workers 3 --crf 14 --out promo/out/lisandan-kulture-v10-4k.mp4
```

## v11 — sıra, I can, offline, PDF, yeni müzik (4 Ekim 2026)

Proje sahibinin v10 notları üzerine:

- **Before you read** okumadan önceye taşındı: artık "Üç yol" sahnesinin hemen ardından gelir (v8 23.30), hikâye sayfası
  ve Messenger kelimesi onu izler. v8'in 31.35 noktasında ekleme yok.
- **I can** kendi sahnesi oldu (n3, 10.67 sn): kart uygulamadan 4× alındı ve ekranı dolduracak büyüklükte; her satır
  cevaplanırken altın çerçeveyle vurgulanır. Grup görevi ayrı sahne (n3g, 8 sn).
- **Derse hazır, tahtaya hazır.** sol tarafta, dikey ortada, iki satır. Lesson card ve Class mode sağda pencerede.
- **Yeni sahneler:** n8 *Save this book offline* (menü: Saving… → Saved for offline; sonra Storage kapalıyken açılan
  sayfa, resim kaydedilen kopyadan gelir) · "İnternet olmadan da oku, dinle." n9 *Printable PDFs* (menü → Story book (PDF);
  kitabın üç gerçek PDF'i, `public/pdfs/books/adam-b1-en-*.pdf`, kapaktan iç sayfaya açılır) · "İndir, yazdır, sınıfa götür."
- **Harita** görüntüleri güncel uygulamadan (yuvarlak hale, resimli iğneler; eski yıldız odak yok).
- **Müzik** baştan yazıldı (`build_audio.py → SECTIONS`, film zamanında, döngü/tekrar yok): girişte ney + ud (D Hicaz),
  özelliklerde darbuka (maksum) + yay ostinatoları; grup görevinde yarım tempo, kitap sonunda çift tempo zirve, sonuç
  kartında sakin ara, offline sahnesinde boğuk açılış, PDF ve kılavuzlarda trampet crescendosu, finalde D majörde çözülme.

| Ekleme | v8 noktası | Süre | Yazı |
|---|---|---|---|
| n1 · Üç yol | 23.30 | 8 sn | Herkes için bir yol. |
| n2 · Before you read | 23.30 (n1'in ardından) | 8 sn | Okumadan önce tahmin et. |
| n3 · I can | 62.62 | 10.67 sn | Ne öğrendiğini kendin gör. |
| n3g · Grup görevi | 62.62 | 8 sn | Grupla, rollerle konuş. |
| n4 · Sonuç kartı | 81.25 | 8 sn | Sonucunu öğretmenine göster. |
| n5 · Kendi başına | 88.30 | 8 sn | Kendi hızında öğren. |
| n6 · Öğretmen | 88.30 | 10.67 sn | Derse hazır, tahtaya hazır. |
| n7 · Yerler ve haritalar | 88.30 | 8 sn | Hikâyenin geçtiği yerleri keşfet. |
| n8 · Offline | 88.30 | 10.67 sn | İnternet olmadan da oku, dinle. |
| n9 · PDF | 88.30 | 10.67 sn | İndir, yazdır, sınıfa götür. |

```bash
python3 promo/scripts/build_audio.py
python3 promo/scripts/render.py --workers 3 --crf 14 --out promo/out/lisandan-kulture-v11-4k.mp4
```

## v11.1 (6 Ekim 2026)

- Girişteki "Oku. Dinle. Anla." ışığı artık yuvarlak, yumuşak bir ışık topu (`.star .orb`). Dört köşeli parlama
  Gemini simgesine benzediği için kaldırıldı. Uygulama logosu sonda aynen duruyor.
- Ekleme sahnelerinin İngilizce üst başlıkları `lang="en"`: büyük harfe çevrilince "OFFLİNE", "PRİNTABLE" gibi Türkçe
  İ çıkmıyor.
- Yalnız değişen saniyeler yeniden çizildi (18.6–20.2 ve 157.0–179.0); kalan kareler v11 4K dosyasından alındı.

## v11.3

- Finale: the half-second four-pointed flare over the logo is now the same soft round orb as the opener (`#s8flare .orb`), and the logo is the new one with a round light in the centre (`assets/brand/home_icon.png`, 6b1ef64).
- v11.2 (same day) only re-rendered the opener frames around 20.2 s where the old sparkle still faded out.

## v12 (11 Ekim 2026)

Selma Hoca ve proje sahibinin notları üzerine, yalnız üç yer değişti; süre, müzik ve diğer sahneler aynı:

- **Açılış:** "Dil öğrenirken tarihini ve medeniyetini de keşfet." cümlesi artık filmin ilk saniyesinde tek parça görünür
  ve yolculuk boyunca üstte kalır (46 / 74 px), sonra eskisi gibi ortaya gelir. Kartlar yolculukta %16 küçük ve 90 px
  aşağıda (`JS`, `JY`), böylece cümleyle çakışmaz; finaldeki yay düzeni değişmedi.
- **Bölüm döngüsü:** "Her bölüm. Kendi hikâyesi. Kendi alıştırmaları." → "Her bölümün / kendi hikâyesi, / kendi alıştırmaları var."
- **Kılavuzlar sahnesi** uygulamanın bugünkü hâlinden kuruldu (Adam B1): başlık *Prophet Adam*, alt yazılar, Lesson Prep + PDF
  düğmeleri, Guide map / Your progress kartları, Self-Study Guide'ın yeni bölüm listesi (One Chapter per Session …
  At the End of the Book), "You are here / Current section" başlıkları ve **uygulamanın kendi ikonları** (önceden boş
  kutucuktu). Uzun adlar ("Classroom Management") uygulamadaki gibi iki satıra iner, kenardan taşmaz. Alt yazı:
  **Öğretmen Kitabı** (uygulamada Teacher's Book); öğrenci tarafı uygulamadaki gibi Self-Study Guide → "Evde Bağımsız Çalışma Kılavuzu".

Önceki 4K master bu ortamda olmadığı için film baştan çizildi (`out/v12/run.sh`: 12 parça, 3 Chromium, sonra tek kodlama).

Önceki 4K master elindeyse yalnız değişen aralıklar çizilir (v12'de süre değişmedi; kesimler master'ın anahtar karelerine
genişletilir, geri kalan kareler yeniden sıkıştırılmadan kopyalanır):

```bash
python3 promo/scripts/build_audio.py
python3 promo/scripts/splice_spans.py --master <v11.3 4K mp4> --spans 0:19 72.8:78.7 130.4:131.0 178.9:186.1 \
    --workers 3 --out promo/out/lisandan-kulture-v12-4k.mp4
```
