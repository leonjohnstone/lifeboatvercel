# First 100 Days of CrossFit.com Programming

Static GitHub Pages archive for `lifeboatplanner.com/first100/`.

## Files

- `index.html` — page markup with explicitly relative asset paths (`./styles.css`, `./data.js`, `./script.js`).
- `styles.css` — page styling.
- `data.js` — embedded local data for the 100 entries from 2001-02-10 through 2001-05-20.
- `script.js` — renders the archive and search.

## GitHub Pages placement

Place the files in a folder named `first100`:

```text
first100/
  index.html
  styles.css
  data.js
  script.js
```

Then visit:

```text
https://lifeboatplanner.com/first100/
```


## GitHub Pages asset paths

This build uses root-relative asset paths:

```html
<link rel="stylesheet" href="/first100/styles.css">
<script src="/first100/data.js"></script>
<script src="/first100/script.js"></script>
```

That avoids the common `/first100` vs `/first100/` trailing-slash problem on custom domains. Upload the files to a `first100` folder at the site root.
