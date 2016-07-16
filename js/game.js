/* jshint asi:true */
/* jshint esnext:true */

/*
Labyrinth-Kacheln sind binär

     1
    ---
  8 - - 2
    ---
     4
*/

function startGame(gameID) {

  var game = null

  var socket = new WebSocket(`wss://schatzhoehle.herokuapp.com`)
  socket.onmessage = function(evt) {
    var msg = JSON.parse(evt.data)
    switch(msg.type) {
      case 'full':
        alert('Hoppla, das Spiel ist schon voll!')
        window.location.reload()
      break
      case 'start':
        document.getElementById("lobby").className = 'hide'
        document.getElementById("game").className = 'show'

        game = new Game(socket, gameID, msg.map, msg.role, msg.gems)
      break
      case 'scored':
        document.getElementById("score").textContent = msg.score
        game.setGemPos(msg.gemIndex, msg.newGemPos.x, msg.newGemPos.y)
      break
      case 'hit':
        document.getElementById("lifes").textContent = msg.lifes
      break
      case 'gameover':
        var score = document.getElementById("score").textContent
        var domNode = document.getElementById('game')
        document.body.removeChild(domNode)
        var tpl = document.importNode(document.getElementById('gameover').content, true)
        tpl.querySelector('#score').textContent = score
        document.body.appendChild(tpl)
      break
    }
  }
  socket.onopen = function() {
    socket.send(JSON.stringify({
      type: 'join',
      gameID: gameID
    }))
  }
}
