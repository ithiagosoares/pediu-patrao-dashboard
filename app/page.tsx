'use client';
import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import TabelaPedidos from './components/TabelaPedidos';
import { moeda, ROTULO_STATUS } from '@/lib/formatar';

type Filtros = { data_inicio: string; data_fim: string; status: string; categoria: string; agrupamento: string };
type Indicadores = { faturamento: number; total_pedidos: number; ticket_medio: number; pedidos_cancelados: number; taxa_cancelamento: number };
type PontoVenda = { periodo: string; pedidos: number; faturamento: number };
type ItemStatus = { status: string; quantidade: number; valor: number };
type ItemRanking = { id: number; nome: string; categoria: string; quantidade: number; faturamento: number };

// configuração do gráfico no padrão do shadcn/ui (nome e cor de cada série)
const configGrafico = {
  faturamento: { label: 'Faturamento', color: 'var(--chart-2)' },
} satisfies ChartConfig;

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

  const cardsIndicadores = indicadores
    ? [
        { titulo: 'Faturamento', valor: moeda(indicadores.faturamento) },
        { titulo: 'Pedidos', valor: String(indicadores.total_pedidos) },
        { titulo: 'Ticket médio', valor: moeda(indicadores.ticket_medio) },
        {
          titulo: 'Cancelados',
          valor: String(indicadores.pedidos_cancelados),
          extra: `${Number(indicadores.taxa_cancelamento).toLocaleString('pt-BR')}% dos pedidos`,
        },
      ]
    : [];

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Pediu Patrão - Dashboard Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Atualizado às {atualizadoEm ? atualizadoEm.toLocaleTimeString('pt-BR') : '-'}
          </p>
        </div>
        <Button onClick={carregar} disabled={carregando}>
          {carregando ? 'Carregando...' : 'Atualizar'}
        </Button>
      </div>

      {filtros && (
        <Card>
          <CardContent className="flex flex-wrap gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="data_inicio">Data inicial</Label>
              <Input id="data_inicio" type="date" value={filtros.data_inicio}
                onChange={(e) => alterar('data_inicio', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="data_fim">Data final</Label>
              <Input id="data_fim" type="date" value={filtros.data_fim}
                onChange={(e) => alterar('data_fim', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <NativeSelect id="status" value={filtros.status} onChange={(e) => alterar('status', e.target.value)}>
                <NativeSelectOption value="">Todos</NativeSelectOption>
                {Object.entries(ROTULO_STATUS).map(([valor, nome]) => (
                  <NativeSelectOption key={valor} value={valor}>{nome}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <NativeSelect id="categoria" value={filtros.categoria} onChange={(e) => alterar('categoria', e.target.value)}>
                <NativeSelectOption value="">Todas</NativeSelectOption>
                {categorias.map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>{c.nome}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="agrupamento">Agrupar vendas por</Label>
              <NativeSelect id="agrupamento" value={filtros.agrupamento} onChange={(e) => alterar('agrupamento', e.target.value)}>
                <NativeSelectOption value="dia">Dia</NativeSelectOption>
                <NativeSelectOption value="semana">Semana</NativeSelectOption>
                <NativeSelectOption value="mes">Mês</NativeSelectOption>
              </NativeSelect>
            </div>
          </CardContent>
        </Card>
      )}

      {erro && (
        <Card className="border-destructive">
          <CardContent className="text-sm text-destructive">Erro: {erro}</CardContent>
        </Card>
      )}

      {indicadores && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cardsIndicadores.map((c) => (
            <Card key={c.titulo}>
              <CardHeader>
                <CardDescription>{c.titulo}</CardDescription>
                <CardTitle className="text-2xl">{c.valor}</CardTitle>
                {c.extra && <p className="text-xs text-muted-foreground">{c.extra}</p>}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Faturamento por período</CardTitle>
          <CardDescription>Pedidos cancelados não entram no faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={configGrafico} className="h-[280px] w-full">
            <BarChart data={vendas}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="periodo" tickFormatter={dataBR} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={50} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => dataBR(String(payload?.[0]?.payload?.periodo ?? ''))}
                    formatter={(valor) => (
                      <div className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">Faturamento</span>
                        <span className="font-medium">{moeda(Number(valor))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="faturamento" fill="var(--color-faturamento)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusPedidos.map((s) => (
                  <TableRow key={s.status}>
                    <TableCell>{ROTULO_STATUS[s.status] ?? s.status}</TableCell>
                    <TableCell>{s.quantidade}</TableCell>
                    <TableCell className="text-right">{moeda(s.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>{p.categoria}</TableCell>
                    <TableCell>{p.quantidade}</TableCell>
                    <TableCell className="text-right">{moeda(p.faturamento)}</TableCell>
                  </TableRow>
                ))}
                {ranking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum produto vendido no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
