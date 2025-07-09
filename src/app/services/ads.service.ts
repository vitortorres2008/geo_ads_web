import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private accessToken = 'EAAO2FRGyu5IBO8haZASDerhzLdZB5PcNZAKckqL5JZBFKCAxbVWjR5gQ0ZBu6XO0Bo7GqcHdeT4ylinx3VGVjtjmWThNJZA65NSvE3Nyf6qzPl6psnTeXtNNZAl8XFZB6ACXKd0JQNT9Wme1JhIGSgzZBjrerq2uY8ZCZBLZBx6oqT6JLBYFmGOZCKjMB6rP1VutIYZBUqhJPaDONeLYAOAfVDOdp8ZBZC6ZAfTIiDWOjAKD1DZALjEQ0WpGJZBMEceZCD8sZAfa4ogZDZD';
  private apiVersion = 'v18.0';
  private apiUrl = `https://graph.facebook.com/${this.apiVersion}/ads_archive`;

  constructor(private http: HttpClient) {}

  getAdsBySearchTerm(searchTerm: string, country: string = 'BR'): Observable<any> {
    const params = new HttpParams()
      .set('access_token', this.accessToken)
      .set('search_terms', searchTerm)
      .set('ad_type', 'POLITICAL_AND_ISSUE_ADS')  // Pode mudar de acordo com a finalidade da app
      .set('ad_reached_countries', `["${country}"]`)
      .set('fields', 'ad_creative_body,ad_creative_link_caption,ad_creative_link_description,ad_delivery_start_time,ad_delivery_stop_time,page_id,page_name');

    return this.http.get(this.apiUrl, { params });
  }

  getPlacesByCity(city: string): Observable<any[]> {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=estabelecimentos+em+${city}&key=AIzaSyACahqvP7oOd7kpi605in6ZwpUU-ltGURw`;
    return this.http.get<any>(url).pipe(
      map((res) =>
        res.results.map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          place_id: place.place_id,
        }))
      )
    );
  }

  checkEstablishment(mapsAddress: string): Observable<any> {
    const url = 'http://127.0.0.1:5000/api/check-establishment';
    const payload = {
      maps_address: mapsAddress
    };

    return this.http.post<any>(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
