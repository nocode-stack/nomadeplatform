-- Create function to update project status based on phase completion
CREATE OR REPLACE FUNCTION public.update_project_status_based_on_phases()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  completed_phases TEXT[];
  project_status TEXT;
  total_phases INTEGER;
  completed_count INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Get completed phase groups
  SELECT ARRAY_AGG(DISTINCT pt."group")
  INTO completed_phases
  FROM public."NEW_Project_Phase_Progress" ppp
  JOIN public."NEW_Project_Phase_Template" pt ON ppp.phase_template_id = pt.id
  WHERE ppp.project_id = COALESCE(NEW.project_id, OLD.project_id) 
    AND ppp.status = 'completed';
  
  -- Calculate progress percentage
  SELECT COUNT(*) INTO total_phases
  FROM public."NEW_Project_Phase_Progress" ppp
  WHERE ppp.project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  SELECT COUNT(*) INTO completed_count
  FROM public."NEW_Project_Phase_Progress" ppp
  WHERE ppp.project_id = COALESCE(NEW.project_id, OLD.project_id) 
    AND ppp.status = 'completed';
  
  IF total_phases > 0 THEN
    progress_percentage := ROUND((completed_count::DECIMAL / total_phases::DECIMAL) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Determine project status based on completed phase groups
  IF 'delivered' = ANY(completed_phases) THEN
    project_status := 'delivered';
  ELSIF 'pre_delivery' = ANY(completed_phases) THEN
    project_status := 'pre_delivery';
  ELSIF 'reworks' = ANY(completed_phases) THEN
    project_status := 'reworks';
  ELSIF 'production' = ANY(completed_phases) THEN
    project_status := 'production';
  ELSIF 'pre_production' = ANY(completed_phases) THEN
    project_status := 'pre_production';
  ELSE
    project_status := 'prospect';
  END IF;
  
  -- Update project status
  UPDATE public."NEW_Projects" 
  SET 
    status = project_status,
    updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger on phase progress changes
CREATE TRIGGER update_project_status_on_phase_change
  AFTER INSERT OR UPDATE OR DELETE ON public."NEW_Project_Phase_Progress"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_status_based_on_phases();

-- Enable realtime for relevant tables
ALTER TABLE public."NEW_Project_Phase_Progress" REPLICA IDENTITY FULL;
ALTER TABLE public."NEW_Projects" REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public."NEW_Project_Phase_Progress";
ALTER PUBLICATION supabase_realtime ADD TABLE public."NEW_Projects";