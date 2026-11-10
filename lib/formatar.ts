export const moeda = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ROTULO_STATUS: Record<string, string> = {
  pendente: 'Pendente',
  em_preparo: 'Em preparo',
  saiu_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
