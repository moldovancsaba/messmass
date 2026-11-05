# Self-hosted Google Fonts

These WOFF2 subsets are the font files used by the Messmass admin font choices: Inter, Roboto, Poppins, Montserrat, and Pacifico. They are served from this app so a production build does not need to fetch Google Fonts from the network.

The CSS declarations and family variables live in `app/styles/local-google-fonts.css`. Keep that stylesheet's subset URLs in sync with the files in this directory when updating fonts. Each family is distributed under the SIL Open Font License; its license text is included in `licenses/`.

Sources: [Google Fonts](https://fonts.google.com/) and the [Google Fonts repository](https://github.com/google/fonts).
