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

    //duplicate values array so we can mutate it and not mess the real one up
    data = Array.from(values);
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

function getTableDefinitionFromImages(board, template) {
    //there should be a better way to get the width in pdfmake than
    //just hardcoding the page height and making up an arbitrary number so that it's close enough
    //the 612 comes from the LETTER size in https://github.com/bpampuch/pdfmake/blob/79d9d51e0b5cf5ea4b0491811591ea5aaf15c95b/src/standardPageSizes.js, and the 120 is just a number made up to account for the margins and whatever so that the table appears square when it is used for the height
    const availableWidth = 612.00 - 140;

    //this contains a workaround to center the table.
    //see https://github.com/bpampuch/pdfmake/issues/72
    return {
        layout: 'noBorders', // optional, 
        width: 'auto',
        table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 0,
            widths: Array(board[0].length).fill('*'),
            heights: Array(board[0][0].length).fill('*'),//Array(board.length).fill(availableWidth / board.length),
            alignment: 'center',
            body: board,
            margin: [0, 0, 0, 0]
        },
        margin: [0,0,0,0]
    }
}


async function getPDFTemplate(template, tiles) {

    var docDefinition = {
        pageSize: 'LETTER',
        header: [],
        content: [],
        footer: function (currentPage, pageCount) {
            return [
                ]
        },
        pageBreakBefore: function (currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
            return "columns" in currentNode && previousNodesOnPage.length > 1;
        },
        images: {},
        styles: {
        },
        pageMargins: [template.pageTopMarginIn * IN_TO_PT_FACTOR, template.pageLeftMarginIn * IN_TO_PT_FACTOR, template.pageBottomMarginIn * IN_TO_PT_FACTOR, template.pageRightMarginIn * IN_TO_PT_FACTOR],
    };

    // var doc = new jsPDF("portrait", "pt", "letter")
    quantity = 1 //TODO, calculate how many sheets are needed
    for(i = 0; i < quantity; i++) {
        sheet = createSheet(template.rowsPerSheet, template.colsPerSheet, tiles);
        docDefinition.content.push(createTilesFromImages(sheet));
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

/**
 * 
 * @param {*} images 
 * @param {*} totalTiles the total number of tiles to include in this sheet. will fill them with empty space if there arent enough images to fill every tile
 * @returns 
 */
const createTilesFromImages = (images, totalTiles) => {
    
    images.map((uri) => ({
                    image: uri,
                    // margin: [40, 20, 0, 0],
                    // fit: [200, 70]
                }));

    imagesNeeded = totalTiles - images.length
    //TODO fill in empty ones
    //  {
//     stack: [
//         { text: board[r][c].title, style: 'boardCellMainText' }
//     ],
//         style: 'boardCell'
// }
    return images
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

