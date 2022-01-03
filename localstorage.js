/* eslint-disable no-console */

// WorkFlowy stores theme data in local storage.
// To get the dark theme, we just have to update userstorage.settings with `theme: 'dark'`

let settings = JSON.parse(localStorage.getItem('userstorage.settings'))

// Verify current settings…
console.table(settings)

localStorage.setItem('userstorage.settings', JSON.stringify({
  ...settings,

  theme: 'dark',
  font:  'system',
}))
