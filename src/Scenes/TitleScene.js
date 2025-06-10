class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        this.load.audio('theme', 'assets/sfx/theme.mp3');
        this.load.audio('start', 'assets/sfx/start.mp3');
    }

    create() {
        // Play looping theme music
        this.sound.play('theme', { loop: true, volume: 0.5 });

        // Centered title text
        this.add.text(this.scale.width / 2, 200, 'ALIEN ESCAPE', {
            fontSize: '40px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        // Centered, interactive start text
        const startText = this.add.text(this.scale.width / 2, 300, 'Click to Start', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        // Start game on click
        startText.on('pointerdown', () => {
            this.sound.stopAll(); // stop music
            this.sound.play('start');
            this.scene.start('GameScene');
        });

        // Hover effects
        startText.on('pointerover', () => startText.setStyle({ fill: '#ffff00' }));
        startText.on('pointerout', () => startText.setStyle({ fill: '#ffffff' }));

        // Controls panel
const controlsText = [
    'CONTROLS',
    '',
    '← / A : Move Left',
    '→ / D : Move Right',
    'SPACE  : Shoot',
    'T      : Return to Title',
    'P      : Play',
    '3      : Skip to Boss Stage',
].join('\n');

this.add.text(this.scale.width / 2, 420, controlsText, {
    fontSize: '18px',
    fill: '#ffffff',
    align: 'center',
    lineSpacing: 6,
}).setOrigin(0.5);

    }
}
