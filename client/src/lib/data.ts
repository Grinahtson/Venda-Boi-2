import novilhaImg from "@assets/novilha_1765070356896.png";
import bezerraImg from "@assets/bezerra_1765070356895.webp";
import bezerroImg from "@assets/bezerro_1765070356895.webp";
import garrotesImg from "@assets/Garrotes_1765070356894.jpg";
import vacaGordaImg from "@assets/vaca_gorda_1765070356895.webp";
import vacaMagraImg from "@assets/Vaca_magra_1765070356892.webp";
import touroImg from "@assets/Touros_1765070356894.jfif";
import boiGordoImg from "@assets/Boi_gordo_1765070356893.jfif";

// Types
export interface Animal {
  id: string;
  title: string;
  category: "Novilhas" | "Bezerras" | "Bezerros" | "Garrotes" | "Vacas gordas" | "Vacas magras" | "Touros" | string;
  breed: string;
  weight: number; // in kg
  quantity: number;
  pricePerHead: number;
  pricePerArroba?: number;
  location: {
    city: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  seller: {
    id: string;
    name: string;
    rating?: number;
    phone?: string;
    verified?: boolean;
  };
  image: string;
  images?: string[];
  description?: string;
  datePosted?: string;
  createdAt?: string;
  featured?: boolean;
}

export interface Quote {
  state: string;
  priceArroba: number;
  trend: "up" | "down" | "stable";
  lastUpdate: string;
}

// Mock Data

export const categories = [
  { id: "novilhas", name: "Novilhas", image: novilhaImg },
  { id: "bezerras", name: "Bezerras", image: bezerraImg },
  { id: "bezerros", name: "Bezerros", image: bezerroImg },
  { id: "garrotes", name: "Garrotes", image: garrotesImg },
  { id: "vacas-gordas", name: "Vacas Gordas", image: vacaGordaImg },
  { id: "vacas-magras", name: "Vacas Magras", image: vacaMagraImg },
  { id: "touros", name: "Touros", image: touroImg },
  { id: "boi-gordo", name: "Boi Gordo", image: boiGordoImg },
];

export const listings: Animal[] = [
  {
    id: "1",
    title: "Lote de Novilhas Nelore Premium",
    category: "Novilhas",
    breed: "Nelore",
    weight: 320,
    quantity: 50,
    pricePerHead: 2800,
    pricePerArroba: 262.5,
    location: { city: "Presidente Prudente", state: "SP", country: "Brasil", lat: -22.125, lng: -51.389 },
    seller: { id: "s1", name: "Fazenda Santa Fé", rating: 4.8, phone: "(18) 99999-9999", verified: true },
    image: novilhaImg,
    description: "Lote excepcional de novilhas nelore, prontas para estação de monta. Genética apurada.",
    datePosted: "2025-05-10",
    featured: true,
  },
  {
    id: "2",
    title: "Touro Angus Reprodutor PO",
    category: "Touros",
    breed: "Angus",
    weight: 850,
    quantity: 1,
    pricePerHead: 15000,
    location: { city: "Londrina", state: "PR", country: "Brasil", lat: -23.304, lng: -51.169 },
    seller: { id: "s2", name: "Agropecuária Silva", rating: 5.0, phone: "(43) 98888-8888", verified: true },
    image: touroImg,
    description: "Touro Angus PO com registro definitivo. Excelente conformação e docilidade.",
    datePosted: "2025-05-12",
    featured: true,
  },
  {
    id: "3",
    title: "Bezerros de Cruzamento Industrial",
    category: "Bezerros",
    breed: "Angus x Nelore",
    weight: 210,
    quantity: 100,
    pricePerHead: 1900,
    location: { city: "Campo Grande", state: "MS", country: "Brasil", lat: -20.443, lng: -54.646 },
    seller: { id: "s3", name: "Rancho Pantanal", rating: 4.5, phone: "(67) 97777-7777", verified: false },
    image: bezerroImg,
    description: "Bezerros desmamados, muito sadios e pesados. Oportunidade para recria.",
    datePosted: "2025-05-15",
  },
  {
    id: "4",
    title: "Vacas Gordas para Abate",
    category: "Vacas gordas",
    breed: "Mestiça",
    weight: 450,
    quantity: 30,
    pricePerHead: 3200,
    pricePerArroba: 213,
    location: { city: "Uberaba", state: "MG", country: "Brasil", lat: -19.747, lng: -47.939 },
    seller: { id: "s4", name: "Sítio Boa Esperança", rating: 4.2, phone: "(34) 96666-6666", verified: true },
    image: vacaGordaImg,
    description: "Lote de vacas gordas bem acabadas. Pesagem na fazenda.",
    datePosted: "2025-05-18",
  },
   {
    id: "5",
    title: "Garrotes Nelore para Engorda",
    category: "Garrotes",
    breed: "Nelore",
    weight: 380,
    quantity: 80,
    pricePerHead: 2500,
    location: { city: "Goiânia", state: "GO", country: "Brasil", lat: -16.686, lng: -49.264 },
    seller: { id: "s5", name: "Fazenda Ouro Verde", rating: 4.7, phone: "(62) 95555-5555", verified: true },
    image: garrotesImg,
    description: "Garrotes padronizados, carcaça comprida. Ideais para confinamento.",
    datePosted: "2025-05-19",
  },
];

export const marketQuotes: Quote[] = [
  { state: "SP", priceArroba: 235.00, trend: "up", lastUpdate: "Hoje" },
  { state: "MS", priceArroba: 220.50, trend: "stable", lastUpdate: "Hoje" },
  { state: "MG", priceArroba: 228.00, trend: "down", lastUpdate: "Ontem" },
  { state: "MT", priceArroba: 215.00, trend: "stable", lastUpdate: "Hoje" },
  { state: "GO", priceArroba: 218.50, trend: "up", lastUpdate: "Hoje" },
  { state: "PR", priceArroba: 230.00, trend: "up", lastUpdate: "Ontem" },
];

export const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    features: [
      "Até 10 anúncios ativos",
      "Vendas apenas no município",
      "Suporte básico",
      "Calculadora de lucro simples"
    ],
    color: "bg-slate-100",
    btnColor: "default",
    recommended: false
  },
  {
    name: "Plus",
    price: "R$ 49,90",
    period: "/mês",
    features: [
      "Anúncios ilimitados",
      "Vendas em todo o estado",
      "Destaque nos anúncios",
      "Calculadora IA avançada",
      "Suporte prioritário"
    ],
    color: "bg-emerald-50 border-emerald-200",
    btnColor: "emerald",
    recommended: true
  },
  {
    name: "Premium",
    price: "R$ 99,90",
    period: "/mês",
    features: [
      "Alcance Nacional e Internacional",
      "Conexão com exportadores",
      "Gestor de conta dedicado",
      "Dados de mercado em tempo real",
      "API de integração",
      "Selos de verificação"
    ],
    color: "bg-amber-50 border-amber-200",
    btnColor: "amber",
    recommended: false
  }
];

// Calculate distance in km between two points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
