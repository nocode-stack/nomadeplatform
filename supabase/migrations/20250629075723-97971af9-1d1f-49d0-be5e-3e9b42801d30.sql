
-- Agregar política para permitir eliminar comentarios propios
CREATE POLICY "Users can delete their own comments" ON public.project_comments
FOR DELETE USING (auth.uid() = user_id);
