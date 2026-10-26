import React, { useState, useRef, useEffect } from 'react';
import { type Sala, type AppConfig } from '../types';
import { ModalWrapper } from './ModalWrapper';
import { CICLOS } from '../config/data';
import { Loader2, ChevronDown } from 'lucide-react';

interface Props {
  sala: Sala;
  config: AppConfig;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
}

interface CustomSelectProps {
  options: string[];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (val: string) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, placeholder = 'Seleccione...', disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isMobile = window.innerWidth < 768;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 rounded-xl p-3 outline-none bg-white text-left flex justify-between items-center gap-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
          style={isMobile ? { width: 'calc(100vw - 64px)', left: 0 } : { width: '100%' }}
        >
          <li
            className="px-3 py-2 text-gray-400 text-sm cursor-pointer hover:bg-gray-50"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {placeholder}
          </li>
          {options.map(opt => (
            <li
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-sm ${value === opt ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-800'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ReservationForm: React.FC<Props> = ({ sala, config, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ codigo: '', carrera: '', ciclo: '10', tipo: '', programa: '' });
  const [isLoading, setIsLoading] = useState(false);

  const programasDisponibles = config.programasPorSala[sala.nombre] ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipo || !formData.carrera || !formData.programa) return;
    setIsLoading(true);
    await onSubmit({ ...formData, sala: sala.nombre, fecha: new Date().toISOString() });
  };

  return (
    <ModalWrapper title={`Reservar ${sala.nombre}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código de Alumno</label>
          <input type="text" required placeholder="Ej. u20211abcd" disabled={isLoading}
            value={formData.codigo}
            className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <CustomSelect
            options={config.tipos}
            value={formData.tipo}
            disabled={isLoading}
            onChange={val => setFormData({ ...formData, tipo: val })}
          />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <CustomSelect
              options={config.carreras.map(c => c.carrera)}
              value={formData.carrera}
              disabled={isLoading}
              onChange={val => setFormData({ ...formData, carrera: val })}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
            <CustomSelect
              options={CICLOS}
              value={formData.ciclo}
              disabled={isLoading}
              onChange={val => setFormData({ ...formData, ciclo: val })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Programa de Interés</label>
          <CustomSelect
            options={programasDisponibles}
            value={formData.programa}
            disabled={isLoading}
            onChange={val => setFormData({ ...formData, programa: val })}
          />
        </div>

        <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
          <button type="button" onClick={onClose} disabled={isLoading}
            className="w-full md:flex-1 py-3 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading}
            className="w-full md:flex-1 h-12 flex justify-center items-center bg-black hover:bg-gray-800 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Confirmar Reserva"}
          </button>
        </div>

      </form>
    </ModalWrapper>
  );
};