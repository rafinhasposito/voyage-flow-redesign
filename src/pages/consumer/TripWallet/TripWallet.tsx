import { useParams, useNavigate } from 'react-router-dom';

export default function TripWallet() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-urbanist p-8">
      <header className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold">Carteira da Viagem</h1>
         <button className="bg-white border border-slate-200 px-4 py-2 rounded-full font-medium" onClick={() => navigate('/minhas-viagens')}>Voltar</button>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          <button className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold whitespace-nowrap">Todos</button>
          <button className="bg-white text-slate-600 hover:bg-slate-50 px-6 py-2 rounded-full font-bold border border-slate-200 whitespace-nowrap">Voos</button>
          <button className="bg-white text-slate-600 hover:bg-slate-50 px-6 py-2 rounded-full font-bold border border-slate-200 whitespace-nowrap">Hospedagem</button>
          <button className="bg-white text-slate-600 hover:bg-slate-50 px-6 py-2 rounded-full font-bold border border-slate-200 whitespace-nowrap">Documentos</button>
        </div>

        <div className="bg-white p-12 rounded-[24px] text-center border-2 border-dashed border-slate-300">
           <div className="text-4xl mb-4">🪪</div>
           <h3 className="text-xl font-bold mb-2">Sua carteira está vazia</h3>
           <p className="text-slate-500 mb-6">Seus comprovantes e reservas ficam todos aqui.</p>
           <button onClick={() => navigate(`/viagens/${tripId}/onboarding?step=2`)} className="bg-lime-400 font-bold px-6 py-3 rounded-full text-slate-900">
              Adicionar minha primeira reserva
           </button>
        </div>
      </div>
    </div>
  );
}
