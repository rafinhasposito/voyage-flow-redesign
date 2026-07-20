import { useState, useRef } from 'react';
import { useConsumerAuth } from '../../../contexts/ConsumerAuthProvider';
import { TripWalletRepository } from '../../../repositories/TripWalletRepository';
import { Loader2, FileText, Trash2, CheckCircle2 } from 'lucide-react';

export default function Step3Documents({ trip, documents, reservations, onRefresh, onNext, onPrev }: any) {
  const { user } = useConsumerAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedRes, setSelectedRes] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      // Validation: max 10MB, allowed types
      if (f.size > 10 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 10MB.');
        return;
      }
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(f.type)) {
        setError('Apenas PDF, JPEG, PNG e WEBP são suportados.');
        return;
      }
      setFile(f);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setError('');
    try {
      await TripWalletRepository.uploadDocument(
        trip.id,
        user.id,
        file,
        selectedRes || undefined
      );
      await onRefresh();
      setFile(null);
      setSelectedRes('');
    } catch (err: any) {
      console.error(err);
      setError('Falha ao enviar documento. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm('Deseja realmente remover este documento?')) return;
    try {
      await TripWalletRepository.deleteDocument(doc);
      await onRefresh();
    } catch (err) {
      alert("Falha ao remover documento.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-2">Seus Documentos</h2>
      <p className="text-slate-500 mb-8">Faça upload de vouchers, PDFs e passagens. Eles ficarão seguros e disponíveis offline na sua Carteira.</p>

      {/* Lista de Documentos Anexados */}
      {documents.length > 0 && (
         <div className="mb-10 space-y-3">
           <h4 className="font-bold text-slate-800">Documentos Salvos</h4>
           {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                   <FileText className="text-lime-600" />
                   <div>
                     <p className="font-semibold text-sm">{doc.file_name}</p>
                     <p className="text-xs text-slate-500">{(doc.file_size / 1024).toFixed(1)} KB</p>
                   </div>
                </div>
                <button onClick={() => handleDelete(doc)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg" title="Remover">
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
           ))}
         </div>
      )}

      {/* Upload Area */}
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-[20px] p-12 text-center hover:bg-slate-50 hover:border-lime-500 transition-colors cursor-pointer"
        >
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-bold text-slate-800">Clique ou arraste seu comprovante aqui</h3>
          <p className="text-slate-500 mt-2 text-sm">PDF, JPEG, PNG ou WEBP (Max: 10MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="application/pdf,image/jpeg,image/png,image/webp" 
          />
        </div>
      ) : (
        <div className="border border-slate-200 rounded-[20px] p-6 bg-slate-50">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <FileText className="text-slate-700" />
             </div>
             <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-slate-800 truncate">{file.name}</h4>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
             </div>
             <button onClick={() => setFile(null)} className="text-slate-500 text-sm font-semibold hover:text-slate-800">Cancelar</button>
          </div>
          
          <div className="mb-6">
             <label className="block text-sm font-semibold mb-2">Vincular a uma reserva (Opcional)</label>
             <select 
               value={selectedRes} 
               onChange={(e) => setSelectedRes(e.target.value)}
               className="w-full p-4 border border-slate-200 rounded-[16px] bg-white outline-none focus:border-lime-500"
             >
                <option value="">Não vincular</option>
                {reservations.map((r: any) => (
                   <option key={r.id} value={r.id}>{r.type === 'flight' ? '✈️ Voo' : '🏨 Hotel'}: {r.title}</option>
                ))}
             </select>
          </div>

          <button 
             onClick={handleUpload} 
             disabled={uploading}
             className="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center disabled:opacity-50"
          >
             {uploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle2 className="mr-2 h-5 w-5"/>}
             {uploading ? 'Enviando documento...' : 'Confirmar Upload'}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-4 text-center font-medium text-sm">{error}</p>}

      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="text-slate-500 font-bold hover:text-slate-900 px-4 py-2">← Voltar</button>
        <button onClick={onNext} className="bg-slate-900 hover:bg-black text-white font-bold py-4 px-8 rounded-full transition-colors">Continuar</button>
      </div>
    </div>
  );
}
