import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Upload, FileText, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useCreateNewVehicle } from '../../hooks/useNewVehicles';
import { NewVehicleFormData } from '../../types/vehicles';

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface FieldMapping {
  [csvField: string]: string;
}

const CSVVehicleUpload = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing'>('upload');
  
  const createVehicle = useCreateNewVehicle();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      await processCSV(file);
    } else {
      toast.error('Por favor selecciona un archivo CSV válido');
    }
  };

  const processCSV = async (file: File) => {
    setIsProcessing(true);
    try {
      const csvText = await file.text();
      const lines = csvText.trim().split('\n');
      
      if (lines.length < 2) {
        toast.error('El CSV debe tener al menos una fila de datos');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      // Mapeo automático basado en los nombres de las columnas
      const autoMapping = createAutoMapping(headers);
      setFieldMapping(autoMapping);

      setCsvData({ headers, rows });
      setStep('mapping');
      toast.success(`CSV cargado: ${headers.length} columnas, ${rows.length} filas - Mapeo automático aplicado`);
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Error al procesar el archivo CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const createAutoMapping = (headers: string[]): FieldMapping => {
    const mapping: FieldMapping = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      
      // Mapeo automático basado en palabras clave
      if (lowerHeader.includes('bastidor') || lowerHeader.includes('chassis') || lowerHeader.includes('vin')) {
        mapping[header] = 'numero_bastidor';
      } else if (lowerHeader.includes('matricula') || lowerHeader.includes('placa') || lowerHeader.includes('license')) {
        mapping[header] = 'matricula';
      } else if (lowerHeader.includes('motor') || lowerHeader.includes('engine') || lowerHeader.includes('motorización')) {
        mapping[header] = 'engine';
      } else if (lowerHeader.includes('transmisión') || lowerHeader.includes('transmission') || lowerHeader.includes('cambio')) {
        mapping[header] = 'transmission_type';
      } else if (lowerHeader.includes('color') && (lowerHeader.includes('exterior') || lowerHeader.includes('carrocería'))) {
        mapping[header] = 'exterior_color';
      } else if (lowerHeader.includes('plaza') || lowerHeader.includes('asiento') || lowerHeader.includes('seat')) {
        mapping[header] = 'plazas';
      } else if (lowerHeader.includes('dimensión') || lowerHeader.includes('dimension') || lowerHeader.includes('tamaño')) {
        mapping[header] = 'dimensions';
      } else if (lowerHeader.includes('proveedor') || lowerHeader.includes('distribuidor') || lowerHeader.includes('supplier')) {
        mapping[header] = 'proveedor';
      } else if (lowerHeader.includes('ubicación') || lowerHeader.includes('location') || lowerHeader.includes('lugar')) {
        mapping[header] = 'location';
      } else if (lowerHeader.includes('pago') && lowerHeader.includes('estado')) {
        mapping[header] = 'estado_pago';
      } else if (lowerHeader.includes('pago') && lowerHeader.includes('fecha')) {
        mapping[header] = 'fecha_pago';
      } else {
        mapping[header] = 'none';
      }
    });
    
    return mapping;
  };

  const updateFieldMapping = (csvField: string, dbField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvField]: dbField
    }));
  };

  const importVehicles = async () => {
    if (!csvData) return;

    setStep('importing');
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const duplicates: string[] = [];

    if (import.meta.env.DEV) console.log('🚛 Iniciando importación de vehículos...', {
      totalRows: csvData.rows.length,
      fieldMapping,
      headers: csvData.headers
    });

    // Validación previa: verificar duplicados en el CSV
    const bastidores = new Set<string>();
    const csvDuplicates = csvData.rows.filter((row, rowIndex) => {
      const bastidorIndex = csvData.headers.findIndex(h => fieldMapping[h] === 'numero_bastidor');
      const bastidor = row[bastidorIndex]?.trim();
      if (bastidor && bastidores.has(bastidor)) {
        return true;
      }
      if (bastidor) bastidores.add(bastidor);
      return false;
    });

    if (csvDuplicates.length > 0) {
      console.warn('⚠️ Bastidores duplicados encontrados en CSV:', csvDuplicates.length);
    }

    for (let rowIndex = 0; rowIndex < csvData.rows.length; rowIndex++) {
      const row = csvData.rows[rowIndex];
      
      try {
        const vehicleData: Partial<NewVehicleFormData> = {};
        
        if (import.meta.env.DEV) console.log(`🔄 Procesando fila ${rowIndex + 1}:`, row);
        
        // Mapear datos según el mapping definido
        csvData.headers.forEach((header, index) => {
          const dbField = fieldMapping[header];
          const value = row[index]?.trim();
          
          if (dbField && dbField !== 'none' && value) {
            if (dbField === 'fecha_pago' && value) {
              try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  vehicleData[dbField] = date.toISOString().split('T')[0];
                }
              } catch (e) {
                console.warn(`⚠️ Error parseando fecha en fila ${rowIndex + 1}:`, value);
              }
            } else {
              vehicleData[dbField] = value;
            }
          }
        });

        // Verificar que numero_bastidor esté presente y no esté vacío
        if (!vehicleData.numero_bastidor || vehicleData.numero_bastidor.trim() === '') {
          const error = `Fila ${rowIndex + 1}: Número de bastidor requerido`;
          console.error('❌', error);
          errors.push(error);
          errorCount++;
          continue;
        }

        // Limpiar datos vacíos o undefined
        Object.keys(vehicleData).forEach(key => {
          if (vehicleData[key] === '' || vehicleData[key] === undefined) {
            delete vehicleData[key];
          }
        });

        if (import.meta.env.DEV) console.log(`✅ Datos mapeados para fila ${rowIndex + 1}:`, vehicleData);

        // Asegurar que tenemos los datos mínimos requeridos
        const finalVehicleData: NewVehicleFormData = {
          numero_bastidor: vehicleData.numero_bastidor,
          ...vehicleData
        };

        await new Promise<void>((resolve) => {
          createVehicle.mutate(finalVehicleData, {
            onSuccess: (data) => {
              if (import.meta.env.DEV) console.log(`✅ Vehículo ${rowIndex + 1} creado exitosamente:`, data);
              successCount++;
              resolve();
            },
            onError: (error: any) => {
              console.error(`❌ Error creando vehículo ${rowIndex + 1}:`, error);
              
              // Detectar si es un error de duplicado
              if (error?.message?.includes('duplicate') || 
                  error?.message?.includes('duplicat') ||
                  error?.message?.includes('already exists') ||
                  error?.code === '23505') {
                duplicates.push(`Fila ${rowIndex + 1}: Bastidor ${vehicleData.numero_bastidor} ya existe`);
              } else {
                errors.push(`Fila ${rowIndex + 1}: ${error?.message || 'Error desconocido'}`);
              }
              errorCount++;
              resolve();
            }
          });
        });
      } catch (error: any) {
        console.error(`❌ Error procesando fila ${rowIndex + 1}:`, error);
        errors.push(`Fila ${rowIndex + 1}: ${error?.message || 'Error en procesamiento'}`);
        errorCount++;
      }
    }

    // Mostrar resultados detallados
    if (import.meta.env.DEV) console.log('📊 Resumen de importación:', {
      successCount,
      errorCount,
      duplicates: duplicates.length,
      errors: errors.length
    });

    if (successCount > 0) {
      toast.success(`✅ ${successCount} vehículos importados exitosamente`);
    }

    if (duplicates.length > 0) {
      toast.warning(`⚠️ ${duplicates.length} vehículos omitidos por bastidores duplicados`);
      console.warn('Duplicados:', duplicates);
    }

    if (errors.length > 0) {
      toast.error(`❌ ${errors.length} vehículos fallaron al importar`);
      console.error('Errores detallados:', errors);
      
      // Mostrar primeros 3 errores en toast para debugging
      if (errors.length <= 3) {
        errors.forEach(error => toast.error(error));
      }
    }

    // Reset state
    setIsOpen(false);
    setCsvFile(null);
    setCsvData(null);
    setFieldMapping({});
    setStep('upload');
  };

  const resetDialog = () => {
    setCsvFile(null);
    setCsvData(null);
    setFieldMapping({});
    setStep('upload');
  };

  const vehicleFields = [
    { value: 'none', label: 'No mapear' },
    { value: 'numero_bastidor', label: 'Número de Bastidor (obligatorio)' },
    { value: 'matricula', label: 'Matrícula' },
    { value: 'engine', label: 'Motor' },
    { value: 'transmission_type', label: 'Tipo de Transmisión' },
    { value: 'exterior_color', label: 'Color Exterior' },
    { value: 'plazas', label: 'Plazas' },
    { value: 'dimensions', label: 'Dimensiones' },
    { value: 'proveedor', label: 'Proveedor' },
    { value: 'location', label: 'Ubicación' },
    { value: 'estado_pago', label: 'Estado de Pago' },
    { value: 'fecha_pago', label: 'Fecha de Pago' },
  ];

  const canImport = csvData && fieldMapping && 
    Object.values(fieldMapping).includes('numero_bastidor');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Insertar Vehículos por CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Vehículos desde CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Selecciona un archivo CSV</p>
                <p className="text-sm text-gray-500">
                  Podrás mapear manualmente los campos a la estructura de vehículos
                </p>
              </div>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo CSV
                  </>
                )}
              </label>
            </div>

            {csvFile && csvData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{csvFile.name}</p>
                    <p className="text-sm text-green-600">
                      {csvData.headers.length} columnas, {csvData.rows.length} filas
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && csvData && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900">
                  Mapea las columnas del CSV a los campos de vehículos
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Mapeo Automático Aplicado:</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setStep('upload')}
                >
                  Volver a cargar archivo
                </Button>
              </div>
              <div className="space-y-3">
                {csvData.headers.map((header, index) => {
                  const mappedField = fieldMapping[header];
                  const fieldLabel = vehicleFields.find(f => f.value === mappedField)?.label || 'Campo no reconocido';
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{header}</span>
                        <p className="text-sm text-gray-500">
                          Ejemplo: {csvData.rows[0]?.[index] || 'Sin datos'}
                        </p>
                      </div>
                      <div className="flex-1 max-w-xs text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                          mappedField === 'none' 
                            ? 'bg-gray-100 text-gray-600' 
                            : mappedField === 'numero_bastidor'
                            ? 'bg-green-100 text-green-800 font-medium'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {fieldLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!canImport && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  ⚠️ No se detectó automáticamente una columna de "Número de Bastidor". Verifica que el CSV contenga esta información obligatoria.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                onClick={importVehicles} 
                disabled={!canImport}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Importar {csvData.rows.length} Vehículos Automáticamente
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Importando vehículos...</p>
            <p className="text-sm text-gray-500 mt-2">
              Esto puede tomar unos momentos
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CSVVehicleUpload;