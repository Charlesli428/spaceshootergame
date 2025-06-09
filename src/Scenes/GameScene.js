class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('background', 'assets/images/background_tiled_vertical.png');
    this.load.image('player', 'assets/images/mainship.png');
    this.load.image('bullet', 'assets/images/player_laser.png');
    this.load.image('laser', 'assets/images/enemy_laser.png');
    this.load.image('safemarker', 'assets/images/spaceBuilding_015.png');
    this.load.image('enemyBee', 'assets/images/galaga_enemy_bee.png');
    this.load.image('enemyBossRed', 'assets/images/galaga_enemy_boss_red.png');
    this.load.audio('firing', 'assets/sfx/firing.mp3');
    this.load.image('explosion', 'assets/images/explosion.png');
    this.load.audio('explosionSound', 'assets/sfx/kill.mp3');
    this.load.image('enemyBossPurple', 'assets/images/galaga_enemy_boss_purple.png');
  }

spawnWave(stage) {
const formation = [
  { type: 'enemyBossPurple', count: 4, yOffset: 0 },
  { type: 'enemyBossRed', count: 8, yOffset: 60 },
  { type: 'enemyBee', count: 8, yOffset: 120 },
  { type: 'enemyBee', count: 8, yOffset: 180 },
];



const centerX = this.scale.width / 2;
const spacingX = 80;

formation.forEach((row, rowIndex) => {
  const startX = centerX - ((row.count - 1) * spacingX) / 2;
  const y = 100 + row.yOffset;

  for (let i = 0; i < row.count; i++) {
    const finalX = startX + i * spacingX;
    const spawnX = Phaser.Math.Between(-100, this.scale.width + 100); // enter from sides
    const spawnY = -Phaser.Math.Between(100, 300); // fly in from above

    const enemy = this.enemies.create(spawnX, spawnY, row.type)
      .setScale(0.06)
      .setOrigin(0.5);

    enemy.body.setSize(enemy.width * 0.6, enemy.height * 0.6, true);
    enemy.originalY = y;
    enemy.finalX = finalX;
    enemy.finalY = y;
    enemy.isDiving = false;

    this.tweens.add({
      targets: enemy,
      x: finalX,
      y: y,
      ease: 'Sine.easeInOut',
      delay: (i + rowIndex * 5) * 400,
      duration: 2000,
      onComplete: () => {
        enemy.arrived = true;
        enemy.y += Math.sin(enemy.x / 50) * 0.3; //wave during approach
      }
    });
  }
});
  
  this.enemyStepDown = 10 + stage * 3;
  this.enemySpeed = 20 + stage;
  this.enemyMoveDelay = Math.max(20 - stage * 2, 10);
}

spawnBoss() {
  // clear out any leftover enemies
  this.enemies.clear(true, true);

  this.boss = this.enemies.create(
    this.scale.width/2, 100, 'enemyBossPurple'
  )
    .setScale(0.15)
    .setImmovable(true)
    .setOrigin(0.5);
  const boss = this.boss;
  // give it multi‐hit health
  boss.health = 20;
  this.bossMaxHP = 20;
  //next for health bar
  this.bossCurrentHP = this.bossMaxHP;

  const offsetY = boss.displayHeight / 2 + 100;
  this.bossHealthBarBg = this.add
    .rectangle(boss.x, boss.y + offsetY, 80, 10, 0x444444)
    .setOrigin(0.5)
    .setDepth(10);
  this.bossHealthBar = this.add
    .rectangle(boss.x, boss.y + offsetY, 80, 10, 0xff0000)
    .setOrigin(0.5)
    .setDepth(11);

  this.bossHealthBar.setDepth(10);
  this.bossHealthBarBg.setDepth(9);
  boss.arrived = true;    // skip tween logic
  boss.isDiving = false;  // skip dive logic
  
  // boss side-to-side movement
  this.bossBounce = this.time.addEvent({
    delay: 30, loop: true,
    callback: () => {
      if (!boss.body) return;
      if (boss.x <= 250 || boss.x >= this.scale.width - 250) {
        boss.setVelocityX(-boss.body.velocity.x);
      }
    }
  });
  this.bossFire = this.time.addEvent({
    delay: 800,  
    loop: true,
    callback: () => {
      if (!boss.active || !this.player.active) return;

      const dx = this.player.x - boss.x;
      const dy = this.player.y - boss.y;
      const angle = Math.atan2(dy, dx);
      const speed = 350;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.enemyBullets.create(boss.x, boss.y + 20, 'laser')
        .setScale(0.05)
        .setVelocity(vx, vy);
    }
  });
  boss.setVelocityX(200);

  // mark that we have a boss active
  this.bossActive = true;
}
killBoss() {
  // 1) Disable boss flag so no update logic tries to respawn it
  this.bossActive = false;
  if (this.bossHealthBar) this.bossHealthBar.destroy();
  if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
  // 2) Stop the boss’s timers
  if (this.bossFire) {
    this.bossFire.remove();
    this.bossFire = null;
  }
  if (this.bossBounce) {
    this.bossBounce.remove();
    this.bossBounce = null;
  }

  // 3) Explosion effect
  const explosion = this.add
    .sprite(this.boss.x, this.boss.y, 'explosion')
    .setScale(0.2);
  this.explosionSound.play();
  this.boss.destroy();
  this.boss = null;

  this.time.delayedCall(300, () => explosion.destroy());

  // 4) Award points
  this.updateScore(1000);

  // 5) Advance to the next stage after 1 second
  this.time.delayedCall(1000, () => {
    console.log('>> killBoss delayedCall triggered! currentStage was', this.currentStage);
    this.currentStage++;
    this.showStageScreen(this.currentStage);
    if (this.currentStage % 3 === 0) {
      this.spawnBoss();
    } else {
      this.spawnWave(this.currentStage);
    }
    this.waveCleared = false;
  });
}


  showStageScreen(stageNumber) {
    this.stageText.setText(`STAGE ${stageNumber}`);
    this.stageText.setVisible(true);
    this.physics.pause();

    this.time.delayedCall(2000, () => {
      this.stageText.setVisible(false);
      this.physics.resume();
    });
  }

  create() {
    this.input.keyboard.on('keydown-THREE', () => {
      this.currentStage = 3;
      this.waveCleared = false;
      this.showStageScreen(3);
      this.spawnBoss();    // since 3 % 3 === 0
    });
    // game over
    this.isGameOver = false;

    // Controls
    this.keys = this.input.keyboard.addKeys({
      left: 'A',
      right: 'D',
      shoot: 'SPACE',
      returnToTitle: 'T',
      play: 'P'
    });
    
    // Audio
    this.fireSound = this.sound.add('firing');
    this.explosionSound = this.sound.add('explosionSound');

    // Background
    this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background')
      .setOrigin(0)
      .setScrollFactor(0);

    // Player
    this.player = this.physics.add.sprite(400, 630, 'player').setScale(0.05);

    // Bullets
    this.bullets = this.physics.add.group();
    this.bulletCooldown = 0;
    this.bulletCooldownDelay = 10;

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyDirection = 1; // 1 = right, -1 = left
    this.enemySpeed = 20; // pixels per update cycle
    this.enemyStepDown = 10; // pixels to step down when turning
    this.enemyBounds = { left: 50, right: 750 }; // world limits
    this.enemyMoveTimer = 0;
    this.enemyMoveDelay = 30; // lower = faster movement
    this.boss = null;
    this.bossHP = 0;
    this.bossActive = false;

    // Initialize enemy bullets group
    this.enemyBullets = this.physics.add.group();
    
    // Bullet vs Enemy collision
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      bullet.destroy();

      // if it’s the boss, decrement its health first
      if (enemy.texture.key === 'enemyBossPurple') {
        enemy.health--;
        this.bossCurrentHP--;
        if (this.bossHealthBar) {
          this.bossHealthBar.width = 80 * (this.bossCurrentHP / this.bossMaxHP);
        }

        if (enemy.health > 0) {
          return;
        }
        if (this.bossHealthBarBg) {
          this.bossHealthBarBg.destroy();
          this.bossHealthBarBg = null;
        }
        if (this.bossHealthBar) {
          this.bossHealthBar.destroy();
          this.bossHealthBar = null;
        }
          this.bossActive = false;
        }

      // destroy and play explosion
      enemy.destroy();
      const ex = this.add.sprite(enemy.x, enemy.y, 'explosion')
        .setScale(enemy.texture.key === 'enemyBossPurple' ? 0.2 : 0.1);
      this.time.delayedCall(200, () => ex.destroy());
      this.explosionSound.play();

      // award points
      const pts = enemy.texture.key === 'enemyBossPurple'
        ? 1000
        : (enemy.texture.key === 'enemyBossRed' ? 150 : 80);
      this.updateScore(pts);

      // mark wave cleared so update() can advance
      this.waveCleared = false; 
    });

    //game over
    this.isGameOver = false;

    //player hit with bullet
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
        if (this.isGameOver) return;

    this.isGameOver = true;
    enemy.destroy();
    this.explosionSound.play();

    // Play explosion and hide player
    const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion').setScale(0.15);
    this.explosionSound.play();
    this.player.setVisible(false);

    // Pause physics and fade out
    this.physics.pause();
    this.cameras.main.fadeOut(1000);

    // Delay and then go to GameOverScene
    this.time.delayedCall(1500, () => {
    this.scene.start('GameOverScene');
        });
    });

    // player hit by enemy laser
    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
        if (this.isGameOver) return;

    this.isGameOver = true;
    bullet.destroy();
    this.explosionSound.play();

    const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion').setScale(0.15);
    this.player.setVisible(false);

    this.physics.pause();
    this.cameras.main.fadeOut(1000);

    this.time.delayedCall(1500, () => {
        this.scene.start('GameOverScene'); 
    });
    });


    // Stage screen
    this.stageText = this.add.text(this.scale.width / 2, this.scale.height / 2, '', {
      font: '32px Arial',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(10).setVisible(false);
    this.currentStage = 1;
    this.waveCleared = false;

    this.showStageScreen(this.currentStage); // Show "Stage 1"
    this.spawnWave(this.currentStage); // Spawn enemies for stage 1

    this.score = 0;
    this.highScore = 0; // You can load from localStorage later

    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      font: '20px Arial',
      fill: '#ffffff'
    }).setDepth(10);

    this.highScoreText = this.add.text(600, 20, 'HIGH SCORE: 0', {
      font: '20px Arial',
      fill: '#ffcc00'
    }).setDepth(10);

  }

  update() {
    // Background scroll
    this.bg.tilePositionY -= 1;

    // Player movement
    this.player.x = Phaser.Math.Clamp(this.player.x, 0, 1400);
    if (this.keys.left.isDown) {
      this.player.x -= 6;
    }
    if (this.keys.right.isDown) {
      this.player.x += 6;
    }

    // Shoot bullets
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.shoot) &&
      this.bullets.countActive(true) < 2 &&
      this.bulletCooldown === 0
    ) {
      this.bullets.create(this.player.x, this.player.y - 30, 'bullet')
        .setScale(0.045);
      this.bulletCooldown = this.bulletCooldownDelay;
      this.fireSound.play();
    }

    const remaining = this.enemies.countActive();
    this.enemyMoveDelay = Phaser.Math.Clamp(40 - remaining, 1, 10);

    this.enemyMoveTimer++;
if (this.enemyMoveTimer >= this.enemyMoveDelay) {
  let shouldReverse = false;

  if (this.enemies.getChildren().every(e => e.arrived && !e.isDiving)) {
    this.enemies.children.each(enemy => {
      enemy.x += this.enemyDirection * 1.5;

      // Diving attack logic
if (
  !enemy.isDiving &&
  enemy.arrived &&
  Math.random() < (enemy.texture.key === "enemyBossPurple" ? 0.0002 : 0.001)
)
 {
        enemy.isDiving = true;

        const targetX = this.player.x + Phaser.Math.Between(-50, 50);
        const targetY = this.scale.height + 100;

        this.physics.moveTo(enemy, targetX, targetY, 200);

        // Enemy fires during dive
        this.time.delayedCall(Phaser.Math.Between(300, 700), () => {
          if (enemy.active) {
            this.enemyBullets.create(enemy.x, enemy.y + 20, 'laser')
              .setScale(0.05)
              .setVelocityY(300);
          }
        });
      }

      if (enemy.isDiving && enemy.y > this.scale.height) {
        enemy.isDiving = false;
        enemy.setVelocity(0);
        enemy.y = enemy.originalY;
      }

      if (enemy.y > 650) {
        enemy.setVelocityY(0);
        enemy.setVelocityX(0);
        enemy.y = enemy.originalY;
      }

      if (enemy.x <= this.enemyBounds.left || enemy.x >= this.enemyBounds.right) {
        shouldReverse = true;
      }
    });

if (shouldReverse) {
  this.enemyDirection *= -1;
}

  }

  this.enemyMoveTimer = 0;
}

    // Cooldown decrement
    if (this.bulletCooldown > 0) {
      this.bulletCooldown--;
    }

    // Move bullets & destroy offscreen
    this.bullets.children.each(bullet => {
      bullet.y -= 16;
      if (bullet.y < 0) bullet.destroy();
    });

    // Add enemy bullet firing logic
this.enemies.children.each(enemy => {
  if (enemy.arrived && !enemy.isDiving && Math.random() < 0.0015 * this.currentStage) {
    this.enemyBullets.create(enemy.x, enemy.y + 20, 'laser')
      .setScale(0.05)
      .setVelocityY(350);
  }
});

    // Move enemy bullets & destroy offscreen
    this.enemyBullets.children.each(bullet => {
      if (bullet.y > this.scale.height) bullet.destroy();
    });

/*    if (this.enemies.countActive(true) === 0 && !this.waveCleared) {
      this.waveCleared = true;

      this.time.delayedCall(1000, () => {
        this.currentStage++;
        this.showStageScreen(this.currentStage);
        this.spawnWave(this.currentStage);
        this.waveCleared = false;
      });
    }
  } */
    if (this.enemies.countActive(true) === 0 && !this.waveCleared) {
      this.waveCleared = true;

      // wait 1 second, then bump the stage and spawn the correct thing
      this.time.delayedCall(1000, () => {
        this.currentStage++;
        this.showStageScreen(this.currentStage);

        if (this.currentStage % 3 === 0) {
          this.spawnBoss();
        } else {
          this.spawnWave(this.currentStage);
        }

        this.waveCleared = false;
      });
    }
    if (this.boss && this.bossHealthBar) {
      const offsetY = this.boss.displayHeight/2 + 10;
      const x = this.boss.x;
      const y = this.boss.y + offsetY;
      this.bossHealthBarBg.setPosition(x, y);
      this.bossHealthBar   .setPosition(x, y);
    }
  }

  updateScore(points) {
    this.score += points;

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.highScoreText.setText(`HIGH SCORE: ${this.highScore}`);
  }
}