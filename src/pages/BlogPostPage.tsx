import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { sampleBlogPosts } from './BlogPage';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { NotFoundPage } from './NotFoundPage';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useShop();

  const post = sampleBlogPosts.find((p) => p.slug === slug || p.id === slug);

  if (!post) {
    return <NotFoundPage />;
  }

  const title = language === 'ta' ? post.title_ta : post.title_en;
  const content = language === 'ta' ? post.content_ta : post.content_en;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    image: [post.image],
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'NIRAI Handloom Silks',
      logo: {
        '@type': 'ImageObject',
        url: 'https://niraifashions.vercel.app/favicon.svg',
      },
    },
    description: language === 'ta' ? post.excerpt_ta : post.excerpt_en,
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1012]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />

      <Breadcrumbs
        items={[
          { label: language === 'ta' ? 'வலைப்பதிவு' : 'Weaver Blog', path: '/blog' },
          { label: title },
        ]}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A0E17] hover:text-[#D4AF37] transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ta' ? 'அனைத்து கட்டுரைகளுக்கும் திரும்புக' : 'Back to Blog Directory'}</span>
        </Link>

        <header className="mb-8">
          <span className="inline-block px-3 py-1 rounded-md bg-[#4A0E17] text-[#F4E8C1] text-xs font-bold uppercase tracking-wider mb-3">
            {post.category}
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-extrabold text-[#2D1619] leading-tight">
            {title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-[#8A7B7E] mt-4 pb-6 border-b border-amber-900/10">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              {post.author}
            </span>
            <span>• {post.readTime}</span>
          </div>
        </header>

        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg max-h-[450px]">
          <img src={post.image} alt={title} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-amber max-w-none font-sans text-sm sm:text-base text-[#3D2024] leading-relaxed space-y-6">
          <p className="text-base sm:text-lg font-medium text-[#2D1619] leading-relaxed bg-[#F4E8C1]/20 p-4 rounded-xl border-l-4 border-[#4A0E17]">
            {language === 'ta' ? post.excerpt_ta : post.excerpt_en}
          </p>

          <div className="whitespace-pre-line">{content}</div>
        </div>

        {/* Share & Call to Action */}
        <div className="mt-12 pt-6 border-t border-amber-900/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm">
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#2D1619]">
              {language === 'ta' ? 'தூய பட்டுச் சேலைகளை கண்டறியுங்கள்' : 'Explore Authentic Handloom Silk Collections'}
            </h3>
            <p className="text-xs text-[#5C4A4D] mt-0.5">
              {language === 'ta' ? 'நேரடியாக நெசவாளர்களிடமிருந்து சேலைகளை வாங்குங்கள்.' : 'Directly from Salem & Kanchipuram master weavers.'}
            </p>
          </div>
          <Link
            to="/catalog"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4A0E17] to-[#2D1619] text-[#F4E8C1] font-bold text-xs hover:from-[#60131E] hover:to-[#4A0E17] transition shadow-md whitespace-nowrap"
          >
            {language === 'ta' ? 'சேலைகளைப் பாருங்கள்' : 'Shop Handloom Sarees'}
          </Link>
        </div>
      </article>
    </div>
  );
};
