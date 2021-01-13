;(function () {
  let basesprites = document.querySelectorAll('.basesprite')
  let info = document.querySelector('.info')

  function showInfo(ts, rect) {
    info.innerHTML = ''

    let title = document.createElement('div')
    title.className = 'title'
    title.textContent = `${ts} @${rect}`

    info.appendChild(title)

    for (let match of [
      ...document.querySelectorAll(
        `[data-tilesheet="${ts}"][data-rect="${rect}"]`
      )
    ]) {
      let id = document.createElement('div')
      id.className = 'id'
      id.textContent = match.getAttribute('data-id')

      info.appendChild(id)
    }

    info.style.display = 'block'
  }

  function hideInfo() {
    info.style.display = 'none'
  }

  for (let basesprite of basesprites) {
    basesprite.addEventListener('mouseenter', (e) => {
      showInfo(
        e.target.getAttribute('data-tilesheet'),
        e.target.getAttribute('data-rect')
      )
    })

    basesprite.addEventListener('mouseout', hideInfo)
  }
})()
