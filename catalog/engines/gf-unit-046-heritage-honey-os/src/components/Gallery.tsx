/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { templateData } from "../data/templateData";
import Lightbox from "./Lightbox";

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    { url: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Intimate Dining Setting" },
    { url: "https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Cinematic Bar Detail" },
    { url: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Modern Bar Ambiance" },
    { url: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Culinary Detail" }
  ];

  return (
    <section id="gallery" className="py-2 bg-bg transition-colors duration-500">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {images.map((item, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1, delay: index * 0.1 }}
               className="aspect-square overflow-hidden group relative cursor-zoom-in"
               onClick={() => setSelectedImage(item.url)}
             >
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] sepia-[.3] brightness-[0.8] group-hover:sepia-0 group-hover:grayscale-0 group-hover:brightness-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.6)_100%)] pointer-events-none opacity-80 group-hover:opacity-40 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-bg/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                   <p className="editorial-subheader !text-[8px] border border-brand-gold/30 px-4 py-2">{templateData.brand.name}</p>
                </div>
             </motion.div>
          ))}
       </div>
       <Lightbox image={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}
