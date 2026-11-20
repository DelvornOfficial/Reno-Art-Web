// Full product generator & catalog data for RENO DESIGN E-Commerce Store
export const PRODUCT_CATEGORIES = [
  'All Designs',
  '3D Elevation Tiles',
  'CNC Jali Patterns',
  '3D Wall Panels',
  'Ceiling & Molding',
  'Parametric Facades'
];

const BASE_DESIGNS = [
  { title: 'Fluted Acoustic Wave Panel', category: '3D Wall Panels', format: 'OBJ / STL / STEP', price: 499, originalPrice: 1299, badge: 'Bestseller', poly: '48k Polys', desc: 'Seamless fluted panel for architectural interiors and luxury living rooms.' },
  { title: 'Islamic Geometric CNC Jali', category: 'CNC Jali Patterns', format: 'DXF / DWG / CDR', price: 299, originalPrice: 799, badge: 'Popular', poly: 'Vector CAD', desc: 'Precision laser & router cutting CAD vectors for facade screens and partitions.' },
  { title: 'Parametric Diamond Facade', category: 'Parametric Facades', format: '3DM / OBJ / STL', price: 899, originalPrice: 1999, badge: 'Trending', poly: '92k Polys', desc: 'Computational diamond relief suitable for modern exterior facades & 3D printing.' },
  { title: 'Hexagonal Textured Stone Tile', category: '3D Elevation Tiles', format: 'MAX / FBX / OBJ', price: 399, originalPrice: 899, badge: 'New', poly: '34k Polys', desc: 'PBR textured interlocking hex tile for exterior wall elevations and bathrooms.' },
  { title: 'Coffered Classical Ceiling Medallion', category: 'Ceiling & Molding', format: 'STL / OBJ / 3DS', price: 549, originalPrice: 1199, badge: 'Instant DL', poly: '110k Polys', desc: 'Neoclassical ceiling centerpiece ready for high-resolution CNC carving & casting.' },
  { title: 'Organic Ripple Wave Tile 600x600', category: '3D Elevation Tiles', format: 'STL / OBJ / DWG', price: 449, originalPrice: 999, badge: 'Staff Pick', poly: '56k Polys', desc: 'Continuous sand ripple texture module for seamless feature walls and hotel lobbies.' },
  { title: 'Moroccan Arabesque Screen Panel', category: 'CNC Jali Patterns', format: 'DXF / CDR / AI', price: 349, originalPrice: 749, badge: 'Popular', poly: 'Vector CAD', desc: 'Traditional Moroccan lattice pattern for partition screens, gates and interior dividers.' },
  { title: 'Ribbed Linear Accent Slat 2400mm', category: '3D Wall Panels', format: 'OBJ / STL / 3DS', price: 599, originalPrice: 1399, badge: 'Modern', poly: '38k Polys', desc: 'Vertical architectural wood/stone slat module for modern accent feature walls.' },
  { title: 'Kinetic Voronoi Facade Module', category: 'Parametric Facades', format: 'STL / OBJ / STEP', price: 949, originalPrice: 2199, badge: 'Pro', poly: '140k Polys', desc: 'Parametric Voronoi cellular design for commercial towers and luxury residential gates.' },
  { title: 'Victorian Egg & Dart Crown Molding', category: 'Ceiling & Molding', format: 'OBJ / STL / FBX', price: 429, originalPrice: 899, badge: 'Classic', poly: '72k Polys', desc: 'Detailed cornices and ceiling perimeter moldings for luxury heritage restorations.' },
  { title: 'Split-Face Travertine 3D Cladding', category: '3D Elevation Tiles', format: 'MAX / OBJ / STL', price: 499, originalPrice: 1099, badge: 'Exterior', poly: '65k Polys', desc: 'Rough natural stone elevation tiles with interlocking tongue and groove seams.' },
  { title: 'Chevron Acoustic Wood Tile', category: '3D Wall Panels', format: 'OBJ / STL / DWG', price: 379, originalPrice: 849, badge: 'Trending', poly: '42k Polys', desc: 'Herringbone/chevron relief paneling for auditorium and home theater walls.' }
];

const GRADIENTS = [
  'linear-gradient(135deg, #1A1A1E 0%, #2D2D35 100%)',
  'linear-gradient(135deg, #24221F 0%, #3D3934 100%)',
  'linear-gradient(135deg, #18191C 0%, #282C34 100%)',
  'linear-gradient(135deg, #2A2826 0%, #3B3833 100%)',
  'linear-gradient(135deg, #22201D 0%, #36322C 100%)',
  'linear-gradient(135deg, #1C1E22 0%, #2E333B 100%)'
];

// Generate 150 real mock catalog items (3 full pages of 50 each)
export const FEATURED_PRODUCTS = Array.from({ length: 150 }, (_, i) => {
  const base = BASE_DESIGNS[i % BASE_DESIGNS.length];
  const pageNum = Math.floor(i / 50) + 1;
  const itemInPage = (i % 50) + 1;
  const gradient = GRADIENTS[i % GRADIENTS.length];
  const downloads = 500 + ((i * 37) % 3500);
  const rating = Number((4.6 + ((i * 7) % 5) * 0.1).toFixed(1));

  return {
    id: `rd-${String(i + 1).padStart(3, '0')}`,
    title: i < BASE_DESIGNS.length ? base.title : `${base.title} (Var. ${Math.floor(i / BASE_DESIGNS.length) + 1})`,
    category: base.category,
    format: base.format,
    price: base.price,
    originalPrice: base.originalPrice,
    badge: base.badge,
    rating,
    downloads,
    gradient,
    polyCount: base.poly,
    description: base.desc
  };
});
