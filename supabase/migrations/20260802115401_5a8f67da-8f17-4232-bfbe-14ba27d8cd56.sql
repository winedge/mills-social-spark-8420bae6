
insert into public.menu_categories (name, slug, parent_id, sort_order, active) values
 ('$6 Food','hh-6-food','7df4d9c1-82db-43c6-a18e-f81bbced2dfb',1,true),
 ('$6 Drinks','hh-6-drinks','7df4d9c1-82db-43c6-a18e-f81bbced2dfb',2,true),
 ('$9 Food','hh-9-food','7df4d9c1-82db-43c6-a18e-f81bbced2dfb',3,true),
 ('$9 Drinks','hh-9-drinks','7df4d9c1-82db-43c6-a18e-f81bbced2dfb',4,true),
 ('$12 Food','hh-12-food','7df4d9c1-82db-43c6-a18e-f81bbced2dfb',5,true),
 ('$12 Drinks','hh-12-drinks','7df4d9c1-82db-43c6-a18e-f81bbced2dfb',6,true);

update public.menu_items i set category_id = c.id, category = c.name
from public.menu_categories c
where c.slug = 'hh-6-drinks' and i.id in (
 '8b724bd7-efbb-4368-a8e1-9356877dffb7','092f945d-69f1-4220-b905-673bc6162a87',
 'ed5f493e-e487-4788-8067-fb1f7338fa64','669eb54e-8270-40ff-bcd6-e1694e9b6229');

update public.menu_items i set category_id = c.id, category = c.name
from public.menu_categories c
where c.slug = 'hh-6-food' and i.category_id = 'c10f2ce8-bafb-4422-97fa-d24ef259d6b7';

update public.menu_items i set category_id = c.id, category = c.name
from public.menu_categories c
where c.slug = 'hh-9-drinks' and i.id in (
 'a5f01cac-a665-4e7b-ba57-013080509ac4','e15afc4f-98d4-408d-8e61-58f770220d90',
 'fe4ec76e-4369-4ce0-8772-7ffccf44de48','7752b823-8830-48bf-bf1a-c120b8125216',
 'f310c159-e4b1-4e4f-8c7f-6b6b2a174473');

update public.menu_items i set category_id = c.id, category = c.name
from public.menu_categories c
where c.slug = 'hh-9-food' and i.category_id = '8e778956-94a4-4748-b807-44dde096f20e';

update public.menu_items i set category_id = c.id, category = c.name
from public.menu_categories c
where c.slug = 'hh-12-drinks' and i.id in (
 '46a6f0f0-0803-4b35-8d11-0f9a2eb22f28','85709865-1291-46ce-ba10-407088a8eb42',
 '5a7a6158-b21e-437b-b5bb-1d7814b3346d','f466a36b-23e3-4b2e-b680-a39be4b0cf49',
 '8e6da9cf-a89b-4fa3-a70e-c61f1d3dae34');

update public.menu_items i set category_id = c.id, category = c.name
from public.menu_categories c
where c.slug = 'hh-12-food' and i.category_id = '8a2faf4c-399b-4ea3-a045-713c5b6e28c1';

delete from public.menu_categories where slug in ('hh-6','hh-9','hh-12');
