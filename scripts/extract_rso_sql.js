const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Script de migración RSO SQL -> JSON
 * Uso: node extract_rso_sql.js <ruta_al_sql>
 */

const sqlPath = process.argv[2] || path.join(__dirname, '../../ivqlnybu_wp556.sql');
const outputPath = path.join(process.cwd(), 'migracion_rso.json');

async function extractRsoFromSql() {
    if (!fs.existsSync(sqlPath)) {
        console.error(`Error: No se encuentra el archivo SQL en ${sqlPath}`);
        console.log('Uso: node extract_rso_sql.js <ruta_al_sql>');
        process.exit(1);
    }

    const rl = readline.createInterface({ input: fs.createReadStream(sqlPath), crlfDelay: Infinity });

    const tableColumns = {
        wprm_rso_edificio: ['id','calle','numero','codigo_postal','ciudad','provincia','zona','notas','zona_id'],
        wprm_rso_puerta: ['id','id_edificio','codigo_inmovilla','numero_puerta','planta','nombre','apellidos','email','telefono_fijo','telefono_movil','telefono_trabajo_cliente','precio_venta','precio_alquiler','precio_valoracion','estado','ocupado_por','captado_por','dia_ultimo_contacto','is_valorado','is_presidente','informador','vendido_alquilado_nosotros','sucursal','nombre_completo_ultimo_editor','aviso_importante','observacion_rso','observacion_cliente','no_molestar','no_felpudo','no_timbre','no_contador'],
        wprm_rso_inquilino: ['id','nombre','apellidos','email','telefono','dni','observaciones','fecha_creacion'],
        wprm_rso_asignado: ['id','id_puerta','id_inquilino','fecha_inicio','fecha_fin','activo'],
        wprm_rso_seguimiento: ['id','id_puerta','tipo','subtipo','nota','fecha','nombre_empleado','id_empleado','alert','schedule','done','tracking_id'],
        wprm_rso_seguimiento_edificio: ['id','id_edificio','tipo','subtipo','nota','fecha','nombre_empleado','id_empleado'],
        wprm_rso_sesion: ['id','id_puerta','fecha_inicio','fecha_fin','borrado'],
        wprm_rso_historico: ['id','id_puerta','campo','valor_anterior','valor_nuevo','fecha','nombre_empleado'],
        wprm_rso_media: ['id','id_puerta','url','tipo','descripcion','fecha'],
        wprm_rso_mensaje: ['id','id_sesion','id_inquilino','id_empleado','content','fecha_envio'],
    };

    const result = {};
    Object.keys(tableColumns).forEach(t => result[t] = []);

    let currentTable = null;
    let statementBuffer = '';
    let isCollecting = false;

    console.log(`Extrayendo datos de ${sqlPath}...`);

    for await (const line of rl) {
        if (line.includes('INSERT INTO `wprm_rso')) {
            const m = line.match(/INSERT INTO `(.+?)`/);
            if (m && tableColumns[m[1]]) {
                currentTable = m[1];
                statementBuffer = line;
                isCollecting = true;
            }
        } else if (isCollecting) {
            statementBuffer += ' ' + line;
        }

        if (isCollecting && line.trim().endsWith(';')) {
            const cols = tableColumns[currentTable];
            const valuesIndex = statementBuffer.toUpperCase().indexOf(' VALUES');
            
            if (valuesIndex !== -1) {
                const valuesSection = statementBuffer.substring(valuesIndex + 7).trim();
                const tuples = parseInsertValues(valuesSection);
                
                tuples.forEach(values => {
                    if (values[0] && typeof values[0] === 'string' && values[0].replace(/`/g, '').toLowerCase() === cols[0].toLowerCase()) {
                        return;
                    }
                    const obj = {};
                    cols.forEach((col, i) => {
                        obj[col] = values[i] !== undefined ? values[i] : null;
                    });
                    result[currentTable].push(obj);
                });
            }
            
            isCollecting = false;
            statementBuffer = '';
            currentTable = null;
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log('\n=== Extracción Completada ===\n');
    Object.entries(result).forEach(([table, rows]) => {
        if (rows.length > 0) console.log(`  ${table.padEnd(35)} ${rows.length.toLocaleString().padStart(8)} registros`);
    });
    console.log(`\nArchivo guardado en: ${outputPath}`);
}

function parseInsertValues(str) {
    const tuples = [];
    let i = 0;
    str = str.trim().replace(/;$/, '');

    while (i < str.length) {
        while (i < str.length && str[i] !== '(') i++;
        if (i >= str.length) break;

        i++; 
        const values = [];
        let current = '';
        let inStr = false;
        let escape = false;
        let quoteChar = '';

        while (i < str.length) {
            const c = str[i];
            if (escape) { current += c; escape = false; i++; continue; }
            if (c === '\\') { escape = true; i++; continue; }
            if ((c === "'" || c === '"') && !inStr) { inStr = true; quoteChar = c; i++; continue; }
            if (c === quoteChar && inStr) {
                if (str[i+1] === quoteChar) { current += quoteChar; i += 2; continue; }
                inStr = false; quoteChar = ''; i++; continue;
            }
            if (!inStr && c === ',') { values.push(finalizeValue(current)); current = ''; i++; continue; }
            if (!inStr && c === ')') { values.push(finalizeValue(current)); i++; break; }
            current += c; i++;
        }
        tuples.push(values);
    }
    return tuples;
}

function finalizeValue(val) {
    val = val.trim();
    if (val.toUpperCase() === 'NULL') return null;
    return val;
}

extractRsoFromSql().catch(console.error);
