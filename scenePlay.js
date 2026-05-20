class ScenePlay extends Phaser.Scene {
    constructor() {
        super({ key: 'ScenePlay' });
    }

    preload() {
        this.load.image('bg_start',     'assets/images/bg_start.png');
        this.load.image('fg_loop',      'assets/images/fg_loop.png');
        this.load.image('fg_loop_back', 'assets/images/fg_loop_back.png');
        this.load.image('chara',        'assets/images/chara.png');
        this.load.image('obstc',        'assets/images/obstc.png');
        this.load.image('panel_skor',   'assets/images/panel_skor.png');
        this.load.atlas('flares',       'assets/particles/flares.png', 'assets/particles/flares.json');
        this.load.audio('klik_1',       'assets/audio/klik_1.mp3');
        this.load.audio('klik_2',       'assets/audio/klik_2.mp3');
        this.load.audio('klik_3',       'assets/audio/klik_3.mp3');
        this.load.audio('dead',         'assets/audio/dead.mp3');
    }

    create() {
        // =====================
        // Variabel Responsif
        // =====================
        CENTER  = this.scale.width  / 2;
        MIDDLE  = this.scale.height / 2;
        LEFT    = 0;
        RIGHT   = this.scale.width;
        TOP     = 0;
        BOTTOM  = this.scale.height;

        // =====================
        // State & Variabel Game
        // =====================
        this.isGameRunning  = false;
        this.currentLevel   = 1;
        this.nilaiPemain    = 0;
        this.timerHalangan  = 0;
        this.halangan       = [];
        this.charaTweens    = null;

        // =====================
        // Background
        // =====================
        var bgBase = this.add.image(CENTER, MIDDLE, 'bg_start');
        bgBase.setDisplaySize(this.scale.width, this.scale.height);

        // Parallax foreground (2 lapis: back & front)
        this.background = [];

        // Lapisan belakang (fg_loop_back) - lebih lambat
        var bg_back = [];
        for (var i = 0; i < 2; i++) {
            var imgBack = this.add.image(683 + i * 1366, 384, 'fg_loop_back');
            imgBack.setData('kecepatan', 3);
            bg_back.push(imgBack);
        }
        this.background.push(bg_back);

        // Lapisan depan (fg_loop) - lebih cepat
        var bg_front = [];
        for (var j = 0; j < 2; j++) {
            var imgFront = this.add.image(683 + j * 1366, 384, 'fg_loop');
            imgFront.setData('kecepatan', 6);
            bg_front.push(imgFront);
        }
        this.background.push(bg_front);

        // =====================
        // Karakter
        // =====================
        this.chara = this.add.image(200, MIDDLE, 'chara');
        this.chara.setScale(0.6);
        this.chara.setDepth(5);

        // Animasi kemunculan karakter
        this.chara.alpha = 0;
        this.tweens.add({
            targets: this.chara,
            alpha: 1,
            duration: 500,
            ease: 'Linear',
            delay: 300
        });

        // =====================
        // Panel & Teks Skor
        // =====================
        var panelSkor = this.add.image(CENTER, 50, 'panel_skor');
        panelSkor.setScale(0.5);
        panelSkor.setDepth(20);

        this.txtNilai = this.add.text(CENTER, 35, '0', {
            fontSize: '28px',
            fill: '#ffdd00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(21);

        this.add.text(CENTER, 15, 'SKOR', {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(21);

        // =====================
        // Lapisan gelap (overlay menu start)
        // =====================
        this.overlayGelap = this.add.rectangle(CENTER, MIDDLE, this.scale.width, this.scale.height, 0x000000, 0.6);
        this.overlayGelap.setDepth(30);

        // =====================
        // Tombol Play (overlay)
        // =====================
        this.btnPlayOverlay = this.add.image(CENTER, MIDDLE, 'panel_skor');
        this.btnPlayOverlay.setScale(1.2);
        this.btnPlayOverlay.setDepth(31);
        this.btnPlayOverlay.setTint(0xff3333);

        this.txtBtnPlay = this.add.text(CENTER, MIDDLE, 'TAP TO PLAY', {
            fontSize: '36px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(32);

        // Animasi tombol play berkedip
        this.tweens.add({
            targets: [this.btnPlayOverlay, this.txtBtnPlay],
            alpha: 0.4,
            duration: 700,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // =====================
        // Sound Efek
        // =====================
        this.snd_klik = [
            this.sound.add('klik_1'),
            this.sound.add('klik_2'),
            this.sound.add('klik_3')
        ];
        this.snd_dead = this.sound.add('dead');

        // =====================
        // Partikel
        // =====================
        try {
            this.particles = this.add.particles('flares');
            this.emitter = this.particles.createEmitter({
                frame: 'blue',
                x: 200,
                y: MIDDLE,
                speed: { min: 50, max: 150 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                blendMode: 'ADD',
                lifespan: 400,
                quantity: 8,
                on: false
            });
        } catch(e) {
            this.particles = null;
            this.emitter = null;
        }

        // =====================
        // Interaksi Input Pemain
        // =====================
        this.input.on('pointerup', function(pointer) {

            // Klik pertama = mulai game
            if (!this.isGameRunning) {
                this.startGame();
                return;
            }

            // Saat game berjalan = turunkan karakter
            // Hentikan tween sebelumnya
            if (this.charaTweens) {
                this.charaTweens.stop();
            }

            // Suara acak klik
            var randSnd = Phaser.Math.Between(0, this.snd_klik.length - 1);
            this.snd_klik[randSnd].play();

            // Tween turun
            this.charaTweens = this.tweens.add({
                targets: this.chara,
                y: this.chara.y + 200,
                duration: 750,
                ease: 'Sine.easeIn'
            });

            // Partikel
            if (this.emitter) {
                this.emitter.setPosition(this.chara.x, this.chara.y);
                this.emitter.explode(8, this.chara.x, this.chara.y);
            }

        }, this);

        // =====================
        // Fisika dimatikan dulu (baru aktif saat play)
        // =====================
    }

    startGame() {
        this.isGameRunning = true;

        // Sembunyikan overlay
        this.tweens.add({
            targets: this.btnPlayOverlay,
            scaleX: 0, scaleY: 0,
            duration: 250,
            ease: 'Linear'
        });
        this.tweens.add({
            targets: [this.txtBtnPlay],
            alpha: 0,
            duration: 200
        });
        this.tweens.add({
            targets: this.overlayGelap,
            alpha: 0,
            duration: 400,
            delay: 150,
            onComplete: function() {
                this.overlayGelap.setVisible(false);
            },
            onCompleteScope: this
        });

        // Mulai karakter naik
        this.startCharaUp();
    }

    startCharaUp() {
        // Karakter naik terus-menerus di update
    }

    gameOver() {
        this.isGameRunning = false;

        // Hentikan tween karakter
        if (this.charaTweens) {
            this.charaTweens.stop();
        }

        // Suara mati
        this.snd_dead.play();

        // Simpan high score
        var highscore = localStorage.getItem('highscore') || 0;
        highscore = parseInt(highscore);
        if (this.nilaiPemain > highscore) {
            localStorage.setItem('highscore', this.nilaiPemain);
        }

        // Transisi ke menu setelah 2 detik
        this.time.delayedCall(2000, function() {
            this.scene.start('SceneMenu');
        }, [], this);
    }

    update() {
        if (!this.isGameRunning) return;

        // =====================
        // Karakter naik terus
        // =====================
        this.chara.y -= 2.5;

        // =====================
        // Gerakkan Parallax Background
        // =====================
        for (var i = 0; i < this.background.length; i++) {
            var layer = this.background[i];
            for (var j = 0; j < layer.length; j++) {
                var bg = layer[j];
                bg.x -= bg.getData('kecepatan');
                // Reset posisi jika sudah keluar layar kiri
                if (bg.x <= -683) {
                    bg.x = 683 + 1366;
                }
            }
        }

        // =====================
        // Timer Halangan
        // =====================
        this.timerHalangan--;

        if (this.timerHalangan <= 0) {
            // Reset timer: muncul setiap 60-120 frame
            this.timerHalangan = Phaser.Math.Between(60, 120);

            // Buat halangan baru
            var obstacle = this.add.image(1500, Phaser.Math.Between(60, 680), 'obstc');
            obstacle.setOrigin(1, 0.5);
            obstacle.setDepth(5);
            obstacle.setData('status_aktif', true);
            obstacle.setData('kecepatan', Phaser.Math.Between(10, 15));
            this.halangan.push(obstacle);
        }

        // =====================
        // Gerakkan & Hapus Halangan
        // =====================
        for (var h = this.halangan.length - 1; h >= 0; h--) {
            var obs = this.halangan[h];
            obs.x -= obs.getData('kecepatan');

            // Tambah nilai jika halangan melewati karakter
            if (obs.getData('status_aktif') && obs.x < this.chara.x) {
                obs.setData('status_aktif', false);
                this.nilaiPemain += 1;
                this.txtNilai.setText('' + this.nilaiPemain);
            }

            // Hapus jika keluar layar kiri
            if (obs.x < -100) {
                obs.destroy();
                this.halangan.splice(h, 1);
            }
        }

        // =====================
        // Deteksi Tabrakan Karakter vs Halangan
        // =====================
        for (var k = 0; k < this.halangan.length; k++) {
            var hObj = this.halangan[k];
            var dist = Phaser.Math.Distance.Between(
                this.chara.x, this.chara.y,
                hObj.x - 30, hObj.y
            );
            if (dist < 50) {
                // Efek merah pada karakter
                this.chara.setTint(0xff0000);
                this.time.delayedCall(200, function() {
                    if (this.chara) this.chara.clearTint();
                }, [], this);
                this.gameOver();
                return;
            }
        }

        // =====================
        // Deteksi Karakter Keluar Layar Atas
        // =====================
        if (this.chara.y < -50) {
            this.chara.setTint(0xff0000);
            this.gameOver();
            return;
        }

        // =====================
        // Batasi Karakter Tidak Keluar Bawah
        // =====================
        if (this.chara.y > BOTTOM + 50) {
            this.chara.y = BOTTOM + 50;
            this.gameOver();
        }
    }
}
