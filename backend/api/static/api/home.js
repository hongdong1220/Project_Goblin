//Global var====================================================
let stock_chart;
let curr_stock_data;
let curr_ticker;
const rangeMap = {
    //5D, 1M, 3M, 6M, YTD, 1Y, 5Y, Max
    "5D_button": 5,
    "1M_button": 30,
    "3M_button": 90,
    "6M_button": 180,
    "YTD_button": "YTD",
    "1Y_button": 365,
    "5Y_button": 1825,
    "Max_button": "Max",
};
Object.freeze(rangeMap);

//Other funcions===============================================
document.addEventListener('DOMContentLoaded', function () {
    var search_button = document.getElementById('search_button');
    search_button.addEventListener('click', function (event) {
        var ticker_search_bar = document.getElementById('ticker_input');
        if (ticker_search_bar.checkValidity()) {
            ticker_search_bar.classList.remove('was-validated');
            search_stock();
        } else {
            ticker_search_bar.classList.add('was-validated');
        }
    });
});

function search_stock() {
    const ticker_input_box = document.getElementById('ticker_input');
    const ticker = (String(ticker_input_box.value)).trim().toUpperCase();
    ticker_input_box.value = '';
    console.log(`Javascript TRYING TO CALL API for ${ticker}`);

    // only fetch api and update table if something is in the input
    if (ticker.length === 0) {
        console.log("empty stock input");
    } else {

        fetch(`/search_daily/${ticker}`)
            .then((response) => {
                console.log("RESPONSE FROM API SERVER ============================");
                console.log(response);
                console.log("END OF RESPONSE FROM API SERVER =====================");
                if (!(response.ok)) {
                    throw new Error(`SOMETHING WENT WRONG! ${response.text()}`);
                }
                return response.json();
            })
            .then(response => {
                //update global var to store fetched data
                curr_stock_data = response;
                curr_ticker = response['symbol'];
                //Make Chart and Table ========================================================
                document.getElementById("stock_chart_div").hidden = false;
                document.getElementById("stock_info_box").hidden = false;
                generateChartAndTable();
            }).catch(ex => {
                console.log("CAUGHT EXCEPTION ++++++++++++++++++++++++++++++");
                console.log(ex);
                alert(`Cant find info on ticker ${ticker}. Check your spelling`);
            });
    }
}


function generateChartAndTable() {
    if (curr_stock_data === undefined) {
        throw new Error("Cant not generate chart because no stock data");
    }

    //get the correct range
    let newChartData = [];
    let newTableData = {};
    let selected_radio = document.querySelector('input[name="btnradio"]:checked').id;
    let target_date = new Date();
    let curr_date = new Date();

    if (selected_radio === "1M_button") {
        target_date.setMonth(target_date.getMonth() - 1);
    } else if (selected_radio === "3M_button") {
        target_date.setMonth(target_date.getMonth() - 3);
    } else if (selected_radio === "6M_button") {
        target_date.setMonth(target_date.getMonth() - 6);
    } else if (selected_radio === "YTD_button") {
        target_date.setMonth(0);
        target_date.setDate(1);
    } else if (selected_radio === "1Y_button") {
        target_date.setFullYear(curr_date.getFullYear() - 1);
        target_date.setMonth(curr_date.getMonth());
        target_date.setDate(curr_date.getDate());
    } else if (selected_radio === "5Y_button") {
        target_date.setFullYear(curr_date.getFullYear() - 5);
        target_date.setMonth(curr_date.getMonth());
        target_date.setDate(curr_date.getDate());
    }

    console.log("RANGE---------------------------------------------------");
    console.log(target_date);
    console.log("End RANGE-----------------------------------------------");

    let count = 5;

    for (const [key, value] of Object.entries(curr_stock_data['Time Series (Daily)'])) {
        let keyDate = new Date(`${key}T00:00:00`);

        if (selected_radio === "5D_button") {
            if (count <= 0) { break; }
            newChartData.unshift({ 'date': key, 'price': value['4. close'] });
            newTableData[key] = value;
            count = count - 1;
        } else if (selected_radio === "Max_button") {
            newChartData.unshift({ 'date': key, 'price': value['4. close'] });
            newTableData[key] = value;
        } else if (keyDate >= target_date) {
            newChartData.unshift({ 'date': key, 'price': value['4. close'] });
            newTableData[key] = value;
        } else {
            break;
        }
    }

    //update chart
    createChart(newChartData);
    //update table
    createTable(newTableData);
}


function createChart(newData) {
    console.log("Making the line chart")
    const data = {
        //line #1
        datasets: [
            {
                label: `${curr_stock_data['symbol']}`,
                data: newData,
            }
        ]
    };

    if (stock_chart) {
        console.log("CHART OLD DATA #########################################");
        console.log(stock_chart.data);
        stock_chart.data = data;
        stock_chart.update();
    } else {
        stock_chart = new Chart(
            document.getElementById('stock_chart'),
            {
                type: 'line',
                data: data,
                options: {
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'price'
                    },
                    // animation: false,
                }
            }
        );
    }
}

function createTable(newData) {
    console.log("Making a table===================================");
    console.log(newData);
    console.log("END of Making a table============================");


    // Clear any content inside #stock_info_header div
    const header_div = document.getElementById("stock_info_header");
    header_div.innerHTML = '';
    //text above the stock info table
    const header = document.createElement("h4");
    let selected_radio = document.querySelector('input[name="btnradio"]:checked');
    header.textContent = `Ticker: ${curr_stock_data['symbol']} ${curr_stock_data['api_function']}`;
    header_div.appendChild(header);

    // Clear any content inside #stock_info_table div
    const content_box = document.getElementById("stock_info_table");
    content_box.innerHTML = '';

    //create the table
    const newTable = document.createElement("table");
    newTable.className = "table table-dark table-hover";
    const tableHeader = document.createElement("thead");
    tableHeader.innerHTML =
        '<tr>' +
        `<th scope="col">Date</th>` +
        '<th scope="col">Open</th>' +
        '<th scope="col">High</th>' +
        '<th scope="col">Low</th>' +
        '<th scope="col">Close</th>' +
        '<th scope="col">Volume</th>' +
        '</tr>';

    newTable.appendChild(tableHeader);
    const tableBody = document.createElement("tbody");
    for (const [date, values] of Object.entries(newData)) {
        const newRow = document.createElement("tr");
        newRow.className = "table-secondary";
        const time = document.createElement("th");
        time.className = 'scope="row"';
        time.innerText = date;
        newRow.appendChild(time);
        for (const [key, value] of Object.entries(values)) {
            const newCol = document.createElement("td");
            newCol.textContent = value;
            newRow.appendChild(newCol);
        }
        tableBody.appendChild(newRow);
    }
    newTable.appendChild(tableBody);

    content_box.appendChild(newTable);
}