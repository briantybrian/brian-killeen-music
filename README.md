# Brian Killeen Music

Static site for [briankilleenmusic.ie](https://briankilleenmusic.ie) — plain HTML/CSS/JS, published with GitHub Pages.

## Run locally

```
npx serve .
```

## Publish

The site is served from the `main` branch root. Custom domain is set in `CNAME`.

At the domain registrar, point DNS at GitHub Pages:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `Brian-Aurelielanguages.github.io` |
