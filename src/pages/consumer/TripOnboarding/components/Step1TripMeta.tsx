import { useState } from 'react';

export default function Step1TripMeta({ trip, onSave, onNext }: any) {
  const [formData, setFormData] = useState({
    destination: trip.destination || '',
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    companionship: trip.companionship || 'couple',
    budget_level: trip.budget_level || 'medium',
  });

  const handleChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleNext = () => {
    onSave(formData);
    onNext();
  };

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm">
      <h2 className="text-3xl font-bold mb-2">Sua viagem</h2>
      <p className="text-slate-500 mb-8">Vamos confirmar as informações essenciais.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Destino</label>
          <input 
            type="text" 
            value={formData.destination} 
            onChange={(e) => handleChange('destination', e.target.value)}
            className="w-full p-4 border border-slate-200 rounded-[16px] focus:outline-none focus:border-lime-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Chegada</label>
            <input 
              type="date" 
              value={formData.start_date} 
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-[16px] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Partida</label>
            <input 
              type="date" 
              value={formData.end_date} 
              onChange={(e) => handleChange('end_date', e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-[16px] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-semibold mb-2">Companhia</label>
            <select 
              value={formData.companionship} 
              onChange={(e) => handleChange('companionship', e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-[16px] bg-white focus:outline-none"
            >
              <option value="solo">Viajando Solo</option>
              <option value="couple">Casal</option>
              <option value="family">Família</option>
              <option value="friends">Amigos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Orçamento Base</label>
            <select 
              value={formData.budget_level} 
              onChange={(e) => handleChange('budget_level', e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-[16px] bg-white focus:outline-none"
            >
              <option value="low">Econômico</option>
              <option value="medium">Equilibrado</option>
              <option value="high">Premium</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <button 
          onClick={handleNext}
          className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 px-8 rounded-full transition-colors"
        >
          Salvar e Continuar
        </button>
      </div>
    </div>
  );
}
