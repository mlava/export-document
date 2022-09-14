import HTMLtoDOCX from 'html-to-docx/dist/html-to-docx.esm.js';
import html2pdf from 'html2pdf.js';

const config = {
    tabTitle: "Export Documents",
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
            id: "export-linkedrefs",
            name: "Include Linked References",
            description: "Turn on to include Linked References in export",
            action: { type: "switch" },
        },
    ]
};
var output = '';

function onload({ extensionAPI }) {
    extensionAPI.settings.panel.create(config);

    window.roamAlphaAPI.ui.commandPalette.addCommand({
        label: "Export as DOCX",
        callback: () => exportDOCX({ extensionAPI })
    });

    window.roamAlphaAPI.ui.commandPalette.addCommand({
        label: "Export as PDF",
        callback: () => exportPDF({ extensionAPI })
    });
}

function onunload() {
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: 'exportDOCX'
    });
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: 'exportPDF'
    });
}

async function exportDOCX({ extensionAPI }) {
    output = '';
    var excludeTag
    var includeLinkedRefs = false;
    var flattenH = false;
    if (extensionAPI.settings.get("export-linkedrefs") == true) {
        includeLinkedRefs = true;
    }
    if (extensionAPI.settings.get("export-excludeTag")) {
        excludeTag = "#" + extensionAPI.settings.get("export-excludeTag") + "";
    }
    if (extensionAPI.settings.get("export-flatten")) {
        flattenH = true;
    }

    var startBlock;
    startBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (typeof startBlock == 'undefined') { // no focused block
        var pageBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
        var pageBlockInfo = await getBlockInfoByUID(pageBlock, true);
        startBlock = pageBlockInfo[0][0].children[0].uid;
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

    var page = await flatten(pageUID, excludeTag, flattenH);
    if (includeLinkedRefs == true) {
        var list = document.getElementsByClassName("rm-reference-container");
        if (list.length) {
            page = page.replace("</body>", "<br><hr><br>" + list[0].innerHTML + "</body>")
        }
    }

    var converted = await HTMLtoDOCX(page);
    window.saveAs(converted, pageTitle + '.docx');
};

async function exportPDF({ extensionAPI }) {
    output = '';
    var excludeTag
    var includeLinkedRefs = false;
    var flattenH = false;
    if (extensionAPI.settings.get("export-linkedrefs") == true) {
        includeLinkedRefs = true;
    }
    if (extensionAPI.settings.get("export-excludeTag")) {
        excludeTag = "#" + extensionAPI.settings.get("export-excludeTag") + "";
    }
    if (extensionAPI.settings.get("export-flatten")) {
        flattenH = true;
    }

    var startBlock;
    startBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
    if (typeof startBlock == 'undefined') { // no focused block
        var pageBlock = await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid();
        var pageBlockInfo = await getBlockInfoByUID(pageBlock, true);
        startBlock = pageBlockInfo[0][0].children[0].uid;
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

    var page = await flatten(pageUID, excludeTag, flattenH);
    if (includeLinkedRefs == true) {
        var list = document.getElementsByClassName("rm-reference-container");
        if (list.length) {
            page = page.replace("</body>", "<br><hr><br>" + list[0].innerHTML + "</body>")
        }
    }

    var opt = {
        margin: 1,
        filename: pageTitle + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        enableLinks: true,
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(page).save();
};

// All code below this point is open source code originally written by @TFTHacker (https://twitter.com/TfTHacker), maintained by David Vargas (https://github.com/dvargas92495), and modified a little by me with their permission and blessing.
async function flatten(uid, excludeTag, flattenH) {
    var md = await iterateThroughTree(uid, markdownGithub, flattenH, excludeTag);
    marked.setOptions({
        gfm: true,
        xhtml: false,
        pedantic: false,
    });

    md = md.replaceAll('- [ ] [', '- [ ]&nbsp;&nbsp;['); //fixes odd isue of task and alis on same line
    md = md.replaceAll('- [x] [', '- [x]&nbsp;['); //fixes odd isue of task and alis on same line
    md = md.replaceAll(/\{\{\youtube\: (.+?)\}\} /g, (str, lnk) => {
        lnk = lnk.replace('youtube.com/', 'youtube.com/embed/');
        lnk = lnk.replace('youtu.be/', 'youtube.com/embed/');
        lnk = lnk.replace('watch?v=', '');
        return `<iframe width="560" height="315" class="embededYoutubeVieo" src="${lnk}" frameborder="0"></iframe>`
    });

    //lATEX handling
    md = md.replace(/  \- (\$\$)/g, '\n\n$1'); //Latex is centered
    const tokenizer = {
        codespan(src) {
            var match = src.match(/\$\$(.*?)\$\$/);
            if (match) {
                var str = match[0];
                str = str.replaceAll('<br>', ' ');
                str = str.replaceAll('<br/>', ' ');
                str = `<div>${str}</div>`;
                return { type: 'text', raw: match[0], text: str };
            }
            // return false to use original codespan tokenizer
            return false;
        }
    };

    marked.use({ tokenizer });
    md = marked(md);

    return `<html>\n
          <head>
          </head>
          <body>\n${md}\n
          </body>\n
        </html>`;
}

async function iterateThroughTree(uid, formatterFunction, flatten, excludeTag) {
    var results = await getBlockInfoByUID(uid, true)
    await walkDocumentStructureAndFormat(results[0][0], 0, formatterFunction, null, flatten, excludeTag);
    return output;
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
                  :where [?page :block/uid "${uid}"]  ]`;
        var results = await window.roamAlphaAPI.q(q);
        if (results.length == 0) return null;
        return results;
    } catch (e) {
        return null;
    }
}

async function walkDocumentStructureAndFormat(nodeCurrent, level, outputFunction, parent, flatten, excludeTag) {
    if (typeof nodeCurrent.title != 'undefined') {          // Title of page
        outputFunction(nodeCurrent.title, nodeCurrent, 0, parent, flatten);
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
                    outputFunction(blockText, nodeCurrent, level, parent, flatten, excludeTag);
                    //see if embed has children
                    if (typeof embedResults[0][0].children != 'undefined' && level < 30) {
                        let orderedNode = await sortObjectsByOrder(embedResults[0][0].children)
                        for (let i in await sortObjectsByOrder(embedResults[0][0].children)) {
                            await walkDocumentStructureAndFormat(orderedNode[i], level + 1, (embedResults, nodeCurrent, level) => {
                                outputFunction(embedResults, nodeCurrent, level, parent, flatten, excludeTag)
                            }, embedResults[0][0], parent, flatten)
                        }
                    }
                } catch (e) { }
            }
        } else {
            // Second: check for block refs
            blockText = await resolveBlockRefsInText(blockText);
            outputFunction(blockText, nodeCurrent, level, parent, flatten, excludeTag);
        }
    }
    // If block/node has children nodes, process them
    if (typeof nodeCurrent.children != 'undefined') {
        let orderedNode = await sortObjectsByOrder(nodeCurrent.children)
        for (let i in await sortObjectsByOrder(nodeCurrent.children))
            await walkDocumentStructureAndFormat(orderedNode[i], level + 1, outputFunction, nodeCurrent, flatten, excludeTag)
    }
}

async function markdownGithub(blockText, nodeCurrent, level, parent, flatten, excludeTag) {
    if (flatten == true) {
        level = 0
    } else {
        level = level - 1;
    }

    if (nodeCurrent.title) { output += '# ' + blockText; return; };

    //convert soft line breaks, but not with code blocks
    if (blockText.substring(0, 3) != '```') blockText = blockText.replaceAll('\n', '<br/>');

    if (nodeCurrent.heading == 1) blockText = '# ' + blockText;
    if (nodeCurrent.heading == 2) blockText = '## ' + blockText;
    if (nodeCurrent.heading == 3) blockText = '### ' + blockText;
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
            output += '    '.repeat(level - 1) + '1. ';
        } else {
            output += '  '.repeat(level) + '- ';
        }
    } else { //level 1, add line break before
        blockText = '\n' + blockText;
    }

    // exclude tags
    if (excludeTag != null) {
        function escapeRegExp(excludeTag) {
            return excludeTag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');
        }
        excludeTag = escapeRegExp(excludeTag);
        var regex = new RegExp("(.*" + excludeTag + ".*)", "g");
        if (!blockText.match(regex)) {
            output += blockText + '  \n';
        }
    } else {
        output += blockText + '  \n';
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

export default {
    onload: onload,
    onunload: onunload
};