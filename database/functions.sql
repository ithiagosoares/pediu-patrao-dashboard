create or replace function fn_indicadores(
  p_inicio timestamptz,
  p_fim timestamptz,
  p_status status_pedido default null
)
returns json
language sql stable
as $$
  select json_build_object(
    'faturamento',        coalesce(sum(valor_total) filter (where status <> 'cancelado'), 0),
    'total_pedidos',      count(*),
    'ticket_medio',       coalesce(round(avg(valor_total) filter (where status <> 'cancelado'), 2), 0),
    'pedidos_cancelados', count(*) filter (where status = 'cancelado'),
    'taxa_cancelamento',  case when count(*) = 0 then 0
                          else round(100.0 * count(*) filter (where status = 'cancelado') / count(*), 2) end
  )
  from pedidos
  where criado_em >= p_inicio
    and criado_em <  p_fim
    and (p_status is null or status = p_status);
$$;