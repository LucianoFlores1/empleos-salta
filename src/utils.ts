export function inferCategory(title: string): string {
  if (!title) return 'Otros';
  const t = title.toLowerCase();
  
  if (t.match(/abogad|legal|jur[íi]dic|derecho|ley/)) return 'Legales';
  if (t.match(/adm|recepcion|asistente|secretari|rrhh|recursos humanos|facturaci[óo]n|contable/)) return 'Administración';
  if (t.match(/salud|m[éèe]dic|enfermer|cl[íi]nica|terapeut|psic[óo]log|acompa[ñn]ante|farmaci|estimulaci[óo]n/)) return 'Salud y Cuidado';
  if (t.match(/mina|miner|ge[óo]log|perforist|litio|campo|finca|agr[óo]nom|granja|tractor/)) return 'Minería y Campo';
  if (t.match(/vent|comercial|cajer|atenci|vendedor|promotor/)) return 'Ventas y Atención';
  if (t.match(/desarrollador|programador|sistemas|soporte|it|tecnolog|ingenier/)) return 'Tecnologías';
  if (t.match(/log[íi]stic|chofer|repartidor|transporte|almac[ée]n|dep[óo]sito|carga|conductor/)) return 'Logística y Transporte';
  if (t.match(/docent|profesor|maestr|educaci[óo]n|escuela/)) return 'Educación';
  if (t.match(/cocin|moz|camarer|gastronom|chef|restauran|barist/)) return 'Gastronomía';
  if (t.match(/limpiez|mantenimient|mucam|maestranza|guardi|seguridad/)) return 'Oficios y Mantenimiento';
  
  return 'Otros';
}
