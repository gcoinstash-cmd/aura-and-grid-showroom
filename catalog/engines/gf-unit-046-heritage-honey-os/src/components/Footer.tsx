/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { templateData } from "../data/templateData";
import { Instagram, Facebook, Twitter, ArrowUp } from "lucide-react";
import { motion } from "motion/react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-bg pt-24 pb-12 px-6 text-text transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          {/* Logo & About */}
          <div className="md:col-span-4">
            <h2 className="text-4xl font-serif mb-6 text-brand-gold">{templateData.brand.name}</h2>
            <p className="text-text/50 max-w-sm mb-8 font-light italic leading-relaxed">
              {templateData.brand.description}
            </p>
            <div className="flex gap-6">
              {templateData.social.links.map((link) => (
                <motion.a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-text/40 hover:text-brand-burgundy transition-colors"
                >
                  {link.platform === "Instagram" && <Instagram size={20} />}
                  {link.platform === "Facebook" && <Facebook size={20} />}
                  {link.platform === "Twitter" && <Twitter size={20} />}
                </motion.a>
              ))}
            </div>

            {/* Instagram Feed Grid */}
            <div className="mt-12">
              <p className="editorial-subheader !text-brand-gold/40 mb-6 flex items-center gap-2">
                <span className="w-4 h-px bg-brand-gold/20" />
                Latest from {templateData.social.instagram}
              </p>
              <div className="grid grid-cols-3 gap-1.5 max-w-sm mb-6">
                {templateData.social.posts.map((post) => (
                  <motion.a
                    key={post.id}
                    href={`https://instagram.com/${templateData.social.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                    className="aspect-square overflow-hidden bg-border relative group"
                  >
                    <img 
                      src={post.image} 
                      alt="Instagram Post" 
                      className="w-full h-full object-cover grayscale-[60%] group-hover:grayscale-0 transition-all duration-700 brightness-[0.8] group-hover:brightness-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-brand-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.a>
                ))}
              </div>
              <motion.a
                href={`https://instagram.com/${templateData.social.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 4 }}
                className="inline-flex items-center gap-3 text-brand-gold hover:text-text transition-colors text-xs font-semibold tracking-wider uppercase tracking-[0.2em] font-bold"
              >
                Follow {templateData.social.instagram.toUpperCase()}
                <Instagram size={14} />
              </motion.a>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="md:col-span-4">
            <h4 className="editorial-subheader mb-10 opacity-60">Establishment</h4>
            <div className="space-y-8">
              <div>
                <p className="editorial-subheader !text-brand-gold/30 mb-2">Inquiry</p>
                <a href={`tel:${templateData.contact.phone}`} className="text-xl font-serif block hover:text-brand-gold transition-colors">{templateData.contact.phone}</a>
                <a href={`mailto:${templateData.contact.email}`} className="text-sm text-brand-gold/40 hover:text-brand-gold transition-colors italic">{templateData.contact.email}</a>
              </div>
              <div>
                <p className="editorial-subheader !text-brand-gold/30 mb-2">Location</p>
                <p className="text-xl font-serif">{templateData.contact.address}</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="md:col-span-4">
            <h4 className="editorial-subheader mb-10 opacity-60">Operating Hours</h4>
            <div className="space-y-5">
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span className="editorial-subheader !text-brand-gold/30">Mon - Thu</span>
                <span className="font-serif italic text-lg">{templateData.hours.monThu}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span className="editorial-subheader !text-brand-gold/30">Fri - Sat</span>
                <span className="font-serif italic text-lg">{templateData.hours.friSat}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border pb-4">
                <span className="editorial-subheader !text-brand-gold/30">Sun Brunch</span>
                <span className="font-serif italic text-lg">{templateData.hours.sunBrunch}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-brand-gold/20 text-xs font-semibold tracking-wider uppercase tracking-[0.5em] font-bold">
            © {new Date().getFullYear()} {templateData.brand.name}. Crafted for Modern Traditions.
          </p>
          
          <button 
            onClick={scrollToTop}
            className="group flex items-center gap-3 text-brand-gold/40 hover:text-text transition-colors uppercase tracking-[0.4em] text-base font-semibold min-h-[44px] font-semibold tracking-wider font-bold"
          >
            Back to Top
            <ArrowUp size={14} className="group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
