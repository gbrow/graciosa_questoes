document.addEventListener('DOMContentLoaded', async () => {
  const filtrosColuna = document.getElementById('filtros-coluna');
  const perguntasColuna = document.getElementById('perguntas-coluna');

  // Carrega os dados dos arquivos
  const [perguntasCsv, config] = await Promise.all([
    fetch('perguntas.csv').then(response => response.text()),
    fetch('config.json').then(response => response.json())
  ]);
  console.log["filtros: ", config];
  // Converte o CSV para um array de objetos
  const perguntasArray = csvToArray(perguntasCsv);

  // Gera os filtros com base nas colunas da tabela e no config.json
  
  const colunas = Object.keys(perguntasArray[0]); // Pega as colunas da tabela
  console.log("colunas: ", colunas);
  config.filtros.forEach(filtroConfig => {
    console.log("filtro: ", filtroConfig)
    if (filtroConfig.enabled && colunas.includes(filtroConfig.coluna)) {
      const filtroDiv = document.createElement('div');
      filtroDiv.className = 'filtro';
      filtroDiv.innerHTML = `
        <label>${filtroConfig.label}</label>
        ${filtroConfig.type === 'checkbox' ? gerarCheckboxes(filtroConfig, perguntasArray) : gerarLista(filtroConfig, perguntasArray)}
        <span class="info-icon" title="${filtroConfig.description}">ℹ️</span>
      `;
      filtrosColuna.appendChild(filtroDiv);
    }
  });

  // Gera as bolinhas das perguntas
  perguntasArray.forEach(pergunta => {
    console.log("pergunta: ", pergunta)
    const bolinha = document.createElement('div');
    bolinha.className = 'pergunta-bolinha';
    bolinha.dataset.tooltip = pergunta.QUESTAO; // Tooltip com a pergunta
    bolinha.textContent = pergunta.COD; // Código dentro da bolinha
    perguntasColuna.appendChild(bolinha);
  });

  // Adiciona listeners para os filtros
  document.querySelectorAll('.filtro input, .filtro select').forEach(elemento => {
    elemento.addEventListener('change', () => filtrarPerguntas(perguntasArray));
  });
});

function csvToArray(csv) {
  const linhas = csv.split('\n');
  const headers = linhas[0].split(',').map(header => header.trim());
  return linhas.slice(1).map(linha => {
    const valores = linha.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header] = valores[index].trim();
      return obj;
    }, {});
  });
}

function gerarCheckboxes(filtroConfig, perguntas) {
  const opcoes = [...new Set(perguntas.map(p => p[filtroConfig.coluna]))];
  return opcoes.map(opcao => `
    <div>
      <input type="checkbox" id="${opcao}" name="${filtroConfig.coluna}" value="${opcao}">
      <label for="${opcao}">${opcao}</label>
    </div>
  `).join('');
}

function gerarLista(filtroConfig, perguntas) {
  const opcoes = [...new Set(perguntas.map(p => p[filtroConfig.coluna]))];
  return `
    <select id="${filtroConfig.coluna}">
      <option value="">Todos</option>
      ${opcoes.map(opcao => `<option value="${opcao}">${opcao}</option>`).join('')}
    </select>
  `;
}

function filtrarPerguntas(perguntas) {
  const filtrosAtivos = {};
  document.querySelectorAll('.filtro input:checked, .filtro select').forEach(elemento => {
    const coluna = elemento.name || elemento.id;
    const valor = elemento.value;
    if (valor) {
      if (!filtrosAtivos[coluna]) filtrosAtivos[coluna] = [];
      filtrosAtivos[coluna].push(valor);
    }
  });

  const perguntasFiltradas = perguntas.filter(pergunta => {
    return Object.keys(filtrosAtivos).every(coluna => {
      return filtrosAtivos[coluna].includes(pergunta[coluna]);
    });
  });

  // Atualiza as bolinhas
  const perguntasColuna = document.getElementById('perguntas-coluna');
  perguntasColuna.innerHTML = ''; // Limpa as bolinhas atuais
  perguntasFiltradas.forEach(pergunta => {
    const bolinha = document.createElement('div');
    bolinha.className = 'pergunta-bolinha';
    bolinha.dataset.tooltip = pergunta.QUESTAO;
    bolinha.textContent = pergunta.COD;
    perguntasColuna.appendChild(bolinha);
  });
}