# Contributing to VoidLight

Thanks for your interest in improving VoidLight.

## Ways to contribute

- Report bugs (UI glitches, data loss cases, incorrect dice outcomes).
- Suggest features (new templates, more environments, exporting options).
- Improve documentation.
- Submit pull requests.

## Reporting bugs

When opening an issue, please include:

- What happened and what you expected.
- Steps to reproduce.
- Browser + version.
- OS.
- Screenshots or console errors (F12 → Console), if applicable.

## Pull requests

- Keep PRs focused on one feature or fix.
- Test save/load flows.
- Test Keeper Mode vs Player Mode.
- Avoid committing generated files, editor settings, or OS junk.

## Development setup

VoidLight is a static web app (no build step required).

- Open `index.html` directly in a browser, **or**
- Run a local server:
  - `python -m http.server 8000`
  - open `http://localhost:8000/`

## Project layout

```text
VoidLight/
├─ index.html
├─ app.js
├─ styles.css
├─ VoidLight_Companion_Universal.html
├─ README.md
├─ LICENSE
├─ CONTRIBUTING.md
├─ .gitignore
└─ docs/
   └─ VoidLight_User_Guide.md
```

## License

By contributing, you agree your contributions will be licensed under the MIT License.
