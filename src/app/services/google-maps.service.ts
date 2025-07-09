import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsService {
  private mapa!: google.maps.Map;
  private geocoder!: google.maps.Geocoder;
  private placesService!: google.maps.places.PlacesService;
  private marcadores: google.maps.Marker[] = [];

  constructor() { }
  inicializarMapa(containerId: string, lat: number = -23.5505, lng: number = -46.6333, zoom: number = 13) {
    if (typeof google === 'undefined') {
      console.warn('Google Maps API ainda não foi carregada.');
      return;
    }
    
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }
    
    const centro = new google.maps.LatLng(lat, lng);
    this.mapa = new google.maps.Map(document.getElementById(containerId) as HTMLElement, {
      center: centro,
      zoom: zoom,
    });

    this.placesService = new google.maps.places.PlacesService(this.mapa);
  }
  
  // Método para centralizar o mapa em uma localização
  centralizarMapa(location: google.maps.LatLng, zoom: number = 15) {
    if (!this.mapa) {
      console.warn('Mapa não inicializado.');
      return;
    }
    
    this.mapa.setCenter(location);
    this.mapa.setZoom(zoom);
  }
  
  geocodificarEndereco(endereco: string): Promise<google.maps.LatLng> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        try {
          this.geocoder = new google.maps.Geocoder();
        } catch (error) {
          reject('Google Maps API não está disponível. Por favor, tente novamente.');
          return;
        }
      }

      this.geocoder.geocode({ address: endereco }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          reject(`Erro ao geocodificar: ${status}`);
        }
      });
    });
  }
  
  buscarEstabelecimentosProximos(tipo: string, location: google.maps.LatLng, radius: number = 5000): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        try {
          if (!this.mapa) {
            reject('Mapa não inicializado. Por favor, tente novamente.');
            return;
          }
          this.placesService = new google.maps.places.PlacesService(this.mapa);
        } catch (error) {
          reject('Google Maps API não está disponível. Por favor, tente novamente.');
          return;
        }
      }
      
      const request: google.maps.places.PlaceSearchRequest = {
        location,
        radius,
        type: tipo as any // Using 'as any' since types might vary
      };

      let allResults: google.maps.places.PlaceResult[] = [];
      
      const processResults = (results: google.maps.places.PlaceResult[] | null, 
                             status: google.maps.places.PlacesServiceStatus,
                             pagination: google.maps.places.PlaceSearchPagination | null) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          allResults = [...allResults, ...results];
          
          if (pagination && pagination.hasNextPage) {
            pagination.nextPage();
          } else {
            resolve(allResults);
          }
        } else {
          if (allResults.length > 0) {
            resolve(allResults);
          } else {
            reject(`Erro ao buscar estabelecimentos: ${status}`);
          }
        }
      };

      this.placesService.nearbySearch(request, processResults);
    });
  }
  
  adicionarMarcador(nome: string, location: google.maps.LatLng) {
    if (!this.mapa) {
      console.warn('Mapa não inicializado.');
      return;
    }
    
    const marcador = new google.maps.Marker({
      map: this.mapa,
      position: location,
      title: nome,
    });
    
    this.marcadores.push(marcador);
  }
  
  limparMarcadores() {
    if (this.marcadores.length > 0) {
      this.marcadores.forEach(m => m.setMap(null));
      this.marcadores = [];
    }
  }
}