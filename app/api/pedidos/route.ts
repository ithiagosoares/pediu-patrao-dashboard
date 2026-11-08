import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lerFiltros, lerInteiro } from '@/lib/filtros';
import { tratarErro } from '@/lib/respostas';

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const f = lerFiltros(params);
    const pagina = lerInteiro(params, 'pagina', 1, 1, 100000)!;
    const limite = lerInteiro(params, 'limite', 10, 1, 100)!;

    let consulta = supabase
      .from('pedidos')
      .select('id, status, valor_total, forma_pagamento, tipo, criado_em, clientes(nome)', { count: 'exact' })
      .gte('criado_em', f.inicio.toISOString())
      .lt('criado_em', f.fim.toISOString())
      .order('criado_em', { ascending: false })
      .range((pagina - 1) * limite, pagina * limite - 1);

    if (f.status) consulta = consulta.eq('status', f.status);

    const { data, error, count } = await consulta;
    if (error) throw error;

    return NextResponse.json({
      dados: data,
      paginacao: { pagina, limite, total: count ?? 0, total_paginas: Math.ceil((count ?? 0) / limite) },
    });
  } catch (erro) {
    return tratarErro(erro);
  }
}