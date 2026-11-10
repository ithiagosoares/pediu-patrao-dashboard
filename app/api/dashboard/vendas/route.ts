import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lerFiltros, ErroValidacao } from '@/lib/filtros';
import { tratarErro } from '@/lib/respostas';

const AGRUPAMENTOS: Record<string, string> = { dia: 'day', semana: 'week', mes: 'month' };

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const f = lerFiltros(params);
    const agrupamento = params.get('agrupamento') ?? 'dia';
    if (!AGRUPAMENTOS[agrupamento]) {
      throw new ErroValidacao("Parâmetro 'agrupamento' inválido. Valores aceitos: dia, semana, mes.");
    }

    const { data, error } = await supabase.rpc('fn_vendas_periodo', {
      p_inicio: f.inicio.toISOString(),
      p_fim: f.fim.toISOString(),
      p_status: f.status,
      p_agrupamento: AGRUPAMENTOS[agrupamento],
    });
    if (error) throw error;

    return NextResponse.json({ agrupamento, dados: data });
  } catch (erro) {
    return tratarErro(erro);
  }
}