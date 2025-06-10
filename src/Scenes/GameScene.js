class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  preload() {
    this.load.image('capturedShip', 'assets/images/capturedShip.png');
    this.load.image('background', 'assets/images/background_tiled_vertical.png');
    this.load.image('player', 'assets/images/mainship.png');
    this.load.image('bullet', 'assets/images/player_laser.png');
    this.load.image('laser', 'assets/images/enemy_laser.png');
    this.load.image('safemarker', 'assets/images/spaceBuilding_015.png');
    this.load.image('enemyBee', 'assets/images/galaga_enemy_bee.png');
    this.load.image('enemyBossRed', 'assets/images/galaga_enemy_boss_red.png');
    this.load.image('enemyBossPurple', 'assets/images/galaga_enemy_boss_purple.png');
    this.load.image('explosion', 'assets/images/explosion.png');
    this.load.image('tractorBeam', 'assets/images/tractor_beam.png');

    this.load.audio('firing', 'assets/sfx/firing.mp3');
    this.load.audio('beingCaptured', 'assets/sfx/captured.mp3');
    this.load.audio('explosionSound', 'assets/sfx/kill.mp3');
    this.load.audio('bossEntrance', 'assets/sfx/bossEntrance.mp3');
    this.load.audio('beamShot', 'assets/sfx/beamShot.mp3');
    this.load.audio('beamCapture', 'assets/sfx/beamCapture.mp3');
    this.load.audio('bossDeath', 'assets/sfx/bossDeath.mp3');
    this.load.audio('stageClear', 'assets/sfx/challenge_clear.mp3');
    this.load.audio('miss', 'assets/sfx/miss.mp3');
    this.load.audio('mistakeMusic', 'assets/sfx/mistake_music.mp3');
    this.load.audio('ambientLoop', 'assets/sfx/ambient_loop.mp3');
    this.load.audio('nameEntryOthers', 'assets/sfx/name_entry_others.mp3');
    this.load.audio('stageFlag', 'assets/sfx/stage_flag.mp3');
  }

  spawnWave(stage) {
    const formation = [
      { type: 'enemyBossPurple', count: 4, yOffset: 0 },
      { type: 'enemyBossRed', count: 8, yOffset: 60 },
      { type: 'enemyBee', count: 8, yOffset: 120 },
      { type: 'enemyBee', count: 8, yOffset: 180 }
    ];

    const centerX = this.scale.width / 2;
    const spacingX = 100;
    const maxY = this.scale.height / 2; // Top third boundary (e.g., 266 for 800px height)

    formation.forEach((row, rowIndex) => {
      const startX = centerX - ((row.count - 1) * spacingX) / 2;
      const y = Math.min(50 + row.yOffset, maxY - 30); // Keep formation within top third

      for (let i = 0; i < row.count; i++) {
        const finalX = startX + i * spacingX + Phaser.Math.Between(-10, 10); // small random offset
        const spawnX = Phaser.Math.Between(-100, this.scale.width + 100);
        const spawnY = -Phaser.Math.Between(100, 300);

        const enemy = this.enemies.create(spawnX, spawnY, row.type)
          .setScale(0.06)
          .setOrigin(0.5);

        enemy.body.setSize(enemy.width * 0.6, enemy.height * 0.6, true);
        enemy.finalX = finalX;
        enemy.finalY = y;
        enemy.arrived = false;
        enemy.isDiving = false;
        enemy.health = (row.type === 'enemyBossPurple') ? 3 : 1;


this.tweens.add({
          targets: enemy,
          x: finalX,
          y: y,
          ease: 'Linear',
          delay: (i + rowIndex * 5) * 400,
          duration: 1000,
          onComplete: () => { enemy.arrived = true; }
        });

      }

    });

    this.enemyStepDown = 10 + stage * 3;
    this.enemySpeed = 20 + stage;
    this.enemyMoveDelay = Math.max(20 - stage * 2, 10);
    this.formationCenterX = centerX;
    this.formationCenterY = maxY / 2; // Center formation in top third (e.g., y=133)
    this.formationTimer = 0;
    this.formationMoveInterval = 5000; // Reposition every 5 seconds
  }

  spawnBoss() {
    this.enemies.clear(true, true);

    const maxY = this.scale.height / 3; // Top third boundary
    this.boss = this.enemies.create(this.scale.width / 2, 100, 'enemyBossPurple')
      .setScale(0.15)
      .setImmovable(true)
      .setOrigin(0.5);
      
      this.sfx.bossEntrance.play({ volume: 0.6 }); 
    
    const boss = this.boss;
    boss.health = 20;
    this.bossMaxHP = 20;
    this.bossCurrentHP = this.bossMaxHP;

    const offsetY = boss.displayHeight / 2 + 20;
    this.bossHealthBarBg = this.add
      .rectangle(boss.x, boss.y + offsetY, 80, 10, 0x444444)
      .setOrigin(0.5)
      .setDepth(9);
    this.bossHealthBar = this.add
      .rectangle(boss.x, boss.y + offsetY, 80, 10, 0xff0000)
      .setOrigin(0.5)
      .setDepth(10);

    boss.arrived = true;
    boss.isDiving = false;
    boss.setVelocityX(Phaser.Math.Between(60, 100));

    this.bossBounce = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!boss.body) return;
        if (boss.x <= 250 || boss.x >= this.scale.width - 250) {
          boss.setVelocityX(-boss.body.velocity.x);
        }
        // Keep boss in top third
        if (boss.y > maxY) {
          boss.y = maxY;
          boss.setVelocityY(0);
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
        this.enemyBullets.create(boss.x, boss.y + 20, 'laser')
          .setScale(0.05)
          .setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });
// Tractor beam
this.bossTractorBeam = this.time.addEvent({
  delay: 5000, // Activate every 5 seconds
  loop: true,
  callback: () => {
    if (!boss.active || !this.player.active || this.isInvincible) return;

    const oldVelocityX = boss.body.velocity.x;  // 1. Store old speed
    boss.setVelocityX(0);                       // 2. Stop boss movement

    // FIX: use `this.bossBeam`, not undefined `beam`
    this.bossBeam = this.add.image(boss.x, boss.y + 90, 'tractorBeam')
      .setScale(0.35, 0.8)
      .setOrigin(0.5, 0)
      .setAlpha(0)
      .setDepth(5);

    this.tweens.add({
      targets: this.bossBeam, // FIX: reference correctly
      alpha: 1,
      duration: 600,
      ease: 'Linear'
    });

    const pullDuration = 2000;
    const pullForce = 100;

    const pullInterval = this.time.addEvent({
      delay: 100,
      repeat: pullDuration / 100 - 1,
      callback: () => {
        if (!boss.active || !this.player.active || this.isInvincible) return;

        // Step 2: Kill player if beam and player intersect
        if (
          this.bossBeam &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            this.bossBeam.getBounds(),
            this.player.getBounds()
          )
        ) {
            this.sfx.beamShot.play({ volume: 0.5 }); 
            this.handlePlayerDeath(false);
            return;
        }

        // Pull toward boss if within range
        const distance = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        if (distance < 400) {
          const dx = boss.x - this.player.x;
          const dy = boss.y - this.player.y;
          const angle = Math.atan2(dy, dx);
          this.player.body.velocity.x += Math.cos(angle) * (pullForce / 10);
          this.player.body.velocity.y += Math.sin(angle) * (pullForce / 10);
        }
      }
    });

    // After pull finishes, destroy beam and restore boss movement
    this.time.delayedCall(pullDuration, () => {
      if (this.bossBeam) {
        this.bossBeam.destroy();
        this.bossBeam = null;
      }
      boss.setVelocityX(oldVelocityX);
    });
  }
});

this.bossActive = true;
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
    this.isGameOver = false;
    this.score = 0;
    this.highScore = 0;
    this.currentStage = 1;
    this.waveCleared = false;
    this.bossActive = false;
    this.lives = 3;
    this.isInvincible = false;
    this.isRespawning = false;
    this.maxActiveDivers = 3;
    this.diveDelay = 3000;
    this.sfx = {
        bossEntrance: this.sound.add('bossEntrance'),
        beamShot: this.sound.add('beamShot'),
        beamCapture: this.sound.add('beamCapture'),
        bossDeath: this.sound.add('bossDeath')
    };
    this.purpleDiveActive = false;
    this.sfx.beingCaptured = this.sound.add('beingCaptured');



    this.lifeIcons = [];

    const iconSpacing = 40;
    const iconYOffset = 20; // 20px from bottom
    const iconXOffset = 20; // 20px from left

    for (let i = 0; i < this.lives - 1; i++) {
      const icon = this.add.image(iconXOffset + i * iconSpacing, this.scale.height - iconYOffset, 'player')
        .setOrigin(0, 1)
        .setScale(0.035)
        .setAlpha(0.8)
        .setScrollFactor(0)
        .setDepth(20);
      this.lifeIcons.push(icon);
    }

    this.input.keyboard.on('keydown-THREE', () => {
      this.currentStage = 3;
      this.waveCleared = false;
      this.bossActive = false;

      this.enemies.clear(true, true);
      this.enemyBullets.clear(true, true);

      if (this.bossFire) {
        this.bossFire.remove();
        this.bossFire = null;
      }
      if (this.bossBounce) {
        this.bossBounce.remove();
        this.bossBounce = null;
      }
      if (this.bossHealthBar) {
        this.bossHealthBar.destroy();
        this.bossHealthBar = null;
      }
      if (this.bossHealthBarBg) {
        this.bossHealthBarBg.destroy();
        this.bossHealthBarBg = null;
      }
      if (this.boss) {
        this.sfx.bossDeath.play({ volume: 0.6 });
        this.boss.destroy();
        this.boss = null;
      }

      this.showStageScreen(3);
      this.time.delayedCall(2000, () => {
        this.spawnBoss();
      });
    });

    this.keys = this.input.keyboard.addKeys({
      left: 'A',
      right: 'D',
      shoot: 'SPACE',
      returnToTitle: 'T',
      play: 'P'
    });

    this.fireSound = this.sound.add('firing');
    this.explosionSound = this.sound.add('explosionSound');

    this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background')
      .setOrigin(0)
      .setScrollFactor(0);

    this.player = this.physics.add.sprite(400, 630, 'player').setScale(0.05);

    this.bullets = this.physics.add.group();
    this.bulletCooldown = 0;
    this.bulletCooldownDelay = 10;

    this.enemies = this.physics.add.group();
    this.scheduleDiveTimer = this.time.addEvent({
        delay: this.diveDelay,
        loop: true,
        callback: () => this.queueDive()
    });
    this.enemyDirection = 1;
    this.enemySpeed = 20;
    this.enemyStepDown = 10;
    this.enemyBounds = { left: 30, right: this.scale.width - 30 };
    this.enemyMoveTimer = 0;
    this.enemyMoveDelay = 30;
    this.formationCenterX = this.scale.width / 2;
    this.formationCenterY = this.scale.height / 6; // Center in top third
    this.formationTimer = 0;
    this.formationMoveInterval = 5000;

    this.enemyBullets = this.physics.add.group();

this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
  bullet.destroy();

  // Set default health if missing
  if (typeof enemy.health === 'undefined') {
    enemy.health = (enemy.texture.key === 'enemyBossPurple') ? 3 :
                   (enemy.texture.key === 'enemyBossRed') ? 2 : 1;
  }

  enemy.health--;

  const isBoss = enemy.texture.key === 'enemyBossPurple';
  const isCapturedEnemy = (enemy === this.capturedEnemyShip);

  if (isBoss) {
    this.bossCurrentHP--;
    if (this.bossHealthBar) {
      this.bossHealthBar.width = 80 * (this.bossCurrentHP / this.bossMaxHP);
    }
  }

  // Don't destroy if still alive
  if (enemy.health > 0) return;

  // Activate double ship if captured enemy ship is destroyed
  if (isCapturedEnemy) {
    this.activateDoubleShip();
    this.capturedEnemyShip = null;
  }

  enemy.destroy();

  // Boss UI cleanup
  if (isBoss) {
    this.bossActive = false;
    if (this.bossHealthBarBg) {
      this.bossHealthBarBg.destroy();
      this.bossHealthBarBg = null;
    }
    if (this.bossHealthBar) {
      this.bossHealthBar.destroy();
      this.bossHealthBar = null;
    }
  }

  const scale = isBoss ? 0.2 : 0.06;
  const ex = this.add.sprite(enemy.x, enemy.y, 'explosion').setScale(scale);
  this.time.delayedCall(200, () => ex.destroy());
  this.explosionSound.play();

  const points = isBoss ? 1000 :
                 enemy.texture.key === 'enemyBossRed' ? 150 :
                 isCapturedEnemy ? 500 : 80;  // Bonus points for captured ship
  this.updateScore(points);

  this.waveCleared = false;
});


    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!player.active || !enemy.active || this.isInvincible) return;
      enemy.destroy();
      this.handlePlayerDeath();
    });

    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
      if (!player.active || !bullet.active || this.isInvincible) return;
      bullet.destroy();
      this.handlePlayerDeath();
    });

    this.stageText = this.add.text(this.scale.width / 2, this.scale.height / 2, '', {
      font: '32px Arial',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(10).setVisible(false);

    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      font: '20px Arial',
      fill: '#ffffff'
    }).setDepth(10);

    this.highScoreText = this.add.text(600, 20, 'HIGH SCORE: 0', {
      font: '20px Arial',
      fill: '#ffcc00'
    }).setDepth(10);

    this.showStageScreen(this.currentStage);
    this.spawnWave(this.currentStage);
}

update() {
  if (this.isGameOver) return;

  // Scroll background
  this.bg.tilePositionY -= 1;

  // Player movement
  this.player.x = Phaser.Math.Clamp(this.player.x, 0, this.scale.width);
  if (this.keys.left.isDown) this.player.x -= 6;
  if (this.keys.right.isDown) this.player.x += 6;

// Shooting logic: classic Galaga-style, two bullets at a time
if (
  !this.isRespawning &&
  Phaser.Input.Keyboard.JustDown(this.keys.shoot) &&
  this.bullets.countActive(true) < (this.twinShipActive ? 4 : 2) &&
  this.bulletCooldown === 0
) {
  this.bullets.create(this.player.x, this.player.y - 30, 'bullet').setScale(0.045);

  if (this.twinShipActive && this.twinShip && this.player.active) {
    this.bullets.create(this.twinShip.x, this.twinShip.y - 30, 'bullet').setScale(0.045);
  }

  this.bulletCooldown = this.bulletCooldownDelay;
  this.fireSound.play();
}

// Decrease cooldown each frame
if (this.bulletCooldown > 0) {
  this.bulletCooldown--;
}


  // Bullet cleanup
  this.bullets.children.each(bullet => {
    bullet.y -= 16;
    if (bullet.y < 0) bullet.destroy();
  });

  this.enemyBullets.children.each(bullet => {
    if (bullet.y > this.scale.height) bullet.destroy();
  });

  // Top third Y bounds
  const maxY = this.scale.height / 3;

  // Move enemies
  this.enemyMoveTimer++;
  const remaining = this.enemies.countActive();
  this.enemyMoveDelay = Phaser.Math.Clamp(40 - remaining, 1, 10);

  if (this.enemyMoveTimer >= this.enemyMoveDelay) {
    let shouldReverse = false;

    // Movement, dive, and fire logic
    this.enemies.children.each(enemy => {
      if (!enemy.arrived || enemy.isDiving) return;

      // Oscillate around formation center
      const wobble = Phaser.Math.FloatBetween(1.5, 2.5); // vary speed
      enemy.x += this.enemyDirection * wobble;


      // Fire logic
      const fireChance = enemy.texture.key === 'enemyBee' ? 0.002 :
                        enemy.texture.key === 'enemyBossRed' ? 0.003 : 0.001;
        if (this.isRespawning) return;

        if (!enemy.isDiving && Math.random() < fireChance * this.currentStage) {
            const isPurple = enemy.texture.key === 'enemyBossPurple';
            const isRed = enemy.texture.key === 'enemyBossRed';

        // Freeze briefly
            const prevVX = enemy.body.velocity.x;
            const prevVY = enemy.body.velocity.y;
            enemy.setVelocity(0);

            this.time.delayedCall(600, () => {
                if (enemy.active) enemy.setVelocity(prevVX, prevVY);
            });

        if (isRed) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            const speed = 350;
            this.enemyBullets.create(enemy.x, enemy.y + 20, 'laser')
        .setScale(0.05)
        .setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        } else {
        this.enemyBullets.create(enemy.x, enemy.y + 20, 'laser')
      .setScale(0.05)
      .setVelocityY(350);
  }
}


      if (enemy.x <= this.enemyBounds.left || enemy.x >= this.enemyBounds.right) {
        shouldReverse = true;
      }
    });

    if (shouldReverse) this.enemyDirection *= -1;

    this.enemyMoveTimer = 0;
  }

  // Anti-overlap logic
  this.enemies.children.each(enemy => {

    this.enemies.children.each(other => {
    if (!enemy.arrived || enemy.isDiving) return;
      if (enemy === other || !other.arrived || other.isDiving) return;

      const dx = enemy.x - other.x;
      const dy = enemy.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 40) {
        const overlap = 40 - distance;
        const pushAngle = Math.atan2(dy, dx) + Phaser.Math.FloatBetween(-0.5, 0.5);
        const pushX = Math.cos(pushAngle) * (overlap / 2);
        const pushY = Math.sin(pushAngle) * (overlap / 2);

        enemy.x += pushX;
        enemy.y += pushY;
        other.x -= pushX;
        other.y -= pushY;
      }
    });
  });

  // Wave complete logic
  if (this.enemies.countActive(true) === 0 && !this.waveCleared) {
    this.waveCleared = true;
    this.time.delayedCall(1000, () => {
      this.currentStage++;
      this.showStageScreen(this.currentStage);
      if (this.currentStage % 3 === 0) {
        this.spawnBoss();
      } else {
        this.spawnWave(this.currentStage);
      }

      this.scheduleDiveTimer.delay = Math.max(1000, 3000 - this.currentStage * 200);

      this.waveCleared = false;
    });
  }

  // Boss HP bar follow
  if (this.boss && this.bossHealthBar) {
    const offsetY = this.boss.displayHeight / 2 + 10;
    const x = this.boss.x;
    const y = Math.min(this.boss.y + offsetY, maxY - 10);
    this.bossHealthBarBg.setPosition(x, y);
    this.bossHealthBar.setPosition(x, y);
  }


// Twin ship follows player
if (this.twinShipActive && this.twinShip && this.player.active) {
  this.twinShip.x = this.player.x + 40;
  this.twinShip.y = this.player.y;
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

queueDive() {
  if (this.isRespawning || this.bossActive || this.purpleDiveActive) return;

  const activeDivers = this.enemies.getChildren().filter(e => e.isDiving).length;
  if (activeDivers >= this.maxActiveDivers) return;

  const eligible = this.enemies.getChildren().filter(e =>
    e.active && e.arrived && !e.isDiving
  );

  if (eligible.length === 0) return;

  // Check for purple boss
  const purple = eligible.find(e => e.texture.key === 'enemyBossPurple');

  if (purple) {
    this.purpleDiveActive = true;
    purple.isDiving = true;

    const hoverY = this.scale.height / 2;
    const targetX = this.player.x;

    this.tweens.add({
      targets: purple,
      x: targetX,
      y: hoverY,
      duration: 2200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!purple.active) {
          this.purpleDiveActive = false;
          return;
        }

        this.triggerMiniBossBeam(purple);

        // After beam, return and allow diving
        this.time.delayedCall(3000, () => {
          if (purple.active) {
            this.tweens.add({
              targets: purple,
              x: purple.finalX,
              y: purple.finalY,
              duration: 1000,
              ease: 'Quad.easeIn',
              onComplete: () => {
                this.purpleDiveActive = false;
                purple.isDiving = false;
              }
            });
          } else {
            this.purpleDiveActive = false;
          }
        });
      }
    });

    return; // Only allow one purple dive at a time
  }

  // Otherwise normal dive for non-purple enemies
  Phaser.Utils.Array.Shuffle(eligible);
  const group = eligible.slice(0, Phaser.Math.Between(1, 2));

  group.forEach(enemy => {
    enemy.isDiving = true;

    const targetX = this.player.x + Phaser.Math.Between(-40, 40);
    const targetY = this.player.y + Phaser.Math.Between(-40, 40);

    this.tweens.add({
      targets: enemy,
      x: targetX,
      y: targetY,
      duration: 1800,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (enemy.active) {
          enemy.isDiving = false;
          this.tweens.add({
            targets: enemy,
            x: enemy.finalX,
            y: enemy.finalY,
            duration: 1000,
            ease: 'Quad.easeOut'
          });
        }
      }
    });

    this.time.delayedCall(Phaser.Math.Between(300, 500), () => {
      if (enemy.active) {
        this.enemyBullets.create(enemy.x, enemy.y + 20, 'laser')
          .setScale(0.05)
          .setVelocityY(300);
      }
    });
  });
}



handlePlayerDeath(captured = false) {
  this.lives--;

  this.explosionSound.play();
  const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion').setScale(0.15);
  this.player.setVisible(false);
  this.player.disableBody(true, true);
  this.time.delayedCall(400, () => explosion.destroy());

  if (captured) {
    this.sfx.beamShot.stop(); // Stop overlapping if already playing
    this.time.delayedCall(300, () => {
      this.spawnCapturedPlayerShip();
    });
  }


  if (this.lives <= 0) {
    this.isGameOver = true;
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene');
    });
  } else {
    const lostIcon = this.lifeIcons.pop();
    if (lostIcon) lostIcon.destroy();

    this.time.delayedCall(3000, () => {
      this.player.enableBody(true, this.scale.width / 2, 630, true, true);
      this.player.setVisible(true);
      this.isInvincible = true;
      this.isRespawning = true;

      this.tweens.add({
        targets: this.player,
        alpha: 0,
        yoyo: true,
        repeat: 10,
        duration: 100,
        onComplete: () => {
          this.player.setAlpha(1);
          this.isInvincible = false;
          this.isRespawning = false;
        }
      });
    });
  }
}


activateDoubleShip() {
  if (this.twinShipActive) {
    if (this.twinShipTimer) this.twinShipTimer.remove();
  } else {
    this.twinShip = this.physics.add.sprite(this.player.x + 40, this.player.y, 'player')
      .setScale(0.05)
      .setAlpha(0.6);
    this.twinShipActive = true;
  }

  this.twinShipTimer = this.time.delayedCall(15000, () => {
    if (this.twinShip) {
      this.twinShip.destroy();
      this.twinShip = null;
    }
    this.twinShipActive = false;
  });
}
triggerMiniBossBeam(purple) {
  if (!purple.active || !this.player.active) return;

  // Stop purple enemy temporarily
  const prevVelocity = { x: purple.body.velocity.x, y: purple.body.velocity.y };
  purple.setVelocity(0);

  // Create tractor beam
  const beam = this.add.image(purple.x, purple.y + 60, 'tractorBeam')
    .setScale(0.2, 0.6)
    .setOrigin(0.5, 0)
    .setAlpha(0)
    .setDepth(5);

  this.tweens.add({
    targets: beam,
    alpha: 1,
    duration: 400,
    ease: 'Linear'
  });

  const pullDuration = 2000;
  const pullForce = 80;

  const pullInterval = this.time.addEvent({
    delay: 100,
    repeat: pullDuration / 100 - 1,
    callback: () => {
      if (!purple.active || !this.player.active || this.isInvincible) return;

      // Check intersection with player
      if (beam && Phaser.Geom.Intersects.RectangleToRectangle(
        beam.getBounds(), this.player.getBounds())) {
        this.sfx.beamShot.play({ volume: 0.5 });
        this.handlePlayerDeath(true);
        return;
      }

      // Pull player towards purple enemy
      const distance = Phaser.Math.Distance.Between(purple.x, purple.y, this.player.x, this.player.y);
      if (distance < 350) {
        const angle = Math.atan2(purple.y - this.player.y, purple.x - this.player.x);
        this.player.body.velocity.x += Math.cos(angle) * (pullForce / 10);
        this.player.body.velocity.y += Math.sin(angle) * (pullForce / 10);
      }
    }
  });

  // Beam cleanup
  this.time.delayedCall(pullDuration, () => {
    if (beam) beam.destroy();
    purple.setVelocity(prevVelocity.x, prevVelocity.y);
  });
}
spawnCapturedPlayerShip() {
  if (this.capturedEnemyShip && this.capturedEnemyShip.active) return; // 🔒 Only one at a time

  const capturedX = this.scale.width / 2;
  const capturedY = 100;

  this.sfx.beingCaptured.play({ volume: 0.6 }); // ✅ Play sound

  this.capturedEnemyShip = this.enemies.create(capturedX, capturedY, 'capturedShip')
    .setScale(0.05)
    .setOrigin(0.5);

  this.capturedEnemyShip.body.setSize(
    this.capturedEnemyShip.width * 0.6,
    this.capturedEnemyShip.height * 0.6,
    true
  );

  this.capturedEnemyShip.arrived = true;
  this.capturedEnemyShip.isDiving = false;
  this.capturedEnemyShip.health = 2;

  this.capturedEnemyShip.finalX = capturedX;
  this.capturedEnemyShip.finalY = capturedY;

  if (this.boss && this.boss.body) {
    this.capturedEnemyShip.setVelocityX(this.boss.body.velocity.x);
  }
}
}