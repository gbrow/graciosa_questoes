const ballsContainer = document.getElementById("balls-container");
const groupFilter = document.getElementById("group-filter");
const themeFilter = document.getElementById("theme-filter");
const originFilter = document.getElementById("origin-filter");

let questions = [];

// Função para carregar o CSV
function loadCSV() {
  Papa.parse("perguntas.csv", {
    download: true,
    header: true,
    delimiter: ";",
    complete: function (results) {
      questions = results.data;
      populateFilters();
      renderBalls();
    },
  });
}

// Função para popular os filtros
function populateFilters() {
  const groups = [...new Set(questions.map(q => q.TEMA))];
  const themes = [...new Set(questions.map(q => q.SUBTEMA))];
  const origins = [...new Set(questions.map(q => q.ORIGEM))];

  populateFilter(groupFilter, groups);
  populateFilter(themeFilter, themes);
  populateFilter(originFilter, origins);
}

// Função para adicionar opções aos filtros
function populateFilter(filter, options) {
  options.forEach(option => {
    if (option) {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      filter.appendChild(optionElement);
    }
  });
}

// Função para renderizar as bolas
function renderBalls() {
  const selectedGroup = groupFilter.value;
  const selectedTheme = themeFilter.value;
  const selectedOrigin = originFilter.value;

  ballsContainer.innerHTML = "";

  questions.forEach(q => {
    if (
      (selectedGroup === "all" || q.TEMA === selectedGroup) &&
      (selectedTheme === "all" || q.SUBTEMA === selectedTheme) &&
      (selectedOrigin === "all" || q.ORIGEM === selectedOrigin)
    ) {
      const ball = document.createElement("div");
      ball.className = "ball";
      ball.textContent = q.COD;
      ball.setAttribute("data-question", q.QUESTAO);
      ball.setAttribute("data-group", q.TEMA);
      ballsContainer.appendChild(ball);
    }
  });
}

// Event listeners para os filtros
groupFilter.addEventListener("change", renderBalls);
themeFilter.addEventListener("change", renderBalls);
originFilter.addEventListener("change", renderBalls);

// Carrega os dados do CSV ao iniciar
loadCSV();