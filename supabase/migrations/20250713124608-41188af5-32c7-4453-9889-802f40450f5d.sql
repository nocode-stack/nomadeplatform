-- Hacer que budget_code no sea requerido para inserts ya que el trigger lo genera
ALTER TABLE public."NEW_Budget" 
ALTER COLUMN budget_code DROP NOT NULL;