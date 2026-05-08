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
    country: "Espana",
    timezone: "Europe/Madrid",
    deposit_amount: 1800,
    refund_window_hours: 48,
    comida_start: "13:00",
    comida_end: "16:00",
    cena_start: "20:30",
    cena_end: "23:30",
    slot_interval_minutes: 15,
    tagline: "Taberna castiza de producto y sobremesa larga",
    storyTitle: "Madrid clasico con mesa viva.",
    heroTitle1: "Castizo,",
    heroTitle2: "sin teatro.",
    menu: [
      ["Entrantes", "Huevos rotos", "Patata confitada y jamon iberico", 2200],
      ["Entrantes", "Callos a la madrilena", "Receta lenta y potente", 1850],
      ["Principales", "Rabo de toro", "Glaseado con pure de patata ahumada", 2850],
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
    country: "Espana",
    timezone: "Europe/Madrid",
    deposit_amount: 3200,
    refund_window_hours: 72,
    comida_start: "13:15",
    comida_end: "15:15",
    cena_start: "20:00",
    cena_end: "22:30",
    slot_interval_minutes: 15,
    tagline: "Menu creativo con servicio de precision",
    storyTitle: "Cocina experimental con ritmo limpio.",
    heroTitle1: "Creativo,",
    heroTitle2: "sin ruido.",
    menu: [
      ["Snacks", "Air baguette", "Mantequilla ahumada y caviar citrico", 1400],
      ["Snacks", "Pesto multiesferico", "Albahaca fresca y pinones", 1650],
      ["Degustacion", "Arroz de plancton", "Caldo marino y hierbas", 2950],
      ["Degustacion", "Lubina madurada", "Fondo de coliflor tostada", 3380],
      ["Postres", "Cacao, aceite y sal", "Texturas templadas", 1250],
    ],
  },
  {
    slug: "aponiente-demo",
    name: "Aponiente Demo",
    email: "reservas@aponiente-demo.local",
    phone: "+34 956 851 870",
    address: "Molino de Mareas, El Puerto de Santa Maria",
    city: "Cadiz",
    country: "Espana",
    timezone: "Europe/Madrid",
    deposit_amount: 2800,
    refund_window_hours: 72,
    comida_start: "13:30",
    comida_end: "15:30",
    cena_start: "20:00",
    cena_end: "22:15",
    slot_interval_minutes: 15,
    tagline: "Mar, tecnica y producto atlantico",
    storyTitle: "Atlantico profundo en clave contemporanea.",
    heroTitle1: "Marino,",
    heroTitle2: "sin cliche.",
    menu: [
      ["Mar", "Ostra templada", "Escabeche fino y hoja salina", 1550],
      ["Mar", "Embutido marino", "Curacion especiada con pan crujiente", 1720],
      ["Principales", "Arroz de estero", "Fondo yodado y crustaceos", 3120],
      ["Principales", "Pescado de descarte noble", "Brasa suave y pilpil", 3270],
      ["Postres", "Citricos y algas", "Fresco, amargo y salino", 1180],
    ],
  },
];

function addDays(days, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function toDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:00`;
}

function slugify(input) {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCustomerDataset(city, slug, index) {
  const names = [
    `Lucia ${city}`,
    `Diego ${city}`,
    `Marta ${city}`,
    `Carlos ${city}`,
    `Elena ${city}`,
    `Javier ${city}`,
    `Paula ${city}`,
    `Alvaro ${city}`,
  ];

  const plans = [
    [
      { days: -14, hour: 14, minute: 0, guests: 2, zone: "Sala principal", status: "completed", meal_type: "comida", deposit_paid: true, notes: "Aniversario. Mesa tranquila." },
      { days: 0, hour: 14, minute: 15, guests: 2, zone: "Sala principal", status: "confirmed", meal_type: "comida", deposit_paid: true, notes: "Cliente habitual. Confirmada hoy." },
      { days: 7, hour: 21, minute: 0, guests: 4, zone: "Privado", status: "pending", meal_type: "cena", deposit_paid: false, notes: "Cena familiar pendiente." },
    ],
    [
      { days: -9, hour: 21, minute: 15, guests: 4, zone: "Terraza", status: "completed", meal_type: "cena", deposit_paid: true, notes: "Cumpleanos. Botella de vino." },
      { days: 3, hour: 20, minute: 45, guests: 4, zone: "Terraza", status: "pending", meal_type: "cena", deposit_paid: false, notes: "Pendiente de senal." },
    ],
    [
      { days: -5, hour: 13, minute: 45, guests: 3, zone: "Sala principal", status: "completed", meal_type: "comida", deposit_paid: true, notes: "Comida de trabajo." },
      { days: 6, hour: 14, minute: 0, guests: 3, zone: "Sala principal", status: "confirmed", meal_type: "comida", deposit_paid: true, notes: "Sin gluten." },
    ],
    [
      { days: -3, hour: 20, minute: 30, guests: 2, zone: "Barra", status: "completed", meal_type: "cena", deposit_paid: true, notes: "Prefieren barra." },
      { days: 1, hour: 21, minute: 30, guests: 2, zone: "Barra", status: "confirmed", meal_type: "cena", deposit_paid: true, notes: "Reserva para manana." },
    ],
    [
      { days: -1, hour: 14, minute: 30, guests: 6, zone: "Privado", status: "cancelled", meal_type: "comida", deposit_paid: false, notes: "Cancelada por el cliente." },
      { days: 9, hour: 14, minute: 15, guests: 6, zone: "Privado", status: "pending", meal_type: "comida", deposit_paid: false, notes: "Grupo pendiente de confirmacion." },
    ],
    [
      { days: -20, hour: 21, minute: 0, guests: 5, zone: "Terraza", status: "completed", meal_type: "cena", deposit_paid: true, notes: "Mesa redonda amplia." },
      { days: 4, hour: 21, minute: 15, guests: 5, zone: "Terraza", status: "confirmed", meal_type: "cena", deposit_paid: true, notes: "Volveran con amigos." },
    ],
    [
      { days: -7, hour: 13, minute: 30, guests: 2, zone: "Sala principal", status: "completed", meal_type: "comida", deposit_paid: true, notes: "Primera visita." },
      { days: 2, hour: 13, minute: 45, guests: 2, zone: "Sala principal", status: "confirmed", meal_type: "comida", deposit_paid: true, notes: "Quiere repetir el menu." },
    ],
    [
      { days: -11, hour: 20, minute: 45, guests: 8, zone: "Privado", status: "completed", meal_type: "cena", deposit_paid: true, notes: "Cena de empresa." },
      { days: 5, hour: 20, minute: 30, guests: 8, zone: "Privado", status: "pending", meal_type: "cena", deposit_paid: false, notes: "Evento corporativo pendiente." },
    ],
  ];

  return names.map((name, i) => ({
    name,
    email: `${slugify(name.split(" ")[0])}${i + 1}+${slug}@tenant-demo.local`,
    phone: `+34 610 ${index}${String(i + 1).padStart(2, "0")} ${String(i + 1).repeat(3)}`,
    reservations: plans[i],
  }));
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
    { email: `admin+${tenant.slug}@tenant-demo.local`, name: `Admin ${tenant.city}`, role: "admin" },
    { email: `manager+${tenant.slug}@tenant-demo.local`, name: `Manager ${tenant.city}`, role: "manager" },
    { email: `staff+${tenant.slug}@tenant-demo.local`, name: `Staff ${tenant.city}`, role: "staff" },
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

  for (const [name, capacity] of [
    ["Barra", 8],
    ["Sala principal", 24],
    ["Terraza", 18],
    ["Privado", 10],
  ]) {
    const { error } = await supabase.from("tables").upsert(
      { restaurant_id: restaurantId, name, capacity },
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
    ["global", { brand_name: tenant.name, tagline: tenant.tagline, location_short: locationShort }],
    ["home.hero", {
      eyebrow_tagline: [tenant.city, "2026", "Demo"],
      title_line_1: tenant.heroTitle1,
      title_line_2: tenant.heroTitle2,
      subtitle: `${tenant.tagline}. Reserva online, prueba la carta y accede a un panel aislado para ${tenant.name}.`,
      rating_label: "Demo · Fluido",
      sticker_line_1: tenant.city,
      sticker_line_2: "live",
    }],
    ["home.story", {
      title: tenant.storyTitle,
      quote: `${tenant.name} funciona aqui como tenant independiente: contenido, equipo, reservas y clientes viven aislados del resto.`,
    }],
    ["home.location", {
      title: `Direccion de ${tenant.name}.`,
      address: tenant.address,
      city: `${tenant.city}, ${tenant.country}`,
      phone: tenant.phone,
      email: tenant.email,
      map_query: `${tenant.address}, ${tenant.city}, ${tenant.country}`,
    }],
    ["contacto", {
      phone: tenant.phone,
      email: tenant.email,
      whatsapp: tenant.phone,
      address: `${tenant.address}, ${tenant.city}, ${tenant.country}`,
    }],
    ["footer", {
      big_logo: tenant.name.toUpperCase(),
      copyright: `© ${tenant.name} · ${tenant.city}`,
      marquee_words: [tenant.city, tenant.tagline, "Reservas", "Carta", "Dashboard"],
    }],
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

  const customerSpecs = buildCustomerDataset(tenant.city, tenant.slug, index);

  const customerIds = [];
  for (const customerSpec of customerSpecs) {
    const userId = await ensureAuthUser(
      customerSpec.email,
      DEFAULT_PASSWORD,
      customerSpec.name
    );

    const { data: existingCustomer, error: existingCustomerError } = await supabase
      .from("customers")
      .select("id, email")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingCustomerError) throw existingCustomerError;

    let customer = existingCustomer;
    if (existingCustomer?.id) {
      const { data: updatedCustomer, error } = await supabase
        .from("customers")
        .update({
          name: customerSpec.name,
          email: customerSpec.email,
          phone: customerSpec.phone,
          marketing_opt_in: true,
          marketing_channel_email: true,
          marketing_channel_whatsapp: true,
          privacy_accepted_at: new Date().toISOString(),
        })
        .eq("id", existingCustomer.id)
        .select("id, email")
        .single();
      if (error) throw error;
      customer = updatedCustomer;
    } else {
      const { data: insertedCustomer, error } = await supabase
        .from("customers")
        .insert({
          restaurant_id: restaurantId,
          user_id: userId,
          name: customerSpec.name,
          email: customerSpec.email,
          phone: customerSpec.phone,
          marketing_opt_in: true,
          marketing_channel_email: true,
          marketing_channel_whatsapp: true,
          privacy_accepted_at: new Date().toISOString(),
        })
        .select("id, email")
        .single();
      if (error) throw error;
      customer = insertedCustomer;
    }
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
    for (const reservation of customer.reservations) {
      const table =
        tables.find((row) => row.name === reservation.zone) ?? tables[0];
      const when = addDays(reservation.days, reservation.hour, reservation.minute);
      const { error } = await supabase.from("reservations").insert({
        restaurant_id: restaurantId,
        customer_id: customer.id,
        table_id: table?.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        guests: reservation.guests,
        reservation_date: toDate(when),
        reservation_time: toTime(when),
        status: reservation.status,
        meal_type: reservation.meal_type,
        deposit_paid: reservation.deposit_paid,
        deposit_amount: reservation.deposit_paid
          ? tenant.deposit_amount * reservation.guests
          : 0,
        notes: reservation.notes,
      });
      if (error) throw error;
    }
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
  console.log(`  clientes: 8 cuentas demo para ${tenant.slug}`);
}
