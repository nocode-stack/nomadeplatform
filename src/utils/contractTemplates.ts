import { UnifiedProject } from '../types/database';
import { supabase } from '../integrations/supabase/client';

export interface ContractTemplate {
  name: string;
  htmlTemplate: string;
}

export interface ContractData {
  client_name: string;
  client_dni: string;
  client_phone: string;
  client_email: string;
  client_address: string;
  model: string;
  total_amount: string;
  power: string;
  interior_color: string;
  exterior_color: string;
  project_code: string;
  current_date: string;
  // Nuevos campos para el contrato de camperización
  fecha: string;
  nombre_cliente: string;
  DNI: string;
  telefono: string;
  email_cliente: string;
  direccion_cliente: string;
  ciudad_cliente: string;
  cp_cliente: string;
  cif_cliente?: string;
  empresa_cliente?: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  modelo_nomade: string;
  motorizacion: string;
  numero_bastidor: string;
  matricula: string;
  precio_total: string;
  pago_inicial: string;
  pago_produccion: string;
  pago_final: string;
  plazo_entrega: string;
  // NUEVOS: Campos directos de la base de datos
  name: string;
  phone: string;
  email: string;
  dni: string;
  address: string;
  // Campos con notación de objeto
  'clients.name': string;
  'clients.phone': string;
  'clients.email': string;
  'clients.dni': string;
  'clients.address': string;
}

// FIXED: Improved text-to-HTML conversion with better list detection and consistent formatting
export const convertTextToHtml = (text: string): string => {
  if (!text) return '';

  if (import.meta.env.DEV) console.log('🔄 Converting text to HTML with improved list detection');

  // Split into paragraphs and process each one
  const paragraphs = text.split(/\n\s*\n/);

  const processedParagraphs = paragraphs.map(paragraph => {
    if (!paragraph.trim()) return '';

    const trimmedParagraph = paragraph.trim();

    // Handle different types of content

    // 1. Main titles (ALL CAPS, short lines, typically contract titles)
    if (trimmedParagraph.match(/^[A-ZÁÉÍÓÚÑÜ\s\-]+$/) &&
      trimmedParagraph.length < 80 &&
      trimmedParagraph.length > 10 &&
      !trimmedParagraph.includes('{{')) {
      return `
        <div style="text-align: center; margin: 40px 0 30px 0;">
          <div style="border: 2px solid #000; padding: 15px; margin: 0; font-size: 14px; font-weight: bold; background-color: #f8f9fa; font-family: 'Times New Roman', serif;">
            ${trimmedParagraph}
          </div>
        </div>
      `;
    }

    // 2. Section headers (like "REUNIDOS", "EXPONEN", etc.) - boxed style
    if ((trimmedParagraph.match(/^[A-ZÁÉÍÓÚÑÜ\s]+$/) && trimmedParagraph.length < 30) ||
      trimmedParagraph.match(/^(REUNIDOS|EXPONEN|ESTIPULACIONES|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA)\.?\s*$/)) {
      return `
        <div style="border: 2px solid #000; padding: 12px; margin: 30px 0 20px 0; text-align: center; background-color: #f8f9fa;">
          <h2 style="margin: 0; font-size: 14px; font-weight: bold; font-family: 'Times New Roman', serif;">${trimmedParagraph}</h2>
        </div>
      `;
    }

    // 3. Numbered clauses (PRIMERA., SEGUNDA., etc.)
    if (trimmedParagraph.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA)\./)) {
      const parts = trimmedParagraph.split('.');
      const clauseNumber = parts[0];
      const clauseTitle = parts[1]?.trim() || '';
      const clauseContent = parts.slice(2).join('.').trim();

      return `
        <p style="text-align: justify; margin-bottom: 15px; line-height: 1.4; font-size: 12px; text-indent: 0; font-family: 'Times New Roman', serif;">
          <strong>${clauseNumber}. ${clauseTitle}</strong><br>
          ${clauseContent}
        </p>
      `;
    }

    // 4. Special right-aligned text (dates, locations)
    if (trimmedParagraph.match(/^En .* a \{\{.*\}\}/) ||
      trimmedParagraph.match(/^En .* a [0-9]/)) {
      return `
        <div style="text-align: right; margin: 20px 0 40px 0; font-size: 12px; font-family: 'Times New Roman', serif;">
          <p style="margin: 0;">${formatInlineTags(trimmedParagraph)}</p>
        </div>
      `;
    }

    // 5. FIXED: Enhanced Numbered Lists Detection
    if (detectNumberedList(trimmedParagraph)) {
      return processNumberedList(trimmedParagraph);
    }

    // 6. FIXED: Enhanced Bullet Lists Detection
    if (detectBulletList(trimmedParagraph)) {
      return processBulletList(trimmedParagraph);
    }

    // 7. Tables (detect table-like content)
    if (trimmedParagraph.includes('|') && trimmedParagraph.split('|').length > 2) {
      const rows = trimmedParagraph.split('\n').filter(row => row.includes('|'));
      const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-family: 'Times New Roman', serif; font-size: 12px;">
          ${rows.map(row => {
        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
        const isHeader = cells.some(cell => cell.toUpperCase() === cell && cell.length > 3);
        return `
              <tr>
                ${cells.map(cell =>
          isHeader
            ? `<td style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold;">${cell}</td>`
            : `<td style="border: 1px solid #000; padding: 8px;">${formatInlineTags(cell)}</td>`
        ).join('')}
              </tr>
            `;
      }).join('')}
        </table>
      `;
      return tableHTML;
    }

    // 8. Regular paragraphs - FIXED: consistent formatting
    const formattedContent = formatInlineTags(trimmedParagraph.replace(/\n/g, '<br>'));

    return `
      <p style="text-align: justify; margin-bottom: 15px; line-height: 1.4; font-size: 12px; text-indent: 0; font-family: 'Times New Roman', serif;">
        ${formattedContent}
      </p>
    `;
  });

  // Wrap everything in a professional container with consistent styling
  const finalHTML = `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.4; color: #000; max-width: 800px; margin: 0 auto; padding: 40px; background-color: white;">
      <div style="text-align: right; margin-bottom: 20px;">
        <img src="/lovable-uploads/9ccaea00-7ce7-46ac-abf0-8a8d58c3fa1e.png" alt="Nomade Nation" style="height: 40px;">
      </div>
      
      ${processedParagraphs.filter(p => p !== '').join('\n')}
      
      <div style="display: flex; justify-content: space-between; margin-top: 80px; page-break-inside: avoid;">
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold; font-size: 12px; font-family: 'Times New Roman', serif;">EL VENDEDOR</p>
            <p style="margin: 8px 0 0 0; font-size: 10px; font-family: 'Times New Roman', serif;">NOMADE NATION, S.L.</p>
          </div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 60px;">
            <p style="margin: 0; font-weight: bold; font-size: 12px; font-family: 'Times New Roman', serif;">EL COMPRADOR</p>
            <p style="margin: 8px 0 0 0; font-size: 10px; font-family: 'Times New Roman', serif;">{{nombre_cliente}}</p>
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #ccc; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 10px; color: #666; font-family: 'Times New Roman', serif;">
        <p style="margin: 0;">nomade-nation.com</p>
      </div>
    </div>
  `;

  if (import.meta.env.DEV) console.log('✅ Text converted to HTML with consistent formatting');
  return finalHTML;
};

// FIXED: Enhanced numbered list detection - more flexible patterns
const detectNumberedList = (text: string): boolean => {
  const lines = text.split('\n');
  let numberedItemCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Check for numbered items: "1.", "2.", "1)", "2)", etc.
    if (trimmedLine.match(/^\d+[.)]\s+.+/)) {
      numberedItemCount++;
    }
  }

  // Consider it a numbered list if we have at least 2 numbered items
  return numberedItemCount >= 2;
};

// FIXED: Enhanced bullet list detection - more flexible patterns
const detectBulletList = (text: string): boolean => {
  const lines = text.split('\n');
  let bulletItemCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Check for bullet items: "-", "•", "*" at the start
    if (trimmedLine.match(/^[-•*]\s+.+/)) {
      bulletItemCount++;
    }
  }

  // Consider it a bullet list if we have at least 2 bullet items
  return bulletItemCount >= 2;
};

// FIXED: Process numbered lists with consistent formatting
const processNumberedList = (text: string): string => {
  const lines = text.split('\n');
  let listItems: Array<{ content: string, level: number }> = [];
  let nonListContent: string[] = [];
  let currentlyInList = false;

  lines.forEach(line => {
    const trimmedLine = line.trim();

    // Check for numbered items (1., 2., 1), 2), etc.)
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      const content = numberedMatch[2];
      const level = (line.length - line.trimStart().length) / 2; // Calculate indentation level
      listItems.push({ content: formatInlineTags(content), level });
      currentlyInList = true;
    } else if (trimmedLine === '') {
      // Empty line - might continue list or end it
      if (currentlyInList && listItems.length > 0) {
        // Continue with current list
      }
    } else if (currentlyInList && trimmedLine.match(/^\s+/) && !trimmedLine.match(/^\d+[.)]/) && listItems.length > 0) {
      // Continuation of previous item (indented text)
      listItems[listItems.length - 1].content += '<br>' + formatInlineTags(trimmedLine);
    } else {
      // Non-list content
      nonListContent.push(line);
      currentlyInList = false;
    }
  });

  if (listItems.length === 0) {
    return ''; // Fallback to regular paragraph processing
  }

  // Generate HTML for numbered list
  let html = '<ol style="margin: 15px 0; padding-left: 30px; font-family: \'Times New Roman\', serif; font-size: 12px; line-height: 1.4;">';

  listItems.forEach((item) => {
    html += `<li style="margin-bottom: 8px; text-align: justify;">${item.content}</li>`;
  });

  html += '</ol>';

  return html;
};

// FIXED: Process bullet lists with consistent formatting
const processBulletList = (text: string): string => {
  const lines = text.split('\n');
  let listItems: Array<{ content: string, level: number }> = [];
  let nonListContent: string[] = [];
  let currentlyInList = false;

  lines.forEach(line => {
    const trimmedLine = line.trim();

    // Check for bullet items (-, •, *)
    const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      const level = (line.length - line.trimStart().length) / 2; // Calculate indentation level
      listItems.push({ content: formatInlineTags(content), level });
      currentlyInList = true;
    } else if (trimmedLine === '') {
      // Empty line - might continue list or end it
      if (currentlyInList && listItems.length > 0) {
        // Continue with current list
      }
    } else if (currentlyInList && trimmedLine.match(/^\s+/) && !trimmedLine.match(/^[-•*]/) && listItems.length > 0) {
      // Continuation of previous item (indented text)
      listItems[listItems.length - 1].content += '<br>' + formatInlineTags(trimmedLine);
    } else {
      // Non-list content
      nonListContent.push(line);
      currentlyInList = false;
    }
  });

  if (listItems.length === 0) {
    return ''; // Fallback to regular paragraph processing
  }

  // Generate HTML for bullet list
  let html = '<ul style="margin: 15px 0; padding-left: 30px; font-family: \'Times New Roman\', serif; font-size: 12px; line-height: 1.4;">';

  listItems.forEach((item) => {
    html += `<li style="margin-bottom: 8px; text-align: justify;">${item.content}</li>`;
  });

  html += '</ul>';

  return html;
};

// Helper function to format inline tags (bold, italic, variables)
const formatInlineTags = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold with **text**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic with *text*
    .replace(/\{\{(.*?)\}\}/g, '<strong>{{$1}}</strong>'); // Highlight variables
};

export const contractTemplates: Record<string, ContractTemplate> = {
  reservation_contract: {
    name: 'Contrato de Reserva',
    htmlTemplate: `
      <h1>CONTRATO DE RESERVA</h1>
      <p><strong>Cliente:</strong> {{client_name}}</p>
      <p><strong>DNI:</strong> {{client_dni}}</p>  
      <p><strong>Teléfono:</strong> {{client_phone}}</p>
      <p><strong>Email:</strong> {{client_email}}</p>
      <p><strong>Dirección:</strong> {{client_address}}</p>
      
      <h2>VEHÍCULO RESERVADO</h2>
      <p><strong>Modelo:</strong> {{model}}</p>
      <p><strong>Motorización:</strong> {{power}}</p>
      <p><strong>Color Interior:</strong> {{interior_color}}</p>
      <p><strong>Color Exterior:</strong> {{exterior_color}}</p>
      
      <h2>CONDICIONES ECONÓMICAS</h2>
      <p><strong>Importe Total:</strong> {{total_amount}}</p>
      
      <p><strong>Código de Proyecto:</strong> {{project_code}}</p>
      <p><strong>Fecha:</strong> {{current_date}}</p>
    `
  },
  purchase_agreement: {
    name: 'Acuerdo de Compra-venta',
    htmlTemplate: `
      <h1>ACUERDO DE COMPRA-VENTA</h1>
      <p><strong>Cliente:</strong> {{client_name}}</p>
      <p><strong>DNI:</strong> {{client_dni}}</p>
      <p><strong>Teléfono:</strong> {{client_phone}}</p>
      <p><strong>Email:</strong> {{client_email}}</p>
      <p><strong>Dirección:</strong> {{client_address}}</p>
      
      <h2>OBJETO DEL ACUERDO</h2>
      <p><strong>Modelo:</strong> {{model}}</p>
      <p><strong>Motorización:</strong> {{power}}</p>
      <p><strong>Color Interior:</strong> {{interior_color}}</p>
      <p><strong>Color Exterior:</strong> {{exterior_color}}</p>
      
      <h2>PRECIO Y FORMA DE PAGO</h2>
      <p><strong>Precio Total:</strong> {{total_amount}}</p>
      
      <p><strong>Código de Proyecto:</strong> {{project_code}}</p>
      <p><strong>Fecha:</strong> {{current_date}}</p>
    `
  },
  sale_contract: {
    name: 'Contrato de Compraventa',
    htmlTemplate: `
      <h1>CONTRATO DE COMPRAVENTA</h1>
      <p><strong>Comprador:</strong> {{client_name}}</p>
      <p><strong>DNI:</strong> {{client_dni}}</p>
      <p><strong>Teléfono:</strong> {{client_phone}}</p>
      <p><strong>Email:</strong> {{client_email}}</p>
      <p><strong>Dirección:</strong> {{client_address}}</p>
      
      <h2>VEHÍCULO OBJETO DE LA COMPRAVENTA</h2>
      <p><strong>Modelo:</strong> {{model}}</p>
      <p><strong>Motorización:</strong> {{power}}</p>
      <p><strong>Color Interior:</strong> {{interior_color}}</p>
      <p><strong>Color Exterior:</strong> {{exterior_color}}</p>
      
      <h2>PRECIO</h2>
      <p><strong>Precio de Venta:</strong> {{total_amount}}</p>
      
      <p><strong>Código de Proyecto:</strong> {{project_code}}</p>
      <p><strong>Fecha:</strong> {{current_date}}</p>
    `
  },
  camperization_agreement: {
    name: 'Acuerdo de Compraventa de Vehículo Camperizado',
    htmlTemplate: `
      ACUERDO DE COMPRAVENTA DE VEHÍCULO CAMPERIZADO

      En Sabadell a {{fecha}}

      REUNIDOS

      De una parte, D. **IGNASI RIBÓ SOLER**, mayor de edad, con D.N.I./N.I.F número **39969532 V**, en nombre y representación de la mercantil **NOMADE NATION, S.L.**, con domicilio en Sabadell (Barcelona), C/ Anselm Turmeda 15, C.P. 08205, con C.I.F. **B-09622879**, teléfono: **696926545**, e-mail: **iribo@nomade-nation.com** En adelante **EL VENDEDOR**.

      De otra D./Dª. **{{nombre_cliente}}**, mayor de edad, con domicilio en **{{direccion_cliente}}**, provista de D.N.I/N.I.F número **{{DNI}}**, en nombre y representación de la mercantil **{{empresa_cliente}}**, con domicilio en **{{ciudad_cliente}}** (**{{cp_cliente}}**), con C.I.F. **{{cif_cliente}}**, teléfono **{{telefono}}**, e-mail: **{{email_cliente}}** En adelante **EL COMPRADOR**.

      Ambas partes se reconocen recíprocamente con la capacidad y legitimación necesaria en derecho para obligarse en los términos del presente contrato, y al efecto, de común acuerdo de su libre y consciente voluntad.

      EXPONEN

      **I.-** Que **NOMADE NATION, S.L** es una mercantil que tiene como actividad encuadrada dentro de su objeto social, la transformación y venta de vehículos automóviles en vehículos camperizados.

      **II.-** Que **NOMADE NATION, S.L** es propietaria del siguiente vehículo, siendo sus especificaciones técnicas las siguientes:

      MARCA / MODELO VEHÍCULO | {{marca_vehiculo}} / {{modelo_vehiculo}}
      MODELO NOMADE | {{modelo_nomade}}
      MOTORIZACIÓN | {{motorizacion}}
      NÚMERO DE BASTIDOR | {{numero_bastidor}}
      MATRÍCULA | {{matricula}}

      **CARGAS:** EL VENDEDOR manifiesta que el vehículo descrito no está gravado ni está en curso de constitución carga alguna, ni sujeto a prohibición de disponer, reserva de dominio o limitación, ni existe procedimiento judicial o administrativo del que pudiera derivarse embargo ni traba respecto del mismo.

      **III.-** Que la parte compradora se encuentra interesada en la adquisición del vehículo anteriormente referenciado tras efectuarse la camperización / transformación del mismo por parte de la mercantil vendedora.

      **IV.-** Que estando interesados ambos comparecientes en la compraventa del referido vehículo camperizado, y conociendo EL COMPRADOR las características principales de la presente compraventa, y en particular sus condiciones jurídicas y económicas, por medio del presente documento lo llevan a efecto con arreglo a las siguientes

      ESTIPULACIONES

      **PRIMERA. COMPRAVENTA**
      **NOMADE NATION, S.L** vende y **{{nombre_cliente}}** compra el vehículo descrito en el Antecedente II, en perfecto estado de uso, libre de cargas y gravámenes, así como al corriente de pago de todas las obligaciones fiscales tras efectuarse sobre el mismo la camperización igualmente pactada por las partes.

      EL COMPRADOR reconoce, entiende y acepta las características, prestaciones y limitaciones del vehículo y de todos sus componentes, tal y como se estipulan en la hoja de producto. Esto incluye, pero no se limita a, la capacidad de los sistemas eléctricos, rendimiento del sistema de calefacción, autonomía energética, almacenamiento de agua, eficiencia de los electrodomésticos y cualquier otro elemento técnico del vehículo camperizado.

      Asimismo, EL COMPRADOR declara estar conforme con las especificaciones del vehículo y renuncia a cualquier reclamación posterior basada en expectativas no alineadas con las prestaciones descritas en la documentación oficial proporcionada por EL VENDEDOR.

      **SEGUNDA. ENTREGA DE LA POSESIÓN**
      EL VENDEDOR entregará a EL COMPRADOR en el plazo máximo de **{{plazo_entrega}}** meses a contar desde la firma del presente documento, el vehículo camperizado junto a la siguiente documentación:

      • Manual de instrucciones de uso del fabricante del vehículo.
      • Manual de instrucciones de la camperización y sus componentes.
      • Elementos necesarios para el correcto funcionamiento y uso del vehículo, estipulados en el Contrato de Compraventa, firmado en el momento de la entrega.
      • Presupuesto aprobado por EL COMPRADOR, que se incorpora al presente contrato como ANEXO 1.

      EL COMPRADOR será responsable de todos los gastos derivados de la posesión y propiedad del vehículo a partir de la fecha de entrega, incluyendo la obligación de contratar un seguro de automóviles de al menos la cobertura obligatoria exigida por la legislación vigente.

      EL VENDEDOR no se hará responsable por retrasos en la entrega del vehículo que sean consecuencia de demoras demostrables por parte de proveedores, problemas de suministro, incidencias administrativas o burocráticas ajenas a su control. En tales casos, no se procederá a la devolución de los importes abonados por el comprador, debiendo este esperar a que se resuelvan los retrasos y completerse la producción y entrega del vehículo en el menor tiempo posible.

      Asimismo, cualquier retraso en homologaciones, matriculaciones, inspecciones técnicas u otros procedimientos administrativos no será imputable a EL VENDEDOR, y no generará derecho a indemnización ni devolución de pagos efectuados.

      **TERCERA. PRECIO**
      El precio convenido de la compraventa es de **{{precio_total}} €** que la parte compradora entrega del siguiente modo:

      • En este acto se hace entrega de la cantidad equivalente al 20% del precio final pactado (IVA incluido), y por importe de **{{pago_inicial}} €** mediante entrega de justificante de transferencia bancaria efectuada a cuenta designada al efecto por el vendedor.
      • La cantidad equivalente al 60% del precio final pactado (IVA incluido), y por importe de **{{pago_produccion}} €** mediante entrega de justificante de transferencia bancaria efectuada a cuenta designada al efecto por el vendedor, en el plazo de un mes antes del inicio de entrada a producción, debiendo ser comunicado el inicio de la misma por la parte vendedora.
      • El resto de la cantidad equivalente al 20% del precio final pactado (IVA incluido) reducido, si fuera el caso de haber efectuado la reserva, la cuantía entregada en concepto de reserva (500,00 €), y por importe de **{{pago_final}} €**. Se deberá efectuar por la parte compradora con anterioridad a los siete días naturales previos a la fecha de entrega del vehículo camperizado objeto de venta.

      A los efectos anteriores se designa expresamente por la parte vendedora el siguiente número de cuenta:
      **IBAN: {{iban}}**

      **CUARTA. GARANTÍA**
      EL VENDEDOR garantiza el correcto funcionamiento de la camperización y sus componentes por un período de **24 meses** desde la fecha de entrega, excluyendo el desgaste normal por uso y componentes que requieren mantenimiento regular.

      **QUINTA. RESOLUCIÓN**
      En caso de incumplimiento por cualquiera de las partes, la parte cumplidora podrá optar por exigir el cumplimiento o la resolución del contrato, en ambos casos con derecho a indemnización por daños y perjuicios.

      **SEXTA. GASTOS**
      Todos los gastos que se deriven del presente contrato, incluyendo los de formalización, serán por cuenta del comprador.

      **SÉPTIMA. LEGISLACIÓN APLICABLE Y JURISDICCIÓN**
      Este contrato se rige por la legislación española. Para cualquier controversia que pudiera surgir de la interpretación o cumplimiento del presente contrato, las partes se someten a la jurisdicción de los Juzgados y Tribunales de Barcelona, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.

      Y para que así conste y surta los efectos legales oportunos, firman el presente contrato por duplicado en el lugar y fecha al principio indicados.
    `
  }
};

export const generateContractData = async (project: UnifiedProject): Promise<ContractData> => {
  const currentDate = new Date().toLocaleDateString('es-ES');

  if (import.meta.env.DEV) console.log('🔍 Generando datos del contrato para proyecto:', project.id);
  if (import.meta.env.DEV) console.log('👤 Proyecto recibido (ID cliente):', project.client_id);

  // Fetch client data from Supabase database
  let clientData: any = null;
  if (project.client_id) {
    if (import.meta.env.DEV) console.log('📡 Consultando cliente en base de datos:', project.client_id);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', project.client_id)
      .single();

    if (error) {
      console.error('❌ Error fetching client:', error);
    } else {
      clientData = data;
      if (import.meta.env.DEV) console.log('✅ Datos del cliente obtenidos de BD:', clientData);
    }
  }

  // Fetch billing data for the client
  let billingData: any = null;
  if (project.client_id) {
    const { data: billing, error: billingError } = await supabase
      .from('billing')
      .select('*')
      .eq('client_id', project.client_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (billingError) {
      console.error('❌ Error fetching billing:', billingError);
    } else {
      billingData = billing;
      if (import.meta.env.DEV) console.log('✅ Datos de facturación obtenidos:', billingData);
    }
  }

  // Fetch primary budget for the project
  let primaryBudgetData: any = null;
  if (import.meta.env.DEV) console.log('💰 Consultando presupuesto primario para proyecto:', project.id);

  const { data: budgetData, error: budgetError } = await supabase
    .from('budget')
    .select('*')
    .eq('project_id', project.id)
    .eq('is_primary', true)
    .single();

  if (budgetError) {
    console.error('❌ Error fetching primary budget:', budgetError);
  } else {
    primaryBudgetData = budgetData;
    if (import.meta.env.DEV) console.log('✅ Presupuesto primario obtenido:', primaryBudgetData);
  }

  // Determine billing type
  const billingType = billingData?.type || 'personal';
  if (import.meta.env.DEV) console.log('📋 Tipo de facturación:', billingType);

  // Build address concatenation helper
  const buildFullAddress = (...parts: (string | null | undefined)[]) => {
    return parts.filter(p => p && p.trim() && p !== 'No especificado').join(', ') || 'No especificado';
  };

  // Determine contract person data based on billing type
  let contractName: string;
  let contractDni: string;
  let contractPhone: string;
  let contractEmail: string;
  let contractAddress: string;
  let contractCiudad: string;
  let contractCp: string;
  let contractEmpresa: string;
  let contractCif: string;

  if (billingType === 'company') {
    // Company billing — show all company info
    contractName = clientData?.name || 'No especificado';
    contractDni = clientData?.dni || 'No especificado';
    contractPhone = clientData?.phone || 'No especificado';
    contractEmail = clientData?.email || 'No especificado';
    contractAddress = buildFullAddress(
      billingData?.billing_address,
      billingData?.city || clientData?.city,
      billingData?.autonomous_community || clientData?.autonomous_community,
      billingData?.country || clientData?.country
    );
    contractCiudad = billingData?.city || clientData?.city || 'No especificado';
    contractCp = 'No especificado';
    contractEmpresa = billingData?.name || 'No especificado';
    contractCif = billingData?.nif || 'No especificado';
  } else if (billingType === 'other_person') {
    // Other person billing — use billing person data, no company info
    contractName = billingData?.name || clientData?.name || 'No especificado';
    contractDni = billingData?.nif || clientData?.dni || 'No especificado';
    contractPhone = billingData?.phone || clientData?.phone || 'No especificado';
    contractEmail = billingData?.email || clientData?.email || 'No especificado';
    contractAddress = buildFullAddress(
      billingData?.billing_address || clientData?.address,
      clientData?.city,
      clientData?.autonomous_community,
      clientData?.country
    );
    contractCiudad = clientData?.city || 'No especificado';
    contractCp = 'No especificado';
    // No company info for other_person
    contractEmpresa = '';
    contractCif = '';
  } else {
    // Personal billing — use client data, no company info
    contractName = clientData?.name || 'No especificado';
    contractDni = clientData?.dni || 'No especificado';
    contractPhone = clientData?.phone || 'No especificado';
    contractEmail = clientData?.email || 'No especificado';
    contractAddress = buildFullAddress(
      clientData?.address,
      clientData?.city,
      clientData?.autonomous_community,
      clientData?.country
    );
    contractCiudad = clientData?.city || 'No especificado';
    contractCp = 'No especificado';
    // No company info for personal
    contractEmpresa = '';
    contractCif = '';
  }

  if (import.meta.env.DEV) console.log('📋 Datos de facturación para contrato:', {
    nombre: contractName,
    dni: contractDni,
    telefono: contractPhone,
    email: contractEmail,
    direccion: contractAddress,
    empresa: contractEmpresa,
    cif: contractCif,
    billingType
  });

  // Extract project data
  const projectModel = project.model || 'No especificado';
  const projectPower = project.power || 'No especificado';
  const projectInteriorColor = project.interior_color || 'No especificado';
  const projectExteriorColor = project.exterior_color || 'No especificado';
  const projectCode = project.code || 'No especificado';

  // Use primary budget price if available
  const totalAmount = primaryBudgetData ? primaryBudgetData.total.toString() : 'No especificado';

  // Calculate payments (example with 20%, 60%, 20%)
  const totalPrice = primaryBudgetData ? primaryBudgetData.total : 0;
  const pagoInicial = totalPrice > 0 ? (totalPrice * 0.20).toFixed(2) : 'No especificado'; // 20% del total
  const pagoProduccion = totalPrice > 0 ? (totalPrice * 0.60).toFixed(2) : 'No especificado'; // 60% del total  
  const pagoFinal = totalPrice > 0 ? (totalPrice * 0.20).toFixed(2) : 'No especificado'; // 20% del total

  const contractData: ContractData = {
    // Basic fields (for old templates)
    client_name: contractName,
    client_dni: contractDni,
    client_phone: contractPhone,
    client_email: contractEmail,
    client_address: contractAddress,
    model: projectModel,
    total_amount: totalAmount,
    power: projectPower,
    interior_color: projectInteriorColor,
    exterior_color: projectExteriorColor,
    project_code: projectCode,
    current_date: currentDate,

    // Specific fields for camperization (exact names from templates)
    fecha: currentDate,
    nombre_cliente: contractName,
    DNI: contractDni,
    telefono: contractPhone,
    email_cliente: contractEmail,
    direccion_cliente: contractAddress,
    ciudad_cliente: contractCiudad,
    cp_cliente: contractCp,
    cif_cliente: contractCif || 'No especificado',
    empresa_cliente: contractEmpresa || 'No especificado',
    marca_vehiculo: 'Fiat Ducato', // Default value
    modelo_vehiculo: projectModel,
    modelo_nomade: projectModel,
    motorizacion: projectPower,
    numero_bastidor: 'No especificado',
    matricula: 'No especificado',
    precio_total: totalAmount,
    pago_inicial: pagoInicial,
    pago_produccion: pagoProduccion,
    pago_final: pagoFinal,
    plazo_entrega: 'No especificado',

    // NEW: Direct database fields (without prefixes)
    name: contractName,
    phone: contractPhone,
    email: contractEmail,
    dni: contractDni,
    address: contractAddress,

    // NEW: Object notation fields (clients.field)
    'clients.name': contractName,
    'clients.phone': contractPhone,
    'clients.email': contractEmail,
    'clients.dni': contractDni,
    'clients.address': contractAddress,
  };

  if (import.meta.env.DEV) console.log('✅ Datos del contrato generados correctamente con BD:', contractData);
  return contractData;
};

export const processTemplate = (template: string, data: ContractData): string => {
  if (!template) {
    if (import.meta.env.DEV) console.log('⚠️ processTemplate: Template is empty');
    return '';
  }

  if (import.meta.env.DEV) console.log('🔄 processTemplate: Processing template with data');
  if (import.meta.env.DEV) console.log('📄 Template length:', template.length);
  if (import.meta.env.DEV) console.log('🔍 Template original (primeros 200 chars):', template.substring(0, 200));

  let processedTemplate = template;

  // ENHANCED: Crear un mapeo extendido para manejar todas las variaciones posibles
  const extendedMapping: Record<string, string> = {
    ...data,
    // Mapeos adicionales para casos especiales
    'teléfono': data.telefono || data.phone || data.client_phone,
    'télefono': data.telefono || data.phone || data.client_phone, // Variación de escritura
    'clients.name': data.name || data.client_name || data.nombre_cliente,
    'clients.phone': data.phone || data.client_phone || data.telefono,
    'clients.email': data.email || data.client_email || data.email_cliente,
    'clients.dni': data.dni || data.client_dni || data.DNI,
    'clients.address': data.address || data.client_address || data.direccion_cliente,
  };

  if (import.meta.env.DEV) console.log('🔍 Mapeo extendido creado:', {
    'clients.name': extendedMapping['clients.name'],
    'teléfono': extendedMapping['teléfono'],
    'clients.phone': extendedMapping['clients.phone'],
    'phone': extendedMapping['phone'],
    'telefono': extendedMapping['telefono']
  });

  // ENHANCED: Procesar todas las variables con regex mejorado
  Object.entries(extendedMapping).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Crear regex que escape correctamente los caracteres especiales en la clave
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      const replacementValue = String(value || 'No especificado');

      // Contar ocurrencias antes del reemplazo
      const beforeCount = (processedTemplate.match(regex) || []).length;
      if (beforeCount > 0) {
        if (import.meta.env.DEV) console.log(`🔄 Reemplazando ${beforeCount} ocurrencias de {{${key}}} con: "${replacementValue}"`);
        processedTemplate = processedTemplate.replace(regex, replacementValue);

        // Verificar que el reemplazo funcionó
        const afterCount = (processedTemplate.match(regex) || []).length;
        if (import.meta.env.DEV) console.log(`${afterCount === 0 ? '✅' : '⚠️'} Reemplazo ${afterCount === 0 ? 'completado' : 'parcial'}. Ocurrencias restantes: ${afterCount}`);
      }
    }
  });

  if (import.meta.env.DEV) console.log('✅ processTemplate: Template processed successfully');
  if (import.meta.env.DEV) console.log('📄 Processed template length:', processedTemplate.length);

  // ENHANCED: Buscar cualquier placeholder sin reemplazar
  const unreplacedPlaceholders = processedTemplate.match(/\{\{[^}]+\}\}/g);
  if (unreplacedPlaceholders) {
    if (import.meta.env.DEV) console.log('⚠️ Placeholders sin reemplazar encontrados:', unreplacedPlaceholders);
    if (import.meta.env.DEV) console.log('🔍 Verificando si estos placeholders tienen datos disponibles...');

    unreplacedPlaceholders.forEach(placeholder => {
      const key = placeholder.replace(/[{}]/g, '');
      const hasData = extendedMapping[key] !== undefined && extendedMapping[key] !== null;
      if (import.meta.env.DEV) console.log(`   - ${placeholder}: datos disponibles = ${hasData ? 'SÍ' : 'NO'} | valor = "${extendedMapping[key] || 'N/A'}"`);
    });
  } else {
    if (import.meta.env.DEV) console.log('✅ Todos los placeholders fueron reemplazados correctamente');
  }

  // ENHANCED: Mostrar una muestra del resultado para debugging
  const sampleLength = Math.min(500, processedTemplate.length);
  if (import.meta.env.DEV) console.log('📄 Muestra del template procesado (primeros 500 chars):', processedTemplate.substring(0, sampleLength));

  return processedTemplate;
};

export const validateContractData = (data: ContractData): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = [
    'client_name', 'client_dni', 'client_phone', 'client_email', 'client_address',
    'model', 'total_amount', 'power', 'interior_color', 'exterior_color'
  ];

  const missingFields = requiredFields.filter(field =>
    !data[field as keyof ContractData] || data[field as keyof ContractData] === 'No especificado'
  );

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};
