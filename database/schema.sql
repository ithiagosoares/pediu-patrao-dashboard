create type status_pedido as enum ('pendente','em_preparo','saiu_entrega','entregue','cancelado');

create table categorias (
  id serial primary key,
  nome text not null unique
);

create table produtos (
  id serial primary key,
  nome text not null,
  categoria_id int not null references categorias(id),
  preco numeric(10,2) not null check (preco >= 0),
  ativo boolean not null default true
);

create table clientes (
  id serial primary key,
  nome text not null,
  telefone text
);

create table pedidos (
  id serial primary key,
  cliente_id int references clientes(id),
  status status_pedido not null default 'pendente',
  forma_pagamento text check (forma_pagamento in ('pix','cartao','dinheiro')),
  tipo text check (tipo in ('delivery','balcao')),
  valor_total numeric(10,2) not null default 0,
  criado_em timestamptz not null default now()
);

create table itens_pedido (
  id serial primary key,
  pedido_id int not null references pedidos(id) on delete cascade,
  produto_id int not null references produtos(id),
  quantidade int not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null
);

create index on pedidos(criado_em);
create index on pedidos(status);
create index on itens_pedido(produto_id);
-- permissoes: somente a role do servidor acessa as tabelas
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
