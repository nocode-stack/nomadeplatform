import { useMemo } from 'react';

interface VehicleSpecs {
  engine?: string;
  transmission_type?: string;
  exterior_color?: string;
  plazas?: string;
}

interface BudgetSpecs {
  engine_option?: {
    name: string;
    power: string;
    transmission: string;
  };
  exterior_color?: {
    name: string;
  };
  model_option?: {
    name: string;
  };
}

interface Discrepancy {
  field: string;
  vehicleValue: string;
  budgetValue: string;
  message: string;
}

export function useVehicleSpecsComparison(vehicleData: VehicleSpecs | null, budgetData: BudgetSpecs | null) {
  return useMemo(() => {
    if (!vehicleData || !budgetData) {
      return {
        hasDiscrepancies: false,
        discrepancies: [],
        isDataComplete: false
      };
    }

    const discrepancies: Discrepancy[] = [];

    // Comparar motor/potencia
    if (budgetData.engine_option?.power && vehicleData.engine) {
      const budgetPower = extractPowerFromText(budgetData.engine_option.power);
      const vehiclePower = extractPowerFromText(vehicleData.engine);
      
      if (budgetPower && vehiclePower && budgetPower !== vehiclePower) {
        discrepancies.push({
          field: 'engine',
          vehicleValue: vehicleData.engine,
          budgetValue: budgetData.engine_option.power,
          message: `Motor: vehículo tiene ${vehiclePower}cv, presupuesto especifica ${budgetPower}cv`
        });
      }
    }

    // Comparar transmisión
    if (budgetData.engine_option?.transmission && vehicleData.transmission_type) {
      const budgetTrans = normalizeTransmission(budgetData.engine_option.transmission);
      const vehicleTrans = normalizeTransmission(vehicleData.transmission_type);
      
      if (budgetTrans && vehicleTrans && budgetTrans !== vehicleTrans) {
        discrepancies.push({
          field: 'transmission',
          vehicleValue: vehicleData.transmission_type,
          budgetValue: budgetData.engine_option.transmission,
          message: `Transmisión: vehículo tiene ${vehicleData.transmission_type}, presupuesto especifica ${budgetData.engine_option.transmission}`
        });
      }
    }

    // Comparar color exterior
    if (budgetData.exterior_color?.name && vehicleData.exterior_color) {
      const budgetColor = normalizeColor(budgetData.exterior_color.name);
      const vehicleColor = normalizeColor(vehicleData.exterior_color);
      
      if (budgetColor !== vehicleColor) {
        discrepancies.push({
          field: 'color',
          vehicleValue: vehicleData.exterior_color,
          budgetValue: budgetData.exterior_color.name,
          message: `Color: vehículo es ${vehicleData.exterior_color}, presupuesto especifica ${budgetData.exterior_color.name}`
        });
      }
    }

    return {
      hasDiscrepancies: discrepancies.length > 0,
      discrepancies,
      isDataComplete: !!(vehicleData.engine && budgetData.engine_option?.power)
    };
  }, [vehicleData, budgetData]);
}

function extractPowerFromText(text: string): string | null {
  const match = text.match(/(\d+)cv/i);
  return match ? match[1] : null;
}

function normalizeTransmission(transmission: string): string {
  const lower = transmission.toLowerCase();
  if (lower.includes('manual')) return 'manual';
  if (lower.includes('automatic') || lower.includes('automática')) return 'automatica';
  return lower;
}

function normalizeColor(color: string): string {
  return color.toLowerCase().trim().replace(/\s+/g, ' ');
}