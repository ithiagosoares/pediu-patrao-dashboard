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

-- RF02: vendas agrupadas por período
create or replace function fn_vendas_periodo(
  p_inicio timestamptz, p_fim timestamptz,
  p_status status_pedido default null, p_agrupamento text default 'day'
)
returns json language sql stable as $$
  select coalesce(json_agg(t order by t.periodo), '[]'::json)
  from (
    select to_char(date_trunc(p_agrupamento, criado_em at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as periodo,
           count(*) as pedidos,
           coalesce(sum(valor_total) filter (where status <> 'cancelado'), 0) as faturamento
    from pedidos
    where criado_em >= p_inicio and criado_em < p_fim
      and (p_status is null or status = p_status)
    group by 1
  ) t;
$$;

-- RF03: pedidos por status
create or replace function fn_pedidos_por_status(p_inicio timestamptz, p_fim timestamptz)
returns json language sql stable as $$
  select coalesce(json_agg(t order by t.quantidade desc), '[]'::json)
  from (
    select status, count(*) as quantidade, coalesce(sum(valor_total), 0) as valor
    from pedidos
    where criado_em >= p_inicio and criado_em < p_fim
    group by status
  ) t;
$$;

-- RF04: ranking de produtos
create or replace function fn_produtos_mais_vendidos(
  p_inicio timestamptz, p_fim timestamptz,
  p_categoria int default null, p_limite int default 10
)
returns json language sql stable as $$
  select coalesce(json_agg(t order by t.quantidade desc), '[]'::json)
  from (
    select pr.id, pr.nome, c.nome as categoria,
           sum(i.quantidade) as quantidade,
           sum(i.quantidade * i.preco_unitario) as faturamento
    from itens_pedido i
    join pedidos p     on p.id = i.pedido_id
    join produtos pr   on pr.id = i.produto_id
    join categorias c  on c.id = pr.categoria_id
    where p.criado_em >= p_inicio and p.criado_em < p_fim
      and p.status <> 'cancelado'
      and (p_categoria is null or pr.categoria_id = p_categoria)
    group by pr.id, pr.nome, c.nome
    order by quantidade desc
    limit p_limite
  ) t;
$$;

grant execute on all functions in schema public to service_role;