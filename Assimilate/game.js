// ==========================================
// SES VE MÜZİK MOTORU (Web Audio API)
// ==========================================
// Dışarıdan MP3 yüklemek yerine tarayıcının osilatörlerini kullanarak retro sesler üretiyoruz.

const bgMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3; 

let audioCtx;
let masterGain;
let isMuted = false;

// Frekans ve dalga tipi vererek anlık bip/lazer sesleri üreten ana fonksiyon
function playTone(freq, type, duration, vol = 0.1, slideDown = false) {
    if (isMuted || !audioCtx) return;
    
    // Chrome gibi tarayıcılar kullanıcı etkileşimi olmadan sesi başlatmaz, bu yüzden resume ediyoruz
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator(); // Ses dalgası üretici
    const gain = audioCtx.createGain();      // Ses seviyesi (volume) kontrolcüsü
    
    osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // slideDown true ise, sesi yüksek frekanstan düşüğe doğru kaydırır (klasik lazer/pew pew efekti)
    if (slideDown) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.1, audioCtx.currentTime + duration);
    }
    
    // Sesi aniden kesmek yerine yavaşça kısarak (fade out) pürüzsüz bitirir
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    // Düğümleri birbirine bağla ve çal
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Ses efektleri kütüphanemiz
const sfx = {
    shoot: () => playTone(800, 'square', 0.15, 0.03, true),    // İnce lazer
    stick: () => playTone(400, 'sine', 0.1, 0.1, false),       // Tok yapışma
    explosion: () => playTone(150, 'sawtooth', 0.4, 0.2, true), // Kalın patlama
    gameOver: () => playTone(300, 'triangle', 1.5, 0.3, true)  // Düşen üzücü ton
};

// Sesi açma/kapatma butonu dinleyicisi
document.getElementById('muteBtn').addEventListener('click', (e) => {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    if (masterGain) masterGain.gain.value = isMuted ? 0 : 1; // Tüm ses efektlerini sustur
    e.target.innerText = isMuted ? "Sesi Aç" : "Sesi Kapat";
});

// ==========================================
// HTML ELEMENTLERİ VE CANVAS KURULUMU
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shieldCountUI = document.getElementById('shieldCount');
const timeScoreUI = document.getElementById('timeScore');
const difficultyLevelUI = document.getElementById('difficultyLevel');
const gameOverUI = document.getElementById('gameOver');
const finalScoreUI = document.getElementById('finalScore');
const mainMenuUI = document.getElementById('mainMenu');
const inGameUI = document.getElementById('ui');

// Canvas boyutunu tam ekran yap
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Çarpışma Testi: 2D düzlemde iki dairenin çarpışıp çarpışmadığını kontrol eder.
// Pisagor teoremi (a^2 + b^2 = c^2) kullanılarak aralarındaki hipotenüs hesaplanır.
function checkCollision(obj1, obj2) {
    let dx = obj1.x - obj2.x;
    let dy = obj1.y - obj2.y;
    let distance = Math.hypot(dx, dy); // Math.sqrt(dx*dx + dy*dy) ile aynı şey
    return distance < (obj1.radius + obj2.radius);
}

// ==========================================
// OYUN SINIFLARI (CLASSES)
// ==========================================

// Patlama anında etrafa saçılan küçük parçacıklar
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.radius = Math.random() * 3 + 1; // 1-4 px arası rastgele boyut
        this.color = color;
        // x ve y ekseninde rastgele fırlama hızı
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1; // Saydamlık (1 = tam görünür)
        this.decay = Math.random() * 0.02 + 0.01; // Sönme hızı
    }
    update() { 
        this.x += this.vx; 
        this.y += this.vy; 
        this.alpha -= this.decay; // Her karede biraz daha saydamlaş
    }
    draw(ctx) {
        ctx.save(); 
        ctx.globalAlpha = this.alpha;
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; 
        ctx.fill(); 
        ctx.restore();
    }
}

// Ana Karakter (Çekirdek)
class Player {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.radius = 15; 
        this.speed = 5;
        this.rotation = 0; // Katamari dönüş açısı
        this.stuckEnemies = []; // Üzerine yapışan düşmanları tutan dizi
    }
    update(keys) {
        // WASD hareket kontrolleri
        if (keys.w) this.y -= this.speed; 
        if (keys.s) this.y += this.speed;
        if (keys.a) this.x -= this.speed; 
        if (keys.d) this.x += this.speed;
        
        // Oyuncuyu ekran sınırları içinde tut
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        
        // Katamari dönüş animasyonu (Radyan cinsinden artar)
        this.rotation += 0.04;
        
        // Yapışan kalkanların konumlarını çekirdeğin etrafında döndür
        this.stuckEnemies.forEach(shield => {
            let currentAngle = this.rotation + shield.relativeAngle;
            shield.x = this.x + Math.cos(currentAngle) * shield.relativeDist;
            shield.y = this.y + Math.sin(currentAngle) * shield.relativeDist;
        });
    }
    draw(ctx) {
        // Çekirdeği çiz
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00d2ff'; 
        ctx.fill(); 
        ctx.closePath();
        
        // Dönüşü görselleştirmek için çekirdeğe küçük bir çizgi çek
        ctx.beginPath(); 
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.rotation) * this.radius, this.y + Math.sin(this.rotation) * this.radius);
        ctx.strokeStyle = 'white'; 
        ctx.lineWidth = 2; 
        ctx.stroke();
        
        // Üstündeki kalkanları da çiz
        this.stuckEnemies.forEach(shield => shield.draw(ctx));
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; 
        this.isStuck = false;
        this.wallBounceCount = 0; 
        
        // Yapıştığı andaki bağıl konumları (Katamari mantığı için hayati)
        this.relativeDist = 0; 
        this.relativeAngle = 0;
        
        // Düşman Tiplerini Belirle
        if (type === 0) { 
            // 0: Standart
            this.radius = 12; this.speed = 1.5; this.color = '#ff4c4c'; 
            this.shootInterval = 2500; this.bulletSpeed = 6; this.bulletColor = '#fffc00';
        } else if (type === 1) { 
            // 1: Kamikaze (Hızlı, ateş etmez, patlar)
            this.radius = 9; this.speed = 3.5; this.color = '#ff8c00'; 
            this.shootInterval = Infinity; this.bulletSpeed = 0;
        } else if (type === 2) { 
            // 2: Sniper (Yavaş, çok hızlı ateş eder - Rapid Fire)
            this.radius = 14; this.speed = 0.7; this.color = '#b833ff'; 
            this.shootInterval = 250; this.bulletSpeed = 8; this.bulletColor = '#ff55ff';
        }
        
        // Başlangıçta rastgele bir yöne fırlat
        let angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed; 
        this.vy = Math.sin(angle) * this.speed;
        
        // Düşmanlar aynı anda ateş etmesin diye ilk atış süresine rastgelelik katıyoruz
        this.lastShotTime = Date.now() + Math.random() * 2000;
    }
    
    update(player, bullets) {
        // Eğer yapışmamışsa kendi kendine süzülür
        if (!this.isStuck) {
            this.x += this.vx; this.y += this.vy;
            
            // Duvarlardan sekme mantığı
            let touchingWall = false;
            if (this.x < this.radius && this.vx < 0) { touchingWall = true; this.vx *= -1; }
            if (this.x > canvas.width - this.radius && this.vx > 0) { touchingWall = true; this.vx *= -1; }
            if (this.y < this.radius && this.vy < 0) { touchingWall = true; this.vy *= -1; }
            if (this.y > canvas.height - this.radius && this.vy > 0) { touchingWall = true; this.vy *= -1; }

            // Kamikaze ise duvar çarpmasını say
            if (this.type === 1 && touchingWall) this.wallBounceCount++;

            // Ateş etme kontrolü
            let now = Date.now();
            if (now - this.lastShotTime > this.shootInterval) {
                // Oyuncuyu hedef alan mermi oluştur
                bullets.push(new Bullet(this.x, this.y, player.x, player.y, this.bulletSpeed, this.bulletColor));
                sfx.shoot(); // Ateş efekti çal
                this.lastShotTime = now;
            }
        }
    }
    
    // Oyuncuya yapışma (Katamari Mekaniği)
    stickTo(player) {
        this.isStuck = true;
        let dx = this.x - player.x; 
        let dy = this.y - player.y;
        
        // Yapıştığı an çekirdeğe olan mesafesini sabitle
        this.relativeDist = Math.hypot(dx, dy);
        // Yapıştığı anki açıyı bul, ancak oyuncunun O ANKİ dönüş açısını çıkar ki kayma olmasın
        this.relativeAngle = Math.atan2(dy, dx) - player.rotation;
        
        this.color = '#666'; // Ölü/kalkan olduğunu belli etmek için gri yap
    }
    
    draw(ctx) {
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; 
        ctx.fill();
        ctx.strokeStyle = '#222'; 
        ctx.lineWidth = 2; 
        ctx.stroke();
        
        // Sniper'ları ayırmak için ortalarına siyah nokta koy
        if(this.type === 2 && !this.isStuck) {
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
            ctx.fillStyle = 'black'; 
            ctx.fill();
        }
    }
}

class Bullet {
    constructor(x, y, targetX, targetY, speed, color) {
        this.x = x; this.y = y; 
        this.radius = 4; this.speed = speed; this.color = color;
        
        // Atıldığı andaki hedefin açısını (atan2) bul ve o yönde hız vektörleri oluştur
        let angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed; 
        this.vy = Math.sin(angle) * this.speed;
    }
    update() { 
        this.x += this.vx; 
        this.y += this.vy; 
    }
    draw(ctx) {
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; 
        ctx.fill(); 
        ctx.closePath();
    }
}

// ==========================================
// OYUN YÖNETİMİ VE DURUMLAR
// ==========================================
let isGameStarted = false;
let isGameOver = false;
let gameStartTime = 0;
let currentDifficulty = 1;
let lastSpawnTime = 0;
let maxEnemies = 15;
let spawnInterval = 1500;

const player = new Player(canvas.width / 2, canvas.height / 2);
const enemies = []; 
const bullets = []; 
const particles = []; 

// Klavye girişlerini takip et
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', e => { if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

// Kamikaze patlamasını ve alan hasarını (AoE) yöneten fonksiyon
function triggerExplosion(ex, ey) {
    sfx.explosion(); 
    let explosionRadius = 30; // Patlama menzili
    
    // Görsel şölen
    for(let p=0; p<20; p++) particles.push(new Particle(ex, ey, '#ff8c00'));

    // Çekirdek (Player) menzilin içinde mi kontrol et
    if (Math.hypot(ex - player.x, ey - player.y) < explosionRadius + player.radius) {
        endGame();
    }

    // Hangi kalkanlar menzilin içinde? Onları diziden sil 
    for (let s = player.stuckEnemies.length - 1; s >= 0; s--) {
        let shield = player.stuckEnemies[s];
        if (Math.hypot(ex - shield.x, ey - shield.y) < explosionRadius + shield.radius) {
            player.stuckEnemies.splice(s, 1);
        }
    }
}

function endGame() {
    isGameOver = true;
    sfx.gameOver(); 
    bgMusic.pause();
    gameOverUI.style.display = 'block'; // Game Over ekranını göster
    finalScoreUI.innerText = Math.floor((Date.now() - gameStartTime) / 1000);
}

// Oyunu Başlatan Olay Dinleyicisi
document.getElementById('startBtn').addEventListener('click', () => {
    // Ses bağlamını ancak kullanıcı bir butona tıklarsa başlatabiliriz
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = isMuted ? 0 : 1;

    mainMenuUI.style.display = 'none';
    inGameUI.style.display = 'block';
    
    bgMusic.play().catch(e => console.log("Müzik çalınamadı:", e));

    isGameStarted = true;
    gameStartTime = Date.now();
    lastSpawnTime = Date.now();
    
    // Motoru ateşle!
    gameLoop();
});

// ==========================================
// ANA OYUN DÖNGÜSÜ (THE GAME LOOP)
// ==========================================
// Bu fonksiyon tarayıcı izin verdikçe sürekli kendini çağırır.
function gameLoop() {
    if (!isGameStarted || isGameOver) return;
    
    let now = Date.now();
    let survivalTime = Math.floor((now - gameStartTime) / 1000);
    
    // Zorluk hesaplama: Her 20 saniyede bir düşman limitini ve doğma hızını artır
    let calculatedDifficulty = Math.floor(survivalTime / 20) + 1;
    if (calculatedDifficulty > currentDifficulty) {
        currentDifficulty = calculatedDifficulty;
        maxEnemies += 8; 
        spawnInterval = Math.max(400, spawnInterval - 200); // 400ms'den daha hızlı doğamazlar
    }

    // Düşman Üreticisi (Spawner)
    if (now - lastSpawnTime > spawnInterval && enemies.length < maxEnemies) {
        let margin = 30; // Ekranın hemen içinden doğsunlar
        let x = Math.random() < 0.5 ? margin : canvas.width - margin;
        let y = Math.random() * (canvas.height - 2 * margin) + margin;
        
        // Zorluk ilerledikçe farklı düşman tiplerini havuza ekle
        let availableTypes = [0]; 
        if (currentDifficulty >= 2) availableTypes.push(1, 1); // 1 = Kamikaze
        if (currentDifficulty >= 3) availableTypes.push(2);    // 2 = Sniper
        
        let randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        enemies.push(new Enemy(x, y, randomType));
        lastSpawnTime = now;
    }

    // Bir önceki karenin çizimlerini temizle (Temizlemezsek ekranda fırça izi bırakırız)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Oyuncuyu ve kalkanlarını güncelle
    player.update(keys);

    // Düşmanları Güncelle ve Çarpışma Kontrolü Yap
    // Silerken index kaymaması için diziyi sondan başa (length - 1 to 0) okuyoruz
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        enemy.update(player, bullets);

        // Kamikaze 3 defa duvara çarptıysa patlat ve diziden çıkar
        if (enemy.type === 1 && enemy.wallBounceCount >= 3) {
            triggerExplosion(enemy.x, enemy.y);
            enemies.splice(i, 1);
            continue; 
        }

        // Düşman çekirdeğe VEYA kalkanlara temas etti mi? (Hiyerarşik çarpışma)
        let hitCluster = false;
        if (checkCollision(enemy, player)) {
            hitCluster = true;
        } else {
            // Çekirdeğe değmediyse etrafındaki kalkanlara bak
            for (let shield of player.stuckEnemies) {
                if (checkCollision(enemy, shield)) { hitCluster = true; break; }
            }
        }

        // Temas varsa
        if (hitCluster) {
            if (enemy.type === 1) { 
                triggerExplosion(enemy.x, enemy.y); // Kamikazeydi, patladı
            } else {
                enemy.stickTo(player); // Normal/Sniper düşmandı, yapıştı
                player.stuckEnemies.push(enemy);
                sfx.stick(); 
            }
            enemies.splice(i, 1); // Artık serbest bir düşman değil, diziden çıkar
        } else {
            // Çarpışma yoksa ekrana çiz
            enemy.draw(ctx);
        }
    }

    // Mermileri Güncelle ve Çarpışma Kontrolü Yap
    for (let b = bullets.length - 1; b >= 0; b--) {
        let bullet = bullets[b];
        bullet.update(); 
        bullet.draw(ctx);

        let bulletDestroyed = false;
        
        // 1. Önce kalkanlara çarpıp çarpmadığına bak
        for (let s = player.stuckEnemies.length - 1; s >= 0; s--) {
            if (checkCollision(bullet, player.stuckEnemies[s])) {
                player.stuckEnemies.splice(s, 1); // Kalkanı yok et
                bullets.splice(b, 1); // Mermiyi yok et
                bulletDestroyed = true; break;
            }
        }

        if (bulletDestroyed) continue; // Mermi yok olduysa alttaki kodlara geçme

        // 2. Kalkanları aştıysa, çekirdeğe çarptı mı?
        if (checkCollision(bullet, player)) {
            endGame(); return; // Oyun Bitti!
        }

        // Ekrandan çıkan mermileri bellekten temizle
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(b, 1);
        }
    }

    // Partikülleri güncelle ve çiz
    for (let p = particles.length - 1; p >= 0; p--) {
        particles[p].update(); 
        particles[p].draw(ctx);
        if (particles[p].alpha <= 0) particles.splice(p, 1); // Görünmez olanları sil
    }

    // En son oyuncuyu çiz (Mermilerin ve bazı efektlerin üstünde görünsün)
    player.draw(ctx);
    
    // UI (Arayüz) değerlerini güncelle
    timeScoreUI.innerText = survivalTime;
    difficultyLevelUI.innerText = currentDifficulty;
    shieldCountUI.innerText = player.stuckEnemies.length;

    // Döngüyü bir sonraki ekran yenilemesinde tekrar çalıştır
    requestAnimationFrame(gameLoop);
}

// Pencere boyutu değiştiğinde canvası ayarla
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Menü ekranındaysa oyuncuyu ekranın ortasında tut
    if(!isGameStarted) { player.x = canvas.width / 2; player.y = canvas.height / 2; }
});

// Sayfa yüklendiğinde, oyun başlamadan önce menü arkasında duran hareketsiz oyuncuyu çiz
ctx.clearRect(0, 0, canvas.width, canvas.height);
player.draw(ctx);