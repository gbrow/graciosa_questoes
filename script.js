document.addEventListener('DOMContentLoaded', async () => {
  const filtrosColuna = document.getElementById('filtros-coluna');
  const perguntasColuna = document.getElementById('perguntas-coluna');

  // Carrega os dados dos arquivos
  const [perguntas, config] = await Promise.all([
    fetch('perguntas.csv').then(response => response.text()),
    fetch('config.json').then(response => response.json())
  ]);

  // Converte o CSV para um array de objetos
  const perguntasArray = csvToArray(perguntas);

  // Gera os filtros
  config.filtros.forEach(filtro => {
    if (filtro.enabled) {
      const filtroDiv = document.createElement('div');
      filtroDiv.className = 'filtro';
      filtroDiv.innerHTML = `
        <label>${filtro.label}</label>
        ${filtro.type === 'checkbox' ? gerarCheckboxes(filtro, perguntasArray) : gerarLista(filtro, perguntasArray)}
        <span class="info-icon" title="${filtro.description}">ℹ️</span>
      `;
      filtrosColuna.appendChild(filtroDiv);
    }
  });

  // Gera as bolinhas das perguntas
  perguntasArray.forEach(pergunta => {
    const bolinha = document.createElement('div');
    bolinha.className = 'pergunta-bolinha';
    bolinha.dataset.tooltip = pergunta.QUESTAO;
    perguntasColuna.appendChild(bolinha);
  });
});

function csvToArray(csv) {
  const linhas = csv.split('\n');
  const headers = linhas[0].split(',');
  return linhas.slice(1).map(linha => {
    const valores = linha.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = valores[index].trim();
      return obj;
    }, {});
  });
}

function gerarCheckboxes(filtro, perguntas) {
  const opcoes = [...new Set(perguntas.map(p => p[filtro.coluna]))];
  return opcoes.map(opcao => `
    <div>
      <input type="checkbox" id="${opcao}" name="${filtro.coluna}" value="${opcao}">
      <label for="${opcao}">${opcao}</label>
    </div>
  `).join('');
}

function gerarLista(filtro, perguntas) {
  const opcoes = [...new Set(perguntas.map(p => p[filtro.coluna]))];
  return `
    <select id="${filtro.coluna}">
      ${opcoes.map(opcao => `<option value="${opcao}">${opcao}</option>`).join('')}
    </select>
  `;
}