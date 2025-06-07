class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.add.text(320, 250, 'Game Over', { fontSize: '32px', fill: '#ff0000' });
        const restartText = this.add.text(320, 300, 'Click to Restart', { fontSize: '24px', fill: '#ffffff' });

        restartText.setInteractive();
        restartText.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}
