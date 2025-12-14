# Voxel Velocity - Geliştirici Notları

## Proje Yapısı
Kod karmaşasını önlemek ve yönetimi kolaylaştırmak için proje modüler hale getirildi:

- **index.html**: Ana oyun döngüsü, başlatma (init) ve temel olay dinleyicileri (klavye/mouse).
- **js/vehicle.js**: Araç oluşturma, fizik, sürüş ve koltuk mantığı.
- **js/inventory.js**: Envanter sistemi, UI çizimi ve slot yönetimi.

## Envanter Sistemi
- **Tuş:** `I` tuşu ile envanter açılıp kapanır.
- **Hotbar:** 1-9 tuşları ile hotbar slotları seçilir.
- **Kullanım:** Envanter açıkken bir eşyaya tıklayıp başka bir slota tıklayarak yer değiştirebilirsiniz (Swap).
- **Blok Koyma:** Sağ tık ile seçili hotbar slotundaki bloğu koyarsınız.
- **Blok Seçme (Pick Block):** Orta tık (Tekerlek) ile dünyadaki bloğu hotbara alırsınız.

## Araç Sistemi
- **Binme:** Araca bakıp `E` tuşuna basın.
- **İnme:** Araçtayken `E` tuşuna basın.
- **Koltuk Değiştirme:** Araç içindeyken başka bir koltuğa bakıp `E` tuşuna basarak geçiş yapabilirsiniz.
- **Sürüş:** Sadece sol ön koltuk (Sürücü) aracı kontrol edebilir.

## Notlar
- Yeni özellikler eklerken ilgili `.js` dosyasına ekleme yapabilir veya yeni bir dosya oluşturup `index.html` içine ekleyebilirsiniz.
