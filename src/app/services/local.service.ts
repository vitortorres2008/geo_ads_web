import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalService {
  private baseUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades';

  constructor(private http: HttpClient) { }

  getEstados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/estados?orderBy=nome`);
  }

  getMunicipios(uf: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/estados/${uf}/municipios?orderBy=nome`);
  }
}