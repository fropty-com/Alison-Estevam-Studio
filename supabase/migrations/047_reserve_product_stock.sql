-- Estoque de produto reservado no momento da criação do pedido (não só na
-- confirmação de pagamento), pra evitar overselling durante a janela de
-- checkout — mesmo raciocínio do redeem_coupon (022): UPDATE...RETURNING
-- atômico, condicionado ao estoque disponível, em vez de
-- read-then-write em código de aplicação (que teria uma corrida entre
-- dois pedidos concorrentes pela última unidade).

create or replace function reserve_product_stock(p_product_id uuid, p_quantity integer)
returns table (id uuid, stock_quantity integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update products
  set stock_quantity = products.stock_quantity - p_quantity,
      updated_at = now()
  where products.id = p_product_id
    and products.active
    and products.stock_quantity >= p_quantity
  returning products.id, products.stock_quantity;
end;
$$;

grant execute on function reserve_product_stock(uuid, integer) to service_role;

-- Contrapartida usada para devolver o estoque se o pedido for cancelado,
-- expirar sem pagamento, ou se um item posterior do mesmo pedido falhar ao
-- reservar (rollback dos itens já reservados).
create or replace function release_product_stock(p_product_id uuid, p_quantity integer)
returns void
language sql
security definer
set search_path = public
as $$
  update products set stock_quantity = stock_quantity + p_quantity, updated_at = now() where id = p_product_id;
$$;

grant execute on function release_product_stock(uuid, integer) to service_role;

revoke execute on function reserve_product_stock(uuid, integer) from public, anon, authenticated;
revoke execute on function release_product_stock(uuid, integer) from public, anon, authenticated;
