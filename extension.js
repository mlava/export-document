const config = {
    tabTitle: "Export & Import Documents",
    settings: [
        {
            id: "export-excludeTag",
            name: "Exclude blocks with tag",
            description: "If this Roam Research tag is anywhere in the block the block will not be included in the export",
            action: { type: "input", placeholder: "tag" },
        },
        {
            id: "export-flatten",
            name: "Flatten page hierarchy",
            description: "Remove indentation and justify all blocks to the left",
            action: { type: "switch" },
        },
        {
            id: "export-hideAlert",
            name: "Hide Security Alert",
            description: "Turn on to hide the data-sharing alert shown when exporting or importing documents interactively.",
            action: { type: "switch" },
        },
        {
            id: "export-consent-given",
            name: "Allow programmatic imports",
            description: "Allow other extensions (e.g. Chief of Staff) to trigger imports via the Extension Tools API. Enabling this confirms that imported file contents will be sent to a third-party server for conversion. Auto-enabled the first time you accept the security alert in an interactive import.",
            action: { type: "switch" },
        },
        {
            id: "export-linkedrefs",
            name: "Include Linked References",
            description: "Turn on to include Linked References in export",
            action: { type: "switch" },
        },
        {
            id: "export-linkedrefs-flatten",
            name: "Flatten Linked References",
            description: "Flatten hierarchy only for linked references",
            action: { type: "switch" },
        },
    ]
};
const FILENAME_FALLBACK = 'roam-export';

function onload({ extensionAPI }) {
    extensionAPI.settings.panel.create(config);

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as DOCX (.docx)",
        callback: () => exportFile({ extensionAPI }, "docx")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as ePub (.epub)",
        callback: () => exportFile({ extensionAPI }, "epub")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as Github Flavored Markdown (.gfm)",
        callback: () => exportFile({ extensionAPI }, "gfm")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as Markdown (.md)",
        callback: () => exportFile({ extensionAPI }, "md")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as Open Document Format (.opendocument)",
        callback: () => exportFile({ extensionAPI }, "opendocument")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as PDF (.pdf)",
        callback: () => exportFile({ extensionAPI }, "pdf")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Export Page as Rich Text Format (.rtf)",
        callback: () => exportFile({ extensionAPI }, "rtf")
    });

    extensionAPI.ui.commandPalette.addCommand({
        label: "Import Document into Graph…",
        callback: () => importFile({ extensionAPI })
    });

    if (roamAlphaAPI.ui.pageContextMenu?.addCommand) {
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as DOCX (.docx)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "docx", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as PDF (.pdf)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "pdf", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as Markdown (.md)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "md", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as Rich Text Format (.rtf)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "rtf", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as Open Document Format (.opendocument)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "opendocument", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as Github Flavored Markdown (.gfm)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "gfm", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Export Page as ePub (.epub)",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) exportFile({ extensionAPI }, "epub", pageUid);
                },
            }
        );
        roamAlphaAPI.ui.pageContextMenu.addCommand(
            {
                label: "Import Document as child of this page",
                callback: (ctx) => {
                    const pageUid = ctx?.["page-uid"];
                    if (pageUid) importFile({ extensionAPI }, { parentPageUid: pageUid });
                },
            }
        );
    }

    window.RoamExtensionTools = window.RoamExtensionTools || {};
    window.RoamExtensionTools["export-document"] = {
        name: "Export Document",
        version: "1.1",
        consentGiven:
            extensionAPI.settings.get("export-consent-given") === true ||
            extensionAPI.settings.get("export-hideAlert") === true,
        tools: [
            {
                name: "ed_export",
                description: "Export a Roam page to a document file. The file is downloaded to the user's browser. Settings (flatten, exclude tag, linked refs) are read from the extension's Roam Depot settings.",
                readOnly: true,
                parameters: {
                    type: "object",
                    properties: {
                        page_uid: {
                            type: "string",
                            description: "UID of the Roam page to export."
                        },
                        format: {
                            type: "string",
                            enum: ["docx", "epub", "gfm", "md", "opendocument", "pdf", "rtf"],
                            description: "Output file format."
                        }
                    },
                    required: ["page_uid", "format"]
                },
                execute: async ({ page_uid, format } = {}) => {
                    if (!page_uid) return { error: "page_uid is required." };
                    if (!format) return { error: "format is required." };
                    const validFormats = ["docx", "epub", "gfm", "md", "opendocument", "pdf", "rtf"];
                    if (!validFormats.includes(format)) return { error: `Invalid format. Must be one of: ${validFormats.join(", ")}` };
                    return await exportFile({ extensionAPI }, format, page_uid, { silent: true });
                }
            },
            {
                name: "ed_import",
                description: "Import a local document file (docx, odt, rtf, epub, html, md) into the Roam graph as a new page. Opens a file picker on invocation; cannot run headlessly. Creates blocks under a new page, or under an existing page if parent_page_uid is supplied.",
                readOnly: false,
                parameters: {
                    type: "object",
                    properties: {
                        target_page_title: {
                            type: "string",
                            description: "Optional. Override the page title derived from the document's first H1 heading or filename."
                        },
                        parent_page_uid: {
                            type: "string",
                            description: "Optional. If provided, imported content is created as children of this existing page/block instead of a new top-level page."
                        }
                    },
                    required: []
                },
                execute: async ({ target_page_title, parent_page_uid } = {}) => {
                    return await importFile({ extensionAPI }, {
                        targetPageTitle: target_page_title,
                        parentPageUid: parent_page_uid,
                        silent: true,
                    });
                }
            }
        ]
    };
}

function onunload() {
    delete window.RoamExtensionTools?.["export-document"];
    if (roamAlphaAPI.ui.pageContextMenu?.removeCommand) {
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as DOCX (.docx)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as PDF (.pdf)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as Markdown (.md)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as Rich Text Format (.rtf)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as Open Document Format (.opendocument)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as Github Flavored Markdown (.gfm)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Export Page as ePub (.epub)' });
        roamAlphaAPI.ui.pageContextMenu.removeCommand({ label: 'Import Document as child of this page' });
    }
}

async function exportFile({ extensionAPI }, format, explicitPageUid, { silent = false } = {}) {
    var excludeTag
    var includeLinkedRefs = false;
    var flattenH = false;
    var flattenLinkedRefs = false;
    var hideAlert = false;
    if (extensionAPI.settings.get("export-linkedrefs") == true) {
        includeLinkedRefs = true;
    }
    if (extensionAPI.settings.get("export-linkedrefs-flatten") == true) {
        flattenLinkedRefs = true;
    }
    if (extensionAPI.settings.get("export-excludeTag")) {
        excludeTag = "#" + extensionAPI.settings.get("export-excludeTag") + "";
    }
    if (extensionAPI.settings.get("export-flatten")) {
        flattenH = true;
    }
    if (extensionAPI.settings.get("export-hideAlert")) {
        hideAlert = true;
    }

    var startBlock;
    if (explicitPageUid) {
        console.info("Exporting explicit page UID:", explicitPageUid);
        const pageInfo = await getBlockInfoByUID(explicitPageUid, true);
        const pageNode = pageInfo?.[0]?.[0];
        if (!pageNode || !pageNode.children?.length) {
            if (silent) return { error: "Page has no blocks to export." };
            return alert("Page has no blocks to export.");
        }
        startBlock = pageNode.children[0].uid;
    } else {
        startBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
        if (typeof startBlock == 'undefined') { // no focused block
            var pageBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
            if (pageBlock != null) {
                var pageBlockInfo = await getBlockInfoByUID(pageBlock, true);
                startBlock = pageBlockInfo[0][0].children[0].uid;
            } else {
                var uri = window.location.href;
                const regex = /^https:\/\/roamresearch.com\/.+\/(app|offline)\/\w+$/; //today's DNP
                if (regex.test(uri)) { // this is Daily Notes for today
                    var today = new Date();
                    var dd = String(today.getDate()).padStart(2, '0');
                    var mm = String(today.getMonth() + 1).padStart(2, '0');
                    var yyyy = today.getFullYear();
                    pageBlock = "" + mm + "-" + dd + "-" + yyyy + "";
                    var pageBlockInfo = await getBlockInfoByUID(pageBlock, true);
                    startBlock = pageBlockInfo[0][0].children[0].uid;
                }
            }
        }
    }

    var blockUIDList = ['' + startBlock + ''];
    var rule = '[[(ancestor ?b ?a)[?a :block/children ?b]][(ancestor ?b ?a)[?parent :block/children ?b ](ancestor ?parent ?a) ]]';
    var query = `[:find  (pull ?block [:block/uid :block/string])(pull ?page [:node/title :block/uid])
                                 :in $ [?block_uid_list ...] %
                                 :where
                                  [?block :block/uid ?block_uid_list]
                                 [?page :node/title]
                                 (ancestor ?block ?page)]`;
    var results = await window.roamAlphaAPI.q(query, blockUIDList, rule);
    var pageTitle = results[0][1].title;
    var pageUID = results[0][1].uid;

    // render page content
    var page = await flatten(pageUID, excludeTag, flattenH);

    // optionally append linked references grouped by page
    if (includeLinkedRefs) {
        const linkedRefs = await buildLinkedReferencesSection(pageUID, excludeTag, flattenLinkedRefs);
        if (linkedRefs) {
            page = `${page}\n\n## Linked References\n${linkedRefs}`;
        }
    }

    if (silent) {
        return await getFile(page, format, true);
    } else if (hideAlert == false) {
        if (confirm("This extension sends data to an external server to process and create your file.\n\nPress OK to continue.\n\n(You can turn off this alert in Roam Depot Settings.)") == true) {
            getFile(page, format, false)
        }
    } else {
        getFile(page, format, false)
    }

    function showSpinner() {
        const existing = document.getElementById('roam-export-spinner');
        if (existing) return existing;
        const el = document.createElement('div');
        el.id = 'roam-export-spinner';
        el.style.cssText = `
    position: fixed; top:16px; right:16px; z-index:9999;
    padding:10px 14px; background:#111; color:#fff; border-radius:6px;
    box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:13px;
    display:flex; align-items:center; gap:8px;
  `;
        el.innerHTML = `<span class="dot" style="width:8px;height:8px;border-radius:50%;background:#0af;animation: pulse 1s infinite;"></span><span>Exporting…</span>`;
        const style = document.createElement('style');
        style.textContent = `@keyframes pulse {0%{opacity:0.2}50%{opacity:1}100%{opacity:0.2}}`;
        el.appendChild(style);
        document.body.appendChild(el);
        return el;
    }
    function hideSpinner() {
        const el = document.getElementById('roam-export-spinner');
        if (el) el.remove();
    }

    async function getFile(page, format, silent) {
        const spinner = silent ? null : showSpinner();
        const filename = buildFilename(pageTitle, format);
        const saveAsFn = (window.FileSaver && window.FileSaver.saveAs) ? window.FileSaver.saveAs : window.saveAs;
        try {
            const res = await fetch('https://roam-pandoc.herokuapp.com/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markdown: page, filetype: format, format: 'gfm' })
            });

            if (res.ok) {
                const blob = await res.blob();
                saveAsFn(blob, filename);
                if (silent) return { success: true, filename };
            } else {
                const text = await res.text();
                let errorMsg;
                if (res.status === 400) {
                    if (text.includes('expected application/json')) {
                        errorMsg = 'Export failed: bad request (content type must be application/json). Please refresh and try again.';
                    } else if (text.includes('unsupported input format')) {
                        errorMsg = 'Export failed: only GitHub Flavored Markdown exports are supported.';
                    } else if (text.includes('unsupported type')) {
                        errorMsg = 'Export failed: that output format is not supported.';
                    } else if (text.includes('Too deeply nested')) {
                        errorMsg = 'Export failed: page is too deeply nested for PDF. Try "Flatten page hierarchy" in settings.';
                    } else {
                        errorMsg = `Export failed (400): ${text || 'Invalid request'}`;
                    }
                } else {
                    errorMsg = `Export failed (${res.status}). Please try again.`;
                }
                if (silent) return { error: errorMsg };
                alert(errorMsg);
            }
        } catch (e) {
            console.error(e);
            if (silent) return { error: 'Export failed: network or server error.' };
            alert('Export failed: network or server error.');
        } finally {
            if (spinner) hideSpinner();
        }
    }
};

function buildFilename(title, format) {
    const safeTitle = (title || FILENAME_FALLBACK).replace(/[\\/:*?"<>|]/g, '-').trim() || FILENAME_FALLBACK;
    return `${safeTitle}.${format}`;
}

// All code below this point is open source code originally written by @TFTHacker (https://twitter.com/TfTHacker), maintained by David Vargas (https://github.com/dvargas92495), and modified a little by me with their permission and blessing.
async function flatten(uid, excludeTag, flattenH, baseLevel = 0) {
    var acc = { text: '' };
    var md = await iterateThroughTree(uid, markdownGithub, flattenH, excludeTag, baseLevel, acc);

    md = md.replaceAll('- [ ] [', '- [ ]&nbsp;&nbsp;['); //fixes odd issue of task and alis on same line
    md = md.replaceAll('- [x] [', '- [x]&nbsp;['); //fixes odd issue of task and alis on same line
    md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str, lnk) => {
        lnk = lnk.replace('youtube.com/', 'youtube.com/embed/');
        lnk = lnk.replace('youtu.be/', 'youtube.com/embed/');
        lnk = lnk.replace('watch?v=', '');
        return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`
    });

    //lATEX handling
    md = md.replace(/  \- (\$\$)/g, '\n\n$1'); //Latex is centered
    return (md);
}

async function iterateThroughTree(uid, formatterFunction, flatten, excludeTag, baseLevel = 0, acc) {
    var results = await getBlockInfoByUID(uid, true)
    await walkDocumentStructureAndFormat(results[0][0], baseLevel, formatterFunction, null, flatten, excludeTag, acc);
    return acc.text;
}

async function getBlockInfoByUID(uid, withChildren = false, withParents = false) {
    try {
        let q = `[:find (pull ?page
                     [:node/title :block/string :block/uid :block/heading :block/props
                      :entity/attrs :block/open :block/text-align :children/view-type
                      :block/order
                      ${withChildren ? '{:block/children ...}' : ''}
                      ${withParents ? '{:block/parents ...}' : ''}
                     ])
                  :in $ ?target-uid
                  :where [?page :block/uid ?target-uid]  ]`;
        var results = await window.roamAlphaAPI.q(q, uid);
        if (results.length == 0) return null;
        return results;
    } catch (e) {
        return null;
    }
}

async function walkDocumentStructureAndFormat(nodeCurrent, level, outputFunction, parent, flatten, excludeTag, acc) {
    if (typeof nodeCurrent.title != 'undefined') {          // Title of page
        outputFunction(nodeCurrent.title, nodeCurrent, 0, parent, flatten, excludeTag, acc);
    } else if (typeof nodeCurrent.string != 'undefined') { // Text of a block
        // check if there are embeds and convert text to that
        let blockText = nodeCurrent.string;
        // First: check for block embed
        blockText = blockText.replaceAll('\{\{embed:', '\{\{\[\[embed\]\]\:');
        let embeds = blockText.match(/\{\{\[\[embed\]\]\: \(\(.+?\)\)\}\}/g);
        //Test for block embeds
        if (embeds != null) {
            for (const e of embeds) {
                let uid = e.replace('{{[[embed]]: ', '').replace('}}', '');
                uid = uid.replaceAll('(', '').replaceAll(')', '');
                let embedResults = await getBlockInfoByUID(uid, true);
                try {
                    blockText = await blockText.replace(e, embedResults[0][0].string);
                    //test if the newly generated block has any block refs
                    blockText = await resolveBlockRefsInText(blockText);
                    outputFunction(blockText, nodeCurrent, level, parent, flatten, excludeTag, acc);
                    //see if embed has children
                    if (typeof embedResults[0][0].children != 'undefined' && level < 30) {
                        let orderedNode = await sortObjectsByOrder(embedResults[0][0].children)
                        for (let i in await sortObjectsByOrder(embedResults[0][0].children)) {
                            await walkDocumentStructureAndFormat(orderedNode[i], level + 1, (blockText, node, lvl, _p, _f, _e, acc) => {
                                outputFunction(blockText, node, lvl, parent, flatten, excludeTag, acc)
                            }, embedResults[0][0], flatten, excludeTag, acc)
                        }
                    }
                } catch (e) { }
            }
        } else {
            // Second: check for block refs
            blockText = await resolveBlockRefsInText(blockText);
            outputFunction(blockText, nodeCurrent, level, parent, flatten, excludeTag, acc);
        }
    }
    // If block/node has children nodes, process them
    if (typeof nodeCurrent.children != 'undefined') {
        let orderedNode = await sortObjectsByOrder(nodeCurrent.children)
        for (let i in await sortObjectsByOrder(nodeCurrent.children))
            await walkDocumentStructureAndFormat(orderedNode[i], level + 1, outputFunction, nodeCurrent, flatten, excludeTag, acc)
    }
}

function getAugmentedHeadingLevel(nodeCurrent) {
    try {
        let props = nodeCurrent.props;
        if (!props) return null;
        if (typeof props.toJS === "function") props = props.toJS();
        else if (typeof props.entries === "function") {
            try { props = Object.fromEntries(props.entries()); } catch { return null; }
        }
        if (typeof props !== "object") return null;
        for (const k of Object.keys(props)) {
            if (k.replace(/^:+/, "") === "ah-level") {
                const v = String(props[k] ?? "").trim().toLowerCase();
                if (v === "h4" || v === "h5" || v === "h6") return v;
            }
        }
    } catch { }
    return null;
}

async function markdownGithub(blockText, nodeCurrent, level, parent, flatten, excludeTag, acc) {
    if (flatten == true) {
        level = 0
    } else {
        level = level - 1;
    }

    if (nodeCurrent.title) { acc.text += '# ' + blockText; return; };

    //convert soft line breaks, but not with code blocks
    if (blockText.substring(0, 3) != '```') blockText = blockText.replaceAll('\n', '<br/>');

    if (nodeCurrent.heading == 1) blockText = '# ' + blockText;
    if (nodeCurrent.heading == 2) blockText = '## ' + blockText;
    if (nodeCurrent.heading == 3) blockText = '### ' + blockText;
    if (!nodeCurrent.heading) {
        const ahLevel = getAugmentedHeadingLevel(nodeCurrent);
        if (ahLevel === "h4") blockText = '#### ' + blockText;
        else if (ahLevel === "h5") blockText = '##### ' + blockText;
        else if (ahLevel === "h6") blockText = '###### ' + blockText;
    }
    // process todo's
    var todoPrefix = level > 0 ? '' : '- '; //todos on first level need a dash before them
    if (blockText.substring(0, 12) == '{{[[TODO]]}}') {
        blockText = blockText.replace('{{[[TODO]]}}', todoPrefix + '[ ]');
    } else if (blockText.substring(0, 8) == '{{TODO}}') {
        blockText = blockText.replace('{{TODO}}', todoPrefix + '[ ]');
    } else if (blockText.substring(0, 12) == '{{[[DONE]]}}') {
        blockText = blockText.replace('{{[[DONE]]}}', todoPrefix + '[x]');
    } else if (blockText.substring(0, 8) == '{{DONE}}') {
        blockText = blockText.replace('{{DONE}}', todoPrefix + '[x]');
    }

    try {
        blockText = roamMarkupScrubber(blockText, false);
    } catch (e) { }


    if (level > 0 && blockText.substring(0, 3) != '```') {
        //handle indenting (first level is treated as no level, second level treated as first level)
        if (parent["view-type"] == 'numbered') {
            acc.text += '    '.repeat(level - 1) + '1. ';
        } else {
            acc.text += '  '.repeat(level) + '- ';
        }
    } else { //level 1, add line break before
        blockText = '\n  ' + blockText;
    }

    // exclude tags
    if (excludeTag != null) {
        function escapeRegExp(excludeTag) {
            return excludeTag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');
        }
        excludeTag = escapeRegExp(excludeTag);
        var regex = new RegExp("(.*" + excludeTag + ".*)", "g");
        if (!blockText.match(regex)) {
            acc.text += blockText + '  \n';
        }
    } else {
        acc.text += blockText + '  \n';
    }
}

async function sortObjectsByOrder(o) {
    return o.sort(function (a, b) {
        return a.order - b.order;
    });
}

async function resolveBlockRefsInText(blockText) {
    let refs = blockText.match(/\(\(.+?\)\)/g);
    if (refs != null) {
        for (const e of refs) {
            let uid = e.replaceAll('(', '').replaceAll(')', '');
            let results = await getBlockInfoByUID(uid, false);
            if (results) blockText = blockText.replace(e, results[0][0].string);
        }
    }
    return blockText
}

function roamMarkupScrubber(blockText, removeMarkdown = true) {
    if (blockText.substring(0, 9) == "{{[[query" || blockText.substring(0, 7) == "{{query") return '';
    if (blockText.substring(0, 12) == "{{attr-table") return '';
    if (blockText.substring(0, 15) == "{{[[mentions]]:") return '';
    if (blockText.substring(0, 8) == ":hiccup " && blockText.includes(':hr')) return '---'; // Horizontal line in markup, replace it with MD
    blockText = blockText.replaceAll('{{TODO}}', 'TODO');
    blockText = blockText.replaceAll('{{[[TODO]]}}', 'TODO');
    blockText = blockText.replaceAll('{{DONE}}', 'DONE');
    blockText = blockText.replaceAll('{{[[DONE]]}}', 'DONE');
    blockText = blockText.replaceAll('{{[[table]]}}', '');
    blockText = blockText.replaceAll('{{[[kanban]]}}', '');
    blockText = blockText.replaceAll('{{mermaid}}', '');
    blockText = blockText.replaceAll('{{word-count}}', '');
    blockText = blockText.replaceAll(/\{\{(?:\[\[)?video(?:\]\])?:? ?.*?\}\}/g, '');
    blockText = blockText.replaceAll('{{date}}', '');
    blockText = blockText.replaceAll('{{diagram}}', '');
    blockText = blockText.replaceAll('{{POMO}}', '');
    blockText = blockText.replaceAll('{{slider}}', '');
    blockText = blockText.replaceAll('{{TaoOfRoam}}', '');
    blockText = blockText.replaceAll('{{orphans}}', '');
    blockText = blockText.replace('::', ':');                      // ::
    blockText = blockText.replaceAll(/\(\((.+?)\)\)/g, '$1');      // (())
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');      // [[ ]]  First run
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');      // [[ ]]  second run
    blockText = blockText.replaceAll(/\[\[(.+?)\]\]/g, '$1');      // [[ ]]  second run
    // blockText = blockText.replaceAll(/\$\$(.+?)\$\$/g, '$1');      // $$ $$
    // blockText = blockText.replaceAll(/\B\#([a-zA-Z]+\b)/g, '$1');  // #hash tag
    blockText = blockText.replaceAll(/\{\{calc: (.+?)\}\}/g, function (all, match) {
        try { return eval(match) } catch (e) { return '' }
    });
    // calc functions  {{calc: 4+4}}
    if (removeMarkdown) {
        blockText = blockText.replaceAll(/\*\*(.+?)\*\*/g, '$1');    // ** **
        blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, '$1');    // __ __
        blockText = blockText.replaceAll(/\^\^(.+?)\^\^/g, '$1');    // ^^ ^^
        blockText = blockText.replaceAll(/\~\~(.+?)\~\~/g, '$1');    // ~~ ~~
        blockText = blockText.replaceAll(/\!\[(.+?)\]\((.+?)\)/g, '$1 $2'); //images with description
        blockText = blockText.replaceAll(/\!\[\]\((.+?)\)/g, '$1');         //imags with no description
        blockText = blockText.replaceAll(/\[(.+?)\]\((.+?)\)/g, '$1: $2');   //alias with description
        blockText = blockText.replaceAll(/\[\]\((.+?)\)/g, '$1');           //alias with no description
        blockText = blockText.replaceAll(/\[(.+?)\](?!\()(.+?)\)/g, '$1');    //alias with embeded block (Odd side effect of parser)
    } else {
        blockText = blockText.replaceAll(/\_\_(.+?)\_\_/g, '\_$1\_');    // convert for use as italics _ _
    }
    return blockText;
}

async function buildLinkedReferencesSection(pageUID, excludeTag, flattenLinkedRefs) {
    const linkedRefs = await window.roamAlphaAPI.q(
        `[:find ?ref-uid ?ref-page-title
          :in $ ?page-uid
          :where
            [?page :block/uid ?page-uid]
            [?ref :block/refs ?page]
            [?ref :block/uid ?ref-uid]
            [?ref :block/page ?ref-page]
            [?ref-page :node/title ?ref-page-title]
            [(not= ?ref-page ?page)]]`,
        pageUID
    );

    if (!linkedRefs || linkedRefs.length === 0) return '';

    const refsByPage = linkedRefs.reduce((acc, [uid, title]) => {
        if (!acc[title]) acc[title] = new Set();
        acc[title].add(uid);
        return acc;
    }, {});

    let md = '';
    const orderedPages = Object.keys(refsByPage).sort((a, b) => a.localeCompare(b));
    for (const title of orderedPages) {
        md += `\n### ${title}\n`;
        for (const uid of Array.from(refsByPage[title])) {
            const refMarkdown = await formatTreeToMarkdown(uid, excludeTag, flattenLinkedRefs);
            if (refMarkdown.trim().length === 0) continue;
            md += `${refMarkdown}\n`;
        }
    }

    return md.trim();
}

async function formatTreeToMarkdown(uid, excludeTag, flattenH) {
    const depth = await getBlockDepth(uid);
    // add 1 so the immediate block renders as a first-level bullet and its children indent correctly
    return await flatten(uid, excludeTag, flattenH, depth + 1);
}

async function getBlockDepth(uid) {
    const result = await getBlockInfoByUID(uid, false, true);
    if (!result || !result[0] || !result[0][0]) return 0;
    let depth = 0;
    let current = result[0][0];
    // follow first parent chain until we reach the page (has title) or no parent
    while (current.parents && current.parents[0] && !current.parents[0].title) {
        depth += 1;
        current = current.parents[0];
    }
    return depth;
}

// ---------------------------------------------------------------------------
// Document import
// ---------------------------------------------------------------------------

const IMPORT_SERVER_URL = 'https://roam-pandoc.herokuapp.com/import';
const IMPORT_SUPPORTED_EXTENSIONS = ['docx', 'odt', 'rtf', 'epub', 'html', 'htm', 'md'];
const IMPORT_MAX_BYTES = 10 * 1024 * 1024;
const IMPORT_ACCEPT_ATTR = '.docx,.odt,.rtf,.epub,.html,.htm,.md';

async function importFile({ extensionAPI }, { targetPageTitle, parentPageUid, silent = false } = {}) {
    const hideAlert = extensionAPI.settings.get("export-hideAlert") === true;
    // Programmatic-import consent. Grandfather users who already enabled
    // "Hide Security Alert" — they've seen the disclosure at least once.
    const consentGiven =
        extensionAPI.settings.get("export-consent-given") === true || hideAlert;

    if (silent) {
        // Tool-driven imports must have explicit user consent because the
        // file picker isn't preceded by an interactive disclosure dialog.
        if (!consentGiven) {
            return {
                error:
                    "Document import via the Tools API requires consent. " +
                    "Open Export & Import Documents settings and enable " +
                    "'Allow programmatic imports', or run an interactive " +
                    "import once and accept the security alert.",
            };
        }
    } else if (!hideAlert) {
        const ok = confirm(
            "This extension sends the selected file to an external server to convert it for Roam.\n\n" +
            "Press OK to continue and choose a file.\n\n" +
            "(You can turn off this alert in Roam Depot Settings.)"
        );
        if (!ok) return { error: "User cancelled." };
        // Accepting the alert grants programmatic-import consent so that
        // tool-driven calls (e.g. from Chief of Staff) work without forcing
        // the user to flip a separate setting.
        if (extensionAPI.settings.get("export-consent-given") !== true) {
            try {
                extensionAPI.settings.set("export-consent-given", true);
            } catch (e) {
                console.warn("export-document: could not persist import consent", e);
            }
        }
    }

    let file;
    try {
        file = await pickFile();
    } catch (e) {
        console.error(e);
        const msg = "Could not open file picker.";
        if (silent) return { error: msg };
        alert(msg);
        return;
    }
    if (!file) {
        const msg = "No file selected. Import cancelled.";
        if (silent) return { error: msg };
        return;
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!IMPORT_SUPPORTED_EXTENSIONS.includes(ext)) {
        const msg = `Sorry, .${ext || '?'} files aren't supported yet. Supported: docx, odt, rtf, epub, html, md.`;
        if (silent) return { error: msg };
        alert(msg);
        return;
    }
    if (file.size > IMPORT_MAX_BYTES) {
        const msg = "That file is too large (max 10 MB).";
        if (silent) return { error: msg };
        alert(msg);
        return;
    }

    const spinner = silent ? null : showImportSpinner();
    try {
        const fd = new FormData();
        fd.append('file', file, file.name);
        fd.append('filename', file.name);

        let res;
        try {
            res = await fetch(IMPORT_SERVER_URL, { method: 'POST', body: fd });
        } catch (e) {
            console.error(e);
            const msg = "Could not reach the conversion server. Check your connection and try again.";
            if (silent) return { error: msg };
            alert(msg);
            return;
        }

        let body;
        try {
            body = await res.json();
        } catch (e) {
            const msg = `Import failed (${res.status}). The server returned an unexpected response.`;
            if (silent) return { error: msg };
            alert(msg);
            return;
        }

        if (!res.ok || body?.ok === false) {
            const serverMsg = body?.error || `Import failed (${res.status}).`;
            if (silent) return { error: serverMsg };
            alert(serverMsg);
            return;
        }

        const markdown = body.markdown || "";
        if (!markdown.trim()) {
            const msg = "Import failed: server returned empty content.";
            if (silent) return { error: msg };
            alert(msg);
            return;
        }

        let tree = markdownToBlockTree(markdown);
        // Per-block cleanup of escapes that had to be preserved through
        // parsing (e.g. "2\\." so it wasn't mistaken for a list item).
        unescapeTreeText(tree);
        // (A) If the first top-level block repeats the page title (either as
        // a real H1 or as a bold-wrapped paragraph that the server used as a
        // title fallback), unwrap its children and drop it.
        const serverTitle = (body.title || "").trim();
        if (serverTitle && tree.length) {
            const firstText = stripEmphasisMarkers(tree[0].text || "").trim();
            if (firstText && firstText === serverTitle) {
                const unwrapped = tree[0].children || [];
                tree = [...unwrapped, ...tree.slice(1)];
            }
        }
        if (!tree.length) {
            const msg = "Import failed: no content could be extracted from the document.";
            if (silent) return { error: msg };
            alert(msg);
            return;
        }

        let pageUid;
        let effectiveTitle;
        if (parentPageUid) {
            // Append under existing page/block; no new page is created.
            pageUid = parentPageUid;
            effectiveTitle = targetPageTitle || body.title || file.name;
        } else {
            const rawTitle = (targetPageTitle && targetPageTitle.trim())
                || (body.title && body.title.trim())
                || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
                || 'Imported Document';
            effectiveTitle = await resolveUniquePageTitle(rawTitle);
            pageUid = roamAlphaAPI.util.generateUID();
            try {
                await createPageCompat({ title: effectiveTitle, uid: pageUid });
            } catch (e) {
                console.error(e);
                const msg = `Import failed: could not create page "${effectiveTitle}".`;
                if (silent) return { error: msg };
                alert(msg);
                return;
            }
        }

        let blocksCreated;
        try {
            blocksCreated = await writeBlockTree(tree, pageUid, { appendToEnd: !!parentPageUid });
        } catch (e) {
            console.error(e);
            const msg = "Import failed while writing blocks into Roam. Some content may have been partially created.";
            if (silent) return { error: msg };
            alert(msg);
            return;
        }

        if (!silent) {
            showImportToast(`Imported “${effectiveTitle}” — ${blocksCreated} blocks created.`);
        }
        return {
            success: true,
            pageTitle: effectiveTitle,
            pageUid,
            blocksCreated,
            filename: file.name,
        };
    } finally {
        if (spinner) hideImportSpinner();
    }
}

function pickFile() {
    return new Promise((resolve, reject) => {
        let settled = false;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = IMPORT_ACCEPT_ATTR;
        input.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';

        const cleanup = () => {
            try { input.remove(); } catch (_) { /* noop */ }
        };
        const settleWith = (value) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };

        input.addEventListener('change', () => {
            const f = input.files && input.files[0] ? input.files[0] : null;
            settleWith(f);
        }, { once: true });
        input.addEventListener('cancel', () => settleWith(null), { once: true });

        // Safety net: some browsers never fire 'cancel'. After 5 minutes, give up.
        setTimeout(() => settleWith(null), 5 * 60 * 1000);

        document.body.appendChild(input);
        try {
            input.click();
        } catch (e) {
            cleanup();
            reject(e);
        }
    });
}

async function resolveUniquePageTitle(title) {
    const clean = title.trim() || 'Imported Document';
    if (!(await pageTitleExists(clean))) return clean;
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const base = `${clean} (Imported ${yyyy}-${mm}-${dd})`;
    if (!(await pageTitleExists(base))) return base;
    // Last resort: append a short random suffix.
    return `${base} ${Math.random().toString(36).slice(2, 6)}`;
}

async function pageTitleExists(title) {
    try {
        const escaped = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const q = `[:find ?uid :where [?p :node/title "${escaped}"] [?p :block/uid ?uid]]`;
        const res = await roamAlphaAPI.q(q);
        return Array.isArray(res) && res.length > 0;
    } catch (e) {
        console.warn('pageTitleExists query failed:', e);
        return false;
    }
}

async function createPageCompat({ title, uid }) {
    if (roamAlphaAPI?.data?.page?.create) {
        return await roamAlphaAPI.data.page.create({ page: { title, uid } });
    }
    if (typeof roamAlphaAPI?.createPage === 'function') {
        return await roamAlphaAPI.createPage({ page: { title, uid } });
    }
    throw new Error('No createPage API available on roamAlphaAPI.');
}

async function createBlockCompat({ parentUid, order, uid, string, heading }) {
    const block = { uid, string, open: true };
    if (heading === 1 || heading === 2 || heading === 3) {
        block.heading = heading;
    }
    const args = {
        location: { "parent-uid": parentUid, order },
        block,
    };
    if (roamAlphaAPI?.data?.block?.create) {
        return await roamAlphaAPI.data.block.create(args);
    }
    if (typeof roamAlphaAPI?.createBlock === 'function') {
        return await roamAlphaAPI.createBlock(args);
    }
    throw new Error('No createBlock API available on roamAlphaAPI.');
}

function resolveAugHeadingsSetTool() {
    try {
        const reg = window.RoamExtensionTools && window.RoamExtensionTools["augmented-headings"];
        if (!reg || !Array.isArray(reg.tools)) return null;
        const tool = reg.tools.find(t => t && t.name === "ah_set_heading_level");
        return tool && typeof tool.execute === "function" ? tool : null;
    } catch (e) {
        return null;
    }
}

async function writeBlockTree(nodes, parentUid, { appendToEnd = false } = {}) {
    // Resolve the Augmented Headings tool once per import so we can apply
    // H4-H6 styles to blocks whose source markdown used those levels.
    const augHeadingsSetTool = resolveAugHeadingsSetTool();
    return await writeBlockTreeInternal(nodes, parentUid, augHeadingsSetTool, appendToEnd);
}

async function writeBlockTreeInternal(nodes, parentUid, augHeadingsSetTool, appendToEnd) {
    let count = 0;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const uid = roamAlphaAPI.util.generateUID();
        // Top-level blocks under an existing page should append to the end so
        // the import doesn't shove them above the user's existing content.
        // Nested children are always created in freshly-made parent blocks
        // (which start with no children), so sequential ordering is correct.
        const order = appendToEnd ? "last" : i;
        await createBlockCompat({
            parentUid,
            order,
            uid,
            string: node.text || '',
            heading: node.heading,
        });
        count += 1;
        if (augHeadingsSetTool && (node.heading === 4 || node.heading === 5 || node.heading === 6)) {
            try {
                await augHeadingsSetTool.execute({ uid, level: `h${node.heading}` });
            } catch (e) {
                console.warn(`export-document: failed to apply augmented heading h${node.heading}`, e);
                // Non-fatal — the block exists, just without the augmented style.
            }
        }
        if (node.children && node.children.length) {
            count += await writeBlockTreeInternal(node.children, uid, augHeadingsSetTool, false);
        }
    }
    return count;
}

// ---- Markdown → block tree parser ------------------------------------------

function stripEmphasisMarkers(text) {
    // Strip surrounding bold/italic markers (**, __, *, _) up to 3 chars.
    // Used to compare a "bold-wrapped title paragraph" against the plain title
    // that the server extracted from the same line.
    return (text || '')
        .trim()
        .replace(/^[*_]{1,3}/, '')
        .replace(/[*_]{1,3}$/, '')
        .trim();
}

function parsePipeTable(tableLines) {
    // Returns an array of rows; each row is an array of trimmed cell strings.
    // Skips the delimiter row. Splits on `|` except where preceded by `\`
    // (pandoc-escaped pipes inside a cell).
    const rows = [];
    for (const line of tableLines) {
        if (/^\s*\|[-:|\s]+\|\s*$/.test(line)) continue;
        const parts = line.split(/(?<!\\)\|/);
        if (parts.length > 0 && parts[0].trim() === '') parts.shift();
        if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
        if (parts.length === 0) continue;
        rows.push(parts.map(p => p.trim()));
    }
    return rows;
}

function buildRoamTable(rows) {
    // Builds a Roam {{table}} block. Each row becomes a chain of
    // nested child blocks: cell1 -> cell2 -> cell3, so the chain heads
    // are the direct children of the table block.
    const table = { text: '{{table}}', children: [] };
    for (const row of rows) {
        if (row.length === 0) continue;
        let head = null;
        let tail = null;
        for (const cell of row) {
            const node = { text: cell, children: [] };
            if (head === null) {
                head = node;
                tail = node;
            } else {
                tail.children.push(node);
                tail = node;
            }
        }
        if (head) table.children.push(head);
    }
    return table;
}

function unescapeBlockText(text) {
    // Final per-block cleanup. The parser needs to see pandoc's escapes
    // intact so it correctly rejects e.g. "2\\." as an ordered-list marker
    // and "\\- foo" as a bullet, but once block types are decided we can
    // drop the backslashes for display.
    //
    // Preserves literal escaped backslashes ("\\\\" stays as "\\\\"). Skips
    // \*, \~, \`, \# — those could flip plain text into Roam emphasis/strike/
    // code/heading syntax at render time if the source actually contained
    // the literal characters.
    if (!text) return text;
    return text.replace(
        /\\\\|\\([-.+\[\](){}!|>$_])/g,
        (whole, ch) => whole === '\\\\' ? '\\\\' : ch
    );
}

function unescapeTreeText(nodes) {
    for (const node of nodes) {
        if (node.text) node.text = unescapeBlockText(node.text);
        if (node.children && node.children.length) unescapeTreeText(node.children);
    }
}

function markdownToBlockTree(markdown) {
    const lines = (markdown || '').replace(/\r\n?/g, '\n').split('\n');
    const root = { text: '', children: [] };
    const headingStack = [{ level: 0, node: root }];
    let listStack = [];
    // Tracks the parent node under which a run of pandoc-escaped "\- foo" /
    // "\+ foo" / "\* foo" paragraphs is being accumulated. Stays set across
    // blank lines so separated escaped-bullet paragraphs remain grouped, but
    // resets when any regular block is added at the heading level.
    let lastEscListParent = null;

    const headingParent = () => headingStack[headingStack.length - 1].node;

    const pushUnderHeading = (node) => {
        headingParent().children.push(node);
        listStack = [];
        lastEscListParent = null;
    };

    let i = 0;
    while (i < lines.length) {
        const rawLine = lines[i];
        const line = rawLine;

        // Blank line: reset list context and move on.
        if (line.trim() === '') {
            listStack = [];
            i += 1;
            continue;
        }

        // Heading (ATX, # through ######).
        const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            while (headingStack.length > 1 && headingStack[headingStack.length - 1].level >= level) {
                headingStack.pop();
            }
            const node = { text, children: [] };
            // Roam supports heading styles 1-3 natively; H4-H6 are applied
            // via the Augmented Headings extension if it's installed (the
            // writer detects it and calls ah_set_heading_level). Without
            // that extension, levels 4-6 fall back to plain text.
            if (level >= 1 && level <= 6) node.heading = level;
            headingParent().children.push(node);
            headingStack.push({ level, node });
            listStack = [];
            lastEscListParent = null;
            i += 1;
            continue;
        }

        // Fenced code block.
        const fenceMatch = line.match(/^(\s*)(```+|~~~+)(.*)$/);
        if (fenceMatch) {
            const fence = fenceMatch[2];
            const fenceLines = [line];
            i += 1;
            while (i < lines.length) {
                fenceLines.push(lines[i]);
                if (new RegExp('^\\s*' + fence[0] + '{' + fence.length + ',}\\s*$').test(lines[i])) {
                    i += 1;
                    break;
                }
                i += 1;
            }
            pushUnderHeading({ text: fenceLines.join('\n'), children: [] });
            continue;
        }

        // Pipe table: row followed by delimiter row. Convert to a native
        // Roam {{table}} block with cells laid out as nested-child chains.
        if (line.trim().startsWith('|')
            && i + 1 < lines.length
            && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
            const tableLines = [line];
            i += 1;
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i]);
                i += 1;
            }
            const rows = parsePipeTable(tableLines);
            if (rows.length > 0) {
                pushUnderHeading(buildRoamTable(rows));
            } else {
                // Fallback: if parsing produced nothing usable, keep the raw
                // pipe-table text as a single block so nothing is lost.
                pushUnderHeading({ text: tableLines.join('\n'), children: [] });
            }
            continue;
        }

        // Horizontal rule. Only dashes/asterisks — bare underscore runs from
        // docx are almost always form-fill fields, not intentional HRs.
        if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
            pushUnderHeading({ text: '---', children: [] });
            i += 1;
            continue;
        }

        // List item (unordered or ordered; both become plain nested children).
        const listMatch = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/);
        if (listMatch) {
            const indent = listMatch[1].length;
            const text = listMatch[2];
            while (listStack.length && listStack[listStack.length - 1].indent >= indent) {
                listStack.pop();
            }
            let parent;
            if (listStack.length) {
                parent = listStack[listStack.length - 1].node;
            } else {
                // Top-level list item: if the preceding sibling at this
                // heading level is a paragraph ending with a colon, treat
                // it as an intro and nest the list under it. (Word docs
                // overwhelmingly use "Intro:" followed by bullets to mean
                // "these bullets belong to this intro".) Strip trailing
                // emphasis markers so "**bold intro:**" also qualifies.
                const kids = headingParent().children;
                const preceding = kids.length > 0 ? kids[kids.length - 1] : null;
                const precedingText = (preceding?.text || '')
                    .trim()
                    .replace(/[*_]{1,3}\s*$/, '');
                if (preceding && /:\s*$/.test(precedingText)) {
                    parent = preceding;
                } else {
                    parent = headingParent();
                }
            }
            const node = { text, children: [] };
            parent.children.push(node);
            listStack.push({ indent, node });
            lastEscListParent = null;
            i += 1;
            continue;
        }

        // Escaped list-like paragraph: pandoc emits "\- foo" / "\+ foo" /
        // "\* foo" when a plain paragraph starts with a dash/plus/asterisk
        // (typed-dash bullets in Word, not real Word list styles). Promote
        // these into child blocks of the preceding sibling so they render as
        // nested bullets in Roam rather than as "- - foo" pseudo-lines.
        const escListMatch = line.match(/^\s*\\([-+*])\s+(.+)$/);
        if (escListMatch) {
            const text = escListMatch[2];
            let parent;
            if (lastEscListParent) {
                // Continue an existing run under the same parent.
                parent = lastEscListParent;
            } else {
                const kids = headingParent().children;
                parent = kids.length > 0 ? kids[kids.length - 1] : headingParent();
                lastEscListParent = parent;
            }
            parent.children.push({ text, children: [] });
            listStack = [];
            i += 1;
            continue;
        }

        // Blockquote — consume a run of consecutive '>' lines (including empty
        // '>' continuations) into a single block so multi-line quotes stay
        // together in Roam.
        if (/^\s*>\s?/.test(line)) {
            const quoteLines = [line.trim()];
            i += 1;
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].trim());
                i += 1;
            }
            pushUnderHeading({ text: quoteLines.join('\n'), children: [] });
            continue;
        }

        // Paragraph: join consecutive non-special lines into a single block.
        const paraLines = [line.trim()];
        i += 1;
        while (i < lines.length) {
            const peek = lines[i];
            if (peek.trim() === '') break;
            if (/^(#{1,6})\s+/.test(peek)) break;
            if (/^(\s*)(```+|~~~+)/.test(peek)) break;
            if (peek.trim().startsWith('|')) break;
            if (/^\s*(-{3,}|\*{3,})\s*$/.test(peek)) break;
            if (/^(\s*)(?:[-*+]|\d+\.)\s+/.test(peek)) break;
            if (/^\s*\\[-+*]\s+/.test(peek)) break;
            if (/^\s*>\s?/.test(peek)) break;
            paraLines.push(peek.trim());
            i += 1;
        }
        pushUnderHeading({ text: paraLines.join(' '), children: [] });
    }

    return root.children;
}

// ---- Import UI: spinner + toast (independent from the export spinner) ------

function showImportSpinner() {
    const existing = document.getElementById('roam-import-spinner');
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = 'roam-import-spinner';
    el.style.cssText = `
        position: fixed; top:16px; right:16px; z-index:9999;
        padding:10px 14px; background:#111; color:#fff; border-radius:6px;
        box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:13px;
        display:flex; align-items:center; gap:8px;
    `;
    el.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#0af;animation: roam-import-pulse 1s infinite;"></span><span>Importing…</span>`;
    const style = document.createElement('style');
    style.textContent = `@keyframes roam-import-pulse {0%{opacity:0.2}50%{opacity:1}100%{opacity:0.2}}`;
    el.appendChild(style);
    document.body.appendChild(el);
    return el;
}

function hideImportSpinner() {
    const el = document.getElementById('roam-import-spinner');
    if (el) el.remove();
}

function showImportToast(message) {
    const el = document.createElement('div');
    el.style.cssText = `
        position: fixed; top:16px; right:16px; z-index:9999;
        padding:10px 14px; background:#0a7d2b; color:#fff; border-radius:6px;
        box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:13px; max-width:360px;
    `;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch (_) { /* noop */ } }, 5000);
}

export default {
    onload: onload,
    onunload: onunload
};
