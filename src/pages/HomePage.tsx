import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, Truck, Clock } from 'lucide-react';
import Hero from '../components/home/Hero';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CategoryPreview from '../components/home/CategoryPreview';
import Newsletter from '../components/shared/Newsletter';
import { useLanguage } from '../context/LanguageContext';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  
  const categories = [
    {
      id: 'power-tools',
      name: 'Power Tools',
      description: 'Professional-grade power tools for every job',
      image: 'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg',
      link: '/catalog/power-tools',
    },
    {
      id: 'safety-equipment',
      name: 'Safety Equipment',
      description: 'Complete range of safety gear and equipment',
      image: 'https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg',
      link: '/catalog/safety-equipment',
    },
    {
      id: 'industrial-equipment',
      name: 'Industrial Equipment',
      description: 'Heavy-duty machinery and industrial supplies',
      image: 'https://images.pexels.com/photos/210881/pexels-photo-210881.jpeg',
      link: '/catalog/industrial-equipment',
    },
  ];

  const features = [
    {
      icon: Wrench,
      title: t('home.services.repair'),
      description: t('home.services.repairDesc'),
    },
    {
      icon: Truck,
      title: t('home.services.bulk'),
      description: t('home.services.bulkDesc'),
    },
    {
      icon: Clock,
      title: t('home.services.support'),
      description: t('home.services.supportDesc'),
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      <Hero />

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold dark:text-white">{t('home.sections.newArrivals')}</h2>
          <Link
            to="/catalog/new"
            className="flex items-center text-primary-600 hover:text-primary-700 transition dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('home.sections.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <FeaturedProducts category="new" />
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 dark:text-white">{t('home.sections.categories')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryPreview key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">{t('home.sections.services')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
              Complete solutions for your industrial and professional needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-800 transition">
                      <IconComponent className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold dark:text-white">{t('home.sections.featured')}</h2>
          <Link
            to="/catalog/featured"
            className="flex items-center text-primary-600 hover:text-primary-700 transition dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('home.sections.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <FeaturedProducts category="featured" />
      </section>

      {/* Special Offers */}
      <section className="bg-accent-50 py-16 dark:bg-accent-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">{t('home.sections.sale')}</h2>
              <p className="text-lg mb-6 dark:text-gray-300">{t('home.sections.saleDescription')}</p>
              <Link
                to="/catalog/sale"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 transition dark:bg-accent-700 dark:hover:bg-accent-600"
              >
                {t('home.sections.shopNow')}
              </Link>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://images.pexels.com/photos/4489794/pexels-photo-4489794.jpeg"
                alt="Professional Tools Sale"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
};

export default HomePage;