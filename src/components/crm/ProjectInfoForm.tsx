
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import BudgetItemManager from './BudgetItemManager';
import { Separator } from '../ui/separator';

import {
    useModelOptions,
    useEngineOptions,
    useExteriorColorOptions,
    useInteriorColorOptions,
    useNewBudgetPacks,
    useElectricSystems
} from '../../hooks/useNewBudgets';

interface ProjectInfoFormProps {
    form: UseFormReturn<any>;
    disabled?: boolean;
    notesFieldName?: string;
    hideNotes?: boolean;
    hidePrices?: boolean;
    projectId?: string;
    budgetId?: string;
}

const ProjectInfoForm = ({ form, disabled = false, notesFieldName = 'projectNotes', hideNotes = false, hidePrices = false, projectId, budgetId }: ProjectInfoFormProps) => {
    const { data: modelOptions, isLoading: isLoadingModels } = useModelOptions();
    const { data: engineOptions, isLoading: isLoadingEngines } = useEngineOptions();
    const { data: exteriorColorOptions, isLoading: isLoadingExterior } = useExteriorColorOptions();
    const { data: interiorColorOptions, isLoading: isLoadingInterior } = useInteriorColorOptions();
    const { data: packOptions, isLoading: isLoadingPacks } = useNewBudgetPacks();
    const { data: electricOptions, isLoading: isLoadingElectric } = useElectricSystems();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="vehicleModel"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-bold">Modelo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled || isLoadingModels}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary">
                                    <SelectValue placeholder={isLoadingModels ? "Cargando modelos..." : "Selecciona modelo"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                                {modelOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.name}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />


            <FormField
                control={form.control}
                name="motorization"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-bold">Motorización</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled || isLoadingEngines}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary">
                                    <SelectValue placeholder={isLoadingEngines ? "Cargando..." : "Selecciona motorización"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                                {engineOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.name}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="furnitureColor"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-bold">Color Mobiliario</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled || isLoadingInterior}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary">
                                    <SelectValue placeholder={isLoadingInterior ? "Cargando..." : "Selecciona color"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                                {interiorColorOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.name}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="exteriorColor"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-bold">Color Exterior</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled || isLoadingExterior}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary">
                                    <SelectValue placeholder={isLoadingExterior ? "Cargando..." : "Selecciona color"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                                {exteriorColorOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.name}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="productionSlot"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-bold">Slot de Producción</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary">
                                    <SelectValue placeholder="Selecciona slot" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                                <SelectItem value="Q3 2024">Q3 2024</SelectItem>
                                <SelectItem value="Q4 2024">Q4 2024</SelectItem>
                                <SelectItem value="Q1 2025">Q1 2025</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="electricalSystem"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-bold">Sistema Eléctrico</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled || isLoadingElectric}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary">
                                    <SelectValue placeholder={isLoadingElectric ? "Cargando..." : "Selecciona sistema"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                                {electricOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.name}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="md:col-span-2 space-y-4">
                <FormLabel className="text-foreground font-bold">Paquetes de Extras</FormLabel>
                <FormField
                    control={form.control}
                    name="extraPacks"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormControl>
                                {isLoadingPacks ? (
                                    <div className="text-xs text-muted-foreground">Cargando paquetes...</div>
                                ) : (
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={disabled}
                                        className="flex flex-row flex-wrap gap-6"
                                    >
                                        {packOptions?.map((option) => (
                                            <div key={option.id} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.name} id={`pack-${option.id}`} />
                                                <Label htmlFor={`pack-${option.id}`} className="font-medium text-muted-foreground whitespace-nowrap">
                                                    {option.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="md:col-span-2 py-4">
                <Separator className="mb-6 opacity-50" />
                <BudgetItemManager form={form} disabled={disabled} hidePrices={hidePrices} projectId={projectId} budgetId={budgetId} />
            </div>

            {!hideNotes && (
                <FormField
                    control={form.control}
                    name={notesFieldName}
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="text-foreground font-bold">Comentarios y Especificaciones Personalizadas</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    disabled={disabled}
                                    className="w-full min-h-[80px] rounded-xl border border-border p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm transition-all bg-muted/30"
                                    placeholder="Añade cualquier especificación personalizada del proyecto..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
};

export default ProjectInfoForm;
