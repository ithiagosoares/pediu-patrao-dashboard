'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

type Props = { data_inicio: string; data_fim: string; status: string; atualizadoEm: Date | null };

const PAGAMENTO: Record<string, string> = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' };

// variante do Badge do shadcn para cada status
const VARIANTE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  entregue: 'default',
  saiu_entrega: 'secondary',
  em_preparo: 'secondary',
  pendente: 'outline',
  cancelado: 'destructive',
};

export default function TabelaPedidos({ data_inicio, data_fim, status, atualizadoEm }: Props) {
  const [pagina, setPagina] = useState(1);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
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
        setTotal(json.paginacao.total);
        setTotalPaginas(Math.max(1, json.paginacao.total_paginas));
        setErro(null);
      })
      .catch((e) => setErro(e.message));
  }, [data_inicio, data_fim, status, pagina, atualizadoEm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos pedidos</CardTitle>
        <CardDescription>{total} pedidos encontrados</CardDescription>
      </CardHeader>
      <CardContent>
        {erro && <p className="mb-2 text-sm text-destructive">{erro}</p>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>
                  {new Date(p.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </TableCell>
                <TableCell>{p.clientes?.nome ?? '-'}</TableCell>
                <TableCell>{p.tipo === 'balcao' ? 'Balcão' : 'Delivery'}</TableCell>
                <TableCell>{PAGAMENTO[p.forma_pagamento] ?? p.forma_pagamento}</TableCell>
                <TableCell>
                  <Badge variant={VARIANTE[p.status] ?? 'outline'}>{ROTULO_STATUS[p.status] ?? p.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{moeda(p.valor_total)}</TableCell>
              </TableRow>
            ))}
            {pedidos.length === 0 && !erro && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <Button variant="outline" size="sm" onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1}>
            Anterior
          </Button>
          <span>Página {pagina} de {totalPaginas}</span>
          <Button variant="outline" size="sm" onClick={() => setPagina((p) => p + 1)} disabled={pagina >= totalPaginas}>
            Próxima
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
