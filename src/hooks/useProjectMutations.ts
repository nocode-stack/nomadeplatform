import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useProjectsList } from './useProjectQueries';
import { ProjectFormData, BudgetItemInput } from '@/types/project';
import {
    fetchBudgetOptions,
    findOptionId,
    safeFloat,
    buildBudgetItems,
    calculateFromOptions,
    BudgetOptions
} from './useProjectBudgetHelpers';

/**
 * Main hook for project CRUD operations.
 * Provides createProject and updateProject with proper typing.
 */
export const useProjects = () => {
    const { user } = useAuth();
    const { data: profile } = useUserProfile(user?.id);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const projectsList = useProjectsList();

    const createProject = async (
        projectData: ProjectFormData,
        mode: 'save_only' | 'generate_budget' | 'generate_all' = 'generate_all'
    ) => {
        if (import.meta.env.DEV) console.log('🚀 createProject entering with mode:', mode);

        try {
            // 1. Create or find client
            let newClient;

            const { data: existingClient } = await supabase
                .from('NEW_Clients')
                .select('*')
                .eq('email', projectData.clientEmail)
                .maybeSingle();

            if (existingClient) {
                newClient = existingClient;
                await supabase
                    .from('NEW_Clients')
                    .update({
                        name: projectData.clientName,
                        phone: projectData.clientPhone,
                        dni: projectData.clientDni || existingClient.dni,
                        address: projectData.clientAddress || existingClient.address,
                        birthdate: projectData.clientBirthDate || existingClient.birthdate,
                        is_active: true
                    })
                    .eq('id', existingClient.id);
            } else {
                const { data: createdClient, error: clientError } = await supabase
                    .from('NEW_Clients')
                    .insert({
                        name: projectData.clientName,
                        email: projectData.clientEmail,
                        phone: projectData.clientPhone,
                        dni: projectData.clientDni || '',
                        address: projectData.clientAddress || '',
                        client_status: projectData.clientType || 'prospect',
                        birthdate: projectData.clientBirthDate || null,
                        client_type: 'individual',
                        is_active: true
                    })
                    .select()
                    .single();

                if (clientError) {
                    console.error('❌ Error creating client:', clientError);
                    throw clientError;
                }
                newClient = createdClient;
            }

            // 2. Create billing info
            const billingType = projectData.billingType || 'personal';
            let billingName: string, billingEmail: string, billingPhone: string, billingAddress: string, billingDni: string;

            if (billingType === 'company') {
                billingName = projectData.clientBillingCompanyName || projectData.clientName;
                billingEmail = projectData.clientBillingCompanyEmail || projectData.clientEmail;
                billingPhone = projectData.clientBillingCompanyPhone || projectData.clientPhone;
                billingAddress = projectData.clientBillingCompanyAddress || projectData.clientAddress || '';
                billingDni = projectData.clientBillingCompanyCif || '';
            } else if (billingType === 'other_person') {
                billingName = projectData.otherPersonName || projectData.clientName;
                billingEmail = projectData.otherPersonEmail || projectData.clientEmail;
                billingPhone = projectData.otherPersonPhone || projectData.clientPhone;
                billingAddress = projectData.otherPersonAddress || projectData.clientAddress || '';
                billingDni = projectData.otherPersonDni || '';
            } else {
                billingName = projectData.clientBillingName || projectData.clientName;
                billingEmail = projectData.clientBillingEmail || projectData.clientEmail;
                billingPhone = projectData.clientBillingPhone || projectData.clientPhone;
                billingAddress = projectData.clientBillingAddress || projectData.clientAddress || '';
                billingDni = projectData.clientDni || '';
            }

            const { error: billingError } = await supabase
                .from('NEW_Billing')
                .insert({
                    client_id: newClient.id,
                    name: billingName,
                    email: billingEmail,
                    phone: billingPhone,
                    billing_address: billingAddress,
                    nif: billingDni,
                    type: billingType
                });

            if (billingError) {
                console.error('❌ Error creating billing info:', billingError);
            }

            // 3. Create the project
            const { error: projectError, data: newProject } = await supabase
                .from('NEW_Projects')
                .insert({
                    client_id: newClient.id,
                    client_name: projectData.clientName,
                    status: 'prospect',
                    vehicle_id: null,
                    slot_id: null,
                    comercial: projectData.comercial || null,
                    project_code: null
                })
                .select()
                .single();

            if (projectError) {
                console.error('❌ Error creating project:', projectError);
                throw projectError;
            }

            // Save-only mode: stop here
            if (mode === 'save_only') {
                queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
                queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });
                queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
                toast({ title: "Contacto guardado", description: "La ficha del cliente se ha registrado correctamente." });
                return newProject;
            }

            // 4. Create initial budget
            const opts = await fetchBudgetOptions();
            const { total, subtotal, discountAmount, discountPercentage } = calculateFromOptions(opts, projectData);

            const modelId = findOptionId(opts.models, projectData.vehicleModel);
            const engineId = findOptionId(opts.engines, projectData.motorization);
            const interiorId = findOptionId(opts.interiorColors, projectData.furnitureColor);
            const packId = findOptionId(opts.packs, projectData.extraPacks);
            const electricId = findOptionId(opts.electricSystems, projectData.electricalSystem);
            const exteriorId = findOptionId(opts.exteriorColors, projectData.exteriorColor);

            const initialBudgetData = {
                project_id: newProject.id,
                client_id: newClient.id,
                status: 'draft' as const,
                is_primary: true,
                model_option_id: modelId,
                engine_option_id: engineId,
                interior_color_id: interiorId,
                pack_id: packId,
                electric_system_id: electricId,
                notes: (projectData.budgetNotes || projectData.projectNotes || '').trim(),
                total: total || 0,
                subtotal: subtotal || 0,
                discount_amount: isNaN(discountAmount) ? 0 : (discountAmount || 0),
                created_by: user?.id || null,
                base_price: (opts.models?.find(m => m.id === modelId)?.price_modifier || 0) + (opts.engines?.find(e => e.id === engineId)?.price_modifier || 0),
                color_modifier: ((exteriorId ? opts.exteriorColors?.find(c => c.id === exteriorId)?.price_modifier : 0) || 0) + ((interiorId ? opts.interiorColors?.find(c => c.id === interiorId)?.price_modifier : 0) || 0),
                pack_price: (packId ? opts.packs?.find(p => p.id === packId)?.price : 0) || 0,
                electric_system_price: (electricId ? opts.electricSystems?.find(e => e.id === electricId)?.price : 0) || 0,
                discount_percentage: discountPercentage || 0
            };

            const { data: createdBudget, error: budgetError } = await supabase
                .from('NEW_Budget')
                .insert(initialBudgetData)
                .select()
                .single();

            if (budgetError) {
                console.error('❌ Error creating budget:', budgetError);
                toast({ title: "Error al crear presupuesto", description: budgetError.message, variant: "destructive" });
                throw budgetError;
            }

            // 5. Create budget items
            if (projectData.items && projectData.items.length > 0) {
                const items = buildBudgetItems(createdBudget.id, projectData.items);
                const { error: itemsError } = await supabase.from('NEW_Budget_Items').insert(items);
                if (itemsError) console.error('❌ Error creating budget items:', itemsError);
            }

            queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
            queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });
            queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
            toast({ title: "Proyecto creado", description: "Prospect registrado correctamente con presupuesto inicial." });

            return { ...newProject, budget_id: createdBudget?.id };

        } catch (error) {
            console.error('❌ Root error in createProject:', error);
            const message = error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.';
            toast({ title: "Error al crear proyecto", description: message, variant: "destructive" });
            throw error;
        }
    };

    const updateProject = async (projectId: string, projectData: ProjectFormData) => {
        if (import.meta.env.DEV) console.log('🚀 updateProject entering for ID:', projectId);

        try {
            // 1. Resolve project or client ID
            let activeProjectId: string | null = null;
            let activeClientId: string = projectId;

            const { data: project } = await supabase
                .from('NEW_Projects')
                .select('id, client_id')
                .eq('id', projectId)
                .maybeSingle();

            if (project) {
                activeProjectId = project.id;
                activeClientId = project.client_id;
            } else {
                const { data: projectByClient } = await supabase
                    .from('NEW_Projects')
                    .select('id, client_id')
                    .eq('client_id', projectId)
                    .maybeSingle();

                if (projectByClient) {
                    activeProjectId = projectByClient.id;
                    activeClientId = projectByClient.client_id;
                } else {
                    const { data: clientCheck } = await supabase
                        .from('NEW_Clients')
                        .select('id, name')
                        .eq('id', projectId)
                        .maybeSingle();

                    if (!clientCheck) throw new Error('No se encontró el registro del proyecto ni del cliente asociado.');
                    activeClientId = clientCheck.id;

                    if (projectData.forceNewBudget || projectData.status) {
                        const { data: newProject, error: createProjectError } = await supabase
                            .from('NEW_Projects')
                            .insert({
                                client_id: activeClientId,
                                client_name: projectData.clientName || clientCheck.name,
                                status: projectData.status || 'prospect'
                            })
                            .select()
                            .single();

                        if (createProjectError) throw createProjectError;
                        activeProjectId = newProject.id;
                    }
                }
            }

            // 2. Update client
            const clientUpdateData: Record<string, string> = {};
            if (projectData.clientName) clientUpdateData.name = projectData.clientName;
            if (projectData.clientEmail) clientUpdateData.email = projectData.clientEmail;
            if (projectData.clientPhone) clientUpdateData.phone = projectData.clientPhone;
            if (projectData.clientDni) clientUpdateData.dni = projectData.clientDni;
            if (projectData.clientAddress) clientUpdateData.address = projectData.clientAddress;

            if (Object.keys(clientUpdateData).length > 0) {
                const { error: clientError } = await supabase.from('NEW_Clients').update(clientUpdateData).eq('id', activeClientId);
                if (clientError) throw clientError;
            }

            // 3. Billing
            const billingName = projectData.billingName || projectData.clientBillingName;
            if (billingName || projectData.billingType) {
                const billingData = {
                    client_id: activeClientId,
                    name: billingName,
                    email: projectData.billingEmail || projectData.clientBillingEmail,
                    phone: projectData.billingPhone || projectData.clientBillingPhone,
                    billing_address: projectData.billingAddress || projectData.clientBillingAddress,
                    nif: projectData.billingDni || projectData.otherPersonDni || projectData.clientBillingCompanyCif || projectData.clientDni,
                    type: projectData.billingType || 'personal'
                };

                const { data: existingBilling } = await supabase.from('NEW_Billing').select('id').eq('client_id', activeClientId).maybeSingle();

                if (existingBilling) {
                    await supabase.from('NEW_Billing').update(billingData).eq('id', existingBilling.id);
                } else {
                    await supabase.from('NEW_Billing').insert(billingData);
                }
            }

            // 4. Budget
            const hasBudgetChanges = projectData.vehicleModel || projectData.electricalSystem ||
                projectData.motorization || projectData.extraPacks || projectData.exteriorColor ||
                projectData.furnitureColor || projectData.discount !== undefined ||
                projectData.reservationAmount !== undefined || projectData.items || projectData.forceNewBudget;

            if (hasBudgetChanges && activeProjectId) {
                const { data: currentPrimary } = await supabase.from('NEW_Budget').select('*').eq('project_id', activeProjectId).eq('is_primary', true).maybeSingle();
                const opts = await fetchBudgetOptions();

                const currentModelName = opts.models?.find(m => m.id === currentPrimary?.model_option_id)?.name;
                const currentEngineName = opts.engines?.find(e => e.id === currentPrimary?.engine_option_id)?.name;
                const currentElectricName = opts.electricSystems?.find(es => es.id === currentPrimary?.electric_system_id)?.name;
                const currentPackName = opts.packs?.find(p => p.id === currentPrimary?.pack_id)?.name;

                const shouldCreateNewVersion = projectData.forceNewBudget || !currentPrimary;

                if (shouldCreateNewVersion) {
                    await supabase.from('NEW_Budget').update({ is_primary: false }).eq('project_id', activeProjectId);

                    const selectedModel = opts.models?.find(m => m.name === (projectData.vehicleModel || currentModelName));
                    const selectedEngine = opts.engines?.find(e => e.name === (projectData.motorization || currentEngineName));
                    const selectedElectric = opts.electricSystems?.find(es => es.name === (projectData.electricalSystem || currentElectricName));
                    const selectedPack = opts.packs?.find(p => p.name === (projectData.extraPacks || currentPackName));
                    const selectedExterior = opts.exteriorColors?.find(ec => ec.name === projectData.exteriorColor);
                    const selectedInterior = opts.interiorColors?.find(ic => ic.name === projectData.furnitureColor);

                    const calcData = {
                        vehicleModel: projectData.vehicleModel || currentModelName,
                        motorization: projectData.motorization || currentEngineName,
                        electricalSystem: projectData.electricalSystem || currentElectricName,
                        extraPacks: projectData.extraPacks || currentPackName,
                        discount: projectData.discount !== undefined ? projectData.discount : '0',
                        items: projectData.items || [],
                    };
                    const { total, subtotal, discountAmount, discountPercentage } = calculateFromOptions(opts, calcData);

                    const newBudgetData = {
                        project_id: activeProjectId,
                        client_id: activeClientId,
                        status: 'draft' as const,
                        is_primary: true,
                        model_option_id: findOptionId(opts.models, projectData.vehicleModel) || currentPrimary?.model_option_id || null,
                        engine_option_id: findOptionId(opts.engines, projectData.motorization) || currentPrimary?.engine_option_id || null,
                        interior_color_id: findOptionId(opts.interiorColors, projectData.furnitureColor) || currentPrimary?.interior_color_id || null,
                        pack_id: findOptionId(opts.packs, projectData.extraPacks) || currentPrimary?.pack_id || null,
                        electric_system_id: findOptionId(opts.electricSystems, projectData.electricalSystem) || currentPrimary?.electric_system_id || null,
                        total: Math.round(total * 100) / 100,
                        subtotal: Math.round(subtotal * 100) / 100,
                        discount_amount: isNaN(discountAmount) ? 0 : (discountAmount || 0),
                        created_by: user?.id || null,
                        base_price: Math.round(((selectedModel?.price_modifier || 0) + (selectedEngine?.price_modifier || 0)) * 100) / 100,
                        color_modifier: Math.round(((selectedExterior?.price_modifier || 0) + (selectedInterior?.price_modifier || 0)) * 100) / 100,
                        pack_price: Math.round((selectedPack?.price || 0) * 100) / 100,
                        electric_system_price: Math.round((selectedElectric?.price || 0) * 100) / 100,
                        reservation_amount: projectData.reservationAmount !== undefined ? safeFloat(projectData.reservationAmount) : (currentPrimary?.reservation_amount || 0),
                        discount_percentage: discountPercentage || (currentPrimary?.discount_percentage || 0),
                        notes: (projectData.projectNotes || projectData.budgetNotes || currentPrimary?.notes || '').trim()
                    };

                    const { data: createdBudget, error: createError } = await supabase.from('NEW_Budget').insert(newBudgetData).select().single();

                    if (createError) {
                        console.error('❌ Error creating new budget version:', createError);
                        toast({ title: "Error al crear nueva versión", description: createError.message, variant: "destructive" });
                        throw createError;
                    }

                    if (projectData.items && projectData.items.length > 0) {
                        const items = buildBudgetItems(createdBudget.id, projectData.items);
                        await supabase.from('NEW_Budget_Items').insert(items);
                    }

                } else if (currentPrimary) {
                    const selectedModel = opts.models?.find(m => m.id === (findOptionId(opts.models, projectData.vehicleModel) || currentPrimary.model_option_id));
                    const selectedEngine = opts.engines?.find(e => e.id === (findOptionId(opts.engines, projectData.motorization) || currentPrimary.engine_option_id));
                    const selectedElectric = opts.electricSystems?.find(es => es.id === (findOptionId(opts.electricSystems, projectData.electricalSystem) || currentPrimary.electric_system_id));
                    const selectedPack = opts.packs?.find(p => p.id === (findOptionId(opts.packs, projectData.extraPacks) || currentPrimary.pack_id));
                    const selectedExterior = opts.exteriorColors?.find(ec => ec.id === (findOptionId(opts.exteriorColors, projectData.exteriorColor) || currentPrimary.exterior_color_id));
                    const selectedInterior = opts.interiorColors?.find(ic => ic.id === (findOptionId(opts.interiorColors, projectData.furnitureColor) || currentPrimary.interior_color_id));

                    const calcData = {
                        vehicleModel: projectData.vehicleModel || selectedModel?.name,
                        motorization: projectData.motorization || selectedEngine?.name,
                        electricalSystem: projectData.electricalSystem || selectedElectric?.name,
                        extraPacks: projectData.extraPacks || selectedPack?.name,
                        discount: projectData.discount !== undefined ? projectData.discount : '0',
                        items: projectData.items || [],
                    };
                    const { total, subtotal, discountAmount, discountPercentage } = calculateFromOptions(opts, calcData);

                    const budgetUpdate: Record<string, unknown> = {
                        model_option_id: findOptionId(opts.models, projectData.vehicleModel) || currentPrimary.model_option_id,
                        engine_option_id: findOptionId(opts.engines, projectData.motorization) || currentPrimary.engine_option_id,
                        interior_color_id: findOptionId(opts.interiorColors, projectData.furnitureColor) || currentPrimary.interior_color_id,
                        pack_id: findOptionId(opts.packs, projectData.extraPacks) || currentPrimary.pack_id,
                        electric_system_id: findOptionId(opts.electricSystems, projectData.electricalSystem) || currentPrimary.electric_system_id,
                        total: Math.round(total * 100) / 100,
                        subtotal: Math.round(subtotal * 100) / 100,
                        discount_amount: isNaN(discountAmount) ? 0 : (discountAmount || 0),
                        base_price: Math.round(((selectedModel?.price_modifier || 0) + (selectedEngine?.price_modifier || 0)) * 100) / 100,
                        color_modifier: Math.round(((selectedExterior?.price_modifier || 0) + (selectedInterior?.price_modifier || 0)) * 100) / 100,
                        pack_price: Math.round((selectedPack?.price || 0) * 100) / 100,
                        electric_system_price: Math.round((selectedElectric?.price || 0) * 100) / 100,
                        reservation_amount: Math.round((projectData.reservationAmount !== undefined ? safeFloat(projectData.reservationAmount) : currentPrimary.reservation_amount) * 100) / 100,
                        discount_percentage: discountPercentage || (currentPrimary.discount_percentage || 0),
                        updated_at: new Date().toISOString()
                    };

                    if (projectData.projectNotes || projectData.budgetNotes) {
                        budgetUpdate.notes = (projectData.projectNotes || projectData.budgetNotes || '').trim();
                    }

                    const { error: updateError } = await supabase.from('NEW_Budget').update(budgetUpdate).eq('id', currentPrimary.id);

                    if (updateError) {
                        console.error('❌ Error updating budget:', updateError);
                        toast({ title: "Error al actualizar presupuesto", description: updateError.message, variant: "destructive" });
                        throw updateError;
                    }

                    if (projectData.items) {
                        await supabase.from('NEW_Budget_Items').delete().eq('budget_id', currentPrimary.id);
                        if (projectData.items.length > 0) {
                            const items = buildBudgetItems(currentPrimary.id, projectData.items);
                            await supabase.from('NEW_Budget_Items').insert(items);
                        }
                    }
                }
            }

            // 5. Update project
            const projectUpdate: Record<string, string> = {};
            if (projectData.comercial) projectUpdate.comercial = projectData.comercial;
            if (projectData.status) projectUpdate.status = projectData.status;

            if (Object.keys(projectUpdate).length > 0) {
                await supabase.from('NEW_Projects').update(projectUpdate).eq('id', activeProjectId);
            }

            queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
            queryClient.invalidateQueries({ queryKey: ['new-project', activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['unified-project', activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });

            toast({ title: "Lead actualizado", description: "La información se ha guardado correctamente." });
            return { success: true, projectId: activeProjectId };

        } catch (error) {
            console.error('❌ Error in updateProject:', error);
            const message = error instanceof Error ? error.message : 'No se han podido guardar los cambios.';
            toast({ title: "Error al actualizar", description: message, variant: "destructive" });
            throw error;
        }
    };

    return {
        data: projectsList.data,
        isLoading: projectsList.isLoading,
        error: projectsList.error,
        createProject,
        updateProject
    };
};
