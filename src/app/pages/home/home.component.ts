import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsService } from '../../services/google-maps.service';
import { LocalService } from '../../services/local.service';
import { AdsService } from '../../services/ads.service';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  standalone: true,  styles: [
    `
      .search-container {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .form-row {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      .form-group {
        flex: 1;
      }
      select,
      button {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
      }
      button {
        background-color: #4285f4;
        color: white;
        cursor: pointer;
        border: none;
      }
      button:hover {
        background-color: #3367d6;
      }
      button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      .results-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .results-table th,
      .results-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .results-table th {
        background-color: #f2f2f2;
      }
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        margin-top: 20px;
      }
      .no-results {
        text-align: center;
        margin: 20px;
        font-style: italic;
      }
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      .has-ads {
        color: green;
        font-weight: bold;
      }
      .no-ads {
        color: #888;
      }
      .loading-ads {
        color: #3498db;
        font-style: italic;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  searchForm!: FormGroup;
  resultados: any[] = [];
  paginatedResults: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searched = false;
  municipios: any[] = [];
  isLoading = false;

  tiposEstabelecimentos = [
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'cafe', label: 'Café' },
    { value: 'bar', label: 'Bar' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'school', label: 'Escola' },
    { value: 'supermarket', label: 'Supermercado' },
    { value: 'pharmacy', label: 'Farmácia' },
    { value: 'bank', label: 'Banco' },
    { value: 'gas_station', label: 'Posto de Gasolina' },
    { value: 'shopping_mall', label: 'Shopping Center' },
  ];

  paises = [
    { value: 'Brasil', label: 'Brasil' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Chile', label: 'Chile' },
  ];

  estados: any[] = [];
  cidades: any[] = [];
  bairros: any[] = [];
  constructor(
    private googleMapsService: GoogleMapsService,
    private localService: LocalService,
    private adsService: AdsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormListeners();

    // Carrega os estados do Brasil por padrão
    this.carregarEstados('Brasil');

    // Verifique se o Google Maps API já está carregado
    if (typeof google !== 'undefined') {
      this.googleMapsService.inicializarMapa('map');
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyACahqvP7oOd7kpi605in6ZwpUU-ltGURw&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API carregada com sucesso');
        this.googleMapsService.inicializarMapa('map');
      };
      document.head.appendChild(script);
    }
  }

  initializeForm() {
    this.searchForm = this.fb.group({
      tipoEstabelecimento: ['restaurant', Validators.required],
      pais: ['Brasil', Validators.required],
      estado: [{ value: '', disabled: false }, Validators.required],
      cidade: [{ value: '', disabled: true }, Validators.required],
      bairro: [{ value: '', disabled: true }],
    });
  }

  setupFormListeners() {
    // Quando o país mudar, carrega os estados
    this.searchForm.get('pais')?.valueChanges.subscribe((pais) => {
      this.carregarEstados(pais);
      this.searchForm.get('estado')?.setValue('');
      this.searchForm.get('cidade')?.setValue('');
      this.searchForm.get('bairro')?.setValue('');

      this.searchForm.get('estado')?.enable();
      this.searchForm.get('cidade')?.disable();
      this.searchForm.get('bairro')?.disable();
    });

    // Quando o estado mudar, carrega as cidades
    this.searchForm.get('estado')?.valueChanges.subscribe((estado) => {
      if (estado) {
        this.carregarCidades(estado);
        this.searchForm.get('cidade')?.setValue('');
        this.searchForm.get('bairro')?.setValue('');

        this.searchForm.get('cidade')?.enable();
        this.searchForm.get('bairro')?.disable();
      }
    });

    // Quando a cidade mudar, carrega os bairros
    this.searchForm.get('cidade')?.valueChanges.subscribe((cidade) => {
      if (cidade) {
        this.carregarBairros(cidade);
        this.searchForm.get('bairro')?.setValue('');

        this.searchForm.get('bairro')?.enable();
      }
    });
  }

  carregarEstados(pais: string) {
    if (pais === 'Brasil') {
      this.estados = [
        { value: 'AC', label: 'Acre' },
        { value: 'AL', label: 'Alagoas' },
        { value: 'AP', label: 'Amapá' },
        { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' },
        { value: 'CE', label: 'Ceará' },
        { value: 'DF', label: 'Distrito Federal' },
        { value: 'ES', label: 'Espírito Santo' },
        { value: 'GO', label: 'Goiás' },
        { value: 'MA', label: 'Maranhão' },
        { value: 'MT', label: 'Mato Grosso' },
        { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' },
        { value: 'PA', label: 'Pará' },
        { value: 'PB', label: 'Paraíba' },
        { value: 'PR', label: 'Paraná' },
        { value: 'PE', label: 'Pernambuco' },
        { value: 'PI', label: 'Piauí' },
        { value: 'RJ', label: 'Rio de Janeiro' },
        { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' },
        { value: 'RO', label: 'Rondônia' },
        { value: 'RR', label: 'Roraima' },
        { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'São Paulo' },
        { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' },
      ];
    } else if (pais === 'Argentina') {
      this.estados = [
        { value: 'BA', label: 'Buenos Aires' },
        { value: 'CO', label: 'Córdoba' },
      ];
    } else if (pais === 'Chile') {
      this.estados = [
        { value: 'RM', label: 'Região Metropolitana' },
        { value: 'VS', label: 'Valparaíso' },
      ];
    }
  }

  carregarCidades(estado: string) {
    if (this.searchForm.get('pais')?.value === 'Brasil') {
      // Usando a API do IBGE para carregar municípios brasileiros
      this.localService.getMunicipios(estado).subscribe((municipios) => {
        this.cidades = municipios.map((municipio: any) => ({
          value: municipio.id.toString(),
          label: municipio.nome,
        }));
      });
    } else if (estado === 'BA') {
      // Argentina - Buenos Aires
      this.cidades = [
        { value: 'caba', label: 'Ciudad Autónoma de Buenos Aires' },
        { value: 'laplata', label: 'La Plata' },
      ];
    } else if (estado === 'CO') {
      // Argentina - Córdoba
      this.cidades = [
        { value: 'cordoba_capital', label: 'Córdoba Capital' },
        { value: 'villa_maria', label: 'Villa María' },
      ];
    } else if (estado === 'RM') {
      // Chile - Região Metropolitana
      this.cidades = [
        { value: 'santiago', label: 'Santiago' },
        { value: 'maipu', label: 'Maipú' },
      ];
    } else if (estado === 'VS') {
      // Chile - Valparaíso
      this.cidades = [
        { value: 'valparaiso_cidade', label: 'Valparaíso' },
        { value: 'vina_del_mar', label: 'Viña del Mar' },
      ];
    }
  }

  carregarBairros(cidade: string) {
    // Simulando uma API que retorna bairros
    if (cidade === 'sao_paulo') {
      this.bairros = [
        { value: 'moema', label: 'Moema' },
        { value: 'pinheiros', label: 'Pinheiros' },
        { value: 'morumbi', label: 'Morumbi' },
      ];
    } else if (cidade === 'rio_de_janeiro') {
      this.bairros = [
        { value: 'copacabana', label: 'Copacabana' },
        { value: 'ipanema', label: 'Ipanema' },
      ];
    } else {
      // Para outras cidades, adicione alguns bairros genéricos
      this.bairros = [
        { value: 'centro', label: 'Centro' },
        { value: 'norte', label: 'Zona Norte' },
        { value: 'sul', label: 'Zona Sul' },
      ];
    }
  }

  getEnderecoCompleto(): string {
    const form = this.searchForm.value;
    let endereco = '';

    if (form.bairro) {
      const bairroLabel = this.bairros.find(
        (b) => b.value === form.bairro
      )?.label;
      endereco += bairroLabel + ', ';
    }

    if (form.cidade) {
      const cidadeLabel = this.cidades.find(
        (c) => c.value === form.cidade
      )?.label;
      endereco += cidadeLabel + ', ';
    }

    if (form.estado) {
      const estadoLabel = this.estados.find(
        (e) => e.value === form.estado
      )?.label;
      endereco += estadoLabel + ', ';
    }

    if (form.pais) {
      endereco += form.pais;
    }

    return endereco;
  }  async buscar() {
    try {
      if (typeof google === 'undefined') {
        alert(
          'Google Maps API ainda não foi carregada. Por favor, aguarde um momento e tente novamente.'
        );
        return;
      }

      this.isLoading = true; // Ativa o spinner de loading

      const tipoEstabelecimento = this.searchForm.get(
        'tipoEstabelecimento'
      )?.value;
      const endereco = this.getEnderecoCompleto();

      if (!endereco) {
        alert('Por favor, selecione pelo menos o país e o estado.');
        this.isLoading = false; // Desativa o spinner se houver erro
        return;
      }

      // Obter coordenadas do endereço
      const coords = await this.googleMapsService.geocodificarEndereco(
        endereco
      );
      
      // Centralizar o mapa na localização pesquisada
      this.googleMapsService.centralizarMapa(coords, 13);
      
      // Buscar estabelecimentos próximos
      const resultados =
        await this.googleMapsService.buscarEstabelecimentosProximos(
          tipoEstabelecimento,
          coords
        );
      this.resultados = resultados;
      this.searched = true;
      this.currentPage = 1;
      this.updatePagination();      
      
      // Limpar marcadores anteriores e adicionar novos
      this.googleMapsService.limparMarcadores();
      
      // Adicionar marcador para a localização pesquisada
      this.googleMapsService.adicionarMarcador(`Localização: ${endereco}`, coords);
      
      // Adicionar marcadores para os resultados
      resultados.forEach((r) => {
        if (r.geometry?.location) {
          const name = r.name || 'Sem nome';
          this.googleMapsService.adicionarMarcador(name, r.geometry.location);
        }
      });

      // Verificar presença de anúncios para cada estabelecimento
      this.verificarAnuncios();
      
      this.isLoading = false; // Desativa o spinner após carregar tudo
    } catch (error) {
      this.isLoading = false; // Desativa o spinner em caso de erro
      alert(error);
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.resultados.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.resultados.length
    );
    this.paginatedResults = this.resultados.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  // Verifica quais estabelecimentos estão presentes na biblioteca de anúncios do Facebook
  verificarAnuncios() {
    this.resultados.forEach((estabelecimento, index) => {
      // Inicialmente, marca como verificando
      estabelecimento.hasAds = undefined;
      
      // Só verifica se o estabelecimento tiver um nome
      if (estabelecimento.name) {
        this.adsService.checkEstablishment(`${estabelecimento.name} - ${estabelecimento.vicinity}`)
          .pipe(
            catchError(error => {
              console.error(`Erro ao verificar anúncios para ${estabelecimento.name}:`, error);
              return of(false);
            })
          )
          .subscribe(resp => {
            estabelecimento.hasAds = resp.has_ads;
            // Atualiza a tabela se o estabelecimento estiver na página atual
            this.updatePagination();
          });
      } else {
        estabelecimento.hasAds = false;
      }
    });
  }
}
