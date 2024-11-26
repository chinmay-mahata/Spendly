const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  signDisplay: "always",
});

const list = document.getElementById("transactionList");
const form = document.getElementById("transactionForm");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const barGraph = document.getElementById("barGraph");

let chartInstance = null;

form.addEventListener("submit", addTransaction);

function updateTotal() {
  const incomeTotal = transactions
    .filter((trx) => trx.type === "income")
    .reduce((total, trx) => total + trx.amount, 0);

  const expenseTotal = transactions
    .filter((trx) => trx.type === "expense")
    .reduce((total, trx) => total + trx.amount, 0);

  const balanceTotal = incomeTotal - expenseTotal;

  balance.textContent = formatter.format(balanceTotal);
  income.textContent = formatter.format(incomeTotal);
  expense.textContent = formatter.format(-expenseTotal);
}

function renderList() {
  list.innerHTML = "";

  if (transactions.length === 0) {
    status.textContent = "No transactions.";
    return;
  } else {
    status.textContent = "";
  }

  transactions.forEach(({ id, name, amount, date, type }) => {
    const li = document.createElement("li");
    li.classList.add("transaction-item");

    li.innerHTML = `
      <div>
        <h4>${name}</h4>
        <p>${new Date(date).toLocaleDateString('en-GB')}</p>
      </div>
      <div class="amount ${type}">
        <span>${formatter.format(type === "income" ? amount : -amount)}</span>
      </div>
      <button class="remove-btn" onclick="deleteTransaction(${id})">Remove</button>
    `;

    list.appendChild(li);
  });
}

function deleteTransaction(id) {
  const index = transactions.findIndex((trx) => trx.id === id);
  if (index !== -1) transactions.splice(index, 1);

  updateTotal();
  saveTransactions();
  renderList();
  renderGraph();
}

function addTransaction(e) {
  e.preventDefault();

  const formData = new FormData(form);

  transactions.push({
    id: Date.now(),
    name: formData.get("name"),
    amount: parseFloat(formData.get("amount")),
    date: formData.get("date"),
    type: formData.get("type"),
  });

  form.reset();
  updateTotal();
  saveTransactions();
  renderList();
  renderGraph();
}

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function renderGraph() {
  const dates = [];
  const incomes = [];
  const expenses = [];
  const remainingBalances = [];

  
  const groupedData = {};
  transactions.forEach(({ date, amount, type }) => {
    const formattedDate = new Date(date).toLocaleDateString("en-GB");
    if (!groupedData[formattedDate]) groupedData[formattedDate] = { income: 0, expense: 0 };
    groupedData[formattedDate][type] += amount;
  });

  
  const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach((date) => {
    dates.push(date);
    incomes.push(groupedData[date].income);
    expenses.push(groupedData[date].expense);
    remainingBalances.push(groupedData[date].income - groupedData[date].expense);
  });

  const data = {
    labels: dates,
    datasets: [
      {
        label: "Income",
        data: incomes,
        backgroundColor: "rgba(89, 182, 249, 0.8)", 
        borderColor: "rgba(89, 182, 249, 1)",
        borderWidth: 1,
        xAxisID: "bar-x-axis1",  
        fill: false,
        hoverBackgroundColor: "rgba(89, 182, 249, 1)",
      },
      {
        label: "Expense",
        data: expenses,
        backgroundColor: "rgba(3, 90, 177, 0.8)", 
        borderColor: "rgba(3, 90, 177, 1)",
        borderWidth: 1,
        xAxisID: "bar-x-axis2",  
        fill: false,
        hoverBackgroundColor: "rgba(3, 90, 177, 1)",
      },
    ],
  };

  if (chartInstance) {
    chartInstance.destroy(); 
  }

  chartInstance = new Chart(barGraph, {
    type: "bar",
    data,
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const datasetIndex = context.datasetIndex;
              const value = context.raw;
              const balance = remainingBalances[context.dataIndex];

              
              if (datasetIndex === 0) {
                return `Income: ₹${value.toFixed(2)}\nRemaining: ₹${balance.toFixed(2)}`;
              }
              if (datasetIndex === 1) {
                return `Expense: ₹${value.toFixed(2)}\nRemaining: ₹${balance.toFixed(2)}`;
              }
              return '';
            },
          },
        },
        legend: {
          position: "top",
        },
      },
      scales: {
        x: [{
          id: "bar-x-axis1",  
          stacked: false,
          barThickness: 30,
        }, {
          id: "bar-x-axis2",  
          stacked: false,
          display: false,  
          barThickness: 30,
        }],
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

renderList();
updateTotal();
renderGraph();
