import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { emailsDeBaja, traerTodo } from '@/lib/contactos';
import * as XLSX from 'xlsx';
import { filasSeguras } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const viaje = req.nextUrl.searchParams.get('viaje');
  const sb = supabaseAdmin();

  try {
    const [contactos, bajas] = await Promise.all([
      traerTodo<any>((d, h) => {
        let q = sb.from('contactos_bondi').select('*').order('viaje', { ascending: true }).order('nombre', { ascending: true });
        if (viaje) q = q.eq('viaje', viaje);
        return q.range(d, h);
      }),
      emailsDeBaja(sb),
    ]);

    const filas = contactos.map((c, i) => ({
      '#': i + 1,
      Viaje: c.viaje,
      'Nombre y Apellido': c.nombre,
      Email: c.email,
      Teléfono: c.telefono,
      DNI: c.dni,
      Localidad: c.localidad,
      Estado: bajas.has(c.email) ? 'Dado de baja (no enviar)' : 'Activo',
    }));

    const hoja = XLSX.utils.json_to_sheet(filasSeguras(filas));
    hoja['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 30 }, { wch: 34 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 24 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Contactos');
    const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const sufijo = viaje ? viaje.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() : 'todos';
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="contactos-bondi-${sufijo || 'viaje'}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
