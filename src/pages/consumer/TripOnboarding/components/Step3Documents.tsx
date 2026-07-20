import { useState } from 'react';

export default function Step3Documents({ onNext, onPrev }: any) {
  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm">
      <h2 className="text-3xl font-bold mb-2">Seus Documentos</h2>
      <p className="text-slate-500 mb-8">Faça upload de vouchers, PDFs e passagens. Eles ficarão seguros e disponíveis offline na sua Carteira.</p>

      <div className="border-2 border-dashed border-slate-300 rounded-[20px] p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-bold text-slate-800">Arraste seus comprovantes aqui</h3>
        <p className="text-slate-500 mt-2 text-sm">PDF, imagem, print ou arquivo .eml</p>
        <button className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full font-medium">Selecionar Arquivo</button>
      </div>

      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="text-slate-500 font-bold hover:text-slate-900 px-4 py-2">← Voltar</button>
        <button onClick={onNext} className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 px-8 rounded-full transition-colors">Continuar</button>
      </div>
    </div>
  );
}
