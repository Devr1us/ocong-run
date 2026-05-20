class SceneMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneMenu' });
    }

    preload() {
        this.load.image('bg_start',        'assets/images/bg_start.png');
        this.load.image('btn_play',         'assets/images/btn_play.png');
        this.load.image('title_game',       'assets/images/title_game.png');
        this.load.image('panel_skor',       'assets/images/panel_skor.png');
        this.load.spritesheet('mummy',      'assets/sprite/mummy37x45.png', { frameWidth: 37, frameHeight: 45 });
        this.load.audio('ambience',         'assets/audio/ambience.mp3');
        this.load.audio('touch',            'assets/audio/touch.mp3');
        this.load.audio('transisi_menu',    'assets/audio/transisi_menu.mp3');
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
        // High Score dari localStorage
        // =====================
        var highscore = localStorage.getItem('highscore') || 0;

        // =====================
        // Background
        // =====================
        var bg = this.add.image(CENTER, MIDDLE, 'bg_start');
        bg.setDisplaySize(this.scale.width, this.scale.height);

        // =====================
        // Mummy Sprite (ornamen)
        // =====================
        this.anims.create({
            key: 'mummy_walk',
            frames: this.anims.generateFrameNumbers('mummy', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        var mummy = this.add.sprite(200, BOTTOM - 80, 'mummy');
        mummy.setScale(2.5);
        mummy.play('mummy_walk');

        // =====================
        // Tombol Play
        // =====================
        this.btnPlay = this.add.image(CENTER, MIDDLE + 120, 'btn_play');
        this.btnPlay.setDepth(10);
        this.btnPlay.setScale(0.8);

        // =====================
        // Title Game
        // =====================
        this.titleGame = this.add.image(CENTER, MIDDLE - 180, 'title_game');
        this.titleGame.setScale(0.7);

        // =====================
        // Panel Skor (High Score)
        // =====================
        var panelHS = this.add.image(CENTER, MIDDLE - 40, 'panel_skor');
        panelHS.setScale(0.6);

        this.add.text(CENTER, MIDDLE - 55, 'HIGH SCORE', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(CENTER, MIDDLE - 20, '' + highscore, {
            fontSize: '36px',
            fill: '#ffdd00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // =====================
        // Animasi Tween
        // =====================
        // Title muncul dari atas
        this.titleGame.y = MIDDLE - 180 - 384;
        this.tweens.add({
            targets: this.titleGame,
            y: MIDDLE - 180,
            duration: 800,
            ease: 'Bounce.easeOut',
            delay: 250
        });

        // Tombol play muncul dari bawah
        this.btnPlay.y = BOTTOM + 100;
        this.tweens.add({
            targets: this.btnPlay,
            y: MIDDLE + 120,
            duration: 600,
            ease: 'Back.easeOut',
            delay: 750
        });

        // =====================
        // Sound ambience
        // =====================
        if (!snd_ambience) {
            snd_ambience = this.sound.add('ambience', { loop: true, volume: 0.35 });
            snd_ambience.play();
        }

        var snd_touch          = this.sound.add('touch');
        var snd_transisi_menu  = this.sound.add('transisi_menu');

        // =====================
        // Interaksi Tombol Play
        // =====================
        var btnClicked = false;
        this.btnPlay.setInteractive();

        this.input.on('gameobjectover', function(pointer, gameObject) {
            if (gameObject === this.btnPlay) {
                gameObject.setScale(0.85);
            }
        }, this);

        this.input.on('gameobjectout', function(pointer, gameObject) {
            if (gameObject === this.btnPlay) {
                if (!btnClicked) gameObject.setScale(0.8);
            }
        }, this);

        this.input.on('gameobjectdown', function(pointer, gameObject) {
            if (gameObject === this.btnPlay) {
                btnClicked = true;
                gameObject.setTint(0xaaaaaa);
            }
        }, this);

        this.input.on('gameobjectup', function(pointer, gameObject) {
            if (gameObject === this.btnPlay && btnClicked) {
                btnClicked = false;
                gameObject.clearTint();

                // Efek suara
                snd_touch.play();
                snd_transisi_menu.play({ delay: 0.3 });

                // Animasi menghilang tombol play
                this.tweens.add({
                    targets: this.btnPlay,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 250,
                    ease: 'Linear'
                });

                // Animasi menghilang title
                this.tweens.add({
                    targets: this.titleGame,
                    alpha: 0,
                    duration: 300,
                    ease: 'Linear'
                });

                // Animasi menghilang background lalu pindah scene
                this.tweens.add({
                    targets: bg,
                    alpha: 0,
                    duration: 500,
                    delay: 200,
                    ease: 'Linear',
                    onComplete: () => {
                        this.scene.start('ScenePlay');
                    }
                });
            }
        }, this);
    }

    update() {}
}
