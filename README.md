This extension allows you to export a page in your graph into many different formats.

## Features

- Export from the **Command Palette** (all formats) or **Page Context Menu** (right-click page title)
- Visual indicator during export so you know something is happening
- Up to 15 levels of nesting supported for PDFs (previously limited to 6)
- Include Linked References in the export, with optional flattening
- Extension Tools API for programmatic access from other extensions

## Supported file formats

- pdf
- docx
- epub
- rtf
- md
- gfm
- opendocument

## Settings

Configure via Roam Depot Settings:

- **Exclude blocks with tag** — any block containing this tag will be excluded from the export (leave blank to include all blocks)
- **Flatten page hierarchy** — export all content justified to the left, with no indentation
- **Hide Security Alert** — suppress the confirmation dialog before each export
- **Include Linked References** — append the linked references section to the export
- **Flatten Linked References** — flatten hierarchy only for the linked references section (independent of the main flatten setting)

## Extension Tools API

Other extensions can trigger exports programmatically via `window.RoamExtensionTools["export-document"]`. The `ed_export` tool accepts `page_uid` (string) and `format` (one of the supported formats above). Settings are read from Roam Depot configuration.

## Credits

This extension uses open source code originally written by [@TFTHacker](https://twitter.com/TfTHacker) and maintained by [David Vargas](https://github.com/dvargas92495) with their permission and blessing.

This extension calls a server hosted on Heroku that runs Pandoc and LaTeX to convert files, and returns the converted file for you to download.

## Notes

This extension crawls your page and then sends that data to a Heroku server for conversion. If your page is very long, the converted file might take a while to arrive. A visual indicator of the export process is now available. Some error handling and alerts will provide information, but if you aren't sure if there has been a problem or if the conversion is still processing, please check your browser console for errors.

