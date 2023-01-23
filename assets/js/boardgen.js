const labelTemplateElement = document.getElementById("labelTemplate")
const imagesPerLabelElement = document.getElementById("imagesperlabelcount") 
const fileUploadField = document.getElementById("filefield")


const IN_TO_PT_FACTOR = 72;

// const boardXElement = document.getElementById("boarddimx")
// const boardYElement = document.getElementById("boarddimy")
// const boardFreeTilesElement = document.getElementById("freetiles")
const generateButtonElement = document.getElementById("generate")
// const playBoardElement = document.getElementById("play")
const warningTextElement = document.getElementById("warningText")


let uploadedImageData = []

/**
 * returns a 2d array representing a randomized arrangement of board tiles.
 * @param {*} rows the number of rows the board should have
 * @param {*} columns the number of columns the board should have
 * @param {*} values the array of values to randomly pull from
 */
function createSheet(rows, columns, values) {

    data = values;
    // data = shuffle(data);
    board = []

    if (values.length < (rows * columns))
        console.warn("Not enough options to fill a " +rows + "x" + columns + " board without duplicates")
        //maybe fallback to using duplicate items

    for (r = 0; r < rows; r++) {
        row = []
        for (c = 0; c < columns; c++) {
            row[c] = data.shift(); //https://stackoverflow.com/a/29606016
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
            hLineWidth: function (i, node) { return 0; },
            vLineWidth: function (i) { return 0; },
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


async function getPDFTemplate(template, tiles) {

    var docDefinition = {
        pageSize: 'LETTER',
        pageOrientation: 'portrait',
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

    // var doc = new jsPDF("portrait", "pt", "letter")
    quantity = 1 //TODO, calculate how many sheets are needed
    for(i = 0; i < quantity; i++) {
        sheet = createSheet(template.rowsPerSheet, template.colsPerSheet, tiles);
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

function getBlankTile(template) {
    return Object.assign({}, {
        stack: [
            Object.assign({}, {
                text: "",
                width: template.colWidthIn * IN_TO_PT_FACTOR,
                height: template.rowHeightIn * IN_TO_PT_FACTOR,
                margin: [0, 0, 0, 0],
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
const createTilesFromImages = (images, totalTiles, template) => {
    
    const processedimgs = images.map((uri) => ({
                    image: uri,
                    width: template.colWidthIn * IN_TO_PT_FACTOR, // inches to points, multiply by the ppi, which i guess is 72
                    height: template.rowHeightIn * IN_TO_PT_FACTOR,
                    margin: [0, 0, 0, 0],
                    // fit: [200, 70]
                }));

    imagesNeeded = totalTiles - images.length

    for (let i = 0; i < imagesNeeded; i++) {
        processedimgs.push(getBlankTile(template))
        
    }

    return processedimgs
}


function handleFileSelect(evt) {
    let files = evt.target.files; // FileList object
    
    for (let f = 0; f < files.length; f++) {

        let reader = new FileReader();

        reader.addEventListener("load", () => {
            // convert image file to base64 string
            uploadedImageData.push(reader.result)
        }, false);

        const file = files[f]
        // Read in the image file as a data URL.
        reader.readAsDataURL(file)
    }
}

fileUploadField.addEventListener('change', handleFileSelect, false);

generateButtonElement.onclick = () => {



    //add loader
    // image = document.createElement('img')
    // image.src = "assets/media/loader.gif"
    // image.style.display = "block";
    // image.style.margin = "0 auto";
    // replaceInlinePDFWith(image)
    template = label_templates[labelTemplateElement.value]
    tiles = createTilesFromImages(uploadedImageData, template.rowsPerSheet*template.colsPerSheet, template)

    getPDFTemplate(template, tiles)
        .then((template) => pdfMake.createPdf(template).getDataUrl(
            (dataUrl) => {
                var iframe = document.createElement('iframe');
                iframe.src = dataUrl;                
                replaceInlinePDFWith(iframe)
            })
        );
}

