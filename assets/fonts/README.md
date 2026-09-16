# Self-hosted fonts

These WOFF2 files are the Latin subsets used by the root pages. They are fetched from the official Google Fonts CSS distribution (`fonts.gstatic.com`) and correspond to the source families in the official Google Fonts repository:

- Newsreader: <https://github.com/google/fonts/tree/main/ofl/newsreader>
- IBM Plex Mono: <https://github.com/google/fonts/tree/main/ofl/ibmplexmono>
- Inter: <https://github.com/google/fonts/tree/main/ofl/inter>
- Space Grotesk: <https://github.com/google/fonts/tree/main/ofl/spacegrotesk>

Each family is distributed under the SIL Open Font License 1.1. The complete license texts are kept beside the font files as `OFL-*.txt`.

The root HTML pages reference `../assets/fonts.css` through the stylesheet path `assets/fonts.css`; no Google Fonts host is required at runtime. Hashes can be reproduced with:

```sh
sha256sum assets/fonts/*.woff2 assets/fonts/OFL-*.txt
```
