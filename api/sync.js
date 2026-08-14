export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  // Token de seguridad sencillo para que nadie nos mande basura
  const authHeader = req.headers['x-sync-token'];
  const SECRET_TOKEN = 'PoliciaVigo2026SecureKey';

  if (authHeader !== SECRET_TOKEN) {
    return res.status(401).json({ error: 'No autorizado. Token no válido.' });
  }

  const { filas } = req.body;

  if (!filas || !Array.isArray(filas)) {
    return res.status(400).json({ error: 'Formato incorrecto. Se espera un array "filas".' });
  }

  const FIREBASE_PROJECT_ID = 'policia-dias';
  let procesados = 0;

  try {
    for (const fila of filas) {
      const tipRaw = fila.TIP;
      const nombreRaw = fila.NOMBRE;

      if (!tipRaw || !nombreRaw) continue;

      const tipClean = Math.floor(Number(tipRaw));
      if (isNaN(tipClean) || tipClean === 0) continue;

      const tipStr = String(tipClean).padStart(3, '0');
      const usuarioWinRaw = fila['USUARIO WINDOWS'] || fila['USUARIO'] || `policia${tipStr}`;
      const usuarioWin = String(usuarioWinRaw).toLowerCase().trim();

      const docKey = `${usuarioWin}@policiaportuaria.local`;

      const parseNum = (val) => {
        const n = Number(val);
        return isNaN(n) ? 0 : n;
      };

      const payload = {
        fields: {
          nombre: { stringValue: String(nombreRaw).trim() },
          tip: { stringValue: tipStr },
          usuarioWindows: { stringValue: usuarioWin },
          saldos: {
            mapValue: {
              fields: {
                vacaciones: {
                  mapValue: {
                    fields: {
                      totales: { integerValue: parseNum(fila['VACACIONES_T'] || fila['VACACIONES T']) },
                      usados: { integerValue: parseNum(fila['VACACIONES_U'] || fila['VACACIONES U']) },
                      pendientes: { integerValue: parseNum(fila['VACACIONES_P'] || fila['VACACIONES P']) }
                    }
                  }
                },
                asuntosPropios: {
                  mapValue: {
                    fields: {
                      totales: { integerValue: parseNum(fila['PROPIOS_T'] || fila['PROPIOS T']) },
                      usados: { integerValue: parseNum(fila['PROPIOS_U'] || fila['PROPIOS U']) },
                      pendientes: { integerValue: parseNum(fila['PROPIOS_P'] || fila['PROPIOS P']) }
                    }
                  }
                },
                convenio: {
                  mapValue: {
                    fields: {
                      totales: { integerValue: parseNum(fila['DISPONIBLE_T'] || fila['DISPONIBLE T']) },
                      usados: { integerValue: parseNum(fila['DISPONIBLE_U'] || fila['DISPONIBLE U']) },
                      pendientes: { integerValue: parseNum(fila['DISPONIBLE_P'] || fila['DISPONIBLE P']) }
                    }
                  }
                },
                vacAdicionales: { integerValue: parseNum(fila['VAC_ADIC_P'] || fila['VAC_ADIC']) },
                diasAnteriores: { integerValue: parseNum(fila['ANTERIOR_P'] || fila['ANTERIOR']) },
                jornadaVerano: { integerValue: parseNum(fila['VERANO_P'] || fila['VERANO']) },
                fiestasEspeciales: {
                  mapValue: {
                    fields: {
                      julio16: { integerValue: parseNum(fila['JULIO16_P'] || fila['JULIO16']) },
                      diciembre24: { integerValue: parseNum(fila['DICIEMBRE24_P'] || fila['DICIEMBRE24']) },
                      diciembre31: { integerValue: parseNum(fila['DICIEMBRE31_P'] || fila['DICIEMBRE31']) }
                    }
                  }
                },
                totalGlobal: { integerValue: parseNum(fila['TOTAL_P'] || fila['TOTAL P'] || fila['TOTAL']) }
              }
            }
          },
          ultimaActualizacion: { stringValue: new Date().toLocaleDateString('es-ES') }
        }
      };

      // Petición directa a la Firestore REST API (vía PATCH para crear/actualizar)
      const urlDoc = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/policias/${docKey}`;
      await fetch(urlDoc, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      procesados++;
    }

    return res.status(200).json({ ok: true, mensaje: `Sincronizados ${procesados} agentes.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
