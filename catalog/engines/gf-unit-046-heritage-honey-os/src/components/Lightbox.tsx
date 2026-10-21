/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface LightboxProps {
  image: string | null;
  onClose: () => void;
}

export default function Lightbox({ image, onClose }: LightboxProps) {
  return (
    <AnimatePresence>
      {image && (
        <motion.div
          id="lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-brand-charcoal/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
        >
          <motion.button
            id="lightbox-close"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-6 right-6 text-brand-gold hover:text-brand-cream transition-colors p-2"
          >
            <X size={32} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-7xl max-h-[90vh] overflow-hidden rounded-sm"
          >
            <img
              src={image}
              alt="Zoomed view"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
