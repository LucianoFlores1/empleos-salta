export const CATEGORIES = [
  'Administración',
  'Salud y Cuidado',
  'Minería y Campo',
  'Ventas y Atención',
  'Tecnologías',
  'Logística y Transporte',
  'Educación',
  'Gastronomía',
  'Oficios y Mantenimiento',
  'Construcción y Arquitectura',
  'Diseño y Marketing',
  'Estética y Belleza',
  'Deportes y Recreación',
  'Legales',
  'Otros'
];

export function inferCategory(title: string): string {
  if (!title) return 'Otros';
  const t = title.toLowerCase();
  
  if (t.match(/abogad|legal|jur[íi]dic|derecho|ley/)) return 'Legales';
  if (t.match(/adm|recepcion|asistente|secretari|rrhh|recursos humanos|facturaci[óo]n|contable|liquid|auditor/)) return 'Administración';
  if (t.match(/salud|m[éèe]dic|enfermer|cl[íi]nica|terapeut|psic[óo]log|acompa[ñn]ante|farmaci|estimulaci[óo]n|kinesio|odontol|geriatric|nutricionist/)) return 'Salud y Cuidado';
  if (t.match(/mina|miner|ge[óo]log|perforist|litio|campo|finca|agr[óo]nom|granja|tractor|cosech/)) return 'Minería y Campo';
  if (t.match(/vent|comercial|cajer|atenci|vendedor|promotor|kiosc|mostrador/)) return 'Ventas y Atención';
  if (t.match(/desarroll|programador|sistemas|soporte|it\b|tecnolog|ingenier|inform[áa]tic|computaci[óo]n|data\b|analista|software/)) return 'Tecnologías';
  if (t.match(/log[íi]stic|chofer|repartidor|transporte|almac[ée]n|dep[óo]sito|carga|conductor|reparto|moto|cadete/)) return 'Logística y Transporte';
  if (t.match(/docent|profesor|maestr|educaci[óo]n|escuela|colegio|pedagog/)) return 'Educación';
  if (t.match(/cocin|moz|camarer|gastronom|chef|restauran|barist|panader|comida|fiambrer|rotiser|carnicer|pizzer|sushi/)) return 'Gastronomía';
  if (t.match(/limpiez|mantenimient|mucam|maestranza|guardi|seguridad|bomba|operador|t[ée]cnico|mecanic|soldador|torner|sereno|vigilancia|instalador/)) return 'Oficios y Mantenimiento';
  if (t.match(/construcci[óo]n|obra|arquitect|alba[ñn]il|pintor|plomer|electricista|carpinter|herrero|gasista/)) return 'Construcción y Arquitectura';
  if (t.match(/dise[ñn]o|dise[ñn]ador|marketing|publicidad|comunicaci[óo]n|periodista|redes|social media|creativo|audiovisual/)) return 'Diseño y Marketing';
  if (t.match(/est[ée]tica|belleza|peluquer|manicur|masajist|barber|depilad/)) return 'Estética y Belleza';
  if (t.match(/deporte|recreaci[óo]n|gimnasio|entrenador|personal trainer/)) return 'Deportes y Recreación';
  
  return 'Otros';
}

export function formatRelativeDate(dateStr: string, useUTC = false): { text: string; isHighlighted: boolean; type: 'today' | 'yesterday' | 'obsolete' | 'other' } {
  const date = new Date(dateStr);
  const now = new Date();
  
  let today, dateToCompare;
  
  if (useUTC) {
    today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    dateToCompare = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  } else {
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateToCompare = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  
  const diffTime = today.getTime() - dateToCompare.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 30) {
    return { text: 'Oferta Obsoleta', isHighlighted: true, type: 'obsolete' };
  } else if (diffDays === 0) {
    return { text: 'Publicado hoy', isHighlighted: true, type: 'today' };
  } else if (diffDays === 1) {
    return { text: 'Publicado ayer', isHighlighted: true, type: 'yesterday' };
  } else {
    return { 
      text: useUTC ? date.toLocaleDateString('es-AR', { timeZone: 'UTC' }) : date.toLocaleDateString('es-AR'), 
      isHighlighted: false,
      type: 'other'
    };
  }
}
