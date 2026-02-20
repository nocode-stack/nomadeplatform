export const BASE_PRICES = {
    vehicleModel: {
        'Neo': 45000,
        'Neo S': 52000,
        'Neo XL': 65000,
        'Personalizado': 50000
    },
    motorization: {
        'Diesel 140cv': 0,
        'Diesel 180cv': 3500,
        'Electrica': 12000
    },
    electricalSystem: {
        'Básico': 0,
        'Avanzado': 2500,
        'Off-grid Pro': 5500
    },
    extraPacks: {
        'Pack Nomade': 1500,
        'Adventure': 4500,
        'Premium': 8500
    },
};

export const calculateBudgetTotal = (data: {
    vehicleModel?: string;
    motorization?: string;
    electricalSystem?: string;
    extraPacks?: string;
    discount?: string | number;
    items?: { price: number; quantity: number }[];
    prices?: {
        model?: number;
        engine?: number;
        electric?: number;
        pack?: number;
        exterior?: number;
        interior?: number;
    };
}) => {
    const modelPrice = Number(data.prices?.model ?? ((BASE_PRICES.vehicleModel as any)[data.vehicleModel || ''] || 0));
    const motorPrice = Number(data.prices?.engine ?? ((BASE_PRICES.motorization as any)[data.motorization || ''] || 0));
    const electricalPrice = Number(data.prices?.electric ?? ((BASE_PRICES.electricalSystem as any)[data.electricalSystem || ''] || 0));
    const packPrice = Number(data.prices?.pack ?? ((BASE_PRICES.extraPacks as any)[data.extraPacks || ''] || 0));
    const exteriorPrice = Number(data.prices?.exterior ?? 0);
    const interiorPrice = Number(data.prices?.interior ?? 0);
    const itemsTotal = (data.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

    const subtotal = (modelPrice || 0) + (motorPrice || 0) + (electricalPrice || 0) + (packPrice || 0) + (exteriorPrice || 0) + (interiorPrice || 0) + (itemsTotal || 0);


    const discountPercent = typeof data.discount === 'string' ? parseFloat(data.discount.replace(',', '.') || '0') : (Number(data.discount) || 0);
    const safeDiscountPercent = isNaN(discountPercent) ? 0 : discountPercent;
    const discountAmount = subtotal * (safeDiscountPercent / 100);
    const discountPercentage = safeDiscountPercent / 100;
    const totalAfterDiscounts = subtotal - discountAmount;

    // Calcular IVA
    const ivaRate = typeof (data as any).ivaRate === 'number' ? (data as any).ivaRate : 21;
    const totalWithIva = totalAfterDiscounts * (1 + ivaRate / 100);

    const result = {
        subtotal: isNaN(subtotal) ? 0 : subtotal,
        discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
        discountPercentage: isNaN(discountPercentage) ? 0 : discountPercentage,
        total: isNaN(totalWithIva) ? 0 : totalWithIva
    };

    return {
        subtotal: Math.round(result.subtotal * 100) / 100,
        discountAmount: result.discountAmount,
        discountPercentage: Math.round(result.discountPercentage * 100) / 100,
        total: Math.round(result.total * 100) / 100
    };
};
