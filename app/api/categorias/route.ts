import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { tratarErro } from '@/lib/respostas';

export async function GET() {
  try {
    const { data, error } = await supabase.from('categorias').select('id, nome').order('nome');
    if (error) throw error;
    return NextResponse.json({ dados: data });
  } catch (erro) {
    return tratarErro(erro);
  }
}