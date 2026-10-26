import React, { useState, useEffect } from 'react';
import { RoomCard } from './RoomCard';
import { ReservationForm } from './ReservationForm';
import { DetallesReserva } from './DetallesReserva';
import { apiService } from '../services/api';
import { type Sala, type AppConfig } from '../types';

const EMPTY_CONFIG: AppConfig = {
  carreras: [],
  tipos: [],
  programasPorSala: {}
};

export const Dashboard: React.FC = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [config, setConfig] = useState<AppConfig>(EMPTY_CONFIG);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { salas: salasData, config: configData } = await apiService.getSalasYConfig();
    setSalas(salasData);
    setConfig(configData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔒 RESERVAR
  const handleReservationSubmit = async (formData: any) => {
    if (!selectedSala) return;
    const now = new Date().toISOString();

    const success = await apiService.securePost({
      action: 'RESERVAR',
      sala: selectedSala.nombre,
      codigo: formData.codigo,
      carrera: formData.carrera,
      ciclo: formData.ciclo,
      tipo: formData.tipo,
      programa: formData.programa,
      fecha: now
    });

    if (success) {
      setSalas(salas.map(s => s.nombre === selectedSala.nombre ? {
        ...s,
        isReserved: true,
        ultRes: now,
        codigoActual: formData.codigo
      } : s));
      setSelectedSala(null);
    }
  };

  // 🔒 LIBERAR
  const handleLiberarSala = async (salaALiberar: Sala) => {
    const success = await apiService.securePost({
      action: 'LIBERAR',
      sala: salaALiberar.nombre
    });

    if (success) {
      setSalas(salas.map(s => s.nombre === salaALiberar.nombre ? {
        ...s,
        isReserved: false,
        ultRes: null,
        codigoActual: null
      } : s));
      setSelectedSala(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">

      <header className="mb-6 md:mb-8 border-b pb-4 md:pb-6 border-gray-200 flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Salas de Creación</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Gestión centralizada de ambientes.</p>
        </div>
        <img
          src="https://www.ulima.edu.pe/themes/custom/ulima/logo.svg"
          alt="Logo Universidad de Lima"
          className="h-8 md:h-12 w-auto object-contain self-start md:self-auto"
        />
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {salas.map(sala => (
            <RoomCard
              key={sala.nombre}
              sala={sala}
              onClick={setSelectedSala}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-end">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <a
            href="https://docs.google.com/document/d/13NHMljMZk311NJqRh8PAP3zalnrQ7qDnRs8D87H-A04/edit?tab=t.0"
            target="_blank" rel="noopener noreferrer"
            className="w-full md:w-auto text-center bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm md:text-base"
          >
            Lista de Programas
          </a>
          <a
            href="https://docs.google.com/spreadsheets/d/1_0EWAO0gLU_ymjDPbze4HPj2gQH_OZSSdS6Op-4Z6U8/edit?usp=sharing"
            target="_blank" rel="noopener noreferrer"
            className="w-full md:w-auto text-center bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm md:text-base"
          >
            Reporte de uso
          </a>
        </div>
        <p className="text-xs text-gray-500 w-full text-center md:text-right mt-3">
          Nota: Visualización solo a través de correo gmail institucional
        </p>
      </div>

      {selectedSala && (
        selectedSala.isReserved ? (
          <DetallesReserva
            sala={selectedSala}
            onClose={() => setSelectedSala(null)}
            onLiberar={handleLiberarSala}
          />
        ) : (
          <ReservationForm
            sala={selectedSala}
            config={config}
            onClose={() => setSelectedSala(null)}
            onSubmit={handleReservationSubmit}
          />
        )
      )}
    </div>
  );
};