import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export const ProfileRepository = {
  /**
   * Garante que o profile associado ao usuário atual existe no banco.
   * Usado para sincronizar de forma idempotente a tabela profiles com auth.users.
   */
  async ensureCurrentUserProfile(user: User): Promise<void> {
    if (!user || !user.id) throw new Error("Usuário inválido fornecido para o perfil");

    // Tentar ler o profile
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    // Se o profile não existe, criar por upsert
    if (!profile) {
      const email = user.email || "";
      const firstName = user.user_metadata?.first_name || "";
      const lastName = user.user_metadata?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: fullName || null,
        }, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }
    }
  }
};
