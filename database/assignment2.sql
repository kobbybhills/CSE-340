-- 1. Insert Tony Stark
INSERT INTO public.account (
        account_firstname,
        account_lastname,
        account_email,
        account_password
    )
VALUES (
        'Tony',
        'Stark',
        'tony@starkent.com',
        'Iam1ronM@n'
    );
-- 2. Update Tony Stark
UPDATE public.account
SET account_type = 'Admin'
WHERE account_email = 'tony@starkent.com';
-- 3. Delete Tony Stark
DELETE FROM public.account
WHERE account_email = 'tony@starkent.com';
-- 4. Replace "small interiors" with "a huge interior" in GM Hummer description
UPDATE public.inventory
SET inv_description = REPLACE(
        inv_description,
        'small interiors',
        'a huge interior'
    )
WHERE inv_make = 'GM'
    AND inv_model = 'Hummer';
-- 5. Join query: get make, model, and classification name for Sport category
SELECT i.inv_make,
    i.inv_model,
    c.classification_name
FROM public.inventory i
    INNER JOIN public.classification c ON i.classification_id = c.classification_id
WHERE c.classification_name = 'Sport';
-- 6. Update image and thumbnail paths to include "/vehicles"
UPDATE public.inventory
SET inv_image = REPLACE(inv_image, '/images/', '/image/vehicles/'),
    inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');