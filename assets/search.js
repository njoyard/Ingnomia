;(function init() {
  let input = document.querySelector('input[type="search"]')
  let queryDisplay = document.querySelector('.search-query')
  let results = document.querySelector('section.search-results')
  let noResults = document.querySelector('.no-results')
  let content = document.querySelector('section.content')

  let entries = [
    ...document.querySelectorAll('.search-results li[data-keywords]')
  ].map((e) => ({
    element: e,
    keywords: e.getAttribute('data-keywords').toLowerCase().replace(/ /g, '')
  }))

  function search(e) {
    let { value } = input

    if (value) {
      queryDisplay.textContent = value

      let query = value.toLowerCase().replace(/ /g, '')
      let lastMatch = null
      let matchCount = 0

      for (let { element, keywords } of entries) {
        if (keywords.includes(query)) {
          matchCount++
          lastMatch = element
          element.style.display = 'list-item'
        } else {
          element.style.display = 'none'
        }
      }

      noResults.style.display = matchCount > 0 ? 'none' : 'block'

      results.style.display = 'block'
      content.style.display = 'none'

      if (matchCount === 1 && e.keyCode === 13) {
        lastMatch.querySelector('a').click()
      }
    } else {
      results.style.display = 'none'
      content.style.display = 'block'
    }
  }

  input.value = ''
  input.addEventListener('keyup', search)
  input.addEventListener('change', search)
})()
