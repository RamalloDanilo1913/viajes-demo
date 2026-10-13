import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { filasSeguras } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

function formatearFechaNac(iso: string | null): string {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-');
  if (!anio || !mes || !dia) return iso;
  return `${dia}/${mes}/${anio}`;
}

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const filial = req.nextUrl.searchParams.get('filial');
  const soloMenores = req.nextUrl.searchParams.get('soloMenores') === 'true';

  const sb = supabaseAdmin();
  let query = sb
    .from('reservas_bondi')
    .select('created_at, reservas_bondi_pasajeros(*)')
    .order('created_at', { ascending: true });

  if (filial) query = query.eq('filial', filial);
  if (soloMenores) query = query.gt('cant_menores', 0);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filas: Record<string, string | number>[] = [];
  let contador = 0;
  for (const reserva of data || []) {
    const pasajeros = (reserva as any).reservas_bondi_pasajeros || [];
    for (const p of pasajeros) {
      contador++;
      filas.push({
        '#': contador,
        'Nombre y Apellido': p.nombre || '',
        DNI: p.dni || '',
        'Fecha de Nacimiento': formatearFechaNac(p.fecha_nacimiento),
        Teléfono: p.telefono || '',
        'Mayor/Menor': p.es_menor ? 'Menor' : 'Mayor',
      });
    }
  }

  const hoja = XLSX.utils.json_to_sheet(filasSeguras(filas));
  hoja['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 12 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Pasajeros');
  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const fechaArchivo = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="lista-pasajeros-bondi-${fechaArchivo}.xlsx"`,
    },
  });
}
