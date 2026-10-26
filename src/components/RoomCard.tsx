import React, { useState, useEffect } from 'react';
import { type Sala } from '../types';
import { TIEMPO_RESERVA_MINUTOS } from '../config/data';

interface Props {
  sala: Sala;
  onClick: (sala: Sala) => void;
}

export const RoomCard: React.FC<Props> = ({ sala, onClick }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!sala.isReserved || !sala.ultRes) return;

    const calcProgress = () => {
      const start = new Date(sala.ultRes!).getTime();
      const durationMs = TIEMPO_RESERVA_MINUTOS * 60 * 1000;
      const end = start + durationMs;
      const now = Date.now();

      if (now >= end) {
        setProgress(0); // Si el tiempo ya pasó, la barra está vacía (0%)
      } else {
        // Calculamos los milisegundos restantes y sacamos el porcentaje
        const timeLeftMs = end - now;
        setProgress((timeLeftMs / durationMs) * 100);
      }
    };

    calcProgress();
    const interval = setInterval(calcProgress, 10000); // Actualiza cada 10s
    return () => clearInterval(interval);
  }, [sala]);

  return (
    <div 
      className={`relative rounded-xl border h-32 flex flex-col justify-center items-center text-center p-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        sala.isReserved 
          ? 'bg-red-50/50 border-red-200' 
          : 'bg-white border-gray-200'
      }`}
      onClick={() => onClick(sala)}
    >
      {/* text-base en móvil (más pequeño), text-lg en pantallas medianas/grandes */}
      <h3 className="text-base md:text-lg font-bold text-gray-800 z-10 leading-tight">
        {sala.nombre}
      </h3>
      
      {/* text-[10px] en móvil, text-xs en pantallas medianas/grandes */}
      <p className="text-[10px] md:text-xs text-gray-400 font-medium z-10 mt-1">
        Máquina: {sala.codMaquina}
      </p>

      {sala.isReserved && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-red-100 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-1000 ease-linear"
            // Usamos Math.max para asegurar que el porcentaje nunca sea un número negativo
            style={{ width: `${Math.max(progress, 0)}%` }} 
          />
        </div>
      )}
    </div>
  );
};