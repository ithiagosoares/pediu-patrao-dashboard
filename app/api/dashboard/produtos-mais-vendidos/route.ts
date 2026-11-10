import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lerFiltros, lerInteiro } from '@/lib/filtros';
import { tratarErro } from '@/lib/respostas';

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const f = lerFiltros(params);
    const limite = lerInteiro(params, 'limite', 10, 1, 50);
    const categoria = lerInteiro(params, 'categoria', null, 1, 999999);

    const { data, error } = await supabase.rpc('fn_produtos_mais_vendidos', {
      p_inicio: f.inicio.toISOString(),
      p_fim: f.fim.toISOString(),
      p_categoria: categoria,
      p_limite: limite,
    });
    if (error) throw error;

    return NextResponse.json({ dados: data });
  } catch (erro) {
    return tratarErro(erro);
  }
}