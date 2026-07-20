import { useState } from 'react';

export default function Step4StyleTinder({ trip, onNext, onPrev }: any) {
  const [pace, setPace] = useState(trip.pace || 'balanced');

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm">
      <h2 className="text-3xl font-bold mb-2">Seu Estilo</h2>
      <p className="text-slate-500 mb-8">Como você prefere levar a viagem?</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {['Leve', 'Equilibrado', 'Intenso'].map((p, idx) => {
          const val = ['light', 'balanced', 'intense'][idx];
          return (
            <button 
              key={val}
              onClick={() => setPace(val)}
              className={`p-6 border-2 rounded-[20px] font-bold transition-all ${pace === val ? 'border-lime-500 bg-lime-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {p}
            </button>
          )
        })}
      </div>

      <div className="bg-slate-900 text-white rounded-[24px] p-8 text-center">
        <div className="text-4xl mb-4">🔥</div>
        <h3 className="text-xl font-bold mb-2">Tinder de Experiências (Em breve)</h3>
        <p className="text-slate-400 mb-6">Em breve você fará o swipe de atrações para a IA aprender seu DNA exato.</p>
        <button className="bg-lime-400 text-slate-900 px-6 py-2 rounded-full font-bold">Ver Cards (Mock)</button>
      </div>

      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="text-slate-500 font-bold hover:text-slate-900 px-4 py-2">← Voltar</button>
        <button onClick={onNext} className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 px-8 rounded-full transition-colors">Continuar</button>
      </div>
    </div>
  );
}
