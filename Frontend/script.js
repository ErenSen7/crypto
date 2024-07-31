document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const crypto = document.getElementById('crypto').value.toLowerCase();
    const amount = document.getElementById('amount').value;
    const buyPrice = document.getElementById('buy-price').value;
    const position = document.getElementById('position').value;
    const leverage = document.getElementById('leverage').value;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${crypto}</td>
        <td>${amount}</td>
        <td>${buyPrice}</td>
        <td class="current-price" data-crypto="${crypto}">Fetching...</td>
        <td class="profit-loss" data-crypto="${crypto}" data-buy-price="${buyPrice}" data-amount="${amount}" data-position="${position}" data-leverage="${leverage}">Calculating...</td>
        <td>${position}</td>
        <td>${leverage}x</td>
    `;
    document.querySelector('#crypto-table tbody').appendChild(newRow);

    updatePrices();
});

function updatePrices() {
    const currentPriceElements = document.querySelectorAll('.current-price');
    currentPriceElements.forEach(element => {
        const crypto = element.getAttribute('data-crypto');
        console.log(`Fetching price for ${crypto}`);
        fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`)
            .then(response => response.json())
            .then(data => {
                if (data[crypto]) {
                    const currentPrice = data[crypto].usd;
                    console.log(`Current price of ${crypto}: ${currentPrice}`);
                    element.innerText = currentPrice;
                    updateProfitLoss(crypto, currentPrice);
                } else {
                    console.error(`Error fetching price for ${crypto}: Data not found`);
                    element.innerText = "Error";
                }
            })
            .catch(error => console.error(`Error fetching price for ${crypto}:`, error));
    });
}

function updateProfitLoss(crypto, currentPrice) {
    const profitLossElements = document.querySelectorAll(`.profit-loss[data-crypto="${crypto}"]`);
    profitLossElements.forEach(element => {
        const buyPrice = parseFloat(element.getAttribute('data-buy-price'));
        const amount = parseFloat(element.getAttribute('data-amount'));
        const position = element.getAttribute('data-position');
        const leverage = parseFloat(element.getAttribute('data-leverage'));
        let profitLoss;
        if (position === 'long') {
            profitLoss = (currentPrice - buyPrice) * amount * leverage;
        } else {
            profitLoss = (buyPrice - currentPrice) * amount * leverage;
        }
        console.log(`Profit/Loss for ${crypto}: ${profitLoss.toFixed(2)}`);
        element.innerText = profitLoss.toFixed(2);
    });
}

// Update prices every 10 seconds
setInterval(updatePrices, 10000);
