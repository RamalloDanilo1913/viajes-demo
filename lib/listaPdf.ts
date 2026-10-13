export interface FilaListaPdf {
  nombre: string;
  dni: string;
  esMenor: boolean;
  parada: string;
  telefono: string;
  telefonoEsTitular: boolean;
  estadoPago: 'pendiente' | 'pagado' | 'rechazado';
  comentario: string;
}

export interface DatosViajePdf {
  destino: string;
  fechaSalida: string | null;
  horaSalida: string;
  lugarSalida: string;
}

interface OpcionesPdf {
  filas: FilaListaPdf[];
  ordenParadas: string[];
  viaje: DatosViajePdf | null;
  filtros: string[];
}

const SIN_PARADA = 'Sin parada asignada';

function limpiar(texto: string): string {
  return (texto || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[^\u0020-\u00FF]/g, '')
    .trim();
}

function fechaLinda(iso: string | null): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

const ETIQUETA_PAGO: Record<FilaListaPdf['estadoPago'], string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  rechazado: 'Rechazado',
};

export async function generarListaPdf({ filas, ordenParadas, viaje, filtros }: OpcionesPdf): Promise<void> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const margen = 10;
  const NAVY: [number, number, number] = [0, 31, 63];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text('Talleres Filial Capital Federal - Lista de pasajeros del bondi', margen, 13);

  const partesViaje = [
    viaje?.destino && `Destino: ${limpiar(viaje.destino)}`,
    viaje?.fechaSalida && `Salida: ${fechaLinda(viaje.fechaSalida)}${viaje.horaSalida ? ` ${limpiar(viaje.horaSalida)} hs` : ''}`,
    viaje?.lugarSalida && `Lugar: ${limpiar(viaje.lugarSalida)}`,
  ].filter(Boolean) as string[];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  let yEncabezado = 18.5;
  if (partesViaje.length) {
    doc.text(partesViaje.join('   |   '), margen, yEncabezado);
    yEncabezado += 4.5;
  }
  const mayores = filas.filter((f) => !f.esMenor).length;
  const menores = filas.length - mayores;
  const resumen = `Total: ${filas.length} pasajeros (${mayores} mayores, ${menores} menores)`;
  doc.text(filtros.length ? `${resumen}   |   Filtro: ${filtros.map(limpiar).join(', ')}` : resumen, margen, yEncabezado);

  const grupos = new Map<string, FilaListaPdf[]>();
  for (const f of filas) {
    const clave = f.parada.trim() || SIN_PARADA;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(f);
  }
  const clavesOrdenadas = [
    ...ordenParadas.filter((p) => grupos.has(p)),
    ...[...grupos.keys()].filter((p) => p !== SIN_PARADA && !ordenParadas.includes(p)),
    ...(grupos.has(SIN_PARADA) ? [SIN_PARADA] : []),
  ];

  const COLUMNAS = 9;
  const cuerpo: any[][] = [];
  const filasGrupo = new Set<number>();
  let contador = 0;

  for (const clave of clavesOrdenadas) {
    const delGrupo = grupos.get(clave)!;
    filasGrupo.add(cuerpo.length);
    cuerpo.push([
      {
        content: `PARADA: ${limpiar(clave).toUpperCase()}  -  ${delGrupo.length} pasajero${delGrupo.length !== 1 ? 's' : ''}`,
        colSpan: COLUMNAS,
        styles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 10, minCellHeight: 7 },
      },
    ]);
    for (const f of delGrupo) {
      contador++;
      cuerpo.push([
        String(contador),
        '',
        limpiar(f.nombre) + (f.esMenor ? ' (menor)' : ''),
        limpiar(f.dni),
        f.telefono && f.telefono !== '-' ? limpiar(f.telefono) + (f.telefonoEsTitular ? ' (tit.)' : '') : '',
        limpiar(f.parada) || '-',
        ETIQUETA_PAGO[f.estadoPago],
        limpiar(f.comentario),
        '',
      ]);
    }
  }

  autoTable(doc, {
    startY: yEncabezado + 4,
    margin: { left: margen, right: margen, top: 12, bottom: 14 },
    head: [['#', 'Subió', 'Pasajero', 'DNI', 'Teléfono', 'Parada', 'Pago', 'Comentarios', 'Anotaciones']],
    body: cuerpo,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.8, valign: 'middle', lineColor: [150, 150, 150], lineWidth: 0.2, minCellHeight: 10 },
    headStyles: { fillColor: [230, 230, 230], textColor: NAVY, fontStyle: 'bold', halign: 'center', minCellHeight: 7 },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 14 },
      2: { cellWidth: 52, fontStyle: 'bold' },
      3: { cellWidth: 24 },
      4: { cellWidth: 31 },
      5: { cellWidth: 34 },
      6: { cellWidth: 23, halign: 'center' },
      7: { cellWidth: 52 },
      8: { cellWidth: 38 },
    },
    rowPageBreak: 'avoid',
    didParseCell: (data) => {
      if (data.section === 'body' && !filasGrupo.has(data.row.index) && data.column.index === 6) {
        if (data.cell.raw === ETIQUETA_PAGO.rechazado) data.cell.styles.textColor = [180, 0, 0];
        if (data.cell.raw === ETIQUETA_PAGO.pendiente) data.cell.styles.textColor = [150, 90, 0];
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1 && !filasGrupo.has(data.row.index)) {
        const lado = 5.5;
        const x = data.cell.x + (data.cell.width - lado) / 2;
        const y = data.cell.y + (data.cell.height - lado) / 2;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.rect(x, y, lado, lado);
      }
    },
  });

  const alto = doc.internal.pageSize.getHeight();
  let yFinal = (doc as any).lastAutoTable.finalY + 8;
  if (yFinal > alto - 20) {
    doc.addPage();
    yFinal = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(`Total de la lista: ${filas.length}`, margen, yFinal);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Subieron: ________      No se presentaron: ________      Subieron sin estar en la lista: ________', margen + 48, yFinal);

  const total = doc.getNumberOfPages();
  const generado = new Date().toLocaleString('es-AR');
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generado el ${generado}`, margen, alto - 6);
    doc.text(`Hoja ${i} de ${total}`, anchoPagina - margen, alto - 6, { align: 'right' });
  }

  doc.save(`lista-completa-bondi-${new Date().toISOString().slice(0, 10)}.pdf`);
}
