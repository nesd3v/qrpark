
-- check_phone_exists is invoked during signup (anon context). It only returns boolean.
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO anon, authenticated;
