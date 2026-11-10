'use client';
import { useCallback, useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import TabelaPedidos from './components/TabelaPedidos';
import { moeda, ROTULO_STATUS } from '@/lib/formatar';

type Filtros = { data_inicio: string; data_fim: string; status: string; categoria: string; agrupamento: string };
type Indicadores = { faturamento: number; total_pedidos: number; ticket_medio: number; pedidos_cancelados: number; taxa_cancelamento: number };
type PontoVenda = { periodo: string; pedidos: number; faturamento: number };
type ItemStatus = { status: string; quantidade: number; valor: number };
type ItemRanking = { id: number; nome: string; categoria: string; quantidade: number; faturamento: number };

function dataMenos(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toLocaleDateString('sv-SE'); // formato AAAA-MM-DD
}

// "2026-11-08" -> "08/11"
function dataBR(periodo: string) {
  const [, mes, dia] = periodo.split('-');
  return `${dia}/${mes}`;
}

async function buscar(url: string) {
  const resposta = await fetch(url, { cache: 'no-store' });
  const json = await resposta.json();
  if (!resposta.ok) throw new Error(json.erro ?? 'Erro ao carregar os dados.');
  return json;
}

export default function Dashboard() {
  const [filtros, setFiltros] = useState<Filtros | null>(null);
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [vendas, setVendas] = useState<PontoVenda[]>([]);
  const [statusPedidos, setStatusPedidos] = useState<ItemStatus[]>([]);
  const [ranking, setRanking] = useState<ItemRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  // as datas padrão são calculadas só no navegador, ao abrir a página
  useEffect(() => {
    setFiltros({ data_inicio: dataMenos(30), data_fim: dataMenos(0), status: '', categoria: '', agrupamento: 'dia' });
    buscar('/api/categorias').then((j) => setCategorias(j.dados)).catch(() => setCategorias([]));
  }, []);

  const carregar = useCallback(async () => {
    if (!filtros) return;

    setCarregando(true);
    setErro(null);

    const periodo = new URLSearchParams({ data_inicio: filtros.data_inicio, data_fim: filtros.data_fim });

    const comStatus = new URLSearchParams(periodo);
    if (filtros.status) comStatus.set('status', filtros.status);

    const qsVendas = new URLSearchParams(comStatus);
    qsVendas.set('agrupamento', filtros.agrupamento);

    const qsRanking = new URLSearchParams(periodo);
    qsRanking.set('limite', '10');
    if (filtros.categoria) qsRanking.set('categoria', filtros.categoria);

    try {
      const [ind, ven, sta, ran] = await Promise.all([
        buscar(`/api/dashboard/indicadores?${comStatus}`),
        buscar(`/api/dashboard/vendas?${qsVendas}`),
        buscar(`/api/dashboard/pedidos-status?${periodo}`),
        buscar(`/api/dashboard/produtos-mais-vendidos?${qsRanking}`),
      ]);
      setIndicadores(ind.dados);
      setVendas(ven.dados);
      setStatusPedidos(sta.dados);
      setRanking(ran.dados);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  // carrega ao abrir e sempre que um filtro muda
  useEffect(() => { carregar(); }, [carregar]);

  // RF07: atualização automática a cada 60 segundos
  useEffect(() => {
    const id = setInterval(carregar, 60_000);
    return () => clearInterval(id);
  }, [carregar]);

  const alterar = (campo: keyof Filtros, valor: string) => {
    if (filtros) setFiltros({ ...filtros, [campo]: valor });
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pediu Patrão - Dashboard Administrativo</h1>
        <div className="flex items-center gap-3 text-gray-500">
          <span>Atualizado às {atualizadoEm ? atualizadoEm.toLocaleTimeString('pt-BR') : '-'}</span>
          <button onClick={carregar} disabled={carregando}>
            {carregando ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {filtros && (
        <section className="caixa flex flex-wrap gap-4">
          <label>
            Data inicial
            <input type="date" value={filtros.data_inicio} onChange={(e) => alterar('data_inicio', e.target.value)} />
          </label>
          <label>
            Data final
            <input type="date" value={filtros.data_fim} onChange={(e) => alterar('data_fim', e.target.value)} />
          </label>
          <label>
            Status
            <select value={filtros.status} onChange={(e) => alterar('status', e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ROTULO_STATUS).map(([valor, nome]) => (
                <option key={valor} value={valor}>{nome}</option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select value={filtros.categoria} onChange={(e) => alterar('categoria', e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Agrupar vendas por
            <select value={filtros.agrupamento} onChange={(e) => alterar('agrupamento', e.target.value)}>
              <option value="dia">Dia</option>
              <option value="semana">Semana</option>
              <option value="mes">Mês</option>
            </select>
          </label>
        </section>
      )}

      {erro && <p className="caixa text-red-700">Erro: {erro}</p>}

      {indicadores && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="caixa">
            <p className="text-gray-500">Faturamento</p>
            <p className="text-2xl font-semibold">{moeda(indicadores.faturamento)}</p>
          </div>
          <div className="caixa">
            <p className="text-gray-500">Pedidos</p>
            <p className="text-2xl font-semibold">{indicadores.total_pedidos}</p>
          </div>
          <div className="caixa">
            <p className="text-gray-500">Ticket médio</p>
            <p className="text-2xl font-semibold">{moeda(indicadores.ticket_medio)}</p>
          </div>
          <div className="caixa">
            <p className="text-gray-500">Cancelados</p>
            <p className="text-2xl font-semibold">
              {indicadores.pedidos_cancelados}{' '}
              <span className="text-sm font-normal text-gray-500">
                ({Number(indicadores.taxa_cancelamento).toLocaleString('pt-BR')}%)
              </span>
            </p>
          </div>
        </div>
      )}

      <section className="caixa">
        <h2>Faturamento por período</h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={vendas}>
              <CartesianGrid vertical={false} stroke="#eceef1" />
              <XAxis dataKey="periodo" tickFormatter={dataBR} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip labelFormatter={(p) => dataBR(String(p))} formatter={(v) => [moeda(Number(v)), 'Faturamento']} />
              <Bar dataKey="faturamento" fill="#4a6fa5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <section className="caixa">
          <h2>Pedidos por status</h2>
          <table>
            <thead>
              <tr><th>Status</th><th>Qtd.</th><th>Valor</th></tr>
            </thead>
            <tbody>
              {statusPedidos.map((s) => (
                <tr key={s.status}>
                  <td>{ROTULO_STATUS[s.status] ?? s.status}</td>
                  <td>{s.quantidade}</td>
                  <td>{moeda(s.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="caixa">
          <h2>Produtos mais vendidos</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Produto</th><th>Categoria</th><th>Qtd.</th><th>Faturamento</th></tr>
            </thead>
            <tbody>
              {ranking.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.nome}</td>
                  <td>{p.categoria}</td>
                  <td>{p.quantidade}</td>
                  <td>{moeda(p.faturamento)}</td>
                </tr>
              ))}
              {ranking.length === 0 && <tr><td colSpan={5}>Nenhum produto vendido no período.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      {filtros && (
        <TabelaPedidos
          data_inicio={filtros.data_inicio}
          data_fim={filtros.data_fim}
          status={filtros.status}
          atualizadoEm={atualizadoEm}
        />
      )}
    </main>
  );
}
