-- Create authorized_users table
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'active'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view
CREATE POLICY "Anyone authenticated can view authorized users"
    ON public.authorized_users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policy for admin/direction to manage
CREATE POLICY "Direction and admin can manage authorized users"
    ON public.authorized_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND (user_profiles.department = 'Dirección' OR user_profiles.department = 'Administración')
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_authorized_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_authorized_users_updated
    BEFORE UPDATE ON public.authorized_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_authorized_users_updated_at();

-- Insert initial users from PREDEFINED_USERS to ensure they are available in the table too
-- (but we still fallback to the constant in code for extra safety)
INSERT INTO public.authorized_users (email, name, department, role, status)
VALUES 
    ('ejaen@nomade-nation.com', 'Enrique Jaén', 'Operaciones', 'production_director', 'active'),
    ('mescude@nomade-nation.com', 'Marc Escudé', 'Dirección', 'cfo', 'active'),
    ('elizza@nomade-nation.com', 'Elena Lizza', 'Customer Experience', 'customer_director', 'active'),
    ('iribo@nomade-nation.com', 'Ignasi Ribó', 'Dirección', 'ceo', 'active'),
    ('amirallas@nomade-nation.com', 'Arnau Mirallas', 'Ventas', 'commercial', 'active'),
    ('youssef@nomade-nation.com', 'Youssef', 'Ventas', 'commercial', 'active'),
    ('msanz@nomade-nation.com', 'Marina Sanz', 'Marketing', 'marketing_director', 'active')
ON CONFLICT (email) DO NOTHING;
