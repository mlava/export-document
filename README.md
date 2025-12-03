This extension allows you to export a page in your graph into many different formats.

**New:**
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
- solved nesting problem for conversion to PDF
  - up to 15 levels of nesting in Roam are now supported for PDFs; previously, the limit was 6
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
- fixed inclusion of linked references (finally)
- option to flatten only linked references (if included)
- right-click the page title to use the Extensions menu to export page
- solved nesting problem for conversion to pdf
  - up to 15 levels of nesting in Roam now supported
>>>>>>> Stashed changes
- visual indication of export process to reassure that 'something is happening'

*Previously:*
- Completely revised structure, removed external scripts, and now using a Pandoc server hosted on Heroku to convert files
- Many more conversion formats are now available (see below)
- Linked References inclusion is not yet working with this new version, and will be updated in future versions
- You can use Roam Research Hotkeys to trigger your file conversion

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
- Include Linked References
  - include the linked references section in the page export (leave off to exclude)
  - option to flatten only the Linked References section

This extension uses open source code originally written by (@TFTHacker)[https://twitter.com/TfTHacker] and maintained by (David Vargas)[https://github.com/dvargas92495] with their permission and blessing.

This extension calls a server I host on Heroku that runs Pandoc and Latex to allow conversion, and returns the converted file for you to download.

TODO:
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
- fix Linked References inclusion in converted file
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
- allow CSS to be sent to maintain Roam Research and user-defined styles
>>>>>>> Stashed changes

Notes:
- This extension crawls your page and then sends that data to a Heroku server for conversion. If your page is very long, the converted file might take a while to arrive. A visual indicator of the export process is now available. Some error handling and alerts will provide information, but if you aren't sure if there has been a problem or if the conversion is still processing, please check your browser console for errors.
