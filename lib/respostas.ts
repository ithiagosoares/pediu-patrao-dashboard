import { NextResponse } from 'next/server';
import { ErroValidacao } from './filtros';

export function tratarErro(erro: unknown) {
  if (erro instanceof ErroValidacao) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
  console.error(erro);
  return NextResponse.json({ erro: 'Erro interno ao consultar os dados.' }, { status: 500 });
}