/**
 * DocumentUploadButton
 *
 * Botão real de upload de documentos com Supabase Storage.
 * Requer tripId e userId para upload seguro.
 * Se tripId ou userId estiverem ausentes, renderiza estado desabilitado
 * com mensagem honesta — sem alert() nem simulação.
 */
import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2, FileText, XCircle } from 'lucide-react';
import { TripWalletRepository } from '@/repositories/TripWalletRepository';

interface DocumentUploadButtonProps {
  label: string;          // Ex: "Passaporte Válido"
  tripId?: string;
  userId?: string;
  reservationId?: string;
  acceptedFormats?: string; // Ex: "application/pdf,image/*"
  maxSizeMb?: number;
  /** Callback após upload bem-sucedido, recebe a URL assinada */
  onUploaded?: (signedUrl: string, fileName: string) => void;
  className?: string;
  disabled?: boolean;
}

export function DocumentUploadButton({
  label,
  tripId,
  userId,
  reservationId,
  acceptedFormats = 'application/pdf,image/jpeg,image/png',
  maxSizeMb = 10,
  onUploaded,
  className = '',
  disabled = false,
}: DocumentUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const canUpload = Boolean(tripId && userId) && !disabled;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canUpload) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tripId || !userId) return;

    // Validar tamanho
    if (file.size > maxSizeMb * 1024 * 1024) {
      setStatus('error');
      setErrorMsg(`Arquivo muito grande. Máximo: ${maxSizeMb}MB.`);
      return;
    }

    setStatus('uploading');
    setErrorMsg(null);

    try {
      const doc = await TripWalletRepository.uploadDocument(tripId, userId, file, reservationId);
      const signedUrl = await TripWalletRepository.getDocumentSignedUrl(doc);
      setUploadedName(file.name);
      setStatus('success');
      onUploaded?.(signedUrl, file.name);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Erro ao fazer upload. Tente novamente.');
    } finally {
      // Limpar o input para permitir reenvio do mesmo arquivo
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const renderContent = () => {
    if (!canUpload) {
      return (
        <div
          className={`flex items-center justify-between bg-slate-50 border border-dashed border-slate-200 p-3 rounded-xl ${className}`}
          title="Upload disponível apenas para usuários autenticados na viagem"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-500">{label}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            Indisponível
          </span>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className={`flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-emerald-800 block">{label}</span>
              <span className="text-[10px] text-emerald-600 font-medium truncate max-w-[140px] block">
                {uploadedName}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setStatus('idle'); setUploadedName(null); }}
            className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded hover:bg-emerald-200"
          >
            Substituir
          </button>
        </div>
      );
    }

    if (status === 'uploading') {
      return (
        <div className={`flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-xl ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span className="text-sm font-bold text-blue-800">Enviando {label}...</span>
          </div>
        </div>
      );
    }

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFormats}
          className="hidden"
          onChange={handleFileChange}
        />
        {status === 'error' && errorMsg && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-1">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}
        <div
          onClick={handleClick}
          className={`flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <UploadCloud className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-700">{label}</span>
          </div>
          <button
            onClick={handleClick}
            className="text-[10px] font-extrabold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200"
          >
            Anexar
          </button>
        </div>
      </>
    );
  };

  return <div>{renderContent()}</div>;
}
