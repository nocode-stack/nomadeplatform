-- Crear configuraciones específicas para cada vehículo
-- Primero eliminar las configuraciones existentes para empezar limpio
DELETE FROM "NEW_Vehicles_Settings" WHERE id NOT IN (
  SELECT DISTINCT vehicle_settings_id FROM "NEW_Vehicles" WHERE vehicle_settings_id IS NOT NULL
);

-- Crear configuraciones únicas para cada vehículo con variedad realista
-- Vehículo VH_25_001 (db066f92-40ae-4759-8034-15e452eaa988)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('db066f92-40ae-4759-8034-15e452eaa988', 'Furgón 140cv Manual Gris L2H2', '140cv', 'Manual', 'Gris', 'L2H2', 35000, true, 1);

-- Vehículo VH_25_002 (916a0188-4368-443f-b50a-1dd58099138e)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('916a0188-4368-443f-b50a-1dd58099138e', 'Furgón 180cv Automática Blanca L3H2', '180cv', 'Automática', 'Blanca', 'L3H2', 42000, true, 2);

-- Vehículo VH_25_003 (4d37ac8e-523a-4c6e-9152-94224d9e8227)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('4d37ac8e-523a-4c6e-9152-94224d9e8227', 'Furgón 140cv Manual Blanca L2H2', '140cv', 'Manual', 'Blanca', 'L2H2', 36000, true, 3);

-- Vehículo VH_25_004 (0e867b59-0801-4d07-b0ec-479dac37f7f3)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('0e867b59-0801-4d07-b0ec-479dac37f7f3', 'Furgón 180cv Automática Gris L3H2', '180cv', 'Automática', 'Gris', 'L3H2', 43000, true, 4);

-- Vehículo VH_25_005 (3902c377-e690-457a-bfc1-84b42c43d498)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('3902c377-e690-457a-bfc1-84b42c43d498', 'Furgón 140cv Manual Gris L3H2', '140cv', 'Manual', 'Gris', 'L3H2', 37000, true, 5);

-- Vehículo VH_25_006 (5fc8375b-1a4d-4051-8701-7f9f8f2b0717)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('5fc8375b-1a4d-4051-8701-7f9f8f2b0717', 'Furgón 180cv Automática Blanca L2H2', '180cv', 'Automática', 'Blanca', 'L2H2', 41000, true, 6);

-- Vehículo VH_25_007 (dba2231e-232a-446d-8c15-8c193f389875)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('dba2231e-232a-446d-8c15-8c193f389875', 'Furgón 140cv Manual Blanca L3H2', '140cv', 'Manual', 'Blanca', 'L3H2', 38000, true, 7);

-- Vehículo VH_25_008 (da5cd413-6760-4958-9665-ac10ce3c1e2d)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('da5cd413-6760-4958-9665-ac10ce3c1e2d', 'Furgón 180cv Automática Gris L2H2', '180cv', 'Automática', 'Gris', 'L2H2', 40000, true, 8);

-- Vehículo VH_25_009 (802f3431-22e1-418e-aabd-e9a1f090d795)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('802f3431-22e1-418e-aabd-e9a1f090d795', 'Furgón 140cv Manual Gris L2H2', '140cv', 'Manual', 'Gris', 'L2H2', 35500, true, 9);

-- Vehículo VH_25_010 (751afaae-a00a-474f-9439-498ddcb3fdeb)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('751afaae-a00a-474f-9439-498ddcb3fdeb', 'Furgón 180cv Automática Blanca L3H2', '180cv', 'Automática', 'Blanca', 'L3H2', 42500, true, 10);

-- Vehículo VH_25_011 (b1e52d96-3a77-495f-8921-4378d5f81331)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('b1e52d96-3a77-495f-8921-4378d5f81331', 'Furgón 140cv Manual Blanca L2H2', '140cv', 'Manual', 'Blanca', 'L2H2', 36500, true, 11);

-- Vehículo VH_25_012 (b52bcb0a-1ac0-4523-8914-a1df350ff8b6)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('b52bcb0a-1ac0-4523-8914-a1df350ff8b6', 'Furgón 180cv Automática Gris L3H2', '180cv', 'Automática', 'Gris', 'L3H2', 43500, true, 12);

-- Vehículo VH_25_013 (8eb2b8d7-ab7b-4221-8d78-cfc047ffae75)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('8eb2b8d7-ab7b-4221-8d78-cfc047ffae75', 'Furgón 140cv Manual Gris L3H2', '140cv', 'Manual', 'Gris', 'L3H2', 37500, true, 13);

-- Vehículo VH_25_014 (25fca460-4452-40d5-ad9e-80cab3530f24)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('25fca460-4452-40d5-ad9e-80cab3530f24', 'Furgón 180cv Automática Blanca L2H2', '180cv', 'Automática', 'Blanca', 'L2H2', 41500, true, 14);

-- Vehículo VH_25_015 (cc77ba19-5ec6-47a7-982b-7a387ddb298c)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('cc77ba19-5ec6-47a7-982b-7a387ddb298c', 'Furgón 140cv Manual Blanca L3H2', '140cv', 'Manual', 'Blanca', 'L3H2', 38500, true, 15);

-- Vehículo VH_25_016 (faab3abe-9980-41c1-ab17-5651525a69f8)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('faab3abe-9980-41c1-ab17-5651525a69f8', 'Furgón 180cv Automática Gris L2H2', '180cv', 'Automática', 'Gris', 'L2H2', 40500, true, 16);

-- Vehículo VH_25_017 (37f66e68-181f-4292-9aa4-c6f6463af625)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('37f66e68-181f-4292-9aa4-c6f6463af625', 'Furgón 140cv Manual Gris L2H2', '140cv', 'Manual', 'Gris', 'L2H2', 35800, true, 17);

-- Vehículo VH_25_018 (7b1abe81-9141-4d7b-9520-b6cb7c268bcb)
INSERT INTO "NEW_Vehicles_Settings" (id, name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES ('7b1abe81-9141-4d7b-9520-b6cb7c268bcb', 'Furgón 180cv Automática Blanca L3H2', '180cv', 'Automática', 'Blanca', 'L3H2', 42800, true, 18);

-- Ahora asignar cada vehículo a su configuración específica usando el mismo ID
UPDATE "NEW_Vehicles" SET vehicle_settings_id = id;