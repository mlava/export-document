This extension allows you to export a page in your graph into many different formats.

**New:**
- solved nesting problem for conversion to pdf
  - up to 15 levels of nesting in Roam now supported
- visual indication of export process to reassure that 'something is happening'

*Previously:*
- Completely revised structure, removed external scripts and now using a Pandoc server hosted on Heroku to convert files
- Many more conversion formats are now available (see below)
- Linked References inclusion is not yet working with this new version, and will be updated in future versions
- you can use Roam Research Hotkeys to trigger your file conversion

Supported file formats:
- pdf
- docx
- epub
- rtf
- md
- gfm
- opendocument

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

Notes:
- this extension crawls your page and then sends that data to a Heroku server for conversion. If your page is very long and/or the Heroku server has gone to sleep, it might be that the converted file takes a little while to arrive. Some error handling is built in, but if you aren't sure if there has been a problem or if the conversion is still processing, please check your browser console for errors.
