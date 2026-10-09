import React from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_ta: string;
  excerpt_en: string;
  excerpt_ta: string;
  content_en: string;
  content_ta: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

export const sampleBlogPosts: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'kanchipuram-silk-saree-buying-guide',
    title_en: 'The Ultimate Guide to Buying Authentic Kanchipuram Silk Sarees',
    title_ta: 'உண்மையான காஞ்சிபுரம் பட்டுப் புடவைகளை வாங்குவதற்கான சிறந்த வழிகாட்டி',
    excerpt_en: 'Discover how to identify genuine 3-ply mulberry silk, test real zari with silk mark certification, and choose traditional Korvai weaving patterns.',
    excerpt_ta: 'தூய 3-பிளை மல்பெரி பட்டு, சில்க் மார்க் சான்றிதழுடன் கூடிய மெய்யான ஜரி மற்றும் பாரம்பரிய கோர்வை நெசவு முறைகளை கண்டறியுங்கள்.',
    content_en: `Kanchipuram silk sarees represent the pinnacle of South Indian weaving heritage. Known as the 'Queen of Silks', a genuine Kanjivaram saree is woven using three single threads of silk twisted together with pure silver Zari dipped in 24k gold.

### 1. The Korvai Weaving Technique
In authentic Kanjivaram sarees, the body and border are woven separately and then joined together in a zigzag joint called Korvai. If the joint tears before the fabric does, it is genuine Korvai weaving!

### 2. Silk Mark Certification
Always look for the Silk Mark label authorized by the Silk Mark Organisation of India (SMOI), guaranteeing 100% natural Mulberry silk.

### 3. Zari Authenticity
Pure Zari contains a core of silk thread wrapped with silver foil and plated with gold. Burning a small Zari thread reveals red silk inside with a silver shine.`,
    content_ta: `காஞ்சிபுரம் பட்டுப் புடவைகள் தென்னிந்திய நெசவு பாரம்பரியத்தின் சிகரமாகும். 'பட்டுக்களின் ராணி' என்று அழைக்கப்படும் உண்மையான காஞ்சிபுரம் சேலை, 24k தங்கத்தில் தோய்க்கப்பட்ட தூய வெள்ளி ஜரியுடன் மூன்று ஒற்றைப் பட்டு நூல்களைப் முறுக்கி நெய்யப்படுகிறது.`,
    author: 'Ramanathan Weavers Guild',
    date: '2026-10-01',
    readTime: '5 min read',
    category: 'Heritage & Weaving',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'post-2',
    slug: 'elampillai-soft-silks-lightweight-elegance',
    title_en: 'Why Elampillai Soft Silks Are India’s Favorite Festive Choice',
    title_ta: 'ஏன் இளம்பிள்ளை சாஃப்ட் சில்க்ஸ் இந்தியாவின் சிறந்த திருவிழா தேர்வாக உள்ளது?',
    excerpt_en: 'Explore the history of Salem Elampillai handlooms, lightweight touch, soft drapes, and affordable zari motifs for celebrations.',
    excerpt_ta: 'சேலம் இளம்பிள்ளை கைத்தறியின் வரலாறு, இலகுரக தொடுதல் மற்றும் மலிவு விலையில் ஜரி உருவங்களின் சிறப்பம்சங்கள்.',
    content_en: 'Elampillai soft silk sarees from Salem district combine the luster of silk with lightweight comfort, making them perfect for long wedding receptions and temple visits.',
    content_ta: 'சேலம் மாவட்டத்தின் இளம்பிள்ளை சாஃப்ட் சில்க் சேலைகள் பட்டின் பளபளப்பையும் இலகுரக வசதியையும் இணைக்கின்றன.',
    author: 'NIRAI Fashion Editorial',
    date: '2026-09-25',
    readTime: '4 min read',
    category: 'Trends & Styling',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'post-3',
    slug: 'how-to-care-for-pure-silk-sarees',
    title_en: 'How to Care for Pure Silk Sarees: Storage & Washing Tips',
    title_ta: 'தூய பட்டுப் புடவைகளை பராமரிப்பது எப்படி: சேமிப்பு & துவைக்கும் குறிப்புகள்',
    excerpt_en: 'Extend the lifespan of your heirloom sarees with muslin cloth wrapping, silica gel packets, dry cleaning guidelines, and fold rotations.',
    excerpt_ta: 'மஸ்லின் துணி மடக்குதல், சிலிக்கா ஜெல் பாக்கெட்டுகள் மற்றும் உலர் சலவை வழிகாட்டுதல்கள் மூலம் உங்கள் பாரம்பரிய சேலைகளின் ஆயுளை நீட்டிக்கவும்.',
    content_en: 'Proper maintenance keeps handloom silk sarees vibrant for generations. Never use harsh detergent; always dry clean heavy zari sarees and wrap them in breathable cotton or muslin bags.',
    content_ta: 'சரியான பராமரிப்பு கைத்தறி பட்டுப் புடவைகளை தலைமுறை தலைமுறையாக துடிப்பாக வைத்திருக்கிறது.',
    author: 'Care Specialist Team',
    date: '2026-09-15',
    readTime: '6 min read',
    category: 'Saree Maintenance',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
  }
];

export const BlogPage: React.FC = () => {
  const { language } = useShop();

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1012]">
      <Breadcrumbs items={[{ label: language === 'ta' ? 'வலைப்பதிவு' : 'Weaver Blog & Heritage' }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A0E17]/10 text-[#4A0E17] text-xs font-semibold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'பாரம்பரிய நெசவு கதைகள்' : 'NIRAI Journal & Silk Lore'}</span>
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D1619] tracking-tight">
            {language === 'ta' ? 'பட்டு நெசவு & பராமரிப்பு வழிகாட்டிகள்' : 'South Indian Handloom Heritage & Styling Guides'}
          </h1>
          <p className="mt-3 text-sm text-[#5C4A4D] font-sans">
            {language === 'ta'
              ? 'காஞ்சிபுரம், இளம்பிள்ளை பட்டு தயாரிப்பு மற்றும் சேலை பராமரிப்பு பற்றிய தகவல்களை அறிந்துகொள்ளுங்கள்.'
              : 'Discover expert guides on identifying pure Kanchipuram silk, drape styling, zari testing, and preserving heirloom sarees.'}
          </p>
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleBlogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl border border-amber-900/10 shadow-md overflow-hidden flex flex-col hover:shadow-xl transition duration-300 group">
              <div className="relative h-52 overflow-hidden bg-[#2D1619]">
                <img
                  src={post.image}
                  alt={language === 'ta' ? post.title_ta : post.title_en}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <span className="absolute top-3 left-3 bg-[#4A0E17] text-[#F4E8C1] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
                  {post.category}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 text-xs text-[#8A7B7E] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {post.author}
                    </span>
                  </div>
                  <h2 className="font-serif-luxury text-lg font-bold text-[#2D1619] group-hover:text-[#4A0E17] transition line-clamp-2">
                    {language === 'ta' ? post.title_ta : post.title_en}
                  </h2>
                  <p className="mt-2 text-xs text-[#5C4A4D] line-clamp-3 leading-relaxed">
                    {language === 'ta' ? post.excerpt_ta : post.excerpt_en}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-amber-900/10 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8A7B7E]">{post.readTime}</span>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4A0E17] group-hover:text-[#D4AF37] transition"
                  >
                    <span>{language === 'ta' ? 'மேலும் படிக்க' : 'Read Article'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
