
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { NumericInput } from '../../ui/numeric-input';
import { Check } from 'lucide-react';

interface GeneralDiscountSectionProps {
  discountPercentage: number;
  onDiscountChange: (percentage: number) => void;
  ivaRate: number;
  onIvaRateChange: (rate: number) => void;
  onApplyDiscount: () => void;
  onApplyIva: () => void;
}

const GeneralDiscountSection = ({
  discountPercentage,
  onDiscountChange,
  ivaRate,
  onIvaRateChange,
  onApplyDiscount,
  onApplyIva
}: GeneralDiscountSectionProps) => {
  const [discountInput, setDiscountInput] = useState(discountPercentage.toString());
  const [ivaInput, setIvaInput] = useState(ivaRate.toString());

  const handleDiscountInputChange = (value: string) => {
    setDiscountInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onDiscountChange(numValue);
    } else if (value === '') {
      onDiscountChange(0);
    }
  };

  const handleIvaInputChange = (value: string) => {
    setIvaInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onIvaRateChange(numValue);
    } else if (value === '') {
      onIvaRateChange(0);
    }
  };

  const handleApplyDiscount = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onApplyDiscount();
  };

  const handleApplyIva = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onApplyIva();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuración General</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="general-discount">Descuento General (%)</Label>
            <div className="flex gap-2">
              <NumericInput
                id="general-discount"
                value={discountInput}
                onChange={(displayValue) => handleDiscountInputChange(displayValue)}
                min={0}
                max={100}
                placeholder="0"
                className="flex-1"
                allowDecimals={true}
              />
              <Button
                type="button"
                onClick={handleApplyDiscount}
                size="sm"
                variant="outline"
                className="px-3"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
            {discountPercentage > 0 && (
              <div className="text-sm text-green-600 font-medium">
                Descuento aplicado: {discountPercentage}%
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="iva-rate">Tasa de IVA (%)</Label>
            <div className="flex gap-2">
              <NumericInput
                id="iva-rate"
                value={ivaInput}
                onChange={(displayValue) => handleIvaInputChange(displayValue)}
                min={0}
                max={100}
                placeholder="21"
                className="flex-1"
                allowDecimals={true}
              />
              <Button
                type="button"
                onClick={handleApplyIva}
                size="sm"
                variant="outline"
                className="px-3"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralDiscountSection;
