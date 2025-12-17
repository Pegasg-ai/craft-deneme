/**
 * Gelişmiş Araç JSON Oluşturucu
 * 
 * assets/vehicles klasörünü tarar ve vehicles.json oluşturur.
 * 
 * Kullanım:
 *   node scripts/generate-vehicles-json.js
 *   node scripts/generate-vehicles-json.js --force   (mevcut araçları da güncelle)
 *   node scripts/generate-vehicles-json.js --dry-run (sadece önizle, yazma)
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const vehiclesDir = path.join(root, 'assets', 'vehicles');
const outFile = path.join(vehiclesDir, 'vehicles.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');

// =====================================================
// ARAÇ BİLGİSİ ÇIKARMA
// =====================================================

// Yaygın üreticiler
const MANUFACTURERS = {
    bmw: 'BMW',
    mercedes: 'Mercedes-Benz',
    audi: 'Audi',
    volkswagen: 'Volkswagen',
    vw: 'Volkswagen',
    porsche: 'Porsche',
    ferrari: 'Ferrari',
    lamborghini: 'Lamborghini',
    mclaren: 'McLaren',
    aston: 'Aston Martin',
    ford: 'Ford',
    chevrolet: 'Chevrolet',
    dodge: 'Dodge',
    gmc: 'GMC',
    jeep: 'Jeep',
    toyota: 'Toyota',
    honda: 'Honda',
    nissan: 'Nissan',
    mazda: 'Mazda',
    subaru: 'Subaru',
    mitsubishi: 'Mitsubishi',
    opel: 'Opel',
    renault: 'Renault',
    peugeot: 'Peugeot',
    citroen: 'Citroën',
    fiat: 'Fiat',
    alfa: 'Alfa Romeo',
    brabham: 'Brabham',
    pagani: 'Pagani',
    bugatti: 'Bugatti',
    koenigsegg: 'Koenigsegg',
    tesla: 'Tesla'
};

// Kategori belirleme kuralları
const CATEGORY_RULES = [
    { pattern: /topkick|c6500|truck|semi|trailer|van|bus/, category: 'service' },
    { pattern: /dukw|amphibi/, category: 'offroad' },
    { pattern: /suv|acadia|tahoe|suburban|explorer|range|rover|x5|x7|gle|gls/, category: 'suv' },
    { pattern: /offroad|rally|baja|raptor|wrangler|defender/, category: 'offroad' },
    { pattern: /gt3|gtr|gt2|lmp|le\s?mans|race|brabham|bt62/, category: 'super' },
    { pattern: /lambo|ferrari|mclaren|pagani|bugatti|koenigsegg|aventador|huracan|enzo/, category: 'super' },
    { pattern: /s1000|r1|zx10|cbr|gsxr|ninja|ducati|hayabusa|motorcycle|bike/, category: 'motorcycle' }
];

function extractInfo(filename) {
    const id = filename.replace(/\.glb$/i, '');
    const lower = id.toLowerCase();
    
    // Yıl çıkar
    const yearMatch = lower.match(/^(\d{4})[_-]/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    
    // Üretici bul
    let manufacturer = null;
    for (const [key, name] of Object.entries(MANUFACTURERS)) {
        if (lower.includes(key)) {
            manufacturer = name;
            break;
        }
    }
    
    // Kategori belirle
    let category = 'sport'; // varsayılan
    
    for (const rule of CATEGORY_RULES) {
        if (rule.pattern.test(lower)) {
            category = rule.category;
            break;
        }
    }
    
    // Yıla göre klasik mi?
    if (year && year <= 1995 && category === 'sport') {
        category = 'classic';
    }
    
    // İsim oluştur
    let name = id
        .replace(/^(\d{4})[_-]/, '') // Baştaki yılı kaldır
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Her kelimenin ilk harfini büyük yap
    name = name.replace(/\b\w/g, c => c.toUpperCase());
    
    // Üreticiyi başa ekle (eğer isimde yoksa)
    if (manufacturer && !name.toLowerCase().startsWith(manufacturer.toLowerCase().split(' ')[0])) {
        name = `${manufacturer} ${name}`;
    }
    
    // Yılı ekle
    if (year) {
        name = `${name} (${year})`;
    }
    
    return { id, name, year, manufacturer, category };
}

function generateColor(category) {
    const colors = {
        sport: ['#3498DB', '#E74C3C', '#9B59B6', '#1ABC9C'],
        super: ['#F1C40F', '#E67E22', '#ECF0F1', '#FF6B6B'],
        suv: ['#2ECC71', '#27AE60', '#34495E', '#95A5A6'],
        offroad: ['#8E44AD', '#D35400', '#7F8C8D', '#27AE60'],
        service: ['#34495E', '#95A5A6', '#2C3E50', '#7F8C8D'],
        classic: ['#E67E22', '#D35400', '#C0392B', '#8E44AD'],
        motorcycle: ['#E74C3C', '#2C3E50', '#F39C12', '#1ABC9C']
    };
    const list = colors[category] || colors.sport;
    return list[Math.floor(Math.random() * list.length)];
}

// =====================================================
// ANA İŞLEM
// =====================================================

function main() {
    console.log('🚗 Araç JSON Oluşturucu\n');
    
    if (!fs.existsSync(vehiclesDir)) {
        console.error('❌ assets/vehicles klasörü bulunamadı:', vehiclesDir);
        process.exit(1);
    }
    
    // Mevcut JSON'u oku (varsa)
    let existingData = { version: 2, categories: null, vehicles: [] };
    let existingIds = new Set();
    
    if (fs.existsSync(outFile)) {
        try {
            existingData = JSON.parse(fs.readFileSync(outFile, 'utf8'));
            existingData.vehicles = existingData.vehicles || [];
            existingIds = new Set(existingData.vehicles.map(v => v.id));
            console.log(`📄 Mevcut vehicles.json: ${existingData.vehicles.length} araç\n`);
        } catch (e) {
            console.warn('⚠️ Mevcut JSON okunamadı, sıfırdan oluşturulacak\n');
        }
    }
    
    // .glb dosyalarını tara
    const glbFiles = fs.readdirSync(vehiclesDir)
        .filter(f => f.toLowerCase().endsWith('.glb'))
        .sort();
    
    console.log(`📁 Bulunan .glb dosyaları: ${glbFiles.length}\n`);
    
    let added = 0;
    let skipped = 0;
    let updated = 0;
    
    const newVehicles = [];
    
    for (const file of glbFiles) {
        const info = extractInfo(file);
        
        // Zaten var mı?
        if (existingIds.has(info.id) && !FORCE) {
            skipped++;
            continue;
        }
        
        const existing = existingData.vehicles.find(v => v.id === info.id);
        
        const vehicle = {
            id: info.id,
            name: existing?.name || info.name,
            year: existing?.year || info.year,
            manufacturer: existing?.manufacturer || info.manufacturer,
            category: existing?.category || info.category,
            model: file,
            thumbnail: null,
            color: existing?.color || generateColor(info.category),
            stats: existing?.stats || {},
            enabled: existing?.enabled !== false
        };
        
        if (existing?.description) vehicle.description = existing.description;
        if (existing?.wheels) vehicle.wheels = existing.wheels;
        if (existing?.sounds) vehicle.sounds = existing.sounds;
        
        newVehicles.push(vehicle);
        
        if (existingIds.has(info.id)) {
            updated++;
            console.log(`🔄 Güncellendi: ${info.id}`);
        } else {
            added++;
            console.log(`➕ Eklendi: ${info.id} (${info.category})`);
        }
    }
    
    // Mevcut araçları koru (dosyası silinen hariç)
    const finalVehicles = [];
    const processedIds = new Set(newVehicles.map(v => v.id));
    
    // Önce yeni/güncellenen araçları ekle
    for (const v of newVehicles) {
        finalVehicles.push(v);
    }
    
    // Sonra mevcut ama güncellenmeyenleri ekle
    for (const v of existingData.vehicles) {
        if (!processedIds.has(v.id)) {
            // Dosyası hala var mı kontrol et
            const modelFile = v.model || `${v.id}.glb`;
            if (fs.existsSync(path.join(vehiclesDir, modelFile))) {
                finalVehicles.push(v);
            } else {
                console.log(`🗑️ Kaldırıldı (dosya yok): ${v.id}`);
            }
        }
    }
    
    // Kategoriye ve isme göre sırala
    finalVehicles.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
    });
    
    // Çıktı
    const output = {
        $schema: './vehicles.schema.json',
        version: 2,
        categories: existingData.categories || getDefaultCategories(),
        vehicles: finalVehicles
    };
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Özet:`);
    console.log(`   Eklenen: ${added}`);
    console.log(`   Güncellenen: ${updated}`);
    console.log(`   Atlanan: ${skipped}`);
    console.log(`   Toplam: ${finalVehicles.length}`);
    console.log('='.repeat(50) + '\n');
    
    if (DRY_RUN) {
        console.log('🔍 DRY RUN - Dosya yazılmadı\n');
        console.log(JSON.stringify(output, null, 2));
    } else {
        fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n', 'utf8');
        console.log(`✅ Yazıldı: ${outFile}\n`);
    }
}

function getDefaultCategories() {
    return {
        sport: { name: 'Spor', icon: '🏎️', description: 'Yüksek hız ve iyi yol tutuş', defaults: { maxSpeed: 250, acceleration: 28, braking: 22, handling: 2.5, mass: 1300 } },
        super: { name: 'Süper', icon: '🚀', description: 'En hızlı ve en pahalı araçlar', defaults: { maxSpeed: 320, acceleration: 38, braking: 30, handling: 3.0, mass: 1150 } },
        suv: { name: 'SUV', icon: '🚙', description: 'Geniş ve güçlü araçlar', defaults: { maxSpeed: 185, acceleration: 22, braking: 25, handling: 1.8, mass: 2200 } },
        offroad: { name: 'Arazi', icon: '🏔️', description: 'Her zeminde gidebilen araçlar', defaults: { maxSpeed: 200, acceleration: 24, braking: 24, handling: 2.1, mass: 2000 } },
        service: { name: 'Hizmet', icon: '🚛', description: 'Ticari ve hizmet araçları', defaults: { maxSpeed: 160, acceleration: 16, braking: 26, handling: 1.5, mass: 3000 } },
        classic: { name: 'Klasik', icon: '🚗', description: 'Nostaljik klasik araçlar', defaults: { maxSpeed: 220, acceleration: 22, braking: 20, handling: 2.0, mass: 1500 } },
        motorcycle: { name: 'Motosiklet', icon: '🏍️', description: 'İki tekerlekli hızlı araçlar', defaults: { maxSpeed: 280, acceleration: 42, braking: 28, handling: 3.2, mass: 220 } }
    };
}

main();
