const { useState, useEffect, useCallback, useRef } = React;

// Firebase Global Initialization
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-app",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:12345678:web:abcdef123"
};

let auth;
let isDemoMode = false;

try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_")) {
        isDemoMode = true;
    } else if (window.firebase && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    if (window.firebase) {
        auth = firebase.auth();
    }
} catch (err) {
    isDemoMode = true;
}

/* ---------- env-driven constants ---------- */
const LOGO_SRC    = '/images/logo.jpg';
const FALLBACK_IMG = '/images/logo.jpg';
const isImagePath = (path) => typeof path === 'string' && (path.startsWith('http') || path.startsWith('/images/'));
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const PRICING_CONFIG = {
            tiers: {
                phone: { elite: 299, standard: 249, value: 199 },
                laptop: { elite: 449, standard: 349, value: 299 },
                earbuds: { elite: 199, standard: 159, value: 129 }
            },
            costs: {
                product: 80,
                printing: 40,
                packaging: 20,
                delivery: 30
            },
            addons: {
                text: 19,
                photo: 39,
                extraPhoto: 20,
                color: 15,
                extraColor: 10,
                basicDesign: 29,
                premiumDesign: 89,
                handArt: 149
            }
        };

        const applyPsychologyValue = (val) => {
            // Rule: Always show ₹X99 instead of ₹X00
            if (val > 0 && val % 100 === 0) return val - 1;
            // Also handle common intermediate steps like 250 -> 249
            if (val > 0 && val % 50 === 0) return val - 1;
            return val;
        };

        const calculateDynamicPrice = (productId, mode, design, selectedModel) => {
            let tier = 'standard';
            
            // 1. Determine Tier from Model (Pro Mode)
            if (mode === 'pro' && selectedModel) {
                const model = selectedModel;
                // We'll use a helper to get tier from brand
                const brand = model.brand?.toLowerCase();
                if (['apple', 'samsung'].includes(brand)) {
                    if (model.name.toLowerCase().includes('ultra') || model.name.toLowerCase().includes('pro max')) {
                        tier = 'elite';
                    } else {
                        tier = 'standard';
                    }
                } else if (['nothing', 'oneplus', 'asus'].includes(brand)) {
                    tier = 'value';
                }
            } 
            // 2. Determine Tier from Manual Input (Easy Mode)
            else if (mode === 'easy' && design.manualModel) {
                const manual = design.manualModel.toLowerCase();
                if (manual.includes('iphone') || manual.includes('ultra') || manual.includes('macbook')) {
                    tier = 'elite';
                } else if (manual.includes('nothing') || manual.includes('oneplus')) {
                    tier = 'value';
                }
            }

            let base = PRICING_CONFIG.tiers[productId]?.[tier] || PRICING_CONFIG.tiers[productId]?.standard || 199;
            
            let total = base;
            const breakdown = [{ label: `${tier.toUpperCase()} Base Rate`, value: base }];

            const isPremiumLevel = productId === 'phone' || productId === 'laptop';

            if (design.text) {
                const textPrice = isPremiumLevel ? 0 : PRICING_CONFIG.addons.text;
                if (textPrice > 0) {
                    total += textPrice;
                    breakdown.push({ label: 'Text Personalization', value: textPrice });
                } else {
                    breakdown.push({ label: 'Text Personalization', value: 'Included' });
                }
            }

            if ((design.photoCount || 0) > 0) {
                const photoCharge = PRICING_CONFIG.addons.photo + (Math.max(0, design.photoCount - 1) * PRICING_CONFIG.addons.extraPhoto);
                total += photoCharge;
                breakdown.push({ label: `${design.photoCount}x Elements`, value: photoCharge });
            }

            if ((design.extraColorCount || 0) > 0) {
                const colorCharge = design.extraColorCount * PRICING_CONFIG.addons.extraColor;
                total += colorCharge;
                breakdown.push({ label: 'Extra Pigments', value: colorCharge });
            }

            if (design.pattern && design.pattern !== 'none') {
                total += PRICING_CONFIG.addons.basicDesign;
                breakdown.push({ label: 'Sticker/Texture', value: PRICING_CONFIG.addons.basicDesign });
            }

            if (design.hasHandArt) {
                total += PRICING_CONFIG.addons.handArt;
                breakdown.push({ label: 'Hand Art Upgrade', value: PRICING_CONFIG.addons.handArt });
            } else if (design.effect && design.effect !== 'none') {
                total += PRICING_CONFIG.addons.basicDesign;
                breakdown.push({ label: 'Material Finish', value: PRICING_CONFIG.addons.basicDesign });
            }

            // Apply Psychology (₹X99)
            const finalTotal = applyPsychologyValue(total);

            return { total: finalTotal, breakdown };
        };

        function AnimatedPrice({ value, fontSize = '2.2rem', color = 'var(--text-dark)' }) {
            const [displayValue, setDisplayValue] = useState(value);
            const [isAnimating, setIsAnimating] = useState(false);

            useEffect(() => {
                if (value !== displayValue) {
                    setIsAnimating(true);
                    const t = setTimeout(() => {
                        setDisplayValue(value);
                        setIsAnimating(false);
                    }, 300);
                    return () => clearTimeout(t);
                }
            }, [value]);

            return (
                <span style={{
                    display: 'inline-block',
                    fontSize,
                    fontWeight: 900,
                    color,
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
                    opacity: isAnimating ? 0.6 : 1,
                }}>
                    ₹{displayValue}
                </span>
            );
        }
        const PRODUCTS = [
            { id: 'laptop', name: 'LAPTOP CASE', icon: 'laptop', price: 299 },
            { id: 'phone', name: 'PHONE COVER', icon: 'phone', price: 199 },
            { id: 'earbuds', name: 'EARBUDS CASE', icon: 'earbuds', price: 129 }
        ];

        const DEVICE_MODELS = {
            phone: [
                { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', brand: 'Apple', cameraStyle: 'triple-island' },
                { id: 'iphone-17-pro', name: 'iPhone 17 Pro', brand: 'Apple', cameraStyle: 'triple-island' },
                { id: 'iphone-17', name: 'iPhone 17', brand: 'Apple', cameraStyle: 'dual-diagonal' },
                { id: 'iphone-17-air', name: 'iPhone 17 Air', brand: 'Apple', cameraStyle: 'dual-diagonal' },
                { id: 'samsung-s26-ultra', name: 'Samsung S26 Ultra', brand: 'Samsung', cameraStyle: 'samsung-ultra' },
                { id: 'samsung-s26-plus', name: 'Samsung S26+', brand: 'Samsung', cameraStyle: 'vertical-dots' },
                { id: 'samsung-s26', name: 'Samsung S26', brand: 'Samsung', cameraStyle: 'vertical-dots' },
                { id: 'google-pixel-10-pro', name: 'Google Pixel 10 Pro', brand: 'Google', cameraStyle: 'visor' },
                { id: 'google-pixel-10', name: 'Google Pixel 10', brand: 'Google', cameraStyle: 'visor' },
                { id: 'oneplus-14-pro', name: 'OnePlus 14 Pro', brand: 'OnePlus', cameraStyle: 'circular-island' },
                { id: 'nothing-phone-3', name: 'Nothing Phone (3)', brand: 'Nothing', cameraStyle: 'glyph' }
            ],
            laptop: [
                { id: 'macbook-pro-14-m5', name: 'MacBook Pro 14" (M5)', brand: 'Apple' },
                { id: 'macbook-pro-16-m5', name: 'MacBook Pro 16" (M5)', brand: 'Apple' },
                { id: 'macbook-air-13-m4', name: 'MacBook Air 13" (M4)', brand: 'Apple' },
                { id: 'macbook-air-15-m4', name: 'MacBook Air 15" (M4)', brand: 'Apple' },
                { id: 'dell-xps-16-2026', name: 'Dell XPS 16 (2026)', brand: 'Dell' },
                { id: 'hp-spectre-x360-v2', name: 'HP Spectre x360 (2026)', brand: 'HP' },
                { id: 'surface-laptop-7', name: 'Surface Laptop 7', brand: 'Microsoft' },
                { id: 'asus-rog-zephyrus-g16', name: 'ROG Zephyrus G16 (2026)', brand: 'ASUS' }
            ],
            earbuds: [
                { id: 'airpods-pro-3', name: 'AirPods Pro 3', brand: 'Apple' },
                { id: 'airpods-4', name: 'AirPods (4th Gen/Active)', brand: 'Apple' },
                { id: 'sony-wf1000xm6', name: 'Sony WF-1000XM6', brand: 'Sony' },
                { id: 'galaxy-buds-3-pro', name: 'Galaxy Buds 3 Pro', brand: 'Samsung' },
                { id: 'nothing-ear-3', name: 'Nothing Ear (3)', brand: 'Nothing' },
                { id: 'pixel-buds-pro-2', name: 'Pixel Buds Pro 2', brand: 'Google' }
            ],
        };
        const THEMES = [
            { id: 'anime', name: 'Anime', icon: '/images/quiet_sunset_anime.png', colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'], tag: 'Fan Favourites', mood: 'Bold & Expressive' },
            { id: 'marvel', name: 'Marvel', icon: '/images/theme_marvel_new.jpg', colors: ['#E63946', '#F1FAEE', '#A8DADC'], tag: 'Superhero Edition', mood: 'Bold & Powerful' },
            { id: 'cars', name: 'Cars', icon: '/images/theme_cars_new.png', colors: ['#2B2D42', '#8D99AE', '#EDF2F4'], tag: 'Speed & Style', mood: 'Sleek & Dynamic' },
            { id: 'mandala', name: 'Mandala', icon: '/images/theme_mandala_new.webp', colors: ['#606C38', '#283618', '#FEFAE0'], tag: 'Sacred Geometry', mood: 'Calm & Intricate' },
            { id: 'floral', name: 'Floral', icon: '/images/theme_floral_new.jpg', colors: ['#FFC8DD', '#FFAFCC', '#BDE0FE'], tag: 'Nature in Bloom', mood: 'Soft & Romantic' },
            { id: 'disney', name: 'Disney', icon: '/images/theme_disney_new.jpg', colors: ['#B7094C', '#A01A58', '#892B64'], tag: 'Magic Collection', mood: 'Enchanting & Pure' },

        ];
        const BASE_STYLES = [
            { id: 'matte', name: 'Matte Finish', icon: '/images/icon_pro.png' },
            { id: 'glossy', name: 'High Gloss', icon: '/images/icon_pro.png' },
            { id: 'transparent', name: 'Crystal Clear', icon: '/images/icon_easy.png' }
        ];
        const PATTERNS = [
            { id: 'none', name: 'Solid Finish', sub: 'Matte Studio Canvas' },
            { id: 'carbon', name: 'Carbon Fiber', sub: 'Industrial 3D Weave' },
            { id: 'topo', name: 'Topographic', sub: 'Terrain Vector Map' },
            { id: 'honeycomb', name: 'Honeycomb Grid', sub: 'Technical Hex Structure' },
            { id: 'matrix', name: 'Digital Matrix', sub: 'Micro-Grid Array' },
            { id: 'lines-pro', name: 'Pro Velocity', sub: 'Kinetic Racing Lines' },
            { id: 'noise', name: 'Grain Texture', sub: 'Tactile Analog Paper' },
            { id: 'hex-grid', name: 'Hex Connect', sub: 'Modular Geometric Link' },
            { id: 'marble', name: 'White Marble', sub: 'Premium Stone Texture' },
            { id: 'wood', name: 'Oak Wood', sub: 'Natural Timber Grain' },
            { id: 'terrazzo', name: 'Terrazzo', sub: 'Italian Mosaic Stone' },
            { id: 'chevron', name: 'Chevron', sub: 'Classic Zig-Zag' },
            { id: 'waves', name: 'Ocean Waves', sub: 'Smooth Curved Lines' }
        ];
        const EFFECTS = [
            { id: 'none', label: 'Standard Matte', sub: 'Original Device Texture', hint: 'Natural texture without overlays' },
            { id: 'satin-gloss', label: 'Satin Gloss', sub: 'Premium Clear Coat', hint: 'Balanced studio-grade reflection' },
            { id: 'liquid-metal', label: 'Liquid Metal', sub: 'Dynamic Specular Sheen', hint: 'Reactive brushed-aluminum look' },
            { id: 'holo-prism', label: 'Prism Refraction', sub: 'Spectral Light Filter', hint: 'Rainbow shifts when rotating' },
            { id: 'gold-plating', label: 'Gold Plating', sub: '24K Luxury Leafing', hint: 'Genuine metallic gold leaf' },
            { id: 'frost-glass', label: 'Frosted Glass', sub: 'Deep Diffusion Blur', hint: 'Translucent depth-based blur' },
            { id: 'neon-glow', label: 'Cyber Glow', sub: 'Vibrant Light Emission', hint: 'Bright edge glow effect' },
            { id: 'iridescent', label: 'Pearl Shine', sub: 'Iridescent Overcoat', hint: 'Soft color-shifting sheen' },
            { id: 'mirror-chrome', label: 'Mirror Chrome', sub: 'High Reflection Finish', hint: 'Polished metal reflection' }
        ];
        const TEXT_EFFECTS = [
            { id: 'none', label: 'Clean Text' },
            { id: 'shadow', label: 'Soft Drop Shadow' },
            { id: 'glow', label: 'Outer Neon Glow' },
            { id: 'outline', label: 'Stroke / Outline' },
            { id: 'emboss', label: '3D Embossed' }
        ];
        const COLORS = ['#FADADD', '#F8C8DC', '#D4688E', '#B2E8E4', '#81D8D0', '#3AAFA9', '#E8E0F5', '#C9B8E8', '#9D7EC9', '#F0D98A', '#C9A84C', '#F5F5DC', '#A8D5A2', '#2C2C4A', '#FFFFFF', '#130a21', '#ff007f', '#00e5ff', '#9d00ff', '#f3f000', '#4a0000', '#ed1d24', '#ffd700', '#e63946', '#457b9d', '#ff9f1c', '#b8860b', '#556b2f', '#8b0000', '#ff6b81', '#7bed9f', '#eccc68', '#70a1ff', '#8a483c', '#54634f', '#7a6352'];
        const FONT_STYLES = ['Poppins', 'Great Vibes', 'Montserrat', 'Dancing Script', 'Outfit', 'Rajdhani', 'Orbitron', 'Anton', 'Bangers', 'Racing Sans One', 'Cinzel', 'Bubblegum Sans', 'Special Elite'];
        const TEXT_POSITIONS = ['Center', 'Top', 'Bottom', 'Top Left', 'Top Right'];
        const TEXT_LAYOUTS = ['Horizontal', 'Vertical', 'Arc'];

        /* ─── STICKER ICON LIBRARY (Premium Minimalist Line Art) ─── */
        const SVG_PATHS = {
            phone: <>
                <path d="M14 8 L28 8 A4 4 0 0 1 32 12 L28 48 A4 4 0 0 1 24 52 L10 52 A4 4 0 0 1 6 48 L10 12 A4 4 0 0 1 14 8 Z" strokeLinejoin="round" />
                <path d="M13 12 h4 v7 h-4 z" strokeLinejoin="round" />
            </>,
            earbuds: <>
                <path d="M12 26 v8 a8 8 0 0 0 16 0 v-8 z" />
                <path d="M12 26 c 0 -8 16 -8 16 0 z" />
                <circle cx="20" cy="32" r="1.5" fill="#D4688E" stroke="none" />
                <path d="M10 26 h20" />
                <path d="M15 20 A3 3 0 0 1 20 20" />
                <path d="M20 20 A3 3 0 0 1 25 20" />
            </>,
            laptop: <>
                <path d="M6 38 h28 a2 2 0 0 1 2 2 v2 H4 v-2 a2 2 0 0 1 2 -2 z" strokeLinejoin="round" />
                <rect x="9" y="16" width="22" height="22" rx="2" strokeLinejoin="round" />
            </>,
            floral: <>
                <path d="M20 38 c0 0 -10 -4 -10 -15 c0 -6 10 -12 10 -12 c0 0 10 6 10 12 c0 11 -10 15 -10 15 z" />
                <path d="M20 38 c0 0 -5 -6 -5 -12" />
                <path d="M20 38 c0 0 5 -6 5 -12" />
            </>,
            marvel: <>
                <circle cx="20" cy="30" r="14" />
                <circle cx="20" cy="30" r="10" />
                <path d="M20 22 l2 6 h6 l-5 4 2 6 -5 -4 -5 4 2 -6 -5 -4 h6 z" fill="#D4688E" stroke="none" />
            </>,
            anime: <>
                <path d="M12 28 q 4 -6 8 0" />
                <path d="M20 28 q 4 -6 8 0" />
                <circle cx="16" cy="30" r="1.5" fill="#D4688E" stroke="none" />
                <circle cx="24" cy="30" r="1.5" fill="#D4688E" stroke="none" />
                <path d="M20 36 q -2 2 -4 0" />
            </>,
            cars: <>
                <path d="M10 36 h20" />
                <path d="M8 36 l2 -10 h8 l4 4 h6 l2 6" />
                <circle cx="14" cy="36" r="4" />
                <circle cx="26" cy="36" r="4" />
            </>,
            mandala: <>
                <circle cx="20" cy="30" r="14" />
                <circle cx="20" cy="30" r="8" />
                <path d="M20 12 v36 M2 30 h36" />
                <circle cx="20" cy="30" r="2" fill="#D4688E" stroke="none" />
            </>,
            disney: <>
                <circle cx="20" cy="32" r="10" />
                <circle cx="11" cy="21" r="7" />
                <circle cx="29" cy="21" r="7" />
            </>
        };

        function StickerIcon({ type, size = 120, active = false }) {
            return (
                <div className="sticker-container reveal" style={{
                    width: size, height: size,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto', position: 'relative'
                }}>
                    <svg viewBox="0 0 40 60" width={size * 0.8} height={size * 0.8} fill="none"
                        stroke={active ? "var(--pink-deep)" : "#D4688E"}
                        strokeWidth={active ? "1.6" : "1.2"}
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{
                            transition: 'all 0.5s ease',
                            opacity: active ? 1 : 0.7,
                            filter: active ? 'drop-shadow(0 8px 16px rgba(212, 104, 142, 0.4))' : 'drop-shadow(0 4px 8px rgba(212, 104, 142, 0.15))',
                            overflow: 'visible'
                        }}>
                        {SVG_PATHS[type] || <circle cx="20" cy="30" r="10" />}
                    </svg>
                </div>
            );
        }

        /* ── HOOKS ── */
        /* ── GLOBAL SCROLL REVEAL HOOK ── */
        function usePremiumInteractions() {
            useEffect(() => {
                if (window.matchMedia('(hover: none)').matches) return;

                const petal = document.createElement("div");
                petal.className = "cursor-petal";
                petal.innerHTML = `
                    <svg viewBox="0 0 100 100" class="cursor-petal-inner">
                        <path d="M50,5 C60,20 85,35 85,55 C85,85 50,95 50,95 C50,95 15,85 15,55 C15,35 40,20 50,5 Z" />
                    </svg>
                `;
                document.body.appendChild(petal);

                const scrollBar = document.createElement("div");
                scrollBar.className = "scroll-progress";
                document.body.appendChild(scrollBar);

                let mouseX = 0, mouseY = 0;
                let currentX = 0, currentY = 0;
                let currentRot = 0;

                const onMove = (e) => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    const target = e.target.closest("a, button, .product-card, .hero-product-card, .theme-card, .btn-primary, .nav-link, .glow-btn, .entry-btn");
                    if (target) petal.classList.add("hovering");
                    else petal.classList.remove("hovering");
                };

                const onScroll = () => {
                    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    scrollBar.style.width = (winScroll / height * 100) + "%";
                };

                const animate = () => {
                    // Smooth tracking
                    const lerp = 0.15;
                    currentX += (mouseX - currentX) * lerp;
                    currentY += (mouseY - currentY) * lerp;

                    // Dynamic Rotation based on velocity
                    const dx = mouseX - currentX;
                    const dy = mouseY - currentY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 1) {
                        const targetRot = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                        // Smooth rotation lerp
                        let diff = targetRot - currentRot;
                        while (diff < -180) diff += 360;
                        while (diff > 180) diff -= 360;
                        currentRot += diff * 0.12;
                    }

                    petal.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) rotate(${currentRot}deg)`;
                    requestAnimationFrame(animate);
                };

                window.addEventListener("mousemove", onMove, { passive: true });
                window.addEventListener("scroll", onScroll, { passive: true });
                const animId = requestAnimationFrame(animate);

                let cards = [];
                const handleCardMove = (e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left, y = e.clientY - rect.top;
                    const cx = rect.width / 2, cy = rect.height / 2;
                    const tiltX = (cy - y) / 12, tiltY = (x - cx) / 12;
                    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;
                };
                const handleCardLeave = (e) => { e.currentTarget.style.transform = ""; };

                const attachTilt = () => {
                    cards.forEach(c => { c.removeEventListener("mousemove", handleCardMove); c.removeEventListener("mouseleave", handleCardLeave); });
                    cards = document.body.querySelectorAll(".hero-product-card, .product-card, .theme-card, .mode-card");
                    cards.forEach(c => {
                        c.addEventListener("mousemove", handleCardMove);
                        c.addEventListener("mouseleave", handleCardLeave);
                    });
                };
                const mo = new MutationObserver(attachTilt);
                mo.observe(document.body, { childList: true, subtree: true });
                attachTilt();

                return () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("scroll", onScroll);
                    cancelAnimationFrame(animId);
                    petal.remove(); scrollBar.remove();
                    mo.disconnect();
                };
            }, []);
        }


        function useScrolled() {
            const [scrolled, setScrolled] = useState(false);
            useEffect(() => {
                const handleScroll = () => setScrolled(window.scrollY > 40);
                window.addEventListener('scroll', handleScroll);
                return () => window.removeEventListener('scroll', handleScroll);
            }, []);
            return scrolled;
        }

        // Shared global observer to reduce memory overhead
        let globalRevealObserver = null;
        const getGlobalObserver = () => {
            if (!globalRevealObserver) {
                globalRevealObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('active');
                            globalRevealObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
            }
            return globalRevealObserver;
        };

        function useGlobalReveal() {
            useEffect(() => {
                const observer = getGlobalObserver();
                const initReveal = () => {
                    const elements = document.querySelectorAll('.reveal:not(.active), .reveal-left:not(.active), .reveal-right:not(.active), .reveal-scale:not(.active)');
                    elements.forEach(el => observer.observe(el));
                };

                initReveal();
                const mutationObserver = new MutationObserver(initReveal);
                mutationObserver.observe(document.body, { childList: true, subtree: true });

                return () => {
                    observer.disconnect();
                    mutationObserver.disconnect();
                };
            }, []);
        }

        /* Seamless Page Transitions Wrapper */
        function PageTransition({ children, active }) {
            return (
                <div className={`page-transition ${active ? 'active' : ''}`}>
                    {children}
                </div>
            );
        }

        /* Reusable wrapper that simply outputs the correct class */
        function Reveal({ children, className = '', delay = 0, direction = 'up', style = {} }) {
            const dirClass = direction === 'left' ? 'reveal-left' : direction === 'right' ? 'reveal-right' : direction === 'scale' ? 'reveal-scale' : 'reveal';
            let delayClass = delay ? `delay-${Math.min(Math.ceil((delay * 100) / 8), 6)}` : '';
            return (
                <div className={`${dirClass} ${delayClass} ${className}`.trim()}
                    style={{ transitionDelay: delay ? `${delay}s` : undefined, ...style }}>
                    {children}
                </div>
            );
        }

        /* Staggered children reveal */
        function RevealGroup({ children, stagger = 0.09, direction = 'up', className = '', style = {} }) {
            const dirClass = direction === 'left' ? 'reveal-left' : direction === 'right' ? 'reveal-right' : direction === 'scale' ? 'reveal-scale' : 'reveal';
            return (
                <div className={className} style={style}>
                    {React.Children.map(children, (child, i) => {
                        if (!child) return null;
                        return React.cloneElement(child, {
                            className: `${dirClass} ${child.props.className || ''}`,
                            style: {
                                ...child.props.style,
                                transitionDelay: `${i * stagger}s`,
                            },
                        });
                    })}
                </div>
            );
        }



        /* ── TOAST ── */
        function Toast({ msg, onDone }) {
            useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
            return <div className="toast">✅ {msg}</div>;
        }
        function Petals({ count = 24 }) {
            const shapes = [
                "M50,50 Q50,20 65,15 Q80,10 75,30 Q95,30 90,45 Q85,60 70,55 Q75,80 50,80 Q25,80 30,55 Q15,60 10,45 Q5,30 25,30 Q20,10 35,15 Q50,20 50,50 Z",
                "M50,50 Q50,25 70,25 Q90,25 90,50 Q90,75 70,75 Q50,75 50,50 L50,50 Q25,50 25,70 Q25,90 50,90 Q75,90 75,70 Q75,50 50,50 L50,50 Q50,75 30,75 Q10,75 10,50 Q10,25 30,25 Q50,25 50,50 L50,50 Q75,50 75,30 Q75,10 50,10 Q25,10 25,30 Q25,50 50,50 Z",
                "M50,10 C60,20 90,30 90,50 C90,70 70,90 50,90 C30,90 10,70 10,50 C10,30 40,20 50,10 Z",
                "M50,40 C50,10 90,10 90,40 C90,70 50,95 50,95 C50,95 10,70 10,40 C10,10 50,10 50,40 Z"
            ];
            const colors = ["#FFB7C5", "#FFC0CB", "#F8C8DC", "#FFD1DC", "#FFF0F5"];

            // Memoize petal data so Math.random() is not called on every re-render
            const petals = React.useMemo(() =>
                Array.from({ length: count }).map((_, i) => ({
                    left: Math.random() * 100,
                    duration: 10 + Math.random() * 15,
                    delay: Math.random() * -25,
                    size: 10 + Math.random() * 14,
                    opacity: 0.3 + Math.random() * 0.5,
                    flipDuration: 3 + Math.random() * 5,
                    flipDelay: Math.random() * -5,
                    pathIdx: i % shapes.length,
                    colorIdx: i % colors.length,
                }))
            , [count]);

            return (
                <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
                    {petals.map((p, i) => (
                        <div
                            key={i}
                            className="petal-fall"
                            style={{
                                left: `${p.left}%`,
                                width: p.size,
                                height: p.size,
                                animation: `fallLoop ${p.duration}s linear infinite`,
                                animationDelay: `${p.delay}s`,
                                opacity: p.opacity
                            }}
                        >
                            <div
                                className="petal-flip"
                                style={{
                                    animation: `flutter3D ${p.flipDuration}s ease-in-out infinite`,
                                    animationDelay: `${p.flipDelay}s`
                                }}
                            >
                                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                                    <path d={shapes[p.pathIdx]} fill={colors[p.colorIdx]} />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        /* ─── CAMERA UI PRIMITIVES (defined once, outside render) ─── */
        function RealisticLens({ s = 28, isPeriscope = false }) {
            return (
                <div style={{
                    width: s, height: s, borderRadius: isPeriscope ? Math.round(s * 0.22) : '50%',
                    background: 'linear-gradient(145deg, #5a5a5a 0%, #1a1a1a 55%, #080808 100%)',
                    padding: Math.max(2, Math.round(s * 0.09)),
                    boxShadow: `0 ${Math.round(s*0.14)}px ${Math.round(s*0.4)}px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxSizing: 'border-box'
                }}>
                    <div style={{
                        width: '100%', height: '100%',
                        borderRadius: isPeriscope ? Math.round(s * 0.14) : '50%',
                        background: isPeriscope
                            ? 'linear-gradient(145deg,#aaa,#555 40%,#222 60%,#888)'
                            : 'conic-gradient(from 110deg, #ccc 0%, #666 20%, #222 45%, #555 65%, #bbb 80%, #ccc 100%)',
                        padding: Math.max(1.5, Math.round(s * 0.07)),
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '100%', height: '100%',
                            borderRadius: isPeriscope ? Math.round(s * 0.1) : '50%',
                            background: 'radial-gradient(circle at 30% 28%, #1a2536 0%, #020408 65%)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 68% 68%, rgba(79,70,229,0.28) 0%, transparent 60%)' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 22% 72%, rgba(20,184,166,0.14) 0%, transparent 55%)' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '36%', height: '36%', borderRadius: '50%', background: '#00000f', border: '1px solid rgba(255,255,255,0.07)' }} />
                            <div style={{ position: 'absolute', top: '16%', left: '16%', width: '20%', height: '20%', borderRadius: '50%', background: 'rgba(255,255,255,0.52)', filter: 'blur(1px)' }} />
                            <div style={{ position: 'absolute', top: '54%', left: '60%', width: '9%', height: '9%', borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
                        </div>
                    </div>
                </div>
            );
        }
        function CameraFlash({ s = 11 }) {
            return (
                <div style={{
                    width: s, height: s, borderRadius: '50%',
                    background: 'radial-gradient(circle at 36% 32%, #fffcf0 0%, #fde68a 42%, #a16207 100%)',
                    border: `${Math.max(1,Math.round(s*0.12))}px solid #6b5a2a`,
                    boxShadow: `0 0 ${Math.round(s*0.5)}px rgba(253,230,138,0.35), inset 0 1px 2px rgba(255,255,255,0.3)`,
                    flexShrink: 0
                }} />
            );
        }
        function CameraLiDAR({ s = 10 }) {
            return (
                <div style={{
                    width: s, height: s, borderRadius: '50%',
                    background: 'radial-gradient(circle at 34% 33%, #4338ca 0%, #1e1b4b 55%, #080612 100%)',
                    border: `${Math.max(1,Math.round(s*0.12))}px solid #4f46e5`,
                    boxShadow: `inset 0 0 ${Math.round(s*0.4)}px #000, 0 0 ${Math.round(s*0.5)}px rgba(99,102,241,0.22)`,
                    flexShrink: 0
                }} />
            );
        }

        /* ─── PRODUCT PREVIEW ─── */
        function ProductPreview({ product, selectedModel, design = {}, size = 180, rotationY = 0, isEasyMode = false }) {
            // Detect mobile to reduce GPU-intensive effects
            const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

            const w = product === 'phone' ? size * 0.75 : product === 'earbuds' ? size * 0.95 : size * 1.4;
            const h = product === 'phone' ? size * 1.5 : product === 'earbuds' ? size * 1.1 : size * 0.95;
            const r = product === 'phone' ? (size * 0.1) : product === 'earbuds' ? (size * 0.22) : (size * 0.06);
            const pattern = design.pattern || 'none';
            const effect = design.effect || 'none';
            const safeBg = design.bgColor || '#F8C8DC';

            return (
                <div style={{ position: 'relative', width: w, height: h, margin: '0 auto', perspective: 1000 }}>
                    <div style={{
                        position: 'relative', width: '100%', height: '100%', borderRadius: r,
                        background: safeBg, overflow: 'hidden',
                        transform: `rotateY(${rotationY}deg)`,
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: effect === 'neon-glow'
                            ? `0 0 40px ${safeBg}88, 0 12px 48px rgba(0,0,0,0.2)`
                            : `0 12px 48px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.05)`,
                        filter: effect === 'neon-glow' ? 'brightness(1.1) contrast(1.1)' : 'none'
                    }}>
                        {/* ─── BASE DESIGN LAYER ─── */}
                        {design?.img ? (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: `url("${(typeof design.img === 'string' && design.img.trim() !== '') ? design.img : FALLBACK_IMG}") center/cover no-repeat`,
                                filter: 'brightness(0.95) contrast(1.05)',
                                zIndex: 1
                            }} />
                        ) : null}

                        {/* ─── PATTERN OVERLAY ─── */}
                        {pattern !== 'none' && (
                            <div className={`pattern-layer pattern-${pattern}`} style={{
                                position: 'absolute', inset: 0, opacity: 0.4, zIndex: 2,
                                mixBlendMode: isMobile ? 'normal' : 'multiply'
                            }} />
                        )}

                        {/* ─── SPECIALIZED VISUAL EFFECTS (desktop only for perf) ─── */}
                        {!isMobile && effect === 'holo-prism' && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: `linear-gradient(${45 + rotationY * 0.5}deg, #FF00FF33, #00FFFF33, #FFFF0033, #FF00FF33)`,
                                backgroundSize: '200% 200%',
                                mixBlendMode: 'color-dodge',
                                opacity: 0.7, pointerEvents: 'none',
                                animation: 'shimmer 4s linear infinite'
                            }} />
                        )}
                        {!isMobile && effect === 'liquid-metal' && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: `linear-gradient(${135 + rotationY * 0.2}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)`,
                                mixBlendMode: 'overlay', opacity: 0.9, pointerEvents: 'none'
                            }} />
                        )}
                        {effect === 'gold-plating' && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: 'url("/images/pattern_gold_dust.png"), linear-gradient(135deg, #d4af37, #f9e29c, #d4af37)',
                                mixBlendMode: isMobile ? 'normal' : 'color-burn',
                                opacity: isMobile ? 0.4 : 0.6, pointerEvents: 'none'
                            }} />
                        )}
                        {effect === 'frost-glass' && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                backdropFilter: isMobile ? 'none' : 'blur(8px)',
                                pointerEvents: 'none',
                                boxShadow: 'inset 0 0 40px rgba(255,255,255,0.2)'
                            }} />
                        )}
                        {!isMobile && effect === 'iridescent' && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: `linear-gradient(${30 + rotationY * 0.8}deg, rgba(255, 182, 193, 0.4), rgba(173, 216, 230, 0.4), rgba(221, 160, 221, 0.4))`,
                                mixBlendMode: 'color-burn', opacity: 0.85, pointerEvents: 'none'
                            }} />
                        )}
                        {!isMobile && effect === 'mirror-chrome' && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 5,
                                background: `linear-gradient(${180 + rotationY * 0.5}deg, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.5) 45%, rgba(50,50,50,0.4) 50%, rgba(150,150,150,0.6) 80%, rgba(255,255,255,0.8) 100%)`,
                                mixBlendMode: 'luminosity', opacity: 0.9, pointerEvents: 'none'
                            }} />
                        )}

                        {/* ─── STUDIO LIGHTING GLOSS (reduced on mobile) ─── */}
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: `linear-gradient(${110 + rotationY * 0.4}deg, rgba(255,255,255,0.45) 0%, transparent 45%, rgba(255,255,255,0.08) 60%, transparent 100%)`,
                            mixBlendMode: isMobile ? 'normal' : 'overlay', pointerEvents: 'none',
                            opacity: isMobile ? 0.3 : (effect === 'satin-gloss' || effect === 'neon-glow' ? 1 : 0.7)
                        }} />
                        {!isMobile && (effect === 'satin-gloss' || effect === 'neon-glow') && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 12,
                                background: `linear-gradient(${200 + rotationY * 0.6}deg, rgba(255,255,255,0.4) 0%, transparent 30%)`,
                                mixBlendMode: 'screen', pointerEvents: 'none'
                            }} />
                        )}
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 11,
                            background: `linear-gradient(${250 + rotationY * 0.2}deg, rgba(0,0,0,0.12) 0%, transparent 35%, rgba(0,0,0,0.05) 100%)`,
                            mixBlendMode: isMobile ? 'normal' : 'multiply', pointerEvents: 'none'
                        }} />

                        {/* ─── TEXT LAYER (EMBOSSED STYLE) ─── */}
                        {design.text && (
                            <div style={{
                                position: 'absolute', zIndex: 15, pointerEvents: 'none',
                                ...(design.textPosition === 'Top' ? { top: '15%', left: '50%', transform: `translateX(-50%) translate(${design.textX || 0}px, ${design.textY || 0}px) rotate(${design.textRotation || 0}deg)` } :
                                    design.textPosition === 'Bottom' ? { bottom: '15%', left: '50%', transform: `translateX(-50%) translate(${design.textX || 0}px, ${design.textY || 0}px) rotate(${design.textRotation || 0}deg)` } :
                                        design.textPosition === 'Top Left' ? { top: '15%', left: '15%', transform: `translate(${design.textX || 0}px, ${design.textY || 0}px) rotate(${design.textRotation || 0}deg)` } :
                                            design.textPosition === 'Top Right' ? { top: '15%', right: '15%', transform: `translate(${design.textX || 0}px, ${design.textY || 0}px) rotate(${design.textRotation || 0}deg)` } :
                                                { top: '50%', left: '50%', transform: `translate(-50%,-50%) translate(${design.textX || 0}px, ${design.textY || 0}px) rotate(${design.textRotation || 0}deg)` }),
                                fontSize: (design.textSize || 16) * (w / 180),
                                fontFamily: design.fontStyle || 'Montserrat, sans-serif',
                                color: design.textColor || '#000',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                textShadow: effect === 'neon-glow' ? `0 0 10px ${design.bgColor}, 0 0 20px ${design.bgColor}` : '0 1px 2px rgba(255,255,255,0.4), 0 -1px 2px rgba(0,0,0,0.2)',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                ...(design.textLayout === 'Vertical' ? { writingMode: 'vertical-rl' } : {}),
                            }}>{design.text}</div>
                        )}

                        {/* ─── UPLOADED IMAGE LAYER ─── */}
                        {design.uploadedImage && design.uploadedImage.src && (
                            <div style={{
                                position: 'absolute', zIndex: 16, pointerEvents: 'none',
                                top: '50%', left: '50%',
                                transform: `translate(-50%,-50%) translate(${design.uploadedImage.x || 0}px, ${design.uploadedImage.y || 0}px) rotate(${design.uploadedImage.rotate || 0}deg) scale(${(design.uploadedImage.scale || 100) / 100})`,
                                transition: 'transform 0.1s linear',
                                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <img src={design.uploadedImage.src} style={{ maxWidth: '100%', maxHeight: '100%', pointerEvents: 'none' }} />
                            </div>
                        )}

                        {/* ─── FREE DRAW STUDIO LAYER ─── */}
                        {design.drawData && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 17, pointerEvents: 'none',
                                background: `url(${design.drawData}) center/contain no-repeat`
                            }} />
                        )}


                        {/* ─── PRODUCT HARDWARE OVERLAY (BEZELS/CUTOUTS) ─── */}
                        {!isEasyMode && product === 'phone' && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
                                {/* Screen Bezel */}
                                <div style={{ position: 'absolute', inset: 0, border: `${size * 0.04}px solid rgba(0,0,0,0.85)`, borderRadius: r }} />
                                
                                {/* Dynamic Camera Island based on Model (Hyper-Realistic 2026 Styles) */}
                                {(() => {
                                    const bz = size * 0.04; 
                                    const cameraGap = 10;   
                                    const safeLeft = bz + cameraGap;
                                    const safeTop = bz + cameraGap;

                                    // Outer components ReliableLens, CameraFlash, CameraLiDAR are used for performance.

                                if (selectedModel?.cameraStyle === 'samsung-ultra') {
                                        const L = Math.max(20, Math.round(size * 0.13));
                                        return (
                                            <div style={{
                                                position: 'absolute', top: safeTop - 2, left: safeLeft - 2,
                                                background: 'rgba(8,8,8,0.97)',
                                                borderRadius: 18,
                                                boxShadow: '0 10px 32px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.04)',
                                                border: '1.5px solid rgba(255,255,255,0.04)',
                                                padding: 9,
                                                display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-start'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <RealisticLens s={L} />
                                                    <RealisticLens s={L} />
                                                    <RealisticLens s={L} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 2 }}>
                                                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'radial-gradient(circle, #f87171, #7f1d1d)', border: '1px solid #450a0a', boxShadow: '0 0 5px rgba(239,68,68,0.3)', flexShrink: 0 }} />
                                                    <CameraFlash s={Math.round(L * 0.68)} />
                                                    <RealisticLens s={Math.round(L * 0.7)} isPeriscope={true} />
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#080808', border: '1px solid #252525' }} />
                                                </div>
                                            </div>
                                        );

                                    } else if (selectedModel?.cameraStyle === 'triple-island') {
                                        const L = Math.max(18, Math.round(size * 0.12));
                                        const bump = Math.round(L * 2.95);
                                        const pad = Math.round(bump * 0.09);
                                        return (
                                            <div style={{
                                                position: 'absolute', top: safeTop - 2, left: safeLeft - 2,
                                                width: bump, height: bump,
                                                background: 'linear-gradient(150deg, #1c1c1e 0%, #0a0a0c 100%)',
                                                borderRadius: Math.round(bump * 0.27),
                                                boxShadow: '0 10px 34px rgba(0,0,0,0.72), inset 0 0 0 1px rgba(255,255,255,0.06)',
                                                border: '1.5px solid rgba(255,255,255,0.06)',
                                            }}>
                                                <div style={{ position: 'absolute', top: pad, left: pad }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', bottom: pad, left: pad }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', top: '50%', right: pad, transform: 'translateY(-50%)' }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', top: pad + Math.round(L * 0.18), left: '50%', transform: 'translateX(-50%)' }}><CameraFlash s={Math.round(L * 0.4)} /></div>
                                                <div style={{ position: 'absolute', bottom: pad + Math.round(L * 0.18), left: '50%', transform: 'translateX(-50%)' }}><CameraLiDAR s={Math.round(L * 0.36)} /></div>
                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: Math.round(L * 0.18), height: Math.round(L * 0.18), borderRadius: '50%', background: '#0a0a0c', border: '1px solid #222' }} />
                                            </div>
                                        );
                                    } else if (selectedModel?.cameraStyle === 'dual-diagonal') {
                                        const L = Math.max(16, Math.round(size * 0.112));
                                        const bump = Math.round(L * 2.55);
                                        const pad = Math.round(bump * 0.11);
                                        return (
                                            <div style={{
                                                position: 'absolute', top: safeTop - 2, left: safeLeft - 2,
                                                width: bump, height: bump,
                                                background: 'linear-gradient(150deg, #1c1c1e 0%, #0a0a0c 100%)',
                                                borderRadius: Math.round(bump * 0.25),
                                                boxShadow: '0 8px 28px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)',
                                                border: '1.5px solid rgba(255,255,255,0.05)',
                                            }}>
                                        <div style={{ position: 'absolute', top: pad, left: pad }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', bottom: pad, right: pad }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}><CameraFlash s={Math.round(L * 0.4)} /></div>
                                            </div>
                                        );
                                    } else if (selectedModel?.cameraStyle === 'vertical-dots') {
                                        const L = Math.max(16, Math.round(size * 0.107));
                                        const gap = Math.round(L * 0.2);
                                        const px = Math.round(L * 0.22);
                                        const py = Math.round(L * 0.25);
                                        return (
                                            <div style={{
                                                position: 'absolute', top: safeTop, left: safeLeft,
                                                background: 'rgba(8,8,8,0.97)',
                                                borderRadius: 999,
                                                padding: `${py}px ${px}px`,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.65)', border: '1.5px solid rgba(255,255,255,0.04)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap
                                            }}>
                                                <RealisticLens s={L} />
                                                <RealisticLens s={L} />
                                                <RealisticLens s={L} />
                                            </div>
                                        );
                                    } else if (selectedModel?.cameraStyle === 'visor') {
                                        const L = Math.round(size * 0.115);
                                        return (
                                            <div style={{
                                                position: 'absolute', top: '11%', left: bz, right: bz, height: Math.round(size * 0.2),
                                                background: 'linear-gradient(180deg, #202020, #3e3e3e 14%, #1e1e1e 55%, #060606)',
                                                borderTop: '2px solid #484848', borderBottom: '2px solid #0d0d0d',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 6px 28px rgba(0,0,0,0.85)', zIndex: 25
                                            }}>
                                                <div style={{ 
                                                    height: '80%', background: 'rgba(0,0,0,0.95)',
                                                    borderRadius: 999,
                                                    padding: `0 ${Math.round(L * 0.55)}px`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    gap: Math.round(L * 0.45),
                                                    border: '1px solid #252525', boxShadow: 'inset 0 2px 10px #000'
                                                }}>
                                                    <RealisticLens s={L} />
                                                    <div style={{ width: 32, height: 13, borderRadius: 7, border: '1.5px solid #1e1e1e', background: 'linear-gradient(to bottom, #161616, #000)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)' }} />
                                                    <RealisticLens s={Math.round(L * 0.8)} />
                                                    <CameraFlash s={Math.round(L * 0.58)} />
                                                </div>
                                            </div>
                                        );
                                    } else if (selectedModel?.cameraStyle === 'circular-island') {
                                        const L = Math.max(15, Math.round(size * 0.1));
                                        const bump = Math.round(L * 3.3);
                                        return (
                                            <div style={{
                                                position: 'absolute', top: safeTop + 2, left: '50%', transform: 'translateX(-50%)',
                                                width: bump, height: bump,
                                                background: 'radial-gradient(circle at 36% 36%, #242424, #0e0e0e 60%, #050505)',
                                                borderRadius: '50%',
                                                boxShadow: '0 12px 36px rgba(0,0,0,0.75)', border: '2.5px solid #1a1a1a',
                                            }}>
                                                <div style={{ position: 'absolute', top: '13%', left: '13%' }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', top: '13%', right: '13%' }}><RealisticLens s={L} /></div>
                                                <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)' }}><RealisticLens s={L} /></div>
                                            </div>
                                        );
                                    } else if (selectedModel?.cameraStyle === 'glyph') {
                                        const L = Math.max(15, Math.round(size * 0.1));
                                        return (
                                            <div style={{ position: 'absolute', top: safeTop, left: safeLeft, display: 'flex', flexDirection: 'column', gap: 13 }}>
                                                <div style={{
                                                    width: L + 12, borderRadius: 22,
                                                    border: '2px solid rgba(255,255,255,0.06)',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    justifyContent: 'center', gap: 9, padding: `${Math.round(L*0.28)}px ${Math.round(L*0.15)}px`,
                                                    background: 'rgba(3,3,3,0.97)', boxShadow: 'inset 0 0 12px #000, 0 4px 16px rgba(0,0,0,0.5)'
                                                }}>
                                                    <RealisticLens s={L} />
                                                    <RealisticLens s={L} />
                                                </div>
                                                <div style={{ width: 3, height: 36, background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.22))', boxShadow: '0 0 14px rgba(255,255,255,0.9)', marginLeft: Math.round(L * 0.45 + 3), borderRadius: 4 }} />
                                            </div>
                                        );
                                    }
                                    // ── Default generic 2-lens ──
                                    const L = Math.max(15, Math.round(size * 0.108));
                                    const bump = Math.round(L * 2.6);
                                    const pad = Math.round(bump * 0.1);
                                    return product === 'phone' ? (
                                        <div style={{
                                            position: 'absolute', top: safeTop - 2, left: safeLeft - 2,
                                            width: bump, height: bump,
                                            background: 'rgba(10,10,10,0.96)', borderRadius: Math.round(bump * 0.24),
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            <div style={{ position: 'absolute', top: pad, left: pad }}><RealisticLens s={L} /></div>
                                            <div style={{ position: 'absolute', bottom: pad, right: pad }}><RealisticLens s={L} /></div>
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}><CameraFlash s={Math.round(L * 0.36)} /></div>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}

                        {!isEasyMode && product === 'earbuds' && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
                                {/* Lid Line */}
                                <div style={{ position: 'absolute', top: '32%', left: 0, right: 0, height: 1.5, background: 'rgba(0,0,0,0.15)', boxShadow: '0 1px 0 rgba(255,255,255,0.1)' }} />
                                {/* Charging LED */}
                                <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)', width: 2, height: 2, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
                            </div>
                        )}

                        {!isEasyMode && product === 'laptop' && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
                                {/* Logo Cutout (Circle) */}
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: size * 0.2, height: size * 0.2, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.05)' }} />
                            </div>
                        )}
                        

                    </div>
                </div>
            );
        }

        /* ——— THEMES GALLERY PAGE ——— */
        const THEME_CATALOG = [
            {
                id: 'anime', name: 'Anime', emoji: '/images/quiet_sunset_anime.png',
                tag: 'Fan Favourites', mood: 'Bold & Expressive',
                accent: '#C084FC', accent2: '#F9A8D4',
                img: '/images/quiet_sunset_anime.png',
                config: {
                    colors: ['#130a21', '#ff007f', '#00e5ff', '#9d00ff', '#f3f000'],
                    fonts: ['Rajdhani', 'Orbitron'],
                    patterns: ['none', 'cyber', 'speed'],
                    effects: ['none', 'neon-glow', 'holo']
                },
                productDesigns: {
                    phone: [
                        { id: 'goku', name: 'Goku', sub: 'Legendary Saiyan', img: '/images/goku.jpg' },
                        { id: 'itachi', name: 'Itachi', sub: 'Uchiha Legacy', img: '/images/itachi.jpg' },
                        { id: 'n_and_s', name: 'Naruto & Sasuke', sub: 'Eternal Rivals', img: '/images/n_and_s.jpg' },
                        { id: 'naruto_multi', name: 'Naruto Sage', sub: 'Six Paths Power', img: '/images/narutoooooooooo.jpg' },
                    ],
                    earbuds: [
                        { id: 'akatsuki', name: 'Akatsuki', sub: 'Red Cloud Elite', img: '/images/akatsuki.jpg' },
                        { id: 'ds', name: 'Demon Slayer', sub: 'Nichirin Sword Guard', img: '/images/ds.jpg' },
                        { id: 'eren', name: 'Eren Jaeger', sub: 'Attack Titan', img: '/images/eren_jaeger.jpg' },
                        { id: 'anime_gear', name: 'Anime Gear', sub: 'Limited Edition', img: '/images/anime_gear.jpg' },
                    ],
                    laptop: [
                        { id: 'naruto_l', name: 'Naruto', sub: 'Hokage Dreams', img: '/images/naruto.jpg' },
                        { id: 'sasuke_l', name: 'Sasuke', sub: 'Shadow Shinobi', img: '/images/sasuke.jpg' },
                        { id: 'tanjiro_l', name: 'Tanjiro', sub: 'Water Breathing', img: '/images/tanjiro.jpg' },
                        { id: 'zenitsu_l', name: 'Zenitsu', sub: 'Thunder Breathing', img: '/images/zenitsu.jpg' },
                    ]
                }
            },
            {
                id: 'marvel', name: 'Marvel', emoji: '/images/theme_marvel_new.jpg',
                tag: 'Superhero Edition', mood: 'Bold & Powerful',
                accent: '#E63946', accent2: '#F1FAEE',
                img: '/images/theme_marvel_new.jpg',
                config: {
                    colors: ['#4a0000', '#ed1d24', '#ffd700', '#000000', '#ffffff'],
                    fonts: ['Anton', 'Bangers'],
                    patterns: ['none', 'marvel-web', 'halftone'],
                    effects: ['none', 'glossy', 'hard-shadow']
                },
                productDesigns: {
                    phone: [
                        { id: 'batman', name: 'Batman Noir', sub: 'Gotham Knight', img: '/images/batman.jpg' },
                        { id: 'captain', name: 'Captain America', sub: 'First Avenger', img: '/images/captain_america.jpg' },
                        { id: 'ironman_p', name: 'Iron Man', sub: 'Stark Tech', img: '/images/iron_man_phone_case.jpg' },
                        { id: 'spiderman_p', name: 'Spider-Man', sub: 'Web Slinger', img: '/images/spider_man_phone_case.jpg' },
                    ],
                    earbuds: [
                        { id: 'avengers', name: 'Avengers', sub: 'Earth\'s Mightiest', img: '/images/avengers.jpg' },
                        { id: 'marvel_lg', name: 'Marvel Legacy', sub: 'Classic Comic', img: '/images/marvel_legacy.jpg' },
                        { id: 'ironman_a', name: 'Iron ManPods', sub: 'Arc Reactor', img: '/images/iron_man_airpods.jpg' },
                        { id: 'spiderman_a', name: 'Spider-Buds', sub: 'Spidey Sense', img: '/images/spiderman_ear_buds.jpg' },
                    ],
                    laptop: [
                        { id: 'deadpool', name: 'Deadpool', sub: 'Merc with a Mouth', img: '/images/deadpool.jpg' },
                        { id: 'ironman_l', name: 'Iron Man', sub: 'Invincible Armor', img: '/images/iron_man.jpg' },
                        { id: 'moonknight', name: 'Moon Knight', sub: 'Fist of Khonshu', img: '/images/moon_knight.jpg' },
                        { id: 'spiderman_l', name: 'Spider-Man', sub: 'Wall Crawler', img: '/images/spider_man.jpg' },
                    ]
                }
            },
            {
                id: 'cars', name: 'Cars', emoji: '/images/theme_cars_new.png',
                tag: 'Speed & Style', mood: 'Sleek & Dynamic',
                accent: '#FACC15', accent2: '#3B82F6',
                img: '/images/theme_cars_new.png',
                config: {
                    colors: ['#e63946', '#457b9d', '#ff9f1c', '#e0e6ed', '#111'],
                    fonts: ['Racing Sans One'],
                    patterns: ['none', 'carbon', 'stripes'],
                    effects: ['none', 'metallic', 'motion-blur']
                },
                productDesigns: {
                    phone: [
                        { id: 'p911', name: 'Porsche 911', sub: 'German Engineering', img: '/images/911.jpg' },
                        { id: 'bmw_p', name: 'BMW M Series', sub: 'The Ultimate Machine', img: '/images/phone_case_bmw.jpg' },
                        { id: 'mazda_p', name: 'Mazda Spirit', sub: 'Jinba Ittai', img: '/images/mazda.jpg' },
                        { id: 'porsche_p', name: 'Porsche GT', sub: 'Track Ready', img: '/images/porsche.jpg' },
                    ],
                    earbuds: [
                        { id: 'bmw_e', name: 'BMW Elite', sub: 'M-Performance', img: '/images/bmwwwwwwww.jpg' },
                        { id: 'cars_e', name: 'Rust-eze', sub: 'Lightning Style', img: '/images/cars.jpg' },
                        { id: 'f1_e', name: 'Formula 1', sub: 'Grand Prix Vibe', img: '/images/f1.jpg' },
                        { id: 'gtr_e', name: 'Nissan GTR', sub: 'Godzilla', img: '/images/gtr.jpg' },
                    ],
                    laptop: [
                        { id: 'bmw_l1', name: 'BMW M4', sub: 'Modern Luxury', img: '/images/another_bmv.jpg' },
                        { id: 'bmw_l2', name: 'BMW Classic', sub: 'Iconic Kidney Grille', img: '/images/bmw.jpg' },
                        { id: 'lambo_l', name: 'Lamborghini', sub: 'Raging Bull', img: '/images/lambo.jpg' },
                        { id: 'porsche_l', name: 'Porsche 911', sub: 'Timeless Silhouette', img: '/images/prosche.jpg' },
                    ]
                }
            },
            {
                id: 'mandala', name: 'Mandala', emoji: '/images/theme_mandala_new.webp',
                tag: 'Sacred Geometry', mood: 'Calm & Intricate',
                accent: '#10B981', accent2: '#D1FAE5',
                img: '/images/theme_mandala_new.webp',
                config: {
                    colors: ['#b8860b', '#556b2f', '#8b0000', '#faf7f2', '#2f4f4f'],
                    fonts: ['Cinzel'],
                    patterns: ['none', 'mandala1', 'mandala2'],
                    effects: ['none', 'gold-foil', 'emboss-fx']
                },
                productDesigns: {
                    phone: [
                        { id: 'm_e', name: 'Zen Bloom', sub: 'Inner Peace', img: '/images/e.jpg' },
                        { id: 'm_f', name: 'Sacred Path', sub: 'Harmonious Geometry', img: '/images/f.jpg' },
                        { id: 'm_g', name: 'Cosmic Wheel', sub: 'Universal Balance', img: '/images/g.png' },
                        { id: 'm_h', name: 'Luxe Mandala', sub: 'Elegant Patterns', img: '/images/h.jpg' },
                    ],
                    earbuds: [
                        { id: 'm_i', name: 'Mandala I', sub: 'Compact Peace', img: '/images/i.jpg' },
                        { id: 'm_j', name: 'Mandala J', sub: 'Spiritual Bud', img: '/images/j.jpg' },
                        { id: 'm_k', name: 'Mandala K', sub: 'Radiant Energy', img: '/images/k.jpg' },
                        { id: 'm_l', name: 'Mandala L', sub: 'Golden Ratio', img: '/images/l.jpg' },
                    ],
                    laptop: [
                        { id: 'm_a', name: 'Mandala Alpha', sub: 'Workspace Zen', img: '/images/a.jpg' },
                        { id: 'm_b', name: 'Mandala Beta', sub: 'Creative Flow', img: '/images/b.jpg' },
                        { id: 'm_c', name: 'Mandala Gamma', sub: 'Mindful Tech', img: '/images/c.jpg' },
                        { id: 'm_d', name: 'Mandala Delta', sub: 'Symmetry in Motion', img: '/images/d.jpg' },
                    ]
                }
            },
            {
                id: 'floral', name: 'Floral', emoji: '/images/theme_floral_new.jpg',
                tag: 'Nature in Bloom', mood: 'Soft & Romantic',
                accent: '#F472B6', accent2: '#FDF2F8',
                img: '/images/theme_floral_new.jpg',
                config: {
                    colors: ['#ffebd6', '#fbcadd', '#a3e4d7', '#eaddf0', '#fdfaf8'],
                    fonts: ['Dancing Script', 'Outfit'],
                    patterns: ['none', 'petals', 'roses'],
                    effects: ['none', 'glossy']
                },
                productDesigns: {
                    phone: [
                        { id: 'f_p1', name: 'Spring Dream', sub: 'Fresh Bloom', img: '/images/flowerrrrrrr.jpg' },
                        { id: 'f_p2', name: 'Summer Meadow', sub: 'Wild Flowers', img: '/images/flowerrrrrrrrrrrrr.jpg' },
                        { id: 'f_p3', name: 'Petal Soft', sub: 'Delicate Texture', img: '/images/petal_soft.jpg' },
                        { id: 'f_p4', name: 'Mogra Spirit', sub: 'Traditional Scent', img: '/images/mogra.jpg' },
                    ],
                    earbuds: [
                        { id: 'f_e1', name: 'Floral Nili', sub: 'Blue Blossom', img: '/images/nili.jpg' },
                        { id: 'f_e2', name: 'Floral Dhili', sub: 'Soft Petals', img: '/images/dhili.jpg' },
                        { id: 'f_e3', name: 'Floral Pili', sub: 'Yellow Radiance', img: '/images/pili.jpg' },
                        { id: 'f_e4', name: 'Floral Tili', sub: 'Garden Bud', img: '/images/tili.jpg' },
                    ],
                    laptop: [
                        { id: 'f_l1', name: 'Floral Skin', sub: 'Botanical Beauty', img: '/images/floral.jpg' },
                        { id: 'f_l2', name: 'Flower Power', sub: 'Vibrant Bloom', img: '/images/flower.jpg' },
                        { id: 'f_l3', name: 'Lily Essence', sub: 'Elegant White', img: '/images/lily.jpg' },
                        { id: 'f_l4', name: 'Phool Art', sub: 'Artistic Nature', img: '/images/phool.jpg' },
                    ]
                }
            },
            {
                id: 'disney', name: 'Disney', emoji: '/images/theme_disney_new.jpg',
                tag: 'Magic Collection', mood: 'Magical & Whimsical',
                accent: '#6EE7B7', accent2: '#FDE68A',
                img: '/images/theme_disney_new.jpg',
                config: {
                    colors: ['#ff6b81', '#7bed9f', '#eccc68', '#70a1ff', '#ffffff'],
                    fonts: ['Bubblegum Sans'],
                    patterns: ['none', 'sparkles', 'polka'],
                    effects: ['none', 'glassmorphism', 'candy-gloss']
                },
                productDesigns: {
                    phone: [
                        { id: 'dumbo_p', name: 'Dumbo', sub: 'Fly High', img: '/images/dumbo.jpg' },
                        { id: 'elsa_p', name: 'Elsa', sub: 'Let it Go', img: '/images/elsa.jpg' },
                        { id: 'lionking_p', name: 'Lion King', sub: 'Hakuna Matata', img: '/images/lion_king.jpg' },
                        { id: 'mickey_p', name: 'Mickey Mouse', sub: 'The Original', img: '/images/mickey_mouse.jpg' },
                    ],
                    earbuds: [
                        { id: 'bear_e', name: 'Winnie', sub: 'Hundred Acre Wood', img: '/images/bear.jpg' },
                        { id: 'mini_e', name: 'Minnie', sub: 'Polka Dot Style', img: '/images/mini_mouse.jpg' },
                        { id: 'minni_e', name: 'Classic Minnie', sub: 'Red & White', img: '/images/minni.jpg' },
                        { id: 'ohana_e', name: 'Ohana v2', sub: 'Stitch & Soul', img: '/images/ohana_v2.jpg' },
                    ],
                    laptop: [
                        { id: 'deer_l', name: 'Bambi', sub: 'Forest Magic', img: '/images/deer.jpg' },
                        { id: 'ohana_l', name: 'Stitch', sub: 'Family First', img: '/images/ohana.jpg' },
                        { id: 'pinaco_l', name: 'Pinocchio', sub: 'Always Be True', img: '/images/pinaco.jpg' },
                        { id: 'rabbit_l', name: 'Thumper', sub: 'Playful Nature', img: '/images/rabbit.jpg' },
                    ]
                }
            },

        ];

        /* ——— IMAGE DESIGN CARD ——— */
        function DesignCard({ design, themeAccent, onSelect, index }) {
            const [hov, setHov] = useState(false);
            const [imgErr, setImgErr] = useState(false);

            return (
                <div
                    onMouseEnter={() => setHov(true)}
                    onMouseLeave={() => setHov(false)}
                    onClick={() => onSelect(design)}
                    style={{
                        background: 'var(--white)',
                        borderRadius: 20,
                        border: `2px solid ${hov ? themeAccent + 'cc' : 'rgba(0,0,0,0.05)'}`,
                        overflow: 'hidden', cursor: 'pointer',
                        transform: hov ? 'translateY(-8px) scale(1.04)' : 'translateY(0) scale(1)',
                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1.0)',
                        boxShadow: hov
                            ? `0 24px 56px rgba(0,0,0,0.14), 0 0 0 4px ${themeAccent}28`
                            : '0 4px 20px rgba(0,0,0,0.07)',
                        position: 'relative',
                        animation: `fadeSlideUp 0.5s ${index * 0.07}s cubic-bezier(.22,.68,0,1.2) both`,
                    }}>

                    {/* Badge */}
                    {design.tag && (
                        <div style={{
                            position: 'absolute', top: 12, left: 12, zIndex: 5,
                            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
                            borderRadius: 50, padding: '3px 12px',
                            fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 800,
                            letterSpacing: '0.10em', textTransform: 'uppercase',
                            color: design.tag === 'Popular' ? '#D4688E' : design.tag === 'New' ? '#0EA5E9' : design.tag === 'Premium' ? '#D97706' : '#7C3AED',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                        }}>{design.tag}</div>
                    )}

                    {/* Image area */}
                    <div style={{
                        height: 200, position: 'relative', overflow: 'hidden',
                        background: `linear-gradient(135deg, ${themeAccent}33, ${themeAccent}11)`,
                    }}>
                        {/* Real image */}
                        {!imgErr ? (
                            <img
                                src={design.img}
                                alt={design.name}
                                onError={() => setImgErr(true)}
                                style={{
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    display: 'block',
                                    transform: hov ? 'scale(1.08)' : 'scale(1)',
                                    transition: 'transform 0.5s cubic-bezier(.22,.68,0,1.2)',
                                    filter: hov ? 'brightness(0.82)' : 'brightness(0.92)',
                                }}
                            />
                        ) : (
                            /* Fallback gradient */
                            <div style={{
                                width: '100%', height: '100%',
                                background: `linear-gradient(135deg, ${themeAccent}, ${themeAccent}88)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 52,
                            }}>🎨</div>
                        )}

                        {/* Permanent gradient overlay at bottom for readability */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.52), transparent)',
                            zIndex: 2,
                        }} />

                        {/* Hover CTA overlay */}
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 3,
                            background: 'rgba(0,0,0,0.22)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: hov ? 1 : 0,
                            transition: 'opacity 0.25s',
                        }}>
                            <div style={{
                                background: themeAccent, backdropFilter: 'blur(10px)',
                                color: '#fff', borderRadius: 50,
                                padding: '10px 24px',
                                fontFamily: 'Montserrat,sans-serif', fontSize: 12, fontWeight: 800,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                boxShadow: `0 6px 20px ${themeAccent}88`,
                                transform: hov ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.9)',
                                transition: 'transform 0.3s cubic-bezier(.22,.68,0,1.2)',
                            }}>Customize This →</div>
                        </div>
                    </div>
                    {/* Card info */}
                    <div style={{ padding: '16px 18px 20px' }}>
                        <div style={{
                            fontFamily: 'Montserrat,sans-serif', fontSize: 14, fontWeight: 700,
                            color: 'var(--text-dark)', marginBottom: 5, letterSpacing: '-0.01em',
                        }}>{design.name}</div>
                        <div style={{
                            fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 300,
                            color: 'var(--text-mid)', lineHeight: 1.5,
                        }}>{design.sub}</div>
                    </div>
                </div>
            );
        }

        /* ——— IMAGE THEME CARD ——— */
        function ThemeCard({ theme, isActive, onClick, index }) {
            const [hov, setHov] = useState(false);
            const [imgErr, setImgErr] = useState(false);

            // Calculate total designs across all products if productDesigns exists
            const designCount = theme.designs 
                ? theme.designs.length 
                : (theme.productDesigns 
                    ? Object.values(theme.productDesigns).reduce((acc, curr) => acc + curr.length, 0)
                    : 0);

            return (
                <div
                    onMouseEnter={() => setHov(true)}
                    onMouseLeave={() => setHov(false)}
                    onClick={onClick}
                    style={{
                        borderRadius: 22,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transform: (hov || isActive) ? 'translateY(-6px) scale(1.04)' : 'translateY(0) scale(1)',
                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1.0)',
                        boxShadow: isActive
                            ? `0 0 0 3px ${theme.accent}, 0 20px 50px rgba(0,0,0,0.16)`
                            : hov
                                ? '0 18px 48px rgba(0,0,0,0.14)'
                                : '0 4px 20px rgba(0,0,0,0.08)',
                        position: 'relative',
                        animation: `fadeSlideUp 0.55s ${index * 0.08}s cubic-bezier(.22,.68,0,1.2) both`,
                        background: 'var(--white)',
                    }}>

                    {/* Image */}
                    <div style={{
                        height: 200, position: 'relative', overflow: 'hidden',
                        background: `linear-gradient(135deg, ${theme.accent}44, ${theme.accent2}33)`,
                    }}>
                        {!imgErr ? (
                            <img
                                src={theme.img}
                                alt={theme.name}
                                onError={() => setImgErr(true)}
                                style={{
                                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                                    transform: (hov || isActive) ? 'scale(1.07)' : 'scale(1)',
                                    transition: 'transform 0.5s cubic-bezier(.22,.68,0,1.2)',
                                    filter: isActive ? 'brightness(0.75)' : hov ? 'brightness(0.80)' : 'brightness(0.88)',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%',
                                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
                            }}>
                                {isImagePath(theme.emoji) ? <img loading="lazy" src={theme.emoji} alt="icon" style={{ width: '60%', height: '60%', objectFit: 'contain' }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} /> : theme.emoji}
                            </div>
                        )}

                        {/* Dark gradient overlay */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)',
                            zIndex: 2,
                        }}></div>

                        {/* Active checkmark */}
                        {isActive && (
                            <div style={{
                                position: 'absolute', top: 12, right: 12, zIndex: 5,
                                width: 32, height: 32, borderRadius: '50%',
                                background: theme.accent,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 900, color: '#fff',
                                boxShadow: `0 4px 14px ${theme.accent}88`,
                                animation: 'bloomIn 0.35s cubic-bezier(.22,.68,0,1.2)',
                            }}>✅</div>
                        )}

                        {/* Tag pill */}
                        <div style={{
                            position: 'absolute', top: 12, left: 12, zIndex: 5,
                            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.32)',
                            borderRadius: 50, padding: '4px 12px',
                            fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff',
                        }}>{theme.tag}</div>

                        {/* Bottom name overlay on the image */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
                            padding: '20px 18px 14px',
                        }}>
                            <div style={{
                                fontFamily: "'Great Vibes',cursive", fontSize: 32,
                                color: '#fff', lineHeight: 1.1,
                                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                            }}>{theme.name}</div>
                        </div>
                    </div>

                    {/* Bottom info strip */}
                    <div style={{
                        padding: '14px 18px 16px',
                        background: isActive
                            ? `linear-gradient(135deg, ${theme.accent}18, ${theme.accent2}12)`
                            : 'var(--white)',
                        transition: 'background 0.4s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div>
                            <div style={{
                                fontFamily: 'Poppins,sans-serif', fontSize: 11, fontWeight: 300,
                                color: 'var(--text-mid)', marginBottom: 2,
                            }}>{theme.mood}</div>
                            <div style={{
                                fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 600,
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                color: isActive ? theme.accent : 'var(--text-light)',
                                transition: 'color 0.3s',
                            }}>{designCount} designs</div>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 34, height: 34, borderRadius: '50%',
                            background: isActive ? theme.accent : (hov ? `${theme.accent}22` : 'rgba(0,0,0,0.05)'),
                            color: isActive ? '#fff' : (hov ? theme.accent : 'var(--text-light)'),
                            fontSize: 16, fontWeight: 700,
                            transition: 'all 0.3s cubic-bezier(.22,.68,0,1.2)',
                            transform: (hov || isActive) ? 'rotate(0deg) scale(1.1)' : 'rotate(-90deg) scale(1)',
                            flexShrink: 0,
                        }}>→</div>
                    </div>
                </div>
            );
        }


        /* ——— REVEAL-WRAPPED CARDS ——— */
        function RevealThemeCard(props) {
            return (
                <div className="reveal-scale" style={{ transitionDelay: `${props.index * 0.07}s` }}>
                    <ThemeCard {...props} />
                </div>
            );
        }
        function RevealDesignCard(props) {
            return (
                <div className="reveal" style={{ transitionDelay: `${props.index * 0.08}s` }}>
                    <DesignCard {...props} />
                </div>
            );
        }

        /* Full Themes Page */
        function ThemesPage({ onSelectTheme, onStart }) {
            const [activeTheme, setActiveTheme] = useState(null);
            const [selectedProduct, setSelectedProduct] = useState('phone');
            const designsRef = useRef(null);

            const handleThemeClick = (theme) => {
                setActiveTheme(theme);
                setTimeout(() => {
                    designsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            };

            const handleDesignSelect = (design) => {
                const theme = activeTheme || THEME_CATALOG[0];
                onSelectTheme({ ...theme, selectedDesign: design, selectedProduct });
            };

            // Get relevant designs for current selection
            const currentDesigns = activeTheme 
                ? (activeTheme.productDesigns ? activeTheme.productDesigns[selectedProduct] : (activeTheme.designs || []))
                : [];

            return (
                <div style={{ minHeight: '100vh', paddingBottom: 80 }}>

                    {/* ——— HERO BANNER ——— */}
                    <div style={{
                        background: 'linear-gradient(135deg,rgba(248,200,220,0.35),rgba(230,230,250,0.40),rgba(240,217,138,0.15))',
                        padding: '72px 24px 60px',
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(248,200,220,0.25)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            background: 'radial-gradient(ellipse 55% 80% at 15% 50%,rgba(248,200,220,0.28),transparent 70%),radial-gradient(ellipse 50% 70% at 85% 40%,rgba(230,230,250,0.28),transparent 70%)'
                        }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center',
                                background: 'rgba(255,255,255,0.78)',
                                border: '1.5px solid rgba(248,200,220,0.5)',
                                padding: '6px 22px', borderRadius: 50, marginBottom: 24,
                                fontFamily: 'Montserrat,sans-serif', fontSize: 10, letterSpacing: '0.22em',
                                textTransform: 'uppercase', color: 'var(--pink-deep)', fontWeight: 700,
                                boxShadow: '0 2px 12px rgba(212,104,142,0.10)',
                            }}>Curated Collections 2025</div>
                            <Reveal delay={0.05}>
                                <h1 style={{
                                    fontFamily: "'Great Vibes',cursive",
                                    fontSize: 'clamp(44px,7vw,82px)',
                                    color: 'var(--text-dark)', lineHeight: 1.05, marginBottom: 10,
                                }}>Explore Our Themes</h1>
                            </Reveal>
                            <Reveal delay={0.15}>
                                <div style={{
                                    fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 300,
                                    letterSpacing: '0.28em', textTransform: 'uppercase',
                                    color: 'var(--text-mid)', marginBottom: 18,
                                }}>Choose Your Aesthetic</div>
                                <div style={{
                                    width: 56, height: 1.5, margin: '0 auto 20px',
                                    background: 'linear-gradient(90deg,transparent,var(--gold-light),transparent)'
                                }} />
                            </Reveal>
                            <Reveal delay={0.25}>
                                <p style={{
                                    fontFamily: 'Poppins,sans-serif', fontSize: 14, color: 'var(--text-mid)',
                                    fontWeight: 300, maxWidth: 460, margin: '0 auto', lineHeight: 1.8,
                                }}>
                                    6 handcrafted theme collections — each with unique design styles. Click a theme to explore its designs.
                                </p>
                            </Reveal>
                        </div>
                    </div>

                    {/* — THEME GRID — */}
                    <div style={{ maxWidth: 1120, margin: '56px auto 0', padding: '0 24px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: 20,
                        }}>
                            {THEME_CATALOG.map((theme, i) => (
                                <RevealThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isActive={activeTheme?.id === theme.id}
                                    onClick={() => handleThemeClick(theme)}
                                    index={i}
                                />
                            ))}
                        </div>
                    </div>

                    {/* — DESIGNS PANEL — */}
                    {activeTheme && (
                        <div ref={designsRef} style={{
                            maxWidth: 1120, margin: '64px auto 0', padding: '0 24px',
                            animation: 'fadeSlideUp 0.5s cubic-bezier(.22,.68,0,1.2) both',
                        }}>
                            {/* Section header */}
                            <Reveal>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 32, flexWrap: 'wrap', gap: 24,
                                }}>
                                    <div style={{ flex: '1 1 300px' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                            background: `${activeTheme.accent}22`,
                                            border: `1.5px solid ${activeTheme.accent}66`,
                                            padding: '5px 16px', borderRadius: 50, marginBottom: 10,
                                            fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 700,
                                            letterSpacing: '0.14em', textTransform: 'uppercase',
                                            color: 'var(--pink-deep)',
                                        }}>
                                            <img loading="lazy" src={activeTheme.emoji} alt="icon" style={{ width: 16, height: 16, objectFit: 'contain' }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                                            {activeTheme.tag}
                                        </div>
                                        <h2 style={{
                                            fontFamily: "'Great Vibes',cursive",
                                            fontSize: 'clamp(36px,5vw,58px)',
                                            color: 'var(--text-dark)', lineHeight: 1, marginBottom: 6,
                                        }}>{activeTheme.name} Designs</h2>
                                        <p style={{
                                            fontFamily: 'Poppins,sans-serif', fontSize: 13,
                                            color: 'var(--text-mid)', fontWeight: 300,
                                        }}>
                                            Explore exclusive designs for your {selectedProduct}
                                        </p>
                                    </div>

                                    {/* Product Switcher */}
                                    <div style={{ 
                                        display: 'flex', background: 'rgba(0,0,0,0.04)', padding: 4, borderRadius: 16,
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}>
                                        {['phone', 'laptop', 'earbuds'].map(p => (
                                            <button 
                                                key={p}
                                                onClick={() => setSelectedProduct(p)}
                                                style={{
                                                    padding: '10px 20px', borderRadius: 12, border: 'none',
                                                    background: selectedProduct === p ? 'var(--white)' : 'transparent',
                                                    color: selectedProduct === p ? 'var(--pink-deep)' : 'var(--text-mid)',
                                                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.08em', cursor: 'pointer',
                                                    boxShadow: selectedProduct === p ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                                }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setActiveTheme(null)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: 'var(--white)', border: '1.5px solid var(--beige-dark)',
                                            borderRadius: 50, padding: '9px 20px',
                                            fontFamily: 'Montserrat,sans-serif', fontSize: 12, fontWeight: 600,
                                            color: 'var(--text-mid)', cursor: 'pointer',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--beige-soft)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; }}
                                    >← All Themes</button>
                                </div>
                            </Reveal>

                            {/* Design cards grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: 22,
                            }}>
                                {currentDesigns.map((design, i) => (
                                    <RevealDesignCard
                                        key={design.id}
                                        design={design}
                                        themeAccent={activeTheme.accent}
                                        onSelect={handleDesignSelect}
                                        index={i}
                                    />
                                ))}
                                {/* Custom design card */}
                                <div
                                    onClick={() => onStart()}
                                    style={{
                                        background: 'linear-gradient(135deg,rgba(248,200,220,0.12),rgba(230,230,250,0.16))',
                                        borderRadius: 18,
                                        border: '2px dashed rgba(212,104,142,0.32)',
                                        minHeight: 240,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', gap: 12,
                                        transition: 'all 0.3s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--pink-deep)';
                                        e.currentTarget.style.background = 'rgba(248,200,220,0.18)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(212,104,142,0.32)';
                                        e.currentTarget.style.background = 'linear-gradient(135deg,rgba(248,200,220,0.12),rgba(230,230,250,0.16))';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'linear-gradient(135deg,var(--pink-deep),var(--lavender-deep))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24, boxShadow: '0 6px 20px rgba(212,104,142,0.30)',
                                    }}>✦</div>
                                    <div style={{
                                        fontFamily: 'Montserrat,sans-serif', fontSize: 13, fontWeight: 700,
                                        color: 'var(--pink-deep)', textAlign: 'center', padding: '0 16px'
                                    }}>
                                        Create Your Own
                                    </div>
                                    <div style={{
                                        fontFamily: 'Poppins,sans-serif', fontSize: 11, fontWeight: 300,
                                        color: 'var(--text-light)', textAlign: 'center', padding: '0 20px', lineHeight: 1.6
                                    }}>
                                        Start from scratch with Pro Mode
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{
                                height: 1, marginTop: 72,
                                background: 'linear-gradient(90deg,transparent,rgba(248,200,220,0.4),rgba(230,230,250,0.4),transparent)',
                            }} />
                        </div>
                    )}

                    {/* — BOTTOM CTA — */}
                    <Reveal>
                        <div style={{ textAlign: 'center', padding: '64px 24px 0' }}>
                            <h2 style={{
                                fontFamily: "'Great Vibes',cursive",
                                fontSize: 'clamp(32px,5vw,52px)',
                                color: 'var(--text-dark)', marginBottom: 12,
                            }}>Can't find your style?</h2>
                            <p style={{
                                fontFamily: 'Poppins,sans-serif', fontSize: 14,
                                color: 'var(--text-mid)', fontWeight: 300, marginBottom: 28,
                                maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.7,
                            }}>Design from scratch with full creative control.</p>
                            <button onClick={onStart} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 10,
                                padding: '16px 44px', borderRadius: 50,
                                background: 'linear-gradient(135deg,var(--pink-deep),var(--lavender-deep))',
                                color: 'white', fontSize: 14, fontWeight: 700,
                                fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.06em',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 8px 28px rgba(212,104,142,0.38)',
                                transition: 'all 0.3s cubic-bezier(.22,.68,0,1.2)',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(212,104,142,0.48)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,104,142,0.38)'; }}
                            >🎨 Try Pro Mode</button>
                        </div>
                    </Reveal>

                </div>
            );
        }

        /* ── AUTH MODAL ── */
        function AuthModal({ onClose, onLogin }) {
            const [tab, setTab] = React.useState('login');
            const [err, setErr] = React.useState('');

            const handleLogin = (e) => {
                e.preventDefault();
                const email = e.target.email.value.trim();
                const pass = e.target.password.value;
                if (!email || !pass) { setErr('Please fill in all fields.'); return; }
                if (!/\S+@\S+\.\S+/.test(email)) { setErr('Please enter a valid email.'); return; }
                if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return; }
                setErr('');
                if (onLogin) onLogin({ name: email.split('@')[0], email: email, isPremium: false, uid: 'demo_' + Date.now() });
                onClose();
            };

            const handleSignup = (e) => {
                e.preventDefault();
                const name = e.target.fullname.value.trim();
                const email = e.target.email.value.trim();
                const pass = e.target.password.value;
                const confirm = e.target.confirm.value;
                if (!name || !email || !pass || !confirm) { setErr('Please fill in all fields.'); return; }
                if (!/\S+@\S+\.\S+/.test(email)) { setErr('Please enter a valid email.'); return; }
                if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return; }
                if (pass !== confirm) { setErr('Passwords do not match.'); return; }
                setErr('');
                if (onLogin) onLogin({ name: name, email: email, isPremium: false, uid: 'demo_' + Date.now() });
                onClose();
            };

            return (
                <div className="auth-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                    <div className="auth-modal">
                        <button className="auth-modal-close" onClick={onClose} aria-label="Close">✕</button>

                        <div className="auth-modal-logo">
                            <img loading="lazy" src={LOGO_SRC} alt="Custom Blossom" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'contain', objectPosition: 'center', padding: '0px', transform: 'scale(1.4)', boxSizing: 'border-box', background: '#fff', boxShadow: '0 4px 16px rgba(248,156,108,0.3)', marginBottom: 8, display: 'block', margin: '0 auto 8px' }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                            <span>custom blossom</span>
                            <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8825c', marginTop: 2 }}>Craft Your Creativity</div>
                        </div>

                        <div className="auth-tab-row">
                            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>Login</button>
                            <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setErr(''); }}>Sign Up</button>
                        </div>

                        {err && <div style={{ color: '#c0392b', fontFamily: 'Poppins,sans-serif', fontSize: 12, marginBottom: 10, background: 'rgba(192,57,43,0.07)', padding: '8px 14px', borderRadius: 10 }}>{err}</div>}

                        {tab === 'login' ? (
                            <form onSubmit={handleLogin} noValidate>
                                <div className="auth-field">
                                    <label htmlFor="auth-login-email">Email</label>
                                    <input id="auth-login-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="auth-login-pass">Password</label>
                                    <input id="auth-login-pass" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
                                </div>
                                <button type="submit" className="auth-submit-btn">Login 🌸</button>
                                <div className="auth-footer-text">
                                    Don't have an account?{' '}
                                    <span style={{ color: '#F89C6C', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setTab('signup'); setErr(''); }}>Sign up</span>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSignup} noValidate>
                                <div className="auth-field">
                                    <label htmlFor="auth-signup-name">Full Name</label>
                                    <input id="auth-signup-name" name="fullname" type="text" placeholder="Your name" autoComplete="name" />
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="auth-signup-email">Email</label>
                                    <input id="auth-signup-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="auth-signup-pass">Password</label>
                                    <input id="auth-signup-pass" name="password" type="password" placeholder="Min. 6 characters" autoComplete="new-password" />
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="auth-signup-confirm">Confirm Password</label>
                                    <input id="auth-signup-confirm" name="confirm" type="password" placeholder="Repeat password" autoComplete="new-password" />
                                </div>
                                <button type="submit" className="auth-submit-btn">Create Account ✨</button>
                                <div className="auth-footer-text">
                                    Already have an account?{' '}
                                    <span style={{ color: '#F89C6C', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setTab('login'); setErr(''); }}>Login</span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            );
        }

        /* ── NAV ── */
        /* --- AUTH GATE COMPONENT (LOCKING SYSTEM) --- */
        /* --- AUTH GATE COMPONENT (FIREBASE + STRICT VERIFICATION) --- */
        function AuthGate({ onClose, onLogin }) {
            const [isSignup, setIsSignup] = useState(false);
            const [formData, setFormData] = useState({ name: '', email: '', password: '' });
            const [rememberMe, setRememberMe] = useState(true);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState('');
            const [needsVerification, setNeedsVerification] = useState(false);
            const [showPassword, setShowPassword] = useState(false);

            const handleSubmit = async (e) => {
                e.preventDefault();
                setError('');
                setLoading(true);

                const email = formData.email.trim();
                const password = formData.password;

                // 1. Client-side Validation
                if (!EMAIL_REGEX.test(email)) {
                    setLoading(false);
                    return setError("Please enter a valid email address.");
                }
                if (formData.password.length < 6) {
                    setLoading(false);
                    return setError("Password must be at least 6 characters.");
                }
                if (isSignup && !formData.name) {
                    setLoading(false);
                    return setError("Full name is required.");
                }

                // 2. Simulated Local Auth Logic
                const runAuthAction = () => {
                    const localUsers = JSON.parse(localStorage.getItem('blossom_users_db') || '[]');
                    
                    if (isSignup) {
                        // Check if user already exists
                        if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                            setError("User already exists. Please login instead.");
                            setLoading(false);
                            return;
                        }
                        // Create user
                        const newUser = {
                            uid: 'local_' + Date.now(),
                            email: email,
                            password: password, // In a real app, this would be hashed
                            name: formData.name,
                            isPremium: false
                        };
                        localUsers.push(newUser);
                        localStorage.setItem('blossom_users_db', JSON.stringify(localUsers));
                        // Instead of fake verification, we show a Success/Welcome screen
                        setNeedsVerification(true); 
                        // We store the user info so we can log them in when they click "Start"
                        setFormData({ ...formData, uid: newUser.uid });
                    } else {
                        // Login: Find user and verify password
                        const match = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                        if (!match) {
                            setError("No account found with this email. Please sign up first.");
                            setLoading(false);
                            return;
                        }
                        if (match.password !== password) {
                            setError("Incorrect password. Please try again.");
                            setLoading(false);
                            return;
                        }
                        onLogin({ ...match, emailVerified: true }, rememberMe);
                    }
                    setLoading(false);
                };

                // Simulate network delay for premium feel
                setTimeout(runAuthAction, 800);
            };

            if (needsVerification) {
                return (
                    <div className="auth-modal-overlay fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="auth-card bloom-in" style={{ width: 440, padding: 50, background: '#fff', borderRadius: 32, boxShadow: '0 40px 100px rgba(212, 104, 142, 0.15)', textAlign: 'center' }}>
                            <div style={{ fontSize: 64, marginBottom: 20 }}>🌸</div>
                            <h2 style={{ fontFamily: 'Great Vibes', fontSize: 42, color: 'var(--pink-deep)', marginBottom: 12 }}>Welcome aboard!</h2>
                            <p style={{ fontSize: 16, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 30, fontWeight: 500 }}>
                                Your account has been created successfully. Get ready to bloom your creativity!
                            </p>
                            <button className="btn btn-primary btn-full" onClick={() => {
                                onLogin({ name: formData.name, email: formData.email, uid: formData.uid, emailVerified: true }, true);
                                onClose();
                            }} style={{ padding: '16px 32px', fontSize: 16 }}>Start Creating Now ✨</button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="auth-modal-overlay fade-in" style={{
                    position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="auth-card bloom-in" style={{
                        width: 420, padding: 40, background: '#fff', borderRadius: 32,
                        boxShadow: '0 40px 100px rgba(212, 104, 142, 0.15)', border: '1px solid rgba(248, 200, 220, 0.3)',
                        position: 'relative'
                    }}>
                        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <div style={{ fontFamily: 'Great Vibes', fontSize: 36, color: 'var(--pink-deep)', marginBottom: 8 }}>{isSignup ? 'Create Account' : 'Welcome Back'}</div>
                            <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>Join the community of creators.</p>
                        </div>

                        {error && <div style={{ background: '#fff1f2', color: '#e11d48', padding: '12px 16px', borderRadius: 12, fontSize: 12, marginBottom: 20, border: '1px solid #fda4af' }}>{error}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {isSignup && (
                                <div className="auth-field">
                                    <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, display: 'block' }}>FULL NAME</label>
                                    <input type="text" placeholder="Jane Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid #f1f5f9', outline: 'none' }} />
                                </div>
                            )}
                            <div className="auth-field">
                                <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, display: 'block' }}>EMAIL ADDRESS</label>
                                <input type="email" placeholder="jane@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid #f1f5f9', outline: 'none' }} />
                            </div>
                            <div className="auth-field">
                                <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, display: 'block' }}>PASSWORD</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        value={formData.password} 
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        style={{ width: '100%', padding: 14, paddingRight: 46, borderRadius: 14, border: '1.5px solid #f1f5f9', outline: 'none' }} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ 
                                            position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5
                                        }}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe} 
                                        onChange={e => setRememberMe(e.target.checked)} 
                                        style={{ accentColor: 'var(--pink-deep)', width: 16, height: 16 }}
                                    />
                                    Remember Me
                                </label>
                                {!isSignup && <span style={{ fontSize: 13, color: 'var(--pink-deep)', fontWeight: 600, cursor: 'pointer' }}>Forgot?</span>}
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 10 }} disabled={loading}>
                                {loading ? 'Security Check...' : (isSignup ? 'Create Account' : 'Sign In')}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-mid)' }}>
                            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <span onClick={() => setIsSignup(!isSignup)} style={{ color: 'var(--pink-deep)', fontWeight: 700, cursor: 'pointer' }}>
                                {isSignup ? 'Login' : 'Sign Up'}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        /* --- PREMIUM UPGRADE MODAL --- */
        function PremiumUpgradeModal({ onClose, onUpgrade }) {
            return (
                <div className="auth-modal-overlay fade-in" style={{
                    position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="premium-card bloom-in" style={{
                        width: 500, background: '#fff', borderRadius: 40, overflow: 'hidden',
                        boxShadow: '0 50px 120px rgba(0,0,0,0.1)', position: 'relative'
                    }}>
                        <div style={{ height: 180, background: 'linear-gradient(135deg, #FFD1DC, #E6E6FA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: 72 }}>💎</div>
                        </div>
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12 }}>Unlock <span style={{ color: 'var(--pink-deep)' }}>Pro Mode</span></h2>
                            <p style={{ color: 'var(--text-mid)', marginBottom: 30, lineHeight: 1.6 }}>Access professional materials, 3D surface finishes, and high-fidelity output for just a one-time upgrade.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                                {['3M™ Carbon Fiber & Patterns', 'Holographic & Metallic Finishes', 'Remove All Watermarks', '24/7 Priority Studio Support'].map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-dark)', fontWeight: 600 }}>
                                        <span style={{ color: '#10b981' }}>✓</span> {f}
                                    </div>
                                ))}
                            </div>

                            <button className="btn btn-primary btn-full" style={{ padding: 18, fontSize: 16 }} onClick={onUpgrade}>Upgrade to Premium — Always Free</button>
                            <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 15, background: 'none', border: 'none', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>Maybe Later</button>
                        </div>
                    </div>
                </div>
            );
        }

        function Nav({ onHome, cartCount, onCartOpen, onStart, onThemes, user, onLogout, onLogin }) {
            const scrolled = useScrolled();
            const [menuOpen, setMenuOpen] = React.useState(false);
            const toggleMenu = () => setMenuOpen(o => !o);
            const closeMenu = () => setMenuOpen(false);
            return (
                <>
                <nav className={scrolled ? 'scrolled' : ''}>
                    <div className="nav-logo-block" onClick={() => { onHome(); closeMenu(); }}>
                        <div className="nav-logo-img-circle">
                            <img loading="lazy" src={LOGO_SRC} alt="Custom Blossom" className="brand-logo"  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                        </div>
                        <div className="nav-logo-text">
                            <span className="nav-brand">custom blossom</span>
                            <span className="nav-tagline">Craft Your Creativity</span>
                        </div>
                    </div>

                    <div className="nav-right">
                        <div className="nav-links">
                            <span className="nav-link" onClick={onHome}>Home</span>
                        </div>

                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{user.name.split(' ')[0]}</span>
                                    {user.isPremium && <span title="Premium Subscriber" style={{ fontSize: 14 }}>💎</span>}
                                </div>
                                <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--pink-deep)', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>Logout</button>
                            </div>
                        ) : (
                            <button className="nav-login-btn" id="nav-login-btn" onClick={() => { onLogin(); closeMenu(); }}>
                                Login / Sign Up
                            </button>
                        )}

                        <button className="nav-cart-btn" onClick={() => { onCartOpen(); closeMenu(); }}>
                            <span style={{ fontSize: 18, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(212,104,142,0.3))' }}>🛒</span>
                            Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </button>

                        {/* Hamburger - visible on mobile only via CSS */}
                        <button className={`nav-hamburger${menuOpen ? ' open' : ''}`} onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={menuOpen}>
                            <span /><span /><span />
                        </button>
                    </div>
                </nav>

                {/* Mobile Slide-Down Menu */}
                <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
                    <button className="nav-mobile-link" onClick={() => { onHome(); closeMenu(); }}>🏠 Home</button>
                    <div className="nav-mobile-divider" />
                    {user ? (
                        <>
                            <div className="nav-mobile-link" style={{ cursor: 'default', color: 'var(--text-mid)' }}>
                                <span>👤 {user.name}</span>
                                {user.isPremium && <span style={{ fontSize: 14 }}>💎 Premium</span>}
                            </div>
                            <button className="nav-mobile-link" onClick={() => { onLogout(); closeMenu(); }}>🚪 Logout</button>
                        </>
                    ) : (
                        <button className="nav-mobile-link" onClick={() => { onLogin(); closeMenu(); }}>🔐 Login / Sign Up</button>
                    )}
                    <div className="nav-mobile-divider" />
                    <button className="nav-mobile-link" onClick={() => { onCartOpen(); closeMenu(); }}>🛒 Cart {cartCount > 0 && `(${cartCount})`}</button>
                </div>
                </>
            );
        }

        /* — STEP INDICATOR — */
        function StepIndicator({ steps, current }) {
            return (
                <div className="step-indicator">
                    {steps.map((s, i) => (
                        <React.Fragment key={i}>
                            <div className="step-dot">
                                <div className={`step-dot-circle ${i < current ? 'done' : i === current ? 'active' : 'pending'}`}>
                                    {i < current ? '✓' : i + 1}
                                </div>
                                <span className={`step-dot-label${i === current ? ' active' : ''}`}>{s}</span>
                            </div>
                            {i < steps.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>
            );
        }

        /* — HOMEPAGE — */
        /* — SCROLL THEMES DATA — */
        const SCROLL_THEMES = [
            { id: 'anime', name: 'Anime', emoji: '/images/quiet_sunset_anime.png', img: '/images/quiet_sunset_anime.png', tag: 'Fan Favourites', desc: 'Bring your favourite characters to life. From Naruto to Demon Slayer — wear your fandom with pride.', accent: '#F8C8DC', accent2: '#E6E6FA', bg: 'linear-gradient(135deg,#FFF0F5,#E6E6FA)', designs: [{ name: 'Sakura Vibes', color: '#F8C8DC', icon: '/images/icon_designs.png' }, { name: 'Thunder Storm', color: '#E6E6FA', icon: '/images/icon_designs.png' }, { name: 'Night Slash', color: '#C9B8E8', icon: '/images/icon_designs.png' }] },
            { id: 'marvel', name: 'Marvel', emoji: '/images/theme_marvel_new.jpg', img: '/images/theme_marvel_new.jpg', tag: 'Superhero Edition', desc: 'Unleash your inner hero. From Avengers to Spider-Man — carry the power of the Marvel Universe.', accent: '#ed1d24', accent2: '#457b9d', bg: 'linear-gradient(135deg,#ed1d2411,#457b9d11)', designs: [{ name: 'Iron Man Red', color: '#ed1d24', icon: '/images/icon_designs.png' }, { name: 'Spider Web', color: '#000000', icon: '/images/icon_designs.png' }, { name: 'Avengers Blue', color: '#457b9d', icon: '/images/icon_designs.png' }] },
            { id: 'cars', name: 'Cars', emoji: '/images/theme_cars_new.png', img: '/images/theme_cars_new.png', tag: 'Speed & Style', desc: 'For those who live life in the fast lane. Sleek, bold, built for the road.', accent: '#FFE082', accent2: '#B2EBF2', bg: 'linear-gradient(135deg,#FFFFF0,#E0F7FA)', designs: [{ name: 'Midnight Race', color: '#2C2C4A', icon: '/images/icon_designs.png' }, { name: 'Chrome Dream', color: '#B2EBF2', icon: '/images/icon_designs.png' }, { name: 'Golden Speed', color: '#FFE082', icon: '/images/icon_designs.png' }] },
            { id: 'mandala', name: 'Mandala', emoji: '/images/theme_mandala_new.webp', img: '/images/theme_mandala_new.webp', tag: 'Sacred Geometry', desc: 'Find your centre. Intricate patterns that radiate calm, balance and sacred beauty.', accent: '#C9B8E8', accent2: '#F8C8DC', bg: 'linear-gradient(135deg,#F3E8FF,#FFF0F5)', designs: [{ name: 'Violet Lotus', color: '#C9B8E8', icon: '/images/icon_designs.png' }, { name: 'Rose Mandala', color: '#F8C8DC', icon: '/images/icon_designs.png' }, { name: 'Golden Om', color: '#F0D98A', icon: '/images/icon_designs.png' }] },
            { id: 'floral', name: 'Floral', emoji: '/images/theme_floral_new.jpg', img: '/images/theme_floral_new.jpg', tag: 'Nature in Bloom', desc: 'Let nature decorate your world. Delicate petals, soft palettes — timeless and alive.', accent: '#F8C8DC', accent2: '#A8D5A2', bg: 'linear-gradient(135deg,#FFF0F5,#F0FFF0)', designs: [{ name: 'Petal Soft', color: '#F8C8DC', icon: '/images/icon_designs.png' }, { name: 'Garden Green', color: '#A8D5A2', icon: '/images/icon_designs.png' }, { name: 'Vintage Rose', color: '#D4688E', icon: '/images/icon_designs.png' }] },
            { id: 'disney', name: 'Disney', emoji: '/images/theme_disney_new.jpg', img: '/images/theme_disney_new.jpg', tag: 'Magic Collection', desc: 'A little magic in every pocket. Iconic characters, fairytale moments, pure enchantment.', accent: '#81D8D0', accent2: '#FFD700', bg: 'linear-gradient(135deg,#E0FFFF,#FFFACD)', designs: [{ name: 'Castle Glow', color: '#81D8D0', icon: '/images/icon_designs.png' }, { name: 'Stardust', color: '#FFD700', icon: '/images/icon_designs.png' }, { name: 'Rose Fairy', color: '#F8C8DC', icon: '/images/icon_designs.png' }] },

        ];



        function DesignMiniCard({ d, index, onClick }) {
            const [hov, setHov] = React.useState(false);
            return (
                <div
                    onMouseEnter={() => setHov(true)}       

                    onMouseLeave={() => setHov(false)}
                    className="glass-card hover-lift"
                    onClick={onClick}
                    style={{
                        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer', animation: 'fadeSlideUp 0.6s cubic-bezier(.22,.68,0,1.2) both',
                        animationDelay: `${0.2 + index * 0.08}s`,
                        background: hov ? 'var(--white)' : 'rgba(255,255,255,0.65)',
                        border: hov ? '1.5px solid var(--pink-deep)' : '1px solid rgba(255,255,255,0.4)',
                        transform: hov ? 'scale(1.05) translateY(-3px)' : 'scale(1) translateY(0)',
                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1.0)',
                        boxShadow: hov ? '0 12px 30px rgba(0,0,0,0.08)' : 'none',
                        zIndex: hov ? 10 : 1
                    }}
                >
                    <div style={{ 
                        width: 14, height: 14, borderRadius: '50%', background: d.color, 
                        boxShadow: `0 0 10px ${d.color}66`,
                        transform: hov ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.3s'
                    }} />
                    <span style={{ 
                        fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat,sans-serif', 
                        letterSpacing: '0.1em', color: hov ? 'var(--pink-deep)' : 'var(--text-dark)',
                        transition: 'color 0.3s'
                    }}>{d.name.toUpperCase()}</span>
                </div>
            );
        }

        function StepCard({ s, i }) {
            const ref = useRef(null);
            const [vis, setVis] = useState(false);
            useEffect(() => {
                const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
                if (ref.current) obs.observe(ref.current);
                return () => obs.disconnect();
            }, []);
            return (
                <div ref={ref} style={{
                    textAlign: 'center',
                    opacity: 1, transform: vis ? 'translateY(0)' : 'translateY(28px)',
                    transition: `all 0.65s ${i * 0.12}s cubic-bezier(.22,.68,0,1.2)`,
                }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat,sans-serif',
                        letterSpacing: '0.16em', color: 'var(--pink-deep)', marginBottom: 12
                    }}>{s.step}</div>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                        background: 'linear-gradient(135deg,rgba(248,200,220,0.32),rgba(230,230,250,0.32))',
                        border: '1.5px solid rgba(248,200,220,0.4)', overflow: 'hidden'
                    }}>{isImagePath(s.icon) ? <img loading="lazy" src={s.icon} style={{ width: '60%', height: '60%', objectFit: 'contain' }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} /> : s.icon}</div>
                    <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</p>
                </div>
            );
        }

        function GlowButton({ onClick }) {
            const [hov, setHov] = useState(false);
            return (
                <div style={{ display: 'inline-block', position: 'relative' }}>
                    {/* Pulse ring */}
                    {!hov && <div style={{
                        position: 'absolute', inset: -8, borderRadius: 68,
                        animation: 'pulseRing 2.4s ease-in-out infinite',
                        pointerEvents: 'none', zIndex: 0,
                    }} />}
                    <button onClick={onClick}
                        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                        style={{
                            position: 'relative', zIndex: 1,
                            display: 'inline-flex', alignItems: 'center', gap: 12,
                            padding: '20px 56px', borderRadius: 60,
                            background: 'linear-gradient(135deg, var(--pink-deep), var(--lavender-deep), var(--tiffany))',
                            backgroundSize: '200% 200%',
                            color: '#fff', fontSize: 16, fontWeight: 700,
                            fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.08em',
                            border: 'none', cursor: 'pointer',
                            boxShadow: hov
                                ? '0 0 0 10px rgba(212,104,142,0.12), 0 24px 64px rgba(212,104,142,0.45)'
                                : '0 8px 36px rgba(212,104,142,0.25)',
                            transform: hov ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)',
                            transition: 'all 0.38s cubic-bezier(.22,.68,0,1.2)',
                            overflow: 'hidden',
                        }}>
                        {/* Shimmer sweep */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.22) 50%,transparent 60%)',
                            backgroundSize: '200% 100%',
                            animation: hov ? 'btnShimmer 0.6s ease' : 'none',
                            pointerEvents: 'none', zIndex: 2,
                        }} />
                        <span style={{ position: 'relative', zIndex: 3 }}>🎨 Customize Yourself</span>
                    </button>
                </div>
            );
        }

        function StickyScrollSection({ onThemeSelect, onStart }) {
            const [activeIdx, setActiveIdx] = useState(0);
            const [contentKey, setContentKey] = useState(0);
            const [localPct, setLocalPct] = useState(0);
            const containerRef = useRef(null);
            const theme = SCROLL_THEMES[activeIdx];

            useEffect(() => {
                let ticking = false;
                const onScroll = () => {
                    if (ticking) return;
                    ticking = true;
                    requestAnimationFrame(() => {
                        if (!containerRef.current) { ticking = false; return; }
                        const rect = containerRef.current.getBoundingClientRect();
                        const total = containerRef.current.offsetHeight - window.innerHeight;
                        const scrolled = -rect.top;
                        if (scrolled < 0 || scrolled > total) { ticking = false; return; }
                        const pct = scrolled / total;
                        const seg = 1 / SCROLL_THEMES.length;
                        const idx = Math.min(Math.floor(pct * SCROLL_THEMES.length), SCROLL_THEMES.length - 1);
                        const lp = (pct - idx * seg) / seg;
                        setLocalPct(Math.max(0, Math.min(lp, 1)));
                        setActiveIdx(prev => {
                            if (prev !== idx) setContentKey(k => k + 1);
                            return idx;
                        });
                        ticking = false;
                    });
                };
                window.addEventListener('scroll', onScroll, { passive: true });
                return () => window.removeEventListener('scroll', onScroll);
            }, []);

            return (
                <div ref={containerRef} style={{ height: `${SCROLL_THEMES.length * 120}vh`, position: 'relative' }}>
                    <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Animated BG */}
                        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: theme.bg, transition: 'background 0.85s cubic-bezier(.4,0,.2,1)' }}></div>
                        <div style={{
                            position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(90px)', opacity: 0.32,
                            top: '-15%', left: '-10%', zIndex: 0, pointerEvents: 'none',
                            background: `radial-gradient(circle,${theme.accent},transparent 70%)`, transition: 'background 0.85s ease'
                        }} />
                        <div style={{
                            position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(70px)', opacity: 0.25,
                            bottom: '-8%', right: '-5%', zIndex: 0, pointerEvents: 'none',
                            background: `radial-gradient(circle,${theme.accent2},transparent 70%)`, transition: 'background 0.85s ease'
                        }} />

                        {/* Top bar */}
                        <div style={{
                            position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                        }}>
                            <div style={{
                                fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
                                textTransform: 'uppercase', color: 'var(--text-mid)', background: 'rgba(255,255,255,0.7)',
                                padding: '5px 18px', borderRadius: 50, backdropFilter: 'blur(8px)'
                            }}>Explore Our Themes</div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {SCROLL_THEMES.map((_, i) => (
                                    <div key={i} style={{
                                        width: i === activeIdx ? 24 : 7, height: 7, borderRadius: 50,
                                        background: i === activeIdx ? 'var(--pink-deep)' : 'rgba(212,104,142,0.28)',
                                        transition: 'all 0.4s cubic-bezier(.22,.68,0,1.2)',
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* Main layout */}
                        <div style={{
                            position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center',
                            maxWidth: 1200, margin: '0 auto', width: '100%', padding: '80px 48px 40px', gap: 64,
                            flexWrap: 'wrap'
                        }}>

                            {/* LEFT visual */}
                            <div style={{
                                flex: '0 0 380px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                minWidth: 260
                            }}>
                                <div key={`img-${activeIdx}`} style={{
                                    width: 260, height: 260, borderRadius: '50%',
                                    background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`,
                                    boxShadow: `0 32px 80px ${theme.accent}55,0 0 0 1px rgba(255,255,255,0.28)`,
                                    animation: 'bloomIn 0.6s cubic-bezier(.22,.68,0,1.2) both',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <img
                                        src={theme.img}
                                        alt={theme.name}
                                        loading="lazy"
                                        style={{
                                            width: '100%', height: '100%', objectFit: 'cover',
                                            display: 'block', borderRadius: '50%',
                                            transition: 'transform 0.4s ease, filter 0.4s ease',
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={e => { 
                                            e.target.style.transform = 'scale(1.1)'; 
                                            e.target.style.filter = 'brightness(1.1) saturate(1.1)'; 
                                            e.target.parentElement.style.transform = 'scale(1.05) translateY(-10px)';
                                            e.target.parentElement.style.boxShadow = `0 40px 100px ${theme.accent}66, 0 0 0 2px var(--pink-deep)`;
                                        }}
                                        onMouseLeave={e => { 
                                            e.target.style.transform = 'scale(1)'; 
                                            e.target.style.filter = 'brightness(1) saturate(1)'; 
                                            e.target.parentElement.style.transform = 'scale(1) translateY(0)';
                                            e.target.parentElement.style.boxShadow = `0 32px 80px ${theme.accent}55,0 0 0 1px rgba(255,255,255,0.28)`;
                                        }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                                    />
                                    {/* orbit dots removed for performance */}
                                </div>
                                <div key={`cards-${activeIdx}`} style={{
                                    display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center',
                                    animation: 'fadeSlideUp 0.5s 0.18s cubic-bezier(.22,.68,0,1.2) both',
                                }}>
                                    {theme.designs.map((d, i) => (
                                        <DesignMiniCard key={d.name} d={d} index={i} onClick={() => onThemeSelect(theme)} />
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT content */}
                            <div key={contentKey} style={{ flex: 1, minWidth: 260, animation: 'contentSlideIn 0.55s cubic-bezier(.22,.68,0,1.2) both' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.6)',
                                    padding: '6px 20px', borderRadius: 50, fontFamily: 'Montserrat,sans-serif',
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                                    color: 'var(--pink-deep)', marginBottom: 22, backdropFilter: 'blur(10px)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    {isImagePath(theme.emoji) ? <img loading="lazy" src={theme.emoji} alt="icon" style={{ width: 14, height: 14, objectFit: 'contain' }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} /> : theme.emoji}{theme.tag}
                                </div>
                                <h2 style={{
                                    fontFamily: "'Great Vibes',cursive", fontSize: 'clamp(52px,5.5vw,86px)',
                                    lineHeight: 1.0, color: 'var(--text-dark)', marginBottom: 20,
                                    textShadow: '0 2px 20px rgba(0,0,0,0.06)'
                                }}>{theme.name}</h2>
                                <p style={{
                                    fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 300,
                                    color: 'var(--text-mid)', lineHeight: 1.85, maxWidth: 440, marginBottom: 32
                                }}>{theme.desc}</p>

                                <div style={{
                                    fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 600,
                                    color: 'var(--text-light)', letterSpacing: '0.12em', marginBottom: 30
                                }}>
                                    {String(activeIdx + 1).padStart(2, '0')} / {String(SCROLL_THEMES.length).padStart(2, '0')}
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button onClick={() => onThemeSelect(theme)} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '14px 30px', borderRadius: 50,
                                        background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`,
                                        color: 'var(--text-dark)', fontSize: 13, fontWeight: 700,
                                        fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.06em',
                                        border: 'none', cursor: 'pointer',
                                        boxShadow: `0 8px 24px ${theme.accent}55`,
                                        transition: 'all 0.3s cubic-bezier(.22,.68,0,1.2)',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                                    >Explore {theme.name} →</button>
                                    <button onClick={onStart} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '14px 26px', borderRadius: 50, background: 'rgba(255,255,255,0.72)',
                                        color: 'var(--text-dark)', fontSize: 13, fontWeight: 500,
                                        fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.04em',
                                        border: '1.5px solid rgba(0,0,0,0.08)', cursor: 'pointer', backdropFilter: 'blur(10px)',
                                        transition: 'all 0.25s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.97)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.72)'}
                                    >Customize Yourself</button>
                                </div>
                                {activeIdx < SCROLL_THEMES.length - 1 && (
                                    <div style={{
                                        marginTop: 36, fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 600,
                                        color: 'var(--text-light)', letterSpacing: '0.16em', textTransform: 'uppercase',
                                        display: 'flex', alignItems: 'center', gap: 8
                                    }}>
                                        <div style={{
                                            width: 1, height: 26, background: 'rgba(0,0,0,0.14)',
                                            animation: 'scrollPulse 1.8s ease-in-out infinite'
                                        }} />
                                        Scroll to discover more
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom theme nav */}
                        <div style={{
                            position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'center',
                            paddingBottom: 20, gap: 0, overflow: 'auto'
                        }}>
                            {SCROLL_THEMES.map((t, i) => (
                                <div key={t.id} style={{
                                    padding: '8px 18px', fontFamily: 'Montserrat,sans-serif', fontSize: 11,
                                    fontWeight: i === activeIdx ? 700 : 400, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                                    color: i === activeIdx ? 'var(--pink-deep)' : 'var(--text-light)', cursor: 'pointer',
                                    borderBottom: i === activeIdx ? '2px solid var(--pink-deep)' : '2px solid transparent',
                                    transition: 'all 0.3s',
                                }} onClick={() => {
                                    if (!containerRef.current) return;
                                    const total = containerRef.current.offsetHeight - window.innerHeight;
                                    const target = (i / SCROLL_THEMES.length) * total + containerRef.current.offsetTop;
                                    window.scrollTo({ top: target, behavior: 'smooth' });
                                }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <img loading="lazy" src={t.emoji} alt="icon" style={{ width: 14, height: 14, objectFit: 'contain', opacity: i === activeIdx ? 1 : 0.6 }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                                        {t.name}
                                    </span></div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        function HomePage({ onStart, onThemeSelect }) {
            const [vis, setVis] = useState(false);
            useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);

            return (
                <div style={{ background: 'transparent' }}>
                    {/* HERO */}
                    <section style={{
                        minHeight: '100vh', display: 'flex', alignItems: 'center',
                        padding: 'calc(var(--nav-h) + 40px) 6vw 80px', position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Soft lavender blob top-right */}
                        <div style={{
                            position: 'absolute', width: 520, height: 520,
                            background: 'radial-gradient(circle, rgba(230,230,250,0.75) 0%, transparent 70%)',
                            top: '-8%', right: '-6%', filter: 'blur(60px)', zIndex: 0, animation: 'float 9s ease-in-out infinite'
                        }} />
                        {/* Soft pink blob bottom-left */}
                        <div style={{
                            position: 'absolute', width: 380, height: 380,
                            background: 'radial-gradient(circle, rgba(248,200,220,0.6) 0%, transparent 70%)',
                            bottom: '5%', left: '-4%', filter: 'blur(50px)', zIndex: 0, animation: 'float 12s ease-in-out infinite reverse'
                        }} />
                        {/* Tiffany accent blob centre */}
                        <div style={{
                            position: 'absolute', width: 260, height: 260,
                            background: 'radial-gradient(circle, rgba(160,231,229,0.35) 0%, transparent 70%)',
                            top: '40%', left: '38%', filter: 'blur(44px)', zIndex: 0, animation: 'float 14s ease-in-out infinite'
                        }} />

                        {/* TWO-COLUMN WRAPPER */}
                        <div style={{
                            position: 'relative', zIndex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: 'clamp(32px, 6vw, 80px)', maxWidth: 1100, margin: '0 auto', width: '100%',
                            flexWrap: 'wrap'
                        }}>
                            {/* ── LEFT: Text content ── */}
                            <div style={{
                                flex: '1 1 380px', display: 'flex', flexDirection: 'column',
                                alignItems: 'flex-start', textAlign: 'left', gap: 0
                            }}>
                                {/* Badge */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    background: 'rgba(255,255,255,0.85)',
                                    border: '1.5px solid rgba(248,200,220,0.55)',
                                    padding: '6px 20px', borderRadius: 50,
                                    fontFamily: 'Montserrat,sans-serif', fontSize: 10,
                                    letterSpacing: '0.18em', textTransform: 'uppercase',
                                    color: 'var(--pink-deep)', fontWeight: 700, marginBottom: 28,
                                    boxShadow: '0 3px 14px rgba(212,104,142,0.10)',
                                    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                                    transition: 'all 0.6s 0.05s cubic-bezier(.22,.68,0,1.2)'
                                }}>
                                    <img loading="lazy" src="/images/icon_easy.png" alt="✦" style={{ width: 13, height: 13 }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                                    New Collection 2025
                                </div>



                                {/* Tagline */}
                                <div style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: 'clamp(14px, 1.5vw, 18px)', fontWeight: 800,
                                    letterSpacing: '0.05em',
                                    color: 'var(--text-dark)', marginBottom: 12,
                                    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                                    transition: 'all 0.65s 0.28s cubic-bezier(.22,.68,0,1.2)'
                                }}>Handcrafted personalized designs</div>
                                <div style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: 'clamp(10px, 1.2vw, 13px)', fontWeight: 700,
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    color: 'var(--pink-deep)', marginBottom: 26,
                                    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                                    transition: 'all 0.65s 0.32s cubic-bezier(.22,.68,0,1.2)'
                                }}>✨ Custom cases starting at just ₹199 💖</div>

                                {/* Divider */}
                                <div style={{
                                    width: 56, height: 2, marginBottom: 26,
                                    borderRadius: 2,
                                    background: 'linear-gradient(90deg, var(--pink-deep), var(--tiffany), var(--lavender-mid))',
                                    opacity: vis ? 1 : 0, transition: 'opacity 0.5s 0.38s'
                                }} />

                                {/* Description */}
                                <p style={{
                                    fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(14px, 1.3vw, 16px)',
                                    fontWeight: 300, color: 'var(--text-mid)', maxWidth: 420,
                                    lineHeight: 1.85, marginBottom: 38,
                                    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                                    transition: 'all 0.65s 0.42s cubic-bezier(.22,.68,0,1.2)'
                                }}>
                                    Design a phone case, laptop skin, or print that's entirely, beautifully, unmistakably <em style={{ fontStyle: 'italic', color: 'var(--pink-deep)' }}>you</em>.
                                    Premium quality, delivered in days.
                                </p>

                                {/* CTA Buttons */}
                                <div style={{
                                    display: 'flex', gap: 14, flexWrap: 'wrap',
                                    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)',
                                    transition: 'all 0.65s 0.52s cubic-bezier(.22,.68,0,1.2)'
                                }}>
                                    <button onClick={onStart} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 10,
                                        padding: '15px 36px', borderRadius: 50,
                                        background: 'linear-gradient(135deg, #F8C8DC, #D4688E)',
                                        color: '#fff', fontSize: 13, fontWeight: 700,
                                        fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em',
                                        border: 'none', cursor: 'pointer',
                                        boxShadow: '0 6px 24px rgba(212,104,142,0.35)',
                                        transition: 'all 0.3s ease'
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(212,104,142,0.48)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,104,142,0.35)'; }}
                                    >🎨 Start Customizing →</button>

                                    <button style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 10,
                                        padding: '15px 32px', borderRadius: 50,
                                        background: 'rgba(255,255,255,0.82)',
                                        color: 'var(--text-dark)', fontSize: 13, fontWeight: 600,
                                        fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em',
                                        border: '1.5px solid rgba(212,104,142,0.25)', cursor: 'pointer',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 3px 14px rgba(212,104,142,0.1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.98)'; e.currentTarget.style.borderColor = 'rgba(212,104,142,0.5)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.82)'; e.currentTarget.style.borderColor = 'rgba(212,104,142,0.25)'; }}
                                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    >Our Story ↓</button>
                                </div>

                            </div>

                            {/* ── RIGHT: Logo image ── */}
                            <div style={{
                                flex: '0 1 380px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', position: 'relative', minWidth: 240
                            }}>
                                {/* Glow ring behind logo */}
                                <div style={{
                                    position: 'absolute', width: 340, height: 340,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(248,200,220,0.45) 0%, rgba(230,230,250,0.3) 50%, transparent 75%)',
                                    filter: 'blur(24px)', zIndex: 0,
                                    animation: 'float 7s ease-in-out infinite'
                                }} />
                                {/* Decorative ring */}
                                <div style={{
                                    position: 'absolute', width: 290, height: 290,
                                    borderRadius: '50%',
                                    border: '1.5px dashed rgba(212,104,142,0.22)',
                                    zIndex: 0, animation: 'float 11s ease-in-out infinite reverse'
                                }} />
                                <img
                                    src={LOGO_SRC}
                                    alt="Custom Blossom Logo"
                                    className="brand-logo"
                                    style={{
                                        position: 'relative', zIndex: 1,
                                        width: 'clamp(200px, 28vw, 320px)',
                                        height: 'clamp(200px, 28vw, 320px)',
                                        borderRadius: '50%',
                                        objectFit: 'contain',
                                        objectPosition: 'center',
                                        padding: '0',
                                        background: '#fff',
                                        boxShadow: '0 20px 60px rgba(212,104,142,0.22), 0 4px 16px rgba(160,231,229,0.18)',
                                        border: '4px solid rgba(255,255,255,0.9)',
                                        opacity: vis ? 1 : 0,
                                        transform: vis ? 'scale(1.4) translate(0, 0)' : 'scale(0.9) translateY(24px)',
                                        transition: 'all 0.9s 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                        animation: vis ? 'heroLogoFloat 6s ease-in-out infinite' : 'none'
                                    }}
                                 onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                            </div>
                        </div>

                        {/* Scroll cue */}
                        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: vis ? 0.55 : 0, transition: 'opacity 0.7s 1s' }}>
                            <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)' }}>Scroll</div>
                            <div style={{ width: 20, height: 32, border: '1.5px solid rgba(212,104,142,0.25)', borderRadius: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 4 }}>
                                <div style={{ width: 3, height: 7, borderRadius: 2, background: 'var(--pink-deep)', animation: 'scrollDot 1.8s ease-in-out infinite' }} />
                            </div>
                        </div>
                    </section>

                    {/* HOW IT WORKS */}
                    <section style={{ background: 'var(--white)', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 60% at 80% 50%,rgba(248,200,220,0.10),transparent 70%)' }} />
                        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                            {/* Heading */}
                            <Reveal style={{ textAlign: 'center', marginBottom: 60 }}>
                                <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--pink-deep)', marginBottom: 12 }}>Personalized just for you</div>
                                <h2 style={{ fontFamily: "'Great Vibes',cursive", fontSize: 52, color: 'var(--text-dark)', marginBottom: 10 }}>Handcrafted with Love ❤️✨</h2>
                                <div style={{ width: 60, height: 1.5, margin: '0 auto', background: 'linear-gradient(90deg,transparent,var(--pink-mid),transparent)' }} />
                            </Reveal>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32 }}>
                                {[
                                    { step: '01', icon: '/images/icon_pro.png', title: 'Pick a Product', desc: 'Choose your basic, standard, or premium canvas.' },
                                    { step: '02', icon: '/images/icon_designs.png', title: 'Custom Art by You', desc: 'Add text, colors, and memories to make it yours.' },
                                    { step: '03', icon: '/images/icon_delivery.png', title: 'Delivered to You', desc: 'Premium quality printed and shipped in 3-5 days.' },
                                ].map((s, i) => <StepCard key={i} s={s} i={i} />)}
                            </div>
                        </div>
                    </section>


                    {/* — ABOUT / OUR STORY — */}
                    <section id="about" style={{ 
                        background: '#fff', 
                        padding: '140px 24px', 
                        position: 'relative', 
                        overflow: 'hidden' 
                    }}>
                        {/* Layered Luxury Background Effects */}
                        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '45%', height: '60%', background: 'radial-gradient(circle, rgba(248,200,220,0.18) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(160,231,229,0.12) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
                        
                        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <div style={{ textAlign: 'center', marginBottom: 64 }}>
                                <div style={{ 
                                    fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 900, 
                                    color: 'var(--pink-deep)', textTransform: 'uppercase', letterSpacing: '0.4em', 
                                    marginBottom: 24, opacity: 0.8 
                                }}>Our Story</div>
                                
                                <h2 style={{ 
                                    fontFamily: "'Great Vibes', cursive", 
                                    fontSize: 'clamp(48px, 7vw, 84px)', 
                                    color: 'var(--text-dark)', 
                                    lineHeight: 1, 
                                    marginBottom: 20,
                                    textShadow: '0 10px 30px rgba(212,104,142,0.05)'
                                }}>Made With Love</h2>
                                
                                <div style={{ 
                                    width: 100, height: 3, 
                                    margin: '0 auto 48px', 
                                    background: 'linear-gradient(90deg, transparent, var(--pink-mid), var(--tiffany), transparent)',
                                    borderRadius: 3
                                }} />
                                
                                <div style={{ position: 'relative', maxWidth: 740, margin: '0 auto' }}>
                                    {/* Decorative Petal */}
                                    <div style={{ 
                                        position: 'absolute', top: -30, right: -40, width: 40, height: 40, 
                                        opacity: 0.15, transform: 'rotate(15deg)', pointerEvents: 'none' 
                                    }}>
                                        <img loading="lazy" src="/images/logo.jpg" alt="petal" style={{ width: '100%' }}  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                                    </div>

                                    <p style={{ 
                                        fontFamily: 'Poppins, sans-serif', 
                                        fontSize: 'clamp(16px, 1.6vw, 20px)', 
                                        fontWeight: 300, 
                                        color: '#475569', 
                                        lineHeight: 2,
                                        letterSpacing: '0.015em',
                                        textAlign: 'center'
                                    }}>
                                        What started as a simple idea during our brainstorming slowly evolved into something meaningful. 
                                        With curiosity, creativity, and continuous exploration, we transformed our concept into a platform 
                                        focused on personalization and user experience. Every step of our journey reflects our intent to 
                                        create something minimal, intuitive, and uniquely expressive.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FINAL CTA */}
                    <section style={{
                        padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, rgba(248,200,220,0.18), rgba(230,230,250,0.22), rgba(160,231,229,0.12))'
                    }}>
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                            width: 700, height: 450, borderRadius: '50%', zIndex: 0,
                            background: 'radial-gradient(ellipse,rgba(212,104,142,0.16),transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none'
                        }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <Reveal delay={0}>
                                <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--pink-deep)', marginBottom: 20 }}>Ready to Create?</div>
                            </Reveal>
                            <Reveal delay={0.1}>
                                <h2 style={{ fontFamily: "'Great Vibes',cursive", fontSize: 'clamp(48px,7vw,90px)', color: 'var(--text-dark)', lineHeight: 1.1, marginBottom: 16 }}>Want Full Control?</h2>
                            </Reveal>
                            <Reveal delay={0.2}>
                                <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 17, fontWeight: 300, color: 'var(--text-mid)', maxWidth: 440, margin: '0 auto 48px', lineHeight: 1.8 }}>
                                    Create your own design from scratch. Every pixel, every colour — yours.</p>
                            </Reveal>
                            <Reveal delay={0.32} direction="scale">
                                <GlowButton onClick={onStart} />
                            </Reveal>

                        </div>
                    </section>
                </div>
            );
        }

        /* — STEP 1: Product Selector — */

        function ChooseProduct({ selected, onSelect, onNext }) {
            const [hovId, setHovId] = React.useState(null);
            const items = [
                {
                    id: 'earbuds',
                    tier: 'Basic',
                    name: 'Earbuds Case',
                    price: '₹129',
                    badge: 'Essential',
                    desc: 'Precision wraps for your AirPods or earbuds case with a snug fit.',
                    svg: (
                        <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M14 28v9c0 5 4 8 10 8s10-3 10-8v-9z" />
                            <path d="M14 28c0-7 4-12 10-12s10 5 10 12" />
                            <circle cx="24" cy="35" r="1.8" fill="currentColor" stroke="none" />
                        </svg>
                    )
                },
                {
                    id: 'phone',
                    tier: 'Standard',
                    name: 'Phone Cover',
                    price: '₹199',
                    badge: 'Popular',
                    desc: 'Custom-fit skin with precision laser-cut edges for your smartphone.',
                    svg: (
                        <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <rect x="12" y="4" width="24" height="40" rx="4" />
                            <circle cx="24" cy="38" r="2" />
                            <path d="M20 9h8" />
                        </svg>
                    )
                },
                {
                    id: 'laptop',
                    tier: 'Premium',
                    name: 'Laptop Case',
                    price: '₹299',
                    badge: 'Best Value',
                    isPremium: true,
                    desc: 'Ultra-thin 3M vinyl wrap for your laptop lid with heat-safe adhesive.',
                    svg: (
                        <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <rect x="6" y="8" width="36" height="23" rx="2.5" />
                            <path d="M3 31h42" />
                            <path d="M17 31v4h14v-4" />
                        </svg>
                    )
                },

            ];

            return (
                <div className="page fade-in page-enter" style={{ background: 'linear-gradient(160deg, #fffafa 0%, #fdf0f5 50%, #f8f4ff 100%)', minHeight: '100vh' }}>
                    <StepIndicator steps={['Product', 'Mode', 'Design', 'Preview']} current={0} />

                    <div style={{ textAlign: 'center', padding: '32px 24px 8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,104,142,0.08)', border: '1px solid rgba(212,104,142,0.15)', borderRadius: 50, padding: '5px 16px', marginBottom: 20 }}>
                            <span style={{ fontSize: 12, color: 'var(--pink-deep)', fontWeight: 700, fontFamily: 'Poppins, sans-serif', letterSpacing: '0.05em' }}>STEP 1 OF 4</span>
                        </div>
                        <h2 style={{ fontFamily: 'Poppins, Montserrat, sans-serif', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 10 }}>
                            Choose Your <span style={{ background: 'linear-gradient(135deg, var(--pink-deep), var(--lavender-deep))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Product</span>
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 15, fontFamily: 'Poppins, sans-serif', fontWeight: 400, marginBottom: 0 }}>
                            Select the device you'd like to wrap with your custom design
                        </p>
                    </div>

                    {/* Product Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 24,
                        maxWidth: 960,
                        margin: '52px auto',
                        padding: '0 24px'
                    }}>
                        {items.map((p, i) => {
                            const isActive = selected === p.id;
                            return (
                                <div
                                    key={p.id}
                                    onMouseEnter={() => setHovId(p.id)}
                                    onMouseLeave={() => setHovId(null)}
                                    className={`product-card${isActive ? ' selected' : ''}`}
                                    onClick={() => { onSelect(p.id); setTimeout(onNext, 320); }}
                                    style={{
                                        animationDelay: `${i * 0.08}s`,
                                        border: isActive ? '2.5px solid var(--pink-deep)' : p.isPremium ? '2.5px solid #fecdd3' : '1.5px solid rgba(0,0,0,0.06)',
                                        boxShadow: isActive
                                            ? '0 12px 40px rgba(212,104,142,0.22), 0 0 0 4px rgba(212,104,142,0.10)'
                                            : (hovId === p.id) ? '0 18px 48px rgba(0,0,0,0.12)' : p.isPremium ? '0 10px 25px rgba(251, 113, 133, 0.12)' : '0 4px 20px rgba(0,0,0,0.04)',
                                        background: isActive ? 'linear-gradient(135deg, rgba(212,104,142,0.05), rgba(180,175,233,0.07))' : '#fff',
                                        transform: isActive ? 'translateY(-8px) scale(1.05)' : (hovId === p.id) ? 'translateY(-6px) scale(1.04)' : p.isPremium ? 'scale(1.03)' : 'none',
                                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1.0)',
                                        position: 'relative',
                                        padding: '44px 24px 32px',
                                        textAlign: 'center',
                                        zIndex: (hovId === p.id || isActive) ? 10 : 1
                                    }}
                                >
                                    {/* Badge */}
                                    {(p.isPremium || p.badge === 'Popular') && (
                                        <div style={{
                                            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                                            background: p.isPremium ? 'linear-gradient(135deg, #fb7185, #d4688e)' : 'var(--text-dark)',
                                            color: '#fff', fontSize: 10, fontWeight: 900, padding: '5px 16px', borderRadius: 50,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.14)', letterSpacing: '0.06em', whiteSpace: 'nowrap', zIndex: 10
                                        }}>
                                            {p.badge.toUpperCase()}
                                        </div>
                                    )}

                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 20, letterSpacing: '0.14em' }}>
                                        {p.tier.toUpperCase()} TIER
                                    </div>

                                    {/* Icon */}
                                    <div style={{
                                        width: 88, height: 88, borderRadius: 28,
                                        background: isActive ? 'linear-gradient(135deg, rgba(212,104,142,0.12), rgba(180,175,233,0.12))' : p.isPremium ? 'linear-gradient(135deg, #fff1f2, #fff)' : '#f8fafc',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        transition: 'all 0.3s ease',
                                        color: isActive ? 'var(--pink-deep)' : p.isPremium ? '#fb7185' : '#94a3b8',
                                        transform: isActive ? 'scale(1.1)' : 'none'
                                    }}>
                                        {p.svg}
                                    </div>

                                    {/* Selected check */}
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute', top: 18, left: 18,
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: 'var(--pink-deep)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, color: '#fff', fontWeight: 900,
                                            boxShadow: '0 4px 10px rgba(212,104,142,0.3)'
                                        }}>✓</div>
                                    )}

                                    <div style={{ fontFamily: 'Poppins, Montserrat, sans-serif', fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                                        {p.name}
                                    </div>
                                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24, minHeight: 64 }}>
                                        {p.desc}
                                    </div>

                                </div>
                            );
                        })}
                    </div>

                    {/* Continue Button */}
                    <div style={{ textAlign: 'center', paddingBottom: 80 }}>
                        <button
                            onClick={onNext}
                            disabled={!selected}
                            style={{
                                padding: '16px 48px',
                                borderRadius: 50,
                                border: 'none',
                                cursor: selected ? 'pointer' : 'not-allowed',
                                fontSize: 15,
                                fontWeight: 700,
                                fontFamily: 'Poppins, sans-serif',
                                letterSpacing: '0.02em',
                                transition: 'all 0.25s ease',
                                background: selected
                                    ? 'linear-gradient(135deg, var(--pink-deep) 0%, var(--lavender-deep) 100%)'
                                    : '#e2e8f0',
                                color: selected ? '#fff' : '#94a3b8',
                                boxShadow: selected ? '0 8px 24px rgba(212,104,142,0.3)' : 'none',
                                transform: selected ? 'none' : 'none',
                                minWidth: 220
                            }}
                            onMouseEnter={e => { if (selected) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = selected ? '0 14px 32px rgba(212,104,142,0.38)' : 'none'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = selected ? '0 8px 24px rgba(212,104,142,0.3)' : 'none'; }}
                        >
                            {selected ? `Continue →` : 'Select a Product First'}
                        </button>
                        {!selected && <p style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', fontFamily: 'Poppins, sans-serif' }}>Tap a product above to continue</p>}
                    </div>
                </div>
            );
        }


        /* — STEP 2 — */
        function ChooseMode({ selected, onSelect, onNext, onBack, isPremium, onUpgrade }) {
            return (
                <div className="page fade-in page-enter">
                    <StepIndicator steps={['Product', 'Mode', 'Design', 'Preview']} current={1} />
                    <Reveal><div className="section-header">
                        <h2>How Would You Like to <em>Design?</em></h2>
                        <p>Pick your creative path or grab a bundle</p>
                    </div></Reveal>



                    <div className="mode-grid" style={{ marginBottom: 40 }}>
                        <div className={`mode-card easy fade-up ${selected === 'easy' ? 'selected' : ''}`}
                            style={{ animationDelay: '0.1s' }} onClick={() => { onSelect('easy'); setTimeout(() => onNext('easy'), 300); }}>
                            <div className="mode-icon">
                                <img src="/images/icon_easy.png" alt="easy" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                            </div>
                            <div className="mode-label easy">Easy Mode</div>
                            <div className="mode-title">Choose a Theme</div>
                            <div className="mode-desc">Browse curated collections and pick a design you love. Simple, fast, beautiful.</div>
                        </div>

                        <div className={`mode-card pro fade-up ${selected === 'pro' ? 'selected' : ''}`}
                            style={{
                                animationDelay: '0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onClick={() => {
                                if (isPremium) {
                                    onSelect('pro');
                                    setTimeout(() => onNext('pro'), 300);
                                } else {
                                    onUpgrade();
                                }
                            }}>

                            <div className="premium-badge">BEST VALUE ⭐</div>

                            <div className="mode-icon">
                                <img src="/images/icon_pro.png" alt="pro" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                            </div>
                            <div className="mode-label pro" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                Pro Mode {isPremium && <span style={{ fontSize: 14 }}>💎</span>}
                            </div>
                            <div className="mode-title">Customize Yourself</div>
                            <div className="mode-desc">Full creative control. Base style, patterns, colors, and add your own text.</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingBottom: 60 }}>
                        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
                        <button className="btn btn-primary" onClick={() => onNext(selected)} disabled={!selected || (selected === 'pro' && !isPremium)}>Continue →</button>
                    </div>
                </div>
            );
        }

        /* — EASY MODE — */
        function EasyModeThemes({ product, design, onDesignChange, onNext, onBack }) {
            const [selectedThemeId, setSelectedThemeId] = useState(null);

            const handleThemeSelect = (theme) => {
                setSelectedThemeId(theme.id);
                onDesignChange({
                    themeId: theme.id,
                    bgColor: theme.colors[0],
                    accentColor: theme.colors[0] + '44'
                });
            };

            const activeTheme = THEMES.find(t => t.id === selectedThemeId);
            const catalogTheme = THEME_CATALOG.find(t => t.id === selectedThemeId);

            if (!selectedThemeId) {
                function EasyThemeCard({ theme: t, index, onSelect }) {
                    const [hov, setHov] = React.useState(false);
                    return (
                        <div 
                            className="theme-card reveal"
                            onMouseEnter={() => setHov(true)}
                            onMouseLeave={() => setHov(false)}
                            style={{ 
                                transitionDelay: `${index * 0.08}s`,
                                cursor: 'pointer',
                                transform: hov ? 'scale(1.05) translateY(-8px)' : 'scale(1) translateY(0)',
                                transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1.0)',
                                boxShadow: hov ? '0 25px 50px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.05)',
                                overflow: 'hidden',
                                borderRadius: 20,
                                background: '#fff',
                                border: hov ? '2px solid var(--pink-deep)' : '2px solid transparent',
                                position: 'relative',
                                zIndex: hov ? 10 : 1
                            }} 
                            onClick={() => onSelect(t)}
                        >
                            <div className="theme-preview" style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                                <img loading="lazy" src={t.icon} alt={t.name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} style={{ 
                                    width: '100%', height: '100%', objectFit: 'contain',
                                    transform: hov ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1.0)'
                                }} />
                                <div className="theme-overlay">
                                    <div className="theme-tag">{t.tag}</div>
                                </div>
                            </div>
                            <div className="theme-info" style={{ padding: '20px 24px' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 4 }}>{t.name}</div>
                                <div className="theme-mood" style={{ fontSize: 12, opacity: 0.7 }}>{t.mood}</div>
                            </div>
                        </div>
                    );
                }

                return (
                            <div className="page fade-in page-enter">
                                <StepIndicator steps={['Product', 'Mode', 'Design', 'Preview']} current={2} />
                                <div className="section-header">
                                    <h2>Choose Your <em>Theme</em></h2>
                                    <p>Select a minimalist sticker to explore artistic curated designs</p>
                                </div>

                                {/* Mandatory Device Model Entry for Easy Mode */}
                                <div style={{ maxWidth: 500, margin: '0 auto 40px', padding: '0 20px' }}>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
                                        borderRadius: 20, padding: 24, border: '1px solid rgba(212,104,142,0.15)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                                    }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--pink-deep)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
                                            Type Your {product === 'phone' ? 'Phone' : product === 'laptop' ? 'Laptop' : 'Earbuds'} Model *
                                        </label>
                                        <input 
                                            type="text"
                                            placeholder={`e.g. ${product === 'laptop' ? 'MacBook M3, Dell XPS 15' : product === 'earbuds' ? 'AirPods Pro, Sony XM5' : 'iPhone 15, Samsung S24'}`}
                                            value={design.manualModel}
                                            onChange={(e) => onDesignChange({ manualModel: e.target.value })}
                                            style={{
                                                width: '100%', padding: '16px 20px', borderRadius: 14, border: '1px solid #eee',
                                                fontSize: 15, fontWeight: 600, color: 'var(--text-dark)', transition: 'all 0.3s',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--pink-deep)'}
                                            onBlur={(e) => e.target.style.borderColor = '#eee'}
                                        />
                                        <p style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 10, fontWeight: 500 }}>
                                            Required for precise precision-cut fulfillment.
                                        </p>
                                    </div>
                                </div>
                                <div className="theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, padding: '0 24px' }}>
                                    {THEMES.map((t, i) => (
                                        <EasyThemeCard key={t.id} theme={t} index={i} onSelect={handleThemeSelect} />
                                    ))}
                                </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '40px 0 80px' }}>
                            <button className="btn btn-secondary" onClick={onBack}>← Back to Modes</button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="page fade-in page-enter">
                    <StepIndicator steps={['Product', 'Mode', 'Design', 'Preview']} current={2} />
                    <div className="section-header">
                        <h2>{activeTheme.name} <em>Designs</em></h2>
                        <p>Pick a specific artwork from the {activeTheme.name} collection</p>
                    </div>

                    <div className="designs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, padding: '20px 0 60px' }}>
                        {(catalogTheme?.productDesigns?.[product] || []).map((d, i) => (
                            <div key={d.id}
                                className={`design-card reveal ${design.designId === d.id ? 'active' : ''}`}
                                style={{ transitionDelay: `${i * 0.06}s` }}
                                onClick={() => onDesignChange({ designId: d.id, img: d.img, bgColor: d.color || design.bgColor })}>
                                <div className="design-preview" style={{ height: 200, background: `url("${d.img}") center/contain no-repeat, url("${FALLBACK_IMG}") center/contain no-repeat`, borderRadius: '16px 16px 0 0' }} />
                                <div className="design-info" style={{ padding: 20, background: '#fff', borderRadius: '0 0 16px 16px' }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{d.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingBottom: 100 }}>
                        <button className="btn btn-secondary" onClick={() => setSelectedThemeId(null)}>← Select Theme</button>
                        <button className="btn btn-primary" onClick={onNext} disabled={!design.designId}>Continue to Preview →</button>
                    </div>
                </div>
            );
        }

        /* — BRAND ICONS — */
        function BrandIcon({ brand, color = 'currentColor' }) {
            const icons = {
                'Apple': (
                    <svg viewBox="0 0 24 24" width="30" height="30" fill={color}>
                        <path d="M18.71 15.19a6.26 6.26 0 0 1-2.91-5.22 6.44 6.44 0 0 1 3.29-5.64 6.47 6.47 0 0 0-5.09-2.73c-2.15-.22-4.17 1.21-5.27 1.21-1.13 0-2.83-1.21-4.69-1.18a6.69 6.69 0 0 0-5.6 3.4c-2.4 4.14-.61 10.23 1.74 13.59 1.15 1.66 2.48 3.51 4.29 3.44 1.72-.06 2.39-1.11 4.47-1.11s2.69 1.11 4.51 1.07c1.86-.03 3.03-1.66 4.17-3.32a12.53 12.53 0 0 0 1.64-3.36 6.13 6.13 0 0 1-3.59-5.14zm-4.27-11.28a6.06 6.06 0 0 0 1.38-4.35 6.24 6.24 0 0 0-4.03 2.06 5.8 5.8 0 0 0-1.44 4.12c1.76.14 3.43-.87 4.09-1.83z"/>
                    </svg>
                ),
                'Samsung': (
                    <svg viewBox="0 0 24 24" width="30" height="30">
                        <ellipse cx="12" cy="12" rx="11" ry="5" fill="#034EA2" transform="rotate(-15 12 12)" />
                        <path d="M4.5 12.2c.2-.5.5-.8 1-.8.4 0 .8.2 1 .5l.2.8c0 .5-.3.9-.7 1-.4.1-.8 0-1-.3l-.3-.7c-.1-.3-.1-.5.1-.7v.1c.1-.2.4-.4.7-.4s.5.2.6.4l.2.5c0 .3-.1.6-.4.7s-.5 0-.6-.1c.1-.1 0-.1 0 0l-.1-.2zm2.5-.5h.6l.8 2.2h-.7l-.2-.5h-.9l-.2.5h-.7L7.2 11.7zm.2 1.2h.5l-.2-.8-.3.8zm1.8-1.2h.7l.5 1.2.5-1.2h.7v2.2h-.6v-1.4l-.5 1.1h-.2l-.6-1.1v1.4h-.5V11.7zm2.5.9c0 .7.5 1.1 1.1 1.1s1.1-.4 1.1-1.1v-.1h-.6l.1.1c.1.3-.1.6-.4.6s-.5-.2-.5-.5v-.2c0-.3.2-.5.5-.5s.5.2.5.5h.6c0-.7-.5-1.1-1.1-1.1s-1.2.4-1.2 1.1v.1zm3.2-.9h.6V13c0 .3.2.5.5.5s.5-.2.5-.5v-1.3h.6v1.4c0 .7-.5 1.1-1.1 1.1s-1.1-.4-1.1-1.1V11.7zm3.1.2c0 .3.2.5.5.5s.5-.2.5-.5v-.1c0-.4-.4-.7-.9-.7s-.9.4-.9.9v1.2c0 .4.4.7.9.7s.9-.4.9-1.1V13l-.6.2c0 .4-.2.6-.5.6s-.5-.2-.5-.5v-.2c0-.3.2-.5.5-.5s.5.2.5.5h.6V12.7c0-.7-.5-1.1-1.1-1.1s-1.2.4-1.2 1.1v.1z" fill="#fff" transform="rotate(-15 12 12)" />
                    </svg>
                ),
                'Google': (
                    <svg viewBox="0 0 24 24" width="30" height="30">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                ),
                'OnePlus': (
                    <svg viewBox="0 0 24 24" width="30" height="30">
                        <rect x="2" y="2" width="20" height="20" fill="#eb0028" rx="1" />
                        <text x="6" y="15" fontSize="13" fontWeight="900" fill="#fff" fontFamily="Arial, sans-serif">1</text>
                        <path d="M15 10v3m-1.5-1.5h3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M15 7v9m-4.5-4.5h9" stroke="#fff" strokeWidth="0.5" strokeOpacity="0.2" />
                    </svg>
                ),
                'Nothing': (
                    <svg viewBox="0 0 60 20" width="40" height="15" fill={color}>
                        {/* Dot Matrix "NOTHING" Simulation */}
                        <circle cx="2" cy="5" r="1.2" /><circle cx="2" cy="10" r="1.2" /><circle cx="2" cy="15" r="1.2" /><circle cx="7" cy="5" r="1.2" /><circle cx="7" cy="15" r="1.2" />{/* N */}
                        <circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="10" r="1.2" /><circle cx="12" cy="15" r="1.2" /><circle cx="17" cy="5" r="1.2" /><circle cx="17" cy="15" r="1.2" />{/* O */}
                        <circle cx="22" cy="5" r="1.2" /><circle cx="27" cy="5" r="1.2" /><circle cx="27" cy="10" r="1.2" /><circle cx="27" cy="15" r="1.2" />{/* T */}
                        <circle cx="32" cy="5" r="1.2" /><circle cx="32" cy="10" r="1.2" /><circle cx="32" cy="15" r="1.2" /><circle cx="37" cy="10" r="1.2" />{/* H */}
                        <circle cx="42" cy="5" r="1.2" /><circle cx="42" cy="15" r="1.2" /><circle cx="47" cy="5" r="1.2" /><circle cx="47" cy="10" r="1.2" /><circle cx="47" cy="15" r="1.2" />{/* I */}
                        <circle cx="52" cy="5" r="1.2" /><circle cx="52" cy="10" r="1.2" /><circle cx="52" cy="15" r="1.2" /><circle cx="57" cy="5" r="1.2" /><circle cx="57" cy="15" r="1.2" />{/* N */}
                    </svg>
                ),
                'Sony': (
                    <svg viewBox="0 0 24 10" width="35" height="15" fill={color}>
                        <text x="12" y="8" fontSize="8" fontWeight="900" textAnchor="middle" style={{ letterSpacing: '0.05em', fontFamily: 'serif' }}>SONY</text>
                    </svg>
                ),
                'Dell': (
                    <svg viewBox="0 0 24 24" width="30" height="30" fill={color}>
                        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.2" fill="none" />
                        <text x="12" y="15.5" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">DELL</text>
                        {/* Slanted E simulation */}
                        <rect x="8.5" y="11" width="3" height="1" transform="rotate(-30 10 12)" />
                    </svg>
                ),
                'Microsoft': (
                    <svg viewBox="0 0 24 24" width="28" height="28">
                        <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                        <rect x="13" y="1" width="10" height="10" fill="#7fba00" />
                        <rect x="1" y="13" width="10" height="10" fill="#00a4ef" />
                        <rect x="13" y="13" width="10" height="10" fill="#ffb900" />
                    </svg>
                ),
                'HP': (
                    <svg viewBox="0 0 24 24" width="30" height="30">
                        <circle cx="12" cy="12" r="11" fill="#0096D6" />
                        <text x="12" y="17" fontSize="14" fontWeight="100" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontStyle="italic">hp</text>
                    </svg>
                ),
                'ASUS': (
                    <svg viewBox="0 0 40 10" width="40" height="10" fill={color}>
                        <text x="20" y="8" fontSize="8" fontWeight="900" textAnchor="middle" style={{ letterSpacing: '0.1em' }}>ASUS</text>
                    </svg>
                )
            };
            return icons[brand] || <span style={{ fontSize: 24 }}>📱</span>;
        }

        /* — DEVICE SELECTION STEP — */
        function DeviceSelector({ product, selected, onSelect, onNext, onBack }) {
            const models = DEVICE_MODELS[product] || [];
            const productLabel = product === 'phone' ? 'Phone' : product === 'laptop' ? 'Laptop' : 'Earbuds';

            return (
                <div className="page fade-in page-enter">
                    <StepIndicator steps={['Product', 'Mode', 'Model', 'Design', 'Preview']} current={2} />
                    <div className="section-header">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,104,142,0.08)', border: '1px solid rgba(212,104,142,0.15)', borderRadius: 50, padding: '5px 16px', marginBottom: 20 }}>
                            <span style={{ fontSize: 10, color: 'var(--pink-deep)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Precision Fit</span>
                        </div>
                        <h2>Select Your <em>{productLabel} Model</em></h2>
                        <p>Our 2026 flagship skins are custom-engineered for absolute accuracy</p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: 20, 
                        padding: '0 24px 80px',
                        maxWidth: 1200,
                        margin: '0 auto'
                    }}>
                        {models.map((m, i) => (
                            <div key={m.id}
                                onClick={() => { onSelect(m); setTimeout(onNext, 400); }}
                                style={{
                                    background: selected?.id === m.id ? 'linear-gradient(135deg, #fff, #fff1f2)' : '#fff',
                                    padding: '24px',
                                    borderRadius: 24,
                                    border: `2px solid ${selected?.id === m.id ? 'var(--pink-deep)' : 'transparent'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1.0)',
                                    transform: selected?.id === m.id ? 'scale(1.02)' : 'none',
                                    boxShadow: selected?.id === m.id ? '0 15px 35px rgba(212,104,142,0.12)' : '0 4px 20px rgba(0,0,0,0.04)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 20,
                                    animation: `fadeSlideUp 0.5s ${i * 0.05}s both`
                                }}
                                onMouseEnter={(e) => { if (selected?.id !== m.id) e.currentTarget.style.transform = 'translateY(-5px)'; }}
                                onMouseLeave={(e) => { if (selected?.id !== m.id) e.currentTarget.style.transform = 'none'; }}
                            >
                                <div style={{
                                    width: 60, height: 60, borderRadius: 18,
                                    background: selected?.id === m.id ? 'var(--pink-deep)' : '#f8fafc',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: selected?.id === m.id ? '#fff' : 'var(--text-dark)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <BrandIcon brand={m.brand} color={selected?.id === m.id ? '#fff' : 'var(--text-dark)'} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--pink-deep)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                                        {m.brand} • ₹{calculateDynamicPrice(product, 'pro', {}, m).total}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.01em' }}>{m.name}</div>
                                </div>
                                {selected?.id === m.id && (
                                    <div style={{ 
                                        width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,104,142,0.1)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink-deep)', fontSize: 16, fontWeight: 800 
                                    }}>✓</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', paddingBottom: 80 }}>
                        <button className="btn btn-secondary" onClick={onBack}>← Back to Modes</button>
                    </div>
                </div>
            );
        }

        /* — FREE DRAW STUDIO — */
        function FreeDrawStudio({ onDrawSave, initialData }) {
            const canvasRef = React.useRef(null);
            const [isDrawing, setIsDrawing] = React.useState(false);
            const [color, setColor] = React.useState('#1e293b');
            const [brushSize, setBrushSize] = React.useState(5);
            const [tool, setTool] = React.useState('pen'); // pen, marker, neon, eraser
            const [history, setHistory] = React.useState([]);
            const [historyIndex, setHistoryIndex] = React.useState(-1);

            React.useEffect(() => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                if (initialData && historyIndex === -1) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        saveState();
                    };
                    img.src = initialData;
                } else if (historyIndex === -1) {
                    saveState();
                }
            }, []);

            const saveState = () => {
                const canvas = canvasRef.current;
                const data = canvas.toDataURL();
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(data);
                if (newHistory.length > 10) newHistory.shift(); // Max 10 states
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
                onDrawSave(data);
            };

            const undo = () => {
                if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    restoreState(history[newIndex]);
                    onDrawSave(history[newIndex]);
                } else if (historyIndex === 0) {
                    // special case for undoing to blank state if we started blank
                    const newIndex = -1;
                    setHistoryIndex(newIndex);
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    onDrawSave(null);
                }
            };

            const clearCanvas = () => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                saveState();
            };

            const restoreState = (dataUrl) => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = dataUrl;
            };

            const startDrawing = (e) => {
                setIsDrawing(true);
                draw(e);
            };

            const stopDrawing = () => {
                if (isDrawing) {
                    setIsDrawing(false);
                    saveState();
                }
            };

            const draw = (e) => {
                if (!isDrawing) return;
                
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const rect = canvas.getBoundingClientRect();
                
                let clientX = e.clientX;
                let clientY = e.clientY;
                
                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                }

                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (clientX - rect.left) * scaleX;
                const y = (clientY - rect.top) * scaleY;

                ctx.lineWidth = brushSize;
                ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
                ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                
                if (tool === 'marker') {
                    ctx.globalAlpha = 0.5;
                    ctx.shadowBlur = 0;
                } else if (tool === 'neon') {
                    ctx.globalAlpha = 1;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;
                } else {
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 0;
                }

                requestAnimationFrame(() => {
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                });
            };

            return (
                <div className="draw-studio-container bloom-in">
                    <div className="draw-tools">
                        <button className={`draw-tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')}>✏️ Pen</button>
                        <button className={`draw-tool-btn ${tool === 'marker' ? 'active' : ''}`} onClick={() => setTool('marker')}>🖍️ Marker</button>
                        <button className={`draw-tool-btn ${tool === 'neon' ? 'active' : ''}`} onClick={() => setTool('neon')}>✨ Neon</button>
                        <button className={`draw-tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>🧽 Eraser</button>
                        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 8px' }} />
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer' }} />
                        <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} style={{ width: 80 }} />
                        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 8px' }} />
                        <button className="draw-tool-btn" onClick={undo} disabled={historyIndex < 0}>↩️ Undo</button>
                        <button className="draw-tool-btn" onClick={clearCanvas}>🗑️ Clear</button>
                    </div>
                    <div className="draw-canvas-wrapper">
                        <canvas
                            ref={canvasRef}
                            width={560}
                            height={1160}
                            className="draw-canvas"
                            onMouseDown={(e) => {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.beginPath();
                                startDrawing(e);
                            }}
                            onMouseMove={draw}
                            onMouseUp={() => {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.beginPath();
                                stopDrawing();
                            }}
                            onMouseLeave={() => {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.beginPath();
                                stopDrawing();
                            }}
                            onTouchStart={(e) => {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.beginPath();
                                startDrawing(e);
                            }}
                            onTouchMove={(e) => {
                                draw(e);
                            }}
                            onTouchEnd={() => {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.beginPath();
                                stopDrawing();
                            }}
                        />
                    </div>
                </div>
            );
        }

        /* — IMAGE UPLOADER — */
        function ImageUploader({ onImageUpload, initialImage }) {
            const [image, setImage] = React.useState(initialImage || null);
            
            const handleFileChange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 800; // max dimension for compression
                        
                        if (width > height && width > maxDim) {
                            height *= maxDim / width;
                            width = maxDim;
                        } else if (height > maxDim) {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const dataUrl = canvas.toDataURL('image/webp', 0.85);
                        setImage({ src: dataUrl, scale: 100, x: 0, y: 0, rotate: 0 });
                        onImageUpload({ src: dataUrl, scale: 100, x: 0, y: 0, rotate: 0 });
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };

            const updateTransform = (key, value) => {
                if (!image) return;
                const newImage = { ...image, [key]: value };
                setImage(newImage);
                onImageUpload(newImage);
            };

            return (
                <div className="upload-container bloom-in">
                    {!image ? (
                        <div className="upload-dropzone" onClick={() => document.getElementById('image-upload-input').click()}>
                            <div className="upload-icon">📸</div>
                            <div className="upload-text">Click or drag image to upload</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>JPG, PNG, WEBP max 5MB</div>
                            <input type="file" id="image-upload-input" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: 16 }}>
                                <img src={image.src} alt="Uploaded preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                            </div>
                            <div className="upload-controls">
                                <div className="upload-control-row">
                                    <div className="upload-control-label">Scale</div>
                                    <input type="range" className="upload-control-slider" min="10" max="300" value={image.scale} onChange={(e) => updateTransform('scale', parseInt(e.target.value))} />
                                </div>
                                <div className="upload-control-row">
                                    <div className="upload-control-label">Rotate</div>
                                    <input type="range" className="upload-control-slider" min="-180" max="180" value={image.rotate} onChange={(e) => updateTransform('rotate', parseInt(e.target.value))} />
                                </div>
                                <div className="upload-control-row">
                                    <div className="upload-control-label">X Pos</div>
                                    <input type="range" className="upload-control-slider" min="-200" max="200" value={image.x} onChange={(e) => updateTransform('x', parseInt(e.target.value))} />
                                </div>
                                <div className="upload-control-row">
                                    <div className="upload-control-label">Y Pos</div>
                                    <input type="range" className="upload-control-slider" min="-200" max="200" value={image.y} onChange={(e) => updateTransform('y', parseInt(e.target.value))} />
                                </div>
                            </div>
                            <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={() => { setImage(null); onImageUpload(null); }}>
                                🗑️ Remove Image
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        /* — PRO MODE ADVANCED DESIGN STUDIO — */
        const STUDIO_TABS = [
            { id: 'color',   label: 'Color',    icon: '🎨' },
            { id: 'pattern', label: 'Pattern',  icon: '✨' },
            { id: 'effect',  label: 'Effect',   icon: '🪄' },
            { id: 'text',    label: 'Type',     icon: '✍️' },
            { id: 'draw',    label: 'Draw',     icon: '🖌️' },
            { id: 'upload',  label: 'Upload',   icon: '📸' },
        ];

        function ProMode({ product, selectedModel, design, onDesignChange, onNext, onBack }) {
            const [step, setStep] = React.useState('color');
            const [rotation, setRotation] = React.useState(0);
            const [isAutoSpinning, setIsAutoSpinning] = React.useState(false);
            const isMobileInit = typeof window !== 'undefined' && window.innerWidth <= 768;
            const [collapsed, setCollapsed] = React.useState(isMobileInit);
            const [previewSize, setPreviewSize] = React.useState(300);
            const mainRef = React.useRef(null);

            React.useEffect(() => {
                let animationFrameId;
                if (isAutoSpinning) {
                    const animate = () => {
                        setRotation(prev => prev >= 180 ? -180 : prev + 1);
                        animationFrameId = requestAnimationFrame(animate);
                    };
                    animationFrameId = requestAnimationFrame(animate);
                }
                return () => cancelAnimationFrame(animationFrameId);
            }, [isAutoSpinning]);
            const prod = PRODUCTS.find(p => p.id === product);

            // Dynamic preview size via ResizeObserver
            React.useEffect(() => {
                if (!mainRef.current) return;
                const ro = new ResizeObserver(entries => {
                    for (const e of entries) {
                        const { width, height } = e.contentRect;
                        const isPhone = product === 'phone';
                        const isLaptop = product === 'laptop';
                        const aspect = isPhone ? (0.5) : isLaptop ? (1.6) : (0.95);
                        const maxH = height * 0.58;
                        const maxW = width * 0.72;
                        const byH = maxH * (isPhone ? 0.67 : isLaptop ? 1 / aspect : 1);
                        setPreviewSize(Math.max(160, Math.min(byH, maxW)));
                    }
                });
                ro.observe(mainRef.current);
                return () => ro.disconnect();
            }, [product]);

            return (
                <div className="page fade-in page-enter" style={{ paddingBottom: 0 }}>
                    <StepIndicator steps={product === 'phone' ? ['Product', 'Mode', 'Model', 'Design', 'Preview'] : ['Product', 'Mode', 'Design', 'Preview']} current={product === 'phone' ? 3 : 2} />

                    <div style={{ padding: '0 24px 12px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em', margin: 0 }}>Design <span style={{ color: 'var(--pink-deep)' }}>Studio</span></h2>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Advanced customizer · Blossom™ Engine</p>
                    </div>

                    <div style={{ padding: '0 24px 80px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <div className="pro-studio-shell">
                        {/* ── COLLAPSIBLE SIDEBAR ── */}
                        <div className={`pro-sidebar-v3 ${collapsed ? 'collapsed' : 'expanded'}`}>
                            {/* Header with brand + toggle */}
                            <div className="pro-sidebar-header">
                                <div className="pro-sidebar-brand">
                                    <div className="pro-sidebar-badge-row">
                                        <span className="pro-sidebar-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>3M™ VINYL</span>
                                        <span className="pro-sidebar-badge" style={{ background: '#fef3c7', color: '#92400e' }}>AIR-RELEASE</span>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1a1a1b', fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                        Blossom <span style={{ color: 'var(--pink-deep)' }}>Studio</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                        {selectedModel ? selectedModel.name : (prod?.name)}
                                    </div>
                                </div>
                                <button className="pro-sidebar-toggle" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(c => !c)}>
                                    {collapsed ? '▶' : '◀'}
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="pro-sidebar-scroll">
                                {collapsed ? (
                                    /* COLLAPSED: Icon-only rail with hover tooltips */
                                    <div className="pro-icon-rail">
                                        {STUDIO_TABS.map(t => (
                                            <button key={t.id} className={`pro-icon-tab${step === t.id ? ' active' : ''}`} data-label={t.label} onClick={() => setStep(t.id)}>
                                                {t.icon}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    /* EXPANDED: Full tabs strip + panel content */
                                    <>
                                        <div className="pro-tabs-strip">
                                            {STUDIO_TABS.map(t => (
                                                <button key={t.id} className={`pro-tab-btn${step === t.id ? ' active' : ''}`} onClick={() => setStep(t.id)}>
                                                    <span className="tab-icon">{t.icon}</span>
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                <div className="pro-content">
                                    {step === 'color' && (
                                        <div className="pro-panel bloom-in">
                                            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Base Material</h3>
                                                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Select foundation pigment. <span style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>1st Free</span></p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>EXTRA COLORS</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                                        <button onClick={() => onDesignChange({ extraColorCount: Math.max(0, (design.extraColorCount || 0) - 1) })} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>-</button>
                                                        <span style={{ fontSize: 14, fontWeight: 900 }}>{design.extraColorCount || 0}</span>
                                                        <button onClick={() => onDesignChange({ extraColorCount: (design.extraColorCount || 0) + 1 })} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>+</button>
                                                    </div>
                                                    <div style={{ fontSize: 9, color: 'var(--pink-deep)', fontWeight: 700, marginTop: 4 }}>+₹10/ea</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                                                {COLORS.map(c => (
                                                    <div key={c}
                                                        onClick={() => onDesignChange({ bgColor: c })}
                                                        style={{
                                                            aspectRatio: '1', borderRadius: '50%', background: c, cursor: 'pointer',
                                                            border: design.bgColor === c ? '3px solid #1e293b' : '2px solid transparent',
                                                            boxShadow: design.bgColor === c ? `0 0 0 4px ${c}22` : 'none',
                                                            transition: '0.2s transform ease',
                                                            transform: design.bgColor === c ? 'scale(1.1)' : 'scale(1)'
                                                        }} />
                                                ))}
                                            </div>
                                            <div style={{ marginTop: 32, padding: 20, background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 12, letterSpacing: '0.1em' }}>SPECTRAL HEX CODE</div>
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <input type="text" value={design.bgColor} onChange={(e) => onDesignChange({ bgColor: e.target.value })}
                                                        style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }} />
                                                    <input type="color" value={design.bgColor} onChange={(e) => onDesignChange({ bgColor: e.target.value })}
                                                        style={{ width: 44, height: 44, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 'pattern' && (
                                        <div className="pro-panel bloom-in">
                                            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Stickers & Patterns</h3>
                                                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Select grade patterned vinyl. <span style={{ color: 'var(--pink-deep)', fontWeight: 700 }}>₹25–₹49</span></p>
                                                </div>
                                                <div className="badge-value" style={{ padding: '4px 10px', borderRadius: 4, fontSize: 9, fontWeight: 900, color: '#fff' }}>POPULAR Choice</div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                {PATTERNS.map(p => (
                                                    <div key={p.id}
                                                        onClick={() => onDesignChange({ pattern: p.id })}
                                                        style={{
                                                            padding: 10, borderRadius: 16, background: '#fff',
                                                            border: design.pattern === p.id ? '2px solid #1e293b' : '1px solid #f1f5f9',
                                                            cursor: 'pointer', transition: 'all 0.2s ease',
                                                            boxShadow: design.pattern === p.id ? '0 8px 20px rgba(0,0,0,0.06)' : 'none'
                                                        }}>
                                                        <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 10, marginBottom: 10, backgroundColor: design.bgColor, overflow: 'hidden' }}>
                                                            <div className={`pattern-layer pattern-${p.id}`} style={{ opacity: 0.9, mixBlendMode: 'normal' }} />
                                                            {p.id === 'none' && <div style={{ height: '100%', background: design.bgColor }} />}
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{p.name} <span style={{ color: 'var(--pink-deep)', fontSize: 10 }}>{p.id === 'none' ? 'FREE' : '₹49'}</span></div>
                                                        <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.sub}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step === 'effect' && (
                                        <div className="pro-panel bloom-in">
                                            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Surface & Hand Art</h3>
                                                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Premium studio coating or artisanal art.</p>
                                                </div>
                                                <div onClick={() => onDesignChange({ hasHandArt: !design.hasHandArt })}
                                                    style={{
                                                        padding: '12px 16px', borderRadius: 14,
                                                        background: design.hasHandArt ? 'var(--pink-deep)' : '#f8fafc',
                                                        color: design.hasHandArt ? '#fff' : 'var(--text-dark)',
                                                        border: '1px solid #e2e8f0', cursor: 'pointer', transition: '0.2s all'
                                                    }}>
                                                    <div style={{ fontSize: 9, fontWeight: 900, opacity: 0.8 }}>EXCLUSIVE</div>
                                                    <div style={{ fontSize: 13, fontWeight: 800 }}>HAND ART <span style={{ fontSize: 10 }}>₹249</span></div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                                                {EFFECTS.map(e => (
                                                    <div key={e.id}
                                                        onClick={() => onDesignChange({ effect: e.id })}
                                                        style={{
                                                            padding: 16, cursor: 'pointer', borderRadius: 16, background: '#fff',
                                                            border: design.effect === e.id ? '2px solid #1e293b' : '1px solid #f1f5f9',
                                                            display: 'flex', alignItems: 'center', gap: 16,
                                                            transition: 'all 0.2s ease'
                                                        }}>
                                                        <div style={{
                                                            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                                            background: design.bgColor, border: '1px solid #f1f5f9',
                                                            ...(e.id === 'satin-gloss' ? { background: `radial-gradient(circle at 30% 30%, #fffb 0%, ${design.bgColor} 70%)` } : {}),
                                                            ...(e.id === 'liquid-metal' ? { background: `linear-gradient(135deg, ${design.bgColor} 0%, #fff7 45%, #fffb 50%, #fff7 55%, ${design.bgColor} 100%)` } : {}),
                                                            ...(e.id === 'holo-prism' ? { background: `linear-gradient(135deg, ${design.bgColor} 20%, #FF00FF33 40%, #00FFFF33 60%, #FFFF0033 80%, ${design.bgColor} 100%)` } : {}),
                                                            ...(e.id === 'gold-plating' ? { background: 'linear-gradient(135deg, #d4af37, #f9e29c, #d4af37)' } : {}),
                                                            ...(e.id === 'frost-glass' ? { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' } : {})
                                                        }} />
                                                        <div>
                                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{e.label} <span style={{ color: 'var(--pink-deep)', fontSize: 10 }}>{e.id === 'none' ? 'FREE' : '₹49'}</span></div>
                                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{e.sub}</div>
                                                        </div>
                                                        {design.effect === e.id && <div style={{ marginLeft: 'auto', color: 'var(--pink-deep)', fontWeight: 900 }}>●</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step === 'text' && (
                                        <div className="pro-panel bloom-in">
                                            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Typography & Photos</h3>
                                                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Add custom laser typography or memories.</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>PHOTO ELEMENTS</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                                        <button onClick={() => onDesignChange({ photoCount: Math.max(0, (design.photoCount || 0) - 1) })} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>-</button>
                                                        <span style={{ fontSize: 14, fontWeight: 900 }}>{design.photoCount || 0}</span>
                                                        <button onClick={() => onDesignChange({ photoCount: (design.photoCount || 0) + 1 })} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>+</button>
                                                    </div>
                                                    <div style={{ fontSize: 9, color: 'var(--pink-deep)', fontWeight: 700, marginTop: 4 }}>+₹59 then ₹30/ea</div>
                                                </div>
                                            </div>
                                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                                <input type="text" placeholder="Design your message..." value={design.text || ''}
                                                    onChange={e => onDesignChange({ text: e.target.value })}
                                                    style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 600 }} />
                                                <div className="price-tag-inline" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>+₹29</div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>FONT TYPE</label>
                                                    <select value={design.fontStyle} onChange={e => onDesignChange({ fontStyle: e.target.value })}
                                                        style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600 }}>
                                                        {FONT_STYLES.map(f => <option key={f}>{f}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <label style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>PLACEMENT</label>
                                                    <select value={design.textPosition} onChange={e => onDesignChange({ textPosition: e.target.value })}
                                                        style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600 }}>
                                                        {TEXT_POSITIONS.map(p => <option key={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Advanced Controls Compact */}
                                            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                {[
                                                    { k: 'Size', v: 'textSize', min: 12, max: 64 },
                                                    { k: 'X-Pos', v: 'textX', min: -100, max: 100 },
                                                    { k: 'Y-Pos', v: 'textY', min: -100, max: 100 },
                                                    { k: 'Rotate', v: 'textRotation', min: 0, max: 360 }
                                                ].map(ctrl => (
                                                    <div key={ctrl.k} style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                                        <label style={{ width: 60, fontSize: 10, fontWeight: 900, color: '#64748b' }}>{ctrl.k.toUpperCase()}</label>
                                                        <input type="range" min={ctrl.min} max={ctrl.max} value={design[ctrl.v]}
                                                            onChange={e => onDesignChange({ [ctrl.v]: parseInt(e.target.value) })}
                                                            style={{ flex: 1, accentColor: '#1e293b' }} />
                                                        <span style={{ width: 30, fontSize: 10, fontWeight: 800, textAlign: 'right' }}>{design[ctrl.v]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step === 'draw' && (
                                        <div className="pro-panel bloom-in">
                                            <div style={{ marginBottom: 24 }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Free Draw Studio</h3>
                                                <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Draw directly on your product with our premium brushes.</p>
                                            </div>
                                            <FreeDrawStudio 
                                                onDrawSave={(data) => onDesignChange({ drawData: data })} 
                                                initialData={design.drawData} 
                                            />
                                        </div>
                                    )}

                                    {step === 'upload' && (
                                        <div className="pro-panel bloom-in">
                                            <div style={{ marginBottom: 24 }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Image Upload</h3>
                                                <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Upload your own photo and transform it.</p>
                                            </div>
                                            <ImageUploader 
                                                onImageUpload={(data) => onDesignChange({ uploadedImage: data })} 
                                                initialImage={design.uploadedImage} 
                                            />
                                        </div>
                                    )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sidebar footer */}
                            <div className="pro-sidebar-footer">
                                <div className="pro-sidebar-footer-expanded">
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: 13 }} onClick={onNext}>Preview →</button>
                                        <button className="btn btn-secondary" style={{ width: 46, padding: 0 }} onClick={onBack}>✕</button>
                                    </div>
                                </div>
                                <div className="pro-sidebar-footer-collapsed" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                                    <button className="pro-icon-tab" data-label="Preview" style={{ background: 'var(--pink-deep)', color: '#fff' }} onClick={onNext}>→</button>
                                    <button className="pro-icon-tab" data-label="Back" onClick={onBack}>✕</button>
                                </div>
                            </div>
                        </div>

                        {/* ── MAIN PREVIEW AREA ── */}
                        <div className="pro-main-v3" ref={mainRef}>
                            <div className="pro-main-glow-a" />
                            <div className="pro-main-glow-b" />

                            <div className="pro-preview-frame">
                                <div className="pro-preview-product float-pro">
                                    <ProductPreview product={product} selectedModel={selectedModel} design={design} size={previewSize} rotationY={rotation} />
                                </div>

                                {/* Rotation bar */}
                                <div className="pro-rotation-bar">
                                    <span className="pro-rotation-label">{rotation}°</span>
                                    <input type="range" min="-180" max="180" value={rotation}
                                        onChange={e => { setRotation(parseInt(e.target.value)); setIsAutoSpinning(false); }} />
                                    <button className={`pro-spin-btn${isAutoSpinning ? ' spinning' : ''}`} onClick={() => setIsAutoSpinning(s => !s)}>
                                        {isAutoSpinning ? 'STOP' : '360°'}
                                    </button>
                                </div>

                                {/* Floating action bar */}
                                <div className="pro-action-bar">
                                    <button className="pro-action-btn" onClick={() => onDesignChange({ text: '' })}>RESET TEXT</button>
                                    <div className="pro-action-divider" />
                                    <button className="pro-action-btn" onClick={() => { onDesignChange({ bgColor: COLORS[Math.floor(Math.random()*COLORS.length)], pattern: PATTERNS[Math.floor(Math.random()*PATTERNS.length)].id }); }}>✨ SHUFFLE</button>
                                    <div className="pro-action-divider" />
                                    <button className="pro-action-btn" onClick={() => setCollapsed(c => !c)}>✨ {collapsed ? 'EXPAND' : 'FOCUS'}</button>
                                </div>

                                {/* Spec row */}
                                <div className="pro-spec-row">
                                    <div className="pro-spec-item"><div className="pro-spec-label">ANTI-SCRATCH</div><div className="pro-spec-sub">Protective Lamination</div></div>
                                    <div className="pro-spec-item"><div className="pro-spec-label">ULTRA-SLIM</div><div className="pro-spec-sub">0.23mm Thickness</div></div>
                                    <div className="pro-spec-item"><div className="pro-spec-label">PRECISION FIT</div><div className="pro-spec-sub">Laser-Cut Tech</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* ── MOBILE FLOATING BOTTOM TABS ── */}
                    <div className="pro-mobile-tabs-bar">
                        {STUDIO_TABS.map(t => (
                            <button key={t.id} className={`pro-mobile-tab${step === t.id ? ' active' : ''}`} onClick={() => setStep(t.id)}>
                                <span className="tab-icon">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        /* ─── CUSTOMER REVIEWS (PROFESSIONAL) ─── */

        /* — FINAL PREVIEW — */
        /* — FINAL PREVIEW — */
        function FinalPreview({ product, selectedModel, mode, design, onAddToCart, onBack, onReset }) {
            const [rotation, setRotation] = React.useState(0);
            const [isAutoSpinning, setIsAutoSpinning] = React.useState(false);
            const prod = PRODUCTS.find(p => p.id === product);

            // Dynamic Pricing Logic
            const { total, breakdown } = React.useMemo(() => calculateDynamicPrice(product, mode, design, selectedModel), [product, mode, design, selectedModel]);

            React.useEffect(() => {
                let animationFrameId;
                if (isAutoSpinning) {
                    const animate = () => {
                        setRotation(prev => prev >= 180 ? -180 : prev + 1);
                        animationFrameId = requestAnimationFrame(animate);
                    };
                    animationFrameId = requestAnimationFrame(animate);
                }
                return () => cancelAnimationFrame(animationFrameId);
            }, [isAutoSpinning]);
            const theme = design.themeId ? THEMES.find(t => t.id === design.themeId) : null;
            const previewRef = React.useRef(null);
            const handleDownload = async () => {
                if (!previewRef.current) return;
                const btn = document.getElementById('download-btn');
                const originalText = btn.innerText;
                btn.innerText = '📸 Capturing...';
                btn.disabled = true;

                try {
                    const canvas = await html2canvas(previewRef.current, {
                        backgroundColor: null,
                        scale: 2,
                        logging: false,
                        useCORS: true
                    });
                    const link = document.createElement('a');
                    link.download = `blossom-design-${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (err) {
                    console.error('Download failed:', err);
                    alert('Download failed. Please try again.');
                } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            };

            return (
                <div className="page fade-in page-enter">
                    <StepIndicator steps={product === 'phone' && mode === 'pro' ? ['Product', 'Mode', 'Model', 'Design', 'Preview'] : ['Product', 'Mode', 'Design', 'Preview']} current={product === 'phone' && mode === 'pro' ? 4 : 3} />

                    <div className="final-page" style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(500px, 1fr) 420px',
                        gap: 80,
                        maxWidth: 1200,
                        margin: '60px auto 100px',
                        alignItems: 'start'
                    }}>
                        {/* LEFT COLUMN: Premium Interactive Mockup */}
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="preview-canvas" style={{
                                position: 'relative',
                                width: '100%',
                                minHeight: '680px',
                                padding: '120px 40px',
                                background: 'radial-gradient(circle at center, #fff 0%, #f3f3f6 100%)',
                                borderRadius: 40,
                                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.02), 0 20px 80px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'visible'
                            }}>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: `radial-gradient(circle at 30% 20%, ${design.bgColor}15 0%, transparent 60%)`,
                                    opacity: 0.8, pointerEvents: 'none'
                                }} />

                                <div ref={previewRef} style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flex: 1
                                }}>
                                    <ProductPreview product={product} selectedModel={selectedModel} design={design} size={280} rotationY={rotation} isEasyMode={mode === 'easy'} />
                                </div>

                                {/* 360 Perspectives Tracker */}
                                <div style={{ marginTop: 60, width: '100%', maxWidth: 360, textAlign: 'center', zIndex: 10 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--text-light)', marginBottom: 20 }}>
                                        ↔ Rotate Studio Perspective
                                    </div>
                                    <input
                                        type="range" min="-180" max="180" value={rotation}
                                        onChange={e => {
                                            setRotation(parseInt(e.target.value));
                                            setIsAutoSpinning(false);
                                        }}
                                        style={{ width: '100%', accentColor: 'var(--pink-deep)', cursor: 'ew-resize' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-mid)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                                            {rotation}° Angle
                                        </div>
                                        <button
                                            onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                                            style={{
                                                background: isAutoSpinning ? 'var(--pink-deep)' : '#fff',
                                                color: isAutoSpinning ? '#fff' : 'var(--pink-deep)',
                                                border: '1px solid var(--pink-deep)',
                                                borderRadius: 20, padding: '4px 16px', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                                letterSpacing: '0.1em', transition: 'all 0.2s',
                                                boxShadow: isAutoSpinning ? '0 4px 12px rgba(212, 104, 142, 0.4)' : 'none'
                                            }}>
                                            {isAutoSpinning ? 'STOP 360' : 'AUTO 360'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 30, display: 'flex', gap: 15, opacity: 0.7 }}>
                                <div style={{ background: '#fff', border: '1.5px solid #eee', borderRadius: 50, padding: '8px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>✨ STUDIO RENDER</div>
                                <div style={{ background: '#fff', border: '1.5px solid #eee', borderRadius: 50, padding: '8px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>🎨 4K PRINT READY</div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Professional Product Sidebar (Skinit Style) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Product Header Card */}
                            <div className="spec-card" style={{ padding: 40, borderRadius: 28 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink-deep)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Available Now</div>
                                        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                                            {mode === 'pro' ? (selectedModel ? selectedModel.name : prod?.name) : (design.manualModel || 'Custom Device')} <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-mid)', marginTop: 4 }}>Signature Series Skin</span>
                                        </h2>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <AnimatedPrice value={total} />
                                        <div style={{ fontSize: 10, color: '#10b981', fontWeight: 800, letterSpacing: '0.05em', marginTop: 4 }}>✓ IN STOCK</div>
                                    </div>
                                </div>

                                <div className="divider" style={{ margin: '24px 0' }}></div>

                                {/* Customization Details */}
                                    <div style={{ flex: 1, padding: 16, background: 'var(--beige-soft)', borderRadius: 16 }}>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.08em', marginBottom: 6 }}>DEVICE MODEL</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{mode === 'pro' ? (selectedModel ? selectedModel.name : 'Standard') : (design.manualModel || 'Custom Device')}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: 16, background: 'var(--beige-soft)', borderRadius: 16 }}>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.08em', marginBottom: 6 }}>FINISH TYPE</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{(design.effect || 'none').toUpperCase() === 'NONE' ? 'Satin Matte' : (design.effect || 'none').toUpperCase()}</div>
                                    </div>

                                {/* Dynamic Price Breakdown */}
                                <div style={{ background: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 30, border: '1px solid #edf2f7' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 15, textTransform: 'uppercase' }}>Price Breakdown</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {breakdown.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-mid)' }}>{item.label}</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>₹{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button className="btn btn-primary btn-full shadow-glow"
                                    style={{ padding: '24px', fontSize: 16, borderRadius: 20, background: 'linear-gradient(135deg, var(--text-dark), #000)' }}
                                    onClick={() => onAddToCart(total)}>
                                    ADD TO CART — ₹{total}
                                </button>

                                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                    <button id="download-btn" className="btn btn-outline" style={{ flex: 1, borderRadius: 16, padding: '14px' }} onClick={handleDownload}>📷 Export Render</button>
                                    <button className="btn btn-secondary" style={{ flex: 1, borderRadius: 16, padding: '14px' }} onClick={onBack}>← Edit Design</button>
                                </div>
                            </div>

                            {/* Professional Specs Card */}
                            <div className="spec-card" style={{ padding: 32, borderRadius: 24 }}>
                                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 20 }}>Technical Specifications</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { icon: '💎', k: 'Material', v: 'Premium 3M™ Cast Vinyl' },
                                        { icon: '💨', k: 'Air-Release', v: 'Bubble-Free Application' },
                                        { icon: '🛡️', k: 'Protection', v: 'Anti-Scratch Laminate' },
                                        { icon: '📏', k: 'Precision', v: 'CNC Laser Cut (0.01mm Fit)' }
                                    ].map(({ icon, k, v }) => (
                                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ fontSize: 20, width: 44, height: 44, borderRadius: 12, background: 'var(--beige-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.02em' }}>{k.toUpperCase()}</div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>{v}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <button className="btn btn-link" onClick={onReset} style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500, letterSpacing: '0.05em' }}>
                                    START NEW DESIGN ↺
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        /* ── CART DRAWER ── */
        function CartDrawer({ cart, onClose, onRemove, onCheckout }) {
            const total = cart.reduce((s, i) => s + i.price, 0);
            return (
                <>
                    <div className="cart-overlay" onClick={onClose}></div>
                    <div className="cart-drawer">
                        <div className="cart-header">
                            <h3>Your Cart</h3>
                            <button className="cart-close" onClick={onClose}>✖</button>
                        </div>
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <div className="cart-empty">
                                    <div className="cart-empty-icon">
                                        <img loading="lazy" src="/images/icon_designs.png" alt="cart" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} style={{ width: 64, height: 64, margin: '0 auto', opacity: 0.5 }} />
                                    </div>
                                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, fontFamily: 'Montserrat,sans-serif' }}>Your cart is empty</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 300 }}>Start designing to add items!</p>
                                </div>
                            ) : cart.map((item, i) => (
                                <div className="cart-item" key={i}>
                                    <div className="cart-item-thumb" style={{ background: item.bg || 'var(--beige-soft)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ pointerEvents: 'none' }}>
                                            <ProductPreview product={item.product} selectedModel={item.selectedModel} design={item.design} size={30} isEasyMode={item.mode === 'easy'} />
                                        </div>
                                    </div>
                                    <div className="cart-item-info">
                                        <div className="cart-item-name">{item.productName}</div>
                                        <div className="cart-item-detail">{item.themeName} {item.detail}</div>
                                        <div className="cart-item-price">₹{item.price}</div>
                                    </div>
                                    <button className="cart-remove" onClick={() => onRemove(i)}>✖</button>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total</span>
                                    <span style={{ color: 'var(--pink-deep)' }}>₹{total}</span>
                                </div>
                                <button className="btn btn-primary btn-full" onClick={() => { onClose(); onCheckout(); }}>Checkout →</button>
                            </div>
                        )}
                    </div>
                </>
            );
        }
        /* ——— CHECKOUT PAGE ——— */
        function CheckoutPage({ cart, onPlaceOrder, onBack }) {
            const [step, setStep] = useState(1);
            const [paymentMethod, setPaymentMethod] = useState('card');
            const [orderDone, setOrderDone] = useState(false);
            const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
            const shipping = 40;
            const total = subtotal + shipping;

            const [shippingData, setShippingData] = useState({
                firstName: '', lastName: '', address: '', city: '', zip: ''
            });
            const [errors, setErrors] = useState({});

            const validateShipping = () => {
                let newErrors = {};
                if (shippingData.firstName.trim().length < 2) newErrors.firstName = 'First name too short';
                if (shippingData.lastName.trim().length < 2) newErrors.lastName = 'Last name too short';
                if (shippingData.address.trim().length < 10) newErrors.address = 'Please provide more address detail';
                if (shippingData.city.trim().length < 2) newErrors.city = 'Invalid city name';
                if (!/^[1-9][0-9]{5}$/.test(shippingData.zip)) newErrors.zip = 'Enter a valid 6-digit Pincode';
                
                setErrors(newErrors);
                return Object.keys(newErrors).length === 0;
            };

            const handleShippingSubmit = (e) => {
                e.preventDefault();
                if (validateShipping()) {
                    setStep(2);
                }
            };

            const updateField = (field, val) => {
                setShippingData({ ...shippingData, [field]: val });
                if (errors[field]) {
                    setErrors({ ...errors, [field]: null });
                }
            };

            if (orderDone) {
                return (
                    <div className="page fade-in" style={{ textAlign: 'center', padding: '120px 24px' }}>
                        <div style={{ fontSize: 80, marginBottom: 20 }}>🌸</div>
                        <h2 style={{ fontFamily: 'Great Vibes', fontSize: 48, color: 'var(--pink-deep)', marginBottom: 15 }}>Order Placed Successfully!</h2>
                        <p style={{ color: 'var(--text-mid)', fontSize: 16, maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.6 }}>
                            Thank you for your purchase! Your custom creation is being handcrafted and will bloom at your doorstep soon.
                        </p>
                        <button className="btn btn-primary" onClick={onPlaceOrder}>Return Home</button>
                    </div>
                );
            }

            return (
                <div className="page fade-in" style={{ padding: '80px 24px 120px', maxWidth: 1100, margin: '0 auto' }}>
                    <div className="section-header">
                        <h2>Secure <em>Checkout</em></h2>
                        <p>Complete your purchase to bring your custom blossom home</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }} className="checkout-grid">
                        {/* LEFT: Form */}
                        <div className="glass-card" style={{ padding: 40, borderRadius: 24, background: '#fff' }}>
                            <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                                <div style={{ opacity: step === 1 ? 1 : 0.4, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>1. Shipping</div>
                                <div style={{ opacity: step === 2 ? 1 : 0.4, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>2. Payment</div>
                            </div>

                            {step === 1 ? (
                                <form onSubmit={handleShippingSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                        <div className="auth-field" style={{ margin: 0 }}>
                                            <label>First Name</label>
                                            <input type="text" placeholder="Jane" value={shippingData.firstName} onChange={(e) => updateField('firstName', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.firstName ? '#ef4444' : '#ddd'}`, borderRadius: 12 }} />
                                            {errors.firstName && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.firstName}</div>}
                                        </div>
                                        <div className="auth-field" style={{ margin: 0 }}>
                                            <label>Last Name</label>
                                            <input type="text" placeholder="Doe" value={shippingData.lastName} onChange={(e) => updateField('lastName', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.lastName ? '#ef4444' : '#ddd'}`, borderRadius: 12 }} />
                                            {errors.lastName && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.lastName}</div>}
                                        </div>
                                    </div>
                                    <div className="auth-field">
                                        <label>Full Address</label>
                                        <input type="text" placeholder="123 Blossom Lane" value={shippingData.address} onChange={(e) => updateField('address', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.address ? '#ef4444' : '#ddd'}`, borderRadius: 12 }} />
                                        {errors.address && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.address}</div>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 32 }}>
                                        <div className="auth-field" style={{ margin: 0 }}>
                                            <label>City</label>
                                            <input type="text" placeholder="Design City" value={shippingData.city} onChange={(e) => updateField('city', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.city ? '#ef4444' : '#ddd'}`, borderRadius: 12 }} />
                                            {errors.city && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.city}</div>}
                                        </div>
                                        <div className="auth-field" style={{ margin: 0 }}>
                                            <label>Zip Code</label>
                                            <input type="text" placeholder="123456" value={shippingData.zip} onChange={(e) => updateField('zip', e.target.value)} style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.zip ? '#ef4444' : '#ddd'}`, borderRadius: 12 }} />
                                            {errors.zip && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.zip}</div>}
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-full shadow-glow">Continue to Payment →</button>
                                </form>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: 24 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12, color: 'var(--text-mid)' }}>Select Payment Method</label>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            <div 
                                                className="glass-card" 
                                                onClick={() => setPaymentMethod('card')}
                                                style={{ 
                                                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 15, cursor: 'pointer', 
                                                    border: paymentMethod === 'card' ? '2px solid var(--pink-deep)' : '1px solid #eee', 
                                                    background: paymentMethod === 'card' ? 'rgba(212,104,142,0.05)' : '#fff',
                                                    transition: 'all 0.3s'
                                                }}>
                                                <span style={{ fontSize: 24 }}>💳</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>Credit / Debit Card</div>
                                                    <div style={{ fontSize: 12, opacity: 0.6 }}>Safe & Encrypted</div>
                                                </div>
                                                {paymentMethod === 'card' && <span style={{ color: 'var(--pink-deep)' }}>✓</span>}
                                            </div>
                                            <div 
                                                className="glass-card" 
                                                onClick={() => setPaymentMethod('netbanking')}
                                                style={{ 
                                                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 15, cursor: 'pointer', 
                                                    border: paymentMethod === 'netbanking' ? '2px solid var(--pink-deep)' : '1px solid #eee', 
                                                    background: paymentMethod === 'netbanking' ? 'rgba(212,104,142,0.05)' : '#fff',
                                                    transition: 'all 0.3s'
                                                }}>
                                                <span style={{ fontSize: 24 }}>📱</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>UPI / NetBanking</div>
                                                    <div style={{ fontSize: 12, opacity: 0.6 }}>Instant Payment Scan</div>
                                                </div>
                                                {paymentMethod === 'netbanking' && <span style={{ color: 'var(--pink-deep)' }}>✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-full" onClick={() => setOrderDone(true)}>Place Order: ₹{total} ↑</button>
                                    <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={() => setStep(1)}>← Back to Shipping</button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Summary */}
                        <div style={{ position: 'sticky', top: 120 }}>
                            <div className="glass-card" style={{ padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(248,156,108,0.2)' }}>
                                <h3 style={{ fontSize: 18, marginBottom: 24 }}>Order Summary</h3>
                                <div style={{ display: 'grid', gap: 20, maxHeight: 300, overflowY: 'auto', paddingRight: 10, marginBottom: 24 }}>
                                    {cart.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            <div style={{ width: 64, height: 64, background: item.bg || '#eee', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ pointerEvents: 'none' }}>
                                                    <ProductPreview product={item.product} selectedModel={item.selectedModel} design={item.design} size={40} isEasyMode={item.mode === 'easy'} />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.productName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{item.themeName} {item.detail}</div>
                                            </div>
                                            <div style={{ fontWeight: 800 }}>₹{item.price}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid #ddd', paddingTop: 20, display: 'grid', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                        <span>Subtotal</span>
                                        <span style={{ fontWeight: 700 }}>₹{subtotal}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                        <span>Shipping</span>
                                        <span style={{ fontWeight: 700 }}>₹{shipping}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, marginTop: 8, color: 'var(--pink-deep)' }}>
                                        <span>Total</span>
                                        <span>₹{total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        /* ── App ── */
        function App() {
            usePremiumInteractions();
            const [page, setPage] = useState('home');
            const [product, setProd] = useState(null);
            const [mode, setMode] = useState(null);
            const [selectedModel, setSelectedModel] = useState(null);
            const [design, setDesign] = useState({
                bgColor: '#F8C8DC', textSize: 16, textColor: '#2A2A2A',
                textPosition: 'Center', textLayout: 'Horizontal', textX: 0, textY: 0, textRotation: 0,
                pattern: 'none', effect: 'none',
                photoCount: 0, extraColorCount: 0, hasHandArt: false,
                manualModel: ''
            });
            const [cart, setCart] = useState([]);
            const [cartOpen, setCartOpen] = useState(false);
            const [toast, setToast] = useState(null);
            const [petals, setPetals] = useState(false);

            // --- AUTH & PREMIUM STATE ---
            const [user, setUser] = useState(null);
            const [isPremium, setIsPremium] = useState(false);
            const [authOpen, setAuthOpen] = useState(false);
            const [upgradeOpen, setUpgradeOpen] = useState(false);

            // Firebase Auth Sync + Demo Session Loader
            useEffect(() => {
                // 1. Check for Demo Session/Local Session in both storages
                const savedLocal = localStorage.getItem('blossom_demo_user');
                const savedSession = sessionStorage.getItem('blossom_demo_user');
                const savedUser = savedLocal || savedSession;

                if (savedUser) {
                    try {
                        const u = JSON.parse(savedUser);
                        setUser(u);
                        setIsPremium(u.isPremium || false);
                    } catch (e) {
                        localStorage.removeItem('blossom_demo_user');
                        sessionStorage.removeItem('blossom_demo_user');
                    }
                }

                // 2. Real Firebase Sync
                const unsubscribe = auth?.onAuthStateChanged(firebaseUser => {
                    if (firebaseUser && firebaseUser.emailVerified) {
                        const u = {
                            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                            email: firebaseUser.email,
                            isPremium: localStorage.getItem(`premium_${firebaseUser.uid}`) === 'true',
                            uid: firebaseUser.uid,
                            emailVerified: true
                        };
                        setUser(u);
                        setIsPremium(u.isPremium);
                        localStorage.removeItem('blossom_demo_user'); // Prefer real over demo
                    } else if (auth && !isDemoMode) {
                        // Only clear if we aren't in demo mode
                        setUser(null);
                        setIsPremium(false);
                    }
                });
                return () => unsubscribe && unsubscribe();
            }, []);

            const handleLogin = (u, remember) => {
                // MANUALLY set user for Demo Mode and immediate feedback
                setUser(u);
                setIsPremium(u.isPremium || false);
                setAuthOpen(false);

                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('blossom_demo_user', JSON.stringify(u));

                showToast(`Welcome, ${u.name.split(' ')[0]}! 🌸`);
            };

            const handleLogout = async () => {
                try {
                    if (typeof auth !== 'undefined' && auth) {
                        try { await auth.signOut(); } catch (e) { }
                    }
                    localStorage.removeItem('blossom_demo_user');
                    sessionStorage.removeItem('blossom_demo_user');
                    
                    setUser(null);
                    setIsPremium(false);
                    setPage('home');
                    showToast("Logged out successfully.");
                } catch (err) {
                    showToast("Error logging out.");
                }
            };

            const handleUpgrade = () => {
                const updatedUser = { ...user, isPremium: true };
                setUser(updatedUser);
                setIsPremium(true);
                localStorage.setItem('blossom_user', JSON.stringify(updatedUser));
                setUpgradeOpen(false);
                showToast("Welcome to Blossom Premium! 💎");
            };

            const [isVisible, setIsVisible] = useState(false);
            useEffect(() => {
                setIsVisible(false);
                const t = setTimeout(() => setIsVisible(true), 40);
                return () => clearTimeout(t);
            }, [page]);

            const updateDesign = useCallback(patch => setDesign(p => ({ ...p, ...patch })), []);
            const [overlayState, setOverlayState] = useState('visible'); // 'visible' | 'hiding' | 'hidden'

            const handleEnter = () => {
                setOverlayState('hiding');
                setTimeout(() => setOverlayState('hidden'), 820);
            };

            const showToast = (msg) => setToast(msg);

            const addToCart = (customPrice) => {
                const prod = PRODUCTS.find(p => p.id === product);
                const theme = design.themeId ? THEMES.find(t => t.id === design.themeId) : null;
                const finalPrice = customPrice || prod.price;
                
                const detailStr = mode === 'easy' 
                    ? `(${design.manualModel || 'Custom'})` 
                    : `(${selectedModel?.name || 'Standard'})`;

                let previewImage = `/images/product_${prod.id}.png`;
                
                if (mode === 'easy' && theme?.icon) {
                    previewImage = theme.icon;
                }

                setCart(c => [...c, { 
                    productName: prod.name, 
                    themeName: theme?.name || 'Custom Blossom Design',
                    detail: detailStr, 
                    price: finalPrice, 
                    productIcon: previewImage,
                    bg: design.bgColor,
                    product: product,
                    mode: mode,
                    design: design,
                    selectedModel: selectedModel
                }]);
                showToast('Added to cart! 🎉');
                setPetals(true);
                setTimeout(() => setPetals(false), 3500);
            };
            const reset = () => {
                setPage('home'); setProd(null); setMode(null); setSelectedModel(null);
                setDesign({
                    bgColor: '#F8C8DC', textSize: 16, textColor: '#2A2A2A',
                    textPosition: 'Center', textLayout: 'Horizontal', textX: 0, textY: 0, textRotation: 0,
                    pattern: 'none', effect: 'none',
                    photoCount: 0, extraColorCount: 0, hasHandArt: false,
                    manualModel: ''
                });
            };

            useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);
            useGlobalReveal();

            return (
                <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--beige-soft)', overflowX: 'hidden' }}>
                    <div className="aura-glow" style={{ top: '-10%', left: '-10%', background: 'radial-gradient(circle, var(--pink-mid) 0%, transparent 70%)' }} />
                    <div className="aura-glow" style={{ bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, var(--lavender-mid) 0%, transparent 70%)', animationDelay: '-5s' }} />

                    {/* Background Petals (Falling Layer) — Moves behind the content */}
                    <Petals count={20} />
                    {petals && <Petals count={40} />}

                    {/* ─── ENTRY OVERLAY ─── */}
                    {overlayState !== 'hidden' && (
                        <div className={`entry-overlay${overlayState === 'hiding' ? ' hiding' : ''}`}>
                            <Petals count={35} />
                            <div className="landing-content">
                                <div className="entry-brand">Custom Blossom</div>
                                <div className="title-glow" style={{
                                    width: 400, height: 400,
                                    background: 'radial-gradient(circle, rgba(248,200,220,0.4) 0%, transparent 70%)',
                                    filter: 'blur(60px)',
                                    marginBottom: -200,
                                    zIndex: 0
                                }} />
                                <button className="entry-btn" onClick={handleEnter}>ENTER EXPERIENCE</button>
                            </div>
                        </div>
                    )}

                    {/* Content Layer (Foreground) — Higher z-index ensures clickable UI stays on top */}
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <Nav
                            onHome={reset}
                            cartCount={cart.length}
                            onCartOpen={() => setCartOpen(true)}
                            onStart={() => {
                                if (!user) return setAuthOpen(true);
                                if (!user.emailVerified) return setAuthOpen(true);
                                setPage('step1');
                            }}
                            onThemes={() => {
                                if (!user) return setAuthOpen(true);
                                if (!user.emailVerified) return setAuthOpen(true);
                                setPage('themes');
                            }}
                            user={user}
                            onLogout={handleLogout}
                            onLogin={() => setAuthOpen(true)}
                        />

                        {/* --- AUTH GATE MODAL --- */}
                        {authOpen && (
                            <AuthGate
                                onClose={() => setAuthOpen(false)}
                                onLogin={handleLogin}
                            />
                        )}

                        {/* --- PREMIUM UPGRADE MODAL --- */}
                        {upgradeOpen && (
                            <PremiumUpgradeModal
                                onClose={() => setUpgradeOpen(false)}
                                onUpgrade={handleUpgrade}
                            />
                        )}

                        <PageTransition active={isVisible}>
                            {page === 'home' && <HomePage
                                onStart={() => {
                                    if (!user) return setAuthOpen(true);
                                    if (!user.emailVerified) return setAuthOpen(true);
                                    setPage('step1');
                                }}
                                onThemeSelect={(theme) => {
                                    if (!user) return setAuthOpen(true);
                                    if (!user.emailVerified) return setAuthOpen(true);
                                    
                                    // If the theme comes from SCROLL_THEMES or THEMES, it might not have productDesigns
                                    // Default to phone and use accent/colors
                                    setProd('phone'); 
                                    setMode('easy');
                                    
                                    updateDesign({ 
                                        themeId: theme.id, 
                                        bgColor: theme.colors ? theme.colors[0] : (theme.accent || '#F8C8DC'),
                                        pattern: 'none'
                                    });
                                    setPage('preview');
                                }}
                            />}

                            {page === 'step1' && <ChooseProduct selected={product} onSelect={setProd} onNext={() => setPage('step2')} />}
                            {page === 'step2' && (
                                <ChooseMode
                                    selected={mode}

                                    onSelect={setMode}
                                    isPremium={isPremium}
                                    onUpgrade={() => setUpgradeOpen(true)}
                                    onNext={(m) => {
                                        const finalMode = m || mode;
                                        if (finalMode === 'pro') {
                                            setPage('model-select');
                                        } else {
                                            setPage('design');
                                        }
                                    }}
                                    onBack={() => setPage('step1')}
                                />
                            )}
                            {page === 'model-select' && (
                                <DeviceSelector 
                                    product={product}
                                    selected={selectedModel}
                                    onSelect={setSelectedModel}
                                    onNext={() => setPage('design')}
                                    onBack={() => setPage('step2')}
                                />
                            )}
                            {page === 'design' && mode === 'easy' && <EasyModeThemes product={product} design={design} onDesignChange={updateDesign} onNext={() => setPage('preview')} onBack={() => setPage('step2')} />}
                            {page === 'design' && mode === 'pro' && <ProMode product={product} selectedModel={selectedModel} design={design} onDesignChange={updateDesign} onNext={() => setPage('preview')} onBack={() => setPage('model-select')} />}
                            {page === 'themes' && (
                                <ThemesPage 
                                    onSelectTheme={theme => { 
                                        setProd(theme.selectedProduct || 'phone'); 
                                        setMode('easy'); 
                                        
                                        updateDesign({ 
                                            themeId: theme.id, 
                                            designId: theme.selectedDesign ? theme.selectedDesign.id : null,
                                            bgColor: theme.selectedDesign ? theme.selectedDesign.color : (theme.accent || '#F8C8DC'),
                                            img: theme.selectedDesign ? theme.selectedDesign.img : '',
                                            pattern: 'none'
                                        }); 
                                        setPage('preview'); 
                                    }} 
                                    onStart={() => setPage('step1')} 
                                />
                            )}
                            {page === 'checkout' && (
                                <CheckoutPage 
                                    cart={cart} 
                                    onPlaceOrder={() => { 
                                        setCart([]); 
                                        setPage('home'); 
                                        window.scrollTo(0,0);
                                    }} 
                                    onBack={() => setPage('home')} 
                                />
                            )}
                            {page === 'preview' && <FinalPreview product={product} selectedModel={selectedModel} mode={mode} design={design} onAddToCart={addToCart} onBack={() => setPage('design')} onReset={reset} />}
                        </PageTransition>
                        {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={i => setCart(c => c.filter((_, idx) => idx !== i))} onCheckout={() => setPage('checkout')} />}
                    </div>
                    {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
                </div>
            );
        }

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
