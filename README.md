# Ilgın İçözü Portfolio Website

Static one-page portfolio site built for GitHub Pages.

## Files

- `index.html` — page structure
- `styles.css` — layout and styling
- `script.js` — project content and rendering
- `assets/placeholders/` — placeholder graphics for entries you wanted to fill later

## Edit your project entries

Open `script.js`.

All portfolio content is stored in the `portfolioData` object near the top of the file.

### Replace a placeholder with your own GitHub-hosted video

1. Add your file to the repo, for example:
   - `assets/media/la-ruta.mp4`
2. In the related project object inside `script.js`:
   - change `media.type` to `"video-file"`
   - set `media.src` to your file path
   - optionally add `media.poster`
3. Update the `description`, `meta`, and `sourceUrl` fields.

Example:

```js
media: {
  type: "video-file",
  src: "assets/media/la-ruta.mp4",
  poster: "assets/media/la-ruta-poster.jpg",
  alt: "La ruta"
}
```

## Publish on GitHub Pages

1. Upload all files in this folder to your GitHub repository.
2. Go to your repository settings.
3. Open **Pages**.
4. Set the source to your main branch and the root folder.
5. Save.

GitHub will publish the page and give you the live URL.
