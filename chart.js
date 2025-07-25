const yearSelect = document.getElementById("yearSelect");
const statSelect = document.getElementById("statSelect");
const ctx = document.getElementById("statsChart").getContext("2d");

let chart;

async function loadData(year, stat) {
  try {
    const response = await fetch(`data/IPL-${year}-${stat}.json`);
    if (!response.ok) {
      throw new Error(`Data file not found: IPL-${year}-${stat}.json`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading data:", error);
    return null;
  }
}


function createChart(data, stat) {
  const labels = data.map(player => player.player);
  let dataPoints;

  // Match property names used in your JSON files
  switch (stat) {
    case "orange-cap":
      dataPoints = data.map(p => Number(p.runs));
      break;
    case "most-4s":
      dataPoints = data.map(p => Number(p.four_s));
      break;
    case "most-6s":
      dataPoints = data.map(p => Number(p.six_s));
      break;
    case "most-100s":
      dataPoints = data.map(p => Number(p.centuries));
      break;
    case "most-50s":
      dataPoints = data.map(p => Number(p.fifties));
      break;
    default:
      dataPoints = data.map(p => Number(p.runs));
  }

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: statSelect.options[statSelect.selectedIndex].text,
        data: dataPoints,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

async function updateChart() {
  const year = yearSelect.value;
  const stat = statSelect.value;

  const data = await loadData(year, stat);
  if (data && data.length > 0) {
    createChart(data, stat);
  } else {
    if(chart) chart.destroy();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    alert("No data available for this selection.");
  }
}

yearSelect.addEventListener("change", updateChart);
statSelect.addEventListener("change", updateChart);

// Initial chart load
updateChart();
