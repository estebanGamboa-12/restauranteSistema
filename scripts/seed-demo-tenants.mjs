import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEFAULT_PASSWORD = "12341234";

const TENANTS = [
  {
    slug: "casa-lucio-demo",
    name: "Casa Lucio Demo",
    email: "reservas@casalucio-demo.local",
    phone: "+34 913 658 217",
    address: "Cava Baja, 35",
    city: "Madrid",
    country: "España",
    timezone: "Europe/Madrid",
    deposit_amount: 1800,
    refund_window_hours: 48,
    comida_start: "13:00",
    comida_end: "16:00",
    cena_start: "20:30",
    cena_end: "23:30",
    slot_interval_minutes: 15,
    tagline: "Taberna castiza de producto y sobremesa larga",
    storyTitle: "Madrid clásico con mesa viva.",
    heroTitle1: "Castizo,",
    heroTitle2: "sin teatro.",
    menu: [
      ["Entrantes", "Huevos rotos", "Patata confitada y jamón ibérico", 2200],
      ["Entrantes", "Callos a la madrileña", "Receta lenta y potente", 1850],
      ["Principales", "Rabo de toro", "Glaseado con puré de patata ahumada", 2850],
      ["Principales", "Merluza en salsa verde", "Con almejas y perejil fresco", 2680],
      ["Postres", "Torrija caramelizada", "Crema ligera y canela", 980],
    ],
  },
  {
    slug: "disfrutar-demo",
    name: "Disfrutar Demo",
    email: "hello@disfrutar-demo.local",
    phone: "+34 933 486 896",
    address: "Carrer de Villarroel, 163",
    city: "Barcelona",
    country: "España",
    timezone: "Europe/Madrid",
    deposit_amount: 3200,
    refund_window_hours: 72,
    comida_start: "13:15",
    comida_end: "15:15",
    cena_start: "20:00",
    cena_end: "22:30",
    slot_interval_minutes: 15,
    tagline: "Menú creativo con servicio de precisión",
    storyTitle: "Cocina experimental con ritmo limpio.",
    heroTitle1: "Creativo,",
    heroTitle2: "sin ruido.",
    menu: [
      ["Snacks", "Air baguette", "Mantequilla ahumada y caviar cítrico", 1400],
      ["Snacks", "Pesto multiesférico", "Albahaca fresca y piñones", 1650],
      ["Degustación", "Arroz de plancton", "Caldo marino y hierbas", 2950],
      ["Degustación", "Lubina madurada", "Fondo de coliflor tostada", 3380],
      ["Postres", "Cacao, aceite y sal", "Texturas templadas", 1250],
    ],
  },
  {
    slug: "aponiente-demo",
    name: "Aponiente Demo",
    email: "reservas@aponiente-demo.local",
    phone: "+34 956 851 870",
    address: "Molino de Mareas, El Puerto de Santa María",
    city: "Cádiz",
    country: "España",
    timezone: "Europe/Madrid",
    deposit_amount: 2800,
    refund_window_hours: 72,
    comida_start: "13:30",
    comida_end: "15:30",
    cena_start: "20:00",
    cena_end: "22:15",
    slot_interval_minutes: 15,
    tagline: "Mar, técnica y producto atlántico",
    storyTitle: "Atlántico profundo en clave contemporánea.",
    heroTitle1: "Marino,",
    heroTitle2: "sin cliché.",
    menu: [
      ["Mar", "Ostra templada", "Escabeche fino y hoja salina", 1550],
      ["Mar", "Embutido marino", "Curación especiada con pan crujiente", 1720],
      ["Principales", "Arroz de estero", "Fondo yodado y crustáceos", 3120],
      ["Principales", "Pescado de descarte noble", "Brasa suave y pilpil", 3270],
      ["Postres", "Cítricos y algas", "Fresco, amargo y salino", 1180],
    ],
  },
];

function addDays(days, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function isoTime(date) {
  return date.toISOString().slice(11, 19);
}

async function listUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    users.push(...(data?.users ?? []));
    if (!data?.users?.length || data.users.length < 200) break;
    page += 1;
  }
  return users;
}

const allUsers = await listUsers();

async function ensureAuthUser(email, password, name) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = allUsers.find(
    (user) => (user.email ?? "").toLowerCase() === normalizedEmail
  );

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        name,
        full_name: name,
      },
    });
    if (error) throw error;
    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      full_name: name,
    },
  });
  if (error) throw error;
  if (data.user) allUsers.push(data.user);
  return data.user.id;
}

async function seedRestaurant(tenant, index) {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .upsert(
      {
        slug: tenant.slug,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        city: tenant.city,
        country: tenant.country,
        timezone: tenant.timezone,
        deposit_amount: tenant.deposit_amount,
        refund_window_hours: tenant.refund_window_hours,
        comida_start: tenant.comida_start,
        comida_end: tenant.comida_end,
        cena_start: tenant.cena_start,
        cena_end: tenant.cena_end,
        slot_interval_minutes: tenant.slot_interval_minutes,
      },
      { onConflict: "slug" }
    )
    .select("id, slug, name")
    .single();

  if (restaurantError) throw restaurantError;
  const restaurantId = restaurant.id;

  const staffUsers = [
    {
      email: `admin+${tenant.slug}@tenant-demo.local`,
      name: `Admin ${tenant.city}`,
      role: "admin",
    },
    {
      email: `manager+${tenant.slug}@tenant-demo.local`,
      name: `Manager ${tenant.city}`,
      role: "manager",
    },
    {
      email: `staff+${tenant.slug}@tenant-demo.local`,
      name: `Staff ${tenant.city}`,
      role: "staff",
    },
  ];

  for (const staff of staffUsers) {
    const userId = await ensureAuthUser(staff.email, DEFAULT_PASSWORD, staff.name);
    const { error } = await supabase.from("restaurant_staff").upsert(
      {
        restaurant_id: restaurantId,
        user_id: userId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
      { onConflict: "restaurant_id,user_id" }
    );
    if (error) throw error;
  }

  const zones = [
    ["Barra", 8],
    ["Sala principal", 24],
    ["Terraza", 18],
    ["Privado", 10],
  ];

  for (const [name, capacity] of zones) {
    const { error } = await supabase.from("tables").upsert(
      {
        restaurant_id: restaurantId,
        name,
        capacity,
      },
      { onConflict: "restaurant_id,name" }
    );
    if (error) throw error;
  }

  const { error: clearMenuError } = await supabase
    .from("menu_items")
    .delete()
    .eq("restaurant_id", restaurantId);
  if (clearMenuError) throw clearMenuError;

  for (const [sortOrder, item] of tenant.menu.entries()) {
    const [section, name, description, price] = item;
    const { error } = await supabase.from("menu_items").insert({
      restaurant_id: restaurantId,
      section,
      name,
      description,
      price_cents: price,
      available: true,
      sort_order: sortOrder,
    });
    if (error) throw error;
  }

  const locationShort = `${tenant.city} · ${tenant.country}`;
  const siteContentRows = [
    [
      "global",
      {
        brand_name: tenant.name,
        tagline: tenant.tagline,
        location_short: locationShort,
      },
    ],
    [
      "home.hero",
      {
        eyebrow_tagline: [tenant.city, "2026", "Demo"],
        title_line_1: tenant.heroTitle1,
        title_line_2: tenant.heroTitle2,
        subtitle: `${tenant.tagline}. Reserva online, prueba la carta y accede a un panel aislado para ${tenant.name}.`,
        rating_label: "Demo · Fluido",
        sticker_line_1: tenant.city,
        sticker_line_2: "live",
      },
    ],
    [
      "home.story",
      {
        title: tenant.storyTitle,
        quote: `${tenant.name} funciona aquí como tenant independiente: contenido, equipo, reservas y clientes viven aislados del resto.`,
      },
    ],
    [
      "home.location",
      {
        title: `Dirección de ${tenant.name}.`,
        address: tenant.address,
        city: `${tenant.city}, ${tenant.country}`,
        phone: tenant.phone,
        email: tenant.email,
        map_query: `${tenant.address}, ${tenant.city}, ${tenant.country}`,
      },
    ],
    [
      "contacto",
      {
        phone: tenant.phone,
        email: tenant.email,
        whatsapp: tenant.phone,
        address: `${tenant.address}, ${tenant.city}, ${tenant.country}`,
      },
    ],
    [
      "footer",
      {
        big_logo: tenant.name.toUpperCase(),
        copyright: `© ${tenant.name} · ${tenant.city}`,
        marquee_words: [tenant.city, tenant.tagline, "Reservas", "Carta", "Dashboard"],
      },
    ],
  ];

  for (const [section_key, content] of siteContentRows) {
    const { error } = await supabase.from("site_content").upsert(
      {
        restaurant_id: restaurantId,
        section_key,
        content,
      },
      { onConflict: "restaurant_id,section_key" }
    );
    if (error) throw error;
  }

  const customerSpecs = [
    {
      email: `cliente1+${tenant.slug}@tenant-demo.local`,
      name: `Lucía ${tenant.city}`,
      phone: `+34 600 10${index}101`,
      days: 2,
      hour: 13,
      minute: 30,
      guests: 2,
      zone: "Sala principal",
      status: "confirmed",
      meal_type: "comida",
      deposit_paid: true,
    },
    {
      email: `cliente2+${tenant.slug}@tenant-demo.local`,
      name: `Diego ${tenant.city}`,
      phone: `+34 600 10${index}202`,
      days: 3,
      hour: 21,
      minute: 0,
      guests: 4,
      zone: "Terraza",
      status: "pending",
      meal_type: "cena",
      deposit_paid: false,
    },
  ];

  const customerIds = [];
  for (const customerSpec of customerSpecs) {
    const userId = await ensureAuthUser(
      customerSpec.email,
      DEFAULT_PASSWORD,
      customerSpec.name
    );

    const { data: customer, error } = await supabase
      .from("customers")
      .upsert(
        {
          restaurant_id: restaurantId,
          user_id: userId,
          name: customerSpec.name,
          email: customerSpec.email,
          phone: customerSpec.phone,
          marketing_opt_in: true,
          marketing_channel_email: true,
          marketing_channel_whatsapp: true,
          privacy_accepted_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id,user_id" }
      )
      .select("id, email")
      .single();
    if (error) throw error;
    customerIds.push({ ...customerSpec, id: customer.id, userId });
  }

  const customerEmails = customerIds.map((customer) => customer.email);
  const { error: clearReservationsError } = await supabase
    .from("reservations")
    .delete()
    .eq("restaurant_id", restaurantId)
    .in("customer_email", customerEmails);
  if (clearReservationsError) throw clearReservationsError;

  const { data: tables, error: tablesError } = await supabase
    .from("tables")
    .select("id, name")
    .eq("restaurant_id", restaurantId);
  if (tablesError) throw tablesError;

  for (const customer of customerIds) {
    const table = tables.find((row) => row.name === customer.zone) ?? tables[0];
    const when = addDays(customer.days, customer.hour, customer.minute);
    const { error } = await supabase.from("reservations").insert({
      restaurant_id: restaurantId,
      customer_id: customer.id,
      table_id: table?.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      guests: customer.guests,
      reservation_date: isoDate(when),
      reservation_time: isoTime(when),
      status: customer.status,
      meal_type: customer.meal_type,
      deposit_paid: customer.deposit_paid,
      deposit_amount: tenant.deposit_amount * customer.guests,
      notes: `Reserva demo para ${tenant.name}`,
    });
    if (error) throw error;
  }

  console.log(`OK · ${tenant.name} (${tenant.slug})`);
}

for (const [index, tenant] of TENANTS.entries()) {
  await seedRestaurant(tenant, index + 1);
}

console.log("");
console.log("Credenciales demo comunes:");
console.log(`Password: ${DEFAULT_PASSWORD}`);
for (const tenant of TENANTS) {
  console.log(`- ${tenant.name}`);
  console.log(`  admin: admin+${tenant.slug}@tenant-demo.local`);
  console.log(`  manager: manager+${tenant.slug}@tenant-demo.local`);
  console.log(`  staff: staff+${tenant.slug}@tenant-demo.local`);
  console.log(`  clientes: cliente1+${tenant.slug}@tenant-demo.local / cliente2+${tenant.slug}@tenant-demo.local`);
}
