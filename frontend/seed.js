/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function seed() {
  console.log('Seeding Customers...');
  const { data: customer1, error: e1 } = await supabase.from('customers').insert({
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com'
  }).select().single();
  
  if (e1) console.error('Error C1:', e1);

  const { data: customer2, error: e2 } = await supabase.from('customers').insert({
    name: 'Anita Kumar',
    phone: '9988776655',
    email: 'anita@example.com'
  }).select().single();

  if (e2) console.error('Error C2:', e2);

  if (!customer1 || !customer2) {
    console.log("Failed to create customers");
    return;
  }

  console.log('Seeding Enquiries...');
  
  const { error: eq1 } = await supabase.from('enquiries').insert({
    customer_id: customer1.id,
    name: customer1.name,
    phone: customer1.phone,
    event_type: 'Wedding',
    event_date: '2026-12-15',
    guest_count: 500,
    status: 'NEW'
  });
  if (eq1) console.error('Error EQ1:', eq1);

  const { error: eq2 } = await supabase.from('enquiries').insert({
    customer_id: customer2.id,
    name: customer2.name,
    phone: customer2.phone,
    event_type: 'Birthday',
    event_date: '2026-10-20',
    guest_count: 50,
    status: 'CONTACTED'
  });
  if (eq2) console.error('Error EQ2:', eq2);

  console.log('Successfully added mock data!');
}

seed();
