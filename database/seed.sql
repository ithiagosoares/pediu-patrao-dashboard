insert into categorias (nome) values ('Pizzas'),('Lanches'),('Bebidas'),('Sobremesas');

insert into produtos (nome, categoria_id, preco) values
('Pizza Calabresa',1,49.90),('Pizza Margherita',1,47.90),('Pizza Frango c/ Catupiry',1,54.90),('Pizza Portuguesa',1,52.90),
('X-Burger',2,22.90),('X-Salada',2,24.90),('X-Bacon',2,27.90),('X-Tudo',2,32.90),
('Coca-Cola 2L',3,14.00),('Guaraná Lata',3,6.00),('Suco Natural',3,9.00),
('Pudim',4,12.00),('Petit Gâteau',4,18.00);

insert into clientes (nome, telefone)
select 'Cliente ' || g, '(11) 9' || lpad((random()*99999999)::int::text, 8, '0')
from generate_series(1,50) g;

insert into pedidos (cliente_id, status, forma_pagamento, tipo, criado_em)
select floor(random()*50 + 1)::int,
  (array['entregue','entregue','entregue','entregue','em_preparo','saiu_entrega','pendente','cancelado'])[floor(random()*8 + 1)]::status_pedido,
  (array['pix','cartao','dinheiro'])[floor(random()*3 + 1)],
  (array['delivery','balcao'])[floor(random()*2 + 1)],
  now() - (random()*60 || ' days')::interval
from generate_series(1,300);

insert into itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
select x.pedido_id, pr.id, x.qtd, pr.preco
from (
  select p.id as pedido_id,
         floor(random()*13 + 1)::int as produto_id,
         floor(random()*3 + 1)::int as qtd
  from pedidos p cross join generate_series(1,3) g
  where g = 1 or random() < 0.5
) x
join produtos pr on pr.id = x.produto_id;

update pedidos p
set valor_total = coalesce((select sum(quantidade * preco_unitario) from itens_pedido i where i.pedido_id = p.id), 0);