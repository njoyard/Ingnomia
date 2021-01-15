const TILEW = 32
const TILEH = 36

const state = {}

function elem(name, props = {}) {
  let e = document.createElement(name)

  if (props.class) {
    e.className = props.class
  }

  if (props.style) {
    for (let k in props.style) {
      e.style[k] = props.style[k]
    }
  }

  if (props.data) {
    for (let k in props.data) {
      e.dataset[k] = props.data[k]
    }
  }

  if (props.text) {
    e.textContent = props.text
  }

  return e
}

function setupUnusedSpots(ts, file, width, height) {
  let container = ts.querySelector('.tilesheet-container')

  for (let x = 0; x < width; x += TILEW) {
    for (let y = 0; y < height; y += TILEH) {
      let rect = `${x} ${y} ${TILEW} ${TILEH}`

      if (
        document.querySelector(
          `.basesprite[data-rect="${rect}"][data-tilesheet="${file}"]`
        )
      ) {
        continue
      }

      let unused = elem('div', {
        class: 'unused',
        data: { rect, tilesheet: file },
        style: { left: `${x}px`, top: `${y}px` }
      })

      setupUnusedEvents(unused)
      container.appendChild(unused)
    }
  }
}

function loadTilesheet(ts) {
  let file = ts.dataset.tilesheet

  return new Promise((resolve) => {
    let img = new Image()
    img.src = `assets/${file}`
    img.addEventListener('load', (e) => {
      let canvas = ts.querySelector('canvas')
      let ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      setupUnusedSpots(ts, file, img.width, img.height)
      resolve()
    })
  })
}

function showCode(code) {
  state.code.querySelector('code').textContent = code
  state.code.style.display = 'block'
}

async function copyCode() {
  await navigator.clipboard.writeText(
    state.code.querySelector('code').textContent
  )
}

function hideCode() {
  state.code.style.display = 'none'
}

function showInfo(ts, rect) {
  state.info.innerHTML = ''

  let title = elem('div', { class: 'title', text: `${ts} @${rect}` })
  state.info.appendChild(title)

  let hasBase = false

  for (let match of [
    ...document.querySelectorAll(
      `.basesprite[data-tilesheet="${ts}"][data-rect="${rect}"]`
    )
  ]) {
    let uses = match.dataset.uses
    uses = uses == '' ? [] : uses.split(',')

    let id = elem('div', { class: 'id', text: match.dataset.id })
    state.info.appendChild(id)

    for (let use of uses) {
      let u = elem('div', { class: 'use', text: use })
      state.info.appendChild(u)
    }

    hasBase = true
  }

  if (hasBase) {
    let a = elem('div', {
      class: 'action',
      text: 'Click to select'
    })

    state.info.appendChild(a)
  }

  for (let match of [
    ...document.querySelectorAll(
      `.unused[data-tilesheet="${ts}"][data-rect="${rect}"]`
    )
  ]) {
    let id = elem('div', { class: 'id', text: '<Unallocated>' })
    state.info.appendChild(id)

    if (state.selected) {
      let bsid = state.selected.dataset.id
      let a = elem('div', {
        class: 'action',
        text: `Click to move ${bsid} here`
      })

      state.info.appendChild(a)
    }
  }

  state.info.style.display = 'block'
}

function hideInfo() {
  state.info.style.display = 'none'
}

function selectTilesheet(delta) {
  let cur = state.tilesheet
  let index = state.tilesheets.indexOf(cur)
  let next =
    state.tilesheets[
      (index + delta + state.tilesheets.length) % state.tilesheets.length
    ]

  cur.style.display = 'none'
  next.style.display = 'block'

  state.tilesheet = next
}

function toggleOverlays() {
  document.body.classList.toggle('overlays')
}

function dumpBaseSprites() {
  let lines = []

  // Keep original DB ordering
  let sorted = [...document.querySelectorAll('.basesprite')].sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index)
  )

  for (let bs of sorted) {
    let id = bs.dataset.id
    let rect = bs.dataset.rect
    let ts = bs.dataset.tilesheet

    lines.push(
      `INSERT INTO "BaseSprites" ("ID","SourceRectangle","Tilesheet") VALUES ('${id}','${rect}','${ts}');`
    )
  }

  showCode(lines.join('\n'))
}

function dumpImageOps() {
  showCode(state.imageOps.join('\n'))
}

function selectBaseSprite(bs) {
  if (state.selected) {
    state.selected.classList.remove('selected')
  }

  state.selected = bs
  bs.classList.add('selected')
}

function cancelSelection() {
  if (state.selected) {
    state.selected.classList.remove('selected')
    state.selected = null
  }
}

function moveSelectedTo(unused) {
  if (state.selected) {
    let bs = state.selected

    let from_parent = bs.parentNode
    let from_ts = bs.dataset.tilesheet
    let from_rect = bs.dataset.rect
    let [from_left, from_top] = from_rect.split(' ')
    let from_canvas = from_parent.querySelector('canvas')
    let from_ctx = from_canvas.getContext('2d')
    let from_data = from_ctx.getImageData(from_left, from_top, TILEW, TILEH)

    let to_parent = unused.parentNode
    let to_ts = unused.dataset.tilesheet
    let to_rect = unused.dataset.rect
    let [to_left, to_top] = to_rect.split(' ')
    let to_canvas = to_parent.querySelector('canvas')
    let to_ctx =
      to_canvas === from_canvas ? from_ctx : to_canvas.getContext('2d')

    // Copy pixels
    to_ctx.putImageData(from_data, to_left, to_top)
    to_parent.parentNode.dataset.dirty = 'true'

    // Update and move basesprite element
    bs.dataset.tilesheet = to_ts
    bs.dataset.rect = to_rect
    bs.style.left = `${to_left}px`
    bs.style.top = `${to_top}px`
    bs.classList.add('moved')
    from_parent.removeChild(bs)
    to_parent.appendChild(bs)

    // Remove or update&move unused element
    to_parent.removeChild(unused)
    if (
      !document.querySelector(
        `.basesprite[data-rect="${from_rect}"][data-tilesheet="${from_ts}"]`
      )
    ) {
      // No more basesprite at from location, move unused there
      unused.dataset.tilesheet = from_ts
      unused.dataset.rect = from_rect
      unused.style.left = `${from_left}px`
      unused.style.top = `${from_top}px`
      from_parent.appendChild(unused)
    }

    state.imageOps.push(
      `# Copy sprite from ${from_ts}@${from_left},${from_top} to ${to_ts}@${to_left}x${to_top}`,
      `convert ${to_ts} \\( ${from_ts} -crop ${TILEW}x${TILEH}+${from_left}+${from_top} \\) -geometry +${to_left}+${to_top} -compose copy -composite ${to_ts}`
    )

    cancelSelection()
  }
}

function clearSprite() {
  if (state.hover) {
    if (state.hover.classList.contains('unused')) {
      let ts = state.tilesheet.dataset.tilesheet
      let [left, top] = state.hover.dataset.rect.split(' ')
      let canvas = state.tilesheet.querySelector('canvas')
      let ctx = canvas.getContext('2d')

      ctx.clearRect(left, top, TILEW, TILEH)
      state.tilesheet.dataset.dirty = 'true'

      state.imageOps.push(
        `# Clear sprite at ${ts}@${left},${top}`,
        `convert ${ts} \\( -size ${TILEW}x${TILEH} xc:none \\) -alpha set -geometry +${left}+${top} -compose copy -composite ${ts}`
      )
    }
  }
}

const KEYS = [
  // Tab => switch tilesheets
  { keyCode: 9, shift: true, handler: () => selectTilesheet(-1) },
  {
    keyCode: 9,
    shift: false,
    handler: () => selectTilesheet(1),
    button: '#tilesheet'
  },

  // Esc => cancel selection
  { keyCode: 27, shift: false, handler: cancelSelection, button: '#unselect' },

  // O => toggle color overlays
  { keyCode: 79, shift: false, handler: toggleOverlays, button: '#overlays' },

  // D => dump basesprites
  { keyCode: 68, shift: false, handler: dumpBaseSprites, button: '#dump' },

  // I => dump image ops
  { keyCode: 73, shift: false, handler: dumpImageOps, button: '#imgops' },

  // C => clear sprite under cursor
  { keyCode: 67, shift: false, handler: clearSprite, button: '#clear' }
]

function setupBasespriteEvents(basesprite) {
  basesprite.addEventListener('mouseenter', (e) => {
    state.hover = e.target
    showInfo(e.target.dataset.tilesheet, e.target.dataset.rect)
  })
  basesprite.addEventListener('mouseout', () => {
    state.hover = null
    hideInfo()
  })
  basesprite.addEventListener('click', (e) => selectBaseSprite(e.target))
}

function setupUnusedEvents(unused) {
  unused.addEventListener('mouseenter', (e) => {
    state.hover = e.target
    showInfo(e.target.dataset.tilesheet, e.target.dataset.rect)
  })
  unused.addEventListener('mouseout', () => {
    state.hover = null
    hideInfo()
  })
  unused.addEventListener('click', (e) => moveSelectedTo(e.target))
}

function setupUI() {
  let cur = state.tilesheets[0]
  cur.style.display = 'block'

  state.imageOps = []
  state.tilesheet = cur
  state.code = document.querySelector('.code')

  state.code.querySelector('#hide').addEventListener('click', hideCode)
  state.code.querySelector('#copy').addEventListener('click', copyCode)

  for (let { button, handler } of KEYS) {
    if (button) {
      document
        .querySelector(`.controls ${button}`)
        .addEventListener('click', handler)
    }
  }

  document.addEventListener('keydown', (e) => {
    let match = KEYS.find(
      (k) => k.keyCode === e.keyCode && k.shift === e.shiftKey
    )

    if (match) {
      e.preventDefault()
      match.handler()
    }
  })

  document.querySelector('.controls').style.display = 'block'
  document.querySelector('.loading').style.display = 'none'

  for (let basesprite of [...document.querySelectorAll('.basesprite')]) {
    setupBasespriteEvents(basesprite)
  }

  window.addEventListener('beforeunload', (e) => {
    let dirty = [...document.querySelectorAll('[data-dirty="true"]')].map(
      (t) => t.dataset.tilesheet
    )

    if (dirty.length) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
}

;(async function () {
  state.info = document.querySelector('.info')
  state.tilesheets = [...document.querySelectorAll('.tilesheet')]

  await Promise.all(state.tilesheets.map((ts) => loadTilesheet(ts)))
  setupUI()
})()
