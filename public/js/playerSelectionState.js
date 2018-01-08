'use strict';

// =============================================================================
// Player selection state
// =============================================================================

window.PlayerSelectionState = {
  create() {
    // fade in  (from black)
    this.camera.flash('#000000');

    this.bgm = this.game.add.audio('bgm');
    this.bgm.loop = true;
    this.bgm.volume += 2;

    this.keySFX = this.game.add.audio('sfx:key');
    // create level entities and decoration
    this.game.add.image(0, 0, 'background');

    var bar = this.game.add.graphics();
    bar.beginFill(0x000000, 0.2);
    bar.drawRect(0, 200, this.game.width, 100);

    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };

    //  The Text is positioned at 0, 100
    this.menuText = this.game.add.text(0, 0, "Select your LOLBRO!", style);
    this.menuText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);

    //  We'll set the bounds to be from x0, y100 and be this.game.widthpx wide by 100px high
    this.menuText.setTextBounds(0, 200, this.game.width, 100);

    this.bgm.play();
    this.bgm.volume += 2;

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;

    this._spawnPlayer(window.PLAYERS[0], 0);
  },

  handleInput(hero) {
    if(!this.playerSelected) {
      hero.position.x = this.game.width / 2;
      hero.position.y = 370;
      this.playerSelected = hero;
      this.keySFX.play();
      this.menuText.setText('Loading...');
      // selects player
      hero.die();
    }
  },

  _spawnPlayer(player, index) {
    var INITPOS = this.game.width / (window.PLAYERS.length + 1);
    var hero = new window.Hero(this.game, {key: player.name, playerText: {_text:player.name}});
    this.game.add.existing(hero);
    hero.position.x = INITPOS * (index + 1);
    hero.position.y = 100;
    hero.isDemo = true;
    hero.inputEnabled = true;
    hero.input.useHandCursor = true;
    hero.events.onInputDown.add(this.handleInput, this);

    var nextIndex = index + 1;
    if(nextIndex < window.PLAYERS.length) {
      // stagger next player
      setTimeout(() => { this._spawnPlayer(window.PLAYERS[nextIndex], nextIndex); }, 500);
    }
  }
};
