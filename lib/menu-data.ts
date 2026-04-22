export interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

export interface MenuCategory {
  id: string;
  title: string;
  dishes: Dish[];
}

/** Carta Paco's Food — platos y precios según carta digital */
export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "bocadillos",
    title: "Bocadillos",
    dishes: [
      {
        id: "boc-tiras-pollo",
        name: "Bocadillo de tiras de pollo",
        description:
          "Pollo deshilachado, tomate natural, salsa ranchera y cebolla caramelizada.",
        price: "4,50 €",
        image: "/comida/casey-lee-awj7sRviVXo-unsplash.jpg",
      },
      {
        id: "boc-pollo-asado",
        name: "Bocadillo de pollo asado con patatas",
        description: "Pollo asado, guacamole, lechuga y cebolla morada.",
        price: "4,50 €",
        image: "/comida/jay-wennington-N_Y88TWmGwA-unsplash.jpg",
      },
    ],
  },
  {
    id: "serranitos",
    title: "Serranitos",
    dishes: [
      {
        id: "serranito-pollo",
        name: "Serranito de pollo",
        description: "Pollo, pimiento verde, jamón y huevo a la plancha.",
        price: "4,50 €",
        image: "/comida/edward-franklin-Nb_Q-M3Cdzg-unsplash.jpg",
      },
      {
        id: "serranito-lomo",
        name: "Serranito de lomo",
        description: "Lomo, pimiento verde, jamón y huevo a la plancha.",
        price: "4,50 €",
        image: "/comida/faisal-BS4Zeq7xDRk-unsplash.jpg",
      },
    ],
  },
  {
    id: "hamburguesas",
    title: "Hamburguesas",
    dishes: [
      {
        id: "hamb-simple",
        name: "Hamburguesa simple",
        description: "Carne y pan.",
        price: "3,50 €",
        image: "/comida/daniel-xfr0GzylA7I-unsplash.jpg",
      },
      {
        id: "hamb-pacos",
        name: "Hamburguesa de Paco's",
        description: "Carne, lechuga, cebolla morada, queso y bacon.",
        price: "4,50 €",
        image: "/comida/kristof-korody-dqbqj3mdFfA-unsplash.jpg",
      },
    ],
  },
  {
    id: "tortillas",
    title: "Tortillas",
    dishes: [
      {
        id: "tort-tradicional",
        name: "Tradicional",
        description: "Patatas y huevo.",
        price: "9 €",
        image: "/comida/jenn-kosar-jrWoDRmhwRY-unsplash.jpg",
      },
      {
        id: "tort-polonesa",
        name: "Polonesa",
        description: "Patatas, huevo y cebolla.",
        price: "10 €",
        image: "/comida/jenn-kosar-jrWoDRmhwRY-unsplash.jpg",
      },
      {
        id: "tort-huerta",
        name: "De la huerta",
        description: "Patatas, huevo, pimiento, cebolla y calabacín.",
        price: "12 €",
        image: "/comida/jenn-kosar-jrWoDRmhwRY-unsplash.jpg",
      },
      {
        id: "tort-brava",
        name: "Brava",
        description: "Patatas, huevo y chorizo.",
        price: "11 €",
        image: "/comida/jenn-kosar-jrWoDRmhwRY-unsplash.jpg",
      },
      {
        id: "tort-quesera",
        name: "Quesera",
        description: "Patatas, huevo y queso.",
        price: "11 €",
        image: "/comida/jenn-kosar-jrWoDRmhwRY-unsplash.jpg",
      },
    ],
  },
  {
    id: "entrantes",
    title: "Entrantes",
    dishes: [
      {
        id: "croquetas-kg",
        name: "Croquetas caseras",
        description:
          "Croquetas de puchero · Croquetas de merluza y gambas · Croquetas de rabo de toro.",
        price: "18 € / kg",
        image: "/comida/redd-francisco-o1SDSKCe8IE-unsplash.jpg",
      },
    ],
  },
];
