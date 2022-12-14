This extension allows you to export a page in your graph into either .docx or .pdf format.

You can trigger an export by opening the Command Palette and selecting either 'Export as DOCX' or 'Export as PDF'. 

There are three configuration settings allowing you to:

- Exclude blocks with tag
  - define a tag that will mean any block containing this tag will not be included in the export (leave blank to exclude no blocks)
- Flatten page hierarchy
  - export all content justified to the left, with no indentation (leave off to keep indentation intact)
- Include Linked References
  - include the linked references section in the page export (leave off to exclude)

This extension uses open source code originally written by (@TFTHacker)[https://twitter.com/TfTHacker] and maintained by (David Vargas)[https://github.com/dvargas92495] with their permission and blessing.

This extension relies on external libraries to function. The extension author provides no warranty to their safety.

The following external scripts are used (all under MIT license):
- https://github.com/privateOmega/html-to-docx
- https://ekoopmans.github.io/html2pdf.js
