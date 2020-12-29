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
      let firstMatch = null
      let matchCount = 0

      for (let { element, keywords } of entries) {
        if (keywords.includes(query)) {
          matchCount++

          if (!firstMatch) {
            firstMatch = element
          }

          element.style.display = 'list-item'
        } else {
          element.style.display = 'none'
        }
      }

      noResults.style.display = matchCount > 0 ? 'none' : 'block'

      results.style.display = 'block'
      content.style.display = 'none'

      if (firstMatch && e.keyCode === 13) {
        firstMatch.querySelector('a').click()
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
