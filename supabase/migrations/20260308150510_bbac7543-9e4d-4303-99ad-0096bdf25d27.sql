ALTER TABLE public.profiles ADD COLUMN language text NOT NULL DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN is_premium boolean NOT NULL DEFAULT false;