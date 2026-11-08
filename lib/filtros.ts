export const STATUS_VALIDOS = ['pendente', 'em_preparo', 'saiu_entrega', 'entregue', 'cancelado'] as const;

export class ErroValidacao extends Error {}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function lerData(valor: string, nome: string) {
  if (!FORMATO_DATA.test(valor) || isNaN(Date.parse(valor))) {
    throw new ErroValidacao(`Parâmetro '${nome}' inválido. Use o formato AAAA-MM-DD.`);
  }
  return new Date(`${valor}T00:00:00-03:00`);
}

export function lerFiltros(params: URLSearchParams) {
  const agora = new Date();
  const umDia = 24 * 60 * 60 * 1000;

  // data_fim é inclusiva: somamos 1 dia e usamos "<" na consulta
  const fim = params.get('data_fim')
    ? new Date(lerData(params.get('data_fim')!, 'data_fim').getTime() + umDia)
    : agora;

  const inicio = params.get('data_inicio')
    ? lerData(params.get('data_inicio')!, 'data_inicio')
    : new Date(agora.getTime() - 30 * umDia); // padrão: últimos 30 dias

  if (inicio >= fim) {
    throw new ErroValidacao("'data_inicio' deve ser anterior ou igual a 'data_fim'.");
  }

  const status = params.get('status');
  if (status && !STATUS_VALIDOS.includes(status as any)) {
    throw new ErroValidacao(`Status inválido. Valores aceitos: ${STATUS_VALIDOS.join(', ')}.`);
  }

  return { inicio, fim, status: status || null };
}