/* jshint asi:true */
function makeGameID() {
  return Math.floor((1 + Math.random()) * 0x100000)
    .toString(16)
    .substring(1)
}

document.getElementById('newGame').addEventListener('click', function(evt) {
  var gameID = makeGameID()
  var tpl = document.importNode(document.getElementById('step2-new').content, true)
  tpl.querySelector('#gameID').textContent = gameID
  document.getElementById('lobby-step2').appendChild(tpl)

  document.getElementById('lobby-step1').className = 'hide'
  document.getElementById('lobby-step2').className = 'show'
  startGame(gameID)
})

document.getElementById('joinGame').addEventListener('click', function(evt) {
  var tpl = document.importNode(document.getElementById('step2-join').content, true)

  var gameIdInput = tpl.querySelector('#gameID')
  tpl.querySelector('#join').addEventListener('click', function(evt) {
    if(gameIdInput.value === '') {
      alert('Bitte die Spiel ID eingeben')
      return false
    }
    startGame(gameIdInput.value)
  })

  document.getElementById('lobby-step2').appendChild(tpl)

  document.getElementById('lobby-step1').className = 'hide'
  document.getElementById('lobby-step2').className = 'show'
})
