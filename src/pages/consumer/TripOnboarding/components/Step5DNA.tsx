import { useNavigate } from 'react-router-dom';
import { Bot, Map, Calendar, Wallet } from 'lucide-react';
import { buildTripEngineDTO } from '../../../../utils/engineMapper';

export default function Step5DNA({ trip, reservations, documents, onPrev }: any) {
  const navigate = useNavigate();
  
  const flightCount = reservations.filter((r:any) => r.type === 'flight').length;
  const hotelCount = reservations.filter((r:any) => r.type === 'hotel').length;
  const otherCount = reservations.length - flightCount - hotelCount;

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-2">DNA da Sua Viagem</h2>
      <p className="text-slate-500 mb-8">Sua base está pronta. Este é o panorama do seu projeto de viagem até agora.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
         <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Map className="w-5 h-5 text-lime-600"/> A Estrutura</h4>
            <div className="space-y-3 text-sm">
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Destino</span>
                 <span className="font-semibold">{trip.destination}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Período</span>
                 <span className="font-semibold">{trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'N/D'}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Companhia</span>
                 <span className="font-semibold capitalize">{trip.companionship || 'N/D'}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Orçamento</span>
                 <span className="font-semibold capitalize">{trip.budget_level || 'N/D'}</span>
               </div>
            </div>
         </div>

         <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-lime-600"/> Sua Carteira</h4>
            <div className="space-y-3 text-sm">
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Voos Cadastrados</span>
                 <span className="font-semibold text-slate-900">{flightCount}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Hospedagem</span>
                 <span className="font-semibold text-slate-900">{hotelCount}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Outros Compromissos Fixos</span>
                 <span className="font-semibold text-slate-900">{otherCount}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Documentos Salvos</span>
                 <span className="font-semibold text-slate-900">{documents.length}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-lime-900 text-lime-50 rounded-[24px] p-8 text-center flex flex-col items-center justify-center">
         <Bot className="w-12 h-12 mb-4 text-lime-400" />
         <h3 className="text-xl font-bold mb-2">Tudo pronto para o roteiro!</h3>
         <p className="text-lime-200/80 mb-6 max-w-md">
            Seus compromissos fixos serão isolados e não poderão ser substituídos. 
            O restante dos dias será preenchido pelo Concierge usando seus votos.
         </p>
         <button 
           onClick={() => {
            navigate('/viagens/' + trip.id + '/roteiro');
          }} 
           className="bg-lime-400 hover:bg-lime-500 text-lime-950 font-bold py-4 px-8 rounded-full transition-colors w-full md:w-auto"
         >
           Criar meu Roteiro
         </button>
      </div>

      <div className="mt-8 flex justify-center">
         <button 
           onClick={() => navigate(`/viagens/${trip.id}/carteira`)} 
           className="text-slate-500 font-bold hover:text-slate-900 underline underline-offset-4"
         >
           Ou pular e Abrir Carteira da Viagem
         </button>
      </div>
    </div>
  );
}
