This extension allows you to export a page in your graph into many different formats.

**NEW:**
- Completely revised structure, removed external scripts and now using a Pandoc server hosted on Heroku to convert files
- Many more conversion formats are now available (see below)
- Linked References inclusion is not yet working with this new version, and will be updated in future versions
- you can use Roam Research Hotkeys to trigger your file conversion

There are Roam Depot configuration settings allowing you to:

- Exclude blocks with tag
  - define a tag that will mean any block containing this tag will not be included in the export (leave blank to exclude no blocks)
- Flatten page hierarchy
  - export all content justified to the left, with no indentation (leave off to keep indentation intact)
- Include Linked References - PENDING
  - include the linked references section in the page export (leave off to exclude)

This extension uses open source code originally written by (@TFTHacker)[https://twitter.com/TfTHacker] and maintained by (David Vargas)[https://github.com/dvargas92495] with their permission and blessing.

This extension calls a server I host on Heroku that runs Pandoc and Latex to allow conversion, and returns the converted file for you to download.

TODO:
- fix Linked References inclusion in converted file
- allow CSS to be sent to maintain Roam Research and user-defined styles