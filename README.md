This extension lets you **export** Roam pages into many document formats and **import** documents from your computer into Roam as new pages.

## Export

### Features

- Export from the **Command Palette** (all formats) or the **Page Context Menu** (right-click page title)
- Visual indicator during export so you know something is happening
- Up to 15 levels of nesting supported for PDFs (previously limited to 6)
- Include Linked References in the export, with optional flattening
- Augmented Headings support — H4–H6 headings are automatically exported when the [Augmented Headings](https://github.com/mlava/augmented-headings) extension is in use

### Supported export formats

- pdf
- docx
- epub
- rtf
- md
- gfm
- opendocument

### Settings (export)

Configure via Roam Depot Settings:

- **Exclude blocks with tag** — any block containing this tag will be excluded from the export (leave blank to include all blocks)
- **Flatten page hierarchy** — export all content justified to the left, with no indentation
- **Include Linked References** — append the linked references section to the export
- **Flatten Linked References** — flatten hierarchy only for the linked references section (independent of the main flatten setting)

## Import

### Features

- Import from the **Command Palette** ("Import Document into Graph…") or the **Page Context Menu** ("Import Document as child of this page")
- Picks any local file via a standard file dialog
- Creates a new Roam page with structure preserved as nested blocks, or appends as children of an existing page
- Native Roam heading styles (H1–H3) reproduced from source headings
- H4–H6 reproduced via the [Augmented Headings](https://github.com/mlava/augmented-headings) extension when installed (silent fallback to plain text otherwise)
- Pipe tables converted to native Roam `{{table}}` blocks with cell chains
- Page-title collision detection — a duplicate name gets an `(Imported YYYY-MM-DD)` suffix instead of overwriting

### Supported import formats

- docx (Microsoft Word)
- odt (OpenDocument Text)
- rtf (Rich Text Format)
- epub
- html / htm
- md (Markdown — pass-through normalisation)

PDF, PPTX, and XLSX are not supported in this version. The server returns a clear error if you select one.

### Behaviour

| Source element | Becomes in Roam |
|---|---|
| H1 | Page title (or top-level Roam H1 if it doesn't match the page title) |
| H2 / H3 | Nested blocks with native Roam H2 / H3 styles |
| H4 / H5 / H6 | Plain blocks (or Augmented Headings styles if that extension is installed) |
| Paragraph | Block under nearest heading |
| Bulleted list | Nested children — if the preceding paragraph ends with `:`, the list nests under that paragraph as a natural intro/items pair |
| Numbered list | Same as bulleted (Roam has no native ordered-list semantics) |
| Nested list (indented) | Multi-level child nesting via indentation |
| Blockquote | Single block per `>` run; multi-line quotes stay together |
| Fenced code block | Single block preserving the fence and language |
| Table | Roam `{{table}}` block with row chains |
| Inline `**bold**`, `*italic*`, `~~strike~~`, `` `code` `` | Preserved/converted to Roam syntax |
| Footnotes | Stripped from inline text; collected into a trailing `## Footnotes` section as child blocks |
| Images | Replaced with `[image: alt text]` placeholders (image content is not transferred) |

### Limitations

- Maximum file size: **10 MB**
- No image transfer — only alt text is preserved
- No undo / rollback — if an import goes wrong, delete the resulting page and try again
- Italics in the source are converted to Roam's `__italic__` syntax
- Bold paragraphs in Word documents that aren't styled as real headings won't become headings (use Word's Heading styles for proper hierarchy)

## Augmented Headings integration

If you have the [Augmented Headings](https://github.com/mlava/augmented-headings) extension installed alongside this one, both directions benefit:

- **Export**: H4, H5, H6 in your graph are emitted as proper headings in the output document
- **Import**: H4, H5, H6 in source documents are applied to imported blocks via the Augmented Headings tool

The integration is automatic and silent — there's nothing to configure. If Augmented Headings isn't installed, H4–H6 simply fall back to plain text on import.

## Shared settings

- **Hide Security Alert** — suppress the data-sharing confirmation dialog shown before exports and imports

## Extension Tools API

Other extensions can drive both directions programmatically via `window.RoamExtensionTools["export-document"]`.

### `ed_export` (read-only)

Exports a Roam page to a document file, downloaded to the user's browser.

```js
await window.RoamExtensionTools["export-document"].tools
  .find(t => t.name === "ed_export")
  .execute({ page_uid: "abc123", format: "docx" });
```

Parameters:
- `page_uid` (string, required) — UID of the Roam page to export
- `format` (string, required) — one of `docx`, `epub`, `gfm`, `md`, `opendocument`, `pdf`, `rtf`

Returns `{ success: true, filename }` or `{ error: "..." }`.

Settings (flatten, exclude tag, linked refs) are read from Roam Depot configuration.

### `ed_import` (mutating)

Imports a local document into the graph as a new page, or appends to an existing page. Opens a native file picker on invocation — cannot run fully headlessly.

```js
await window.RoamExtensionTools["export-document"].tools
  .find(t => t.name === "ed_import")
  .execute({});
```

Parameters (all optional):
- `target_page_title` (string) — override the page title derived from the document
- `parent_page_uid` (string) — append the imported content as children of this existing page/block instead of creating a new top-level page

Returns `{ success: true, pageTitle, pageUid, blocksCreated, filename }` or `{ error: "..." }`.

### `consentGiven` (boolean)

`window.RoamExtensionTools["export-document"].consentGiven` exposes whether the user has dismissed the security alert at least once. Other extensions can read this to skip a redundant consent prompt.

## Privacy and data handling

Both export and import send file content to a Heroku-hosted Pandoc/LaTeX server for conversion. The server is operated by the extension author and is not shared with third parties beyond Heroku's hosting infrastructure. A confirmation dialog is shown the first time you use either feature; you can disable it via the **Hide Security Alert** setting.

## Credits

This extension uses open source code originally written by [@TFTHacker](https://twitter.com/TfTHacker) and maintained by [David Vargas](https://github.com/dvargas92495) with their permission and blessing.

The conversion server runs [Pandoc](https://pandoc.org/) and [TinyTeX](https://yihui.org/tinytex/) on Heroku.

## Notes

For long pages or large documents, the conversion may take a few seconds — a visual indicator is shown while it runs. If something fails, an alert will tell you what went wrong. For unexpected issues, check your browser console for errors and report them on the GitHub repository.
