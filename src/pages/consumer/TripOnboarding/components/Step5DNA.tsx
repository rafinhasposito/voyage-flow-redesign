export default function Step5DNA({ trip, onPrev, onFinish }: any) {
  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm">
      <h2 className="text-3xl font-bold mb-2">DNA da Sua Viagem</h2>
      <p className="text-slate-500 mb-8">Sua base está pronta. Veja o que temos até agora.</p>

      <div className="bg-slate-50 rounded-[20px] p-6 mb-8 space-y-4">
        <div className="flex justify-between border-b border-slate-200 pb-4">
          <span className="text-slate-500">Destino</span>
          <span className="font-bold">{trip.destination}</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-4">
          <span className="text-slate-500">Companhia</span>
          <span className="font-bold">{trip.companionship}</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-4">
          <span className="text-slate-500">Reservas Confirmadas</span>
          <span className="font-bold text-lime-600">0 itens (Exemplo)</span>
        </div>
      </div>

      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="text-slate-500 font-bold hover:text-slate-900 px-4 py-2">← Voltar</button>
        <button onClick={onFinish} className="bg-slate-900 hover:bg-black text-white font-bold py-4 px-8 rounded-full transition-colors">
          Salvar & Ir para a Carteira
        </button>
      </div>
    </div>
  );
}
