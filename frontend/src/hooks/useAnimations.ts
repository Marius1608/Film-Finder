import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAnimation, useScroll, useTransform } from 'framer-motion';

export const useFadeInWhenVisible = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return {
    ref,
    controls,
    initial: "hidden",
    animate: controls,
    variants: {
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      hidden: { opacity: 0, y: 20 }
    }
  };
};

export const useParallax = (offset: number = 50) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return { ref, y };
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

export const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const slideInLeft = {
  hidden: { x: -60, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const slideInRight = {
  hidden: { x: 60, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export const hoverGlow = {
  boxShadow: "0 0 25px rgba(59, 130, 246, 0.5)",
  transition: { duration: 0.2 }
};

export const hoverRotate = {
  rotate: 5,
  scale: 1.05,
  transition: { duration: 0.2 }
};

// Smooth scroll hook
export const useSmoothScroll = () => {
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return { scrollToElement };
};

// Movie card animation
export const movieCardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    rotateY: -180
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.05,
    y: -10,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

// Loading skeleton animation
export const shimmer = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear"
    }
  }
};

// Page transition animations
export const pageTransition = {
  initial: { opacity: 0, x: -200 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 200 },
  transition: { duration: 0.3 }
};

// Text animations
export const typewriterVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.1,
    }
  })
};

// Floating animation
export const floating = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Gradient animation
export const gradientAnimation = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// 3D card flip
export const flipCard = {
  initial: { rotateY: 0 },
  flipped: { 
    rotateY: 180,
    transition: { duration: 0.6 }
  }
};

// Notification animation
export const notificationSlide = {
  initial: { x: 300, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 300, opacity: 0 },
  transition: { type: "spring", stiffness: 400, damping: 30 }
};