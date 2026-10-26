export interface Sala {
  id?: number | string;
  nombre: string;
  tipo: string;
  codMaquina: string;
  ultRes: string | null;
  codigoActual: string | null;
  isReserved: boolean;
}

export interface CarreraItem {
  carrera: string;
  facultad: string;
}

export interface AppConfig {
  carreras: CarreraItem[];
  tipos: string[];
  programasPorSala: Record<string, string[]>;
}

export interface ReservationPayload {
  action: 'RESERVAR' | 'LIBERAR';
  sala: string;
  nombre?: string;
  codigo?: string;
  carrera?: string;
  ciclo?: string;
  tipo?: string;
  programa?: string;
  fecha?: string;
}