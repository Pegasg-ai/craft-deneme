# 🚗 Araç Yönetim Sistemi

FiveM To yarış modu için kapsamlı araç yönetim sistemi.

## 📁 Dosya Yapısı

```
assets/vehicles/
├── vehicles.json          # Tüm araç tanımları
├── vehicles.schema.json   # JSON şeması (doğrulama için)
├── [arac_id].glb          # 3D araç modelleri
└── thumbnails/            # Önizleme resimleri (opsiyonel)
    └── [arac_id].png
```

## 🚀 Hızlı Başlangıç

### Yeni Araç Ekleme

1. **Kolay Yol (Otomatik):**
   ```bash
   # 1. .glb dosyasını assets/vehicles/ klasörüne at
   # 2. Script'i çalıştır:
   node scripts/generate-vehicles-json.js
   ```
   Script dosya adından kategori, yıl ve üretici tahmin edip JSON'a ekler.

2. **Manuel Yol:**
   `assets/vehicles/vehicles.json` içine entry ekle:
   ```json
   {
     "id": "arac_dosya_adi",
     "name": "Araç Görünen İsim",
     "year": 2024,
     "manufacturer": "Üretici",
     "category": "sport",
     "model": "arac_dosya_adi.glb",
     "color": "#3498DB",
     "stats": {
       "maxSpeed": 280,
       "acceleration": 35,
       "handling": 2.8
     },
     "enabled": true
   }
   ```

### Araç Devre Dışı Bırakma

JSON'da `"enabled": false` yap - araç oyunda görünmez ama tanım korunur.

## 📋 Kategoriler

| Kategori | Açıklama | Varsayılan Hız |
|----------|----------|----------------|
| `sport` | Spor arabalar | 250 km/h |
| `super` | Süper arabalar | 320 km/h |
| `suv` | SUV / 4x4 | 185 km/h |
| `offroad` | Arazi araçları | 200 km/h |
| `service` | Ticari araçlar | 160 km/h |
| `classic` | Klasik (1995 öncesi) | 220 km/h |
| `motorcycle` | Motosikletler | 280 km/h |

## 📊 İstatistikler

| Alan | Açıklama | Değer Aralığı |
|------|----------|---------------|
| `maxSpeed` | Maksimum hız (km/h) | 80 - 400 |
| `acceleration` | İvme gücü | 10 - 50 |
| `braking` | Fren gücü | 10 - 40 |
| `handling` | Yol tutuş | 1.0 - 4.0 |
| `mass` | Kütle (kg) | 150 - 6000 |

**Not:** Belirtilmeyen değerler kategori varsayılanlarından alınır.

## 🎨 Renk Formatları

```json
"color": "#FF5733"     // Hex
"color": "0xFF5733"    // JS hex
```

## 🛠️ Script Komutları

```bash
# Tüm .glb'leri tara, yenileri ekle
node scripts/generate-vehicles-json.js

# Mevcut araçları da güncelle
node scripts/generate-vehicles-json.js --force

# Sadece önizle (dosya yazma)
node scripts/generate-vehicles-json.js --dry-run
```

## 🔧 VehicleManager API

JavaScript'ten araç bilgilerine erişim:

```javascript
// Yükleme (otomatik yapılır)
await VehicleManager.load();

// Tek araç bilgisi
const vehicle = VehicleManager.getVehicle('opel_calibra');
console.log(vehicle.name, vehicle.maxSpeed);

// Kategorideki araçlar
const sportCars = VehicleManager.getVehiclesByCategory('sport');

// Tüm araçlar
const all = VehicleManager.getAllVehicles();

// Arama
const bmws = VehicleManager.searchVehicles('BMW');

// Rastgele araç
const random = VehicleManager.getRandomVehicle('super');

// Kategoriler
const categories = VehicleManager.getCategories();

// İstatistik yüzdesi (UI bar için)
const speedPercent = VehicleManager.getStatsAsPercent(vehicle, 'maxSpeed');

// Debug raporu
VehicleManager.printReport();
```

## 📐 3D Model Gereksinimleri

- **Format:** `.glb` (GLTF Binary)
- **Boyut:** Otomatik ölçeklenir (~4.5 birim uzunluk)
- **Yön:** -Z ileri (Three.js varsayılanı)
- **Merkez:** Model ortalanır, alt zemine hizalanır

### Önerilen Boyutlar
- Araba: 4-5m uzunluk
- Motosiklet: 2-2.5m uzunluk
- Kamyon: 6-8m uzunluk

## 🖼️ Thumbnail (Opsiyonel)

```
assets/vehicles/thumbnails/[arac_id].png
```
- Boyut: 256x256 veya 512x512 px
- Format: PNG (şeffaf arka plan önerilir)

## ❓ Sorun Giderme

### Model görünmüyor
1. Dosya adı ve JSON `id` eşleşiyor mu?
2. Dosya `.glb` uzantılı mı?
3. Konsolu kontrol et: `Model yükleniyor: ./assets/vehicles/xxx.glb`

### Araç listede yok
1. `"enabled": true` mi?
2. `VehicleManager.printReport()` çalıştır
3. `vehicles.json` geçerli JSON mı?

### İstatistikler yanlış
- `stats` içinde değer yoksa kategori varsayılanları kullanılır
- Değerleri açıkça belirt

## 📝 Örnek Tam Tanım

```json
{
  "id": "2024_lamborghini_revuelto",
  "name": "Lamborghini Revuelto",
  "year": 2024,
  "manufacturer": "Lamborghini",
  "category": "super",
  "model": "2024_lamborghini_revuelto.glb",
  "thumbnail": "thumbnails/2024_lamborghini_revuelto.png",
  "color": "#F39C12",
  "description": "V12 hibrit süper araba",
  "stats": {
    "maxSpeed": 350,
    "acceleration": 48,
    "braking": 32,
    "handling": 3.4,
    "mass": 1772
  },
  "wheels": {
    "count": 4,
    "radius": 0.38
  },
  "sounds": {
    "engine": "v12_hybrid.mp3",
    "horn": "lambo_horn.mp3"
  },
  "enabled": true
}
```
