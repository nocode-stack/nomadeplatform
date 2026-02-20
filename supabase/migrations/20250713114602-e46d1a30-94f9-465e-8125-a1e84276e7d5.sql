-- Create NEW_Budget_Items table
CREATE TABLE public."NEW_Budget_Items" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public."NEW_Budget_Structure"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  concept_id UUID REFERENCES public."NEW_Budget_Concepts"(id),
  pack_id UUID, -- Will reference budget packs when created
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_discount BOOLEAN NOT NULL DEFAULT false,
  discount_reason_id UUID, -- Will reference discount reasons when created
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public."NEW_Budget_Items" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budget items" 
ON public."NEW_Budget_Items" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budget items" 
ON public."NEW_Budget_Items" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget items" 
ON public."NEW_Budget_Items" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budget items" 
ON public."NEW_Budget_Items" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at column
CREATE TRIGGER trigger_update_new_budget_items_updated_at
BEFORE UPDATE ON public."NEW_Budget_Items"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_new_budget_items_budget_id ON public."NEW_Budget_Items"(budget_id);
CREATE INDEX idx_new_budget_items_concept_id ON public."NEW_Budget_Items"(concept_id);
CREATE INDEX idx_new_budget_items_pack_id ON public."NEW_Budget_Items"(pack_id);
CREATE INDEX idx_new_budget_items_order ON public."NEW_Budget_Items"(budget_id, order_index);
CREATE INDEX idx_new_budget_items_is_custom ON public."NEW_Budget_Items"(is_custom);
CREATE INDEX idx_new_budget_items_is_discount ON public."NEW_Budget_Items"(is_discount);