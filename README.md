# Ödeal POS Hızlı Kasa Uygulaması (React Native & Expo)

Ödeal fiziki POS makineleri ile **Device2Device (D2D)** sepet aktarım protokolü üzerinden haberleşen, minimalist ve tek sayfa tasarımlı mobil kasa uygulaması.

---

## 📱 Özellikler

1. **Tek Sayfa & Minimalist Deneyim:**
   - Kullanıcı yalnızca tahsil edilecek tutarı tuşlar.
   - Gerçekçi dokunmatik sayısal tuş takımı (Numpad) ve dokunsal geri bildirim (`expo-haptics`).
   - Türkiye para birimi formatlaması (`1.450,50 ₺`).

2. **Arka Planda Sabit Parametreler:**
   - **Ürün / Hizmet Adı** (Varsayılan: "Genel Satış")
   - **KDV Oranı** (Varsayılan: %20)
   - Ana ekranda küçük rozetler halinde gösterilir, dilediğiniz an sağ üstteki **Ayarlar** menüsünden güncellenebilir.

3. **Ödeal D2D (Device2Device) Resmi Entegrasyonu:**
   - `POST /api/v1/basket` servisine Ödeal standartlarında (`SIMPLE` basket) istek gönderir.
   - `X-ODEAL-MERCHANT-KEY` ve `X-ODEAL-SECRET-KEY` başlıkları.
   - POS makinesini uykudan uyandıran `externalDeviceKey` eşleşmesi.

4. **Simülasyon (Mock) Modu:**
   - İlk açılışta varsayılan olarak aktiftir.
   - Henüz fiziksel POS veya canlı API anahtarlarınız yoksa bile arayüzü, tuş takımını ve sipariş onay akışını 1.8 saniyelik gerçekçi gecikmeyle test etmenizi sağlar.

---

## 🛠️ Kurulum ve Çalıştırma

Projeyi çalıştırmak için bilgisayarınızda **Node.js** (LTS sürümü önerilir) kurulu olmalıdır.

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
```

### 2. Uygulamayı Başlatın:
```bash
npx expo start
```

- **Telefonda Test Etmek İçin:** Telefonunuza App Store veya Google Play'den **Expo Go** uygulamasını indirin ve terminalde çıkan QR kodu okutun.
- **Android Emülatör İçin:** Terminalde `a` tuşuna basın.
- **Web Tarayıcıda Görmek İçin:** Terminalde `w` tuşuna basın.

---

## 🔑 Ödeal POS Entegrasyon Bilgileri Nasıl Alınır?

1. **Ödeal Cihaz Kodu (`externalDeviceKey`):**
   - Ödeal POS makinenizi açın.
   - Cihazdaki Ödeal uygulamasında sol üst menüden **"Cihazlarım"** bölümüne girin.
   - Burada görüntülenen veya oluşturduğunuz cihaz kodunu uygulamamızdaki Ayarlar menüsüne yapıştırın.

2. **Merchant Key ve Secret Key:**
   - [Ödeal İşyeri Portalı](https://kurumsal.odeal.com)'na giriş yapın.
   - **Entegrasyon Bilgileri** sekmesinden `Merchant Key` ve `Secret Key` değerlerinizi kopyalayın.

3. **Ortam Seçimi:**
   - Test aşamasında Stage (`https://api.stg.odeal.com/api/v1`)
   - Gerçek tahsilatlarda Canlı (`https://odealapp.com/api/v1`)

---

## 📂 Proje Dizin Yapısı

```
posapp/
├── src/
│   ├── types/
│   │   └── odeal.ts              # Ödeal veri tipleri ve sepet modelleri
│   ├── services/
│   │   ├── odealService.ts       # Ödeal REST API & D2D entegrasyon servisi
│   │   └── storageService.ts     # AsyncStorage yerel ayar saklama
│   └── components/
│       ├── AmountDisplay.tsx     # Büyük tutar ekranı
│       ├── Numpad.tsx            # Sayısal dokunmatik tuş takımı
│       ├── InfoBadges.tsx        # Aktif ürün, KDV ve POS durumu rozetleri
│       ├── SettingsModal.tsx     # Ayarlar ve Ödeal parametre formu
│       └── ResultModal.tsx       # Satış sonucu onay ve detay penceresi
├── App.tsx                       # Ana ekran ve durum yönetimi
├── index.js                      # Expo başlangıç noktası
├── app.json                      # Expo yapılandırması
├── package.json                  # Proje bağımlılıkları
└── tsconfig.json                 # TypeScript yapılandırması
```
