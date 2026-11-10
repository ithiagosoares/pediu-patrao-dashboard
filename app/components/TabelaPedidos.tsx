'use client';
import { useEffect, useState } from 'react';
import { moeda, ROTULO_STATUS } from '@/lib/formatar';

type Pedido = {
  id: number;
  status: string;
  valor_total: number;
  forma_pagamento: string;
  tipo: string;
  criado_em: string;
  clientes: { nome: string } | null;
};

const PAGAMENTO: Record<string, string> = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' };

type Props = { data_inicio: string; data_fim: string; status: string; atualizadoEm: Date | null };

export default function TabelaPedidos({ data_inicio, data_fim, status, atualizadoEm }: Props) {
  const [pagina, setPagina] = useState(1);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  // volta para a página 1 quando os filtros mudam
  useEffect(() => { setPagina(1); }, [data_inicio, data_fim, status]);

  useEffect(() => {
    const qs = new URLSearchParams({ data_inicio, data_fim, pagina: String(pagina), limite: '10' });
    if (status) qs.set('status', status);

    fetch(`/api/pedidos?${qs}`, { cache: 'no-store' })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.erro ?? 'Erro ao carregar pedidos.');
        setPedidos(json.dados);
        setTotalPaginas(Math.max(1, json.paginacao.total_paginas));
        setErro(null);
      })
      .catch((e) => setErro(e.message));
  }, [data_inicio, data_fim, status, pagina, atualizadoEm]);

  return (
    <section className="caixa">
      <h2>Últimos pedidos</h2>
      {erro && <p className="text-red-700">{erro}</p>}

      <table>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{new Date(p.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>{p.clientes?.nome ?? '-'}</td>
              <td>{p.tipo === 'balcao' ? 'Balcão' : 'Delivery'}</td>
              <td>{PAGAMENTO[p.forma_pagamento] ?? p.forma_pagamento}</td>
              <td>{ROTULO_STATUS[p.status] ?? p.status}</td>
              <td>{moeda(p.valor_total)}</td>
            </tr>
          ))}
          {pedidos.length === 0 && !erro && (
            <tr><td colSpan={7}>Nenhum pedido encontrado.</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 flex items-center justify-end gap-3 text-gray-500">
        <button onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1}>Anterior</button>
        <span>Página {pagina} de {totalPaginas}</span>
        <button onClick={() => setPagina((p) => p + 1)} disabled={pagina >= totalPaginas}>Próxima</button>
      </div>
    </section>
  );
}
