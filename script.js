document.addEventListener('DOMContentLoaded', async () => {
  const filtrosColuna = document.getElementById('filtros-coluna');
  const perguntasColuna = document.getElementById('perguntas-coluna');

  try {
    // Carrega os dados dos arquivos
    const [perguntasCsv, config] = await Promise.all([
      fetch('perguntas.csv').then(response => response.text()),
      fetch('config.json').then(response => response.json())
    ]);

    // Converte o CSV para um array de objetos
    const perguntasArray = csvToArray(perguntasCsv);
    console.log('Perguntas carregadas:', perguntasArray); // Debug

    // Gera os filtros com base nas colunas da tabela e no config.json
    const colunas = Object.keys(perguntasArray[0]); // Pega as colunas da tabela
    console.log('Colunas do CSV:', colunas); // Debug
    console.log('Colunas configuradas:', config.filtros.map(f => f.coluna.trim().toUpperCase())); // Debug

    config.filtros.forEach(filtroConfig => {
      // Normaliza o nome da coluna no config.json
      const colunaNormalizada = filtroConfig.coluna.trim().toUpperCase();

      if (filtroConfig.enabled && colunas.includes(colunaNormalizada)) {
        const filtroDiv = document.createElement('div');
        filtroDiv.className = 'filtro';
        filtroDiv.innerHTML = `
          <label>${filtroConfig.label}<span class="info-icon" title="${filtroConfig.description}">ℹ️</span></label>
          ${filtroConfig.type === 'checkbox' ? gerarCheckbox(filtroConfig) : 
           filtroConfig.type === 'checkbox-multi' ? gerarCheckboxMulti(filtroConfig, perguntasArray) : 
           gerarLista(filtroConfig, perguntasArray)}
          
        `;
        filtrosColuna.appendChild(filtroDiv);
      } else {
        console.warn(`Filtro "${filtroConfig.coluna}" não encontrado nas colunas do CSV.`);
      }
    });

    // Gera as bolinhas das perguntas
    renderizarBolinhas(perguntasArray);

    // Adiciona listeners para os filtros
    document.querySelectorAll('.filtro input, .filtro select').forEach(elemento => {
      elemento.addEventListener('change', () => filtrarPerguntas(perguntasArray));
    });
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
  }
});

function csvToArray(csv) {
  const linhas = csv.split('\n');
  const headers = linhas[0].split(';').map(header => header.trim().toUpperCase()); // Usa ; como delimitador
  return linhas.slice(1).map(linha => {
    const valores = linha.split(';');
    return headers.reduce((obj, header, index) => {
      obj[header] = valores[index] ? valores[index].trim() : '';
      return obj;
    }, {});
  });
}

function gerarCheckbox(filtroConfig) {
  return `
    <div>
      <input type="checkbox" id="${filtroConfig.coluna}" name="${filtroConfig.coluna}">
      <label for="${filtroConfig.coluna}">Mostrar apenas 1</label>
    </div>
  `;
}

function gerarCheckboxMulti(filtroConfig, perguntas) {
  const opcoes = [...new Set(perguntas.map(p => p[filtroConfig.coluna.toUpperCase()] || 'Vazio'))];
  return `
    <div class="opcoes">
      ${opcoes.map(opcao => `
        <div>
          <input type="checkbox" id="${opcao}" name="${filtroConfig.coluna}" value="${opcao}"/>
          <label for="${opcao}">${opcao}</label>
        </div>
      `).join('')}
    </div>
  `;
}

function gerarLista(filtroConfig, perguntas) {
  const opcoes = [...new Set(perguntas.map(p => p[filtroConfig.coluna.toUpperCase()] || 'Vazio'))];
  return `
    <select id="${filtroConfig.coluna}">
      <option value="">Todos</option>
      ${opcoes.map(opcao => `<option value="${opcao}">${opcao}</option>`).join('')}
    </select>
  `;
}

function renderizarBolinhas(perguntas) {
  const perguntasColuna = document.getElementById('perguntas-coluna');
  perguntasColuna.innerHTML = ''; // Limpa as bolinhas atuais
  perguntas.forEach(pergunta => {
    const bolinha = document.createElement('div');
    bolinha.className = 'pergunta-bolinha';
    bolinha.dataset.tooltip = pergunta.QUESTAO;
    bolinha.textContent = pergunta.COD;
    perguntasColuna.appendChild(bolinha);
  });
}

function filtrarPerguntas(perguntas) {
  const filtrosAtivos = {};
  document.querySelectorAll('.filtro input:checked, .filtro select').forEach(elemento => {
    const coluna = elemento.name || elemento.id;
    const valor = elemento.value;
    console.log(elemento.name);
    console.log(elemento.checked);
    console.log(elemento.value);
    if (valor) {
      if(valor!='on') {
        if (!filtrosAtivos[coluna]) filtrosAtivos[coluna] = [];
        filtrosAtivos[coluna].push(valor);
      } else if (elemento.type === 'checkbox' && elemento.checked) {
        filtrosAtivos[coluna] = ['1']; // Filtro checkbox para valores 1
      }
    } else if (elemento.type === 'checkbox' && elemento.checked) {
      filtrosAtivos[coluna] = ['1']; // Filtro checkbox para valores 1
    }
  });
  console.log(filtrosAtivos);

  const perguntasFiltradas = perguntas.filter(pergunta => {
    return Object.keys(filtrosAtivos).every(coluna => {
      return filtrosAtivos[coluna].includes(pergunta[coluna.toUpperCase()]);
    });
  });

  // Atualiza as bolinhas
  renderizarBolinhas(perguntasFiltradas);

  // Desativa as bolinhas que não correspondem aos filtros
  document.querySelectorAll('.pergunta-bolinha').forEach(bolinha => {
    const cod = bolinha.textContent;
    const pergunta = perguntas.find(p => p.COD === cod);
    if (!perguntasFiltradas.includes(pergunta)) {
      bolinha.classList.add('desativada');
    } else {
      bolinha.classList.remove('desativada');
    }
  });
}