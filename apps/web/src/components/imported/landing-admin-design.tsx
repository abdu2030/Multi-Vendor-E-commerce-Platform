"use client";

import Link from "next/link";
import { useState } from "react";
import type React from "react";
import {
  Search,
  ShoppingCart,
  ArrowRight,
  Shield,
  Truck,
  RefreshCw,
  BadgeCheck,
  Menu,
  X,
  Heart,
  Package,
  Star,
  ChevronRight,
  // admin icons
  LayoutDashboard,
  Users,
  ShoppingBag,
  Tag,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Clock,
  CircleDollarSign,
  BarChart2,
  AlertCircle,
  LogOut,
} from "./design-icons";

// ─── Landing Data ─────────────────────────────────────────────────────────────

const NAV_LINKS = ["Browse", "New arrivals", "Sellers", "Gift ideas"];

const CATEGORIES = [
  {
    name: "Electronics",
    emoji: "⚡",
    color: "bg-blue-50   border-blue-100   text-blue-700",
    count: "2.4k",
  },
  {
    name: "Fashion",
    emoji: "👗",
    color: "bg-pink-50   border-pink-100   text-pink-700",
    count: "5.1k",
  },
  {
    name: "Home & Living",
    emoji: "🏡",
    color: "bg-amber-50  border-amber-100  text-amber-700",
    count: "3.2k",
  },
  {
    name: "Beauty",
    emoji: "✨",
    color: "bg-rose-50   border-rose-100   text-rose-700",
    count: "1.8k",
  },
  {
    name: "Sports",
    emoji: "🏃",
    color: "bg-green-50  border-green-100  text-green-700",
    count: "940",
  },
  {
    name: "Books",
    emoji: "📚",
    color: "bg-purple-50 border-purple-100 text-purple-700",
    count: "6.7k",
  },
  {
    name: "Handmade",
    emoji: "🧶",
    color: "bg-orange-50 border-orange-100 text-orange-700",
    count: "1.2k",
  },
  {
    name: "Food & Drink",
    emoji: "🍃",
    color: "bg-teal-50   border-teal-100   text-teal-700",
    count: "780",
  },
];

const TRENDING = [
  {
    id: 1,
    name: "Handmade Leather Wallet",
    price: 24.99,
    rating: 4.8,
    reviews: 143,
    seller: "Craft & Co.",
    stock: 4,
    img: "photo-1627384113743-6bd5a479fffd",
    badge: "Best seller",
    badgeClass: "bg-amber-500",
  },
  {
    id: 2,
    name: "Ceramic Pour-Over Mug Set",
    price: 38.0,
    rating: 4.9,
    reviews: 87,
    seller: "Clay Studio",
    stock: 12,
    img: "photo-1514228742587-6b1558fcca3d",
    badge: "New",
    badgeClass: "bg-emerald-500",
  },
  {
    id: 3,
    name: "Waxed Canvas Tote Bag",
    price: 54.99,
    rating: 4.7,
    reviews: 215,
    seller: "Provisions Co.",
    stock: 2,
    img: "photo-1548036328-c9fa89d128fa",
    badge: "Low stock",
    badgeClass: "bg-red-500",
  },
  {
    id: 4,
    name: "Minimalist Field Watch",
    price: 129.0,
    rating: 4.6,
    reviews: 58,
    seller: "Timeworks",
    stock: 8,
    img: "photo-1523275335684-37898b6baf30",
    badge: null,
    badgeClass: null,
  },
  {
    id: 5,
    name: "Terracotta Plant Pot Set",
    price: 19.99,
    rating: 4.8,
    reviews: 302,
    seller: "Green Thumb",
    stock: 23,
    img: "photo-1485955900006-10f4d324d411",
    badge: "Popular",
    badgeClass: "bg-purple-500",
  },
  {
    id: 6,
    name: "Linen Hardcover Notebook",
    price: 16.5,
    rating: 4.5,
    reviews: 189,
    seller: "Paper & Pen",
    stock: 34,
    img: "photo-1544947950-fa07a98d237f",
    badge: null,
    badgeClass: null,
  },
  {
    id: 7,
    name: "Beeswax Candle Collection",
    price: 32.0,
    rating: 4.9,
    reviews: 421,
    seller: "The Candle Room",
    stock: 6,
    img: "photo-1602874801006-8e3d6e2e6890",
    badge: "Staff pick",
    badgeClass: "bg-indigo-500",
  },
  {
    id: 8,
    name: "Hand-Thrown Bowl Set",
    price: 67.0,
    rating: 4.7,
    reviews: 64,
    seller: "Clay Studio",
    stock: 3,
    img: "photo-1612364958051-4d7d0de5e56a",
    badge: "Limited",
    badgeClass: "bg-orange-500",
  },
];

const ARRIVALS = [
  {
    id: 9,
    name: "Pressed Flower Art Print",
    price: 28.0,
    rating: 4.9,
    reviews: 34,
    seller: "Studio Bloom",
    stock: 9,
    img: "photo-1558618666-fcd25c85cd64",
    badge: "New",
    badgeClass: "bg-purple-500",
  },
  {
    id: 10,
    name: "Hand-dyed Linen Pillowcase",
    price: 44.0,
    rating: 4.8,
    reviews: 19,
    seller: "Loom & Thread",
    stock: 5,
    img: "photo-1505693416388-ac5ce068fe85",
    badge: "New",
    badgeClass: "bg-purple-500",
  },
  {
    id: 11,
    name: "Copper French Press",
    price: 89.0,
    rating: 4.7,
    reviews: 41,
    seller: "Brew Collective",
    stock: 7,
    img: "photo-1495474472287-4d71bcdd2085",
    badge: "New",
    badgeClass: "bg-purple-500",
  },
  {
    id: 12,
    name: "Reclaimed Wood Shelf",
    price: 112.0,
    rating: 4.6,
    reviews: 28,
    seller: "Oak & Grain",
    stock: 2,
    img: "photo-1555041469-a586c61ea9bc",
    badge: "New",
    badgeClass: "bg-purple-500",
  },
];

const SELLERS = [
  {
    name: "Craft & Co.",
    tagline: "Handcrafted leather goods made in Portland, OR",
    products: 34,
    rating: 4.9,
    sales: "1,240",
    img: "photo-1507003211169-0a1dd7228f2d",
    specialty: "Leather Goods",
    spClass: "bg-amber-100 text-amber-800",
  },
  {
    name: "Clay Studio",
    tagline: "Handmade ceramics fired in our Brooklyn studio",
    products: 58,
    rating: 4.8,
    sales: "876",
    img: "photo-1494790108377-be9c29b29330",
    specialty: "Ceramics",
    spClass: "bg-rose-100 text-rose-800",
  },
  {
    name: "Provisions Co.",
    tagline: "Waxed canvas bags and heritage outdoor accessories",
    products: 21,
    rating: 4.7,
    sales: "2,103",
    img: "photo-1500648767791-00dcc994a43e",
    specialty: "Accessories",
    spClass: "bg-teal-100 text-teal-800",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Submit your application",
    body: "Tell us about your store and what you plan to sell. Takes under 5 minutes.",
  },
  {
    n: "02",
    title: "Wait for admin review",
    body: "Our team reviews your application within 24–48 hours and emails you the result.",
  },
  {
    n: "03",
    title: "Set up your store",
    body: "Add products, write descriptions, upload photos, and set your own prices.",
  },
  {
    n: "04",
    title: "Start selling",
    body: "Your products go live. Manage orders, track sales, and grow your business.",
  },
];

const TRUST = [
  {
    Icon: Shield,
    title: "Secure payments",
    body: "Every transaction is encrypted and processed through Stripe. Your financial data never touches our servers.",
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  {
    Icon: BadgeCheck,
    title: "Verified sellers only",
    body: "Every seller is reviewed and approved before listing products. We check identity and store quality.",
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  {
    Icon: Truck,
    title: "Real order tracking",
    body: "Track your orders from checkout to your door. Sellers update shipping status directly from their dashboard.",
    iconClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  {
    Icon: RefreshCw,
    title: "Hassle-free returns",
    body: "Contact the seller within 14 days if something is not right. We step in when needed.",
    iconClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
];

const HERO_MOSAIC = [
  { id: "photo-1548036328-c9fa89d128fa", alt: "Canvas tote bag" },
  { id: "photo-1523275335684-37898b6baf30", alt: "Minimalist watch" },
  { id: "photo-1514228742587-6b1558fcca3d", alt: "Ceramic mug" },
  { id: "photo-1485955900006-10f4d324d411", alt: "Plant pot" },
  { id: "photo-1544947950-fa07a98d237f", alt: "Notebook" },
  { id: "photo-1602874801006-8e3d6e2e6890", alt: "Candle" },
];

// ─── Admin Data ───────────────────────────────────────────────────────────────

const ADMIN_STATS = [
  {
    label: "Total users",
    value: "4,821",
    change: "+84 this week",
    positive: true,
    Icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    label: "Verified sellers",
    value: "320",
    change: "+12 this month",
    positive: true,
    Icon: BadgeCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    label: "Pending applications",
    value: "14",
    change: "Needs attention",
    positive: false,
    Icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    label: "Total products",
    value: "1,243",
    change: "+63 this week",
    positive: true,
    Icon: ShoppingBag,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    label: "Total orders",
    value: "8,902",
    change: "+218 today",
    positive: true,
    Icon: FileText,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    label: "Platform revenue",
    value: "$248,340",
    change: "+$4,200 today",
    positive: true,
    Icon: CircleDollarSign,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    label: "Reported reviews",
    value: "7",
    change: "3 unread",
    positive: false,
    Icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    label: "Out-of-stock products",
    value: "23",
    change: "Low inventory",
    positive: false,
    Icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
];

const PENDING_SELLERS = [
  {
    id: "APP-0091",
    name: "Mia Thornton",
    store: "The Pressed Petal",
    email: "mia@pressedpetal.co",
    category: "Home & Decor",
    submitted: "Jun 29, 2025",
    status: "pending",
  },
  {
    id: "APP-0090",
    name: "Jordan Reyes",
    store: "Forge & Form",
    email: "j.reyes@forgeform.io",
    category: "Jewelry",
    submitted: "Jun 28, 2025",
    status: "pending",
  },
  {
    id: "APP-0089",
    name: "Amara Osei",
    store: "Kente Kloset",
    email: "amara@kentekloset.com",
    category: "Fashion",
    submitted: "Jun 27, 2025",
    status: "pending",
  },
  {
    id: "APP-0088",
    name: "Leo Nakamura",
    store: "Wabi Studio",
    email: "leo@wabistudio.jp",
    category: "Ceramics",
    submitted: "Jun 26, 2025",
    status: "pending",
  },
  {
    id: "APP-0087",
    name: "Clara Svensson",
    store: "Nordic Knits",
    email: "c.svensson@nknits.se",
    category: "Handmade",
    submitted: "Jun 24, 2025",
    status: "pending",
  },
  {
    id: "APP-0086",
    name: "Felix Hartmann",
    store: "Werkstatt Berlin",
    email: "felix@werkstatt.de",
    category: "Furniture",
    submitted: "Jun 22, 2025",
    status: "pending",
  },
];

const ADMIN_PRODUCTS = [
  {
    id: "PRD-1091",
    name: "Handmade Leather Wallet",
    seller: "Craft & Co.",
    category: "Accessories",
    price: 24.99,
    stock: 4,
    status: "active",
    reported: false,
  },
  {
    id: "PRD-1088",
    name: "Raw Honey Gift Set",
    seller: "The Hive Co.",
    category: "Food & Drink",
    price: 34.0,
    stock: 18,
    status: "active",
    reported: true,
  },
  {
    id: "PRD-1076",
    name: "Vintage Brass Candle Holder",
    seller: "Bloom & Rust",
    category: "Home & Decor",
    price: 47.5,
    stock: 0,
    status: "out_of_stock",
    reported: false,
  },
  {
    id: "PRD-1063",
    name: "Alpaca Wool Scarf",
    seller: "Nordic Knits",
    category: "Fashion",
    price: 68.0,
    stock: 7,
    status: "active",
    reported: false,
  },
  {
    id: "PRD-1054",
    name: "Recycled Glass Terrarium",
    seller: "Green Thumb",
    category: "Home & Decor",
    price: 55.0,
    stock: 12,
    status: "under_review",
    reported: false,
  },
  {
    id: "PRD-1041",
    name: "Cold Process Soap Set",
    seller: "The Candle Room",
    category: "Beauty",
    price: 22.0,
    stock: 31,
    status: "active",
    reported: false,
  },
  {
    id: "PRD-1032",
    name: "Macramé Wall Hanging",
    seller: "Loom & Thread",
    category: "Handmade",
    price: 79.99,
    stock: 3,
    status: "active",
    reported: false,
  },
];

const ADMIN_ORDERS = [
  {
    id: "ORD-8042",
    buyer: "Sam Rivera",
    product: "Leather Wallet",
    seller: "Craft & Co.",
    total: 24.99,
    status: "shipped",
    date: "Jul 1, 2025",
  },
  {
    id: "ORD-8041",
    buyer: "Priya Kapoor",
    product: "Ceramic Mug Set",
    seller: "Clay Studio",
    total: 38.0,
    status: "processing",
    date: "Jul 1, 2025",
  },
  {
    id: "ORD-8039",
    buyer: "Tom Wu",
    product: "Canvas Tote Bag",
    seller: "Provisions Co.",
    total: 54.99,
    status: "delivered",
    date: "Jun 30, 2025",
  },
  {
    id: "ORD-8037",
    buyer: "Aisha Malik",
    product: "Beeswax Candle Set",
    seller: "The Candle Room",
    total: 32.0,
    status: "paid",
    date: "Jun 30, 2025",
  },
  {
    id: "ORD-8034",
    buyer: "Diego Torres",
    product: "Linen Pillowcase Pair",
    seller: "Loom & Thread",
    total: 88.0,
    status: "cancelled",
    date: "Jun 29, 2025",
  },
  {
    id: "ORD-8031",
    buyer: "Freya Hansen",
    product: "Alpaca Wool Scarf",
    seller: "Nordic Knits",
    total: 68.0,
    status: "refunded",
    date: "Jun 29, 2025",
  },
  {
    id: "ORD-8028",
    buyer: "Marco Bellini",
    product: "Copper French Press",
    seller: "Brew Collective",
    total: 89.0,
    status: "shipped",
    date: "Jun 28, 2025",
  },
];

const ADMIN_REVIEWS = [
  {
    id: "REV-441",
    product: "Raw Honey Gift Set",
    buyer: "James O.",
    rating: 1,
    text: "This is just repackaged supermarket honey. Completely misrepresented.",
    date: "Jun 30, 2025",
    reported: true,
    reportReason: "Misleading product description",
  },
  {
    id: "REV-438",
    product: "Macramé Wall Hanging",
    buyer: "Lisa M.",
    rating: 2,
    text: "Nothing like the photos. Knots were loose and it fell apart within a week.",
    date: "Jun 29, 2025",
    reported: true,
    reportReason: "Product quality dispute",
  },
  {
    id: "REV-432",
    product: "Alpaca Wool Scarf",
    buyer: "Alex T.",
    rating: 5,
    text: "Flagged by seller claiming the buyer never purchased. Needs verification.",
    date: "Jun 27, 2025",
    reported: true,
    reportReason: "Seller disputes authenticity",
  },
  {
    id: "REV-419",
    product: "Cold Process Soap Set",
    buyer: "Maria P.",
    rating: 1,
    text: "Caused a skin reaction. I have photos if needed.",
    date: "Jun 25, 2025",
    reported: true,
    reportReason: "Safety concern",
  },
];

const RECENT_ACTIVITY = [
  {
    type: "seller_approved",
    text: "You approved Provisions Co. as a verified seller",
    time: "2 hours ago",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    type: "review_hidden",
    text: "Review REV-389 was hidden after moderation",
    time: "5 hours ago",
    color: "bg-red-100 text-red-700",
  },
  {
    type: "product_flagged",
    text: "Raw Honey Gift Set was flagged for review",
    time: "8 hours ago",
    color: "bg-amber-100 text-amber-700",
  },
  {
    type: "seller_rejected",
    text: "Application APP-0083 was rejected",
    time: "Yesterday",
    color: "bg-stone-100 text-stone-600",
  },
  {
    type: "order_refund",
    text: "Refund issued for ORD-8031 ($68.00)",
    time: "Yesterday",
    color: "bg-purple-100 text-purple-700",
  },
];

// ─── Shared Components ────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`}
        />
      ))}
    </div>
  );
}

type Product = (typeof TRENDING)[number];

function ProductCard({ p }: { p: Product }) {
  const [wished, setWished] = useState(false);
  const fallback =
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop&auto=format";
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        <img
          src={`https://images.unsplash.com/${p.img}?w=400&h=400&fit=crop&auto=format`}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
        />
        {p.badge && (
          <span
            className={`absolute top-3 left-3 ${p.badgeClass} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}
          >
            {p.badge}
          </span>
        )}
        <button
          onClick={() => setWished(!wished)}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-4 h-4 ${wished ? "fill-red-500 text-red-500" : "text-stone-400"}`}
          />
        </button>
        {p.stock <= 4 && (
          <div className="absolute bottom-3 left-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-lg inline-block">
              Only {p.stock} left in stock
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-1.5">
          <Stars rating={p.rating} />
          <span className="text-[11px] text-stone-400">
            {p.rating} ({p.reviews})
          </span>
        </div>
        <h3 className="font-semibold text-stone-800 text-sm leading-snug line-clamp-2">
          {p.name}
        </h3>
        <div className="flex items-center gap-1 mt-auto pt-1">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] text-stone-400">{p.seller}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-lg font-extrabold text-stone-900">
            ${p.price.toFixed(2)}
          </span>
          <button className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-colors">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50   text-amber-700   border-amber-200",
    shipped: "bg-blue-50    text-blue-700    border-blue-200",
    processing: "bg-indigo-50  text-indigo-700  border-indigo-200",
    delivered: "bg-teal-50    text-teal-700    border-teal-200",
    paid: "bg-green-50   text-green-700   border-green-200",
    cancelled: "bg-red-50     text-red-700     border-red-200",
    refunded: "bg-stone-100  text-stone-600   border-stone-200",
    out_of_stock: "bg-orange-50  text-orange-700  border-orange-200",
    under_review: "bg-purple-50  text-purple-700  border-purple-200",
    reported: "bg-red-50     text-red-700     border-red-200",
  };
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={`text-[11px] font-bold border px-2 py-0.5 rounded-full ${map[status] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}
    >
      {label}
    </span>
  );
}

// ─── Admin: Seller Approval Modal ─────────────────────────────────────────────

function SellerModal({
  seller,
  onClose,
  onApprove,
  onReject,
}: {
  seller: (typeof PENDING_SELLERS)[number];
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Seller application detail"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <div>
            <h2 className="font-extrabold text-stone-900 text-base">
              Seller Application
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {seller.id} · Submitted {seller.submitted}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
              {seller.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-stone-900">{seller.name}</p>
              <p className="text-xs text-stone-500">{seller.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Store name", val: seller.store },
              { label: "Category", val: seller.category },
              { label: "Submitted", val: seller.submitted },
              { label: "Application ID", val: seller.id },
            ].map(({ label, val }) => (
              <div key={label} className="bg-stone-50 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  {label}
                </p>
                <p className="font-semibold text-stone-800 text-sm">{val}</p>
              </div>
            ))}
          </div>
          <div className="bg-stone-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Store description
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {seller.store} is a small independent business specialising in{" "}
              {seller.category.toLowerCase()} products. The seller has provided
              valid contact information and described their product catalogue
              clearly. No prior violations found on this account.
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
              Admin notes (optional)
            </label>
            <textarea
              placeholder="Add a note visible only to admins…"
              rows={2}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm px-4 py-3 rounded-xl transition-colors border border-red-200"
          >
            <XCircle className="w-4 h-4" /> Reject application
          </button>
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> Approve seller
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard Views ────────────────────────────────────────────────────

function AdminOverview() {
  return (
    <div className="flex flex-col gap-8">
      {/* Alert banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">
            14 seller applications are waiting for review
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Applications older than 48 hours are marked for priority review. The
            oldest is from Jun 22.
          </p>
        </div>
        <button className="ml-auto text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
          Review now
        </button>
      </div>

      {/* Stat cards */}
      <div>
        <h2 className="text-sm font-extrabold text-stone-500 uppercase tracking-widest mb-4">
          Platform overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ADMIN_STATS.map((stat) => {
            const Icon = stat.Icon;
            return (
              <div
                key={stat.label}
                className={`bg-white rounded-2xl border ${stat.border} p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {stat.positive ? "↑" : "⚠"} {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-stone-900 leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-stone-400 mt-1 font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column: recent orders + activity */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Recent orders table */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <h3 className="font-extrabold text-stone-900 text-sm">
              Recent orders
            </h3>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
              View all orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <th className="px-6 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Buyer</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN_ORDERS.slice(0, 5).map((o, i) => (
                  <tr
                    key={o.id}
                    className={`border-t border-stone-50 hover:bg-stone-50 transition-colors ${i % 2 === 0 ? "" : ""}`}
                  >
                    <td className="px-6 py-3.5 font-bold text-stone-700 text-xs">
                      {o.id}
                    </td>
                    <td className="px-4 py-3.5 text-stone-700 text-xs">
                      {o.buyer}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-stone-900 text-xs">
                      ${o.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3.5 text-stone-400 text-xs">
                      {o.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-stone-100">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="font-extrabold text-stone-900 text-sm">
              Recent activity
            </h3>
          </div>
          <div className="px-5 py-4 flex flex-col gap-4">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${act.color.split(" ")[0].replace("bg-", "bg-")}`}
                />
                <div>
                  <p className="text-xs text-stone-700 leading-snug">
                    {act.text}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Avg. order value",
            val: "$27.90",
            Icon: BarChart2,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Conversion rate",
            val: "3.4%",
            Icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Return rate",
            val: "1.2%",
            Icon: RefreshCw,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Avg. seller rating",
            val: "4.7 ★",
            Icon: Star,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(({ label, val, Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-stone-900 leading-none">
                {val}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSellerApprovals() {
  const [sellers, setSellers] = useState(PENDING_SELLERS);
  const [selected, setSelected] = useState<
    (typeof PENDING_SELLERS)[number] | null
  >(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const approve = (id: string) => {
    setSellers((s) => s.filter((x) => x.id !== id));
    setSelected(null);
    showToast("Seller approved. They will be notified by email.", "success");
  };

  const reject = (id: string) => {
    setSellers((s) => s.filter((x) => x.id !== id));
    setSelected(null);
    showToast("Application rejected.", "error");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <SellerModal
          seller={selected}
          onClose={() => setSelected(null)}
          onApprove={() => approve(selected.id)}
          onReject={() => reject(selected.id)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">
            Seller approvals
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            {sellers.length} applications pending review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 px-3.5 py-2 rounded-xl hover:border-stone-300 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {sellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 py-20 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-stone-700">No pending applications</p>
          <p className="text-sm text-stone-400 mt-1">
            All caught up. Check back later.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100">
                  <th className="px-6 py-3.5 text-left">Applicant</th>
                  <th className="px-4 py-3.5 text-left">Store name</th>
                  <th className="px-4 py-3.5 text-left">Category</th>
                  <th className="px-4 py-3.5 text-left">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-stone-50 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800 text-sm">
                            {s.name}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-stone-700 text-sm">
                      {s.store}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-stone-400">
                      {s.submitted}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelected(s)}
                          className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                        <button
                          onClick={() => reject(s.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approve(s.id)}
                          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminProducts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = ADMIN_PRODUCTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">
            Product management
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            {ADMIN_PRODUCTS.length} total products across all sellers
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or sellers…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-stone-200 text-sm font-semibold text-stone-700 pl-4 pr-9 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="under_review">Under review</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100">
                <th className="px-6 py-3.5 text-left">Product</th>
                <th className="px-4 py-3.5 text-left">Seller</th>
                <th className="px-4 py-3.5 text-left">Category</th>
                <th className="px-4 py-3.5 text-left">Price</th>
                <th className="px-4 py-3.5 text-left">Stock</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-stone-400 text-sm"
                  >
                    No products match your filters. Try changing your search or
                    status.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-stone-50 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-bold text-stone-800 text-sm">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            {p.id}
                          </p>
                        </div>
                        {p.reported && (
                          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Reported
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-stone-600 font-medium">
                      {p.seller}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-stone-900">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-bold ${p.stock === 0 ? "text-red-600" : p.stock <= 4 ? "text-amber-600" : "text-stone-600"}`}
                      >
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-stone-800"
                          aria-label="View product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-stone-400 hover:text-red-600"
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-400"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = ADMIN_ORDERS.filter((o) =>
    statusFilter === "all" ? true : o.status === statusFilter,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-stone-900">
          Order management
        </h2>
        <p className="text-sm text-stone-400 mt-0.5">
          {ADMIN_ORDERS.length} orders shown · All sellers
        </p>
      </div>

      {/* Status pills filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          "all",
          "paid",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors capitalize ${
              statusFilter === s
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            {s === "all" ? "All orders" : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100">
                <th className="px-6 py-3.5 text-left">Order ID</th>
                <th className="px-4 py-3.5 text-left">Buyer</th>
                <th className="px-4 py-3.5 text-left">Product</th>
                <th className="px-4 py-3.5 text-left">Seller</th>
                <th className="px-4 py-3.5 text-left">Total</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5 text-left">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-stone-400 text-sm"
                  >
                    No orders with this status.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-stone-50 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-stone-700 text-xs">
                      {o.id}
                    </td>
                    <td className="px-4 py-4 text-stone-700 text-sm font-medium">
                      {o.buyer}
                    </td>
                    <td className="px-4 py-4 text-stone-600 text-xs max-w-[140px] truncate">
                      {o.product}
                    </td>
                    <td className="px-4 py-4 text-stone-500 text-xs">
                      {o.seller}
                    </td>
                    <td className="px-4 py-4 font-extrabold text-stone-900 text-sm">
                      ${o.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-4 text-stone-400 text-xs">
                      {o.date}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminReviews() {
  const [reviews, setReviews] = useState(ADMIN_REVIEWS);

  const hide = (id: string) => setReviews((r) => r.filter((x) => x.id !== id));
  const dismiss = (id: string) =>
    setReviews((r) =>
      r.map((x) => (x.id === id ? { ...x, reported: false } : x)),
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-stone-900">
          Review moderation
        </h2>
        <p className="text-sm text-stone-400 mt-0.5">
          {reviews.filter((r) => r.reported).length} reported reviews need
          attention
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 py-20 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-stone-700">No reported reviews</p>
          <p className="text-sm text-stone-400 mt-1">
            All reviews have been moderated.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white rounded-2xl border p-6 ${rev.reported ? "border-red-200" : "border-stone-100"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-stone-400">
                      {rev.id}
                    </span>
                    <span className="text-xs font-bold text-stone-700">
                      {rev.product}
                    </span>
                    <span className="text-xs text-stone-400">
                      by {rev.buyer}
                    </span>
                    <Stars rating={rev.rating} />
                    <span className="text-xs text-stone-400">{rev.date}</span>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-xl px-4 py-3 italic">
                    "{rev.text}"
                  </p>
                  {rev.reported && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-red-700">
                        Reported for: {rev.reportReason}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => hide(rev.id)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hide review
                  </button>
                  {rev.reported && (
                    <button
                      onClick={() => dismiss(rev.id)}
                      className="text-xs font-bold text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-colors"
                    >
                      Dismiss report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

type AdminView =
  | "dashboard"
  | "approvals"
  | "products"
  | "orders"
  | "reviews"
  | "users"
  | "categories"
  | "settings";

const SIDEBAR_ITEMS: {
  id: AdminView;
  label: string;
  Icon: React.FC<{ className?: string }>;
  badge?: number;
}[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "approvals", label: "Seller approvals", Icon: BadgeCheck, badge: 14 },
  { id: "users", label: "Users", Icon: Users },
  { id: "products", label: "Products", Icon: ShoppingBag },
  { id: "categories", label: "Categories", Icon: Tag },
  { id: "orders", label: "Orders", Icon: FileText },
  { id: "reviews", label: "Reviews", Icon: MessageSquare, badge: 7 },
  { id: "settings", label: "Settings", Icon: Settings },
];

export function ImportedAdminDashboard() {
  const [view, setView] = useState<AdminView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const titles: Record<AdminView, string> = {
    dashboard: "Dashboard",
    approvals: "Seller approvals",
    users: "Users",
    products: "Products",
    orders: "Orders",
    reviews: "Review moderation",
    categories: "Categories",
    settings: "Settings",
  };

  return (
    <div
      className="flex h-screen bg-stone-100 overflow-hidden"
      style={{
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* ── Sidebar ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-stone-900 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-extrabold text-base leading-none">
              Marketo
            </span>
            <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
              Admin panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5"
          aria-label="Admin navigation"
        >
          {SIDEBAR_ITEMS.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-left group ${
                view === id
                  ? "bg-white/10 text-white"
                  : "text-stone-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold">{label}</span>
              </span>
              {badge && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none ${view === id ? "bg-white/20 text-white" : "bg-amber-500 text-white"}`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">
                Admin User
              </p>
              <p className="text-stone-500 text-[10px] truncate">
                admin@marketo.co
              </p>
            </div>
            <button
              className="text-stone-500 hover:text-white transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-200 flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-stone-100 rounded-xl transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-stone-600" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-stone-900">
                {titles[view]}
              </h1>
              <p className="text-xs text-stone-400">
                Marketo Admin ·{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="relative p-2 hover:bg-stone-100 rounded-xl transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-stone-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-extrabold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {view === "dashboard" && <AdminOverview />}
          {view === "approvals" && <AdminSellerApprovals />}
          {view === "products" && <AdminProducts />}
          {view === "orders" && <AdminOrders />}
          {view === "reviews" && <AdminReviews />}
          {(view === "users" ||
            view === "categories" ||
            view === "settings") && (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-3">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center">
                {view === "users" && (
                  <Users className="w-6 h-6 text-stone-400" />
                )}
                {view === "categories" && (
                  <Tag className="w-6 h-6 text-stone-400" />
                )}
                {view === "settings" && (
                  <Settings className="w-6 h-6 text-stone-400" />
                )}
              </div>
              <p className="font-bold text-stone-600 capitalize">
                {titles[view]}
              </p>
              <p className="text-sm text-stone-400">
                This section is not yet implemented in this preview.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function ImportedLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div
      className="min-h-screen bg-[#FAF8F4]"
      style={{
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <a
              href="#"
              className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
            >
              <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-[17px] font-extrabold text-stone-900 tracking-tight">
                Marketo
              </span>
            </a>
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, sellers…"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-100 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white transition"
              />
            </div>
            <nav
              className="hidden md:flex items-center gap-5"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {l}
                </a>
              ))}
              <Link
                href="/dashboard/seller/apply"
                className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                Become a seller
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <button
                className="relative p-2 hover:bg-stone-100 rounded-xl transition-colors"
                aria-label="Shopping cart, 2 items"
              >
                <ShoppingCart className="w-5 h-5 text-stone-700" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  2
                </span>
              </button>
              <Link
                href="/login"
                className="hidden md:block text-sm font-semibold bg-stone-900 hover:bg-stone-700 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Sign in
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 hover:bg-stone-100 rounded-xl transition-colors"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 flex flex-col gap-3">
            <input
              type="search"
              placeholder="Search products…"
              className="w-full px-4 py-2.5 bg-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href="#"
                className="text-sm font-medium text-stone-700 py-1.5"
              >
                {l}
              </a>
            ))}
            <Link
              href="/dashboard/seller/apply"
              className="text-sm font-bold text-emerald-700 py-1.5"
              onClick={() => setMenuOpen(false)}
            >
              Become a seller
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-stone-900 text-white px-4 py-2.5 rounded-xl mt-1"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_500px] gap-12 items-center">
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              1,200+ products · 320 verified sellers
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-stone-900 leading-[1.08] tracking-tight">
              Shop from{" "}
              <span className="text-emerald-600">independent sellers</span> in
              one trusted marketplace.
            </h1>
            <p className="text-[17px] text-stone-500 leading-relaxed max-w-lg">
              Discover quality products, support verified sellers, and enjoy a
              simple shopping experience from cart to delivery.
            </p>
            <div className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition"
                />
              </div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm flex-shrink-0">
                Search
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-400 font-semibold mr-1">
                Popular:
              </span>
              {["Handmade", "Fashion", "Home", "Books", "Electronics"].map(
                (c) => (
                  <button
                    key={c}
                    className="text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {c}
                  </button>
                ),
              )}
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#featured-products"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-colors shadow-sm text-sm"
              >
                Start shopping
              </a>
              <Link
                href="/dashboard/seller/apply"
                className="bg-white border border-stone-200 hover:border-stone-300 text-stone-800 font-bold px-6 py-3.5 rounded-2xl transition-colors shadow-sm text-sm flex items-center gap-2"
              >
                Become a seller <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="flex items-center gap-2 text-sm text-stone-400">
              <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Payments secured by Stripe · All sellers verified before listing
            </p>
          </div>
          <div className="hidden lg:grid grid-cols-3 grid-rows-2 gap-3 h-[460px]">
            {HERO_MOSAIC.map((img, i) => (
              <div
                key={img.id}
                className={`relative rounded-2xl overflow-hidden bg-stone-100 ${i === 0 ? "row-span-2" : ""}`}
              >
                <img
                  src={`https://images.unsplash.com/${img.id}?w=320&h=480&fit=crop&auto=format`}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/96 backdrop-blur rounded-xl p-3.5 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wide">
                          Verified seller
                        </span>
                      </div>
                      <p className="text-sm font-bold text-stone-900 leading-snug">
                        Handmade Leather Wallet
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-base font-extrabold text-emerald-700">
                          $24.99
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold">
                          Only 4 left
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">
                Shop by category
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                Find exactly what you are looking for
              </p>
            </div>
            <a
              href="#"
              className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              All categories <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${cat.color} hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
              >
                <span className="text-2xl leading-none">{cat.emoji}</span>
                <span className="text-[11px] font-bold leading-tight">
                  {cat.name}
                </span>
                <span className="text-[10px] opacity-60 font-semibold">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section
        id="featured-products"
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Trending now
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
              Products people love
            </h2>
          </div>
          <a
            href="#"
            className="text-sm font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
          >
            Browse all <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {TRENDING.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* ── WHY SHOP WITH US ── */}
      <section className="bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-14 items-start">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Why Marketo
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-3 leading-tight">
                A marketplace you can actually trust.
              </h2>
              <p className="text-stone-400 mt-4 text-sm leading-relaxed">
                We built this for buyers who want quality and sellers who
                deserve a fair shot. Every detail is designed to make the
                experience feel safe, honest, and simple.
              </p>
              <button className="mt-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors">
                Our seller standards
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {TRUST.map(({ Icon, title, body, iconClass, bgClass }) => (
                <div
                  key={title}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
                >
                  <div
                    className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-5 h-5 ${iconClass}`} />
                  </div>
                  <h3 className="font-bold text-white text-sm">{title}</h3>
                  <p className="text-stone-400 text-xs leading-relaxed mt-2">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600">
                Fresh in
              </span>
              <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
                New arrivals
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                Added in the last 7 days
              </p>
            </div>
            <a
              href="#"
              className="text-sm font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
            >
              See all <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {ARRIVALS.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SELLER SPOTLIGHT ── */}
      <section className="py-16 bg-[#FAF8F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                People behind the products
              </span>
              <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
                Featured sellers
              </h2>
            </div>
            <a
              href="#"
              className="text-sm font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
            >
              All sellers <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {SELLERS.map((s) => (
              <div
                key={s.name}
                className="border border-stone-100 rounded-2xl p-6 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`https://images.unsplash.com/${s.img}?w=80&h=80&fit=crop&auto=format`}
                    alt={`${s.name} seller avatar`}
                    className="w-12 h-12 rounded-full object-cover bg-stone-100 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-stone-900 text-sm">
                        {s.name}
                      </span>
                      <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${s.spClass}`}
                    >
                      {s.specialty}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {s.tagline}
                </p>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span>
                    <b className="text-stone-800 font-bold">{s.products}</b>{" "}
                    products
                  </span>
                  <span>
                    <b className="text-stone-800 font-bold">{s.rating}</b> ★
                  </span>
                  <span>
                    <b className="text-stone-800 font-bold">{s.sales}</b> sales
                  </span>
                </div>
                <button className="mt-auto text-sm font-bold text-emerald-700 hover:text-emerald-900 text-left flex items-center gap-1 transition-colors">
                  Visit store <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW SELLING WORKS ── */}
      <section className="py-20 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              For sellers
            </span>
            <h2 className="text-3xl font-extrabold text-stone-900 mt-2">
              Start selling in four steps
            </h2>
            <p className="text-stone-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
              No listing fees. No hidden charges. Set up your store and start
              selling to buyers who are already looking for what you make.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col gap-3"
              >
                <span className="text-5xl font-extrabold text-emerald-100 leading-none select-none">
                  {step.n}
                </span>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  {step.title}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/dashboard/seller/apply"
              className="inline-flex bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition-colors shadow-sm"
            >
              Apply to sell on Marketo
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BAND ── */}
      <section className="bg-white py-10 border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            {[
              {
                Icon: Shield,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                title: "Secure checkout",
                sub: "Powered by Stripe. Your card data never reaches us.",
              },
              {
                Icon: BadgeCheck,
                color: "text-blue-600",
                bg: "bg-blue-50",
                title: "Verified sellers",
                sub: "Every seller passes our review before their first listing.",
              },
              {
                Icon: Truck,
                color: "text-purple-600",
                bg: "bg-purple-50",
                title: "Order tracking",
                sub: "Follow every order from packed to delivered.",
              },
            ].map(({ Icon, color, bg, title, sub }) => (
              <div key={title} className="flex items-start gap-4 px-8 py-6">
                <div
                  className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">{title}</p>
                  <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 bg-emerald-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Your store is waiting.
          </h2>
          <p className="text-emerald-100 mt-4 text-base leading-relaxed max-w-lg mx-auto">
            Join 320 verified sellers already earning on Marketo. No monthly
            fees. Full control over your products, prices, and orders.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              href="/dashboard/seller/apply"
              className="bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold px-7 py-3.5 rounded-2xl text-sm transition-colors shadow-sm"
            >
              Apply to become a seller
            </Link>
            <a
              href="#featured-products"
              className="border-2 border-emerald-400 hover:border-white text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition-colors"
            >
              Browse the marketplace
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-emerald-100 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4" /> Seller verified on approval
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Secure payouts weekly
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Order management included
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-stone-900 text-stone-400 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-extrabold text-base">
                  Marketo
                </span>
              </div>
              <p className="text-xs leading-relaxed text-stone-500">
                A marketplace for independent sellers and curious buyers. Built
                to feel real, work simply, and earn your trust.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Buyers</h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  "Browse products",
                  "How it works",
                  "Secure checkout",
                  "Track orders",
                  "Return policy",
                ].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Sellers</h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  "Become a seller",
                  "Seller dashboard",
                  "Seller guidelines",
                  "Fees & pricing",
                  "Seller support",
                ].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  "About us",
                  "Blog",
                  "Privacy policy",
                  "Terms of service",
                  "Contact",
                ].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2025 Marketo. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> Payments
              secured by Stripe
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<"landing" | "admin">("landing");

  return (
    <>
      {page === "landing" ? (
        <ImportedLandingPage />
      ) : (
        <ImportedAdminDashboard />
      )}

      {/* View switcher — floating pill */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-1 bg-stone-900/90 backdrop-blur-md border border-white/10 rounded-full px-1.5 py-1.5 shadow-xl"
        style={{
          fontFamily:
            '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <button
          onClick={() => setPage("landing")}
          className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${page === "landing" ? "bg-white text-stone-900" : "text-stone-400 hover:text-white"}`}
        >
          Landing
        </button>
        <button
          onClick={() => setPage("admin")}
          className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${page === "admin" ? "bg-white text-stone-900" : "text-stone-400 hover:text-white"}`}
        >
          Admin
        </button>
      </div>
    </>
  );
}
