import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lerFiltros } from '@/lib/filtros';
import { tratarErro } from '@/lib/respostas';

export async function GET(req: NextRequest) {
  try {
    const f = lerFiltros(req.nextUrl.searchParams);

    const { data, error } = await supabase.rpc('fn_indicadores', {
      p_inicio: f.inicio.toISOString(),
      p_fim: f.fim.toISOString(),
      p_status: f.status,
    });
    if (error) throw error;

    return NextResponse.json({ dados: data });
  } catch (erro) {
    return tratarErro(erro);
  }
}