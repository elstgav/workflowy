# WorkFlowy Userscripts and Userstyles

Styles and features for my personal WorkFlowy setup.

## Scripts and Styles

<!-- ACTIVE_LIST -->

- [External Links Fix](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/external-links-fix/workflowy.external-links-fix.user.js)  
  When running WorkFlowy as a web app, ensures external links open in your default browser (vs. staying in the web app).

- [Focus Fix](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/focus-fix/workflowy.focus-fix.user.js)  
  Fix WorkFlowy lost focus

- [Open Link under cursor](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/open-link-under-cursor/workflowy.open-link-under-cursor.user.js)  
  Open links with a key command in WorkFlowy

- [Style Tweaks](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/styles/workflowy/workflowy.user.css)  
  Minimal style adjustments for WorkFlowy

<!-- /ACTIVE_LIST -->

### Deprecated

> [!WARNING]  
> These older scripts are kept around for reference, but they target older WorkFlowy behavior and may no longer work as expected. Install them only if you’re comfortable troubleshooting breakages yourself.

<!-- ARCHIVED_LIST -->

- [Ellipsis Fix](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/archive/ellipsis-fix/workflowy.ellipsis-fix.user.js)  
  Fix the ability to type an ellipsis character (`…`) in WorkFlowy

- [Find & Replace](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/archive/find-and-replace/workflowy.find-and-replace.user.js)  
  Adds a Find & Replace button to the search input.

- [Fixed Keyboard Navigation for Template Buttons](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/archive/template-focus-navigation/workflowy.template-focus-navigation.user.js)  
  Enables activating and navigating past template buttons via the keyboard.

- [Inline Code Formatting](https://raw.githubusercontent.com/elstgav/workflowy/main/dist/scripts/archive/inline-code-style/workflowy.inline-code-style.user.js)  
  Adds inline code formatting to WorkFlowy (e.g. `code`).

<!-- /ARCHIVED_LIST -->

## Installation

If you haven’t used these before:

- [Userscripts] are small bits of JavaScript that run on a site through an extension like [Tampermonkey][chrome-tampermonkey-ext].
- [Userstyles] are CSS overrides that restyle a site through an extension like [Stylus][chrome-stylus-ext].

To get set up, install the following extensions:

- Safari
  - [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)
- Chrome
  - [Tampermonkey (Userscripts)](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
  - [Stylus (Userstyles)](https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne)

### Setting up WorkFlowy as a desktop app

WorkFlowy has an [official desktop app for macOS and Windows](https://workflowy.com/download/). But if you want to customize it with your own userscripts and styles, you can install WorkFlowy as a web app instead, with support for all your current browser extensions:

- [Safari Web Apps](https://support.apple.com/en-us/104996)
- [Chrome Web Apps](https://support.google.com/chrome/answer/9658361)

## Feedback

If you have feedback, feature requests, or bug reports, please [open an issue](https://github.com/elstgav/workflowy/issues).

## Development

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `pnpm install`     | Install dependencies             |
| `pnpm build`       | Build the project                |
| `pnpm build:watch` | Auto-build as you make changes   |
| `pnpm check`       | Check for code/formatting errors |
| `pnpm fix`         | Auto-fix code/formatting         |

### WorkFlowy Extensions API

WorkFlowy exposes a JavaScript API through `window.WF`. For documentation, see the [WorkFlowy Extensions API](https://workflowy.com/#/8c9cb227d2d5).

[chrome-tampermonkey-ext]: https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
[safari-userscripts-ext]: https://apps.apple.com/us/app/userscripts/id1463298887
[chrome-stylus-ext]: https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne
[userscripts]: https://en.wikipedia.org/wiki/Userscript
[userstyles]: https://en.wikipedia.org/wiki/Stylish_(software)#Technical_details

### Contributing

Contributions welcome! Please [open an issue](https://github.com/elstgav/workflowy/issues) to discuss before [submitting a pull request](https://github.com/elstgav/workflowy/pulls).

All changes must pass the linting and formatting checks.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
