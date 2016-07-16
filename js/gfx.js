/* jshint asi:true */
var gfx = document.querySelector('canvas').getContext('2d')

var Game = function(socket, gameID, maze, role, gems) {
  gfx.fillStyle = 'black'
  gfx.fillRect(0, 0, 500, 500)

  gfx.strokeStyle = 'white'

  var promises = []
  var player = {x: 0, y: 0}, target = {x: 0, y: 0}, score = 0, lifes = 3, playerSprite = 1, invincible = 0
  var positions = {
    enemies: [],
    gems: gems
  }
  var TILES = [], GEM = null, ENEMIES = null, PLAYER = null

  this.setGemPos = function(i, x, y) {
    positions.gems[i].x = x
    positions.gems[i].y = y
  }

  function resetTargetForEnemy(i) {
    var x = Math.abs(positions.enemies[i].x.toFixed(0)), y = Math.abs(positions.enemies[i].y.toFixed(0))
    var dir = Math.floor(Math.random() * 4)
    switch(dir) {
      case 0:
        if(maze[y][x].top) {
          return resetTargetForEnemy(i) // try again
        }
      break
      case 1:
      if(maze[y][x].right) {
        return resetTargetForEnemy(i) // try again
      }
      break
      case 2:
      if(maze[y][x].bottom) {
        return resetTargetForEnemy(i) // try again
      }
      break
      case 3:
      if(maze[y][x].left) {
        return resetTargetForEnemy(i) // try again
      }
      break
    }
    positions.enemies[i].direction = dir
    positions.enemies[i].steps = 50
  }

  // Positions
  for(var i=0; i<4; i++) {
    var offX = (i%2) * 5
    var offY = Math.floor(i/2) * 5

    var eX = Math.floor(Math.random() * 5) + offX, eY = Math.floor(Math.random() * 5) + offY
    positions.enemies.push({
      x: eX,
      y: eY
    })
    resetTargetForEnemy(i)
  }

  promises.push(new Promise(function(resolve) {
    var playerImg = new Image()
    playerImg.onload = function() {
      resolve(playerImg)
    }
    playerImg.src = 'img/player.png'
  }))

  promises.push(new Promise(function(resolve) {
    var gemImg = new Image()
    gemImg.onload = function() {
      resolve(gemImg)
    }
    gemImg.src = 'img/gems.png'
  }))

  promises.push(new Promise(function(resolve) {
    var enemyImg = new Image()
    enemyImg.onload = function() {
      resolve(enemyImg)
    }
    enemyImg.src = 'img/enemies.png'
  }))

  for(var i=0; i<15; i++) {
    (function(t) {
      promises.push(new Promise(function(resolve, reject) {
        var img = new Image()
        img.onload = function() {
          resolve(img)
        }
        img.src = 'img/' + t + '.png'
      }))
    })(i)
  }

  function draw() {
    if(invincible !== 0 && Date.now() - invincible > 3000) invincible = 0

    gfx.fillRect(0, 0, 500, 500)

    // Maze
    if(role === 'navigator') {
      for(var y=0; y<10; y++) {
        for(var x=0; x<10; x++) {
          var tileNum = (maze[y][x].top ? 1: 0)
                      + (maze[y][x].right ? 2 : 0)
                      + (maze[y][x].bottom ? 4 : 0)
                      + (maze[y][x].left ? 8 : 0)

          gfx.drawImage(TILES[tileNum], x * 50, y * 50)
        }
      }
    }

    // Grid
    gfx.beginPath()
    for(var i=0; i<10; i++) {
      gfx.moveTo(  0, i * 50)
      gfx.lineTo(500, i * 50)
      gfx.moveTo(i * 50,   0)
      gfx.lineTo(i * 50, 500)
    }
    gfx.stroke()

    // Gems & enemies
    for(var i=0; i<4; i++) {
      var offX = (i%2) * 5 * 50
      var offY = Math.floor(i/2) * 5 * 50
      if(role === 'navigator') gfx.drawImage(GEM, i * 24, 0, 24, 24, positions.gems[i].x * 50 + 13, positions.gems[i].y * 50 + 13, 24, 24)
      else {
        gfx.drawImage(ENEMIES, i * 24, 0, 24, 24, positions.enemies[i].x * 50 + 13, positions.enemies[i].y * 50 + 13, 24, 24)
        if(player.x.toFixed(0) == positions.gems[i].x && player.y.toFixed(0) == positions.gems[i].y) {
             // respawn gem and increase score
             positions.gems[i].x = Math.floor(Math.random() * 5) + offX
             positions.gems[i].y = Math.floor(Math.random() * 5) + offY
             score += 20 * parseInt(i+1, 10)
             socket.send(JSON.stringify({
               type: 'scored',
               gameID: gameID,
               score: score,
               gemIndex: i,
               newGemPos: positions.gems[i]
             }))
             document.getElementById("score").textContent = score
        }

        if(invincible === 0 && player.x.toFixed(0) == positions.enemies[i].x.toFixed(0) && player.y.toFixed(0) == positions.enemies[i].y.toFixed(0)) {
          // adjust lives, broadcast & make invincible for a limited amount of time
          invincible = Date.now()
          lifes--
          if(lifes === 0) {
            socket.send(JSON.stringify({
              gameID: gameID,
              type: 'gameover'
            }))

            var tScore = parseInt(document.getElementById("score").textContent, 10)
            var game = document.getElementById('game')
            document.body.removeChild(game)
            var tpl = document.importNode(document.getElementById('gameover').content, true)
            tpl.querySelector('#score').textContent = tScore
            document.body.appendChild(tpl)

            return
          }
          socket.send(JSON.stringify({
            type: 'hit',
            gameID: gameID,
            lifes: lifes
          }))
          document.getElementById("lifes").textContent = lifes
        }

        if(positions.enemies[i].steps == 0) {
          resetTargetForEnemy(i)
        }
        switch(positions.enemies[i].direction) {
          case 0:
            positions.enemies[i].y -= 0.02
            positions.enemies[i].steps--
          break
          case 1:
            positions.enemies[i].x += 0.02
            positions.enemies[i].steps--
          break
          case 2:
            positions.enemies[i].y += 0.02
            positions.enemies[i].steps--
          break
          case 3:
            positions.enemies[i].x -= 0.02
            positions.enemies[i].steps--
          break
        }
      }
    }

    // Player
    if(role === 'collector') gfx.drawImage(PLAYER,playerSprite * 16, 0, 16, 17, player.x * 50 + 13, player.y * 50 + 13, 16, 17)

    if(player.x.toFixed(1) < target.x.toFixed(1)) player.x += 0.1
    else if(player.x.toFixed(1) > target.x.toFixed(1)) player.x -= 0.1

    if(player.y.toFixed(1) < target.y.toFixed(1)) player.y += 0.1
    else if(player.y.toFixed(1) > target.y.toFixed(1)) player.y -= 0.1

    if(player.x < 0) player.x = 0
    else if(player.x > 9) player.x = 9

    if(player.y < 0) player.y = 0
    else if(player.y > 9) player.y = 9

    requestAnimationFrame(draw)
  }

  document.querySelector('canvas').addEventListener('click', function(evt) {
    var tileX = (evt.offsetX / 50).toFixed(0), tileY = (evt.offsetY / 50).toFixed(0)

    if(tileX < player.x.toFixed(0)) {
      playerSprite = 2
      if(maze[player.y.toFixed(0)][player.x.toFixed(0)].left) return
      target.x = player.x - 1
      return
    } else if(tileX > player.x.toFixed(0)) {
      playerSprite = 3
      if(maze[player.y.toFixed(0)][player.x.toFixed(0)].right) return
      target.x = player.x + 1
      return
    }

    if(tileY < player.y.toFixed(0)) {
      playerSprite = 0
      if(maze[player.y.toFixed(0)][player.x.toFixed(0)].top) return
      target.y = player.y - 1
      return
    } else if(tileY > player.y.toFixed(0)) {
      playerSprite = 1
      if(maze[player.y.toFixed(0)][player.x.toFixed(0)].bottom) return
      target.y = player.y + 1
      return
    }
  })

  window.addEventListener('keyup', function(evt) {
    switch(evt.keyCode) {
      case 37:
        playerSprite = 2
        if(maze[player.y.toFixed(0)][player.x.toFixed(0)].left) return
        target.x = player.x - 1
      break
      case 38:
        playerSprite = 0
        if(maze[player.y.toFixed(0)][player.x.toFixed(0)].top) return
        target.y = player.y - 1
      break
      case 39:
        playerSprite = 3
        if(maze[player.y.toFixed(0)][player.x.toFixed(0)].right) return
        target.x = player.x + 1
      break
      case 40:
        playerSprite = 1
        if(maze[player.y.toFixed(0)][player.x.toFixed(0)].bottom) return
        target.y = player.y + 1
      break
    }
  })

  Promise.all(promises).then(function(imgs) {
    PLAYER = imgs.shift()
    GEM = imgs.shift()
    ENEMIES = imgs.shift()
    TILES = imgs
    draw()
  })
}
