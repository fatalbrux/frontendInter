import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

// Coordenadas por defecto cuando el cliente todavía no tiene ubicación guardada.
// Ajusta esto al centro de tu zona de cobertura si quieres.
const LAT_DEFECTO = -17.9833; // Oruro, Bolivia
const LNG_DEFECTO = -67.15;

// Arregla el ícono por defecto de Leaflet, que no carga bien con el bundler de Angular.
// Los archivos vienen de node_modules/leaflet/dist/images (ver instrucciones de angular.json).
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-mapa-ubicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa-ubicacion.html',
})
export class MapaUbicacion implements OnInit, AfterViewInit, OnDestroy {
  @Input() latitud: number | null = null;
  @Input() longitud: number | null = null;
  @Output() ubicacionCambiada = new EventEmitter<{ latitud: number; longitud: number }>();

  @ViewChild('mapaContenedor', { static: true }) mapaContenedor!: ElementRef<HTMLDivElement>;

  latActual: number | null = null;
  lngActual: number | null = null;

  modoEdicion = false;

activarModoEdicion(): void {
  this.modoEdicion = true;
}

  private mapa?: L.Map;
  private marcador?: L.Marker;

  ngOnInit(): void {
    this.latActual = this.latitud;
    this.lngActual = this.longitud;
  }

  ngAfterViewInit(): void {
    const latInicial = this.latActual ?? LAT_DEFECTO;
    const lngInicial = this.lngActual ?? LNG_DEFECTO;
    const zoomInicial = this.latActual && this.lngActual ? 16 : 13;

    this.mapa = L.map(this.mapaContenedor.nativeElement).setView([latInicial, lngInicial], zoomInicial);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.mapa);

    if (this.latActual && this.lngActual) {
      this.colocarMarcador(this.latActual, this.lngActual);
    }

    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
  if (!this.modoEdicion) return;
  this.actualizarUbicacion(evento.latlng.lat, evento.latlng.lng);
  this.modoEdicion = false;
});
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  private colocarMarcador(lat: number, lng: number): void {
    if (!this.mapa) return;
    if (this.marcador) {
      this.marcador.setLatLng([lat, lng]);
    } else {
      this.marcador = L.marker([lat, lng]).addTo(this.mapa);
    }
  }

  private actualizarUbicacion(lat: number, lng: number): void {
    this.latActual = lat;
    this.lngActual = lng;
    this.colocarMarcador(lat, lng);
    this.ubicacionCambiada.emit({ latitud: lat, longitud: lng });
  }

  usarUbicacionActual(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const { latitude, longitude } = posicion.coords;
        this.actualizarUbicacion(latitude, longitude);
        this.mapa?.setView([latitude, longitude], 16);
      },
      (error) => console.error('No se pudo obtener la ubicación', error),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  actualizarLatManual(valor: string): void {
    const lat = parseFloat(valor);
    if (isNaN(lat) || this.lngActual === null) return;
    this.actualizarUbicacion(lat, this.lngActual);
    this.mapa?.setView([lat, this.lngActual], this.mapa.getZoom());
  }

  actualizarLngManual(valor: string): void {
    const lng = parseFloat(valor);
    if (isNaN(lng) || this.latActual === null) return;
    this.actualizarUbicacion(this.latActual, lng);
    this.mapa?.setView([this.latActual, lng], this.mapa.getZoom());
  }
}