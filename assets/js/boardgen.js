const labelTemplateElement = document.getElementById("labelTemplate")

const labelSkipElement = document.getElementById("skiplabels")


const labelPdfFilenameElement = document.getElementById("filename")


// const imagesPerLabelElement = document.getElementById("imagesperlabelcount") 
// const fileUploadField = document.getElementById("filefield")


const labelGroupContainerElement = document.getElementById("labelGroupContainer")

const newLabelGroupButtonElement = document.getElementById("newlabelgroup")

let labelGroups = []



const IN_TO_PT_FACTOR = 72;
const DEFAULT_PDF_FILENAME_PREFIX = "generatedlabels_"

// const boardXElement = document.getElementById("boarddimx")
// const boardYElement = document.getElementById("boarddimy")
// const boardFreeTilesElement = document.getElementById("freetiles")
const generateButtonElement = document.getElementById("generate")
// const playBoardElement = document.getElementById("play")
const warningTextElement = document.getElementById("warningText")


/**
 * returns a 2d array representing a randomized arrangement of board tiles.
 * @param {*} rows the number of rows the board should have
 * @param {*} columns the number of columns the board should have
 * @param {*} values the array of values to randomly pull from
 */
function createSheet(rows, columns, values, template) {

    let data = values;
    // data = shuffle(data);
    board = []

    if (values.length < (rows * columns))
        console.warn("Not enough options to fill a " +rows + "x" + columns + " board without duplicates")
        //maybe fallback to using duplicate items

    for (r = 0; r < rows; r++) {
        row = []
        for (c = 0; c < columns; c++) {
            row[c] = data.shift() ?? getBlankTile(template); //https://stackoverflow.com/a/29606016
        }
        board[r] = row
    }
    return board
}

function injectSpacingColumns(board, template) {

    let newboard = []

    for (r = 0; r < board.length; r++) {
        row = []
        let columns = board[0].length
        for (c = 0; c < columns; c++) {
            const d = board[r][c]; //https://stackoverflow.com/a/29606016

            row.push(d)
            if (c != columns - 1) {
                row.push(getBlankTile(template))
            }
        }
        newboard[r] = row
    }
    return newboard
}

function countCharsInString(string, char) {
    return (string.match(new RegExp(char, "g")) || []).length
}

//https://stackoverflow.com/a/42916772
function toDataURL(url) {
    return new Promise(
        (resolve, reject) => {
            if (url == null)  reject()
        var xhr = new XMLHttpRequest();
        xhr.open('get', url);
        xhr.responseType = 'blob';
        xhr.onload = function () {
            var fr = new FileReader();

            fr.onload = () => resolve(fr.result);

            fr.readAsDataURL(xhr.response); // async call
        };

        xhr.send();
    });
}

function zip(array1, array2)  {
    array3 = new Array();

    for (var i = 0; i < Math.max(array1.length, array2.length); i++) {
        if (array1.length > i){
            array3.push(array1[i]);
        }
        if (array2.length > i) {
            array3.push(array2[i]);
        }
    }
    return array3

}

//this behaves weirdly if chunk_size is a string
function chunk_array(array, chunk_size) {
    chunk_size = parseInt(chunk_size)
    var chunked_array = [];
    for (let i = 0; i < array.length; i += chunk_size) {
        chunked_array.push(array.slice(i, i + chunk_size));
    }
    return chunked_array
}

function clone_array_elements (array, numberOfTimes) {
    if (array.length > 1){
        return array.map((a) => Array(numberOfTimes).fill(a)).reduce((a,b) => a.concat(b));
    } else {
        return Array(numberOfTimes).fill(array[0])
    }
}

function getTableDefinitionFromImages(board, template) {
    //there should be a better way to get the width in pdfmake than
    //just hardcoding the page height and making up an arbitrary number so that it's close enough
    //the 612 comes from the LETTER size in https://github.com/bpampuch/pdfmake/blob/79d9d51e0b5cf5ea4b0491811591ea5aaf15c95b/src/standardPageSizes.js, and the 120 is just a number made up to account for the margins and whatever so that the table appears square when it is used for the height
    const availableWidth = 612.00 - 140;
    const wdths = zip(Array(board[0].length).fill('*'), Array(board[0].length - 1).fill(template.colSpacingIn * IN_TO_PT_FACTOR))

    //this contains a workaround to center the table.
    //see https://github.com/bpampuch/pdfmake/issues/72
    return {
        layout: {
            hLineWidth: function (i, node) { return template.borders? .5 : 0; },
            vLineWidth: function (i) { return template.borders ? .5 : 0; },
            hLineColor: function (i) { return '#aaa'; },
            paddingLeft: function (i) { return 0; },
            paddingRight: function (i, node) { return 0; },
            paddingTop: function (i, node) { return 0; },
            paddingBottom: function (i, node) { return 0; },
            hLineStyle: function (i, node) {
                if (i === 0 || i === node.table.body.length) {
                    return null;
                }
                return { dash: { length: 10, space: 4 } };
            },
            vLineStyle: function (i, node) {
                if (i === 0 || i === node.table.widths.length) {
                    return null;
                }
                return { dash: { length: 4 } };
            },
        }, // optional, 
        width: 'auto',
        table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 0,
            widths: wdths,
            // heights: Array(board[0][0].length).fill('*'),//Array(board.length).fill(availableWidth / board.length),
            alignment: 'center',
            body: injectSpacingColumns(board, template),
            margin: [0,0,0,0]
        },
        margin: [0,0,0,0]
    }
}


function getPDFTemplate(template, allTiles) {

    var docDefinition = {
        info: {
            creator: "LabelSheetGenerator <https://github.com/MoralCode/LabelSheetGenerator> instance located at " + window.location.href,
        },
        pageSize: template.pagePaperSize || 'LETTER',
        pageOrientation: template.pageOrientation || 'portrait',
        header: [],
        content: [],
        footer: [],
        styles: {},
        layout: {
            paddingLeft: function (i) { return 0; },
            paddingRight: function (i, node) { return 0; },
            paddingTop: function (i, node) { return 0; },
            paddingBottom: function (i, node) { return 0; }
        },
        pageMargins: [
            template.pageLeftMarginIn * IN_TO_PT_FACTOR,
            template.pageTopMarginIn * IN_TO_PT_FACTOR,
            template.pageRightMarginIn * IN_TO_PT_FACTOR,
            template.pageBottomMarginIn * IN_TO_PT_FACTOR
        ],
    };

    let labelsPerSheet = template.rowsPerSheet * template.colsPerSheet

    let chunked_imagedata = chunk_array(allTiles, labelsPerSheet)
    for (let sheet_tiles of chunked_imagedata) {

        let sheet = createSheet(template.rowsPerSheet, template.colsPerSheet, sheet_tiles, template);

        docDefinition.content.push(getTableDefinitionFromImages(sheet, template));
    }

    return docDefinition
}

function replaceInlinePDFWith(node) {
    const main = document.getElementsByTagName("main")[0]
    node.id = "pdfinline"
    main.replaceChild(node, document.getElementById('pdfinline'))
}

possibleTemplates = Object.entries(label_templates)
//TODO: sort

for (const [key, gamemode] of possibleTemplates) {
    console.log(key);
    console.log(gamemode.hasOwnProperty('name'));
    if (gamemode.hasOwnProperty('name')) {
        option = document.createElement("option")
        option.value = key;
        option.innerText = gamemode.name;
        if (gamemode.default) {
            option.selected = true;
        }
        labelTemplateElement.appendChild(option)
    }
}

function getBlankTile(template, fillSpace=false) {

    let w = template.colWidthIn * IN_TO_PT_FACTOR
    let h = template.rowHeightIn * IN_TO_PT_FACTOR
    return Object.assign({}, {
        stack: [
            Object.assign({}, {
                text: fillSpace ? " ": "",
                lineHeight: 0,
                width: w,
                height:h,
                margin: fillSpace? [w/2, h/2, w/2, h/2]: [0, 0, 0, 0],
            })
        ]
    });
}

/**
 * 
 * @param {*} images 
 * @param {*} totalTiles the total number of tiles to include in this sheet. will fill them with empty space if there arent enough images to fill every tile
 * @returns 
 */
const createTilesFromImages = (images, totalTiles, imagesPerLabel, template) => {

    let chunked_images = chunk_array(images, imagesPerLabel)

    const processedimgs = chunked_images.map((tile) => createTileFromImages(tile, template, imagesPerLabel))

    let tilesNeeded = totalTiles - processedimgs.length

    for (let i = 0; i < tilesNeeded; i++) {
        processedimgs.push(getBlankTile(template))
    }

    return processedimgs
}

/**
 * create a single tile from the provided images (either one or multiple stacked up)
 * @param {*} images an array of data-uri strings containing image data 
 */
const createTileFromImages = (images, template, targetImagesPerLabel=0, paddingPt=0) => {

    if (images.length == 1 && targetImagesPerLabel == 0) {
        return {
            image: images[0],
            width: template.colWidthIn * IN_TO_PT_FACTOR, // inches to points, multiply by the ppi, which i guess is 72
            height: template.rowHeightIn * IN_TO_PT_FACTOR,
            margin: [0, 0, 0, 0],
            // fit: [200, 70]
        }
    } else {
        var data = {
            stack: []
        }

        for (let label_img_data of images) {
        
            data.stack.push(
                {
                    image: label_img_data,
                    width: template.colWidthIn * IN_TO_PT_FACTOR, // inches to points, multiply by the ppi, which i guess is 72
                    margin: [0, 0, 0, 0],
                    // fit: [200, 70]
                }
            )
            
            if (paddingPt > 0 && label_img_data != images[images.length - 1]){
                data.stack.push({ height: paddingPt, text: '' })
            }

        }
        //if there arent as many label images as we were told to expect, add a variable padding below the label so that they arent stretched to fill the height 
        var needsItems = data.stack.length < targetImagesPerLabel
        if (needsItems) {
            data.stack.push({ height: '*', text: '' })
        }
        return data
    }
}

/**
 * handles selecting uploaded files, decoding them to DataURL format, and saving them in a list
 * @param {*} evt 
 * @param {*} labelGroup 
 */
function handleFileSelect(evt, labelGroup) {
    let files = evt.target.files; // FileList object
    labelGroup.clearImageData()
    for (let f = 0; f < files.length; f++) {

        let reader = new FileReader();

        reader.addEventListener("load", () => {
            // convert image file to base64 string
            labelGroup.uploadedImageData.push(reader.result)
        }, false);

        const file = files[f]
        // Read in the image file as a data URL.
        reader.readAsDataURL(file)
    }
}



function createLabelGroup(parentContainer, first = false) {
    let groupTemplate = parentContainer
    if (!first) {
        // duplicate elements first child
        groupTemplate = parentContainer.children[0].cloneNode(true);
        // this.height = height;
        // this.width = width;
        parentContainer.appendChild(groupTemplate)
    }
    let labelGroup = new LabelGroup(groupTemplate) 

    groupTemplate.querySelectorAll(".filefield")[0].addEventListener('change', (e) => handleFileSelect(e, labelGroup), false);

    //delete button
    groupTemplate.getElementsByTagName("button")[0].onclick = (e) => {
        if (!first) {
            let labelGroupElement = e.target.parentNode.parentNode
            
            labelGroupElement.parentNode.removeChild(labelGroupElement);

            labelGroups = labelGroups.filter((val, index, arr) => val.sourceElement != labelGroupElement)
        } else {
            //user deleted the first and only label group that all the others are copied from. With the current design this is unrecoverable without a page reload. therefore its easter egg time :P
            generateButtonElement.onclick = () => {
                alert("Seriously?! What did you expect was going to happen?")
            }
        }
    }
    return labelGroup
}

class LabelGroup {

    constructor(labelGroupElement) {
        this.sourceElement = labelGroupElement
        this.fileUploadField = labelGroupElement.querySelectorAll(".filefield")[0]
        this.imagesPerLabelElement = labelGroupElement.querySelectorAll(".imagesperlabelcount")[0] 
        this.groupQuantityElement = labelGroupElement.querySelectorAll(".groupquantity")[0]
        this.uploadedImageData = []
    }

    getImagesPerLabelCount() {
        return parseInt(this.imagesPerLabelElement.value)
    }

    getGroupQuantity() {
        return parseInt(this.groupQuantityElement.value)
    }

    processLabelImages(template) {
        //apply quantity value
        let expanded_array = this.getGroupQuantity() == 1 ? this.uploadedImageData : clone_array_elements(this.uploadedImageData, this.getGroupQuantity())
        let chunked_images = chunk_array(expanded_array, this.imagesPerLabelElement.value)
        let tiles = chunked_images.map((imageset) => createTileFromImages(imageset, template, this.imagesPerLabelElement.value, 0))
        return tiles
    }

    clearImageData() {
        this.uploadedImageData = []
    }
}

labelGroups.push(createLabelGroup(labelGroupContainerElement, first = true))

let datestamp = (new Date()).toISOString().substring(0, "2023-01-28".length)
labelPdfFilenameElement.value = DEFAULT_PDF_FILENAME_PREFIX + datestamp + "_1.pdf"

labelPdfFilenameElement.size = labelPdfFilenameElement.value.length


newLabelGroupButtonElement.onclick = () => {
    labelGroups.push(createLabelGroup(labelGroupContainerElement))
}

generateButtonElement.onclick = () => {

    _paq.push(['trackEvent', 'Sheets', 'Generate', label_templates[labelTemplateElement.value].name]);

    //add loader
    // image = document.createElement('img')
    // image.src = "assets/media/loader.gif"
    // image.style.display = "block";
    // image.style.margin = "0 auto";
    // replaceInlinePDFWith(image)

    let template = label_templates[labelTemplateElement.value]
    // let imagedata = processLabelGroups(labelGroups, template)
    let allTiles = labelGroups.map((group) => group.processLabelImages(template)).reduce((a, b) => a.concat(b))
    let skipLabels = [];
    let skipLabelsCount = parseInt(labelSkipElement.value)
    if (skipLabelsCount > 0) {
        for (let i = 0; i < skipLabelsCount; i++) {
            skipLabels.push(getBlankTile(template, true))
        }
    }
    allTiles = skipLabels.concat(allTiles)

    let filename = labelPdfFilenameElement.value

    if (!filename.toLowerCase().endsWith(".pdf")){
        labelPdfFilenameElement.value += ".pdf"
        filename += ".pdf"
    }
    
    pdfMake.createPdf(getPDFTemplate(template, allTiles)).download(filename);

    if (filename.startsWith(DEFAULT_PDF_FILENAME_PREFIX) && countCharsInString(filename, "_") == 2 && filename.endsWith(".pdf")) {
        filename = filename.substring(0, filename.length - ".pdf".length)

        let suffix = filename.substring(filename.lastIndexOf("_")+1, filename.length)
        //remove suffix number from filename
        let suffixStrLength = suffix.length
        filename = filename.substring(0, filename.length - suffixStrLength)

        suffix = parseInt(suffix)
        suffix += 1
        filename += suffix
        filename += ".pdf"
        labelPdfFilenameElement.value = filename
    } 
}

