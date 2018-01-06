'use strict';

// =============================================================================
// Create Player (Hero)
// =============================================================================
window.Hero = class Hero extends window.Phaser.Sprite {
  constructor(game, prevHero) {
    super();
    let heroSprite;
    if(typeof(prevHero) === 'undefined') {
      let heroSpriteNum = this.getRandomIntInclusive(0,2);
      switch (heroSpriteNum) {
        case 0:
          heroSprite = 'hero';
          break;
        case 1:
          heroSprite = 'herodude';
          break;
        default:
          heroSprite = 'alxdna';
      }
    } else {
      heroSprite = prevHero.key;
    }
    window.Phaser.Sprite.call(this, game, 27, 523, heroSprite);
    // anchor
    this.anchor.set(0.5, 0.5);
    // physics properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    // animations
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps looped
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
    this.animations.add('die', [5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 5, 5], 15);
    // starting animation
    this.animations.play('stop');
    // setup talking and text
    let now = Date.now().toString();
    let text = typeof(prevHero) === 'undefined' ? 'user ' + now.substring(now.length - 3, now.length - 1) : prevHero.playerText._text;

    this.playerText = this.game.add.text(this.position.x - 20, this.position.y - 560, text, { fill: '#000000', fontSize: '15px', wordWrapWidth: 150, wordWrap: true, maxLines: 4, backgroundColor: 'white' });
    this.playerText.anchor.set(0.5);
    this.addChild(this.playerText);
    this.fixTextOffset();
  }

  getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }

  move(direction) {
    // guard
    if (this.isFrozen) { return; }
    const SPEED = 200;

    this.body.velocity.x = direction * SPEED;

    // update image flipping & animations
    if (this.body.velocity.x < 0) {
      this.scale.x = -1;
      this.playerText.scale.x = -1;
    } else if (this.body.velocity.x > 0) {
      this.scale.x = 1;
      this.playerText.scale.x = 1;
    }
  }

  jump() {
    // Hero jumping code
    const JUMP_SPEED = 600;
    const canJump = this.body.touching.down && this.alive && !this.isFrozen;
    // console.log({
    //   canJump: canJump,
    //   'this.body.touching.down': this.body.touching.down,
    //   'this.alive': this.alive,
    //   'this.isFrozen': this.isFrozen
    // });

    if (canJump || this.isBoosting) {
      this.body.velocity.y = -JUMP_SPEED;
      this.isBoosting = true;
      jumpVar = true;
    }
    return canJump;
  }

  talk(text) {
    this.playerText.setText(text);
    this.fixTextOffset();
  }

  fixTextOffset() {
    let style = this.playerText.getBounds();
    switch (style.height) {
      case 48:
        this.playerText.y = -52;
        break;
      case 72:
        this.playerText.y = -64;
        break;
      case 96:
        this.playerText.y = -76;
        break;
      default:
        this.playerText.y = -40;
    }
  }

  update() {
    // update sprite animation, if it needs changing
    const animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
      if(animationName === 'die') {
        this.animations.play(animationName).onComplete.addOnce(function () {
          this.game.state.restart(true, false, {level: this.level});
        }, this);
      } else {
        this.animations.play(animationName);
      }
    }
  }

  freeze() { // When player goes through door do animation and remove player
    this.body.enable = false;
    this.isFrozen = true;
  }

  die() {
    this.body.enable = false;
    this.isFrozen = true;
    this.alive = false;
  }

  bounce() {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
  }

  // returns the animation name that should be playing depending on
  // current circumstances
  _getAnimationName() {
    let name = 'stop'; // default animation
    if (this.isFrozen) {
      name = 'stop';
      if (!this.alive) {
        name = 'die';
      }
    } else if (this.body.velocity.y < 0) {
      name = 'jump';
    } else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
      name = 'fall';
    } else if (this.body.velocity.x !== 0 && this.body.touching.down) {
      name = 'run';
    }
    return name;
  }
};
